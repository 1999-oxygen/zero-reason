"""
Authentication endpoints for OmniVision
Add these to main.py
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
import auth
import database_users as db_users
import os

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


class AccessCodeRequest(BaseModel):
    access_code: str


class AccessCodeResponse(BaseModel):
    valid: bool
    message: str


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
    
    # Auto-set admin for specific email
    if google_user['email'] == "eightykings2@gmail.com":
        db_users.set_admin_email(google_user['email'])
    
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


@router.post("/verify-access-code")
async def verify_access_code(request: AccessCodeRequest, admin_email: Optional[str] = None):
    """Verify access code for app access (skips for admin email)"""
    # Skip access code verification for admin email
    if admin_email and db_users.is_admin_user(admin_email):
        return {"valid": True, "message": "Admin access granted", "is_admin": True}

    # Check against database access codes
    valid = db_users.verify_access_code(request.access_code)

    if valid:
        return {"valid": True, "message": "Access code verified", "is_admin": False}
    else:
        # Fallback to environment variable for backward compatibility
        valid_code = os.getenv("APP_ACCESS_CODE", "OMNI2024")
        if request.access_code == valid_code:
            # Create this code in database for future use
            try:
                db_users.create_access_code(request.access_code)
            except:
                pass
            return {"valid": True, "message": "Access code verified", "is_admin": False}
        return {"valid": False, "message": "Invalid access code", "is_admin": False}


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


# ============ ADMIN ENDPOINTS ============

class UpdateAccessCodeRequest(BaseModel):
    old_code: str
    new_code: str


class SetUserAccessDurationRequest(BaseModel):
    user_id: int
    duration_hours: int


class ApproveUserRequest(BaseModel):
    user_id: int
    approved: bool


@router.post("/admin/update-access-code")
async def admin_update_access_code(request: UpdateAccessCodeRequest):
    """Update access code (admin only)"""
    success = db_users.update_access_code(request.old_code, request.new_code)
    if success:
        return {"ok": True, "message": "Access code updated successfully"}
    return {"ok": False, "message": "Failed to update access code"}


@router.post("/admin/create-access-code")
async def admin_create_access_code(code: str):
    """Create new access code (admin only)"""
    try:
        result = db_users.create_access_code(code)
        return {"ok": True, "code": result}
    except Exception as e:
        return {"ok": False, "message": str(e)}


@router.get("/admin/access-codes")
async def admin_get_access_codes():
    """Get all access codes (admin only)"""
    codes = db_users.get_all_access_codes()
    return codes


@router.post("/admin/set-user-access-duration")
async def admin_set_user_access_duration(request: SetUserAccessDurationRequest):
    """Set user access duration (admin only)"""
    db_users.set_user_access_duration(request.user_id, request.duration_hours)
    return {"ok": True, "message": "User access duration updated"}


@router.get("/admin/users")
async def admin_get_users():
    """Get all users with access info (admin only)"""
    users = db_users.get_all_users_with_access_info()
    return users


@router.post("/admin/approve-user")
async def admin_approve_user(request: ApproveUserRequest):
    """Approve or disapprove user (admin only)"""
    db_users.approve_user(request.user_id, request.approved)
    return {"ok": True, "message": "User approval status updated"}


class SetAdminEmailRequest(BaseModel):
    email: str


@router.post("/admin/set-admin-email")
async def admin_set_admin_email(request: SetAdminEmailRequest):
    """Set a user as admin by email (admin only)"""
    db_users.set_admin_email(request.email)
    return {"ok": True, "message": f"Admin email set to {request.email}"}


@router.get("/admin/emails")
async def admin_get_admin_emails():
    """Get all admin emails (admin only)"""
    emails = db_users.get_admin_emails()
    return {"emails": emails}


@router.get("/check-admin/{email}")
async def check_admin(email: str):
    """Check if a user is admin by email (public endpoint)"""
    is_admin = db_users.is_admin_user(email)
    return {"is_admin": is_admin}


# ============ USER MESSAGING ============

class UserMessageRequest(BaseModel):
    subject: str
    message: str


@router.post("/user/message")
async def send_message_to_admin(
    request: UserMessageRequest,
    user_id: int = Depends(get_current_user)
):
    """Send a message to admin"""
    # Get user info
    user = db_users.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    message_id = db_users.create_user_message(
        user_id,
        user['email'],
        user.get('name', user['email']),
        request.subject,
        request.message
    )
    
    return {"ok": True, "message_id": message_id}


@router.get("/admin/messages")
async def get_user_messages(unread_only: bool = False):
    """Get all user messages (admin only)"""
    messages = db_users.get_all_user_messages(unread_only)
    return messages


@router.put("/admin/messages/{message_id}/read")
async def mark_user_message_read(message_id: int):
    """Mark message as read (admin only)"""
    db_users.mark_message_read(message_id)
    return {"ok": True}


@router.delete("/admin/messages/{message_id}")
async def delete_user_message_endpoint(message_id: int):
    """Delete message (admin only)"""
    db_users.delete_user_message(message_id)
    return {"ok": True}
