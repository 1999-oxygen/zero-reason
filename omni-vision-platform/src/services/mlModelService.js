/**
 * ML Model Service
 * Manages loading and inference of custom ML models per sector.
 * Supports: Roboflow, TensorFlow.js (via CDN), and mock/simulated models.
 */

class MLModelService {
  constructor() {
    this.models = new Map(); // sectorId -> model
    this.modelStates = new Map(); // sectorId -> { status, error, loadedAt }
    this.inferenceCallbacks = new Map();
  }

  /**
   * Get model status for a sector
   */
  getModelStatus(sectorId) {
    return this.modelStates.get(sectorId) || {
      status: 'unloaded', // unloaded | loading | ready | error
      error: null,
      loadedAt: null,
      modelType: null,
      modelUrl: null
    };
  }

  /**
   * Load a model for a sector
   * @param {string} sectorId - The sector identifier
   * @param {string} modelUrl - URL to the model
   * @param {string} modelType - 'roboflow' | 'tensorflow' | 'custom'
   */
  async loadModel(sectorId, modelUrl, modelType = 'roboflow') {
    this.modelStates.set(sectorId, {
      status: 'loading',
      error: null,
      loadedAt: null,
      modelType,
      modelUrl
    });

    try {
      // Announce loading
      this._emitStateChange(sectorId);

      // In production, actual model loading would happen here:
      // - Roboflow: Load via Roboflow SDK
      // - TensorFlow.js: Load tf.LayersModel or tf.GraphModel
      // - Custom: Load from specified endpoint

      // For demo/development, simulate loading
      await this._simulateModelLoad(sectorId, modelUrl, modelType);

      this.modelStates.set(sectorId, {
        status: 'ready',
        error: null,
        loadedAt: new Date().toISOString(),
        modelType,
        modelUrl
      });

      this._emitStateChange(sectorId);
      console.log(`✅ Model loaded for sector "${sectorId}":`, { modelType, modelUrl });
      return true;

    } catch (error) {
      console.error(`❌ Failed to load model for sector "${sectorId}":`, error);
      this.modelStates.set(sectorId, {
        status: 'error',
        error: error.message,
        loadedAt: null,
        modelType,
        modelUrl
      });
      this._emitStateChange(sectorId);
      return false;
    }
  }

  /**
   * Unload a model for a sector
   */
  unloadModel(sectorId) {
    this.models.delete(sectorId);
    this.modelStates.delete(sectorId);
    this._emitStateChange(sectorId);
    console.log(`🗑️ Model unloaded for sector "${sectorId}"`);
  }

  /**
   * Run inference on an image/video element
   * @param {string} sectorId - Sector to use model from
   * @param {HTMLImageElement|HTMLVideoElement} element - Element to analyze
   * @returns {Array} Array of detections [{ label, confidence, bbox, severity }]
   */
  async runInference(sectorId, element) {
    const state = this.getModelStatus(sectorId);

    if (state.status !== 'ready') {
      return null; // No model loaded, use mock data instead
    }

    try {
      // In production, actual inference:
      // - Roboflow: rf.detect(image)
      // - TensorFlow.js: model.predict(preprocess(image))
      // - Custom: fetch(modelUrl, { body: imageData })

      // For demo, simulate inference with sector-specific detections
      const detections = this._simulateInference(sectorId);
      return detections;

    } catch (error) {
      console.error('Inference error:', error);
      return null;
    }
  }

  /**
   * Get all loaded models info
   */
  getLoadedModels() {
    const result = [];
    for (const [sectorId, state] of this.modelStates) {
      result.push({
        sectorId,
        ...state
      });
    }
    return result;
  }

