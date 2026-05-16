#!/bin/bash
# OmniVision Backend Deployment Script for Google Cloud Run

set -e  # Exit on error

echo "🚀 OmniVision Backend Deployment to Google Cloud Run"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install it first:${NC}"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️  No project selected. Please set one:${NC}"
    echo "   gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓ Using project: $PROJECT_ID${NC}"

# Configuration
SERVICE_NAME="omnivision-backend"
REGION="us-central1"  # Change to your preferred region
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo ""
echo "Configuration:"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Image: $IMAGE_NAME"
echo ""

# Ask for confirmation
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Enable required APIs
echo ""
echo "📋 Enabling required Google Cloud APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com \
    --project=$PROJECT_ID

echo -e "${GREEN}✓ APIs enabled${NC}"

# Check for secrets
echo ""
echo "🔐 Checking for required secrets..."

if ! gcloud secrets describe GOOGLE_CLIENT_ID --project=$PROJECT_ID &>/dev/null; then
    echo -e "${YELLOW}⚠️  GOOGLE_CLIENT_ID secret not found.${NC}"
    read -p "Enter your Google OAuth Client ID: " CLIENT_ID
    echo -n "$CLIENT_ID" | gcloud secrets create GOOGLE_CLIENT_ID \
        --data-file=- \
        --project=$PROJECT_ID
    echo -e "${GREEN}✓ GOOGLE_CLIENT_ID secret created${NC}"
else
    echo -e "${GREEN}✓ GOOGLE_CLIENT_ID secret exists${NC}"
fi

if ! gcloud secrets describe JWT_SECRET --project=$PROJECT_ID &>/dev/null; then
    echo -e "${YELLOW}⚠️  JWT_SECRET secret not found.${NC}"
    # Generate a random secret
    JWT_SECRET=$(openssl rand -base64 32)
    echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET \
        --data-file=- \
        --project=$PROJECT_ID
    echo -e "${GREEN}✓ JWT_SECRET secret created (auto-generated)${NC}"
else
    echo -e "${GREEN}✓ JWT_SECRET secret exists${NC}"
fi

# Build and deploy
echo ""
echo "🔨 Building and deploying to Cloud Run..."
echo "   This may take 3-5 minutes..."

gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars PORT=8000 \
    --set-secrets GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,JWT_SECRET=JWT_SECRET:latest \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0 \
    --project=$PROJECT_ID

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --format 'value(status.url)' \
    --project=$PROJECT_ID)

echo ""
echo "======================================================"
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo "======================================================"
echo ""
echo "🌐 Your backend is live at:"
echo "   $SERVICE_URL"
echo ""
echo "📋 Next steps:"
echo "   1. Update your frontend API URL to: $SERVICE_URL"
echo "   2. Add this URL to Google OAuth authorized origins"
echo "   3. Test the deployment: curl $SERVICE_URL/api/health"
echo ""
echo "📊 Monitor your service:"
echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"
echo ""
echo "💰 Check costs (should be $0 in free tier):"
echo "   https://console.cloud.google.com/billing"
echo ""
