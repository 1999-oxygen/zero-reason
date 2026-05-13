# 🔧 Camera Troubleshooting Guide

## ❌ Common Issues & Solutions

### **Issue 1: "Failed to load camera stream"**

**Symptoms:**
- Camera shows error in viewer
- Red error message
- No video feed

**Solutions:**

#### ✅ **Check Correct Port:**

| App | Correct Port |
|-----|--------------|
| IP Webcam | **8080** |
| DroidCam | **4747** ⚠️ (NOT 8080!) |
| Iriun | **8080** |

**Fix:**
1. Go to Settings → Camera Management
2. Find your camera
3. Check the port matches your app
4. For DroidCam, change port to **4747**

---

#### ✅ **Check IP Address:**

Your phone's IP address changes when it reconnects to Wi-Fi!

**Find Current IP:**

**On Android:**
1. Open IP Webcam/DroidCam app
2. Look at top of screen
3. You'll see: `http://192.168.X.XX:PORT`
4. Use that EXACT IP in OmniVision

**On Phone (Alternative):**
1. Settings → Wi-Fi
2. Tap connected network
3. Look for "IP Address"

**Update in App:**
1. Settings → Camera Management
2. Delete old camera
3. Add new camera with current IP

---

#### ✅ **Check Same Wi-Fi Network:**

**CRITICAL:** Phone and computer MUST be on same network!

**Verify:**
- Phone Wi-Fi: Check in phone Settings
- Computer Wi-Fi: Check in computer network settings
- Should show SAME network name

**Common mistake:**
- Phone on 5GHz network
- Computer on 2.4GHz network
- These are different! Use same one.

---

#### ✅ **Check Camera App Running:**

**IP Webcam:**
1. Open IP Webcam app
2. Scroll to bottom
3. Tap "Start server"
4. Screen should show live camera feed
5. Top shows IP address

**DroidCam:**
1. Open DroidCam app
2. Ensure "WiFi" option selected
3. Look for IP and Port at bottom
4. Should show: WiFi IP: 192.168.X.XX (Port: 4747)

---

### **Issue 2: Browser Console Errors**

**Check Developer Console:**

1. **Open Console:**
   - Chrome/Edge: Press `F12` or `Cmd+Option+I` (Mac)
   - Firefox: Press `F12`
   - Click "Console" tab

2. **Common Errors:**

   **❌ Error: "CORS policy blocked"**
   ```
   Access to image at 'http://192.168.1.50:8080/video' from origin 'https://...' 
   has been blocked by CORS policy
   ```
   
   **Solution:**
   - This is browser security blocking HTTP content
   - **Workaround:** Open camera URL directly in new tab
   - Click "Test in Browser" button in error message
   - For full fix, deploy app on HTTP (not HTTPS) OR use a proxy

   **❌ Error: "Failed to load resource: net::ERR_CONNECTION_REFUSED"**
   ```
   GET http://192.168.1.50:8080/video net::ERR_CONNECTION_REFUSED
   ```
   
   **Solution:**
   - Camera app not running on phone
   - Wrong IP address
   - Wrong port
   - Firewall blocking connection

   **❌ Error: "Failed to load resource: net::ERR_ADDRESS_UNREACHABLE"**
   ```
   GET http://192.168.1.50:8080/video net::ERR_ADDRESS_UNREACHABLE
   ```
   
   **Solution:**
   - Phone and computer on different networks
   - Phone disconnected from Wi-Fi
   - IP address changed

---

### **Issue 3: CORS (Cross-Origin) Blocking**

**What is CORS?**
- Browser security feature
- Blocks loading content from different origins
- Happens when site is HTTPS but camera is HTTP

**How to know if it's CORS:**
1. Open browser dev tools (F12)
2. Look for errors mentioning "CORS"
3. Try opening camera URL directly - if it works, it's CORS

**Solutions:**

#### **Option 1: Test in Browser (Quick)**
1. Copy camera URL
2. Open in new browser tab
3. Bookmark it for easy access

