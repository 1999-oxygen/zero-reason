"""
OmniVision Edge Server
FastAPI backend that replaces localStorage, Netlify functions, and Node proxy.
Inspired by 'the brain' — adapted for all 7 sectors.

Run:  python main.py
      uvicorn main:app --host 0.0.0.0 --port 8000
"""
import asyncio
import json
from pathlib import Path
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn

# Optional heavy imports — backend works without them (mock mode)
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("⚠️ opencv-python not installed — video processing disabled")

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    print("⚠️ numpy not installed — using lists instead")

# Our modules
import database as db

try:
    from ai_brain import BrainManager, SectorAIBrain, ZoneConfig
    AI_BRAIN_AVAILABLE = True
except ImportError as e:
    AI_BRAIN_AVAILABLE = False
    print(f"⚠️ AI Brain not available: {e} — running in API-only mode")

# ── Init ──
app = FastAPI(title="OmniVision Edge Server", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB + demo data on startup
db.init_database()
db.seed_demo_data()

# Brain manager (one brain per active sector)
brain_mgr = BrainManager() if AI_BRAIN_AVAILABLE else None


# ═══════════════════════════════════════════════════════════════
#  HEALTH & STATUS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "mode": "edge",
        "time": datetime.now().isoformat(),
        "active_brains": brain_mgr.list() if brain_mgr else []
    }


# ═══════════════════════════════════════════════════════════════
#  SECTORS / AI CONFIG
# ═══════════════════════════════════════════════════════════════

@app.get("/api/sectors")
def get_sectors():
    return db.get_all_sector_configs()


@app.get("/api/sectors/{sector_id}")
def get_sector(sector_id: str):
    cfg = db.get_sector_config(sector_id)
    if not cfg:
        return JSONResponse(status_code=404, content={"error": "Sector not found"})
    return cfg


@app.post("/api/sectors/{sector_id}")
def update_sector(sector_id: str, data: dict):
    cfg = db.save_sector_config(sector_id, data)
    return cfg


@app.delete("/api/sectors/{sector_id}")
def delete_sector(sector_id: str):
    # Soft delete: mark disabled
    cfg = db.get_sector_config(sector_id)
    if cfg:
        cfg["enabled"] = False
        db.save_sector_config(sector_id, cfg)
    return {"ok": True}


# ═══════════════════════════════════════════════════════════════
#  CAMERAS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/cameras")
def list_cameras():
    return db.get_cameras()


@app.post("/api/cameras")
def add_camera(data: dict):
    return db.save_camera(data)


@app.delete("/api/cameras/{camera_id}")
def remove_camera(camera_id: str):
    db.delete_camera(camera_id)
    return {"ok": True}


# Camera stream proxy (replaces Node proxy-server.js)
@app.get("/api/camera-stream")
async def camera_stream(ip: str = "192.168.1.50", port: int = 8080, app_type: str = "ipwebcam"):
    """Proxy MJPEG stream from IP camera."""
    stream_paths = {"droidcam": "/mjpegfeed", "ipwebcam": "/video", "iriun": "/video"}
    path = stream_paths.get(app_type.lower(), "/video")
    camera_url = f"http://{ip}:{port}{path}"

    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(camera_url, headers={"Accept": "multipart/x-mixed-replace, image/jpeg, */*"}) as resp:
            if resp.status != 200:
                return JSONResponse(status_code=resp.status, content={"error": "Camera unreachable"})

            async def stream_generator():
                async for chunk in resp.content.iter_chunked(8192):
                    yield chunk

            return StreamingResponse(stream_generator(), media_type=resp.headers.get("content-type", "multipart/x-mixed-replace; boundary=frame"))


# Snapshot proxy
@app.get("/api/camera-snapshot")
async def camera_snapshot(ip: str = "192.168.1.50", port: int = 8080):
    camera_url = f"http://{ip}:{port}/shot.jpg"
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(camera_url) as resp:
            if resp.status != 200:
                return JSONResponse(status_code=resp.status, content={"error": "Snapshot failed"})
            data = await resp.read()
            return StreamingResponse(iter([data]), media_type="image/jpeg")


