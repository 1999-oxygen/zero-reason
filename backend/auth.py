"""
Google OAuth Authentication for OmniVision
Handles user authentication and session management
"""
import jwt
import time
from typing import Optional, Dict
from google.oauth2 import id_token
from google.auth.transport import requests
import database as db
import database_users as db_users

# Google OAuth Configuration
GOOGLE_CLIENT_ID = "48750229292-ljj00ef6sv9lvjh5c2rmcromvgpt9ro7.apps.googleusercontent.com"  # Set via environment variable
JWT_SECRET = "your-secret-key-change-in-production"  # Set via environment variable
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = 86400  # 24 hours


def verify_google_token(token: str) -> Optional[Dict]:
    """
    Verify Google OAuth token and return user info
    """
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        # Token is valid, extract user info
        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'picture': idinfo.get('picture', '')
        }
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None


def create_jwt_token(user_id: int, email: str) -> str:
    """
    Create JWT token for authenticated user
    """
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': int(time.time()) + JWT_EXPIRATION,
        'iat': int(time.time())
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str) -> Optional[Dict]:
    """
    Verify JWT token and return payload
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        print("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None


def get_or_create_user(google_user_info: Dict) -> Optional[int]:
    """
    Get existing user or create new one from Google info
    Returns user_id
    """
    conn = db.get_connection()
    cursor = conn.cursor()

    # Check if user exists
    cursor.execute(
        "SELECT id FROM users WHERE google_id = ?",
        (google_user_info['google_id'],)
    )
    row = cursor.fetchone()

    if row:
        user_id = row['id']
        # Update last login
        cursor.execute(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
            (user_id,)
        )
        conn.commit()
        conn.close()
        return user_id
    else:
        # Create new user
        cursor.execute('''
            INSERT INTO users (google_id, email, name, picture)
            VALUES (?, ?, ?, ?)
        ''', (
            google_user_info['google_id'],
            google_user_info['email'],
            google_user_info['name'],
            google_user_info['picture']
        ))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        
        # Initialize default sector configs for new user
        initialize_user_sectors(user_id)
        
        return user_id


def initialize_user_sectors(user_id: int):
    """
    Create default sector configurations for new user
    """
    default_sectors = [
        {
            'sector_id': 'retail',
            'name': 'Retail & Shoes',
            'detection_types': ['theft', 'concealment', 'exit_without_payment'],
            'confidence_threshold': 0.6
        },
        {
            'sector_id': 'hospitality',
            'name': 'Hotels & Dining',
            'detection_types': ['dine_and_dash', 'unpaid_exit'],
            'confidence_threshold': 0.65
        },
        {
            'sector_id': 'liquor',
            'name': 'Liquor Stores',
            'detection_types': ['liquor_theft', 'age_verification', 'concealment'],
            'confidence_threshold': 0.7
        },
        {
            'sector_id': 'clubs',
            'name': 'Clubs & Nightlife',
            'detection_types': ['crowd_density', 'aggressive_behavior', 'intoxication'],
            'confidence_threshold': 0.75
        },
        {
            'sector_id': 'security',
            'name': 'Facility Security',
            'detection_types': ['intrusion', 'violence', 'restricted_access'],
            'confidence_threshold': 0.7
        },
        {
            'sector_id': 'education',
            'name': 'Education & Wellness',
            'detection_types': ['welfare_check', 'isolation', 'loitering'],
            'confidence_threshold': 0.6
        },
        {
            'sector_id': 'agriculture',
            'name': 'Livestock & Farms',
            'detection_types': ['health_monitoring', 'predator_detection'],
            'confidence_threshold': 0.65
        }
    ]

    conn = db_users.get_connection()
    cursor = conn.cursor()

    for sector in default_sectors:
        cursor.execute('''
            INSERT INTO user_sector_configs (user_id, sector_id, config_data, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ''', (
            user_id,
            sector['sector_id'],
            json.dumps({
                'name': sector['name'],
                'detection_types': sector['detection_types'],
                'confidence_threshold': sector['confidence_threshold']
            })
        ))

    conn.commit()
    conn.close()


def get_user_by_id(user_id: int) -> Optional[Dict]:
    """
    Get user information by ID
    """
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None
