import React, { useState, useRef, useEffect } from 'react';
import { Video, Download, Share2, Play, Pause, X } from 'lucide-react';

export default function VideoRecorder({ onClipRecorded }) {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    // Initialize camera on mount
    initializeCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      setStream(mediaStream);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString();
      
      if (onClipRecorded) {
        onClipRecorded({
          id: `clip_${Date.now()}`,
          url,
          blob,
          timestamp,
          duration: 15
        });
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    // Auto-stop after 15 seconds
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        stopRecording();
      }
    }, 15000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    stream
  };
}

export function VideoPlayer({ clip, onClose, onVerify, onFlag }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = clip.url;
    a.download = `incident_${clip.timestamp}.webm`;
    a.click();
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(clip.url);
      alert('Video link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleVerify = () => {
    if (onVerify) onVerify();
  };

  const handleFlag = () => {
    if (onFlag) onFlag();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl relative z-10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center">
            <Video className="w-5 h-5 text-red-500 mr-2" />
            <span className="font-semibold text-white">Incident Clip</span>
            <span className="ml-4 text-sm text-slate-400">
              {new Date(clip.timestamp).toLocaleString()}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={clip.url}
            className="w-full max-h-[60vh]"
            onClick={togglePlay}
          />
          <button
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/80 rounded-full p-4 hover:bg-slate-900"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 bg-slate-900/50 border-t border-slate-800">
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={handleShare}
              className="flex items-center px-4 py-2 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 rounded-lg border border-slate-500/30 transition-colors"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400 mr-2">
              Duration: {clip.duration}s
            </span>
            {onVerify && (
              <button
                onClick={handleVerify}
                className="flex items-center px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 transition-colors font-semibold"
              >
                ✓ Verify
              </button>
            )}
            {onFlag && (
              <button
                onClick={handleFlag}
                className="flex items-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors font-semibold"
              >
                ⚠ Flag
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
