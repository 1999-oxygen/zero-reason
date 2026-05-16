# Google Cloud Deployment Guide for OmniVision

## 💰 Is it Free?

**YES!** Thanks to Google Cloud Free Tier:

### Free Tier Includes:
- **Cloud Run**: 2 million requests/month FREE
- **Artifact Registry**: 0.5 GB storage FREE
- **New Users**: $300 credits for 90 days
- **Always Free**: Continues after trial ends

### Estimated Monthly Cost (After Free Tier):
- **Low usage** (100 users, 1000 requests/day): **$0-5/month**
- **Medium usage** (1000 users, 10k requests/day): **$10-20/month**
- **High usage** (10k users, 100k requests/day): **$50-100/month**

---

## 🚀 Advantages of Google Cloud vs Local

| Feature | Local (Current) | Google Cloud |
|---------|----------------|--------------|
| **Availability** | Only when laptop on | 24/7 always-on |
| **Multi-user** | Limited testing | True multi-user |
| **Scaling** | Manual | Auto-scales |
| **Security** | Local network | HTTPS, OAuth |
| **Reliability** | Depends on laptop | 99.95% uptime SLA |
| **Database** | SQLite file | Persistent storage |
| **Monitoring** | Manual | App Hub + Gemini AI |
| **Cost** | Electricity | Free tier available |

### Key Benefits:
1. ✅ **Always-On Backend** - Users never disconnected
2. ✅ **True Multi-User Testing** - Test data isolation
3. ✅ **App Hub Intelligence** - Gemini-powered recommendations
4. ✅ **No "Works on My Machine"** - Consistent environment
5. ✅ **Auto-Scaling** - Handles 1 or 1000 users automatically
6. ✅ **Zero Downtime** - Scales to zero when not in use (free!)

---

## 📋 Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                 GitHub Repository                    │
│  (Your Code: Frontend + Backend)                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Push to main branch
                   ▼
┌─────────────────────────────────────────────────────┐
│              Google Cloud Build                      │
│  (Automatically builds Docker container)            │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Deploy
                   ▼
┌─────────────────────────────────────────────────────┐
│               Cloud Run Service                      │
│  Backend API: https://omnivision-api-xxx.run.app   │
│  - FastAPI + SQLite                                 │
│  - Google OAuth                                     │
│  - AI Detection                                     │
└─────────────────────────────────────────────────────┘
                   │
                   │ API calls
                   ▼
┌─────────────────────────────────────────────────────┐
│              GitHub Pages (Frontend)                 │
│  Frontend: https://1999-oxygen.github.io/zero-reason│
│  - React + Vite                                     │
│  - Connects to Cloud Run backend                   │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Step-by-Step Deployment

### Prerequisites
- Google Cloud account (free tier)
- GitHub account (you already have this)
- Your code in Windsurf (you have this)

---

### Step 1: Create Dockerfile for Backend

This tells Google Cloud how to run your Python API.

