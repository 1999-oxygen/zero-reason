# Multi-Sector AI Surveillance System

## Overview
Your application now has a powerful sector-based AI system where each business type has its own custom AI "brain", training database, and ML models.

---

## ✅ What's Been Implemented

### 1. **New Business Sectors Added**
- **Liquor Stores** (Wine icon, amber theme)
  - Premium item tracking
  - Age verification detection
  - Concealment and theft detection
  - Custom liquor product recognition

- **Clubs & Nightlife** (Music icon, pink theme)
  - Crowd density monitoring
  - VIP area access control
  - Fight/aggressive behavior detection
  - Entry/exit tracking

### 2. **Sector-Specific AI Configuration System**
Created a new service (`src/services/sectorAIConfig.js`) that provides:

#### For Each Sector:
- **Custom AI Model Selection**
  - General retail detection
  - Hospitality & dining
  - Liquor store specialized
  - Nightlife & clubs specialized
  - Security & surveillance
  - Agriculture & livestock
  - Education & wellness
  - Custom trained models

- **Custom Training Database**
  - Upload and label training images
  - Sector-specific object classes
  - Image count tracking
  - Import/export configurations

- **Detection Configuration**
  - Confidence thresholds per sector
  - Enabled detection types
  - Special rules for liquor and clubs
  - Object class definitions

### 3. **Sector-Based Camera Filtering**
- **Live Camera View**: Automatically filters cameras by selected sector
- **Dashboard Display**: Shows only cameras assigned to the current sector
- **Camera Count**: Displays online/total cameras per sector

### 4. **Settings UI for Custom AI Models**

#### Sector Selection
Interactive grid showing all 7 sectors:
- Retail & Shoes
- Hotels & Dining
- Liquor Stores ⭐ NEW
- Clubs & Nightlife ⭐ NEW
- Facility Security
- Education & Wellness
- Livestock & Farms

#### Configuration Panel (Per Sector)
1. **Enable/Disable Toggle** - Turn AI on/off for the sector
2. **AI Model Type Dropdown** - Select pre-trained or custom models
3. **Custom ML Model URL** - Link to Roboflow, TensorFlow.js, or custom models
4. **Confidence Threshold Slider** - Adjust detection sensitivity
5. **Detection Types Display** - Shows enabled detection capabilities
6. **Training Database**
   - Shows training image count
   - Displays trainable object classes
   - Add/remove training images
   - Clear training data

### 5. **Special Sector Features**

#### Liquor Stores
**Custom Database**: Liquor Product Database
- **Object Classes**: wine_bottle, beer_can, liquor_bottle, spirits, vodka, whiskey, rum, tequila, champagne, wine_red, wine_white, beer_pack, person, bag
- **Detection Types**: liquor_theft, age_verification, concealment, shoplifting
- **Special Rules**:
  - Age verification enabled
  - High-value tracking
  - Premium bottle tracking (champagne, premium whiskey, rare spirits)
  - Alert on concealment at 75% confidence

#### Clubs & Nightlife
**Custom Database**: Nightlife Activity Database
- **Object Classes**: person, bottle, glass, crowd, bartender, security_personnel, vip_guest, dance_floor
- **Detection Types**: crowd_density, aggressive_behavior, fight_detection, intoxication_detection, restricted_area_breach, vip_area_monitoring
- **Special Rules**:
  - Crowd density alerts (max threshold 85%)
  - Fight detection enabled
  - VIP area monitoring
  - Entrance/exit tracking

---

## 🎯 How to Use the System

### Step 1: Add Cameras to Sectors
1. Go to **Settings** in the sidebar
2. Scroll to **Camera Management**
3. Click **Add Camera**
4. Select the **AI Module / Sector** dropdown
5. Choose from: Retail, Hospitality, **Liquor Stores**, **Clubs & Nightlife**, Security, Education, Agriculture
6. Complete camera details and add

### Step 2: Configure Sector AI
1. In **Settings**, scroll to **Sector-Specific AI Models**
2. Click on a sector card (e.g., Liquor Stores)
3. Configure:
   - **AI Model Type**: Choose specialized model
   - **Custom ML Model URL**: (Optional) Add your trained model
   - **Confidence Threshold**: Adjust detection sensitivity
   - **Training Database**: Add images of products to train recognition

