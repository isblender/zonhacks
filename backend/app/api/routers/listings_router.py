# backend/app/api/routers/listings_router.py
from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File, Form
from typing import List, Optional
from app.db.repos.listing_repo import ListingRepository
from app.db.repos.user_repo import UserRepository
from services.geocoding.geocoding_service import GeocodingService
import logging
import uuid
import json

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/")
async def create_listing(
    userId: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    size: str = Form(...),
    condition: str = Form(...),
    zipCode: str = Form(...),
    location: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[])
):
    """
    Create a new listing with direct image upload.
    
    This endpoint accepts multipart/form-data with:
    - Form fields: userId, title, description, category, size, condition, zipCode
    - Optional fields: location (JSON string), tags (JSON string)
    - File uploads: images (multiple files)
    
    Frontend usage:
    const formData = new FormData();
    formData.append('userId', 'user123');
    formData.append('title', 'Blue Jeans');
    formData.append('description', 'Gently used jeans');
    formData.append('category', 'pants');
    formData.append('size', 'M');
    formData.append('condition', 'good');
    formData.append('zipCode', '12345');
    formData.append('location', JSON.stringify({city: 'Seattle', state: 'WA'}));
    formData.append('tags', JSON.stringify(['casual', 'denim']));
    
    // Add image files
    for (const file of imageFiles) {
        formData.append('images', file);
    }
    
    fetch('/listings/', {
        method: 'POST',
        body: formData
    });
    """
    try:
        # Verify user exists
        user = UserRepository.get_user(userId)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Parse optional JSON fields and geocode location
        location_data = {}
        if location:
            try:
                location_input = json.loads(location)
                
                # If location contains an address, geocode it
                if isinstance(location_input, dict) and 'address' in location_input:
                    geocoded = GeocodingService.geocode_address(location_input['address'])
                    if geocoded:
                        location_data = {
                            'address': location_input['address'],
                            'lat': geocoded['lat'],
                            'lng': geocoded['lng'],
                            'formatted_address': geocoded['formatted_address'],
                            'city': geocoded.get('city', ''),
                            'state': geocoded.get('state', ''),
                            'country': geocoded.get('country', '')
                        }
                    else:
                        logger.warning(f"Failed to geocode address: {location_input['address']}")
                        location_data = location_input
                
                # If location contains lat/lng coordinates
                elif isinstance(location_input, dict) and 'lat' in location_input and 'lng' in location_input:
                    location_data = location_input
                    # Optionally reverse geocode to get address
                    if 'address' not in location_data:
                        reverse_geocoded = GeocodingService.reverse_geocode(
                            location_input['lat'], location_input['lng']
                        )
                        if reverse_geocoded:
                            location_data.update(reverse_geocoded)
                
                # If it's just a zip code, try to geocode it
                elif zipCode:
                    geocoded = GeocodingService.get_zip_code_coordinates(zipCode)
                    if geocoded:
                        location_data = {
                            'lat': geocoded['lat'],
                            'lng': geocoded['lng'],
                            'formatted_address': geocoded['formatted_address'],
                            'city': geocoded.get('city', ''),
                            'state': geocoded.get('state', ''),
                            'country': geocoded.get('country', '')
                        }
                
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid location JSON format")
        
        # If no location provided but we have a zip code, try to geocode the zip code
        elif zipCode and not location_data:
            geocoded = GeocodingService.get_zip_code_coordinates(zipCode)
            if geocoded:
                location_data = {
                    'lat': geocoded['lat'],
                    'lng': geocoded['lng'],
                    'formatted_address': geocoded['formatted_address'],
                    'city': geocoded.get('city', ''),
                    'state': geocoded.get('state', ''),
                    'country': geocoded.get('country', '')
                }
        
        tags_data = []
        if tags:
            try:
                tags_data = json.loads(tags)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid tags JSON format")
        
        # Upload images to S3
        uploaded_images = []
        if images:
            from services.s3.image_service import ImageService
            from services.s3.s3_client import s3_client
            from core.config import settings
            
            for image_file in images:
                try:
                    # Validate file type
                    if image_file.content_type not in settings.allowed_image_types:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Invalid file type: {image_file.content_type}. Allowed types: {', '.join(settings.allowed_image_types)}"
                        )
                    
                    # Read file content
                    file_content = await image_file.read()
                    
                    # Validate file size
                    file_size = len(file_content)
                    max_size_bytes = settings.max_image_size_mb * 1024 * 1024
                    if file_size > max_size_bytes:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"File size {file_size} bytes exceeds maximum allowed size of {max_size_bytes} bytes"
                        )
                    
                    # Generate unique filename
                    file_extension = image_file.filename.split('.')[-1].lower()
                    unique_filename = f"{uuid.uuid4()}.{file_extension}"
                    s3_key = f"images/{unique_filename}"
                    
                    # Upload to S3
                    from io import BytesIO
                    file_obj = BytesIO(file_content)
                    
                    success = s3_client.upload_file(
                        file_obj=file_obj,
                        bucket=settings.s3_images_bucket,
                        key=s3_key,
                        content_type=image_file.content_type
                    )
                    
                    if not success:
                        raise HTTPException(
                            status_code=500, 
                            detail=f"Failed to upload image: {image_file.filename}"
                        )
                    
                    # Get public URL
                    image_url = ImageService.get_image_url(s3_key)
                    
                    uploaded_images.append({
                        "key": s3_key,
                        "url": image_url,
                        "original_filename": image_file.filename
                    })
                    
                    logger.info(f"Successfully uploaded image: {s3_key}")
                    
                except Exception as e:
                    logger.error(f"Error uploading image {image_file.filename}: {e}")
                    # Clean up any successfully uploaded images if one fails
                    for uploaded_image in uploaded_images:
                        try:
                            ImageService.delete_image(uploaded_image["key"])
                        except:
                            pass
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Failed to upload image {image_file.filename}: {str(e)}"
                    )
        
        # Prepare listing data
        listing_data = {
            "title": title,
            "description": description,
            "category": category,
            "size": size,
            "condition": condition,
            "zipCode": zipCode,
            "location": location_data,
            "tags": tags_data,
            "images": uploaded_images
        }
        
        # Create listing
        new_listing = ListingRepository.create_listing(listing_data, userId)
        
        return {
            "message": "Listing created successfully",
            "listing": new_listing,
            "images_uploaded": len(uploaded_images)
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
    Delete a listing and clean up associated images.
    
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
        
        # Get listing first to retrieve image keys for cleanup
        listing = ListingRepository.get_listing(listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Verify user owns the listing
        if listing.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this listing")
        
        # Delete the listing from DynamoDB
        success = ListingRepository.delete_listing(listing_id, user_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete listing from database")
        
        # Clean up associated images from S3
        images = listing.get("images", [])
        deleted_images = []
        failed_images = []
        
        if images:
            from services.s3.image_service import ImageService
            
            for image in images:
                image_key = image.get("key") if isinstance(image, dict) else image
                if image_key:
                    try:
                        delete_success = ImageService.delete_image(image_key)
                        if delete_success:
                            deleted_images.append(image_key)
                        else:
                            failed_images.append(image_key)
                    except Exception as e:
                        logger.warning(f"Failed to delete image {image_key}: {e}")
                        failed_images.append(image_key)
        
        response = {
            "message": "Listing deleted successfully",
            "listing_id": listing_id,
            "images_deleted": len(deleted_images),
            "images_failed": len(failed_images)
        }
        
        if failed_images:
            response["failed_image_cleanup"] = failed_images
            logger.warning(f"Failed to delete some images for listing {listing_id}: {failed_images}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting listing {listing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting listing: {str(e)}")

@router.get("/search/by-location")
async def search_listings_by_location(
    zip_code: Optional[str] = Query(None, description="Zip code to search in"),
    address: Optional[str] = Query(None, description="Address to search near"),
    lat: Optional[float] = Query(None, description="Latitude for location search"),
    lng: Optional[float] = Query(None, description="Longitude for location search"),
    radius: Optional[float] = Query(25.0, description="Search radius in miles"),
    category: Optional[str] = Query(None, description="Filter by category"),
    size: Optional[str] = Query(None, description="Filter by size"),
    condition: Optional[str] = Query(None, description="Filter by condition")
):
    """
    Search listings by location with advanced filters.
    
    Query parameters:
    - zip_code: Zip code to search in
    - address: Address to search near (will be geocoded)
    - lat/lng: Exact coordinates to search near
    - radius: Search radius in miles (default: 25)
    - category: Filter by category
    - size: Filter by size
    - condition: Filter by condition
    
    At least one location parameter (zip_code, address, or lat/lng) is required.
    """
    try:
        center_lat = None
        center_lng = None
        
        # Determine search center coordinates
        if lat is not None and lng is not None:
            center_lat, center_lng = lat, lng
        elif address:
            geocoded = GeocodingService.geocode_address(address)
            if not geocoded:
                raise HTTPException(status_code=400, detail=f"Could not geocode address: {address}")
            center_lat, center_lng = geocoded['lat'], geocoded['lng']
        elif zip_code:
            geocoded = GeocodingService.get_zip_code_coordinates(zip_code)
            if not geocoded:
                raise HTTPException(status_code=400, detail=f"Could not geocode zip code: {zip_code}")
            center_lat, center_lng = geocoded['lat'], geocoded['lng']
        else:
            raise HTTPException(
                status_code=400, 
                detail="At least one location parameter (zip_code, address, or lat/lng) is required"
            )
        
        # Get all active listings (we'll need to scan for location-based search)
        from app.db.dynamodb_utils import DynamoDBUtils
        all_listings = DynamoDBUtils.scan_items(
            table_name="Listings",
            filter_expression="attribute_exists(listingId) AND #status = :status",
            expression_attribute_names={"#status": "status"},
            expression_attribute_values={":status": "active"}
        )
        
        # Filter by distance
        nearby_listings = GeocodingService.filter_listings_by_distance(
            all_listings, center_lat, center_lng, radius
        )
        
        # Apply additional filters
        filtered_listings = nearby_listings
        
        if category:
            filtered_listings = [listing for listing in filtered_listings if listing.get("category") == category]
        
        if size:
            filtered_listings = [listing for listing in filtered_listings if listing.get("size") == size]
        
        if condition:
            filtered_listings = [listing for listing in filtered_listings if listing.get("condition") == condition]
        
        return {
            "listings": filtered_listings,
            "count": len(filtered_listings),
            "search_center": {
                "lat": center_lat,
                "lng": center_lng
            },
            "search_criteria": {
                "zip_code": zip_code,
                "address": address,
                "radius": radius,
                "category": category,
                "size": size,
                "condition": condition
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching listings by location: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching listings: {str(e)}")

@router.post("/geocode")
async def geocode_address(request: dict):
    """
    Geocode an address to get latitude/longitude coordinates.
    
    Expected payload:
    {
        "address": "123 Main St, Seattle, WA"
    }
    """
    try:
        address = request.get("address")
        if not address:
            raise HTTPException(status_code=400, detail="Address is required")
        
        geocoded = GeocodingService.geocode_address(address)
        if not geocoded:
            raise HTTPException(status_code=404, detail="Could not geocode the provided address")
        
        return {
            "success": True,
            "result": geocoded
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error geocoding address: {e}")
        raise HTTPException(status_code=500, detail=f"Error geocoding address: {str(e)}")

@router.post("/reverse-geocode")
async def reverse_geocode_coordinates(request: dict):
    """
    Reverse geocode coordinates to get address information.
    
    Expected payload:
    {
        "lat": 47.6062,
        "lng": -122.3321
    }
    """
    try:
        lat = request.get("lat")
        lng = request.get("lng")
        
        if lat is None or lng is None:
            raise HTTPException(status_code=400, detail="Both lat and lng are required")
        
        try:
            lat = float(lat)
            lng = float(lng)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="lat and lng must be valid numbers")
        
        reverse_geocoded = GeocodingService.reverse_geocode(lat, lng)
        if not reverse_geocoded:
            raise HTTPException(status_code=404, detail="Could not reverse geocode the provided coordinates")
        
        return {
            "success": True,
            "result": reverse_geocoded
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reverse geocoding coordinates: {e}")
        raise HTTPException(status_code=500, detail=f"Error reverse geocoding: {str(e)}")

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
