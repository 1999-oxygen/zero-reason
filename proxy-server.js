import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all origins (you can restrict this later)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📹 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Camera proxy server is running' });
});

// Camera stream proxy
app.get('/camera-stream', async (req, res) => {
  const cameraIp = req.query.ip || '192.168.1.50';
  const cameraPort = req.query.port || '8080';
  const cameraApp = req.query.app || 'ipwebcam';
  
  let streamPath = '/video';
  
  // Determine stream path based on camera app
  switch(cameraApp.toLowerCase()) {
    case 'droidcam':
      streamPath = '/mjpegfeed';
      break;
    case 'ipwebcam':
      streamPath = '/video';
      break;
    case 'iriun':
      streamPath = '/video';
      break;
    default:
      streamPath = '/video';
  }
  
  const cameraUrl = `http://${cameraIp}:${cameraPort}${streamPath}`;
  
  console.log(`🎥 Proxying camera stream from: ${cameraUrl}`);
  
  try {
    const response = await fetch(cameraUrl, {
      method: 'GET',
      headers: {
        'Accept': 'multipart/x-mixed-replace, image/jpeg, */*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Camera responded with status: ${response.status}`);
    }
    
    // Set appropriate headers for MJPEG stream
    res.setHeader('Content-Type', response.headers.get('content-type') || 'multipart/x-mixed-replace; boundary=frame');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Connection', 'keep-alive');
    
    // Pipe the camera stream to the response
    response.body.pipe(res);
    
    // Handle errors and cleanup
    response.body.on('error', (err) => {
      console.error('❌ Stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error', message: err.message });
      }
    });
    
    res.on('close', () => {
      console.log('🔌 Client disconnected from stream');
      response.body.destroy();
    });
    
  } catch (error) {
    console.error('❌ Error fetching camera stream:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to connect to camera',
        message: error.message,
        cameraUrl: cameraUrl
      });
    }
  }
});

// Camera snapshot proxy (for testing)
app.get('/camera-snapshot', async (req, res) => {
  const cameraIp = req.query.ip || '192.168.1.50';
  const cameraPort = req.query.port || '8080';
  const cameraUrl = `http://${cameraIp}:${cameraPort}/shot.jpg`;
  
  console.log(`📸 Fetching snapshot from: ${cameraUrl}`);
  
  try {
    const response = await fetch(cameraUrl);
    
    if (!response.ok) {
      throw new Error(`Camera responded with status: ${response.status}`);
    }
    
    res.setHeader('Content-Type', 'image/jpeg');
    response.body.pipe(res);
    
  } catch (error) {
    console.error('❌ Error fetching snapshot:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch snapshot',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🎥 Camera Proxy Server Running                     ║
║                                                       ║
║   Port: ${PORT}                                          ║
║   URL:  http://localhost:${PORT}                        ║
║                                                       ║
║   Endpoints:                                          ║
║   • GET /health - Server status                      ║
║   • GET /camera-stream?ip=X&port=Y&app=Z            ║
║   • GET /camera-snapshot?ip=X&port=Y                ║
║                                                       ║
║   Example:                                            ║
║   http://localhost:${PORT}/camera-stream?            ║
║     ip=192.168.1.50&port=8080&app=ipwebcam          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
  console.log('✅ Ready to proxy camera streams!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
