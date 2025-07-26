# backend/app/db/repositories/user_repo.py
from app.db.dynamodb_client import dynamodb
from datetime import datetime
from typing import Dict, Optional
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

class UserRepository:
    TABLE_NAME = "Users"

    @classmethod
    def create_user(cls, user_data: dict) -> dict:
        """Create a new user profile"""
        try:
            table = dynamodb.Table(cls.TABLE_NAME)
            
            timestamp = datetime.utcnow().isoformat() + "Z"
            
            user_item = {
                "userId": user_data.get("userId"),  # From Cognito sub
                "email": user_data.get("email"),
                "firstName": user_data.get("firstName"),
                "lastName": user_data.get("lastName"),
                "phone": user_data.get("phone", ""),
                "address": user_data.get("address", {}),
                "profileImageUrl": user_data.get("profileImageUrl", ""),
                "createdAt": timestamp,
                "updatedAt": timestamp,
                "isActive": True
            }
            
            table.put_item(Item=user_item)
            logger.info(f"Created user: {user_item['userId']}")
            return user_item
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ConditionalCheckFailedException':
                logger.error(f"User {user_data.get('userId')} already exists")
                raise ValueError(f"User {user_data.get('userId')} already exists")
            elif error_code == 'ResourceNotFoundException':
                logger.error(f"Table {cls.TABLE_NAME} not found")
                raise ValueError(f"Table {cls.TABLE_NAME} does not exist")
            else:
                logger.error(f"Error creating user: {e}")
                raise Exception(f"Failed to create user: {e}")
        except Exception as e:
            logger.error(f"Unexpected error creating user: {e}")
            raise Exception(f"Failed to create user: {e}")

    @classmethod
    def get_user(cls, user_id: str) -> Optional[dict]:
        """Get a user profile by ID"""
        try:
            table = dynamodb.Table(cls.TABLE_NAME)
            response = table.get_item(Key={"userId": user_id})
            return response.get("Item")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                logger.error(f"Table {cls.TABLE_NAME} not found")
                raise ValueError(f"Table {cls.TABLE_NAME} does not exist")
            else:
                logger.error(f"Error getting user {user_id}: {e}")
                raise Exception(f"Failed to get user: {e}")
        except Exception as e:
            logger.error(f"Unexpected error getting user {user_id}: {e}")
            raise Exception(f"Failed to get user: {e}")

    @classmethod
    def update_user(cls, user_id: str, data: dict) -> Optional[dict]:
        """Update a user profile"""
        try:
            table = dynamodb.Table(cls.TABLE_NAME)
            
            # Check if user exists
            existing = cls.get_user(user_id)
            if not existing:
                return None
            
            timestamp = datetime.utcnow().isoformat() + "Z"
            
            # Build update expression
            update_expression = "SET updatedAt = :timestamp"
            expression_values = {":timestamp": timestamp}
            
            # Add fields to update
            if "firstName" in data:
                update_expression += ", firstName = :first_name"
                expression_values[":first_name"] = data["firstName"]
            if "lastName" in data:
                update_expression += ", lastName = :last_name"
                expression_values[":last_name"] = data["lastName"]
            if "phone" in data:
                update_expression += ", phone = :phone"
                expression_values[":phone"] = data["phone"]
            if "address" in data:
                update_expression += ", address = :address"
                expression_values[":address"] = data["address"]
            if "profileImageUrl" in data:
                update_expression += ", profileImageUrl = :profile_image_url"
                expression_values[":profile_image_url"] = data["profileImageUrl"]
            if "isActive" in data:
                update_expression += ", isActive = :is_active"
                expression_values[":is_active"] = data["isActive"]
            
            response = table.update_item(
                Key={"userId": user_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values,
                ReturnValues="ALL_NEW"
            )
            
            logger.info(f"Updated user: {user_id}")
            return response.get("Attributes")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                logger.error(f"Table {cls.TABLE_NAME} not found")
                raise ValueError(f"Table {cls.TABLE_NAME} does not exist")
            else:
                logger.error(f"Error updating user {user_id}: {e}")
                raise Exception(f"Failed to update user: {e}")
        except Exception as e:
            logger.error(f"Unexpected error updating user {user_id}: {e}")
            raise Exception(f"Failed to update user: {e}")

    @classmethod
    def get_user_public_profile(cls, user_id: str) -> Optional[dict]:
        """Get public user profile (limited fields for privacy)"""
        user = cls.get_user(user_id)
        if not user:
            return None
        
        # Return only public fields
        return {
            "userId": user.get("userId"),
            "firstName": user.get("firstName"),
            "lastName": user.get("lastName"),
            "profileImageUrl": user.get("profileImageUrl"),
            "location": {
                "city": user.get("address", {}).get("city"),
                "state": user.get("address", {}).get("state")
            }
        }

    @classmethod
    def deactivate_user(cls, user_id: str) -> bool:
        """Deactivate a user account"""
        result = cls.update_user(user_id, {"isActive": False})
        return result is not None
