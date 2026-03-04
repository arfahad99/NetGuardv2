from dotenv import load_dotenv
import os
load_dotenv()
print("CLIENT_ID:", repr(os.getenv("COGNITO_CLIENT_ID")))
