# backend/app/db/repositories/listing_repo.py
from app.db.dynamodb_client import dynamodb
from datetime import datetime
import uuid
from typing import Dict, List, Optional

class ListingRepository:
    TABLE_NAME = "Listings"

    @classmethod
    def create_listing(cls, data: dict, user_id: str) -> dict:
        """Create a new listing associated with a user"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        listing_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        listing_item = {
            "listingId": listing_id,
            "userId": user_id,  # Associate with creator
            "title": data.get("title"),
            "description": data.get("description"),
            "category": data.get("category"),
            "size": data.get("size"),
            "condition": data.get("condition"),
            "images": data.get("images", []),
            "zipCode": data.get("zipCode"),
            "location": data.get("location", {}),
            "status": "active",
            "createdAt": timestamp,
            "updatedAt": timestamp,
            "tags": data.get("tags", [])
        }
        
        table.put_item(Item=listing_item)
        return listing_item

    @classmethod
    def get_listing(cls, listing_id: str) -> Optional[dict]:
        """Get a single listing by ID"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        response = table.get_item(Key={"listingId": listing_id})
        return response.get("Item")

    @classmethod
    def get_listings_by_user(cls, user_id: str) -> List[dict]:
        """Get all listings created by a specific user"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        response = table.query(
            IndexName="UserListingsIndex",
            KeyConditionExpression="userId = :user_id",
            ExpressionAttributeValues={":user_id": user_id},
            ScanIndexForward=False  # Most recent first
        )
        return response.get("Items", [])

    @classmethod
    def get_listings_by_zip(cls, zip_code: str, size: str = None, category: str = None) -> List[dict]:
        """Get listings by zip code with optional filters"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        # Base query by zip code
        key_condition = "zipCode = :zip_code"
        expression_values = {":zip_code": zip_code}
        
        # Add filters if provided
        filter_expressions = []
        if size:
            filter_expressions.append("#size = :size")
            expression_values[":size"] = size
        if category:
            filter_expressions.append("category = :category")
            expression_values[":category"] = category
        
        query_params = {
            "IndexName": "ZipCodeIndex",
            "KeyConditionExpression": key_condition,
            "ExpressionAttributeValues": expression_values,
            "ScanIndexForward": False
        }
        
        if filter_expressions:
            query_params["FilterExpression"] = " AND ".join(filter_expressions)
            if size:  # size is a reserved keyword
                query_params["ExpressionAttributeNames"] = {"#size": "size"}
        
        response = table.query(**query_params)
        return response.get("Items", [])

    @classmethod
    def update_listing(cls, listing_id: str, data: dict, user_id: str) -> Optional[dict]:
        """Update a listing (only if user owns it)"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        # First verify the user owns this listing
        existing = cls.get_listing(listing_id)
        if not existing or existing.get("userId") != user_id:
            return None
        
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Build update expression
        update_expression = "SET updatedAt = :timestamp"
        expression_values = {":timestamp": timestamp}
        
        # Add fields to update
        if "title" in data:
            update_expression += ", title = :title"
            expression_values[":title"] = data["title"]
        if "description" in data:
            update_expression += ", description = :description"
            expression_values[":description"] = data["description"]
        if "category" in data:
            update_expression += ", category = :category"
            expression_values[":category"] = data["category"]
        if "size" in data:
            update_expression += ", #size = :size"
            expression_values[":size"] = data["size"]
        if "condition" in data:
            update_expression += ", condition = :condition"
            expression_values[":condition"] = data["condition"]
        if "images" in data:
            update_expression += ", images = :images"
            expression_values[":images"] = data["images"]
        if "status" in data:
            update_expression += ", status = :status"
            expression_values[":status"] = data["status"]
        if "tags" in data:
            update_expression += ", tags = :tags"
            expression_values[":tags"] = data["tags"]
        
        update_params = {
            "Key": {"listingId": listing_id},
            "UpdateExpression": update_expression,
            "ExpressionAttributeValues": expression_values,
            "ReturnValues": "ALL_NEW"
        }
        
        if "size" in data:
            update_params["ExpressionAttributeNames"] = {"#size": "size"}
        
        response = table.update_item(**update_params)
        return response.get("Attributes")

    @classmethod
    def delete_listing(cls, listing_id: str, user_id: str) -> bool:
        """Delete a listing (only if user owns it)"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        # First verify the user owns this listing
        existing = cls.get_listing(listing_id)
        if not existing or existing.get("userId") != user_id:
            return False
        
        table.delete_item(Key={"listingId": listing_id})
        return True
