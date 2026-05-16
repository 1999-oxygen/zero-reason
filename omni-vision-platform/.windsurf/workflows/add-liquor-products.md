---
description: Add liquor products with prices for automated sales tracking
---

# Add Liquor Products Workflow

This workflow helps you add alcohol brands to your liquor store with buy/sell prices for automated profit tracking.

## Step 1: Prepare Product List

Create a list of your products with this information:
- Brand name (e.g., "Tusker Lager 500ml")
- Buying price (what you pay supplier)
- Selling price (what customer pays)
- Initial stock count (optional)

**Example format:**
```
Tusker Lager 500ml - Buy: KES 150 | Sell: KES 220 | Stock: 48
Chrome Vodka 250ml - Buy: KES 180 | Sell: KES 250 | Stock: 24
Johnnie Walker Black 750ml - Buy: KES 2800 | Sell: KES 3500 | Stock: 12
```

## Step 2: Add Products to Database

**Option A: Using CSV Import (Recommended for bulk)**

1. Edit the sample CSV file:
```bash
# File is at: sample_products.csv
# Edit with your products
```

2. Run import script:
```bash
cd backend
python3 import_products.py ../sample_products.csv
```

**Option B: Using API (For individual products)**

```bash
curl -X POST http://localhost:8000/api/pos/products \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": 50,
    "brand_name": "Your_Product_Name",
    "buying_price": 100,
    "selling_price": 150,
    "category": "liquor",
    "stock": 20
  }'
```

## Step 3: Upload Training Images

For AI to recognize each product:

1. Go to **Settings → Sector AI Configuration**
2. Select **"Liquor Stores"**
3. Click **"Upload Training Images"**
4. Upload 5-10 clear photos per product
5. Label each image with exact product name (e.g., `Tusker_Lager_500ml`)

**Photo tips:**
- Well-lit, clear label
- Different angles
- On shelf, in hand, at checkout
- Match product name exactly

## Step 4: Configure Detection Zones

Set up 3 camera zones:

1. **Shelf Zone** - Monitors product selection
2. **Checkout Zone** - Triggers sale logging
3. **Exit Zone** - Detects theft

Zones are configured in `backend/ai_brain.py` or via UI (coming soon).

## Step 5: Test Detection

1. Go to **Live Cameras** (Liquor Stores sector)
2. Hold a product in front of camera
3. Verify AI detects correct brand
4. Check confidence score (should be >0.8)

## Step 6: Verify Sales Logging

1. Simulate a sale by moving bottle through checkout zone
2. Check **Dashboard** for new sale entry
3. Verify profit calculation is correct
4. Check daily summary updates

## Product Naming Convention

Use underscores and include size:
- ✅ `Tusker_Lager_500ml`
- ✅ `Johnnie_Walker_Black_750ml`
- ❌ `Tusker Lager` (no size)
- ❌ `tusker-lager-500ml` (use underscores)

## Troubleshooting

**Products not detected:**
- Upload more training images
- Check image quality and lighting
- Verify product name matches exactly

**Wrong profit calculated:**
- Check buy/sell prices in database
- Verify product class_id is unique
- Check sales log for correct product match

**Sales not logging:**
- Verify checkout zone is configured
- Check camera covers checkout area
- Ensure backend is running

## Next Steps

After adding products:
1. Monitor daily sales dashboard
2. Review profit reports
3. Adjust stock levels
4. Train staff on theft alerts
