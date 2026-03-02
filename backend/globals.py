import boto3
from boto3.dynamodb.conditions import Key, Attr
from dotenv import load_dotenv
import os
import uuid
import json
from decimal import Decimal

SECRET_KEY = "qos@99"

load_dotenv()

# DynamoDB resource (shared)
dynamodb = boto3.resource(
    'dynamodb',
    region_name       = os.getenv('AWS_REGION', 'eu-west-1'),
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID', 'dummy'),
    aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY', 'dummy')
)

measurements_table = dynamodb.Table(
    os.getenv('DYNAMO_TABLE', 'NetworkMeasurements')
)


# ---------- helpers ----------------------------------------------------------

def _to_decimal(obj):
    """Convert floats to Decimal for DynamoDB, recursively."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_decimal(i) for i in obj]
    if isinstance(obj, bytes):
        # bcrypt hashes — store as string
        return obj.decode('utf-8')
    return obj


def _from_decimal(obj):
    """Convert Decimal back to float/int for JSON serialization."""
    if isinstance(obj, Decimal):
        if obj == int(obj):
            return int(obj)
        return float(obj)
    if isinstance(obj, dict):
        return {k: _from_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_from_decimal(i) for i in obj]
    return obj


# ---------- Result wrappers (mimic pymongo) ----------------------------------

class InsertOneResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, modified_count):
        self.modified_count = modified_count


class DeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count


class DynamoCursor:
    """Iterable cursor that mimics pymongo cursor with skip/limit."""
    def __init__(self, items):
        self._items = items
        self._skip = 0
        self._limit = None

    def skip(self, n):
        self._skip = n
        return self

    def limit(self, n):
        self._limit = n
        return self

    def __iter__(self):
        sliced = self._items[self._skip:]
        if self._limit:
            sliced = sliced[:self._limit]
        for item in sliced:
            yield _from_decimal(item)


# ---------- DynamoWrapper – drop-in replacement for MongoWrapper -------------

class DynamoWrapper:
    """
    Wraps a single DynamoDB table and exposes an API compatible with the
    existing MongoWrapper so that blueprint code doesn't need to change.
    """

    def __init__(self, table_name):
        self.table = dynamodb.Table(table_name)
        self._table_name = table_name

    # -- find (scan) ----------------------------------------------------------

    def find(self, query=None, projection=None):
        """Scan / filter the table.  Returns a DynamoCursor."""
        if query and query != {}:
            # Build filter expression
            filter_expr = None
            expr_values = {}
            expr_names = {}
            idx = 0
            for key, val in query.items():
                if key == '_id':
                    key = '_id'
                if isinstance(val, dict):
                    # Handle $ne, $or etc. – simplified
                    if '$ne' in val:
                        cond = Attr(key).ne(val['$ne'])
                    else:
                        continue
                else:
                    cond = Attr(key).eq(val)
                filter_expr = cond if filter_expr is None else (filter_expr & cond)

            # Handle $or queries
            if '$or' in (query or {}):
                or_conds = []
                for sub in query['$or']:
                    for k2, v2 in sub.items():
                        or_conds.append(Attr(k2).eq(v2))
                if or_conds:
                    combined = or_conds[0]
                    for c in or_conds[1:]:
                        combined = combined | c
                    filter_expr = combined if filter_expr is None else (filter_expr & combined)

            if filter_expr:
                resp = self.table.scan(FilterExpression=filter_expr)
            else:
                resp = self.table.scan()
        else:
            resp = self.table.scan()

        items = resp.get('Items', [])
        # Handle pagination for large tables
        while 'LastEvaluatedKey' in resp:
            if query and query != {} and filter_expr:
                resp = self.table.scan(
                    FilterExpression=filter_expr,
                    ExclusiveStartKey=resp['LastEvaluatedKey']
                )
            else:
                resp = self.table.scan(ExclusiveStartKey=resp['LastEvaluatedKey'])
            items.extend(resp.get('Items', []))

        return DynamoCursor(items)

    # -- find_one -------------------------------------------------------------

    def find_one(self, query=None, projection=None):
        """Return first matching item or None."""
        if query and '_id' in query and isinstance(query['_id'], str):
            # Direct get by key
            resp = self.table.get_item(Key={'_id': query['_id']})
            item = resp.get('Item')
            return _from_decimal(item) if item else None

        # Otherwise scan with limit 1
        cursor = self.find(query)
        for item in cursor:
            return item
        return None

    # -- insert_one -----------------------------------------------------------

    def insert_one(self, doc):
        """Insert a document, auto-generating _id if missing."""
        doc = dict(doc)  # copy
        if '_id' not in doc:
            doc['_id'] = str(uuid.uuid4())
        doc = _to_decimal(doc)
        # Remove empty string values (DynamoDB doesn't allow them in some cases)
        doc = {k: v for k, v in doc.items() if v != ''}
        self.table.put_item(Item=doc)
        return InsertOneResult(doc['_id'])

    # -- update_one -----------------------------------------------------------

    def update_one(self, query, update_data):
        """
        Update a single item.
        Supports: {"$set": {field: value, ...}}
        """
        item = self.find_one(query)
        if item is None:
            return UpdateResult(0)

        item_id = item['_id']
        fields = update_data.get('$set', update_data)

        # Flatten nested dot-notation keys into the document
        update_expr_parts = []
        expr_attr_names = {}
        expr_attr_values = {}

        idx = 0
        for key, val in fields.items():
            if '.' in key:
                # DynamoDB doesn't support dot notation updates directly
                # We need to read, modify, and write back
                parts = key.split('.')
                # Get the full item, modify nested field, put back
                current = item
                for p in parts[:-1]:
                    if p not in current or not isinstance(current[p], dict):
                        current[p] = {}
                    current = current[p]
                current[parts[-1]] = val
                # We'll do a full put instead
                continue

            alias = f"#k{idx}"
            placeholder = f":v{idx}"
            expr_attr_names[alias] = key
            expr_attr_values[placeholder] = _to_decimal(val)
            update_expr_parts.append(f"{alias} = {placeholder}")
            idx += 1

        if '.' in str(fields):
            # Has nested updates – do full replace
            item.update({k: v for k, v in fields.items() if '.' not in k})
            # Apply nested updates to item
            for key, val in fields.items():
                if '.' in key:
                    parts = key.split('.')
                    current = item
                    for p in parts[:-1]:
                        if p not in current or not isinstance(current[p], dict):
                            current[p] = {}
                        current = current[p]
                    current[parts[-1]] = val
            item = _to_decimal(item)
            self.table.put_item(Item=item)
            return UpdateResult(1)

        if not update_expr_parts:
            return UpdateResult(0)

        update_expr = "SET " + ", ".join(update_expr_parts)

        try:
            self.table.update_item(
                Key={'_id': item_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_attr_names,
                ExpressionAttributeValues=expr_attr_values
            )
            return UpdateResult(1)
        except Exception:
            return UpdateResult(0)

    # -- delete_one -----------------------------------------------------------

    def delete_one(self, query):
        """Delete a single item matching the query."""
        item = self.find_one(query)
        if item is None:
            return DeleteResult(0)

        try:
            self.table.delete_item(Key={'_id': item['_id']})
            return DeleteResult(1)
        except Exception:
            return DeleteResult(0)


# ---------- Collection instances (same names as before) ----------------------

Registerd_users = DynamoWrapper('NPMDB_Users')
alerts          = DynamoWrapper('NPMDB_Alerts')
devices         = DynamoWrapper('NPMDB_Devices')
network_health  = DynamoWrapper('NPMDB_NetworkHealth')
qos_events      = DynamoWrapper('NPMDB_QosEvents')
sessions        = DynamoWrapper('NPMDB_Sessions')
blacklist       = DynamoWrapper('NPMDB_Blacklist')


# ---------- DBWrapper (same interface as before) -----------------------------

class DBWrapper:
    @property
    def Registerd_users(self): return Registerd_users
    @property
    def BlackList(self): return blacklist
    @property
    def devices(self): return devices
    @property
    def alerts(self): return alerts
    @property
    def network_health(self): return network_health
    @property
    def qos_events(self): return qos_events
    @property
    def sessions(self): return sessions

db = DBWrapper()
