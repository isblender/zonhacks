# backend/app/api/routers/listings_router.py
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from app.db.repos.listing_repo import ListingRepository
from app.db.repos.user_repo import UserRepository
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/")
async def create_listing(listing_data: dict):
    """
    Create a new listing.
    
    Expected payload:
    {
        "userId": "user123",
        "title": "Blue Jeans",
        "description": "Gently used blue jeans in great condition",
        "category": "pants",
        "size": "M",
        "condition": "good",
        "images": ["image1.jpg", "image2.jpg"],
        "zipCode": "12345",
        "location": {
            "city": "Seattle",
            "state": "WA"
        },
        "tags": ["casual", "denim"]
    }
    """
    try:
        # Validate required fields
        required_fields = ["userId", "title", "description", "category", "size", "condition", "zipCode"]
        for field in required_fields:
            if field not in listing_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Verify user exists
        user = UserRepository.get_user(listing_data["userId"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create listing
        new_listing = ListingRepository.create_listing(listing_data, listing_data["userId"])
        
        return {
            "message": "Listing created successfully",
            "listing": new_listing
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating listing: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating listing: {str(e)}")

@router.get("/")
async def list_listings(
    zip_code: Optional[str] = Query(None, description="Filter by zip code"),
    category: Optional[str] = Query(None, description="Filter by category"),
    size: Optional[str] = Query(None, description="Filter by size"),
    user_id: Optional[str] = Query(None, description="Filter by user ID")
):
    """
    Get listings with optional filters.
    
    Query parameters:
    - zip_code: Filter listings by zip code
    - category: Filter by category (e.g., 'shirts', 'pants', 'dresses')
    - size: Filter by size (e.g., 'S', 'M', 'L', 'XL')
    - user_id: Get listings by specific user
    
    Examples:
    - GET /listings/ - Get all listings (uses scan, may be slow)
    - GET /listings/?zip_code=12345 - Get listings in zip code 12345
    - GET /listings/?zip_code=12345&category=shirts - Get shirts in zip code 12345
    - GET /listings/?user_id=user123 - Get all listings by user123
    """
    try:
        listings = []
        
        if user_id:
            # Get listings by specific user
            listings = ListingRepository.get_listings_by_user(user_id)
            
        elif zip_code:
            # Get listings by zip code with optional filters
            listings = ListingRepository.get_listings_by_zip(zip_code, size, category)
            
        else:
            # If no filters provided, we need to scan the table
            # Note: This can be expensive for large tables
            logger.warning("Performing full table scan for listings - consider adding filters")
            
            # Use DynamoDB scan (implement this method if needed)
            from app.db.dynamodb_utils import DynamoDBUtils
            listings = DynamoDBUtils.scan_items(
                table_name="Listings",
                filter_expression="attribute_exists(listingId)"
            )
        
        # Filter active listings only
        active_listings = [listing for listing in listings if listing.get("status") == "active"]
        
        return {
            "listings": active_listings,
            "count": len(active_listings),
            "filters_applied": {
                "zip_code": zip_code,
                "category": category,
                "size": size,
                "user_id": user_id
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching listings: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching listings: {str(e)}")

@router.get("/{listing_id}")
async def get_listing(listing_id: str):
    """
    Get a specific listing by ID.
    
    Returns the listing details including user information.
    """
    try:
        listing = ListingRepository.get_listing(listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Get user information for the listing
        user_info = None
        if listing.get("userId"):
            try:
                user = UserRepository.get_user_public_profile(listing["userId"])
                user_info = user
            except Exception as e:
                logger.warning(f"Could not fetch user info for listing {listing_id}: {e}")
        
        return {
            "listing": listing,
            "user_info": user_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching listing: {str(e)}")

@router.put("/{listing_id}")
async def update_listing(listing_id: str, listing_data: dict):
    """
    Update a listing.
    
    Note: In production, add authentication to ensure user can only update their own listings.
    
    Expected payload (all fields optional):
    {
        "userId": "user123",  // Required for authorization
        "title": "Updated Blue Jeans",
        "description": "Updated description",
        "category": "pants",
        "size": "L",
        "condition": "excellent",
        "images": ["new_image1.jpg"],
        "status": "active",
        "tags": ["updated", "tags"]
    }
    """
    try:
        if "userId" not in listing_data:
            raise HTTPException(status_code=400, detail="userId is required for authorization")
        
        user_id = listing_data.pop("userId")  # Remove from update data
        
        updated_listing = ListingRepository.update_listing(listing_id, listing_data, user_id)
        if not updated_listing:
            raise HTTPException(status_code=404, detail="Listing not found or not authorized to update")
        
        return {
            "message": "Listing updated successfully",
            "listing": updated_listing
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating listing: {str(e)}")

@router.delete("/{listing_id}")
async def delete_listing(listing_id: str, user_data: dict):
    """
    Delete a listing.
    
    Note: In production, add authentication to ensure user can only delete their own listings.
    
    Expected payload:
    {
        "userId": "user123"  // Required for authorization
    }
    """
    try:
        if "userId" not in user_data:
            raise HTTPException(status_code=400, detail="userId is required for authorization")
        
        user_id = user_data["userId"]
        
        success = ListingRepository.delete_listing(listing_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Listing not found or not authorized to delete")
        
        return {
            "message": "Listing deleted successfully",
            "listing_id": listing_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting listing: {str(e)}")

@router.get("/search/by-location")
async def search_listings_by_location(
    zip_code: str = Query(..., description="Zip code to search in"),
    radius: Optional[int] = Query(None, description="Search radius in miles (future feature)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    size: Optional[str] = Query(None, description="Filter by size"),
    condition: Optional[str] = Query(None, description="Filter by condition")
):
    """
    Search listings by location with advanced filters.
    
    Query parameters:
    - zip_code: Required zip code to search in
    - radius: Search radius in miles (not implemented yet)
    - category: Filter by category
    - size: Filter by size
    - condition: Filter by condition
    """
    try:
        # Get listings by zip code
        listings = ListingRepository.get_listings_by_zip(zip_code, size, category)
        
        # Additional filtering by condition if specified
        if condition:
            listings = [listing for listing in listings if listing.get("condition") == condition]
        
        # Filter active listings only
        active_listings = [listing for listing in listings if listing.get("status") == "active"]
        
        return {
            "listings": active_listings,
            "count": len(active_listings),
            "search_criteria": {
                "zip_code": zip_code,
                "radius": radius,
                "category": category,
                "size": size,
                "condition": condition
            }
        }
        
    except Exception as e:
        logger.error(f"Error searching listings: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching listings: {str(e)}")

@router.get("/user/{user_id}")
async def get_user_listings(user_id: str):
    """
    Get all listings created by a specific user.
    
    Returns both active and inactive listings for the user.
    """
    try:
        # Verify user exists
        user = UserRepository.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        listings = ListingRepository.get_listings_by_user(user_id)
        
        # Separate active and inactive listings
        active_listings = [listing for listing in listings if listing.get("status") == "active"]
        inactive_listings = [listing for listing in listings if listing.get("status") != "active"]
        
        return {
            "user_id": user_id,
            "listings": listings,
            "active_listings": active_listings,
            "inactive_listings": inactive_listings,
            "total_count": len(listings),
            "active_count": len(active_listings),
            "inactive_count": len(inactive_listings)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user listings for {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching user listings: {str(e)}")
