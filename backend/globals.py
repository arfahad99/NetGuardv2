import uuid
import decimal
import sys
import boto3
from boto3.dynamodb.conditions import Key

# SECRET for signing JWTs
SECRET_KEY = "qos@99"

# We will use boto3 resource
dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')

class DynamoCursor:
    def __init__(self, items, skip_val=0, limit_val=0):
        self.items = items
        self.skip_val = skip_val
        self.limit_val = limit_val

    def skip(self, amount):
        self.skip_val = amount
        return self

    def limit(self, amount):
        self.limit_val = amount
        return self

    def __iter__(self):
        end = self.skip_val + self.limit_val if self.limit_val else len(self.items)
        res = self.items[self.skip_val : end]
        return iter(res)

class DynamoCollection:
    def __init__(self, table_name):
        self.table = dynamodb.Table(table_name)
    
    def find(self, query=None, projection=None):
        query = query or {}
        try:
            # We use scan for MVP simplicity due to time constraint.
            response = self.table.scan()
            items = response.get('Items', [])
            
            filtered_items = []
            for item in items:
                match = True
                for k, v in query.items():
                    query_k = 'id' if k == '_id' else k
                    if item.get(query_k) != v:
                        match = False
                        break
                if match:
                    if "id" in item:
                        item["_id"] = item["id"]
                    filtered_items.append(self._unclean_floats(item))
                    
            return DynamoCursor(filtered_items)
        except Exception as e:
            print("DB Find Error:", str(e))
            return DynamoCursor([])

    def find_one(self, query=None, projection=None):
        items = list(self.find(query))
        if items:
            return items[0]
        return None
        
    def insert_one(self, doc):
        if "_id" not in doc:
            doc["id"] = str(uuid.uuid4())
        else:
            doc["id"] = str(doc.pop("_id"))
            
        clean_doc = self._clean_floats(doc)
        try:
            self.table.put_item(Item=clean_doc)
        except Exception as e:
            print("DB Insert Error:", str(e))
            raise e
            
        class Result:
            def __init__(self, id_val):
                self.inserted_id = id_val
        return Result(doc["id"])

    def update_one(self, query, update_data):
        item = self.find_one(query)
        if not item:
            class Result: modified_count = 0
            return Result()
            
        set_ops = update_data.get('$set', {})
        for k, v in set_ops.items():
            parts = k.split('.')
            d = item
            for part in parts[:-1]:
                if part not in d: d[part] = {}
                d = d[part]
            d[parts[-1]] = v
            
        if "_id" in item:
            item.pop("_id")
            
        clean_item = self._clean_floats(item)
        self.table.put_item(Item=clean_item)
        
        class Result: modified_count = 1
        return Result()

    def delete_one(self, query):
        item = self.find_one(query)
        if not item:
            class Result: deleted_count = 0
            return Result()
            
        self.table.delete_item(Key={'id': item['id']})
        
        class Result: deleted_count = 1
        return Result()

    def _clean_floats(self, obj):
        if isinstance(obj, float):
            return decimal.Decimal(str(obj))
        elif isinstance(obj, dict):
            return {k: self._clean_floats(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._clean_floats(v) for v in obj]
        return obj

    def _unclean_floats(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj) if '.' in str(obj) else int(obj)
        elif isinstance(obj, dict):
            return {k: self._unclean_floats(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._unclean_floats(v) for v in obj]
        return obj

class MockDB:
    def __init__(self):
        self.Registerd_users = DynamoCollection("NPMDB_Users")
        self.alerts = DynamoCollection("NPMDB_Alerts")
        self.devices = DynamoCollection("NPMDB_Devices")
        self.network_health = DynamoCollection("NPMDB_NetworkHealth")
        self.qos_events = DynamoCollection("NPMDB_QosEvents")
        self.sessions = DynamoCollection("NPMDB_Sessions")
        self.BlackList = DynamoCollection("NPMDB_Blacklist")

db = MockDB()

Registerd_users = db.Registerd_users
alerts = db.alerts
devices = db.devices
network_health = db.network_health
qos_events = db.qos_events
sessions = db.sessions

# Monkey patch ObjectId for the whole application so we don't have to rewrite imports
import sys
class MockBson:
    class ObjectId(str):
        def __new__(cls, value):
            return super().__new__(cls, value)

sys.modules['bson'] = MockBson()
