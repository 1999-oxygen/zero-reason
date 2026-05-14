import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrainCircuit, Eye, EyeOff, Crosshair, AlertTriangle, Cpu, Loader2, Zap } from 'lucide-react';
import { mlModelService } from '../services/mlModelService';
import { videoFeedWS } from '../services/apiClient';

// Simulated detection data generator based on sector
function generateMockDetections(sectorId, width, height) {
  const detections = {
    liquor: [
      { label: 'wine_bottle', confidence: 0.92, bbox: [width * 0.25, height * 0.35, width * 0.15, height * 0.25], severity: 'normal', value: '$45' },
      { label: 'premium_whiskey', confidence: 0.88, bbox: [width * 0.55, height * 0.25, width * 0.12, height * 0.30], severity: 'high-value', value: '$450' },
      { label: 'person', confidence: 0.96, bbox: [width * 0.65, height * 0.20, width * 0.22, height * 0.55], severity: 'normal' },
      { label: 'concealment_detected', confidence: 0.78, bbox: [width * 0.62, height * 0.30, width * 0.10, height * 0.20], severity: 'alert' }
    ],
    clubs: [
      { label: 'person', confidence: 0.94, bbox: [width * 0.15, height * 0.25, width * 0.18, height * 0.50], severity: 'normal' },
      { label: 'person', confidence: 0.91, bbox: [width * 0.40, height * 0.30, width * 0.16, height * 0.45], severity: 'normal' },
      { label: 'crowd_zone', confidence: 0.85, bbox: [width * 0.10, height * 0.15, width * 0.60, height * 0.65], severity: 'warning' },
      { label: 'aggressive_behavior', confidence: 0.76, bbox: [width * 0.65, height * 0.35, width * 0.25, height * 0.40], severity: 'alert' }
    ],
    retail: [
      { label: 'shoes', confidence: 0.89, bbox: [width * 0.30, height * 0.45, width * 0.20, height * 0.20], severity: 'normal' },
      { label: 'person', confidence: 0.95, bbox: [width * 0.55, height * 0.20, width * 0.25, height * 0.60], severity: 'normal' },
      { label: 'concealment', confidence: 0.82, bbox: [width * 0.52, height * 0.35, width * 0.12, height * 0.30], severity: 'alert' }
    ],
    hospitality: [
      { label: 'table', confidence: 0.87, bbox: [width * 0.20, height * 0.50, width * 0.40, height * 0.30], severity: 'normal' },
      { label: 'person', confidence: 0.93, bbox: [width * 0.65, height * 0.25, width * 0.20, height * 0.50], severity: 'normal' },
      { label: 'unpaid_exit', confidence: 0.79, bbox: [width * 0.75, height * 0.10, width * 0.20, height * 0.80], severity: 'alert' }
    ],
    security: [
      { label: 'person', confidence: 0.94, bbox: [width * 0.35, height * 0.25, width * 0.18, height * 0.50], severity: 'normal' },
      { label: 'person', confidence: 0.91, bbox: [width * 0.55, height * 0.28, width * 0.16, height * 0.48], severity: 'normal' },
      { label: 'violence_detected', confidence: 0.84, bbox: [width * 0.32, height * 0.20, width * 0.40, height * 0.60], severity: 'alert' }
    ],
    education: [
      { label: 'student', confidence: 0.90, bbox: [width * 0.30, height * 0.35, width * 0.15, height * 0.40], severity: 'normal' },
      { label: 'isolated_student', confidence: 0.73, bbox: [width * 0.65, height * 0.30, width * 0.12, height * 0.35], severity: 'warning' }
    ],
    agriculture: [
      { label: 'cow', confidence: 0.93, bbox: [width * 0.25, height * 0.40, width * 0.30, height * 0.35], severity: 'normal' },
      { label: 'cow', confidence: 0.91, bbox: [width * 0.60, height * 0.35, width * 0.28, height * 0.40], severity: 'normal' },
      { label: 'lethargic_animal', confidence: 0.68, bbox: [width * 0.55, height * 0.45, width * 0.20, height * 0.30], severity: 'warning' }
    ]
  };

  return detections[sectorId] || detections.retail;
}

