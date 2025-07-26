# backend/app/db/repositories/listing_repo.py
from db.dynamodb_client import dynamodb

class ListingRepository:
    TABLE_NAME = "ListingsTable"

    @classmethod
    def create_listing(cls, data: dict):
        table = dynamodb.Table(cls.TABLE_NAME)
        # TODO: put item
        return {}

    @classmethod
    def get_listing(cls, listing_id: str):
        table = dynamodb.Table(cls.TABLE_NAME)
        # TODO: get item
        return {}