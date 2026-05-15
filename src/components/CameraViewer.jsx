import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Maximize2, X } from 'lucide-react';
import { AIDetectionOverlay } from './AIDetectionOverlay';

export function CameraViewer({ camera, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => {
    console.log('🎥 CameraViewer mounted:', {
      name: camera.name,
      type: camera.type,
      url: camera.url,
      phoneApp: camera.phoneApp,
      status: camera.status
    });
    setIsLoading(true);
    setError(null);
  }, [camera]);

  const handleImageLoad = () => {
    console.log('✅ Camera stream loaded successfully!');
    setIsLoading(false);
    setError(null);
  };

  const handleImageError = (e) => {
    setIsLoading(false);
    console.error('❌ Camera stream error:', e);
    console.error('Error target:', e.target);
    console.error('Image src:', e.target?.src);
    
    // Check if CORS error
    const isCORS = window.location.protocol === 'https:' && camera.url?.startsWith('http:');
    
    console.error('CORS Issue:', isCORS);
    console.error('Site Protocol:', window.location.protocol);
    console.error('Camera URL Protocol:', camera.url?.split(':')[0]);
    
    // Determine error type
    let errorMsg = 'Failed to load camera stream.';
    
    if (camera.type === 'phone') {
      if (isCORS) {
        errorMsg = `🔒 CORS SECURITY BLOCKING (Most Common Issue!)

Your site is HTTPS but camera is HTTP - browser blocks this!

✅ SOLUTIONS (Choose one):

1. RUN APP LOCALLY (Easiest):
   • Open terminal in project folder
   • Run: npm run dev
   • Access at: http://localhost:5173
   • No CORS issues on localhost!

2. TEST IN NEW TAB:
   • Click "Open Camera Direct" button below
   • View camera in separate tab
   • Works but not integrated

3. USE BROWSER EXTENSION:
   • Install "CORS Unblock" extension
   • Enable it for this site
   • ⚠️ Only on trusted networks!

Current URLs:
• Site: ${window.location.protocol}//${window.location.host}
• Camera: ${camera.url}`;
      } else {
        errorMsg = `❌ Cannot connect to ${camera.phoneApp || 'phone camera'}

Possible issues:
1. Wrong IP address (Currently: ${camera.url})
2. Wrong port (${camera.phoneApp === 'droidcam' ? 'Use 4747' : 'Use 8080'})
3. Phone and computer not on same Wi-Fi
4. Camera app not running on phone

🔧 Quick Checks:
• Camera app running on phone?
• "Start server" button pressed?
• IP matches what app shows?
• Both devices on same Wi-Fi?`;
      }
    }
    
    console.error('📋 Error message shown to user:', errorMsg);
    setError(errorMsg);
  };

  const getCameraStreamUrl = () => {
    if (camera.type === 'webcam') {
      // For webcam, we'd need WebRTC or getUserMedia
      return null;
    }
    
    // For IP and phone cameras, use the URL
    return camera.url;
  };

  const streamUrl = getCameraStreamUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl relative shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              camera.status === 'online' ? 'bg-emerald-500/10 border border-emerald-500/30' :
              'bg-slate-500/10 border border-slate-500/30'
            }`}>
              <Camera className={`w-5 h-5 ${
                camera.status === 'online' ? 'text-emerald-400' : 'text-slate-400'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{camera.name}</h3>
              <p className="text-xs text-slate-400">
                {camera.location} • {camera.type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Camera Feed */}
        <div className="relative bg-slate-950 aspect-video flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-400">Loading camera feed...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-8 overflow-auto">
              <div className="text-left max-w-2xl bg-slate-900/90 p-6 rounded-xl border border-red-500/30">
                <Camera className="w-12 h-12 text-red-400 mx-auto mb-3 opacity-50" />
                <p className="text-red-400 font-semibold mb-4 text-center">Camera Connection Error</p>
                <pre className="text-sm text-slate-300 mb-4 whitespace-pre-wrap font-mono bg-slate-950 p-4 rounded">{error}</pre>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      if (imgRef.current) {
                        imgRef.current.src = streamUrl + '?t=' + Date.now();
                      }
                    }}
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Connection
                  </button>
                  {streamUrl && (
                    <a
                      href={streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 transition-colors inline-flex items-center gap-2"
                    >
                      <Maximize2 className="w-4 h-4" />
                      Test in Browser
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {streamUrl ? (
            <>
              <img
                ref={imgRef}
                src={streamUrl}
                alt={`${camera.name} feed`}
                data-camera-id={camera.id}
                className={`w-full h-full object-contain ${isLoading || error ? 'hidden' : ''}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {/* AI Detection Overlay */}
              <AIDetectionOverlay camera={camera} enabled={true} />
            </>
          ) : (
            <div className="text-center p-8 relative">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Webcam preview not available in browser</p>
              <p className="text-sm text-slate-500 mt-2">
                Use browser's built-in camera access for webcam feeds
              </p>
              {/* Demo overlay for webcam preview */}
              <AIDetectionOverlay camera={camera} enabled={true} />
            </div>
          )}
        </div>

        {/* Camera Info Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs mb-1">Status</p>
              <p className={`font-semibold ${
                camera.status === 'online' ? 'text-emerald-400' :
                camera.status === 'error' ? 'text-red-400' :
                'text-slate-500'
              }`}>
                {camera.status}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">AI Module</p>
              <p className="font-semibold text-white capitalize">{camera.module}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Stream URL</p>
              <p className="font-mono text-xs text-blue-400 truncate">
                {streamUrl || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Multi-camera grid view component
export function CameraGridView({ cameras, onSelectCamera, sectorConfig }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cameras.map((camera) => (
        <button
          key={camera.id}
          onClick={() => onSelectCamera(camera)}
          className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all group"
        >
          {/* Camera Preview */}
          <div className="aspect-video bg-slate-950 flex items-center justify-center relative overflow-hidden">
            {camera.url ? (
              <img
                src={camera.url}
                alt={camera.name}
                data-camera-id={camera.id}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <Camera className="w-8 h-8 text-slate-600 group-hover:text-blue-400 transition-colors" />
            </div>
            
            {/* AI Detection Overlay for Grid View */}
            <AIDetectionOverlay camera={camera} sectorConfig={sectorConfig} enabled={true} />
            
            {/* Live indicator */}
            {camera.status === 'online' && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-500/90 rounded text-xs font-semibold text-white z-20">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
            )}

            {/* View overlay */}
            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Camera Info */}
          <div className="p-3 text-left">
            <h4 className="font-semibold text-white text-sm mb-1">{camera.name}</h4>
            <p className="text-xs text-slate-400">{camera.location}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
