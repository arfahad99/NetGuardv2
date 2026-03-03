import boto3
import os
from dotenv import load_dotenv

load_dotenv()

try:
    print("Testing AWS Auth...")
    client = boto3.client('cognito-idp', 
        region_name=os.getenv('AWS_REGION', 'eu-west-1'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    res = client.list_user_pools(MaxResults=10)
    pools = res.get('UserPools', [])
    print("SUCCESS: Connected to AWS Cognito.")
    print(f"Found {len(pools)} existing User Pools.")
except Exception as e:
    print(f"FAILED: {str(e)}")
