# backend/app/api/routers/listings_router.py
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/")
async def create_listing(listing: dict):
    # TODO: create listing
    return {"message": "Create listing stub"}

@router.get("/")
async def list_listings():
    # TODO: list/filter listings
    return {"message": "List listings stub"}

@router.get("/{listing_id}")
async def get_listing(listing_id: str):
    # TODO: get listing
    return {"listing_id": listing_id, "message": "Get listing stub"}

@router.put("/{listing_id}")
async def update_listing(listing_id: str, listing: dict):
    # TODO: update listing
    return {"listing_id": listing_id, "message": "Update listing stub"}

@router.delete("/{listing_id}")
async def delete_listing(listing_id: str):
    # TODO: delete listing
    return {"listing_id": listing_id, "message": "Delete listing stub"}