#### **Option 2: Browser Extension**
1. Install "CORS Unblock" extension (Chrome)
2. Enable it when using OmniVision app
3. ⚠️ Only use on trusted local networks!

#### **Option 3: Access App via HTTP**
1. Run app locally: `npm run dev`
2. Access via: `http://localhost:5173`
3. No CORS issues on HTTP!

#### **Option 4: Use Reverse Proxy** (Advanced)
- Set up nginx/Apache proxy
- Proxy camera streams through your server
- Eliminates CORS completely

---

## 🔍 Debug Checklist

Run through this checklist:

### **1. Basic Connection**
- [ ] Phone camera app is open and running?
- [ ] "Start server" button pressed?
- [ ] Camera feed showing in app?
- [ ] IP address visible in app?

### **2. Network**
- [ ] Phone on Wi-Fi (not mobile data)?
- [ ] Computer on Wi-Fi?
- [ ] Same network name on both?
- [ ] IP address starts with 192.168 or 10.0?

### **3. Configuration**
- [ ] Correct port for your app?
  - IP Webcam = 8080
  - DroidCam = 4747
- [ ] IP address matches app exactly?
- [ ] No typos in IP?

### **4. Test Direct Access**
- [ ] Open browser on computer
- [ ] Type: `http://YOUR_PHONE_IP:PORT`
- [ ] Do you see camera interface?
- [ ] If YES: Issue is CORS
- [ ] If NO: Issue is network/config

### **5. Firewall**
- [ ] Computer firewall allows port?
- [ ] Router allows device communication?
- [ ] Try disabling firewall temporarily

---

## 📊 Port Quick Reference

```
✅ IP Webcam    → Port 8080  → http://IP:8080/video
✅ DroidCam     → Port 4747  → http://IP:4747/mjpegfeed  
✅ Iriun        → Port 8080  → http://IP:8080/video
```

---

## 🆘 Still Not Working?

### **Last Resort Steps:**

1. **Restart Everything:**
   - Close camera app
   - Disconnect phone from Wi-Fi
   - Reconnect phone to Wi-Fi
   - Restart camera app
   - Note NEW IP address
   - Update camera in OmniVision

2. **Try Different Browser:**
   - Chrome vs Firefox vs Safari
   - Some handle CORS differently

3. **Run App Locally:**
   ```bash
   cd /Users/admin/Desktop/zero reason/omni-vision-platform
   npm run dev
   ```
   - Access at: http://localhost:5173
   - No CORS issues on localhost!

4. **Check Router Settings:**
   - Some routers block device-to-device communication
   - Look for "AP Isolation" setting
   - Disable it if enabled

---

## ✅ Success Indicators

**You'll know it's working when:**
- ✅ Camera shows "online" status
- ✅ Live feed visible in camera viewer
- ✅ No errors in browser console
- ✅ "Test Connection" button shows success
- ✅ Real-time video updates

---

## 💡 Pro Tips

1. **Bookmark Camera URL:**
   - Quick access to check if camera is working
   - Helps diagnose CORS vs network issues

2. **Static IP for Phone:**
   - Set static IP in router DHCP settings
   - IP won't change when phone reconnects
   - No need to update camera config

3. **Use 2.4GHz Wi-Fi:**
   - Better range than 5GHz
   - More reliable for camera streaming
   - Less prone to disconnects

4. **Check Phone Screen Timeout:**
   - Enable "Keep screen on" in Developer Options
   - Prevents phone from sleeping
   - Maintains stable connection

---

## 🔗 Quick Links

- **IP Webcam Download:** [Google Play Store](https://play.google.com/store/apps/details?id=com.pas.webcam)
- **DroidCam Download:** [Google Play Store](https://play.google.com/store/apps/details?id=com.dev47apps.droidcam)
- **Your App:** https://1999-oxygen.github.io/zero-reason/

---

**Most common fix:** Use port 4747 for DroidCam, 8080 for IP Webcam! 🎯