# ═══════════════════════════════════════════════════════════════
#  ALERTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/alerts")
def list_alerts(sector_id: Optional[str] = None, severity: Optional[str] = None,
                unread_only: bool = False, limit: int = 200):
    return db.get_alerts(limit=limit, sector_id=sector_id, severity=severity, unread_only=unread_only)


@app.post("/api/alerts")
def create_alert(data: dict):
    alert_id = db.create_alert(
        sector_id=data.get("sectorId", "retail"),
        alert_type=data.get("type", "generic"),
        title=data.get("title", "Alert"),
        description=data.get("description", ""),
        severity=data.get("severity", "info"),
        camera_id=data.get("cameraId")
    )
    return {"id": alert_id, "created": True}


@app.post("/api/alerts/{alert_id}/read")
def read_alert(alert_id: int):
    db.mark_alert_read(alert_id)
    return {"ok": True}


@app.post("/api/alerts/read-all")
def read_all_alerts():
    db.mark_all_alerts_read()
    return {"ok": True}


@app.delete("/api/alerts/{alert_id}")
def delete_alert_endpoint(alert_id: int):
    db.delete_alert(alert_id)
    return {"ok": True}


@app.get("/api/alerts/stats")
def alert_stats():
    return db.get_alert_stats()


# ═══════════════════════════════════════════════════════════════
#  POS / SALES
# ═══════════════════════════════════════════════════════════════

@app.get("/api/pos/products")
def get_products():
    return db.get_products()


@app.post("/api/pos/products")
def add_product(data: dict):
    db.add_product(
        class_id=data.get("classId", 0),
        brand_name=data["brandName"],
        buying_price=data.get("buyingPrice", 0),
        selling_price=data.get("sellingPrice", 0),
        category=data.get("category", ""),
        stock=data.get("stock", 0)
    )
    return {"ok": True}


@app.post("/api/pos/sales")
def record_sale(data: dict):
    sale_id = db.record_sale(
        product_id=data.get("productId"),
        brand_name=data.get("brandName"),
        revenue=data.get("revenue", 0),
        profit=data.get("profit", 0),
        camera_id=data.get("cameraId"),
        detected=data.get("detected", False)
    )
    return {"id": sale_id, "recorded": True}


@app.get("/api/pos/daily-summary")
def daily_summary():
    return db.get_daily_summary()


@app.get("/api/pos/sales-history")
def sales_history(days: int = 7):
    return db.get_sales_history(days)


# ═══════════════════════════════════════════════════════════════
#  TRAINING IMAGES
# ═══════════════════════════════════════════════════════════════

@app.post("/api/training-images/upload")
async def upload_image(
    file: UploadFile = File(...),
    sector_id: str = Form(...),
    label: Optional[str] = Form(None)
):
    contents = await file.read()
    mime = file.content_type or "image/jpeg"
    img_id = db.save_training_image(sector_id, label, contents, mime)
    return {"id": img_id, "sectorId": sector_id, "label": label, "status": "saved"}


@app.get("/api/training-images")
def list_training_images(sector_id: Optional[str] = None, label: Optional[str] = None):
    return db.get_training_images(sector_id, label)


@app.get("/api/training-images/{image_id}")
def get_image(image_id: int):
    img = db.get_training_image_data(image_id)
    if not img:
        return JSONResponse(status_code=404, content={"error": "Image not found"})
    return StreamingResponse(iter([img["data"]]), media_type=img["mime_type"])


@app.delete("/api/training-images/{image_id}")
def remove_training_image(image_id: int):
    db.delete_training_image(image_id)
    return {"ok": True}


@app.get("/api/training-images/stats")
def training_stats():
    return db.get_training_stats()


# ═══════════════════════════════════════════════════════════════
#  DETECTIONS HISTORY
# ═══════════════════════════════════════════════════════════════

@app.get("/api/detections")
def get_detections(limit: int = 100):
    return db.get_recent_detections(limit)


# ═══════════════════════════════════════════════════════════════
#  WEBSOCKET — REAL-TIME AI FEED
# ═══════════════════════════════════════════════════════════════

