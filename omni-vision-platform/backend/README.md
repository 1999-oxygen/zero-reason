# OmniVision Edge Backend

Python FastAPI backend for the OmniVision AI Surveillance Platform.
Replaces `localStorage`, Netlify functions, and the Node camera proxy.

## Architecture (Inspired by "The Brain")

| Component | Tech | Purpose |
|---|---|---|
| **API Server** | FastAPI + Uvicorn | REST endpoints for all frontend services |
| **AI Brain** | YOLO + ByteTrack + Supervision | Real-time object detection & tracking |
| **Database** | SQLite (`omnivision.db`) | Persistent storage (replaces localStorage) |
| **WebSocket** | FastAPI native WS | Real-time video feed + bounding boxes streaming |
| **Camera Proxy** | aiohttp | Proxy MJPEG streams from IP/phone cameras |

## Install

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

> **Note:** `ultralytics` and `supervision` are optional. If not installed, the backend runs in **MOCK mode** with simulated detections.

## Run

```bash
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000
```

The server starts on `http://localhost:8000`.

## API Endpoints

### Health
- `GET /api/health` — Server status & active AI brains

### Sectors / AI Config
- `GET /api/sectors` — All sector configs
- `GET /api/sectors/{id}` — Single sector config
- `POST /api/sectors/{id}` — Update sector config

### Cameras
- `GET /api/cameras` — List cameras
- `POST /api/cameras` — Add camera
- `DELETE /api/cameras/{id}` — Remove camera
- `GET /api/camera-stream?ip=X&port=Y&app=Z` — Proxy MJPEG stream
- `GET /api/camera-snapshot?ip=X&port=Y` — Proxy snapshot

### Alerts
- `GET /api/alerts?sector_id=X&severity=Y&unread_only=1` — List alerts
- `POST /api/alerts` — Create alert
- `POST /api/alerts/{id}/read` — Mark read
- `POST /api/alerts/read-all` — Mark all read
- `DELETE /api/alerts/{id}` — Delete alert
- `GET /api/alerts/stats` — Alert statistics

### POS / Sales
- `GET /api/pos/products` — List products
- `POST /api/pos/products` — Add product
- `POST /api/pos/sales` — Record sale
- `GET /api/pos/daily-summary` — Today's revenue & profit
- `GET /api/pos/sales-history?days=7` — Sales history

### Training Images
- `POST /api/training-images/upload` — Upload image (multipart)
- `GET /api/training-images` — List images
- `GET /api/training-images/{id}` — Get image binary
- `DELETE /api/training-images/{id}` — Delete image

### WebSockets
- `WS /ws/video_feed` — Real-time AI detections + frame preview
- `WS /ws/alerts` — Live alert push stream

### Backup
- `GET /api/export` — Export entire DB as JSON
- `POST /api/import` — Import from JSON backup

## WebSocket Protocol

Connect to `/ws/video_feed` and send a config JSON first:

```json
{"sectorId": "liquor", "cameraUrl": "0", "modelPath": "yolov8n.pt"}
```

The server responds with:

```json
{
  "timestamp": "2026-05-14T20:00:00",
  "sectorId": "liquor",
  "frame_preview": "<hex-encoded-jpeg>",
  "boxes": [
    {"label": "bottle", "confidence": 0.92, "box": [120, 200, 200, 440], "severity": "normal", "in_zone": true}
  ],
  "sales": [{"brand": "Tusker_Lager_500ml", "revenue": 220.0, "profit": 70.0}],
  "alerts": [{"type": "concealment", "title": "Concealment Detected", "severity": "alert"}]
}
```

## Frontend Integration

The React app automatically detects the backend at startup:

1. On load, each service (`sectorAIConfig`, `cameraIntegration`, `posIntegration`) pings `http://localhost:8000/api/health`
2. If online, data is fetched from the backend and synced both ways
3. If offline, everything falls back to `localStorage` (works without the backend)

This means:
- **With backend**: Real SQLite DB, real YOLO detections, real sales logging
- **Without backend**: Pure frontend, localStorage, mock detections (exactly as before)

## Database Schema

Tables:
- `sectors` — AI config per sector
- `cameras` — Camera registry
- `alerts` — Alert feed
- `products` — POS product catalog
- `sales_log` — All sales (POS + AI-detected)
- `training_images` — Uploaded training images
- `detections` — AI inference history
- `video_clips` — Recorded incident clips

## Demo Data

The backend seeds demo products and sector configs on first run:

| Product | Class ID | Buy | Sell |
|---|---|---|---|
| Chrome Vodka 250ml | 39 | KES 180 | KES 250 |
| Tusker Lager 500ml | 41 | KES 150 | KES 220 |
| Johnnie Walker Black | 42 | KES 2800 | KES 3500 |

## Production Notes

- Set `allow_origins=["http://localhost:5173"]` in CORS for security
- Use a systemd service or PM2 to keep the server running
- The SQLite DB is at `backend/omnivision.db` — back it up regularly
- For real YOLO, download weights: `yolov8n.pt`, `yolov8s.pt`, etc.
- Camera zones are pre-configured per sector type in `ai_brain.py`
