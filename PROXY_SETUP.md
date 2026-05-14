# 🚀 Camera Proxy Server Setup Guide

This proxy server solves **CORS** and **Mixed Content** issues when connecting to IP cameras from your web application.

## 🎯 What It Does

The proxy server:
- ✅ Accepts requests from your React app (any origin)
- ✅ Forwards them to your IP camera (HTTP)
- ✅ Returns the stream back to your app
- ✅ Adds proper CORS headers
- ✅ Handles MJPEG video streams
- ✅ Works with IP Webcam, DroidCam, and Iriun

---

## 📦 Installation

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server framework
- `cors` - CORS middleware
- `node-fetch` - HTTP client for Node.js

---

## 🚀 Running the Proxy

### Option 1: Run Proxy + App Together (Recommended)

```bash
npm start
```

This runs both:
- **Proxy server** on `http://localhost:3001`
- **Vite dev server** on `http://localhost:5173`

### Option 2: Run Proxy Only

```bash
npm run proxy
```

Then in another terminal:
```bash
npm run dev
```

---

## 🎥 How to Use

### 1. Start Your IP Camera App

On your Android phone:
1. Open **IP Webcam** app
2. Tap **"Start server"**
3. Note the IP address (e.g., `192.168.1.50:8080`)

### 2. Start the Proxy Server

```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🎥 Camera Proxy Server Running                     ║
║                                                       ║
║   Port: 3001                                          ║
║   URL:  http://localhost:3001                        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### 3. Add Camera in the App

1. Open `http://localhost:5173/zero-reason/`
2. Click **"Settings"** → **"Manage Cameras"**
3. Click **"Add Camera"**
4. Fill in:
   - **Camera Name:** My Phone Camera
   - **Camera Type:** Phone Camera
   - **Phone IP:** 192.168.1.50 (your camera IP)
   - **Port:** 8080 (or 4747 for DroidCam)
   - **App:** IP Webcam (8080)
5. Click **"Add Camera"**

### 4. View Live Feed

1. Click **"Live Cameras"** in sidebar
2. Click on your camera card
3. **You should see live video!** 🎉

---

## 🔧 Proxy Endpoints

### Health Check
```
GET http://localhost:3001/health
```
Returns: `{ "status": "ok", "message": "Camera proxy server is running" }`

### Camera Stream
```
GET http://localhost:3001/camera-stream?ip=192.168.1.50&port=8080&app=ipwebcam
```
Parameters:
- `ip` - Camera IP address
- `port` - Camera port (8080 for IP Webcam, 4747 for DroidCam)
- `app` - Camera app type (`ipwebcam`, `droidcam`, `iriun`)

### Camera Snapshot
```
GET http://localhost:3001/camera-snapshot?ip=192.168.1.50&port=8080
```
Returns a single JPEG snapshot

---

## 🐛 Troubleshooting

### Problem: "Camera proxy server not found"

**Solution:** Make sure proxy is running
```bash
npm run proxy
```

### Problem: "Failed to connect to camera"

**Solutions:**
1. Check phone and computer on same Wi-Fi
2. Verify camera IP address in IP Webcam app
3. Test camera URL directly in browser: `http://YOUR_IP:8080`
4. Check proxy server logs in terminal

### Problem: "Port 3001 already in use"

**Solution:** Kill existing process
```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Or change port in proxy-server.js
const PORT = 3002; // Change this line
```

### Problem: Video loads but is black/frozen

**Solutions:**
1. Check IP Webcam video quality settings
2. Try different camera app (DroidCam or Iriun)
3. Restart IP Webcam app
4. Check proxy logs for errors

---

## 🔒 Security Notes

### Current Setup (Development)
- Proxy accepts requests from **any origin** (`*`)
- Good for local development
- **Not secure for production**

### For Production Deployment

Edit `proxy-server.js` to restrict origins:

```javascript
app.use(cors({
  origin: 'https://1999-oxygen.github.io', // Your actual domain
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
```

---

## 🌐 Deploying the Proxy

### Option 1: Same Server as App

Deploy both to services like:
- **Heroku** - Easy Node.js hosting
- **Railway** - Modern deployment platform
- **Render** - Free tier available

### Option 2: Separate Proxy Server

Deploy proxy to:
- **AWS Lambda** (with API Gateway)
- **Google Cloud Run**
- **Vercel Edge Functions**

Then update camera integration to use production proxy URL.

---

## 📝 How It Works

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   React     │  HTTPS  │   Proxy     │  HTTP   │  IP Camera  │
│   App       ├────────→│   Server    ├────────→│  (Phone)    │
│  (Browser)  │←────────┤ (Node.js)   │←────────┤  192.168.x  │
└─────────────┘         └─────────────┘         └─────────────┘
localhost:5173         localhost:3001          192.168.1.50:8080

1. Browser requests: http://localhost:3001/camera-stream?ip=192.168.1.50...
2. Proxy fetches: http://192.168.1.50:8080/video
3. Proxy pipes stream back to browser with CORS headers
4. Browser displays video ✅
```

---

## 🎉 Success!

Once everything is running, you should see:
- ✅ Proxy server logs showing camera connections
- ✅ Live video feed in your app
- ✅ Camera status: "online"
- ✅ No CORS errors in browser console

**Enjoy your camera streaming!** 📱🎥✨
