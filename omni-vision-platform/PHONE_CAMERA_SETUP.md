# 📱 Android Phone as Camera - Complete Setup Guide

## Step 1: Install IP Webcam App

1. **Download from Google Play Store:**
   - App: "IP Webcam" by Pavel Khlebovich (FREE)
   - Alternative: "DroidCam" or "Iriun Webcam"

2. **Open the app** on your Android phone

## Step 2: Connect to Same Wi-Fi

**CRITICAL:** Your phone and computer MUST be on the same Wi-Fi network!

- Phone Wi-Fi: Connect to your home/office Wi-Fi
- Computer Wi-Fi: Connect to the SAME network

## Step 3: Start the Camera Server

1. Open **IP Webcam** app
2. Scroll to bottom
3. Tap **"Start server"**
4. The app will show your camera feed and an IP address like:
   ```
   http://192.168.1.50:8080
   ```

## Step 4: Note Your Phone's Details

Write down:
- **IP Address:** (e.g., 192.168.1.50)
- **Port:** (usually 8080)
- **Full URL:** http://192.168.1.50:8080

## Step 5: Add Camera in OmniVision App

1. Open your OmniVision app: https://1999-oxygen.github.io/zero-reason/
2. Go to **Settings** (sidebar)
3. Scroll to **Camera Management**
4. Click **"Add Camera"**
5. Fill in:
   - **Camera Name:** "My Android Phone"
   - **Camera Type:** Phone Camera
   - **Phone IP:** 192.168.1.50 (your IP)
   - **Port:** 8080
   - **App:** IP Webcam
   - **Location:** "Mobile Monitor"
   - **AI Module:** Choose based on what you're monitoring
6. Click **"Add Camera"**

## Step 6: Test Your Camera

1. Click the **"Test Connection"** button (eye icon)
2. If successful, you'll see "Camera reachable"
3. Your phone camera is now connected! ✅

## Troubleshooting

### ❌ Camera Not Connecting?

**Check these:**

1. **Same Wi-Fi Network?**
   - Phone and computer must be on the same network
   - Check: Phone Settings → Wi-Fi
   - Check: Computer Wi-Fi settings

2. **Firewall Blocking?**
   - Temporarily disable firewall on computer
   - Or allow port 8080

3. **Correct IP Address?**
   - The IP shown in IP Webcam app changes if phone disconnects/reconnects
   - Always use the CURRENT IP shown in the app

4. **IP Webcam Server Running?**
   - Make sure you tapped "Start server" in the app
   - Screen should show live camera feed

### 📹 Camera Stream URLs

**IP Webcam URLs:**
- Video stream: `http://YOUR_IP:8080/video`
- Snapshot: `http://YOUR_IP:8080/shot.jpg`
- Browser view: `http://YOUR_IP:8080`

**DroidCam URLs:**
- Video stream: `http://YOUR_IP:4747/mjpegfeed`

## Advanced Settings (Optional)

In IP Webcam app, you can configure:

1. **Video Quality:**
   - Settings → Video preferences → Quality
   - Recommended: 720p or 480p for smooth streaming

2. **Resolution:**
   - Settings → Video preferences → Resolution
   - Recommended: 1280x720

3. **Password Protection:**
   - Settings → Local broadcasting → Login/password
   - Add username/password for security

4. **Auto-start:**
   - Settings → Behavior on boot
   - Enable to auto-start when phone boots

## Tips for Best Performance

✅ **Do:**
- Keep phone plugged into charger (camera uses battery)
- Position phone with stable mount/stand
- Use good lighting for better AI detection
- Keep phone screen on (or use "Stay Awake" in Developer Options)

❌ **Don't:**
- Don't let phone overheat (take breaks)
- Don't use phone for other tasks while streaming
- Don't move phone frequently during monitoring

## Multiple Cameras

You can add multiple Android phones:
- Each phone needs IP Webcam installed
- Each will have a different IP address
- Add each as a separate camera in Settings

## Security Note

⚠️ **Important:** IP Webcam broadcasts on your local network. 
- Don't expose port 8080 to the internet without VPN
- Use password protection in IP Webcam settings
- Only use on trusted Wi-Fi networks
