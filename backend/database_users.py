"""
User-specific database operations
Extends database.py with multi-user support
"""
import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = Path(__file__).parent / "omnivision.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.Connection(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_user_tables():
    """Create user-specific tables"""
    conn = get_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_id TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            picture TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_login TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # User-specific sector configs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sector_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sector_id TEXT NOT NULL,
            config_data TEXT NOT NULL,  -- JSON
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, sector_id)
        )
    ''')

    # User-specific cameras
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_cameras (
            id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            url TEXT,
            status TEXT DEFAULT 'offline',
            module TEXT DEFAULT 'retail',
            type TEXT DEFAULT 'ip',
            last_seen TEXT,
            resolution TEXT,
            fps INTEGER DEFAULT 30,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, user_id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # User-specific alerts
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sector_id TEXT NOT NULL,
            type TEXT NOT NULL,
            message TEXT,
            severity TEXT DEFAULT 'info',
            camera_id TEXT,
            read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # User-specific training images
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_training_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sector_id TEXT NOT NULL,
            label TEXT,
            image_data BLOB NOT NULL,
            mime_type TEXT DEFAULT 'image/jpeg',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    conn.commit()
    conn.close()


# ============ USER OPERATIONS ============

def create_user(google_id: str, email: str, name: str = None, picture: str = None) -> int:
    """Create new user and return user_id"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO users (google_id, email, name, picture)
        VALUES (?, ?, ?, ?)
    ''', (google_id, email, name, picture))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return user_id


def get_user_by_google_id(google_id: str) -> Optional[Dict]:
    """Get user by Google ID"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE google_id = ?", (google_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_user_login(user_id: int):
    """Update last login timestamp"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
        (user_id,)
    )
    conn.commit()
    conn.close()


# ============ SECTOR CONFIG OPERATIONS ============

def save_user_sector_config(user_id: int, sector_id: str, config: Dict) -> Dict:
    """Save sector configuration for user"""
    conn = get_connection()
    cursor = conn.cursor()
    
    config_json = json.dumps(config)
    cursor.execute('''
        INSERT INTO user_sector_configs (user_id, sector_id, config_data)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, sector_id) DO UPDATE SET
            config_data = excluded.config_data,
            updated_at = CURRENT_TIMESTAMP
    ''', (user_id, sector_id, config_json))
    
    conn.commit()
    conn.close()
    return config


def get_user_sector_configs(user_id: int) -> List[Dict]:
    """Get all sector configs for user"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM user_sector_configs WHERE user_id = ?",
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    configs = []
    for row in rows:
        config = json.loads(row['config_data'])
        config['sector_id'] = row['sector_id']
        config['updated_at'] = row['updated_at']
        configs.append(config)
    return configs


def get_user_sector_config(user_id: int, sector_id: str) -> Optional[Dict]:
    """Get specific sector config for user"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT config_data FROM user_sector_configs WHERE user_id = ? AND sector_id = ?",
        (user_id, sector_id)
    )
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return json.loads(row['config_data'])
    return None


# ============ CAMERA OPERATIONS ============

def save_user_camera(user_id: int, camera: Dict) -> Dict:
    """Save camera for user"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO user_cameras (id, user_id, name, url, status, module, type, resolution, fps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id, user_id) DO UPDATE SET
            name = excluded.name,
            url = excluded.url,
            status = excluded.status,
            module = excluded.module,
            type = excluded.type,
            resolution = excluded.resolution,
            fps = excluded.fps
    ''', (
        camera['id'],
        user_id,
        camera['name'],
        camera.get('url', ''),
        camera.get('status', 'offline'),
        camera.get('module', 'retail'),
        camera.get('type', 'ip'),
        camera.get('resolution', '1920x1080'),
        camera.get('fps', 30)
    ))
    
    conn.commit()
    conn.close()
    return camera


def get_user_cameras(user_id: int) -> List[Dict]:
    """Get all cameras for user"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_cameras WHERE user_id = ?", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_user_camera(user_id: int, camera_id: str):
    """Delete camera for user"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM user_cameras WHERE user_id = ? AND id = ?",
        (user_id, camera_id)
    )
    conn.commit()
    conn.close()


# ============ ALERT OPERATIONS ============

def save_user_alert(user_id: int, alert: Dict) -> int:
    """Save alert for user"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO user_alerts (user_id, sector_id, type, message, severity, camera_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        alert.get('sector_id', 'retail'),
        alert['type'],
        alert.get('message', ''),
        alert.get('severity', 'info'),
        alert.get('camera_id', '')
    ))
    
    conn.commit()
    alert_id = cursor.lastrowid
    conn.close()
    return alert_id


def get_user_alerts(user_id: int, unread_only: bool = False) -> List[Dict]:
    """Get alerts for user"""
    conn = get_connection()
    cursor = conn.cursor()
    
    if unread_only:
        cursor.execute(
            "SELECT * FROM user_alerts WHERE user_id = ? AND read = 0 ORDER BY created_at DESC",
            (user_id,)
        )
    else:
        cursor.execute(
            "SELECT * FROM user_alerts WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        )
    
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def mark_user_alert_read(user_id: int, alert_id: int):
    """Mark alert as read"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE user_alerts SET read = 1 WHERE user_id = ? AND id = ?",
        (user_id, alert_id)
    )
    conn.commit()
    conn.close()


# ============ TRAINING IMAGE OPERATIONS ============

def save_user_training_image(user_id: int, sector_id: str, label: str, image_data: bytes, mime_type: str = 'image/jpeg') -> int:
    """Save training image for user"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO user_training_images (user_id, sector_id, label, image_data, mime_type)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, sector_id, label, image_data, mime_type))
    
    conn.commit()
    image_id = cursor.lastrowid
    conn.close()
    return image_id


def get_user_training_images(user_id: int, sector_id: str = None) -> List[Dict]:
    """Get training images for user"""
    conn = get_connection()
    cursor = conn.cursor()
    
    if sector_id:
        cursor.execute(
            "SELECT id, sector_id, label, mime_type, created_at FROM user_training_images WHERE user_id = ? AND sector_id = ?",
            (user_id, sector_id)
        )
    else:
        cursor.execute(
            "SELECT id, sector_id, label, mime_type, created_at FROM user_training_images WHERE user_id = ?",
            (user_id,)
        )
    
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_user_training_image_data(user_id: int, image_id: int) -> Optional[Dict]:
    """Get training image data"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM user_training_images WHERE user_id = ? AND id = ?",
        (user_id, image_id)
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_user_training_image(user_id: int, image_id: int):
    """Delete training image"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM user_training_images WHERE user_id = ? AND id = ?",
        (user_id, image_id)
    )
    conn.commit()
    conn.close()
