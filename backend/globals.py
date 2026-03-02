from pymongo import MongoClient
import boto3
from dotenv import load_dotenv
import os
from bson import ObjectId

SECRET_KEY = "qos@99"

load_dotenv()
client = MongoClient("mongodb://localhost:27017/")
db_client = client.NPMDB

class MongoWrapper:
    def __init__(self, coll):
        self.coll = coll
        
    def _convert_id(self, query):
        if query and '_id' in query and isinstance(query['_id'], str):
            try:
                query['_id'] = ObjectId(query['_id'])
            except:
                pass
        return query
        
    def find(self, query=None, projection=None):
        if projection is None:
            return self.coll.find(self._convert_id(query))
        return self.coll.find(self._convert_id(query), projection)
        
    def find_one(self, query=None, projection=None):
        if projection is None:
            return self.coll.find_one(self._convert_id(query))
        return self.coll.find_one(self._convert_id(query), projection)
        
    def insert_one(self, doc):
        return self.coll.insert_one(doc)
        
    def update_one(self, query, update_data):
        return self.coll.update_one(self._convert_id(query), update_data)
        
    def delete_one(self, query):
        return self.coll.delete_one(self._convert_id(query))

Registerd_users = MongoWrapper(db_client.Registerd_users)
alerts = MongoWrapper(db_client.alerts)
devices = MongoWrapper(db_client.devices)
network_health = MongoWrapper(db_client.network_health)
qos_events = MongoWrapper(db_client.qos_events)
sessions = MongoWrapper(db_client.sessions)
blacklist = MongoWrapper(db_client.BlackList)

# DynamoDB specifically for probe measurements
dynamodb = boto3.resource(
    'dynamodb',
    region_name       = os.getenv('AWS_REGION', 'eu-west-1'),
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID', 'dummy'),
    aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY', 'dummy')
)
measurements_table = dynamodb.Table(
    os.getenv('DYNAMO_TABLE', 'NetworkMeasurements')
)

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
