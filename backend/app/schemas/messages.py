# backend/app/schemas/messages.py
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum

class MessageType(str, Enum):
    """Enum for message types"""
    USER = "user"
    SYSTEM = "system"

class SystemMessageEvent(str, Enum):
    """Enum for system message event types"""
    SWAP_CREATED = "swap_created"
    SWAP_ACCEPTED = "swap_accepted"
    SWAP_REJECTED = "swap_rejected"
    SWAP_COMPLETED = "swap_completed"
    SWAP_CANCELLED = "swap_cancelled"

class MessageCreate(BaseModel):
    """Schema for creating a new message"""
    content: str = Field(..., description="Content of the message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "Hello! Is this item still available for swap?"
            }
        }

class SystemMessageCreate(BaseModel):
    """Schema for creating a system message"""
    event_type: SystemMessageEvent = Field(..., description="Type of system event")
    content: str = Field(..., description="Content of the message")
    metadata: Optional[dict] = Field(default=None, description="Additional metadata related to the event")
    
    class Config:
        json_schema_extra = {
            "example": {
                "event_type": "swap_accepted",
                "content": "The swap request has been accepted.",
                "metadata": {
                    "previous_status": "pending",
                    "new_status": "accepted"
                }
            }
        }

class MessageRead(BaseModel):
    """Schema for marking a message as read"""
    message_id: str = Field(..., description="ID of the message to mark as read")

    class Config:
        json_schema_extra = {
            "example": {
                "message_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }

class MessageResponse(BaseModel):
    """Schema for message response data"""
    message_id: str = Field(..., description="Unique identifier for the message")
    swap_id: str = Field(..., description="ID of the swap this message belongs to")
    sender_id: str = Field(..., description="ID of the user who sent the message")
    recipient_id: str = Field(..., description="ID of the user who received the message")
    content: str = Field(..., description="Content of the message")
    timestamp: datetime = Field(..., description="Timestamp when the message was sent")
    is_read: bool = Field(default=False, description="Whether the message has been read")
    message_type: MessageType = Field(default=MessageType.USER, description="Type of message (user or system)")
    event_type: Optional[SystemMessageEvent] = Field(default=None, description="Type of system event (for system messages)")
    metadata: Optional[dict] = Field(default=None, description="Additional metadata for system messages")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message_id": "123e4567-e89b-12d3-a456-426614174000",
                "swap_id": "123e4567-e89b-12d3-a456-426614174001",
                "sender_id": "user123",
                "recipient_id": "user456",
                "content": "Hello! Is this item still available for swap?",
                "timestamp": "2025-07-26T12:34:56.789Z",
                "is_read": False,
                "message_type": "user",
                "event_type": None,
                "metadata": None
            }
        }

class UnreadMessageCount(BaseModel):
    """Schema for unread message count"""
    count: int = Field(..., description="Number of unread messages")
    swaps: List[dict] = Field(default_factory=list, description="List of swaps with unread messages")
    
    class Config:
        json_schema_extra = {
            "example": {
                "count": 5,
                "swaps": [
                    {
                        "swap_id": "123e4567-e89b-12d3-a456-426614174001",
                        "count": 2
                    },
                    {
                        "swap_id": "123e4567-e89b-12d3-a456-426614174002",
                        "count": 3
                    }
                ]
            }
        }