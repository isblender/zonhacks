# backend/app/api/dependencies/messages.py
from fastapi import HTTPException, Depends, status
from app.db.repos.swap_repo import SwapRepository
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

async def verify_user_in_swap(
    swap_id: str,
    user_id: str
) -> Dict:
    """
    Verify that the authenticated user is a participant in the swap (either requester or owner).
    
    Args:
        swap_id: The ID of the swap to check
        user_id: The ID of the authenticated user
        
    Returns:
        The swap object if the user is a participant
        
    Raises:
        HTTPException: If user is not a participant in the swap
    """
    # Get the swap details
    swap = SwapRepository.get_swap(swap_id)
    
    if not swap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swap not found"
        )
    
    # Check if user is either the requester or owner in the swap
    if swap.get("requesterId") != user_id and swap.get("ownerId") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a participant in this swap"
        )
    
    return swap

async def get_message_recipient(
    swap_id: str,
    user_id: str
) -> str:
    """
    Determine the recipient ID for a new message based on the swap and current user.
    
    Args:
        swap_id: The ID of the swap
        user_id: The ID of the authenticated user (sender)
        
    Returns:
        The user ID of the recipient
        
    Raises:
        HTTPException: If user is not a participant in the swap
    """
    # Get the swap and verify user is a participant
    swap = await verify_user_in_swap(swap_id, user_id)
    
    # Determine recipient based on sender
    if user_id == swap.get("requesterId"):
        return swap.get("ownerId")
    else:
        return swap.get("requesterId")