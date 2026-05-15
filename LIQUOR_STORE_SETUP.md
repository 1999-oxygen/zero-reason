# 🍾 Liquor Store AI - Complete Setup Guide

## Overview
This guide will help you set up **automated brand recognition, sales tracking, profit calculation, and theft detection** for your liquor store using AI.

---

## 🎯 System Capabilities

### 1. **Brand Recognition**
- Detect specific alcohol brands (Tusker, Chrome Vodka, Johnnie Walker, etc.)
- Identify bottle size and type
- Track products from shelf → checkout → exit

### 2. **Automated Sales Logging**
- Detect when bottle crosses checkout zone
- Match detected brand to product catalog
- Log sale with timestamp, product, price
- Calculate profit automatically (selling price - buying price)

### 3. **Theft Detection**
- Alert when bottle leaves store without POS transaction
- Track suspicious concealment behavior
- Monitor exit zones for unpaid items

### 4. **Daily Reporting**
- Total sales revenue
- Total profit (auto-calculated)
- Best-selling products
- Theft incidents
- Low stock alerts

---

## 📋 Step-by-Step Setup

### Step 1: Add Your Liquor Products

I'll help you add your alcohol brands with prices. For each product, provide:
- **Brand name** (e.g., "Tusker Lager 500ml")
- **Buying price** (what you pay supplier)
- **Selling price** (what customer pays)
- **Initial stock** (optional)

**Example products already in system:**
```
1. Chrome Vodka 250ml - Buy: KES 180 | Sell: KES 250 | Profit: KES 70
2. Tusker Lager 500ml - Buy: KES 150 | Sell: KES 220 | Profit: KES 70
3. Johnnie Walker Black 750ml - Buy: KES 2800 | Sell: KES 3500 | Profit: KES 700
4. Smirnoff Ice 300ml - Buy: KES 120 | Sell: KES 180 | Profit: KES 60
```

**To add more products, provide this format:**
```
Brand: Heineken 330ml
Buying Price: KES 100
Selling Price: KES 150
Stock: 50
```

### Step 2: Upload Training Images

For the AI to recognize your brands, upload **5-10 clear photos** of each product:

1. Go to **Settings → Sector AI Configuration**
2. Select **"Liquor Stores"**
3. Scroll to **"Custom Training Database"**
4. Click **"Upload Training Images"** or drag & drop

**Photo guidelines:**
- ✅ Clear, well-lit photos
- ✅ Different angles (front, side, label close-up)
- ✅ On shelf, in hand, at checkout
- ✅ Various lighting conditions
- ❌ Avoid blurry or dark images

**Label each image:**
- Use exact product name: `Tusker_Lager_500ml`
- Match the brand name in your product catalog
- Consistent naming is critical!

### Step 3: Set Up Camera Zones

Your liquor store needs **3 camera zones**:

**Zone 1: Shelf Monitoring**
- Camera pointing at liquor shelves
- Detects when customer picks up bottle
- Tracks which brand was selected

**Zone 2: Checkout Zone**
- Camera at POS/counter
- Detects bottles being scanned
- Triggers automatic sale logging

**Zone 3: Exit Zone**
- Camera at store exit
- Detects bottles leaving
- Compares with POS transactions
- Alerts if bottle exits without payment

**To add cameras:**
1. Switch to **"Liquor Stores"** in sidebar
2. Go to **Settings → Camera Management → Add Camera**
3. Add 3 cameras:
   - Name: "Shelf Camera", Location: "Main Shelf"
   - Name: "Checkout Camera", Location: "POS Counter"
   - Name: "Exit Camera", Location: "Store Exit"

### Step 4: Configure Detection Zones

The backend AI uses **polygon zones** to track bottle movement:

**Current liquor zones (in `backend/ai_brain.py`):**
```python
"liquor": [
    # Shelf zone (left side)
    {"name": "shelf", "polygon": [[0.05, 0.3], [0.4, 0.3], [0.4, 0.8], [0.05, 0.8]]},
    # Checkout zone (center)
    {"name": "checkout", "polygon": [[0.4, 0.4], [0.7, 0.4], [0.7, 0.7], [0.4, 0.7]]},
    # Exit zone (right side)
    {"name": "exit", "polygon": [[0.75, 0.1], [0.95, 0.1], [0.95, 0.9], [0.75, 0.9]]}
]
```

