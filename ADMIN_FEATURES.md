# Admin Features Implementation Guide

## 🔐 Admin Setup

### Admin Email
- **Email:** eightykings2@gmail.com
- **Status:** Auto-set as admin on first Google login

### Access Codes
- **Admin Code:** `ADMIN2024` - For admin access (you)
- **User Code:** `OMNI2024` - For regular users

## ✅ Implemented Features

### Backend (Completed)
1. **Admin User System**
   - Auto-detection of admin email
   - Admin flag in database
   - Admin-specific endpoints

2. **Access Code System**
   - Two-tier access codes (admin vs users)
   - Database-backed code verification
   - Admin panel for code management

3. **User Messaging System**
   - Users can send messages to admin
   - Message database table
   - API endpoints:
     - `POST /api/auth/user/message` - Send message
     - `GET /api/auth/admin/messages` - Get all messages
     - `PUT /api/auth/admin/messages/{id}/read` - Mark as read
     - `DELETE /api/auth/admin/messages/{id}` - Delete message

4. **User-Specific Data Persistence**
   - Cameras saved per user
   - Alerts saved per user
   - Sector configs per user
   - Training images per user

### Frontend (Existing)
1. **AdminPanel Component** - Full UI for managing users and codes
2. **AccessCodeGate** - Access code verification screen
3. **AlertsDashboard** - Sector-specific alerts with filtering
4. **Camera Persistence** - Already implemented in backend

## 🔨 Features To Implement

### 1. User Messaging UI Component
**Location:** `src/components/UserMessaging.jsx`
- Message form for users to contact admin
- Admin inbox to view/manage messages
- Unread message count

### 2. Notification Bell Integration
**Location:** `src/App.jsx` (line 808-811)
- Connect bell icon to alerts
- Show unread alert count
- Click to open alerts dashboard

### 3. ML Model Configuration UI
**Location:** `src/components/MLModelConfig.jsx`
- Add Roboflow API key input
- Add TensorFlow model upload
- Per-camera model assignment
- Model configuration persistence

### 4. Rolling Video Recording
**Location:** `src/components/VideoRecorder.jsx`
- Custom duration buffer (e.g., last 30 minutes)
- Automatic old footage deletion
- Recording status indicator
- Download recorded segments

## 📋 Next Steps

1. Create UserMessaging component
2. Integrate alerts with notification bell
3. Add ML model configuration UI
4. Implement rolling video recording
5. Test all features end-to-end
6. Deploy to production

## 🚀 Deployment

### Backend
```bash
cd backend
gcloud run deploy omnivision-backend \
  --image gcr.io/omnivision-1778886467/omnivision-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --memory 1Gi
```

### Frontend
```bash
npm run build
npm run deploy
```

## 📝 Usage

### For Admin (eightykings2@gmail.com)
1. Use access code: `ADMIN2024`
2. Login with Google
3. Admin panel button appears in header
4. Access all admin features

### For Regular Users
1. Use access code: `OMNI2024`
2. Login with Google
3. Normal app access
4. Can message admin via "Contact Admin" button
