import boto3
import time

def create_tables():
    dynamodb = boto3.client('dynamodb', region_name='eu-west-1')
    
    tables = [
        "NPMDB_Users",
        "NPMDB_Alerts",
        "NPMDB_Devices",
        "NPMDB_NetworkHealth",
        "NPMDB_QosEvents",
        "NPMDB_Sessions",
        "NPMDB_Blacklist"
    ]
    
    for table_name in tables:
        try:
            print(f"Creating table {table_name}...")
            response = dynamodb.create_table(
                TableName=table_name,
                KeySchema=[
                    {
                        'AttributeName': 'id',
                        'KeyType': 'HASH'  # Partition key
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'id',
                        'AttributeType': 'S' # String
                    }
                ],
                BillingMode='PAY_PER_REQUEST' # Free tier friendly
            )
            print(f"Table {table_name} creation initiated.")
        except dynamodb.exceptions.ResourceInUseException:
            print(f"Table {table_name} already exists.")
        except Exception as e:
            print(f"Error creating {table_name}: {e}")

    print("\nPlease wait a minute for tables to become active.")

if __name__ == "__main__":
    create_tables()
