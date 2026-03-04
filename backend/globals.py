"""
Global database initialization and configuration for NetGuardV2.
Provides a DynamoDB wrapper that behaves like PyMongo.
"""
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


# ---------- DynamoWrapper – drop-in replacement for MongoDB ------------------

class DynamoWrapper:
    """
    Wraps a single DynamoDB table and exposes an API compatible with
    pymongo so that blueprint code doesn't need to change.
    DynamoDB key = 'id', exposed as '_id' for MongoDB compat.
    """

    def __init__(self, table_name):
        self.table = dynamodb.Table(table_name)
        self._table_name = table_name

    # -- key mapping helpers --------------------------------------------------

    def _to_mongo(self, item):
        """DynamoDB item (id) -> MongoDB-style (_id)."""
        if item and 'id' in item:
            item['_id'] = item.pop('id')
        return item

    def _to_dynamo(self, doc):
        """MongoDB-style doc (_id) -> DynamoDB (id)."""
        doc = dict(doc)
        if '_id' in doc:
            doc['id'] = doc.pop('_id')
        return doc

    # -- find (scan) ----------------------------------------------------------

    def find(self, query=None, projection=None):
        query = dict(query) if query else {}
        # Remap _id -> id in query
        if '_id' in query:
            query['id'] = query.pop('_id')

        filter_expr = None

        # Handle $or
        if '$or' in query:
            or_conds = []
            for sub in query['$or']:
                for k, v in sub.items():
                    k = 'id' if k == '_id' else k
                    or_conds.append(Attr(k).eq(v))
            if or_conds:
                combined = or_conds[0]
                for c in or_conds[1:]:
                    combined = combined | c
                filter_expr = combined
            query = {k: v for k, v in query.items() if k != '$or'}

        for key, val in query.items():
            if isinstance(val, dict):
                if '$ne' in val:
                    cond = Attr(key).ne(val['$ne'])
                else:
                    continue
            else:
                cond = Attr(key).eq(val)
            filter_expr = cond if filter_expr is None else (filter_expr & cond)

        kwargs = {}
        if filter_expr:
            kwargs['FilterExpression'] = filter_expr

        resp = self.table.scan(**kwargs)
        items = resp.get('Items', [])
        while 'LastEvaluatedKey' in resp:
            kwargs['ExclusiveStartKey'] = resp['LastEvaluatedKey']
            resp = self.table.scan(**kwargs)
            items.extend(resp.get('Items', []))

        items = [self._to_mongo(dict(item)) for item in items]
        return DynamoCursor(items)

    # -- find_one -------------------------------------------------------------

    def find_one(self, query=None, projection=None):
        query = dict(query) if query else {}
        if '_id' in query:
            query['id'] = query.pop('_id')

        # Direct get if only querying by id
        if 'id' in query and isinstance(query['id'], str) and len(query) == 1:
            resp = self.table.get_item(Key={'id': query['id']})
            item = resp.get('Item')
            if item:
                return _from_decimal(self._to_mongo(dict(item)))
            return None

        # Otherwise scan
        # Remap id back to _id for find()
        if 'id' in query:
            query['_id'] = query.pop('id')
        cursor = self.find(query)
        for item in cursor:
            return item
        return None

    # -- insert_one -----------------------------------------------------------

    def insert_one(self, doc):
        doc = dict(doc)
        generated_id = str(uuid.uuid4())
        if '_id' not in doc and 'id' not in doc:
            doc['_id'] = generated_id
        doc = self._to_dynamo(doc)
        doc = _to_decimal(doc)
        # Remove empty strings (DynamoDB doesn't allow them as key values)
        cleaned = {}
        for k, v in doc.items():
            if v == '' and k != 'id':
                continue
            if v is None:
                continue
            cleaned[k] = v
        doc = cleaned
        if 'id' not in doc:
            doc['id'] = generated_id
        self.table.put_item(Item=doc)
        return InsertOneResult(doc['id'])

    # -- update_one -----------------------------------------------------------

    def update_one(self, query, update_data):
        item = self.find_one(query)
        if item is None:
            return UpdateResult(0)

        item_id = item['_id']
        fields = update_data.get('$set', update_data)

        for key, val in fields.items():
            if '.' in key:
                parts = key.split('.')
                current = item
                for p in parts[:-1]:
                    if p not in current or not isinstance(current[p], dict):
                        current[p] = {}
                    current = current[p]
                current[parts[-1]] = val
            else:
                item[key] = val

        dynamo_item = self._to_dynamo(item)
        dynamo_item = _to_decimal(dynamo_item)
        dynamo_item = {k: v for k, v in dynamo_item.items() if v is not None}
        if 'id' not in dynamo_item:
            dynamo_item['id'] = item_id
        self.table.put_item(Item=dynamo_item)
        return UpdateResult(1)

    # -- delete_one -----------------------------------------------------------

    def delete_one(self, query):
        item = self.find_one(query)
        if item is None:
            return DeleteResult(0)
        try:
            self.table.delete_item(Key={'id': item['_id']})
            return DeleteResult(1)
        except Exception:
            return DeleteResult(0)


# ---------- Collection instances ---------------------------------------------

Registerd_users = DynamoWrapper('NPMDB_Users')
alerts          = DynamoWrapper('NPMDB_Alerts')
devices         = DynamoWrapper('NPMDB_Devices')
network_health  = DynamoWrapper('NPMDB_NetworkHealth')
qos_events      = DynamoWrapper('NPMDB_QosEvents')
sessions        = DynamoWrapper('NPMDB_Sessions')
blacklist       = DynamoWrapper('NPMDB_Blacklist')


# ---------- DBWrapper --------------------------------------------------------

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
