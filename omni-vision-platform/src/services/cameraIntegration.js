import { api } from './apiClient';

// Camera Integration Service
// Supports: Webcam, IP Cameras (RTSP/HTTP), Phone Cameras (IP Webcam, DroidCam)

class CameraIntegrationService {
  constructor() {
    this.cameras = [];
    this.activeStreams = new Map();
    this.backendAvailable = false;
    this._checkBackend();
  }

  async _checkBackend() {
    try {
      const res = await fetch('http://localhost:8000/api/health', { method: 'GET', mode: 'cors' });
      if (res.ok) {
        this.backendAvailable = true;
        // Sync cameras from backend
        const remote = await api.get('/api/cameras');
        if (remote && remote.length > 0) {
          this.cameras = remote;
        }
      }
    } catch (e) {
      this.backendAvailable = false;
    }
  }

  // Add a camera configuration
  async addCamera(config) {
    const camera = {
      id: config.id || `cam_${Date.now()}`,
      name: config.name || 'Unnamed Camera',
      type: config.type, // 'webcam', 'ip', 'phone'
      url: config.url || null,
      username: config.username || null,
      password: config.password || null,
      location: config.location || 'Unknown',
      module: config.module || 'retail', // Which AI module to use
      status: 'offline'
    };

    this.cameras.push(camera);
    // Sync to backend
    if (this.backendAvailable) {
      try { await api.post('/api/cameras', camera); } catch (e) {}
    }
    return camera;
  }

  // Remove a camera
  async removeCamera(cameraId) {
    const index = this.cameras.findIndex(c => c.id === cameraId);
    if (index > -1) {
      this.stopCamera(cameraId);
      this.cameras.splice(index, 1);
      if (this.backendAvailable) {
        try { await api.delete(`/api/cameras/${cameraId}`); } catch (e) {}
      }
      return true;
    }
    return false;
  }

  // Get all cameras
  getCameras() {
    return this.cameras;
  }

  // Start a webcam stream
  async startWebcam(cameraId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      this.activeStreams.set(cameraId, stream);
      this.updateCameraStatus(cameraId, 'online');
      return stream;
    } catch (error) {
      console.error('Error accessing webcam:', error);
      this.updateCameraStatus(cameraId, 'error');
      throw error;
    }
  }

  // Start an IP camera stream
  async startIPCamera(cameraId, url, username = null, password = null) {
    try {
      // For HTTP/HTTPS IP cameras, we can use an img or video element
      // For RTSP, we'd need a backend proxy (like ffmpeg or WebRTC gateway)
      
      let streamUrl = url;
      
      // Add authentication if provided
      if (username && password) {
        const urlObj = new URL(url);
        urlObj.username = username;
        urlObj.password = password;
        streamUrl = urlObj.toString();
      }

      // Store the stream URL
      this.activeStreams.set(cameraId, streamUrl);
      this.updateCameraStatus(cameraId, 'online');
      
      return streamUrl;
    } catch (error) {
      console.error('Error connecting to IP camera:', error);
      this.updateCameraStatus(cameraId, 'error');
      throw error;
    }
  }

  // Start a phone camera stream (IP Webcam or DroidCam)
  async startPhoneCamera(cameraId, phoneIP, port = null, app = 'ipwebcam') {
    try {
      let defaultPort;
      
      // Determine default port based on app
      switch (app.toLowerCase()) {
        case 'ipwebcam':
          defaultPort = port || 8080;
          break;
        case 'droidcam':
          defaultPort = port || 4747;
          break;
        case 'iriun':
          defaultPort = port || 8080;
          break;
        default:
          defaultPort = port || 8080;
      }

      // Use proxy server to avoid CORS and mixed content issues
      // Python backend proxy runs on localhost:8000
      const proxyUrl = `http://localhost:8000/api/camera-stream?ip=${phoneIP}&port=${defaultPort}&app=${app}`;
      
      // Log both the original camera URL and proxy URL for debugging
      const originalUrl = `http://${phoneIP}:${defaultPort}`;
      console.log(`📹 Starting ${app} camera:`);
      console.log(`   Original: ${originalUrl}`);
      console.log(`   Via Proxy: ${proxyUrl}`);

      this.activeStreams.set(cameraId, proxyUrl);
      this.updateCameraStatus(cameraId, 'online');
      
      return proxyUrl;
    } catch (error) {
      console.error('Error connecting to phone camera:', error);
      this.updateCameraStatus(cameraId, 'error');
      throw error;
    }
  }

  // Stop a camera stream
  stopCamera(cameraId) {
    const stream = this.activeStreams.get(cameraId);
    if (stream) {
      // If it's a MediaStream (webcam), stop all tracks
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // For IP/Phone cameras (URL strings), just remove the reference
      this.activeStreams.delete(cameraId);
      this.updateCameraStatus(cameraId, 'offline');
      return true;
    }
    return false;
  }

  // Get active stream for a camera
  getStream(cameraId) {
    return this.activeStreams.get(cameraId);
  }

  // Update camera status
  updateCameraStatus(cameraId, status) {
    const camera = this.cameras.find(c => c.id === cameraId);
    if (camera) {
      camera.status = status;
      camera.lastUpdated = new Date().toISOString();
    }
  }

  // Get camera by ID
  getCamera(cameraId) {
    return this.cameras.find(c => c.id === cameraId);
  }

  // Test camera connection
  async testConnection(cameraId) {
    const camera = this.getCamera(cameraId);
    if (!camera) return { success: false, error: 'Camera not found' };

    try {
      switch (camera.type) {
        case 'webcam':
          await this.startWebcam(cameraId);
          this.stopCamera(cameraId);
          return { success: true, message: 'Webcam accessible' };

        case 'ip':
        case 'phone':
          const url = this.activeStreams.get(cameraId) || camera.url;
          const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
          return { success: true, message: 'Camera reachable' };

        default:
          return { success: false, error: 'Unknown camera type' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get mock cameras for demo
  getMockCameras() {
    return [
      {
        id: 'demo_cam_1',
        name: 'Front Counter',
        type: 'webcam',
        location: 'Main Store',
        module: 'retail',
        status: 'online',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'demo_cam_2',
        name: 'Dining Area',
        type: 'ip',
        url: 'http://192.168.1.100:8080/video',
        location: 'Restaurant Floor',
        module: 'hospitality',
        status: 'online',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'demo_cam_3',
        name: 'Phone Camera',
        type: 'phone',
        url: 'http://192.168.1.50:8080/video',
        location: 'Mobile Monitor',
        module: 'retail',
        status: 'online',
        lastUpdated: new Date().toISOString()
      }
    ];
  }
}

// Export singleton instance
export const cameraService = new CameraIntegrationService();

// Export configuration helpers
export function addWebcam(name, location, module) {
  return cameraService.addCamera({
    name,
    type: 'webcam',
    location,
    module
  });
}

export function addIPCamera(name, url, location, module, username = null, password = null) {
  return cameraService.addCamera({
    name,
    type: 'ip',
    url,
    location,
    module,
    username,
    password
  });
}

export function addPhoneCamera(name, phoneIP, port, location, module, app = 'ipwebcam') {
  const camera = cameraService.addCamera({
    name,
    type: 'phone',
    location,
    module
  });
  
  // Generate the stream URL
  const url = cameraService.startPhoneCamera(camera.id, phoneIP, port, app);
  camera.url = url;
  
  return camera;
}

export default cameraService;