@app.websocket("/ws/video_feed")
async def video_feed_ws(websocket: WebSocket):
    await websocket.accept()
    cap = None
    current_sector = "retail"
    current_brain = None

    try:
        # Wait for config message from React
        msg = await websocket.receive_text()
        config = json.loads(msg)
        current_sector = config.get("sectorId", "retail")
        camera_source = config.get("cameraUrl", "0")  # "0" = webcam, or RTSP/IP URL
        model_path = config.get("modelPath", "yolov8n.pt")

        # Init brain for this sector
        current_brain = brain_mgr.get_or_create(current_sector, model_path) if brain_mgr else None

        # Open video source
        if not CV2_AVAILABLE:
            await websocket.send_text(json.dumps({"error": "opencv-python not installed — video feed unavailable"}))
            return
        if camera_source == "0" or camera_source == "":
            cap = cv2.VideoCapture(0)
        else:
            cap = cv2.VideoCapture(camera_source)

        if not cap.isOpened():
            await websocket.send_text(json.dumps({"error": "Cannot open camera", "source": camera_source}))
            return

        await websocket.send_text(json.dumps({"status": "connected", "sector": current_sector}))

        while True:
            ret, frame = cap.read()
            if not ret:
                await asyncio.sleep(0.1)
                continue

            # Run AI inference
            result = current_brain.process_frame(frame) if current_brain else {"boxes": [], "sales": [], "alerts": []}

            # Optionally compress frame for preview (base64 JPEG)
            small = cv2.resize(frame, (320, 240))
            _, buf = cv2.imencode(".jpg", small, [cv2.IMWRITE_JPEG_QUALITY, 60])
            frame_b64 = buf.tobytes().hex()

            payload = {
                "timestamp": datetime.now().isoformat(),
                "sectorId": current_sector,
                "frame_preview": frame_b64,      # hex-encoded small JPEG
                "boxes": result["boxes"],
                "sales": result["sales"],
                "alerts": result["alerts"]
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(0.033)  # ~30 FPS cap

    except WebSocketDisconnect:
        print(f"🔌 Client disconnected from {current_sector}")
    except Exception as e:
        print(f"❌ WS error: {e}")
        try:
            await websocket.send_text(json.dumps({"error": str(e)}))
        except:
            pass
    finally:
        if cap:
            cap.release()


@app.websocket("/ws/alerts")
async def alerts_ws(websocket: WebSocket):
    """Live alert stream — pushes new alerts as they happen."""
    await websocket.accept()
    try:
        while True:
            # Check for new unread alerts every 2 seconds
            alerts = db.get_alerts(unread_only=True, limit=10)
            if alerts:
                await websocket.send_text(json.dumps({"alerts": alerts}))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass


# ═══════════════════════════════════════════════════════════════
#  IMPORT / EXPORT (for config backup)
# ═══════════════════════════════════════════════════════════════

@app.get("/api/export")
def export_all():
    """Export entire database state as JSON for backup."""
    return {
        "sectors": db.get_all_sector_configs(),
        "cameras": db.get_cameras(),
        "products": db.get_products(),
        "alerts": db.get_alerts(limit=1000),
        "detections": db.get_recent_detections(500),
        "training_stats": db.get_training_stats(),
        "exported_at": datetime.now().isoformat()
    }


@app.post("/api/import")
def import_all(data: dict):
    """Import database state from JSON backup."""
    for sec in data.get("sectors", []):
        db.save_sector_config(sec["id"], sec)
    for cam in data.get("cameras", []):
        db.save_camera(cam)
    for prod in data.get("products", []):
        db.add_product(
            prod.get("class_id", 0), prod["brand_name"],
            prod.get("buying_price", 0), prod.get("selling_price", 0),
            prod.get("category", ""), prod.get("stock", 0)
        )
    return {"imported": True}


# ═══════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🧠 OmniVision Edge Server v2.0                           ║
║   Python FastAPI + YOLO + SQLite + WebSocket                 ║
║                                                              ║
║   Local URL:  http://localhost:8000                         ║
║   API Docs:   http://localhost:8000/docs                    ║
║                                                              ║
║   Endpoints:                                                 ║
║   • GET  /api/health                                        ║
║   • GET  /api/sectors                                       ║
║   • GET  /api/cameras                                       ║
║   • GET  /api/alerts                                        ║
║   • POST /api/pos/sales                                     ║
║   • GET  /api/pos/daily-summary                             ║
║   • WS   /ws/video_feed                                     ║
║   • WS   /ws/alerts                                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8000)
