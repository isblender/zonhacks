# backend/app/db/dynamodb_client.py
import boto3
from botocore.config import Config

config = Config(retries={'max_attempts': 10, 'mode': 'standard'})
dynamodb = boto3.resource('dynamodb', config=config)

# backend/app/db/repositories/user_repo.py
from db.dynamodb_client import dynamodb

class UserRepository:
    TABLE_NAME = "UsersTable"

    @classmethod
    def get_user(cls, user_id: str):
        table = dynamodb.Table(cls.TABLE_NAME)
        # TODO: fetch item
        return {}

    @classmethod
    def update_user(cls, user_id: str, data: dict):
        table = dynamodb.Table(cls.TABLE_NAME)
        # TODO: update item
        return {}