These zones are **normalized coordinates** (0.0 to 1.0):
- `[0.05, 0.3]` = 5% from left, 30% from top
- Adjust based on your camera angles

---

## 🤖 How It Works

### Brand Recognition Flow

```
1. Customer picks bottle from shelf
   ↓
2. AI detects: "Tusker_Lager_500ml" (confidence: 0.92)
   ↓
3. Tracks bottle to checkout zone
   ↓
4. Bottle enters checkout zone
   ↓
5. AI triggers sale event
   ↓
6. Backend logs:
   - Product: Tusker Lager 500ml
   - Selling Price: KES 220
   - Buying Price: KES 150
   - Profit: KES 70
   - Timestamp: 2026-05-15 08:30:45
   ↓
7. Updates daily totals automatically
```

### Theft Detection Flow

```
1. Customer picks bottle from shelf
   ↓
2. AI detects: "Johnnie_Walker_Black_750ml"
   ↓
3. Tracks bottle movement
   ↓
4. Bottle bypasses checkout zone
   ↓
5. Bottle enters exit zone
   ↓
6. AI checks: Was this bottle paid for?
   ↓
7. NO POS transaction found
   ↓
8. ALERT: "Theft detected - Johnnie Walker Black - KES 3500"
   ↓
9. Alert sent to dashboard + optional SMS/email
```

---

## 💰 Automated Profit Tracking

### Daily Sales Report (Auto-Generated)

**End of Day Summary:**
```
Date: 2026-05-15
─────────────────────────────────────
Total Sales: KES 15,420
Total Cost: KES 10,280
Total Profit: KES 5,140
─────────────────────────────────────
Transactions: 47
Average Sale: KES 328

Top Products:
1. Tusker Lager 500ml - 18 units - KES 1,260 profit
2. Chrome Vodka 250ml - 12 units - KES 840 profit
3. Smirnoff Ice 300ml - 10 units - KES 600 profit

Theft Incidents: 2
- Johnnie Walker Black (KES 3,500)
- Tusker Lager (KES 220)
Total Loss: KES 3,720
─────────────────────────────────────
Net Profit: KES 1,420
```

### Access Reports

**In the app:**
1. Go to **Dashboard**
2. Switch to **"Liquor Stores"** sector
3. View **"Daily Sales Summary"** widget
4. Click **"View Detailed Report"** for breakdown

**Via API:**
```bash
curl http://localhost:8000/api/pos/daily-summary
curl http://localhost:8000/api/pos/sales-history?days=7
```

---

## 🚨 Alert System

### Theft Alerts
- **Trigger:** Bottle exits without POS transaction
- **Severity:** HIGH
- **Action:** Immediate notification + video clip saved

### High-Value Item Alerts
- **Trigger:** Premium bottle (>KES 2000) detected
- **Severity:** MEDIUM
- **Action:** Extra monitoring, age verification prompt

### Concealment Alerts
- **Trigger:** Bottle hidden in bag/clothing
- **Severity:** HIGH
- **Action:** Alert staff immediately

### Low Stock Alerts
- **Trigger:** Product stock < 5 units
- **Severity:** LOW
- **Action:** Reorder reminder

---

## 📊 Liquor Store Dashboard Features

### Real-Time Metrics
- **Live Sales Counter** - Updates as bottles detected at checkout
- **Profit Meter** - Running total of today's profit
- **Theft Tracker** - Count of theft incidents
- **Inventory Status** - Stock levels per product

### Analytics
- **Best Sellers** - Top 10 products by revenue
- **Profit Margins** - Which products make most profit
- **Peak Hours** - Busiest sales times
- **Theft Patterns** - Common theft times/products

### Video Playback
- **Incident Review** - Watch theft events
- **Sale Verification** - Confirm AI detected correct product
- **Training Clips** - Save good examples for model improvement

---

## 🔧 Advanced Configuration

### 1. Adjust Detection Confidence

Higher confidence = fewer false positives, but may miss some detections
Lower confidence = more detections, but more mistakes

**Current:** 0.8 (80% confidence required)

**To adjust:**
1. Settings → Sector AI Configuration → Liquor Stores
2. Slide **"Detection Confidence Threshold"**
3. Recommended: 0.75 - 0.85 for liquor

### 2. Custom ML Model (Optional)