// Get sector-specific colors
function getSectorColors(sectorId) {
  const colors = {
    liquor: { primary: '#f59e0b', secondary: '#92400e', bg: 'bg-amber-500' },
    clubs: { primary: '#ec4899', secondary: '#831843', bg: 'bg-pink-500' },
    retail: { primary: '#3b82f6', secondary: '#1e3a5f', bg: 'bg-blue-500' },
    hospitality: { primary: '#f97316', secondary: '#7c2d12', bg: 'bg-orange-500' },
    security: { primary: '#ef4444', secondary: '#7f1d1d', bg: 'bg-red-500' },
    education: { primary: '#a855f7', secondary: '#581c87', bg: 'bg-purple-500' },
    agriculture: { primary: '#10b981', secondary: '#064e3b', bg: 'bg-emerald-500' }
  };
  return colors[sectorId] || colors.retail;
}

// Get severity style
function getSeverityStyle(severity) {
  switch (severity) {
    case 'alert':
      return { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', pulse: true };
    case 'warning':
      return { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', pulse: true };
    case 'high-value':
      return { stroke: '#eab308', fill: 'rgba(234, 179, 8, 0.15)', text: '#eab308', pulse: false };
    default:
      return { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.1)', text: '#10b981', pulse: false };
  }
}

export function AIDetectionOverlay({ camera, sectorConfig, enabled = true }) {
  const [detections, setDetections] = useState([]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 640, height: 360 });
  const [modelStatus, setModelStatus] = useState({ status: 'unloaded', error: null });
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  const sectorId = camera?.module || 'retail';
  const colors = getSectorColors(sectorId);
  const isEnabled = enabled && sectorConfig?.enabled !== false;
  const hasModelUrl = !!sectorConfig?.mlModelUrl;

  // Subscribe to model state changes
  useEffect(() => {
    const unsubscribe = mlModelService.subscribeToState(sectorId, (state) => {
      setModelStatus(state);
    });
    // Get initial state
    setModelStatus(mlModelService.getModelStatus(sectorId));
    return unsubscribe;
  }, [sectorId]);

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Load custom model
  const handleLoadModel = async () => {
    if (!sectorConfig?.mlModelUrl) return;
    setIsLoadingModel(true);
    await mlModelService.loadModel(sectorId, sectorConfig.mlModelUrl, sectorConfig.mlModelType || 'roboflow');
    setUseCustomModel(true);
    setIsLoadingModel(false);
  };

  // Unload custom model
  const handleUnloadModel = () => {
    mlModelService.unloadModel(sectorId);
    setUseCustomModel(false);
  };

  // WebSocket backend connection for real-time AI
  useEffect(() => {
    if (!isEnabled || !showOverlay) {
      setDetections([]);
      setBackendConnected(false);
      videoFeedWS.disconnect();
      return;
    }

    // Try WebSocket backend first
    const unsubStatus = videoFeedWS.on("status", (data) => {
      setBackendConnected(data.connected);
    });
    const unsubFrame = videoFeedWS.on("frame", (data) => {
      if (data.boxes && data.boxes.length > 0) {
        const scaled = data.boxes.map(d => ({
          label: d.label,
          confidence: d.confidence,
          bbox: [
            d.box[0] * (containerSize.width / 640),
            d.box[1] * (containerSize.height / 360),
            (d.box[2] - d.box[0]) * (containerSize.width / 640),
            (d.box[3] - d.box[1]) * (containerSize.height / 360)
          ],
          severity: d.severity || "normal",
          in_zone: d.in_zone
        }));
        setDetections(scaled);
      }
    });

    // Connect to backend AI brain
    videoFeedWS.connect(sectorId, camera?.url || "0");

    return () => {
      unsubStatus();
      unsubFrame();
      videoFeedWS.disconnect();
    };
  }, [isEnabled, showOverlay, sectorId, camera?.url, containerSize.width, containerSize.height]);

  // Fallback: generate mock detections if backend not connected
  useEffect(() => {
    if (!isEnabled || !showOverlay || backendConnected) {
      if (backendConnected && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateDetections = async () => {
      let baseDetections;

      // If custom model is loaded and user wants to use it
      if (useCustomModel && modelStatus.status === 'ready') {
        const inferenceResult = await mlModelService.runInference(sectorId, null);
        if (inferenceResult) {
          baseDetections = inferenceResult.map(d => ({
            ...d,
            bbox: [
              d.bbox[0] * (containerSize.width / 640),
              d.bbox[1] * (containerSize.height / 360),
              d.bbox[2] * (containerSize.width / 640),
              d.bbox[3] * (containerSize.height / 360)
            ]
          }));
        } else {
          baseDetections = generateMockDetections(sectorId, containerSize.width, containerSize.height);
        }
      } else {
        baseDetections = generateMockDetections(sectorId, containerSize.width, containerSize.height);
      }

      // Add slight randomization to positions for "live" feel
      const jittered = baseDetections.map(d => {
        const jitter = 5;
        return {
          ...d,
          bbox: [
            d.bbox[0] + (Math.random() - 0.5) * jitter,
            d.bbox[1] + (Math.random() - 0.5) * jitter,
            d.bbox[2],
            d.bbox[3]
          ],
          confidence: Math.min(0.99, Math.max(0.60, d.confidence + (Math.random() - 0.5) * 0.05))
        };
      });

      setDetections(jittered);
    };

    updateDetections();
    intervalRef.current = setInterval(updateDetections, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isEnabled, showOverlay, sectorId, containerSize.width, containerSize.height, useCustomModel, modelStatus.status, backendConnected]);

  const alertCount = detections.filter(d => d.severity === 'alert').length;
  const warningCount = detections.filter(d => d.severity === 'warning').length;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {/* AI Toggle Button */}
      <div className="absolute top-3 left-3 z-20 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => setShowOverlay(!showOverlay)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            showOverlay && isEnabled
              ? `${colors.bg} bg-opacity-20 text-white border-white/30 backdrop-blur-sm`
              : 'bg-slate-900/80 text-slate-400 border-slate-700/50 backdrop-blur-sm'
          }`}
        >
          {showOverlay && isEnabled ? (
            <><Eye className="w-3.5 h-3.5" /> AI Active</>
          ) : (
            <><EyeOff className="w-3.5 h-3.5" /> AI Off</>
          )}
        </button>

        {/* Model Toggle - only if URL configured */}
        {hasModelUrl && showOverlay && isEnabled && (
          <button
            onClick={() => {
              if (useCustomModel) {
                handleUnloadModel();
              } else {
                handleLoadModel();
              }
            }}
            disabled={isLoadingModel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all pointer-events-auto ${
              useCustomModel && modelStatus.status === 'ready'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 backdrop-blur-sm'
                : isLoadingModel
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 backdrop-blur-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700/50 backdrop-blur-sm hover:bg-blue-500/10'
            }`}
          >
            {isLoadingModel ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</>
            ) : useCustomModel && modelStatus.status === 'ready' ? (
              <><Cpu className="w-3.5 h-3.5" /> Custom Model</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> Load Model</>
            )}
          </button>
        )}
      </div>

      {/* Alert Badge */}
      {showOverlay && isEnabled && alertCount > 0 && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/90 rounded-lg text-xs font-semibold text-white backdrop-blur-sm">
          <AlertTriangle className="w-3.5 h-3.5" />
          {alertCount} Alert{alertCount > 1 ? 's' : ''}
        </div>
      )}

      {/* Warning Badge */}
      {showOverlay && isEnabled && warningCount > 0 && alertCount === 0 && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/90 rounded-lg text-xs font-semibold text-white backdrop-blur-sm">
          <AlertTriangle className="w-3.5 h-3.5" />
          {warningCount} Warning{warningCount > 1 ? 's' : ''}
        </div>
      )}

      {/* Backend Connection Status */}
      {showOverlay && isEnabled && backendConnected && (
        <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 bg-emerald-500/90 rounded-lg text-xs text-white backdrop-blur-sm flex items-center gap-1.5">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          AI Brain Connected
        </div>
      )}

      {/* Model Status Indicator */}
      {showOverlay && isEnabled && modelStatus.status === 'error' && (
        <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 bg-red-500/90 rounded-lg text-xs text-white backdrop-blur-sm">
          Model Error: {modelStatus.error}
        </div>
      )}

      {/* Detection Overlay SVG */}
      {showOverlay && isEnabled && (
        <svg 
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
          style={{ pointerEvents: 'none' }}
        >
          {detections.map((det, idx) => {
            const [x, y, w, h] = det.bbox;
            const style = getSeverityStyle(det.severity);
            const labelText = det.label.replace(/_/g, ' ');
            const confPercent = (det.confidence * 100).toFixed(0);
            
            return (
              <g key={`${det.label}-${idx}`}>
                {/* Bounding Box */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={det.severity === 'alert' ? 2.5 : 2}
                  rx={4}
                  className={style.pulse ? 'animate-pulse' : ''}
                  style={{
                    filter: det.severity === 'alert' ? 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' : 
                            det.severity === 'warning' ? 'drop-shadow(0 0 4px rgba(245,158,11,0.4))' : 'none'
                  }}
                />
                
                {/* Crosshair corners */}
                <Crosshair x={x + w/2} y={y + h/2} size={12} color={style.stroke} />
                
                {/* Label Background */}
                <rect
                  x={x}
                  y={y - 24}
                  width={Math.max(140, labelText.length * 8 + 50)}
                  height={24}
                  fill={style.stroke}
                  rx={4}
                />
                
                {/* Label Text */}
                <text
                  x={x + 6}
                  y={y - 7}
                  fill="white"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {labelText}
                </text>
                
                {/* Confidence Text */}
                <text
                  x={x + Math.max(140, labelText.length * 8 + 50) - 6}
                  y={y - 7}
                  fill="rgba(255,255,255,0.8)"
                  fontSize="10"
                  fontWeight="500"
                  fontFamily="system-ui, sans-serif"
                  textAnchor="end"
                >
                  {confPercent}%
                </text>
                
                {/* Value tag for high-value items */}
                {det.value && (
                  <g>
                    <rect
                      x={x + w - 50}
                      y={y + h + 4}
                      width={50}
                      height={20}
                      fill="#eab308"
                      rx={4}
                    />
                    <text
                      x={x + w - 25}
                      y={y + h + 17}
                      fill="#1e293b"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                      textAnchor="middle"
                    >
                      {det.value}
                    </text>
                  </g>
                )}
                
                {/* Alert icon for serious detections */}
                {det.severity === 'alert' && (
                  <g>
                    <circle
                      cx={x + w - 10}
                      cy={y + 10}
                      r={10}
                      fill="#ef4444"
                    />
                    <text
                      x={x + w - 10}
                      y={y + 14}
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      !
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          
          {/* Zone markers for clubs crowd density */}
          {sectorId === 'clubs' && detections.some(d => d.label === 'crowd_zone') && (
            <>
              <text
                x={containerSize.width * 0.12}
                y={containerSize.height * 0.12}
                fill="#f59e0b"
                fontSize="14"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
                className="animate-pulse"
              >
                CROWD DENSITY: 78%
              </text>
              <line
                x1={containerSize.width * 0.12}
                y1={containerSize.height * 0.15}
                x2={containerSize.width * 0.35}
                y2={containerSize.height * 0.15}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            </>
          )}
          
          {/* Exit zone for hospitality/retail */}
          {(sectorId === 'hospitality' || sectorId === 'retail' || sectorId === 'liquor') && (
            <g opacity="0.4">
              <rect
                x={containerSize.width * 0.75}
                y={0}
                width={containerSize.width * 0.25}
                height={containerSize.height}
                fill="none"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="8 4"
              />
              <text
                x={containerSize.width * 0.87}
                y={containerSize.height * 0.95}
                fill="#ef4444"
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
              >
                EXIT ZONE
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  );
}

export default AIDetectionOverlay;
