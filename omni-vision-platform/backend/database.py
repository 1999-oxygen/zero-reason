"""
OmniVision SQLite Database Layer
Replaces localStorage with a real on-disk database.
"""
import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = Path(__file__).parent / "omnivision.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Create all tables if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()

    # --- Sectors & AI Configuration ---
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sectors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            ml_model_url TEXT,
            ml_model_type TEXT DEFAULT 'roboflow',
            detection_types TEXT,          -- JSON array
            confidence_threshold REAL DEFAULT 0.75,
            special_rules TEXT,            -- JSON object
            custom_database TEXT,          -- JSON object
            updated_at TEXT
        )
    ''')

    # --- Training Images ---
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS training_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sector_id TEXT NOT NULL,
            label TEXT,
            image_data BLOB NOT NULL,
            mime_type TEXT DEFAULT 'image/jpeg',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sector_id) REFERENCES sectors(id)
        )
    ''')

    # --- Cameras ---
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cameras (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT,
            status TEXT DEFAULT 'offline',
            module TEXT DEFAULT 'retail',
            type TEXT DEFAULT 'ip',
            last_seen TEXT,
            resolution TEXT,
            fps INTEGER DEFAULT 30
        )
    ''')

    # --- Alerts ---
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sector_id TEXT NOT NULL,
            alert_type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            severity TEXT DEFAULT 'info',   -- alert | warning | info
            camera_id TEXT,
            read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sector_id) REFERENCES sectors(id)
        )
    ''')

    # --- POS / Sales Log ---
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id INTEGER UNIQUE,
            brand_name TEXT NOT NULL,
            buying_price REAL,
            selling_price REAL,
            category TEXT,
            stock INTEGER DEFAULT 0
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            brand_name TEXT,
            revenue REAL,
            profit REAL,
            quantity INTEGER DEFAULT 1,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            camera_id TEXT,
            detected INTEGER DEFAULT 0,     -- 1 if AI detected, 0 if manual/POS
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    ''')

    # --- Video Clips ---
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS video_clips (
            id TEXT PRIMARY KEY,
            camera_id TEXT,
            start_time TEXT,
            end_time TEXT,
            status TEXT DEFAULT 'Normal',   -- Normal | Suspicious | Confirmed
            path TEXT,
            size_mb REAL,
            thumbnail BLOB
        )
    ''')

    # --- AI Detections (inference history) ---
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id TEXT,
            sector_id TEXT,
            label TEXT,
            confidence REAL,
            bbox TEXT,                      -- JSON [x, y, w, h]
            severity TEXT,
            frame_time TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ Database initialized at", DB_PATH)