**File: `backend/Dockerfile`** (I'll create this for you)

---

### Step 2: Add Cloud Run Configuration

**File: `backend/.dockerignore`** (Exclude unnecessary files)

---

### Step 3: Set Up Google Cloud Project

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Create New Project**
   - Name: `omnivision-platform`
   - Note the Project ID (e.g., `omnivision-platform-123456`)

3. **Enable Required APIs**
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
   - Secret Manager API (for API keys)

4. **Set Up Billing** (Required even for free tier)
   - Add payment method
   - You won't be charged within free tier limits
   - Set up budget alerts at $10, $20, $50

---

### Step 4: Configure Secrets

Store sensitive data securely:

```bash
# Google OAuth Client ID
gcloud secrets create GOOGLE_CLIENT_ID --data-file=-
# Paste your client ID, press Ctrl+D

# JWT Secret
gcloud secrets create JWT_SECRET --data-file=-
# Paste a random 32+ character string, press Ctrl+D
```

---

### Step 5: Deploy Backend to Cloud Run

**Option A: Using Google Cloud Console (Easiest)**

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click **"Create Service"**
3. Select **"Continuously deploy from a repository"**
4. Click **"Set up with Cloud Build"**
5. Connect your GitHub account
6. Select repository: `1999-oxygen/zero-reason`
7. Branch: `main`
8. Build type: **Dockerfile**
9. Dockerfile path: `backend/Dockerfile`
10. Service name: `omnivision-backend`
11. Region: `us-central1` (or closest to you)
12. **Authentication**: Allow unauthenticated invocations
13. **Environment variables**:
    - `PORT`: `8000`
    - `GOOGLE_CLIENT_ID`: (from secrets)
    - `JWT_SECRET`: (from secrets)
14. Click **"Create"**

**Option B: Using Windsurf Terminal (Advanced)**

```bash
# From Windsurf terminal
cd backend

# Build and deploy
gcloud run deploy omnivision-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PORT=8000
```

---

### Step 6: Update Frontend to Use Cloud Backend

Once deployed, you'll get a URL like:
```
https://omnivision-backend-xxx-uc.a.run.app
```

**Update frontend API calls:**

Edit `src/services/apiClient.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 
                     'https://omnivision-backend-xxx-uc.a.run.app';
```

Create `.env.production`:
```
VITE_API_URL=https://omnivision-backend-xxx-uc.a.run.app
```

---

### Step 7: Deploy Frontend to GitHub Pages

Your frontend is already on GitHub Pages! Just update the API URL:

```bash
# In Windsurf terminal
npm run build
git add dist
git commit -m "Update API URL for Cloud Run"
git push origin main
npm run deploy
```

---

### Step 8: Configure CORS

Update `backend/main.py` to allow your frontend domain:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://1999-oxygen.github.io",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Step 9: Update Google OAuth Settings

In Google Cloud Console → APIs & Services → Credentials:

**Add authorized origins:**
```
https://1999-oxygen.github.io
https://omnivision-backend-xxx-uc.a.run.app
```

**Add authorized redirect URIs:**
```
https://1999-oxygen.github.io/zero-reason
https://1999-oxygen.github.io/zero-reason/
```

---

### Step 10: Test Your Deployment

1. **Visit your frontend**: `https://1999-oxygen.github.io/zero-reason`
2. **Click "Sign in with Google"**
3. **Add a camera** - it should save to cloud database
4. **Close browser and reopen** - data should persist
5. **Sign in from different device** - same data appears

---

## 🔄 Continuous Deployment Workflow

Once set up, your workflow becomes:

```bash
# In Windsurf
1. Make code changes
2. git add .
3. git commit -m "Add new feature"
4. git push origin main

# Automatically happens:
5. GitHub triggers Cloud Build
6. Cloud Build creates new container
7. Cloud Run deploys new version
8. Your app is live in ~2-3 minutes!
```

---

## 📊 Monitoring & Optimization

### App Hub (Gemini AI Recommendations)

1. Go to [App Hub](https://console.cloud.google.com/apphub)
2. Register your Cloud Run service
3. Get AI-powered insights:
   - Cost optimization suggestions
   - Performance improvements
   - Security recommendations
   - Reliability alerts

### Cloud Monitoring

- **Logs**: View all backend logs in real-time
- **Metrics**: Request count, latency, errors
- **Alerts**: Set up email/SMS alerts for issues
- **Traces**: Debug slow requests

---

## 💾 Database Persistence

### SQLite on Cloud Run

Your SQLite database will persist between deployments using:

**Option A: Cloud Storage Volume (Recommended)**
```yaml
# In Cloud Run, mount a volume
volumes:
  - name: data
    cloudStorage:
      bucket: omnivision-data
      mountOptions:
        - implicit-dirs
```

**Option B: Cloud SQL (Production)**
- Migrate to PostgreSQL for better scalability
- Fully managed database
- Automatic backups
- Higher cost (~$10/month minimum)

---

## 🔐 Security Best Practices

1. **Use Secret Manager** for API keys
2. **Enable HTTPS** (automatic on Cloud Run)
3. **Set up IAM roles** properly
4. **Enable Cloud Armor** for DDoS protection
5. **Regular security scans** with Cloud Security Scanner

---

## 💰 Cost Optimization

### Stay in Free Tier:
- ✅ Use Cloud Run (2M requests free)
- ✅ Minimize container size
- ✅ Set max instances to 1-2
- ✅ Use Cloud Storage for static files
- ✅ Enable request throttling

### Budget Alerts:
```bash
# Set budget alert at $10
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="OmniVision Budget" \
  --budget-amount=10USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check build logs
gcloud builds list
gcloud builds log BUILD_ID
```

### Service Not Starting
```bash
# Check service logs
gcloud run services logs read omnivision-backend
```

### Database Not Persisting
- Check volume mount configuration
- Verify write permissions
- Consider Cloud SQL for production

### CORS Errors
- Verify allowed origins in backend
- Check Google OAuth authorized domains
- Ensure HTTPS is used

---

## ✅ Deployment Checklist

Before going live:
- [ ] Dockerfile created and tested
- [ ] Google Cloud project created
- [ ] Required APIs enabled
- [ ] Secrets configured (OAuth, JWT)
- [ ] Backend deployed to Cloud Run
- [ ] Frontend updated with Cloud Run URL
- [ ] CORS configured correctly
- [ ] Google OAuth domains updated
- [ ] Database persistence configured
- [ ] Budget alerts set up
- [ ] Monitoring enabled
- [ ] Test multi-user login
- [ ] Test data persistence
- [ ] Test from mobile device

---

## 🎯 Next Steps After Deployment

1. **Custom Domain** (Optional)
   - Buy domain (e.g., omnivision.ai)
   - Point to Cloud Run service
   - Enable SSL certificate

2. **CDN** (Optional)
   - Use Cloud CDN for faster global access
   - Cache static assets

3. **Scaling**
   - Set min/max instances
   - Configure auto-scaling triggers
   - Optimize cold start time

4. **Monitoring**
   - Set up uptime checks
   - Configure error alerting
   - Track user analytics

---

**Ready to deploy? Let's start with creating the Dockerfile! 🚀**
