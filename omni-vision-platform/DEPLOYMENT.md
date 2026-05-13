# OmniVision Platform - Deployment Guide

## Quick Deploy to Netlify

### Option 1: Netlify CLI (Recommended)

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   cd "/Users/admin/Desktop/zero reason/omni-vision-platform"
   npm run build
   netlify deploy --prod
   ```

   When prompted:
   - Choose: "Create & configure a new site"
   - Team: Select your team
   - Site name: `new-zero-omnivision` (or your preferred name)
   - Publish directory: `dist`

### Option 2: Netlify Drag & Drop

1. Build the app:
   ```bash
   npm run build
   ```

2. Go to https://app.netlify.com/drop

3. Drag and drop the `dist` folder

### Option 3: Git-based Deployment

1. **Create a GitHub repository** and push your code

2. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repo
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

## Vercel Deployment (Alternative)

```bash
npm install -g vercel
vercel login
vercel --prod
```

## Environment Variables (If needed)

If deploying with API integrations, add these in Netlify dashboard:
- `VITE_GEMINI_API_KEY` - Your Google Gemini API key
- `VITE_LOYVERSE_API_KEY` - Your Loyverse POS API key
- `VITE_SQUARE_API_KEY` - Your Square POS API key

## Post-Deployment

After deployment, configure:
1. **Settings → POS Integration** - Add your POS API keys
2. **Settings → Camera Management** - Add your camera URLs
3. **Settings → AI Detection** - Configure detection thresholds

## Current Build Status

✅ Production build completed successfully
📦 Build size: 257.47 kB (gzipped: 77.05 kB)
🎯 Ready for deployment!

## Live URL (After Deployment)

Your app will be available at:
- Netlify: `https://new-zero-omnivision.netlify.app`
- Custom domain: Configure in Netlify dashboard

## Support

For deployment issues, contact support or check:
- Netlify Docs: https://docs.netlify.com
- Vite Docs: https://vitejs.dev/guide/static-deploy.html
