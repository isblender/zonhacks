# backend/app/db/repositories/swap_repo.py
from app.db.dynamodb_client import dynamodb
from datetime import datetime
import uuid
from typing import Dict, List, Optional

class SwapRepository:
    TABLE_NAME = "Swaps"

    @classmethod
    def create_swap(cls, data: dict, requester_id: str) -> dict:
        """Create a new swap request associated with the requester"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        swap_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        swap_item = {
            "swapId": swap_id,
            "requesterId": requester_id,  # User who initiated the swap
            "ownerId": data.get("ownerId"),  # User who owns the requested item
            "requesterListingId": data.get("requesterListingId"),  # What requester offers
            "ownerListingId": data.get("ownerListingId"),  # What requester wants
            "status": "pending",
            "message": data.get("message", ""),
            "createdAt": timestamp,
            "updatedAt": timestamp,
            "completedAt": None,
            "meetupDetails": data.get("meetupDetails", {})
        }
        
        table.put_item(Item=swap_item)
        return swap_item

    @classmethod
    def get_swap(cls, swap_id: str) -> Optional[dict]:
        """Get a single swap by ID"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        response = table.get_item(Key={"swapId": swap_id})
        return response.get("Item")

    @classmethod
    def get_swaps_by_user(cls, user_id: str, role: str = None) -> List[dict]:
        """Get swaps for a user (as requester, owner, or both)"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        swaps = []
        
        if role is None or role == "requester":
            # Get swaps where user is the requester
            response = table.query(
                IndexName="RequesterIndex",
                KeyConditionExpression="requesterId = :user_id",
                ExpressionAttributeValues={":user_id": user_id},
                ScanIndexForward=False  # Most recent first
            )
            swaps.extend(response.get("Items", []))
        
        if role is None or role == "owner":
            # Get swaps where user owns the requested item
            response = table.query(
                IndexName="OwnerIndex",
                KeyConditionExpression="ownerId = :user_id",
                ExpressionAttributeValues={":user_id": user_id},
                ScanIndexForward=False  # Most recent first
            )
            swaps.extend(response.get("Items", []))
        
        # Remove duplicates and sort by creation date
        unique_swaps = {swap["swapId"]: swap for swap in swaps}
        sorted_swaps = sorted(
            unique_swaps.values(),
            key=lambda x: x["createdAt"],
            reverse=True
        )
        
        return sorted_swaps

    @classmethod
    def update_swap_status(cls, swap_id: str, data: dict, user_id: str) -> Optional[dict]:
        """Update swap status (only if user is involved in the swap)"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        # First verify the user is involved in this swap
        existing = cls.get_swap(swap_id)
        if not existing:
            return None
        
        # Check if user is either the requester or owner
        if existing.get("requesterId") != user_id and existing.get("ownerId") != user_id:
            return None
        
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Build update expression
        update_expression = "SET updatedAt = :timestamp"
        expression_values = {":timestamp": timestamp}
        
        # Add fields to update
        if "status" in data:
            update_expression += ", #status = :status"
            expression_values[":status"] = data["status"]
            
            # If status is completed, set completion timestamp
            if data["status"] == "completed":
                update_expression += ", completedAt = :completed_at"
                expression_values[":completed_at"] = timestamp
        
        if "message" in data:
            update_expression += ", message = :message"
            expression_values[":message"] = data["message"]
        
        if "meetupDetails" in data:
            update_expression += ", meetupDetails = :meetup_details"
            expression_values[":meetup_details"] = data["meetupDetails"]
        
        update_params = {
            "Key": {"swapId": swap_id},
            "UpdateExpression": update_expression,
            "ExpressionAttributeValues": expression_values,
            "ExpressionAttributeNames": {"#status": "status"},  # status is reserved
            "ReturnValues": "ALL_NEW"
        }
        
        response = table.update_item(**update_params)
        return response.get("Attributes")

    @classmethod
    def get_swaps_for_listing(cls, listing_id: str) -> List[dict]:
        """Get all swaps involving a specific listing"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        # Scan for swaps where this listing is either offered or requested
        response = table.scan(
            FilterExpression="requesterListingId = :listing_id OR ownerListingId = :listing_id",
            ExpressionAttributeValues={":listing_id": listing_id}
        )
        
        return response.get("Items", [])

    @classmethod
    def get_pending_swaps_for_user(cls, user_id: str) -> List[dict]:
        """Get pending swaps where user needs to take action"""
        all_swaps = cls.get_swaps_by_user(user_id)
        
        # Filter for pending swaps where user is the owner (needs to respond)
        pending_swaps = [
            swap for swap in all_swaps
            if swap.get("status") == "pending" and swap.get("ownerId") == user_id
        ]
        
        return pending_swaps

    @classmethod
    def delete_swap(cls, swap_id: str, user_id: str) -> bool:
        """Delete a swap (only if user is the requester and swap is pending)"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        # First verify the user is the requester and swap is pending
        existing = cls.get_swap(swap_id)
        if not existing:
            return False
        
        if existing.get("requesterId") != user_id or existing.get("status") != "pending":
            return False
        
        table.delete_item(Key={"swapId": swap_id})
        return True
