import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image, Tag, Trash2, Grid, List, CheckCircle, AlertTriangle, FolderOpen } from 'lucide-react';
import { api } from '../services/apiClient';

export default function TrainingImageManager({ sectorConfig, sectorId, onImagesChange }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [labelInput, setLabelInput] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [filterLabel, setFilterLabel] = useState('all');
  const [backendImages, setBackendImages] = useState([]);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const fileInputRef = useRef(null);

  // Load images from backend on mount
  useEffect(() => {
    const loadBackendImages = async () => {
      try {
        const images = await api.get(`/api/training-images?sector_id=${sectorId}`);
        setBackendImages(images || []);
        setBackendAvailable(true);
      } catch (e) {
        setBackendAvailable(false);
      }
    };
    if (sectorId) loadBackendImages();
  }, [sectorId]);

  const trainingImages = backendAvailable ? backendImages : (sectorConfig?.customDatabase?.trainingImages || []);
  const objectClasses = sectorConfig?.objectClasses || [];

  const getAllLabels = () => {
    const labels = new Set();
    trainingImages.forEach(img => {
      if (img.label) labels.add(img.label);
    });
    return ['all', ...Array.from(labels)];
  };

  const filteredImages = filterLabel === 'all' 
    ? trainingImages 
    : trainingImages.filter(img => img.label === filterLabel);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const processFiles = async (files) => {
    setUploading(true);
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    for (const file of imageFiles) {
      try {
        if (backendAvailable) {
          // Upload to backend
          const formData = new FormData();
          formData.append('file', file);
          formData.append('sector_id', sectorId);
          formData.append('label', '');
          const result = await fetch('http://localhost:8000/api/training-images/upload', {
            method: 'POST',
            body: formData
          });
          if (result.ok) {
            const data = await result.json();
            // Reload images from backend
            const images = await api.get(`/api/training-images?sector_id=${sectorId}`);
            setBackendImages(images || []);
          }
        } else {
          // Fallback: localStorage
          const reader = new FileReader();
          await new Promise((resolve, reject) => {
            reader.onload = (e) => {
              const imageData = e.target.result;
              const newImage = {
                id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                data: imageData,
                name: file.name,
                label: '',
                timestamp: new Date().toISOString(),
                size: file.size
              };
              
              // Add to sector config
              const config = { ...sectorConfig };
              if (!config.customDatabase) {
                config.customDatabase = { trainingImages: [] };
              }
              if (!config.customDatabase.trainingImages) {
                config.customDatabase.trainingImages = [];
              }
              config.customDatabase.trainingImages.push(newImage);
              config.customDatabase.itemCount = config.customDatabase.trainingImages.length;
              
              if (onImagesChange) {
                onImagesChange(config.customDatabase.trainingImages);
              }
              resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
      } catch (error) {
        console.error('Error processing file:', file.name, error);
      }
    }
    
    setUploading(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [sectorConfig, onImagesChange]);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
    }
    e.target.value = '';
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Remove this training image?')) return;
    
    if (backendAvailable) {
      try {
        await api.delete(`/api/training-images/${imageId}`);
        // Reload images from backend
        const images = await api.get(`/api/training-images?sector_id=${sectorId}`);
        setBackendImages(images || []);
      } catch (e) {
        console.error('Failed to delete image:', e);
      }
    } else {
      const config = { ...sectorConfig };
      config.customDatabase.trainingImages = config.customDatabase.trainingImages.filter(
        img => img.id !== imageId
      );
      config.customDatabase.itemCount = config.customDatabase.trainingImages.length;
      
      if (onImagesChange) {
        onImagesChange(config.customDatabase.trainingImages);
      }
    }
    
    if (selectedImage?.id === imageId) {
      setSelectedImage(null);
    }
  };

  const handleAssignLabel = (imageId, label) => {
    const config = { ...sectorConfig };
    const image = config.customDatabase.trainingImages.find(img => img.id === imageId);
    if (image) {
      image.label = label;
      if (onImagesChange) {
        onImagesChange(config.customDatabase.trainingImages);
      }
    }
    setSelectedImage(null);
    setLabelInput('');
  };

  const handleClearAll = () => {
    if (!confirm(`Remove all ${trainingImages.length} training images? This cannot be undone.`)) return;
    
    if (onImagesChange) {
      onImagesChange([]);
    }
    setSelectedImage(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const stats = {
    total: trainingImages.length,
    labeled: trainingImages.filter(img => img.label).length,
    unlabeled: trainingImages.filter(img => !img.label).length,
    labels: new Set(trainingImages.map(img => img.label).filter(Boolean)).size
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-500">Total Images</p>
          <p className="text-xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-500">Labeled</p>
          <p className="text-xl font-bold text-emerald-400">{stats.labeled}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-500">Needs Label</p>
          <p className="text-xl font-bold text-amber-400">{stats.unlabeled}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-slate-500">Unique Labels</p>
          <p className="text-xl font-bold text-blue-400">{stats.labels}</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver 
            ? 'border-blue-500 bg-blue-500/5' 
            : 'border-slate-700 bg-slate-950 hover:border-slate-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-blue-400">Processing images...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Drop training images here</p>
              <p className="text-xs text-slate-500 mt-1">or click to browse (JPG, PNG, WebP)</p>
            </div>
            {objectClasses.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {objectClasses.slice(0, 6).map(cls => (
                  <span key={cls} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">
                    {cls.replace(/_/g, ' ')}
                  </span>
                ))}
                {objectClasses.length > 6 && (
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-500 text-[10px] rounded">
                    +{objectClasses.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      {trainingImages.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Label Filter */}
            <select
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300"
            >
              {getAllLabels().map(label => (
                <option key={label} value={label}>
                  {label === 'all' ? 'All Images' : label.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
              title={viewMode === 'grid' ? 'List view' : 'Grid view'}
            >
              {viewMode === 'grid' ? (
                <List className="w-4 h-4 text-slate-400" />
              ) : (
                <Grid className="w-4 h-4 text-slate-400" />
              )}
            </button>
            
            {/* Clear All */}
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors text-xs"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {trainingImages.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" 
          : "space-y-2"
        }>
          {filteredImages.map((img) => (
            <div 
              key={img.id}
              className={`group relative rounded-lg border border-slate-800 overflow-hidden transition-all hover:border-blue-500/50 ${
                viewMode === 'list' ? 'flex items-center gap-3 p-2 bg-slate-950' : 'bg-slate-900'
              }`}
            >
              {/* Image Thumbnail */}
              <div 
                className={`relative overflow-hidden ${
                  viewMode === 'list' ? 'w-16 h-16 rounded flex-shrink-0' : 'aspect-square'
                }`}
                onClick={() => setSelectedImage(img)}
              >
                <img 
                  src={backendAvailable ? `http://localhost:8000/api/training-images/${img.id}` : img.data} 
                  alt={img.name || 'Training image'}
                  className="w-full h-full object-cover cursor-pointer"
                />
                {img.label ? (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-500/80 text-white text-[10px] rounded flex items-center gap-1">
                    <CheckCircle className="w-2 h-2" />
                    {img.label.length > 12 ? img.label.substring(0, 12) + '...' : img.label}
                  </div>
                ) : (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500/80 text-white text-[10px] rounded flex items-center gap-1">
                    <AlertTriangle className="w-2 h-2" />
                    Unlabeled
                  </div>
                )}
              </div>

              {/* Info / Actions */}
              {viewMode === 'list' && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{img.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(img.size)}</p>
                </div>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage(img.id);
                }}
                className={`p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors ${
                  viewMode === 'list' ? 'opacity-100' : 'absolute top-1 right-1 opacity-0 group-hover:opacity-100'
                }`}
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-950 rounded-lg border border-slate-800">
          <Image className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No training images yet</p>
          <p className="text-xs text-slate-500 mt-1">Upload images to train your sector AI</p>
        </div>
      )}

      {/* Image Detail / Label Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
          onClick={() => { setSelectedImage(null); setLabelInput(''); }}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-white text-sm">{selectedImage.name || 'Training Image'}</h3>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(selectedImage.size)} • {new Date(selectedImage.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedImage(null); setLabelInput(''); }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Image Preview */}
              <div className="flex-1 bg-slate-950 p-4">
                <img 
                  src={backendAvailable ? `http://localhost:8000/api/training-images/${selectedImage.id}` : selectedImage.data} 
                  alt="Preview" 
                  className="w-full max-h-[300px] object-contain rounded-lg"
                />
              </div>

              {/* Label Panel */}
              <div className="w-full md:w-72 p-4 border-t md:border-t-0 md:border-l border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Object Label
                  </label>
                  
                  {selectedImage.label ? (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm border border-emerald-500/30">
                        {selectedImage.label.replace(/_/g, ' ')}
                      </span>
                      <button 
                        onClick={() => handleAssignLabel(selectedImage.id, '')}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-sm border border-amber-500/30">
                        No label assigned
                      </span>
                    </div>
                  )}

                  {/* Quick Label Buttons */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Quick select from object classes:</p>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {objectClasses.map(cls => (
                        <button
                          key={cls}
                          onClick={() => handleAssignLabel(selectedImage.id, cls)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            selectedImage.label === cls
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                          }`}
                        >
                          {cls.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Label Input */}
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-1">Or type custom label:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && labelInput.trim()) {
                            handleAssignLabel(selectedImage.id, labelInput.trim().replace(/\s+/g, '_'));
                          }
                        }}
                        placeholder="custom_label..."
                        className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          if (labelInput.trim()) {
                            handleAssignLabel(selectedImage.id, labelInput.trim().replace(/\s+/g, '_'));
                          }
                        }}
                        disabled={!labelInput.trim()}
                        className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors text-sm disabled:opacity-50"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete Action */}
                <button
                  onClick={() => {
                    handleDeleteImage(selectedImage.id);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove from Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
