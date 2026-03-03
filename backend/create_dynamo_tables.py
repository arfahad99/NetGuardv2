# --------------------------------------------------------------------------
# DO I NEED THIS CODE? -> ONLY ONCE FOR INITIAL AWS SETUP
# WHY? -> This script was used to automatically generate the required 
# database tables in Amazon DynamoDB. You do NOT need to run this script 
# to start the backend, and the frontend never interacts with it.
# --------------------------------------------------------------------------
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

def create_tables():
    region = os.getenv('AWS_REGION', 'eu-west-1')
    dynamodb = boto3.client(
        'dynamodb',
        region_name=region,
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )

    # Standard tables (partition key = id)
    standard_tables = [
        "NPMDB_Users",
        "NPMDB_Alerts",
        "NPMDB_Devices",
        "NPMDB_NetworkHealth",
        "NPMDB_QosEvents",
        "NPMDB_Sessions",
        "NPMDB_Blacklist"
    ]

    for table_name in standard_tables:
        try:
            print(f"Creating table {table_name}...")
            dynamodb.create_table(
                TableName=table_name,
                KeySchema=[
                    {'AttributeName': 'id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'id', 'AttributeType': 'S'}
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            print(f"  ✓ {table_name} created.")
        except dynamodb.exceptions.ResourceInUseException:
            print(f"  ✓ {table_name} already exists.")
        except Exception as e:
            print(f"  ✗ Error creating {table_name}: {e}")

    # Probe measurements table (partition key = deviceId, sort key = timestamp)
    dynamo_table = os.getenv('DYNAMO_TABLE', 'NetworkMeasurements')
    try:
        print(f"Creating table {dynamo_table}...")
        dynamodb.create_table(
            TableName=dynamo_table,
            KeySchema=[
                {'AttributeName': 'deviceId',  'KeyType': 'HASH'},
                {'AttributeName': 'timestamp',  'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'deviceId',  'AttributeType': 'S'},
                {'AttributeName': 'timestamp', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"  ✓ {dynamo_table} created.")
    except dynamodb.exceptions.ResourceInUseException:
        print(f"  ✓ {dynamo_table} already exists.")
    except Exception as e:
        print(f"  ✗ Error creating {dynamo_table}: {e}")

    print("\nAll tables ready! You can now start the backend.")

if __name__ == "__main__":
    create_tables()
