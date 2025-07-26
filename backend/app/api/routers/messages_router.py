# backend/app/api/routers/messages_router.py
from fastapi import APIRouter, HTTPException, Depends, Path, Body, Query, status
from typing import List, Optional
from app.db.repos.message_repo import MessageRepository
from app.schemas.messages import MessageCreate, MessageRead, MessageResponse, UnreadMessageCount
from app.api.dependencies.messages import verify_user_in_swap, get_message_recipient
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/swap/{swap_id}", response_model=List[MessageResponse])
async def get_messages_for_swap(
    swap_id: str = Path(..., description="ID of the swap"),
    user_id: str = Query(..., description="ID of the authenticated user")
):
    """
    Get all messages for a specific swap.
    
    Only participants in the swap (requester or owner) can access these messages.
    Messages are ordered by timestamp (oldest first).
    """
    try:
        # Verify user is a participant in the swap
        await verify_user_in_swap(swap_id, user_id)
        
        # Get all messages for the swap
        messages = MessageRepository.get_messages_for_swap(swap_id)
        
        return messages
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages for swap {swap_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching messages: {str(e)}"
        )

@router.post("/swap/{swap_id}", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    swap_id: str = Path(..., description="ID of the swap"),
    user_id: str = Query(..., description="ID of the authenticated user (sender)")
):
    """
    Send a new message in a swap conversation.
    
    Only participants in the swap (requester or owner) can send messages.
    """
    try:
        # Verify user is a participant and determine recipient
        await verify_user_in_swap(swap_id, user_id)
        recipient_id = await get_message_recipient(swap_id, user_id)
        
        # Create the message
        new_message = MessageRepository.create_message(
            swap_id=swap_id,
            sender_id=user_id,
            recipient_id=recipient_id,
            content=message_data.content
        )
        
        return new_message
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message for swap {swap_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending message: {str(e)}"
        )

@router.put("/{message_id}/read", response_model=MessageResponse)
async def mark_message_as_read(
    message_data: MessageRead,
    swap_id: str = Query(..., description="ID of the swap"),
    user_id: str = Query(..., description="ID of the authenticated user (recipient)")
):
    """
    Mark a message as read.
    
    Only the recipient of the message can mark it as read.
    """
    try:
        # Verify user is a participant in the swap
        await verify_user_in_swap(swap_id, user_id)
        
        # Mark the message as read
        updated_message = MessageRepository.mark_message_as_read(
            swap_id=swap_id,
            message_id=message_data.message_id,
            recipient_id=user_id
        )
        
        if not updated_message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found or user is not the recipient"
            )
        
        return updated_message
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking message {message_data.message_id} as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error marking message as read: {str(e)}"
        )

@router.get("/unread", response_model=UnreadMessageCount)
async def get_unread_message_count(
    user_id: str = Query(..., description="ID of the authenticated user")
):
    """
    Get the count of unread messages for a user.
    
    Returns the total count and a breakdown by swap.
    """
    try:
        # Get unread message count
        unread_counts = MessageRepository.count_unread_messages(user_id)
        
        return unread_counts
        
    except Exception as e:
        logger.error(f"Error getting unread message count for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting unread message count: {str(e)}"
        )

@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: str = Path(..., description="ID of the message to delete"),
    swap_id: str = Query(..., description="ID of the swap"),
    user_id: str = Query(..., description="ID of the authenticated user (sender)")
):
    """
    Delete a message.
    
    Only the sender of the message can delete it.
    """
    try:
        # Verify user is a participant in the swap
        await verify_user_in_swap(swap_id, user_id)
        
        # Delete the message
        success = MessageRepository.delete_message(
            swap_id=swap_id,
            message_id=message_id,
            user_id=user_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found or user is not the sender"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message {message_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting message: {str(e)}"
        )