  /**
   * Subscribe to model state changes
   */
  subscribeToState(sectorId, callback) {
    if (!this.inferenceCallbacks.has(sectorId)) {
      this.inferenceCallbacks.set(sectorId, []);
    }
    this.inferenceCallbacks.get(sectorId).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.inferenceCallbacks.get(sectorId) || [];
      this.inferenceCallbacks.set(
        sectorId,
        callbacks.filter(cb => cb !== callback)
      );
    };
  }

  /**
   * Emit state change to subscribers
   */
  _emitStateChange(sectorId) {
    const callbacks = this.inferenceCallbacks.get(sectorId) || [];
    const state = this.getModelStatus(sectorId);
    callbacks.forEach(cb => {
      try { cb(state); } catch (e) { console.error(e); }
    });
  }

  /**
   * Simulate model loading (for demo)
   */
  async _simulateModelLoad(sectorId, modelUrl, modelType) {
    const delay = 1500 + Math.random() * 1000; // 1.5-2.5s
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate random failure for testing (5% chance)
    if (Math.random() < 0.05) {
      throw new Error(`Model load timeout: ${modelType} model at ${modelUrl} could not be loaded`);
    }
  }

  /**
   * Simulate inference results (for demo)
   */
  _simulateInference(sectorId) {
    const sectorDetections = {
      liquor: [
        { label: 'wine_bottle', confidence: 0.92, bbox: [120, 200, 80, 240], severity: 'normal' },
        { label: 'premium_whiskey', confidence: 0.88, bbox: [300, 150, 70, 280], severity: 'high-value' },
        { label: 'person', confidence: 0.96, bbox: [450, 100, 140, 380], severity: 'normal' }
      ],
      clubs: [
        { label: 'person', confidence: 0.94, bbox: [100, 150, 120, 300], severity: 'normal' },
        { label: 'person', confidence: 0.91, bbox: [350, 180, 100, 260], severity: 'normal' },
        { label: 'crowd_zone', confidence: 0.85, bbox: [50, 80, 400, 350], severity: 'warning' }
      ],
      retail: [
        { label: 'shoes', confidence: 0.89, bbox: [200, 250, 150, 120], severity: 'normal' },
        { label: 'person', confidence: 0.95, bbox: [420, 80, 180, 420], severity: 'normal' },
        { label: 'bag', confidence: 0.73, bbox: [380, 300, 80, 100], severity: 'normal' }
      ],
      hospitality: [
        { label: 'table', confidence: 0.87, bbox: [150, 280, 250, 150], severity: 'normal' },
        { label: 'person', confidence: 0.93, bbox: [500, 120, 130, 360], severity: 'normal' }
      ],
      security: [
        { label: 'person', confidence: 0.94, bbox: [200, 180, 110, 320], severity: 'normal' },
        { label: 'person', confidence: 0.91, bbox: [420, 190, 100, 300], severity: 'normal' }
      ],
      education: [
        { label: 'student', confidence: 0.90, bbox: [180, 200, 90, 250], severity: 'normal' }
      ],
      agriculture: [
        { label: 'cow', confidence: 0.93, bbox: [200, 220, 180, 150], severity: 'normal' },
        { label: 'cow', confidence: 0.91, bbox: [500, 200, 170, 180], severity: 'normal' }
      ]
    };

    return sectorDetections[sectorId] || sectorDetections.retail;
  }

  /**
   * Export model config for a sector
   */
  exportModelConfig(sectorId) {
    const state = this.getModelStatus(sectorId);
    if (state.status === 'ready') {
      return {
        sectorId,
        modelUrl: state.modelUrl,
        modelType: state.modelType,
        loadedAt: state.loadedAt
      };
    }
    return null;
  }

  /**
   * Get inference performance stats
   */
  getPerformanceStats() {
    return {
      totalModels: this.models.size,
      loadedModels: Array.from(this.modelStates.values()).filter(s => s.status === 'ready').length,
      loadingModels: Array.from(this.modelStates.values()).filter(s => s.status === 'loading').length,
      failedModels: Array.from(this.modelStates.values()).filter(s => s.status === 'error').length
    };
  }
}

// Export singleton instance
export const mlModelService = new MLModelService();

// Helper functions
export async function loadSectorModel(sectorId, modelUrl, modelType) {
  return await mlModelService.loadModel(sectorId, modelUrl, modelType);
}

export function unloadSectorModel(sectorId) {
  mlModelService.unloadModel(sectorId);
}

export async function runSectorInference(sectorId, element) {
  return await mlModelService.runInference(sectorId, element);
}

export function getModelLoadingStatus(sectorId) {
  return mlModelService.getModelStatus(sectorId);
}

export default mlModelService;
