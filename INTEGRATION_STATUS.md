# OmniVision Backend Integration Status

## ✅ Fully Integrated Components

### 1. Camera Management (All 7 Sectors)
**Status:** ✅ WORKING
- **Frontend:** `src/services/cameraIntegration.js`
- **Backend:** `/api/cameras` (GET, POST, DELETE)
- **Database:** SQLite `cameras` table with `module` column
- **Features:**
  - Add cameras for any sector (retail, hospitality, liquor, clubs, security, education, agriculture)
  - Cameras persist in SQLite database
  - Sector filtering works correctly
  - Backend sync on add/remove

**Test:**
```bash
# Add camera for liquor sector
curl -X POST http://localhost:8000/api/cameras \
  -H "Content-Type: application/json" \
  -d '{"id":"test_liquor","name":"Liquor Cam","type":"webcam","module":"liquor","status":"offline"}'

# List all cameras
curl http://localhost:8000/api/cameras
```

### 2. Sector AI Configuration
**Status:** ✅ WORKING
- **Frontend:** `src/services/sectorAIConfig.js`
- **Backend:** `/api/sectors` (GET), `/api/sectors/{id}` (POST)
- **Database:** SQLite `sector_configs` table
- **Features:**
  - Load sector configs from backend on startup
  - Push config updates to backend
  - Fallback to localStorage when offline

### 3. Alerts Dashboard
**Status:** ✅ WORKING
- **Frontend:** `src/components/AlertsDashboard.jsx`
- **Backend:** `/api/alerts` (GET, POST), `/api/alerts/stats` (GET)
- **Database:** SQLite `alerts` table
- **Features:**
  - Fetch alerts from backend
  - Mark as read/dismiss syncs to backend
  - Backend status indicator in UI

### 4. POS Integration
**Status:** ✅ WORKING
- **Frontend:** `src/services/posIntegration.js`
- **Backend:** `/api/pos/daily-summary`, `/api/pos/sales-history`, `/api/pos/products`
- **Database:** SQLite `sales_log`, `products` tables
- **Features:**
  - Fetch daily sales summary
  - Record AI-detected sales
  - Product catalog from backend
  - Defensive rendering (no crashes on missing fields)

### 5. Training Images
**Status:** ✅ WORKING (Just Integrated)
- **Frontend:** `src/components/TrainingImageManager.jsx`
- **Backend:** `/api/training-images/upload` (POST), `/api/training-images` (GET), `/api/training-images/{id}` (GET, DELETE)
- **Database:** SQLite `training_images` table
- **Features:**
  - Upload images via FormData
  - Display images from backend endpoint
  - Delete images from backend
  - Fallback to localStorage when offline

## ⚠️ Partially Integrated / Needs Testing

### 6. AI Detection Overlay (WebSocket)
**Status:** ⚠️ NEEDS TESTING
- **Frontend:** `src/components/AIDetectionOverlay.jsx`
- **Backend:** `/ws/video_feed` WebSocket
- **Features:**
  - Connects to backend AI brain via WebSocket
  - Sends `{sectorId, cameraUrl, modelPath}` on connect
  - Receives real-time bounding boxes
  - Falls back to mock detections if backend disconnected
  - **Issue:** Requires actual camera feed to test

**Test:**
```javascript
// In browser console on Live Cameras page
// Check if WebSocket connects
videoFeedWS.connect('retail', '0');
```

### 7. Alerts WebSocket
**Status:** ⚠️ NEEDS TESTING
- **Backend:** `/ws/alerts` WebSocket
- **Frontend:** Not currently used (alerts fetched via REST)
- **Note:** Backend has WebSocket endpoint but frontend doesn't subscribe yet

## 🔧 Configuration Required

### Camera Setup for Real Feeds
1. **Webcam:** Works automatically (uses device camera)
2. **IP Camera:** Requires camera URL (e.g., `http://192.168.1.100:8080/video`)
3. **Phone Camera:** Requires:
   - Phone and computer on same WiFi
   - IP Webcam/DroidCam app running on phone
   - Phone IP address (e.g., `192.168.1.50`)
   - Correct port (8080 for IP Webcam, 4747 for DroidCam)

