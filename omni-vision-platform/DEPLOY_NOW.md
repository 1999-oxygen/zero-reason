# 🚀 Deploy OmniVision to Google Cloud - Quick Start

## ⚡ 5-Minute Deployment

### Step 1: Install Google Cloud CLI (One-time)

**Mac:**
```bash
brew install google-cloud-sdk
```

**Windows:**
Download from: https://cloud.google.com/sdk/docs/install

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
```

---

### Step 2: Login to Google Cloud

```bash
# In Windsurf terminal
gcloud auth login
```

This will open your browser to sign in with Google.

---

### Step 3: Create Google Cloud Project

```bash
# Create new project
gcloud projects create omnivision-platform-$(date +%s) --name="OmniVision"

# Set as active project
gcloud config set project omnivision-platform-XXXXX

# Enable billing (required even for free tier)
# Go to: https://console.cloud.google.com/billing
# Link your project to a billing account
```

---

### Step 4: Get Google OAuth Client ID

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "OmniVision"
5. Authorized JavaScript origins:
   ```
   http://localhost:5173
   https://1999-oxygen.github.io
   ```
6. Click "Create"
7. **Copy the Client ID** (looks like: `123456-abc.apps.googleusercontent.com`)

---

### Step 5: Deploy Backend

```bash
# Navigate to backend folder in Windsurf terminal
cd backend

# Run deployment script
./deploy.sh
```

**What it does:**
- ✅ Enables required Google Cloud APIs
- ✅ Creates secrets for OAuth and JWT
- ✅ Builds Docker container
- ✅ Deploys to Cloud Run
- ✅ Gives you a live URL

**Expected output:**
```
✅ Deployment successful!
🌐 Your backend is live at:
   https://omnivision-backend-xxx-uc.a.run.app
```

---

### Step 6: Update Frontend

**Edit `.env.production`:**
```bash
# Create this file in project root
echo "VITE_API_URL=https://omnivision-backend-xxx-uc.a.run.app" > .env.production
```

**Update `src/services/apiClient.js`:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 
                     'https://omnivision-backend-xxx-uc.a.run.app';
```

**Update `src/components/GoogleAuth.jsx`:**
```javascript
const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID.apps.googleusercontent.com";
```

---

### Step 7: Update Google OAuth Settings

Go back to: https://console.cloud.google.com/apis/credentials

**Add to Authorized JavaScript origins:**
```
https://omnivision-backend-xxx-uc.a.run.app
https://1999-oxygen.github.io
```

**Add to Authorized redirect URIs:**
```
https://1999-oxygen.github.io/zero-reason
https://1999-oxygen.github.io/zero-reason/
```

---

### Step 8: Deploy Frontend to GitHub Pages

```bash
# In Windsurf terminal (project root)
npm run build
git add .
git commit -m "Deploy to production with Cloud Run backend"
git push origin main
npm run deploy
```

---

### Step 9: Test Your Live App! 🎉

1. **Visit:** https://1999-oxygen.github.io/zero-reason
2. **Click:** "Sign in with Google"
3. **Add a camera** - it saves to cloud!
4. **Close browser and reopen** - data persists!
5. **Try from phone** - same data!

---

## 💰 Cost Breakdown

### Free Tier (What You Get FREE Forever):
- ✅ **2 million requests/month** on Cloud Run
- ✅ **180,000 vCPU-seconds/month**
- ✅ **360,000 GiB-seconds/month**
- ✅ **0.5 GB** container storage
- ✅ **$300 credits** for 90 days (new users)

### Estimated Costs After Free Tier:
- **Light usage** (10 users, 100 requests/day): **$0/month** ✅
- **Medium usage** (100 users, 1000 requests/day): **$2-5/month**
- **Heavy usage** (1000 users, 10k requests/day): **$20-30/month**

**You'll likely stay at $0!** 🎉

---

## 🔍 Monitoring Your Deployment

### View Logs:
```bash
gcloud run services logs read omnivision-backend --region=us-central1
```

### Check Service Status:
```bash
gcloud run services describe omnivision-backend --region=us-central1
```

### View in Console:
https://console.cloud.google.com/run

---

## 🐛 Troubleshooting

### Deployment fails?
```bash
# Check build logs
gcloud builds list
gcloud builds log BUILD_ID
```

### Service not starting?
```bash
# View service logs
gcloud run services logs read omnivision-backend --region=us-central1 --limit=50
```

### CORS errors?
- Make sure you added Cloud Run URL to Google OAuth authorized origins
- Check `backend/main.py` CORS settings include your frontend URL

### Database not persisting?
- For now, data resets on each deployment (emptyDir volume)
- To persist data, upgrade to Cloud Storage volume (see GOOGLE_CLOUD_DEPLOYMENT.md)

---

## 🔄 Update Your Deployment

After making code changes:

```bash
# In backend folder
./deploy.sh
```

That's it! Cloud Run will build and deploy the new version automatically.

---

## 📊 Monitor Costs

### Set up budget alert:
```bash
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="OmniVision Budget Alert" \
  --budget-amount=10USD \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```

### Check current costs:
https://console.cloud.google.com/billing

---

## ✅ Deployment Checklist

- [ ] Google Cloud CLI installed
- [ ] Logged in with `gcloud auth login`
- [ ] Project created and billing enabled
- [ ] Google OAuth Client ID obtained
- [ ] Backend deployed with `./deploy.sh`
- [ ] Frontend updated with Cloud Run URL
- [ ] Google OAuth authorized origins updated
- [ ] Frontend deployed to GitHub Pages
- [ ] Tested login from browser
- [ ] Tested data persistence
- [ ] Budget alert configured

---

## 🎯 What You Get

### Before (Local):
- ❌ Only works when laptop is on
- ❌ Can't test with real users
- ❌ No HTTPS
- ❌ Data on local machine only

### After (Cloud):
- ✅ **24/7 availability**
- ✅ **Multi-user support**
- ✅ **HTTPS by default**
- ✅ **Auto-scaling**
- ✅ **99.95% uptime SLA**
- ✅ **Global CDN**
- ✅ **Free tier eligible**
- ✅ **Professional deployment**

---

## 🚀 Advanced Features (Optional)

### Custom Domain:
```bash
gcloud run domain-mappings create \
  --service omnivision-backend \
  --domain api.yourdomain.com \
  --region us-central1
```

### Persistent Database (Cloud SQL):
```bash
# Create PostgreSQL instance
gcloud sql instances create omnivision-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1
```

### Enable Cloud CDN:
- Speeds up global access
- Caches static assets
- Reduces costs

---

## 📞 Support

### Google Cloud Support:
- Free tier: Community support
- Paid: 24/7 technical support

### Documentation:
- Cloud Run: https://cloud.google.com/run/docs
- Pricing: https://cloud.google.com/run/pricing
- Free Tier: https://cloud.google.com/free

---

**Ready to deploy? Run `./deploy.sh` in the backend folder! 🚀**

**Questions? Check `GOOGLE_CLOUD_DEPLOYMENT.md` for detailed guide.**
