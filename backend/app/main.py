from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from api.routers.auth_router import router as auth_router
from api.routers.users_router import router as users_router
from api.routers.listings_router import router as listings_router
from api.routers.swaps_router import router as swaps_router
from api.routers.uploads_router import router as uploads_router

# Core settings (if needed)
# from core.config import settings

app = FastAPI(
    title="Clothing Swap Platform API",
    version="0.1.0",
    description="API for community clothing swap platform"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(listings_router, prefix="/listings", tags=["listings"])
app.include_router(swaps_router, prefix="/swaps", tags=["swaps"])
app.include_router(uploads_router, prefix="/uploads", tags=["uploads"])

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}