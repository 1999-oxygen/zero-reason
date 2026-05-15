# Custom ML Model Integration Guide

## Overview
OmniVision supports custom machine learning models from **Roboflow** and other platforms for all 7 sectors. When you link a custom ML model, the system will use it instead of the built-in YOLO model for real-time detection.

---

## 🎯 Supported Platforms

### 1. Roboflow (Recommended)
- **Easy to use** - Train models with drag-and-drop
- **Fast inference** - Cloud-based API
- **Free tier available** - 1,000 predictions/month
- **Custom classes** - Train on your specific products

### 2. TensorFlow.js (Coming Soon)
- Self-hosted models
- No API limits
- Requires more setup

### 3. Custom REST API (Coming Soon)
- Bring your own model
- Any inference endpoint

---

## 📋 Step-by-Step: Roboflow Integration

### Step 1: Create a Roboflow Account
1. Go to [https://roboflow.com](https://roboflow.com)
2. Sign up for free account
3. Create a new project

### Step 2: Upload Training Images
1. In Roboflow, click **"Upload"**
2. Upload your training images (e.g., liquor bottles, products)
3. **Minimum:** 50 images per class
4. **Recommended:** 100-200 images per class

### Step 3: Label Your Images
1. Click **"Annotate"**
2. Draw bounding boxes around objects
3. Label each box with class name (e.g., "Tusker_Lager_500ml")
4. Be consistent with naming!

**Labeling tips:**
- Use underscores: `Tusker_Lager_500ml`
- Include size in name
- Match your product catalog exactly
- Label all instances in each image

### Step 4: Generate Dataset
1. Click **"Generate"** → **"Create Version"**
2. Choose augmentations (optional):
   - Flip: Horizontal
   - Rotation: ±15°
   - Brightness: ±15%
3. Click **"Generate"**

### Step 5: Train Model
1. Click **"Train"** → **"Train from Scratch"**
2. Choose model type: **YOLOv8** (recommended)
3. Wait for training (5-30 minutes)
4. Review accuracy metrics

### Step 6: Get API URL
1. Go to **"Deploy"** → **"Hosted API"**
2. Copy the inference URL:
   ```
   https://detect.roboflow.com/your-project/3?api_key=YOUR_API_KEY
   ```
3. **Important:** Keep your API key secure!

### Step 7: Link to OmniVision
1. Open OmniVision app
2. Go to **Settings → Sector AI Configuration**
3. Select your sector (e.g., "Liquor Stores")
4. Paste URL in **"ML Model URL"** field
5. Click **"Save"**

### Step 8: Test Detection
1. Go to **Live Cameras** for that sector
2. Point camera at your product
3. You should see:
   - **"Custom ML Model Active"** badge (bottom left)
   - Bounding boxes around detected products
   - Correct product labels
   - Confidence scores

---

## 🔧 Configuration Per Sector

### Retail & Shoes
**Use case:** Detect specific shoe brands, clothing items
```
Example classes:
- Nike_Air_Max_90
- Adidas_Ultraboost
- Leather_Jacket_Black
- Designer_Handbag
```

### Liquor Stores
**Use case:** Detect alcohol brands for automated sales
```
Example classes:
- Tusker_Lager_500ml
- Johnnie_Walker_Black_750ml
- Chrome_Vodka_250ml
- Heineken_330ml
```

### Hotels & Dining
**Use case:** Detect food items, table settings
```
Example classes:
- Plate_Full
- Plate_Empty
- Wine_Glass
- Bill_Folder
```

### Clubs & Nightlife
**Use case:** Detect bottles, crowd density
```
Example classes:
- Champagne_Bottle
- Beer_Bottle
- VIP_Table
- Crowd_Dense
```

### Facility Security
**Use case:** Detect weapons, unauthorized items
```
Example classes:
- Person
- Vehicle
- Suspicious_Package
- Restricted_Item
```

### Education & Wellness
**Use case:** Detect students, classroom items
```
Example classes:
- Student_Uniform
- Backpack
- Laptop
- Textbook
```

### Livestock & Farms
**Use case:** Detect animals, health issues
```
Example classes:
- Cow_Healthy
- Cow_Sick
- Sheep
- Predator
```

---

## 🎨 Best Practices

### Image Collection
- **Variety:** Different angles, lighting, distances
- **Quality:** Clear, well-lit, in-focus
- **Quantity:** More is better (100+ per class)
- **Real-world:** Match actual camera conditions

### Labeling
- **Consistency:** Same name for same object
- **Precision:** Tight bounding boxes
- **Completeness:** Label all instances
- **Verification:** Double-check labels

### Model Training
- **Augmentation:** Use for small datasets (<100 images)
- **Validation:** Check accuracy on test set
- **Iteration:** Retrain if accuracy <90%
- **Version control:** Keep track of model versions

### Deployment
- **Test first:** Verify on sample images
- **Monitor:** Check detection accuracy
- **Update:** Retrain with new data periodically
- **Backup:** Keep old model URLs

---

## 📊 Performance Optimization

### Inference Speed
- **Roboflow:** ~200-500ms per frame
- **Recommendation:** Run inference every 1-2 seconds
- **Adjust in code:** `intervalRef` timing in AIDetectionOverlay

### Confidence Threshold
- **Default:** 0.6 (60%)
- **High precision:** 0.8-0.9 (fewer false positives)
- **High recall:** 0.4-0.6 (catch more objects)
- **Adjust per sector** in Settings

### API Limits
- **Free tier:** 1,000 predictions/month
- **Paid tier:** Unlimited
- **Optimization:** Cache recent detections, reduce frame rate

---

## 🔍 Troubleshooting

### Model Not Detecting
**Check:**
- [ ] API URL is correct
- [ ] API key is valid
- [ ] Camera feed is active
- [ ] Objects are in frame
- [ ] Lighting is adequate

**Fix:**
- Verify URL format: `https://detect.roboflow.com/PROJECT/VERSION?api_key=KEY`
- Check Roboflow dashboard for API usage
- Ensure camera is streaming
- Adjust confidence threshold

### Wrong Detections
**Check:**
- [ ] Model trained on similar images?
- [ ] Labeling was consistent?
- [ ] Enough training data?

**Fix:**
- Upload more training images
- Retrain with better labels
- Increase confidence threshold

### Slow Inference
**Check:**
- [ ] Internet connection speed
- [ ] Roboflow API status
- [ ] Too many concurrent requests

**Fix:**
- Reduce inference frequency (2-3 seconds)
- Use smaller image resolution
- Upgrade Roboflow plan

### API Errors
**Common errors:**
- `401 Unauthorized` - Invalid API key
- `429 Too Many Requests` - Rate limit exceeded
- `500 Server Error` - Roboflow issue

**Fix:**
- Check API key in URL
- Wait or upgrade plan
- Contact Roboflow support

---

## 💡 Example: Liquor Store Setup

### 1. Collect Images
Take 100 photos of each product:
- 20 on shelf (different angles)
- 20 in hand (customer holding)
- 20 at checkout (on counter)
- 20 in different lighting
- 20 with other products nearby

### 2. Create Roboflow Project
```
Project Name: Liquor Store Detection
Classes:
- Tusker_Lager_500ml
- Chrome_Vodka_250ml
- Johnnie_Walker_Black_750ml
- Heineken_330ml
- Guinness_500ml
```

### 3. Label All Images
- Draw tight boxes around bottles
- Use exact class names
- Label partially visible bottles too

### 4. Train Model
```
Model: YOLOv8n (fast)
Augmentations:
- Flip: Horizontal
- Brightness: ±15%
- Rotation: ±10°
```

### 5. Get URL
```
https://detect.roboflow.com/liquor-detection/3?api_key=abc123xyz
```

### 6. Configure OmniVision
1. Settings → Sector AI Configuration → Liquor Stores
2. Paste URL in "ML Model URL"
3. Set confidence threshold: 0.75
4. Save

### 7. Test
1. Live Cameras → Liquor Stores
2. Point camera at Tusker bottle
3. Should see: "Tusker_Lager_500ml (0.92)"

---

## 🚀 Advanced Features

### Multi-Model Setup
Run different models for different sectors:
```
Retail: retail-shoes-v2
Liquor: liquor-detection-v3
Clubs: nightclub-monitoring-v1
```

### Model Versioning
Keep track of model versions:
```
v1: Initial model (80% accuracy)
v2: Added 50 more images (85% accuracy)
v3: Fixed mislabeling (92% accuracy) ← Current
```

### A/B Testing
Compare models:
1. Train two versions
2. Deploy both
3. Compare accuracy
4. Use best performer

### Continuous Improvement
1. Save misdetections
2. Add to training set
3. Retrain monthly
4. Deploy new version

---

## 📞 Support

### Roboflow Help
- Docs: [https://docs.roboflow.com](https://docs.roboflow.com)
- Forum: [https://discuss.roboflow.com](https://discuss.roboflow.com)
- Email: support@roboflow.com

### OmniVision Help
- Check `INTEGRATION_STATUS.md`
- Review `LIQUOR_STORE_SETUP.md`
- Test with `test_backend.sh`

---

## ✅ Checklist

Before going live:
- [ ] Trained model with 100+ images per class
- [ ] Tested on sample images (>90% accuracy)
- [ ] Configured correct API URL
- [ ] Set appropriate confidence threshold
- [ ] Tested live camera feed
- [ ] Verified detections are accurate
- [ ] Monitored API usage
- [ ] Set up alerts for errors

---

**Ready to train your custom model? Start with Roboflow today! 🚀**
