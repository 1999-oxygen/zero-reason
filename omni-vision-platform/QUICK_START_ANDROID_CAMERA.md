# 🚀 Quick Start: Using Your Android Phone as a Camera

## ✅ What You'll Get
- Live camera feed from your Android phone
- Real-time AI monitoring
- Multi-camera support
- Cloud-based viewing from any device

---

## 📱 Step-by-Step Setup (5 Minutes)

### **1. Install IP Webcam on Your Android Phone**

📥 **Download:**
- Open **Google Play Store**
- Search: **"IP Webcam"**
- Install app by **Pavel Khlebovich** (FREE)

### **2. Connect Phone to Same Wi-Fi**

⚠️ **CRITICAL:** Phone and computer MUST be on same network!
- Check phone Wi-Fi settings
- Connect to your home/office Wi-Fi

### **3. Start Camera Server on Phone**

1. Open **IP Webcam** app
2. Scroll to bottom
3. Tap **"Start server"**
4. Note the IP address shown (e.g., `192.168.1.50:8080`)

### **4. Add Camera in OmniVision App**

1. Go to: **https://1999-oxygen.github.io/zero-reason/**
2. Click **"Live Cameras"** in sidebar
3. Click **"Manage Cameras"**
4. Scroll to **Camera Management**
5. Click **"Add Camera"** button

**Fill in:**
```
Camera Name: My Android Phone
Camera Type: Phone Camera
Phone IP: 192.168.1.50 (your IP from app)
Port: 8080
App: IP Webcam
Location: Front Counter (or your location)
AI Module: Choose based on what you're monitoring
```

6. Click **"Add Camera"**

### **5. View Your Live Feed**

1. Click **"Live Cameras"** in sidebar
2. Click on your camera card
3. 🎉 **You should see your live phone camera feed!**

---

## 🎥 Live Camera Features

### **What You Can Do:**

✅ **View Live Feed**
- Real-time video streaming
- Full-screen viewing
- Refresh button

✅ **Multiple Cameras**
- Add multiple Android phones
- Grid view of all cameras
- Click any camera to view full-screen

✅ **Camera Status**
- Online/Offline indicators
- Connection testing
- Stream health monitoring

---

## 🔧 Troubleshooting

### ❌ **Camera Not Connecting?**

**Problem:** "Failed to load camera stream"

**Solutions:**

1. **Check Wi-Fi Connection**
   - Phone and computer on same network?
   - Try disconnecting and reconnecting Wi-Fi

2. **Check IP Address**
   - IP shown in IP Webcam app current?
   - IP changes if phone reconnects to Wi-Fi
   - Update camera with new IP if changed

3. **Check IP Webcam Server**
   - Is "Start server" button active?
   - Is camera preview showing in app?
   - Try stopping and restarting server

4. **Check Firewall**
   - Temporarily disable computer firewall
   - Or allow port 8080

5. **Test in Browser**
   - Open browser on computer
   - Go to: `http://YOUR_PHONE_IP:8080`
   - Should see IP Webcam interface
   - If this works, problem is in OmniVision app

### ⚡ **Slow or Laggy Feed?**

**Solutions:**

1. **Lower Video Quality**
   - In IP Webcam: Settings → Video quality → 480p

2. **Reduce Resolution**
   - Settings → Resolution → 1280x720 or lower

3. **Check Wi-Fi Signal**
   - Move phone closer to router
   - Use 5GHz Wi-Fi if available

---

## 💡 Pro Tips

### **🔋 Battery Life:**
- Keep phone plugged into charger
- Camera streaming drains battery fast
- Use "Keep screen on" for stability

### **📍 Camera Positioning:**
- Use phone stand or mount
- Position at good angle for monitoring
- Ensure good lighting for AI detection

### **🔒 Security:**
- Only use on trusted Wi-Fi networks
- Add password in IP Webcam settings
- Don't expose to internet without VPN

### **📊 AI Detection Works Best With:**
- Good lighting (not too dark/bright)
- Stable camera position (not moving)
- Clear view of area being monitored
- 720p or higher resolution

---

## 🎯 Next Steps

### **Optimize Your Setup:**

1. **Configure AI Detection:**
   - Go to Settings → AI Detection
   - Enable Pose Detection
   - Enable Object Detection
   - Set confidence threshold (60% recommended)
   - Enable Auto-Record Suspicious Events

2. **Set Up POS Integration** (If retail):
   - Settings → POS Integration
   - Choose Loyverse or Square
   - Add API credentials
   - Verify transactions

3. **Test Everything:**
   - View live camera feed
   - Trigger AI detection (move in front of camera)
   - Check video clip recording
   - Test AI shift reports

---

## 📞 Common Camera URLs

For advanced users who want to access specific streams:

**IP Webcam:**
- Live video: `http://YOUR_IP:8080/video`
- Snapshot: `http://YOUR_IP:8080/shot.jpg`
- Browser interface: `http://YOUR_IP:8080`

**DroidCam:**
- Live video: `http://YOUR_IP:4747/mjpegfeed`

---

## ✨ Your App is Ready!

🌐 **Access your app:** https://1999-oxygen.github.io/zero-reason/

### **Features Available:**
- ✅ Live camera viewing
- ✅ Video clip recording
- ✅ AI behavior detection  
- ✅ POS integration
- ✅ Multi-camera support
- ✅ 5 industry modules
- ✅ AI shift reports

---

## 🆘 Still Need Help?

1. Check `PHONE_CAMERA_SETUP.md` for detailed instructions
2. Test IP address in browser first
3. Try restarting IP Webcam app
4. Ensure camera permissions are granted
5. Check router doesn't block device communication

**Your OmniVision AI surveillance platform is now fully functional with your Android camera!** 🎉