### Step 3: Monitor Live Feeds
1. Select a sector from the sidebar (e.g., Liquor Stores)
2. Click **Live Cameras** in Quick Access
3. **Only cameras assigned to that sector will appear**
4. Each camera feed uses the sector's custom AI model

### Step 4: View Sector-Specific Detection
When viewing a sector dashboard:
- **Liquor Stores**: See premium item tracking, age verification alerts, concealment detection
- **Clubs**: Monitor crowd density, fight detection, VIP area access
- Each sector shows specialized stats and detection overlays

---

## 🔧 Technical Architecture

### Sector Configuration Structure
```javascript
{
  liquor: {
    id: 'liquor',
    name: 'Liquor Stores',
    aiModel: 'liquor-specialized',
    customDatabase: {
      name: 'Liquor Product Database',
      type: 'image-recognition',
      itemCount: 0,
      trainingImages: [],
      labels: ['wine_bottles', 'beer_cans', 'spirits', ...]
    },
    mlModelUrl: null, // Link to custom model
    detectionTypes: ['liquor_theft', 'age_verification', ...],
    confidenceThreshold: 0.7,
    objectClasses: ['wine_bottle', 'beer_can', ...],
    specialRules: {
      ageVerification: true,
      highValueTracking: true,
      premiumBottleTracking: [...],
      alertOnConcealmentConfidence: 0.75
    },
    enabled: true
  }
}
```

### Camera Assignment
Each camera has a `module` field that links it to a sector:
```javascript
{
  id: 'cam_123',
  name: 'Entrance Camera',
  type: 'ip',
  module: 'liquor', // ← Sector assignment
  location: 'Main Store',
  status: 'online'
}
```

### Automatic Filtering
- Camera list filtered by `camera.module === activeModule`
- Only shows cameras for the selected sector
- Real-time feed uses sector-specific AI config

---

## 📊 Sector-Specific Detection Types

### Liquor Stores
- `liquor_theft` - Detect theft of alcohol products
- `age_verification` - Identify customers needing age checks
- `concealment` - Detect items being hidden
- `shoplifting` - General shoplifting detection

### Clubs & Nightlife
- `crowd_density` - Monitor crowd levels
- `aggressive_behavior` - Detect aggressive actions
- `fight_detection` - Identify physical altercations
- `intoxication_detection` - Monitor intoxication levels
- `restricted_area_breach` - VIP/staff area violations
- `vip_area_monitoring` - Track VIP section activity

### All Other Sectors
- Existing detection types maintained (retail, hospitality, security, education, agriculture)

---

## 💾 Data Persistence
All sector configurations are saved to `localStorage`:
- Key: `sectorAIConfigs`
- Automatically loaded on app start
- Survives page refreshes
- Can be exported/imported per sector

---

## 🚀 Next Steps: Adding Training Images

When you're ready to train custom models:

1. **Click "Add Training Images"** in a sector config
2. **Upload images** of products/scenarios specific to that sector
3. **Label objects** in each image (e.g., "premium_whiskey", "crowd_density_high")
4. **Train model** using the labeled dataset
5. **Deploy** by adding the model URL to "Custom ML Model URL"
6. The sector's cameras will automatically use your trained model!

---

## 📝 Summary

Your surveillance platform now has:
- ✅ **7 complete business sectors** (including Liquor Stores & Clubs)
- ✅ **Sector-specific AI "brains"** with custom models
- ✅ **Training databases** for each sector
- ✅ **Automatic camera filtering** by sector
- ✅ **Live feeds** using sector-specific detection
- ✅ **Custom ML model support** (Roboflow, TensorFlow.js, etc.)
- ✅ **Specialized detection rules** for liquor and clubs
- ✅ **Import/export configurations**
- ✅ **Persistent storage** of all settings

Each sector operates independently with its own AI model, detection rules, and training data. When you select a sector, you see only its cameras with its specialized AI detection running!