# ── Sector Config CRUD ──
def get_sector_config(sector_id: str) -> Optional[Dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sectors WHERE id = ?", (sector_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return _row_to_dict(row)


def get_all_sector_configs() -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sectors")
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def save_sector_config(sector_id: str, data: Dict) -> Dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO sectors (id, name, enabled, ml_model_url, ml_model_type,
                             detection_types, confidence_threshold, special_rules,
                             custom_database, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            enabled=excluded.enabled,
            ml_model_url=excluded.ml_model_url,
            ml_model_type=excluded.ml_model_type,
            detection_types=excluded.detection_types,
            confidence_threshold=excluded.confidence_threshold,
            special_rules=excluded.special_rules,
            custom_database=excluded.custom_database,
            updated_at=excluded.updated_at
    ''', (
        sector_id,
        data.get('name', sector_id),
        int(data.get('enabled', True)),
        data.get('mlModelUrl'),
        data.get('mlModelType', 'roboflow'),
        json.dumps(data.get('detectionTypes', [])),
        data.get('confidenceThreshold', 0.75),
        json.dumps(data.get('specialRules', {})),
        json.dumps(data.get('customDatabase', {})),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()
    return get_sector_config(sector_id)


# ── Alerts CRUD ──
def create_alert(sector_id: str, alert_type: str, title: str,
                 description: str = "", severity: str = "info",
                 camera_id: str = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO alerts (sector_id, alert_type, title, description, severity, camera_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (sector_id, alert_type, title, description, severity, camera_id))
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return alert_id


def get_alerts(limit: int = 200, sector_id: str = None,
               severity: str = None, unread_only: bool = False) -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM alerts WHERE 1=1"
    params = []
    if sector_id:
        query += " AND sector_id = ?"
        params.append(sector_id)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if unread_only:
        query += " AND read = 0"
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def mark_alert_read(alert_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET read = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()


def mark_all_alerts_read():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET read = 1")
    conn.commit()
    conn.close()


def delete_alert(alert_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()


def get_alert_stats() -> Dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM alerts")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE severity = 'alert'")
    critical = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE severity = 'warning'")
    warnings = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE read = 0")
    unread = cursor.fetchone()[0]
    cursor.execute("SELECT sector_id, COUNT(*) FROM alerts GROUP BY sector_id")
    by_sector = {r[0]: r[1] for r in cursor.fetchall()}
    conn.close()
    return {"total": total, "critical": critical, "warnings": warnings,
            "unread": unread, "by_sector": by_sector}


# ── Cameras CRUD ──
def get_cameras() -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cameras")
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def save_camera(data: Dict) -> Dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO cameras (id, name, url, status, module, type, resolution, fps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name,
            url=excluded.url,
            status=excluded.status,
            module=excluded.module,
            type=excluded.type,
            resolution=excluded.resolution,
            fps=excluded.fps
    ''', (
        data['id'], data.get('name', ''), data.get('url', ''),
        data.get('status', 'offline'), data.get('module', 'retail'),
        data.get('type', 'ip'), data.get('resolution', '1920x1080'),
        data.get('fps', 30)
    ))
    conn.commit()
    conn.close()
    return data


def delete_camera(camera_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM cameras WHERE id = ?", (camera_id,))
    conn.commit()
    conn.close()


# ── Products / POS CRUD ──
def get_products() -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def add_product(class_id: int, brand_name: str, buying_price: float,
                selling_price: float, category: str = "", stock: int = 0):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO products (class_id, brand_name, buying_price, selling_price, category, stock)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(class_id) DO UPDATE SET
            brand_name=excluded.brand_name,
            buying_price=excluded.buying_price,
            selling_price=excluded.selling_price,
            category=excluded.category,
            stock=excluded.stock
    ''', (class_id, brand_name, buying_price, selling_price, category, stock))
    conn.commit()
    conn.close()


def record_sale(product_id: int = None, brand_name: str = None,
                revenue: float = 0, profit: float = 0,
                camera_id: str = None, detected: bool = False) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO sales_log (product_id, brand_name, revenue, profit, camera_id, detected)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (product_id, brand_name, revenue, profit, camera_id, int(detected)))
    sale_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return sale_id


def get_daily_summary() -> Dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT SUM(revenue), SUM(profit), COUNT(*) FROM sales_log
        WHERE date(timestamp) = date('now')
    ''')
    row = cursor.fetchone()
    conn.close()
    return {"today_revenue": row[0] or 0, "today_profit": row[1] or 0, "today_sales": row[2] or 0}


def get_sales_history(days: int = 7) -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT date(timestamp) as day, SUM(revenue) as rev, SUM(profit) as prof, COUNT(*) as count
        FROM sales_log
        WHERE timestamp >= date('now', ?)
        GROUP BY day ORDER BY day DESC
    ''', (f'-{days} days',))
    rows = cursor.fetchall()
    conn.close()
    return [{"day": r[0], "revenue": r[1], "profit": r[2], "count": r[3]} for r in rows]


# ── Training Images CRUD ──
def save_training_image(sector_id: str, label: str, image_data: bytes,
                        mime_type: str = "image/jpeg") -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO training_images (sector_id, label, image_data, mime_type)
        VALUES (?, ?, ?, ?)
    ''', (sector_id, label, image_data, mime_type))
    img_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return img_id


def get_training_images(sector_id: str = None, label: str = None) -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT id, sector_id, label, mime_type, created_at FROM training_images WHERE 1=1"
    params = []
    if sector_id:
        query += " AND sector_id = ?"
        params.append(sector_id)
    if label:
        query += " AND label = ?"
        params.append(label)
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def get_training_image_data(image_id: int) -> Optional[bytes]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT image_data, mime_type FROM training_images WHERE id = ?", (image_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"data": row["image_data"], "mime_type": row["mime_type"]}
    return None


