# backend/app/db/repos/message_repo.py
from app.db.dynamodb_client import dynamodb
from datetime import datetime
import uuid
from typing import Dict, List, Optional, Any
from boto3.dynamodb.conditions import Key, Attr
from app.schemas.messages import SystemMessageEvent

class MessageRepository:
    TABLE_NAME = "Messages"
    SYSTEM_SENDER_ID = "SYSTEM"
    
    @classmethod
    def create_message(cls, swap_id: str, sender_id: str, recipient_id: str, content: str) -> dict:
        """Create a new user message for a swap"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        message_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        message_item = {
            "swapId": swap_id,
            "messageId": message_id,
            "senderId": sender_id,
            "recipientId": recipient_id,
            "content": content,
            "timestamp": timestamp,
            "isRead": False,
            "messageType": "user"
        }
        
        table.put_item(Item=message_item)
        return message_item
    
    @classmethod
    def create_system_message(
        cls,
        swap_id: str,
        event_type: SystemMessageEvent,
        content: str,
        recipient_ids: List[str],
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[dict]:
        """
        Create system messages related to swap status changes
        
        This method creates system messages for all participants in the swap.
        System messages are typically notifications about swap status changes.
        
        Args:
            swap_id: ID of the swap
            event_type: Type of system event (e.g., swap_accepted)
            content: Content of the system message
            recipient_ids: List of recipient IDs (typically both swap participants)
            metadata: Optional metadata related to the event (e.g., status changes)
            
        Returns:
            List of created message objects
        """
        table = dynamodb.Table(cls.TABLE_NAME)
        timestamp = datetime.utcnow().isoformat() + "Z"
        messages = []
        
        for recipient_id in recipient_ids:
            message_id = str(uuid.uuid4())
            
            message_item = {
                "swapId": swap_id,
                "messageId": message_id,
                "senderId": cls.SYSTEM_SENDER_ID,
                "recipientId": recipient_id,
                "content": content,
                "timestamp": timestamp,
                "isRead": False,
                "messageType": "system",
                "eventType": event_type,
                "metadata": metadata or {}
            }
            
            table.put_item(Item=message_item)
            messages.append(message_item)
            
        return messages
    
    @classmethod
    def get_messages_for_swap(cls, swap_id: str) -> List[dict]:
        """Get all messages for a specific swap, ordered by timestamp"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        response = table.query(
            KeyConditionExpression=Key("swapId").eq(swap_id),
            ScanIndexForward=True  # Sort by timestamp in ascending order (oldest first)
        )
        
        return response.get("Items", [])
    
    @classmethod
    def mark_message_as_read(cls, swap_id: str, message_id: str, recipient_id: str) -> Optional[dict]:
        """Mark a message as read (only if user is the recipient)"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        # First get the message to check if user is recipient
        response = table.get_item(Key={"swapId": swap_id, "messageId": message_id})
        message = response.get("Item")
        
        if not message:
            return None
            
        # Check if user is the recipient
        if message.get("recipientId") != recipient_id:
            return None
            
        # Message already read
        if message.get("isRead", False):
            return message
            
        # Update the message to mark as read
        update_params = {
            "Key": {"swapId": swap_id, "messageId": message_id},
            "UpdateExpression": "SET isRead = :is_read",
            "ExpressionAttributeValues": {":is_read": True},
            "ReturnValues": "ALL_NEW"
        }
        
        response = table.update_item(**update_params)
        return response.get("Attributes")
    
    @classmethod
    def count_unread_messages(cls, user_id: str) -> dict:
        """Count unread messages for a user across all swaps"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        # Scan for all unread messages where user is the recipient
        # Note: In a production system with many messages, this would be inefficient
        # Consider using a GSI on recipientId and isRead for better performance
        response = table.scan(
            FilterExpression=Attr("recipientId").eq(user_id) & Attr("isRead").eq(False)
        )
        
        unread_messages = response.get("Items", [])
        
        # Group by swapId for more detailed information
        swaps_with_unread = {}
        for message in unread_messages:
            swap_id = message.get("swapId")
            if swap_id not in swaps_with_unread:
                swaps_with_unread[swap_id] = 0
            swaps_with_unread[swap_id] += 1
        
        # Format the result
        swaps_list = [{"swap_id": swap_id, "count": count} for swap_id, count in swaps_with_unread.items()]
        
        return {
            "count": len(unread_messages),
            "swaps": swaps_list
        }
    
    @classmethod
    def delete_message(cls, swap_id: str, message_id: str, user_id: str) -> bool:
        """Delete a message (only if user is the sender)"""
        table = dynamodb.Table(cls.TABLE_NAME)
        
        # First get the message to check if user is sender
        response = table.get_item(Key={"swapId": swap_id, "messageId": message_id})
        message = response.get("Item")
        
        if not message:
            return False
            
        # Check if user is the sender
        if message.get("senderId") != user_id:
            return False
            
        # Prevent deletion of system messages
        if message.get("messageType") == "system":
            return False
            
        # Delete the message
        table.delete_item(Key={"swapId": swap_id, "messageId": message_id})
        return True
        
    @classmethod
    def get_messages_reference(cls, swap_id: str) -> Dict[str, Any]:
        """
        Get a reference to messages for a swap that includes counts and latest message
        
        This is used to enrich swap objects with message-related information
        without loading all messages.
        
        Returns:
            Dict with message counts and last message info
        """
        messages = cls.get_messages_for_swap(swap_id)
        
        if not messages:
            return {
                "total_count": 0,
                "unread_count": 0,
                "latest_message": None
            }
        
        # Get the latest message
        latest_message = max(messages, key=lambda m: m["timestamp"])
        unread_count = len([m for m in messages if not m.get("isRead", False)])
        
        return {
            "total_count": len(messages),
            "unread_count": unread_count,
            "latest_message": {
                "content": latest_message["content"],
                "timestamp": latest_message["timestamp"],
                "message_type": latest_message.get("messageType", "user"),
                "event_type": latest_message.get("eventType", None)
            }
        }