For even better accuracy, train a custom YOLO model:

**Option A: Roboflow (Easiest)**
1. Upload your training images to Roboflow
2. Train model (free tier available)
3. Get API URL
4. Paste in **"ML Model URL"** field

**Option B: Local YOLO (Best Performance)**
1. Collect 100+ images per product
2. Label with LabelImg or Roboflow
3. Train YOLOv8 model locally
4. Place `.pt` file in `backend/models/`
5. Backend will auto-load

### 3. Zone Customization

Edit `backend/ai_brain.py` to adjust zones for your store layout:

```python
"liquor": [
    {
        "name": "shelf",
        "polygon": [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
    },
    # Add more zones as needed
]
```

Use the **Zone Editor** (coming soon) to draw zones visually.

---

## 📝 Product Catalog Template

Copy this template and fill in your products:

```csv
brand_name,buying_price,selling_price,category,stock,class_id
Tusker_Lager_500ml,150,220,liquor,48,41
Chrome_Vodka_250ml,180,250,liquor,24,39
Johnnie_Walker_Black_750ml,2800,3500,liquor,12,42
Smirnoff_Ice_300ml,120,180,liquor,36,43
Heineken_330ml,100,150,liquor,50,44
Guinness_500ml,140,200,liquor,30,45
Baileys_750ml,1800,2300,liquor,15,46
Captain_Morgan_750ml,1200,1600,liquor,20,47
```

**To import:**
```bash
# Save as products.csv, then:
python3 backend/import_products.py products.csv
```

---

## 🎓 Training Tips

### Getting Best Recognition Results

**1. Image Quality**
- Use good lighting (natural or bright LED)
- Avoid shadows on labels
- Keep labels readable
- 1080p or higher resolution

**2. Image Variety**
- Different angles (0°, 45°, 90°)
- Different distances (close-up, medium, far)
- Different backgrounds (shelf, counter, hand)
- Different lighting (day, night, fluorescent)

**3. Labeling Consistency**
- Use underscores: `Tusker_Lager_500ml`
- Include size: `_500ml`, `_750ml`
- Match product catalog exactly
- No spaces or special characters

**4. Quantity**
- Minimum: 5 images per product
- Recommended: 10-20 images per product
- Ideal: 50+ images per product

### Testing Your Model

1. Upload training images
2. Wait 5 minutes for backend to process
3. Go to **Live Cameras**
4. Hold bottle in front of camera
5. Check if AI detects correct brand
6. If wrong, upload more training images

---

## 🚀 Quick Start Checklist

- [ ] Add all liquor products with buy/sell prices
- [ ] Upload 5-10 training images per product
- [ ] Label images with exact product names
- [ ] Add 3 cameras (shelf, checkout, exit)
- [ ] Test detection with real bottles
- [ ] Verify sales logging works
- [ ] Check profit calculations
- [ ] Test theft detection
- [ ] Review daily reports

---

## 🆘 Troubleshooting

### AI Not Detecting Bottles
- **Check:** Camera angle - should see full bottle
- **Check:** Lighting - too dark or too bright?
- **Check:** Training images - uploaded and labeled?
- **Check:** Confidence threshold - try lowering to 0.7

### Wrong Brand Detected
- **Fix:** Upload more training images of correct brand
- **Fix:** Upload images of commonly confused brands
- **Fix:** Ensure labels are clear in images

### Sales Not Logging
- **Check:** Checkout zone configured correctly?
- **Check:** Bottle actually entering checkout zone?
- **Check:** Product exists in catalog?
- **Check:** Backend running?

### Theft Alerts Too Sensitive
- **Fix:** Increase delay before exit alert (5 seconds → 10 seconds)
- **Fix:** Adjust exit zone to be further from checkout
- **Fix:** Whitelist staff members (coming soon)

---

## 📞 Next Steps

**Ready to set up? Provide:**

1. **Your liquor products** (brand, buy price, sell price)
2. **Training images** (I'll guide you on upload)
3. **Camera setup** (I'll help configure zones)

Then I'll:
- ✅ Add products to catalog
- ✅ Configure AI detection
- ✅ Set up automated sales logging
- ✅ Enable profit tracking
- ✅ Activate theft detection
- ✅ Create custom dashboard

**Let's make your liquor store fully automated! 🚀**
