# backend/app/api/routers/swaps_router.py
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from app.db.repos.swap_repo import SwapRepository
from app.db.repos.listing_repo import ListingRepository
from app.db.repos.user_repo import UserRepository
from app.db.repos.message_repo import MessageRepository
from app.schemas.messages import SystemMessageEvent
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/")
async def create_swap(swap_data: dict):
    """
    Create a new swap request.
    
    Expected payload:
    {
        "requesterId": "user123",
        "ownerId": "user456",
        "requesterListingId": "listing123",
        "ownerListingId": "listing456",
        "message": "Hi! I'd love to swap my jeans for your sweater.",
        "meetupDetails": {
            "preferredLocation": "Downtown Seattle",
            "preferredTime": "Weekend afternoons",
            "contactMethod": "email"
        }
    }
    """
    try:
        # Validate required fields
        required_fields = ["requesterId", "ownerId", "requesterListingId", "ownerListingId"]
        for field in required_fields:
            if field not in swap_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Validate that requester and owner are different users
        if swap_data["requesterId"] == swap_data["ownerId"]:
            raise HTTPException(status_code=400, detail="Cannot create swap with yourself")
        
        # Verify users exist
        requester = UserRepository.get_user(swap_data["requesterId"])
        if not requester:
            raise HTTPException(status_code=404, detail="Requester user not found")
        
        owner = UserRepository.get_user(swap_data["ownerId"])
        if not owner:
            raise HTTPException(status_code=404, detail="Owner user not found")
        
        # Verify listings exist and are active
        requester_listing = ListingRepository.get_listing(swap_data["requesterListingId"])
        if not requester_listing or requester_listing.get("status") != "active":
            raise HTTPException(status_code=404, detail="Requester listing not found or not active")
        
        owner_listing = ListingRepository.get_listing(swap_data["ownerListingId"])
        if not owner_listing or owner_listing.get("status") != "active":
            raise HTTPException(status_code=404, detail="Owner listing not found or not active")
        
        # Verify listing ownership
        if requester_listing.get("userId") != swap_data["requesterId"]:
            raise HTTPException(status_code=403, detail="Requester doesn't own the offered listing")
        
        if owner_listing.get("userId") != swap_data["ownerId"]:
            raise HTTPException(status_code=403, detail="Owner doesn't own the requested listing")
        
        # Create swap
        new_swap = SwapRepository.create_swap(swap_data, swap_data["requesterId"])
        
        return {
            "message": "Swap request created successfully",
            "swap": new_swap
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating swap: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating swap: {str(e)}")

@router.get("/")
async def list_swaps(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    role: Optional[str] = Query(None, description="Filter by role: 'requester' or 'owner'"),
    status: Optional[str] = Query(None, description="Filter by status: 'pending', 'accepted', 'rejected', 'completed'"),
    listing_id: Optional[str] = Query(None, description="Filter by listing ID")
):
    """
    Get swaps with optional filters.
    
    Query parameters:
    - user_id: Get swaps involving specific user
    - role: Filter by user role ('requester' or 'owner')
    - status: Filter by swap status
    - listing_id: Get swaps involving specific listing
    
    Examples:
    - GET /swaps/?user_id=user123 - Get all swaps for user123
    - GET /swaps/?user_id=user123&role=requester - Get swaps where user123 is requester
    - GET /swaps/?user_id=user123&status=pending - Get pending swaps for user123
    - GET /swaps/?listing_id=listing456 - Get swaps involving listing456
    """
    try:
        swaps = []
        
        if listing_id:
            # Get swaps for specific listing
            swaps = SwapRepository.get_swaps_for_listing(listing_id)
            
        elif user_id:
            # Get swaps for specific user
            swaps = SwapRepository.get_swaps_by_user(user_id, role)
            
        else:
            # If no filters provided, return error (to prevent expensive scans)
            raise HTTPException(
                status_code=400, 
                detail="Please provide user_id or listing_id filter to avoid expensive database scans"
            )
        
        # Filter by status if specified
        if status:
            swaps = [swap for swap in swaps if swap.get("status") == status]
        
        # Enrich swaps with listing and user information
        enriched_swaps = []
        for swap in swaps:
            try:
                # Get listing information
                requester_listing = ListingRepository.get_listing(swap.get("requesterListingId"))
                owner_listing = ListingRepository.get_listing(swap.get("ownerListingId"))
                
                # Get user information (public profiles)
                requester_info = UserRepository.get_user_public_profile(swap.get("requesterId"))
                owner_info = UserRepository.get_user_public_profile(swap.get("ownerId"))
                
                # Get message counts
                message_refs = swap.get("messages", MessageRepository.get_messages_reference(swap.get("swapId")))
                
                enriched_swap = {
                    **swap,
                    "requester_listing": requester_listing,
                    "owner_listing": owner_listing,
                    "requester_info": requester_info,
                    "owner_info": owner_info,
                    "messages": message_refs
                }
                enriched_swaps.append(enriched_swap)
                
            except Exception as e:
                logger.warning(f"Could not enrich swap {swap.get('swapId')}: {e}")
                enriched_swaps.append(swap)  # Add without enrichment
        
        return {
            "swaps": enriched_swaps,
            "count": len(enriched_swaps),
            "filters_applied": {
                "user_id": user_id,
                "role": role,
                "status": status,
                "listing_id": listing_id
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching swaps: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching swaps: {str(e)}")

@router.get("/{swap_id}")
async def get_swap(swap_id: str):
    """
    Get a specific swap by ID with full details.
    
    Returns the swap with enriched listing and user information.
    """
    try:
        swap = SwapRepository.get_swap(swap_id)
        if not swap:
            raise HTTPException(status_code=404, detail="Swap not found")
        
        # Enrich with listing and user information
        try:
            requester_listing = ListingRepository.get_listing(swap.get("requesterListingId"))
            owner_listing = ListingRepository.get_listing(swap.get("ownerListingId"))
            requester_info = UserRepository.get_user_public_profile(swap.get("requesterId"))
            owner_info = UserRepository.get_user_public_profile(swap.get("ownerId"))
            
            # Get message counts
            message_refs = swap.get("messages", MessageRepository.get_messages_reference(swap.get("swapId")))
            
            enriched_swap = {
                **swap,
                "requester_listing": requester_listing,
                "owner_listing": owner_listing,
                "requester_info": requester_info,
                "owner_info": owner_info,
                "messages": message_refs
            }
            
            return {"swap": enriched_swap}
            
        except Exception as e:
            logger.warning(f"Could not enrich swap {swap_id}: {e}")
            return {"swap": swap}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching swap {swap_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching swap: {str(e)}")

@router.put("/{swap_id}")
async def update_swap(swap_id: str, update_data: dict):
    """
    Update a swap status or details.
    
    Note: In production, add authentication to ensure user is involved in the swap.
    
    Expected payload:
    {
        "userId": "user123",  // Required for authorization
        "status": "accepted",  // Optional: pending, accepted, rejected, completed
        "message": "Great! Let's meet at the coffee shop.",  // Optional
        "meetupDetails": {  // Optional
            "confirmedLocation": "Starbucks on Pine St",
            "confirmedTime": "Saturday 2pm",
            "contactInfo": "555-1234"
        }
    }
    """
    try:
        if "userId" not in update_data:
            raise HTTPException(status_code=400, detail="userId is required for authorization")
        
        user_id = update_data.pop("userId")  # Remove from update data
        
        # Validate status if provided
        valid_statuses = ["pending", "accepted", "rejected", "completed", "cancelled"]
        if "status" in update_data and update_data["status"] not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Get the existing swap before updating for notification purposes
        existing_swap = SwapRepository.get_swap(swap_id)
        if not existing_swap:
            raise HTTPException(status_code=404, detail="Swap not found")
        
        # Update the swap - system messages are generated automatically in the repository
        updated_swap = SwapRepository.update_swap_status(swap_id, update_data, user_id)
        if not updated_swap:
            raise HTTPException(
                status_code=404, 
                detail="Swap not found or not authorized to update"
            )
        
        return {
            "message": "Swap updated successfully",
            "swap": updated_swap
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating swap {swap_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating swap: {str(e)}")

@router.delete("/{swap_id}")
async def delete_swap(swap_id: str, user_data: dict):
    """
    Delete a swap request.
    
    Only the requester can delete a swap, and only if it's still pending.
    
    Expected payload:
    {
        "userId": "user123"  // Required for authorization
    }
    """
    try:
        if "userId" not in user_data:
            raise HTTPException(status_code=400, detail="userId is required for authorization")
        
        user_id = user_data["userId"]
        
        success = SwapRepository.delete_swap(swap_id, user_id)
        if not success:
            raise HTTPException(
                status_code=404, 
                detail="Swap not found, not authorized to delete, or swap is no longer pending"
            )
        
        return {
            "message": "Swap deleted successfully",
            "swap_id": swap_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting swap {swap_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting swap: {str(e)}")

@router.get("/user/{user_id}/pending")
async def get_pending_swaps(user_id: str):
    """
    Get pending swaps where the user needs to take action.
    
    Returns swaps where the user is the owner and needs to respond.
    """
    try:
        # Verify user exists
        user = UserRepository.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        pending_swaps = SwapRepository.get_pending_swaps_for_user(user_id)
        
        # Enrich with listing and requester information
        enriched_swaps = []
        for swap in pending_swaps:
            try:
                requester_listing = ListingRepository.get_listing(swap.get("requesterListingId"))
                owner_listing = ListingRepository.get_listing(swap.get("ownerListingId"))
                requester_info = UserRepository.get_user_public_profile(swap.get("requesterId"))
                
                # Get message counts
                message_refs = swap.get("messages", MessageRepository.get_messages_reference(swap.get("swapId")))
                
                enriched_swap = {
                    **swap,
                    "requester_listing": requester_listing,
                    "owner_listing": owner_listing,
                    "requester_info": requester_info,
                    "messages": message_refs
                }
                enriched_swaps.append(enriched_swap)
                
            except Exception as e:
                logger.warning(f"Could not enrich pending swap {swap.get('swapId')}: {e}")
                enriched_swaps.append(swap)
        
        return {
            "user_id": user_id,
            "pending_swaps": enriched_swaps,
            "count": len(enriched_swaps)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching pending swaps for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching pending swaps: {str(e)}")

@router.get("/user/{user_id}/history")
async def get_user_swap_history(user_id: str):
    """
    Get complete swap history for a user.
    
    Returns all swaps (as requester and owner) categorized by status.
    """
    try:
        # Verify user exists
        user = UserRepository.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        all_swaps = SwapRepository.get_swaps_by_user(user_id)
        
        # Categorize swaps by status
        categorized_swaps = {
            "pending": [],
            "accepted": [],
            "rejected": [],
            "completed": [],
            "cancelled": []
        }
        
        for swap in all_swaps:
            status = swap.get("status", "pending")
            if status in categorized_swaps:
                categorized_swaps[status].append(swap)
        
        # Calculate statistics
        total_swaps = len(all_swaps)
        completed_swaps = len(categorized_swaps["completed"])
        success_rate = (completed_swaps / total_swaps * 100) if total_swaps > 0 else 0
        
        return {
            "user_id": user_id,
            "swap_history": categorized_swaps,
            "statistics": {
                "total_swaps": total_swaps,
                "completed_swaps": completed_swaps,
                "pending_swaps": len(categorized_swaps["pending"]),
                "success_rate": round(success_rate, 1)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching swap history for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching swap history: {str(e)}")

@router.post("/{swap_id}/accept")
async def accept_swap(swap_id: str, user_data: dict):
    """
    Accept a swap request.
    
    Convenience endpoint for accepting swaps.
    
    Expected payload:
    {
        "userId": "user123",  // Required for authorization
        "message": "Sounds great! Let's meet tomorrow.",  // Optional
        "meetupDetails": {  // Optional
            "location": "Central Park",
            "time": "2pm Saturday"
        }
    }
    """
    try:
        if "userId" not in user_data:
            raise HTTPException(status_code=400, detail="userId is required for authorization")
        
        # Update swap status to accepted
        update_data = {
            "status": "accepted",
            "message": user_data.get("message", ""),
            "meetupDetails": user_data.get("meetupDetails", {})
        }
        
        # The SwapRepository will automatically create system messages
        updated_swap = SwapRepository.update_swap_status(swap_id, update_data, user_data["userId"])
        if not updated_swap:
            raise HTTPException(
                status_code=404, 
                detail="Swap not found or not authorized to accept"
            )
        
        return {
            "message": "Swap accepted successfully",
            "swap": updated_swap
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting swap {swap_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error accepting swap: {str(e)}")

@router.post("/{swap_id}/reject")
async def reject_swap(swap_id: str, user_data: dict):
    """
    Reject a swap request.
    
    Convenience endpoint for rejecting swaps.
    
    Expected payload:
    {
        "userId": "user123",  // Required for authorization
        "message": "Sorry, I've already committed to another swap."  // Optional
    }
    """
    try:
        if "userId" not in user_data:
            raise HTTPException(status_code=400, detail="userId is required for authorization")
        
        # Update swap status to rejected
        update_data = {
            "status": "rejected",
            "message": user_data.get("message", "")
        }
        
        # The SwapRepository will automatically create system messages
        updated_swap = SwapRepository.update_swap_status(swap_id, update_data, user_data["userId"])
        if not updated_swap:
            raise HTTPException(
                status_code=404, 
                detail="Swap not found or not authorized to reject"
            )
        
        return {
            "message": "Swap rejected successfully",
            "swap": updated_swap
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting swap {swap_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error rejecting swap: {str(e)}")

@router.post("/{swap_id}/complete")
async def complete_swap(swap_id: str, user_data: dict):
    """
    Mark a swap as completed.
    
    Either party can mark the swap as completed.
    
    Expected payload:
    {
        "userId": "user123",  // Required for authorization
        "message": "Great swap! Thanks!"  // Optional
    }
    """
    try:
        if "userId" not in user_data:
            raise HTTPException(status_code=400, detail="userId is required for authorization")
        
        # Update swap status to completed
        update_data = {
            "status": "completed",
            "message": user_data.get("message", "")
        }
        
        # The SwapRepository will automatically create system messages
        updated_swap = SwapRepository.update_swap_status(swap_id, update_data, user_data["userId"])
        if not updated_swap:
            raise HTTPException(
                status_code=404, 
                detail="Swap not found or not authorized to complete"
            )
        
        return {
            "message": "Swap completed successfully",
            "swap": updated_swap
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing swap {swap_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error completing swap: {str(e)}")
