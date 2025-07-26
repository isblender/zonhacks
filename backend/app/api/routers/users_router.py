# backend/app/api/routers/users_router.py
from fastapi import APIRouter, HTTPException, Depends
from app.db.repos.user_repo import UserRepository
from app.db.repos.listing_repo import ListingRepository
from app.db.repos.swap_repo import SwapRepository
from typing import Optional

router = APIRouter()

@router.get("/{user_id}")
async def get_user(user_id: str, include_stats: bool = False):
    """
    Get user profile data for frontend display
    
    Args:
        user_id: The user ID to fetch
        include_stats: Whether to include user statistics (listings count, swaps count)
    
    Returns:
        User profile data with optional statistics
    """
    try:
        # Get user profile
        user = UserRepository.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare response data
        response_data = {
            "userId": user.get("userId"),
            "email": user.get("email"),
            "firstName": user.get("firstName"),
            "lastName": user.get("lastName"),
            "phone": user.get("phone"),
            "address": user.get("address", {}),
            "profileImageUrl": user.get("profileImageUrl"),
            "createdAt": user.get("createdAt"),
            "updatedAt": user.get("updatedAt"),
            "isActive": user.get("isActive", True)
        }
        
        # Include statistics if requested
        if include_stats:
            try:
                # Get user's listings count
                user_listings = ListingRepository.get_listings_by_user(user_id)
                active_listings = [l for l in user_listings if l.get("status") == "active"]
                
                # Get user's swaps count
                user_swaps = SwapRepository.get_swaps_by_user(user_id)
                pending_swaps = [s for s in user_swaps if s.get("status") == "pending"]
                completed_swaps = [s for s in user_swaps if s.get("status") == "completed"]
                
                response_data["stats"] = {
                    "totalListings": len(user_listings),
                    "activeListings": len(active_listings),
                    "totalSwaps": len(user_swaps),
                    "pendingSwaps": len(pending_swaps),
                    "completedSwaps": len(completed_swaps)
                }
            except Exception as e:
                # If stats fail, still return user data without stats
                response_data["stats"] = {
                    "error": "Could not load user statistics"
                }
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user profile: {str(e)}")

@router.get("/{user_id}/public")
async def get_user_public_profile(user_id: str):
    """
    Get public user profile (limited data for privacy)
    Used when displaying user info to other users
    """
    try:
        public_profile = UserRepository.get_user_public_profile(user_id)
        if not public_profile:
            raise HTTPException(status_code=404, detail="User not found")
        
        return public_profile
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching public profile: {str(e)}")

@router.put("/{user_id}")
async def update_user(user_id: str, user_data: dict):
    """
    Update user profile data
    Note: In production, add authentication to ensure user can only update their own profile
    """
    try:
        updated_user = UserRepository.update_user(user_id, user_data)
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "message": "User profile updated successfully",
            "user": updated_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user profile: {str(e)}")

@router.post("/")
async def create_user(user_data: dict):
    """
    Create a new user profile
    Typically called after successful Cognito registration
    """
    try:
        # Validate required fields
        required_fields = ["userId", "email", "firstName", "lastName"]
        for field in required_fields:
            if field not in user_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Check if user already exists
        existing_user = UserRepository.get_user(user_data["userId"])
        if existing_user:
            raise HTTPException(status_code=409, detail="User already exists")
        
        new_user = UserRepository.create_user(user_data)
        return {
            "message": "User profile created successfully",
            "user": new_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user profile: {str(e)}")