### AI Brain (YOLO Detection)
- **Status:** Backend has YOLO support but requires:
  - `ultralytics` package installed
  - YOLO model file (default: `yolov8n.pt`)
  - Gracefully degrades to mock mode if unavailable

## 📊 Backend Endpoints Summary

| Endpoint | Method | Status | Frontend Integration |
|----------|--------|--------|---------------------|
| `/api/health` | GET | ✅ | apiClient |
| `/api/sectors` | GET | ✅ | sectorAIConfig |
| `/api/sectors/{id}` | POST | ✅ | sectorAIConfig |
| `/api/cameras` | GET, POST | ✅ | cameraIntegration |
| `/api/cameras/{id}` | DELETE | ✅ | cameraIntegration |
| `/api/alerts` | GET, POST | ✅ | AlertsDashboard |
| `/api/alerts/stats` | GET | ✅ | AlertsDashboard |
| `/api/pos/daily-summary` | GET | ✅ | posIntegration |
| `/api/pos/sales-history` | GET | ✅ | posIntegration |
| `/api/pos/products` | GET | ✅ | posIntegration |
| `/api/pos/sales` | POST | ✅ | posIntegration |
| `/api/training-images/upload` | POST | ✅ | TrainingImageManager |
| `/api/training-images` | GET | ✅ | TrainingImageManager |
| `/api/training-images/{id}` | GET, DELETE | ✅ | TrainingImageManager |
| `/api/export` | GET | ✅ | Not used in UI yet |
| `/ws/video_feed` | WebSocket | ⚠️ | AIDetectionOverlay |
| `/ws/alerts` | WebSocket | ⚠️ | Not integrated |

## 🚀 How to Use

### Start Both Servers
```bash
# Terminal 1: Backend
cd backend
python3 main.py

# Terminal 2: Frontend
npm run dev
```

### Add Cameras for Each Sector
1. Click sector in sidebar (e.g., "Liquor Stores")
2. Go to **Settings → Camera Management → Add Camera**
3. Fill in details (name, type, location)
4. **AI Module / Sector** auto-selects current sector
5. Click **Add Camera**
6. Camera saved to SQLite with correct `module`

### Upload Training Images
1. Go to **Settings → Sector AI Configuration**
2. Select a sector
3. Scroll to **Custom Training Database**
4. Drag & drop images or click to upload
5. Images saved to backend SQLite

### View Live Cameras
1. Switch to sector in sidebar
2. Go to **Live Cameras** view
3. See only cameras for that sector
4. Click camera to view full screen
5. AI detections overlay (mock or real if backend connected)

## 🐛 Known Issues & Fixes

### ✅ FIXED: Blank screen when clicking "Add Camera"
- **Cause:** POS stats from backend missing `topEmployee` field
- **Fix:** Added defensive rendering with `??` and `?.` operators

### ✅ FIXED: Cameras always defaulted to "retail"
- **Cause:** `newCamera.module` hardcoded to `'retail'`
- **Fix:** Defaults to `activeModule` (current sector)

### ✅ FIXED: Added cameras "disappeared"
- **Cause:** `initializeCameras` loaded mock data instead of backend
- **Fix:** Now awaits backend sync before loading

### ✅ FIXED: Camera add/remove not awaiting async calls
- **Cause:** Missing `await` on `addCamera()` and `removeCamera()`
- **Fix:** Made handlers async and added `await`

## 📝 Next Steps

1. **Test WebSocket video feed** with real camera
2. **Test AI detections** with YOLO model
3. **Add alerts WebSocket** subscription to frontend
4. **Add export functionality** to UI
5. **Add camera status monitoring** (online/offline detection)

## 🔒 Security Notes

- Backend runs on `localhost:8000` (not exposed to internet)
- CORS enabled for `localhost:5173` only
- No authentication (local development only)
- For production: Add auth, HTTPS, rate limiting
