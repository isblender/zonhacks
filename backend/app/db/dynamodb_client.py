# backend/app/db/dynamodb_client.py
import boto3
from botocore.config import Config

config = Config(retries={'max_attempts': 10, 'mode': 'standard'})
dynamodb = boto3.resource('dynamodb', config=config)