def delete_training_image(image_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM training_images WHERE id = ?", (image_id,))
    conn.commit()
    conn.close()


def get_training_stats() -> Dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM training_images")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(DISTINCT label) FROM training_images WHERE label IS NOT NULL AND label != ''")
    labeled = cursor.fetchone()[0]
    cursor.execute("SELECT sector_id, COUNT(*) FROM training_images GROUP BY sector_id")
    by_sector = {r[0]: r[1] for r in cursor.fetchall()}
    conn.close()
    return {"total": total, "labeled": labeled, "unlabeled": total - labeled,
            "unique_labels": labeled, "by_sector": by_sector}


# ── Detections CRUD ──
def save_detection(camera_id: str, sector_id: str, label: str,
                   confidence: float, bbox: List[float], severity: str = "info"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO detections (camera_id, sector_id, label, confidence, bbox, severity)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (camera_id, sector_id, label, confidence, json.dumps(bbox), severity))
    conn.commit()
    conn.close()


def get_recent_detections(limit: int = 100) -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM detections ORDER BY frame_time DESC LIMIT ?
    ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


# ── Utilities ──
def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    d = dict(row)
    # Auto-parse JSON columns
    for key in ['detection_types', 'special_rules', 'custom_database', 'bbox']:
        if key in d and isinstance(d[key], str):
            try:
                d[key] = json.loads(d[key])
            except json.JSONDecodeError:
                pass
    # Convert int booleans
    for key in ['enabled', 'read', 'detected']:
        if key in d:
            d[key] = bool(d[key])
    return d


def seed_demo_data():
    """Insert demo sectors and products if tables are empty."""
    conn = get_connection()
    cursor = conn.cursor()

    # Seed sectors
    cursor.execute("SELECT COUNT(*) FROM sectors")
    if cursor.fetchone()[0] == 0:
        demo_sectors = [
            ("retail", "Retail & Shoes", 1, None, "roboflow",
             json.dumps(["person", "shoes", "bag", "concealment"]), 0.75,
             json.dumps({"theftDetection": True}), json.dumps({}), datetime.now().isoformat()),
            ("liquor", "Liquor Stores", 1, None, "roboflow",
             json.dumps(["bottle", "person", "concealment", "age_check"]), 0.80,
             json.dumps({"theftDetection": True, "ageVerification": True}),
             json.dumps({}), datetime.now().isoformat()),
            ("clubs", "Clubs & Nightlife", 1, None, "roboflow",
             json.dumps(["person", "crowd", "fight", "intoxication"]), 0.70,
             json.dumps({"crowdDensity": True, "violenceDetection": True}),
             json.dumps({}), datetime.now().isoformat()),
            ("security", "Facility Security", 1, None, "roboflow",
             json.dumps(["person", "weapon", "intrusion"]), 0.85,
             json.dumps({"perimeterAlert": True}), json.dumps({}), datetime.now().isoformat()),
            ("hospitality", "Hotels & Dining", 1, None, "roboflow",
             json.dumps(["person", "table", "unpaid_exit"]), 0.75,
             json.dumps({"dineDashDetection": True}), json.dumps({}), datetime.now().isoformat()),
            ("education", "Education & Wellness", 1, None, "roboflow",
             json.dumps(["person", "student", "loitering"]), 0.70,
             json.dumps({"welfareCheck": True}), json.dumps({}), datetime.now().isoformat()),
            ("agriculture", "Livestock & Farms", 1, None, "roboflow",
             json.dumps(["cow", "sheep", "predator", "lethargic"]), 0.65,
             json.dumps({"animalHealth": True}), json.dumps({}), datetime.now().isoformat()),
        ]
        cursor.executemany('''
            INSERT INTO sectors (id, name, enabled, ml_model_url, ml_model_type,
                                 detection_types, confidence_threshold, special_rules,
                                 custom_database, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', demo_sectors)

    # Seed products
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        demo_products = [
            (39, "Chrome_Vodka_250ml", 180.0, 250.0, "liquor", 24),
            (41, "Tusker_Lager_500ml", 150.0, 220.0, "liquor", 48),
            (42, "Johnnie_Walker_Black_750ml", 2800.0, 3500.0, "liquor", 12),
            (43, "Smirnoff_Ice_300ml", 120.0, 180.0, "liquor", 36),
        ]
        cursor.executemany('''
            INSERT INTO products (class_id, brand_name, buying_price, selling_price, category, stock)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', demo_products)

    conn.commit()
    conn.close()
    print("✅ Demo data seeded.")
