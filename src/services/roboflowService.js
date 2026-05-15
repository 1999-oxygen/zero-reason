/**
 * Roboflow API Integration Service
 * Handles inference requests to Roboflow hosted models
 * Supports all sectors with custom ML model URLs
 */

class RoboflowService {
  constructor() {
    this.activeModels = new Map(); // sectorId -> model config
    this.inferenceCache = new Map(); // Cache recent inferences
    this.cacheTimeout = 100; // ms
  }

  /**
   * Parse Roboflow URL to extract project, version, and API key
   * Example: https://detect.roboflow.com/liquor-detection/3?api_key=YOUR_KEY
   */
  parseRoboflowUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const apiKey = urlObj.searchParams.get('api_key');
      
      if (pathParts.length < 2) {
        throw new Error('Invalid Roboflow URL format');
      }

      return {
        baseUrl: `${urlObj.protocol}//${urlObj.host}`,
        project: pathParts[0],
        version: pathParts[1],
        apiKey: apiKey,
        fullUrl: url
      };
    } catch (e) {
      console.error('Failed to parse Roboflow URL:', e);
      return null;
    }
  }

  /**
   * Register a custom ML model for a sector
   */
  registerModel(sectorId, modelUrl, modelType = 'roboflow') {
    if (!modelUrl) {
      this.activeModels.delete(sectorId);
      return false;
    }

    const parsed = this.parseRoboflowUrl(modelUrl);
    if (!parsed) {
      console.error(`Invalid model URL for sector ${sectorId}`);
      return false;
    }

    this.activeModels.set(sectorId, {
      sectorId,
      modelType,
      url: modelUrl,
      parsed,
      lastUsed: Date.now()
    });

    console.log(`✅ Registered ${modelType} model for sector: ${sectorId}`);
    return true;
  }

  /**
   * Check if a sector has a custom model configured
   */
  hasCustomModel(sectorId) {
    return this.activeModels.has(sectorId);
  }

  /**
   * Get model config for a sector
   */
  getModelConfig(sectorId) {
    return this.activeModels.get(sectorId);
  }

  /**
   * Convert video frame to base64 for Roboflow API
   */
  async frameToBase64(videoElement) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      resolve(base64);
    });
  }

  /**
   * Perform inference on a video frame using Roboflow API
   */
  async inferFrame(sectorId, videoElement, confidenceThreshold = 0.6) {
    const modelConfig = this.activeModels.get(sectorId);
    if (!modelConfig) {
      throw new Error(`No model registered for sector: ${sectorId}`);
    }

    const { parsed } = modelConfig;
    if (!parsed.apiKey) {
      throw new Error('Roboflow API key missing in URL');
    }

    try {
      // Convert frame to base64
      const base64Image = await this.frameToBase64(videoElement);

      // Build inference URL
      const inferenceUrl = `${parsed.baseUrl}/${parsed.project}/${parsed.version}?api_key=${parsed.apiKey}&confidence=${confidenceThreshold * 100}`;

      // Call Roboflow API
      const response = await fetch(inferenceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: base64Image
      });

      if (!response.ok) {
        throw new Error(`Roboflow API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform Roboflow response to our format
      const detections = this.transformRoboflowResponse(data, videoElement);
      
      // Update last used timestamp
      modelConfig.lastUsed = Date.now();
      
      return detections;
    } catch (error) {
      console.error('Roboflow inference error:', error);
      throw error;
    }
  }

  /**
   * Transform Roboflow API response to our detection format
   */
  transformRoboflowResponse(roboflowData, videoElement) {
    const width = videoElement.videoWidth || 640;
    const height = videoElement.videoHeight || 480;

    if (!roboflowData.predictions || roboflowData.predictions.length === 0) {
      return [];
    }

    return roboflowData.predictions.map((pred, idx) => {
      // Roboflow returns: {x, y, width, height, class, confidence}
      // We need: {x, y, width, height, label, confidence, class_id}
      
      // Convert center coordinates to top-left
      const x = pred.x - (pred.width / 2);
      const y = pred.y - (pred.height / 2);

      return {
        id: `roboflow_${idx}_${Date.now()}`,
        label: pred.class || 'unknown',
        class_id: pred.class_id || 0,
        confidence: pred.confidence,
        x: x / width,           // Normalize to 0-1
        y: y / height,
        width: pred.width / width,
        height: pred.height / height,
        box: [x, y, x + pred.width, y + pred.height], // Absolute pixels
        source: 'roboflow',
        timestamp: Date.now()
      };
    });
  }

  /**
   * Batch inference for multiple frames (optional optimization)
   */
  async inferBatch(sectorId, frames, confidenceThreshold = 0.6) {
    const results = [];
    for (const frame of frames) {
      try {
        const detections = await this.inferFrame(sectorId, frame, confidenceThreshold);
        results.push(detections);
      } catch (e) {
        results.push([]);
      }
    }
    return results;
  }

  /**
   * Test model connection
   */
  async testModel(sectorId) {
    const modelConfig = this.activeModels.get(sectorId);
    if (!modelConfig) {
      return { success: false, error: 'No model registered' };
    }

    try {
      // Create a test canvas with a simple image
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#fff';
      ctx.font = '30px Arial';
      ctx.fillText('Test Image', 250, 240);

      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const { parsed } = modelConfig;
      const inferenceUrl = `${parsed.baseUrl}/${parsed.project}/${parsed.version}?api_key=${parsed.apiKey}`;

      const response = await fetch(inferenceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: base64
      });

      if (!response.ok) {
        return { 
          success: false, 
          error: `API returned ${response.status}`,
          status: response.status
        };
      }

      const data = await response.json();
      return {
        success: true,
        model: `${parsed.project}/${parsed.version}`,
        classes: data.predictions?.length || 0,
        message: 'Model connected successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get statistics for all registered models
   */
  getStats() {
    const stats = {};
    this.activeModels.forEach((config, sectorId) => {
      stats[sectorId] = {
        modelType: config.modelType,
        project: config.parsed.project,
        version: config.parsed.version,
        lastUsed: new Date(config.lastUsed).toLocaleString(),
        hasApiKey: !!config.parsed.apiKey
      };
    });
    return stats;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.inferenceCache.clear();
  }

  /**
   * Remove model for a sector
   */
  unregisterModel(sectorId) {
    this.activeModels.delete(sectorId);
    console.log(`🗑️ Unregistered model for sector: ${sectorId}`);
  }
}

// Export singleton instance
const roboflowService = new RoboflowService();
export default roboflowService;
