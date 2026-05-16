"""
Authentication endpoints for OmniVision
Add these to main.py
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
import auth
import database_users as db_users

# Create router
router = APIRouter()

# Initialize user tables
db_users.init_user_tables()


# ============ REQUEST MODELS ============

class GoogleAuthRequest(BaseModel):
    token: str  # Google ID token


class UserResponse(BaseModel):
    user_id: int
    email: str
    name: Optional[str]
    picture: Optional[str]
    jwt_token: str


# ============ AUTH DEPENDENCY ============

def get_current_user(authorization: Optional[str] = Header(None)) -> int:
    """
    Dependency to get current user from JWT token
    Usage: user_id = Depends(get_current_user)
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    # Verify JWT
    payload = auth.verify_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload['user_id']


# ============ AUTH ENDPOINTS ============

@router.post("/google", response_model=UserResponse)
async def google_login(request: GoogleAuthRequest):
    """
    Authenticate user with Google OAuth token
    """
    # Verify Google token
    google_user = auth.verify_google_token(request.token)
    if not google_user:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    # Get or create user
    user_id = auth.get_or_create_user(google_user)
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    # Create JWT token
    jwt_token = auth.create_jwt_token(user_id, google_user['email'])
    
    return {
        'user_id': user_id,
        'email': google_user['email'],
        'name': google_user.get('name'),
        'picture': google_user.get('picture'),
        'jwt_token': jwt_token
    }


@router.get("/me")
async def get_current_user_info(user_id: int = Depends(get_current_user)):
    """
    Get current user information
    """
    user = auth.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        'user_id': user['id'],
        'email': user['email'],
        'name': user['name'],
        'picture': user['picture'],
        'created_at': user['created_at'],
        'last_login': user['last_login']
    }


# ============ USER-SPECIFIC DATA ENDPOINTS ============

@router.get("/user/sectors")
async def get_user_sectors(user_id: int = Depends(get_current_user)):
    """Get all sector configs for current user"""
    configs = db_users.get_user_sector_configs(user_id)
    return configs


@router.post("/user/sectors/{sector_id}")
async def save_user_sector(
    sector_id: str,
    config: dict,
    user_id: int = Depends(get_current_user)
):
    """Save sector configuration for current user"""
    saved = db_users.save_user_sector_config(user_id, sector_id, config)
    return saved


@router.get("/user/cameras")
async def get_user_cameras_endpoint(user_id: int = Depends(get_current_user)):
    """Get all cameras for current user"""
    cameras = db_users.get_user_cameras(user_id)
    return cameras


@router.post("/user/cameras")
async def save_user_camera(
    camera: dict,
    user_id: int = Depends(get_current_user)
):
    """Save camera for current user"""
    saved = db_users.save_user_camera(user_id, camera)
    return saved


@router.delete("/user/cameras/{camera_id}")
async def delete_user_camera_endpoint(
    camera_id: str,
    user_id: int = Depends(get_current_user)
):
    """Delete camera for current user"""
    db_users.delete_user_camera(user_id, camera_id)
    return {"ok": True}


@router.get("/user/alerts")
async def get_user_alerts_endpoint(
    unread_only: bool = False,
    user_id: int = Depends(get_current_user)
):
    """Get alerts for current user"""
    alerts = db_users.get_user_alerts(user_id, unread_only)
    return alerts


@router.post("/user/alerts")
async def create_user_alert(
    alert: dict,
    user_id: int = Depends(get_current_user)
):
    """Create alert for current user"""
    alert_id = db_users.save_user_alert(user_id, alert)
    return {"id": alert_id}


@router.put("/user/alerts/{alert_id}/read")
async def mark_alert_read(
    alert_id: int,
    user_id: int = Depends(get_current_user)
):
    """Mark alert as read"""
    db_users.mark_user_alert_read(user_id, alert_id)
    return {"ok": True}


@router.get("/user/training-images")
async def get_user_training_images_endpoint(
    sector_id: Optional[str] = None,
    user_id: int = Depends(get_current_user)
):
    """Get training images for current user"""
    images = db_users.get_user_training_images(user_id, sector_id)
    return images


@router.get("/user/training-images/{image_id}")
async def get_user_training_image(
    image_id: int,
    user_id: int = Depends(get_current_user)
):
    """Get training image data"""
    img = db_users.get_user_training_image_data(user_id, image_id)
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        iter([img['image_data']]),
        media_type=img['mime_type']
    )


@router.delete("/user/training-images/{image_id}")
async def delete_user_training_image_endpoint(
    image_id: int,
    user_id: int = Depends(get_current_user)
):
    """Delete training image"""
    db_users.delete_user_training_image(user_id, image_id)
    return {"ok": True}
