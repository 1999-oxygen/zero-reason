import React, { useState } from 'react';
import { BrainCircuit, Settings, X, Plus, Trash2, Save, Check, AlertCircle } from 'lucide-react';

export default function MLModelConfig({ camera, onSave, onClose }) {
  const [config, setConfig] = useState(camera?.mlConfig || {
    enabled: false,
    provider: 'roboflow', // roboflow, tensorflow, yolo
    modelId: '',
    apiKey: '',
    confidence: 0.75,
    classes: []
  });
  
  const [testStatus, setTestStatus] = useState(null);

  const handleSave = () => {
    onSave(camera.id, config);
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    
    // Simulate test connection
    setTimeout(() => {
      if (config.apiKey && config.modelId) {
        setTestStatus({ success: true, message: 'Connection successful' });
      } else {
        setTestStatus({ error: true, message: 'Missing API key or model ID' });
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">ML Model Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Camera Info */}
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Camera</h3>
            <p className="text-white font-medium">{camera?.name || 'Unknown'}</p>
            <p className="text-sm text-slate-400">{camera?.type} - {camera?.location}</p>
          </div>

          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-300">Enable AI Detection</h3>
              <p className="text-xs text-slate-400">Enable object detection on this camera</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                config.enabled ? 'bg-blue-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  config.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {config.enabled && (
            <>
              {/* Provider Selection */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">AI Provider</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'roboflow', name: 'Roboflow', desc: 'Custom trained models' },
                    { id: 'tensorflow', name: 'TensorFlow', desc: 'TF.js models' },
                    { id: 'yolo', name: 'YOLO', desc: 'Ultralytics YOLO' }
                  ].map(provider => (
                    <button
                      key={provider.id}
                      onClick={() => setConfig({ ...config, provider: provider.id })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        config.provider === provider.id
                          ? 'bg-blue-500/20 border-blue-500'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-medium text-white text-sm">{provider.name}</p>
                      <p className="text-xs text-slate-400">{provider.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Roboflow Configuration */}
              {config.provider === 'roboflow' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="Enter Roboflow API key"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Model ID
                    </label>
                    <input
                      type="text"
                      value={config.modelId}
                      onChange={(e) => setConfig({ ...config, modelId: e.target.value })}
                      placeholder="e.g., project-name/model-version"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* TensorFlow Configuration */}
              {config.provider === 'tensorflow' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Model URL
                    </label>
                    <input
                      type="text"
                      value={config.modelId}
                      onChange={(e) => setConfig({ ...config, modelId: e.target.value })}
                      placeholder="https://example.com/model.json"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* YOLO Configuration */}
              {config.provider === 'yolo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={config.modelId}
                      onChange={(e) => setConfig({ ...config, modelId: e.target.value })}
                      placeholder="e.g., yolov8n, yolov8s"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* Confidence Threshold */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Confidence Threshold: {Math.round(config.confidence * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={config.confidence}
                  onChange={(e) => setConfig({ ...config, confidence: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Test Connection */}
              <button
                onClick={handleTestConnection}
                disabled={testStatus?.loading}
                className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                {testStatus?.loading ? (
                  <>Testing...</>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Test Connection
                  </>
                )}
              </button>

              {testStatus && (
                <div className={`p-3 rounded-lg border ${
                  testStatus.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  <p className="text-sm flex items-center gap-2">
                    {testStatus.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {testStatus.message}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
