# Google Authentication Setup Guide

## Overview
OmniVision now supports **Google Sign-In** with full data persistence per user. Each user's cameras, settings, alerts, and training images are saved to their own profile.

---

## 🎯 Features

### Multi-User Support
- **Separate data** for each Google account
- **Persistent storage** in SQLite database
- **Automatic sync** across sessions
- **Secure authentication** with JWT tokens

### What Gets Saved Per User
✅ **Cameras** - All added cameras for all sectors  
✅ **Sector Configurations** - AI settings, ML model URLs, thresholds  
✅ **Alerts** - Security alerts and notifications  
✅ **Training Images** - Custom ML training data  
✅ **POS Settings** - Sales tracking configurations  

---

## 📋 Setup Instructions

### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: [https://console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Name: "OmniVision"
   - Click "Create"

3. **Enable Google Sign-In API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Identity"
   - Click "Google Identity Toolkit API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "OmniVision Web Client"
   
5. **Configure Authorized Origins**
   ```
   Authorized JavaScript origins:
   - http://localhost:5173
   - http://localhost:3000
   - https://yourdomain.com (if deployed)
   
   Authorized redirect URIs:
   - http://localhost:5173
   - http://localhost:3000
   - https://yourdomain.com (if deployed)
   ```

6. **Copy Client ID**
   - You'll get a Client ID like: `123456789-abc123.apps.googleusercontent.com`
   - **Save this!** You'll need it in the next step

### Step 2: Configure Backend

1. **Update `backend/auth.py`**
   ```python
   # Line 10
   GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
   
   # Line 11 - Generate a secure secret
   JWT_SECRET = "your-super-secret-key-change-this-in-production"
   ```

2. **Install Required Python Packages**
   ```bash
   cd backend
   pip install google-auth PyJWT
   ```

3. **Initialize Database Tables**
   ```bash
   python3 -c "import database_users; database_users.init_user_tables()"
   ```

### Step 3: Configure Frontend

1. **Update `src/components/GoogleAuth.jsx`**
   ```javascript
   // Line 4
   const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com";
   ```

2. **Update `public/index.html`** (if needed)
   Add Google Sign-In meta tag:
   ```html
   <meta name="google-signin-client_id" content="YOUR_CLIENT_ID.apps.googleusercontent.com">
   ```

### Step 4: Update Backend Endpoints

Add authentication endpoints to `backend/main.py`:

```python
# At the top, add imports
from main_auth import *
import database_users as db_users

# Initialize user tables on startup
@app.on_event("startup")
async def startup_event():
    db.init_database()
    db_users.init_user_tables()
```

### Step 5: Test Authentication

1. **Start Backend**
   ```bash
   cd backend
   python3 main.py
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   - Go to `http://localhost:5173`
   - Click "Sign in with Google"
   - Authorize the app
   - You should see your profile picture and name

---

## 🔧 How It Works

### Authentication Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Google OAuth popup appears
   ↓
3. User authorizes app
   ↓
4. Google returns ID token
   ↓
5. Frontend sends token to backend /api/auth/google
   ↓
6. Backend verifies token with Google
   ↓
7. Backend creates/finds user in database
   ↓
8. Backend generates JWT token
   ↓
9. Frontend stores JWT in localStorage
   ↓
10. All API calls include JWT in Authorization header
```

### Data Isolation

Each user's data is completely separate:

**User A (alice@example.com)**
```
Cameras: 5 cameras in liquor sector
Settings: Custom Roboflow model for liquor
Alerts: 3 unread theft alerts
Training Images: 50 images of liquor bottles
```

**User B (bob@example.com)**
```
Cameras: 2 cameras in retail sector
Settings: Default YOLO model
Alerts: 1 unread alert
Training Images: 20 images of shoes
```

They **never see each other's data**!

---

## 🚀 Using the System

### First Login

1. **Sign in with Google**
2. System creates your profile
3. Default sector configurations are initialized
4. Start adding cameras!

### Adding Cameras

```javascript
// Cameras are automatically linked to your user account
1. Click "Add Camera"
2. Fill in details
3. Camera saved to YOUR profile
4. Only YOU can see this camera
```

### Switching Accounts

```javascript
1. Click "Sign Out"
2. Sign in with different Google account
3. See completely different data
4. Your previous account data is safe
```

### Persistent Data

All your data persists across:
- ✅ Browser refreshes
- ✅ Different devices (same Google account)
- ✅ Days/weeks/months
- ✅ Backend restarts

---

## 🔐 Security

### JWT Tokens
- **Expiration:** 24 hours
- **Algorithm:** HS256
- **Storage:** localStorage (client-side)
- **Transmission:** Authorization header

### Google OAuth
- **Verification:** Token verified with Google servers
- **Scope:** Email and profile only
- **No passwords:** Google handles authentication

### Database
- **User isolation:** Foreign key constraints
- **SQL injection:** Parameterized queries
- **Data privacy:** Each user sees only their data

---

## 🛠️ API Endpoints

### Authentication

**POST /api/auth/google**
```json
Request:
{
  "token": "google_id_token_here"
}

