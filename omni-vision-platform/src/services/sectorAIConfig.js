import { api } from './apiClient';

class SectorAIConfigService {
  constructor() {
    this.sectorConfigs = this.loadConfigs();
    this.backendAvailable = false;
    this._checkBackend();
  }

  async _checkBackend() {
    try {
      const res = await fetch('http://localhost:8000/api/health', { method: 'GET', mode: 'cors' });
      if (res.ok) {
        this.backendAvailable = true;
        // Sync from backend on startup
        const remote = await api.get('/api/sectors');
        if (remote && Object.keys(remote).length > 0) {
          this.sectorConfigs = { ...this.sectorConfigs, ...remote };
        }
      }
    } catch (e) {
      this.backendAvailable = false;
    }
  }

  loadConfigs() {
    const stored = localStorage.getItem('sectorAIConfigs');
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      retail: {
        id: 'retail',
        name: 'Retail & Shoes',
        aiModel: 'general-retail',
        customDatabase: null,
        mlModelUrl: null,
        detectionTypes: ['theft', 'concealment', 'exit_without_payment'],
        confidenceThreshold: 0.6,
        objectClasses: ['shoes', 'clothing', 'accessories', 'bags'],
        enabled: true
      },
      hospitality: {
        id: 'hospitality',
        name: 'Hotels & Dining',
        aiModel: 'hospitality',
        customDatabase: null,
        mlModelUrl: null,
        detectionTypes: ['dine_and_dash', 'unpaid_exit'],
        confidenceThreshold: 0.65,
        objectClasses: ['table', 'person', 'bill', 'exit'],
        enabled: true
      },
      liquor: {
        id: 'liquor',
        name: 'Liquor Stores',
        aiModel: 'liquor-specialized',
        customDatabase: {
          name: 'Liquor Product Database',
          type: 'image-recognition',
          itemCount: 0,
          trainingImages: [],
          labels: ['wine_bottles', 'beer_cans', 'spirits', 'premium_liquor', 'beer_packs']
        },
        mlModelUrl: null,
        detectionTypes: ['liquor_theft', 'age_verification', 'concealment', 'shoplifting'],
        confidenceThreshold: 0.7,
        objectClasses: [
          'wine_bottle', 'beer_can', 'liquor_bottle', 'spirits', 
          'vodka', 'whiskey', 'rum', 'tequila', 'champagne',
          'wine_red', 'wine_white', 'beer_pack', 'person', 'bag'
        ],
        specialRules: {
          ageVerification: true,
          highValueTracking: true,
          premiumBottleTracking: ['champagne', 'premium_whiskey', 'rare_spirits'],
          alertOnConcealmentConfidence: 0.75
        },
        enabled: true
      },
      clubs: {
        id: 'clubs',
        name: 'Clubs & Nightlife',
        aiModel: 'nightlife-specialized',
        customDatabase: {
          name: 'Nightlife Activity Database',
          type: 'behavior-recognition',
          itemCount: 0,
          trainingImages: [],
          labels: ['crowd_density', 'aggressive_behavior', 'intoxication', 'bottle_service']
        },
        mlModelUrl: null,
        detectionTypes: [
          'crowd_density',
          'aggressive_behavior', 
          'fight_detection',
          'intoxication_detection',
          'restricted_area_breach',
          'vip_area_monitoring'
        ],
        confidenceThreshold: 0.65,
        objectClasses: [
          'person', 'bottle', 'glass', 'crowd', 'bartender',
          'security_personnel', 'vip_guest', 'dance_floor'
        ],
        specialRules: {
          crowdDensityAlert: true,
          maxDensityThreshold: 0.85,
          fightDetection: true,
          vipAreaMonitoring: true,
          soundLevelTracking: false,
          entranceExitTracking: true
        },
        enabled: true
      },
      security: {
        id: 'security',
        name: 'Facility Security',
        aiModel: 'security',
        customDatabase: null,
        mlModelUrl: null,
        detectionTypes: ['intrusion', 'violence', 'restricted_access'],
        confidenceThreshold: 0.7,
        objectClasses: ['person', 'vehicle', 'weapon'],
        enabled: true
      },
      education: {
        id: 'education',
        name: 'Education & Wellness',
        aiModel: 'education',
        customDatabase: null,
        mlModelUrl: null,
        detectionTypes: ['welfare_check', 'isolation', 'loitering'],
        confidenceThreshold: 0.6,
        objectClasses: ['student', 'teacher', 'classroom'],
        enabled: true
      },
      agriculture: {
        id: 'agriculture',
        name: 'Livestock & Farms',
        aiModel: 'agriculture',
        customDatabase: null,
        mlModelUrl: null,
        detectionTypes: ['health_monitoring', 'predator_detection'],
        confidenceThreshold: 0.65,
        objectClasses: ['cow', 'sheep', 'predator', 'vehicle'],
        enabled: true
      }
    };
  }

  async saveConfigs() {
    localStorage.setItem('sectorAIConfigs', JSON.stringify(this.sectorConfigs));
    // Sync to backend if available
    if (this.backendAvailable) {
      for (const [id, cfg] of Object.entries(this.sectorConfigs)) {
        try { await api.post(`/api/sectors/${id}`, cfg); } catch (e) {}
      }
    }
  }

  getSectorConfig(sectorId) {
    return this.sectorConfigs[sectorId] || null;
  }

  async updateSectorConfig(sectorId, config) {
    this.sectorConfigs[sectorId] = {
      ...this.sectorConfigs[sectorId],
      ...config
    };
    await this.saveConfigs();
    // Also push single sector update to backend
    if (this.backendAvailable) {
      try { await api.post(`/api/sectors/${sectorId}`, this.sectorConfigs[sectorId]); } catch (e) {}
    }
    return this.sectorConfigs[sectorId];
  }

  addTrainingImage(sectorId, imageData, label) {
    const config = this.sectorConfigs[sectorId];
    if (config && config.customDatabase) {
      if (!config.customDatabase.trainingImages) {
        config.customDatabase.trainingImages = [];
      }
      
      config.customDatabase.trainingImages.push({
        id: `img_${Date.now()}`,
        data: imageData,
        label: label,
        timestamp: new Date().toISOString()
      });
      
      config.customDatabase.itemCount = config.customDatabase.trainingImages.length;
      this.saveConfigs();
      return true;
    }
    return false;
  }

  removeTrainingImage(sectorId, imageId) {
    const config = this.sectorConfigs[sectorId];
    if (config && config.customDatabase && config.customDatabase.trainingImages) {
      config.customDatabase.trainingImages = config.customDatabase.trainingImages.filter(
        img => img.id !== imageId
      );
      config.customDatabase.itemCount = config.customDatabase.trainingImages.length;
      this.saveConfigs();
      return true;
    }
    return false;
  }

  setCustomMLModel(sectorId, modelUrl, modelType = 'roboflow') {
    const config = this.sectorConfigs[sectorId];
    if (config) {
      config.mlModelUrl = modelUrl;
      config.mlModelType = modelType;
      this.saveConfigs();
      return true;
    }
    return false;
  }

  getTrainingImages(sectorId) {
    const config = this.sectorConfigs[sectorId];
    if (config && config.customDatabase) {
      return config.customDatabase.trainingImages || [];
    }
    return [];
  }

  clearTrainingData(sectorId) {
    const config = this.sectorConfigs[sectorId];
    if (config && config.customDatabase) {
      config.customDatabase.trainingImages = [];
      config.customDatabase.itemCount = 0;
      this.saveConfigs();
      return true;
    }
    return false;
  }

  getAllSectorConfigs() {
    return this.sectorConfigs;
  }

  exportSectorConfig(sectorId) {
    const config = this.sectorConfigs[sectorId];
    if (config) {
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sectorId}-ai-config.json`;
      link.click();
      URL.revokeObjectURL(url);
      return true;
    }
    return false;
  }

  importSectorConfig(sectorId, configData) {
    try {
      const config = typeof configData === 'string' ? JSON.parse(configData) : configData;
      this.sectorConfigs[sectorId] = {
        ...this.sectorConfigs[sectorId],
        ...config
      };
      this.saveConfigs();
      return true;
    } catch (error) {
      console.error('Error importing sector config:', error);
      return false;
    }
  }
}

export const sectorAIConfig = new SectorAIConfigService();

export default sectorAIConfig;