Response:
{
  "user_id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "jwt_token": "eyJ..."
}
```

**GET /api/auth/me**
```
Headers: Authorization: Bearer <jwt_token>

Response:
{
  "user_id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2026-05-16 00:00:00"
}
```

### User Data

**GET /api/user/cameras**
- Returns all cameras for authenticated user

**POST /api/user/cameras**
- Save camera for authenticated user

**GET /api/user/sectors**
- Get all sector configs for user

**POST /api/user/sectors/{sector_id}**
- Save sector config for user

**GET /api/user/alerts**
- Get alerts for user

**GET /api/user/training-images**
- Get training images for user

---

## 🔍 Troubleshooting

### "Sign in with Google" button not showing

**Check:**
- [ ] Google Client ID is correct
- [ ] Script loaded: `https://accounts.google.com/gsi/client`
- [ ] Browser console for errors

**Fix:**
```javascript
// In browser console
console.log(window.google); // Should not be undefined
```

### "Invalid Google token" error

**Check:**
- [ ] Client ID matches in frontend and backend
- [ ] Token not expired
- [ ] Authorized origins configured correctly

**Fix:**
- Regenerate OAuth credentials
- Update both frontend and backend

### Data not persisting

**Check:**
- [ ] Backend running
- [ ] JWT token in localStorage
- [ ] Authorization header sent with requests

**Fix:**
```javascript
// Check token
localStorage.getItem('jwt_token')

// Check user data
localStorage.getItem('user_data')
```

### "401 Unauthorized" errors

**Check:**
- [ ] JWT token valid
- [ ] Token not expired (24h limit)
- [ ] Authorization header format: `Bearer <token>`

**Fix:**
- Sign out and sign in again
- Check backend JWT_SECRET matches

---

## 📊 Database Schema

### users
```sql
id INTEGER PRIMARY KEY
google_id TEXT UNIQUE
email TEXT UNIQUE
name TEXT
picture TEXT
created_at TEXT
last_login TEXT
```

### user_cameras
```sql
id TEXT
user_id INTEGER (FK)
name TEXT
url TEXT
module TEXT
status TEXT
type TEXT
PRIMARY KEY (id, user_id)
```

### user_sector_configs
```sql
id INTEGER PRIMARY KEY
user_id INTEGER (FK)
sector_id TEXT
config_data TEXT (JSON)
updated_at TEXT
UNIQUE(user_id, sector_id)
```

### user_alerts
```sql
id INTEGER PRIMARY KEY
user_id INTEGER (FK)
sector_id TEXT
type TEXT
message TEXT
severity TEXT
read INTEGER
created_at TEXT
```

### user_training_images
```sql
id INTEGER PRIMARY KEY
user_id INTEGER (FK)
sector_id TEXT
label TEXT
image_data BLOB
mime_type TEXT
created_at TEXT
```

---

## 🎓 Best Practices

### For Users
1. **Sign in** before adding cameras
2. **Don't share** your Google account
3. **Sign out** on shared computers
4. **Backup** important configurations

### For Developers
1. **Use environment variables** for secrets
2. **Rotate JWT secrets** periodically
3. **Monitor** failed auth attempts
4. **Log** user activities
5. **Test** with multiple accounts

---

## 🚀 Production Deployment

### Environment Variables
```bash
# Backend
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export JWT_SECRET="your-super-secret-key-min-32-chars"
export JWT_EXPIRATION=86400  # 24 hours

# Frontend
VITE_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
VITE_API_BASE_URL="https://api.yourdomain.com"
```

### HTTPS Required
- Google OAuth requires HTTPS in production
- Use Let's Encrypt for free SSL
- Configure reverse proxy (nginx/Apache)

### Database Backup
```bash
# Backup user data
sqlite3 omnivision.db ".backup omnivision_backup.db"

# Scheduled backups
0 2 * * * sqlite3 /path/to/omnivision.db ".backup /backups/omnivision_$(date +\%Y\%m\%d).db"
```

---

## ✅ Checklist

Before going live:
- [ ] Google OAuth credentials created
- [ ] Client ID configured in frontend and backend
- [ ] JWT secret set (min 32 characters)
- [ ] Database tables initialized
- [ ] HTTPS enabled (production)
- [ ] Authorized origins configured
- [ ] Test with multiple Google accounts
- [ ] Backup strategy in place
- [ ] Error logging enabled
- [ ] User data privacy policy created

---

**Your OmniVision system now supports multiple users with full data persistence! 🎉**
