import React, { useState, useEffect, useRef } from 'react';
import {
  Store, Utensils, ShieldAlert, GraduationCap, Tractor,
  Video, Bell, Search, AlertTriangle, CheckCircle, Clock,
  Activity, Settings, Users, ArrowRight, Map, HeartPulse,
  BrainCircuit, LayoutDashboard, Fingerprint, DoorOpen, Coffee,
  Sparkles, X, Loader2, PlayCircle, Film, Save, Camera, Plus, Trash2, Eye,
  Wine, Music, Shield, MessageCircle
} from 'lucide-react';
import { VideoPlayer } from './components/VideoRecorder';
import { CameraViewer, CameraGridView } from './components/CameraViewer';
import TrainingImageManager from './components/TrainingImageManager';
import AlertsDashboard from './components/AlertsDashboard';
import LiquorStoreDashboard from './components/LiquorStoreDashboard';
import GoogleAuth from './components/GoogleAuth';
import AccessCodeGate from './components/AccessCodeGate';
import AdminPanel from './components/AdminPanel';
import UserMessaging from './components/UserMessaging';
import { API_BASE_URL } from './config';
import posService from './services/posIntegration';
import cameraService from './services/cameraIntegration';
import aiDetectionService from './services/aiDetection';
import sectorAIConfig from './services/sectorAIConfig';

// --- AI API INTEGRATION (via Netlify Function) ---
const callGeminiAPI = async (prompt) => {
  try {
    const response = await fetch('/.netlify/functions/ai-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`Function error: ${response.status}`);
    }

    const data = await response.json();
    return data.text || "No insights generated.";
  } catch (error) {
    console.error('AI Report Error:', error);
    return "Failed to generate AI insights. Please try again later.";
  }
};

// Helper to render basic markdown bolding and line breaks from Gemini
const formatLLMText = (text) => {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2"></div>;
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={i} className="mb-2 text-sm text-slate-300 leading-relaxed">
        {parts.map((part, j) => 
          part.startsWith('**') && part.endsWith('**') 
            ? <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong> 
            : part
        )}
      </p>
    );
  });
};

export default function App() {
  const [activeModule, setActiveModule] = useState('retail');
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'clips'
  const [isSimulating, setIsSimulating] = useState(true);

  // LLM Modal State
  const [llmModalOpen, setLlmModalOpen] = useState(false);
  const [llmTitle, setLlmTitle] = useState("");
  const [llmContent, setLlmContent] = useState("");
  const [isLlmLoading, setIsLlmLoading] = useState(false);

  // Video Clips State
  const [videoClips, setVideoClips] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // POS Configuration State
  const [posConfig, setPosConfig] = useState({
    type: 'mock', // 'loyverse', 'square', or 'mock'
    apiKey: '',
    storeId: ''
  });
  const [posTransactions, setPosTransactions] = useState([]);
  const [posStats, setPosStats] = useState(null);

  // Authentication State
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Access Code Verification State
  const [accessVerified, setAccessVerified] = useState(false);

  // Admin Panel State
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);

  // Alerts and Messaging State
  const [showAlerts, setShowAlerts] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  
  // Define sectors for alerts dashboard
  const sectors = [
    { id: 'retail', name: 'Retail', icon: 'Store' },
    { id: 'liquor', name: 'Liquor Store', icon: 'Wine' },
    { id: 'club', name: 'Club/Bar', icon: 'Music' },
    { id: 'restaurant', name: 'Restaurant', icon: 'Utensils' },
    { id: 'education', name: 'Education', icon: 'GraduationCap' },
    { id: 'agriculture', name: 'Agriculture', icon: 'Tractor' }
  ];

  // Check if access code is already verified in session
  useEffect(() => {
    const verified = sessionStorage.getItem('access_verified');
    if (verified === 'true') {
      setAccessVerified(true);
    }
  }, []);

  // Handle authentication changes
  const handleAuthChange = async (userData) => {
    setUser(userData);
    setIsAuthenticated(!!userData);

    // Check if user is admin
    if (userData && userData.email) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/check-admin/${userData.email}`);
        const data = await response.json();
        setIsAdmin(data.is_admin);

        // Skip access code for admin users
        if (data.is_admin) {
          setAccessVerified(true);
          sessionStorage.setItem('access_verified', 'true');
        }
      } catch (e) {
        console.error('Failed to check admin status:', e);
        setIsAdmin(false);
      }
    }

    // Reload user-specific data when authentication changes
    // Note: loadUserData will be implemented separately
    if (userData) {
      console.log('User authenticated:', userData.email);
    }
  };

  // Handle access code verification
  const handleAccessVerified = () => {
    setAccessVerified(true);
    sessionStorage.setItem('access_verified', 'true');
  };

  // Load unread alert count
  useEffect(() => {
    const loadUnreadAlerts = () => {
      const stored = localStorage.getItem('aiAlerts');
      if (stored) {
        const alerts = JSON.parse(stored);
        const unread = alerts.filter(a => !a.read).length;
        setUnreadAlertCount(unread);
      }
    };

    loadUnreadAlerts();
    // Update every 10 seconds
    const interval = setInterval(loadUnreadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Camera Configuration State
  const [cameras, setCameras] = useState([]);
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [newCamera, setNewCamera] = useState({
    name: '',
    type: 'webcam',
    url: '',
    location: '',
    module: 'retail',
    phoneIP: '',
    phonePort: '8080',
    phoneApp: 'ipwebcam'
  });

  // AI Detection State
  const [aiConfig, setAiConfig] = useState({
    enablePoseDetection: true,
    enableObjectDetection: true,
    confidenceThreshold: 0.6,
    autoRecordSuspicious: true
  });
  const [aiInitialized, setAiInitialized] = useState(false);

  // Sector-Specific AI Configuration State
  const [sectorConfigs, setSectorConfigs] = useState(sectorAIConfig.getAllSectorConfigs());
  const [selectedSectorForConfig, setSelectedSectorForConfig] = useState(null);

  // Define the different industry modules
  const modules = [
    { id: 'retail', name: 'Retail & Shoes', icon: Store, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'hospitality', name: 'Hotels & Dining', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'liquor', name: 'Liquor Store', icon: Wine, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'clubs', name: 'Nightclubs & Bars', icon: Music, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { id: 'security', name: 'Facility Security', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'education', name: 'Education & Wellness', icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'agriculture', name: 'Livestock & Farms', icon: Tractor, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
  ];

  // --- GEMINI HANDLERS ---
  const handleGenerateShiftReport = async () => {
    const currentModule = modules.find(m => m.id === activeModule);
    setLlmTitle(`✨ AI Shift Operations Report: ${currentModule.name}`);
    setLlmModalOpen(true);
    setIsLlmLoading(true);
    setLlmContent("");

    const prompt = `You are NEW ZERO AI, a smart security, operations, and behavior analytics assistant. 
    Write a brief, professional end-of-shift report for the "${currentModule.name}" sector. 
    Based on typical alerts for this industry (e.g., missed scans, dine and dash, geofence breaches, or behavioral anomalies), summarize:
    1. Overall System Status
    2. Key Behavioral Trends to watch
    3. Two actionable security or operational improvements for management.
    Keep it highly concise and formatted nicely with markdown.`;
    
    const text = await callGeminiAPI(prompt);
    setLlmContent(text);
    setIsLlmLoading(false);
  };

  const handleAnalyzeIncident = async (logTitle, logDesc) => {
    setLlmTitle(`✨ Incident Analysis`);
    setLlmModalOpen(true);
    setIsLlmLoading(true);
    setLlmContent("");

    const prompt = `You are an expert security and operations analyst connected to a cutting-edge computer vision system. 
    Analyze this specific incident captured by the cameras:
    Event Title: ${logTitle}
    Event Details: ${logDesc}
    
    Provide a fast, actionable breakdown containing:
    1. **Risk Assessment** (Low/Medium/High and why)
    2. **Immediate Action Required** (What staff on the ground should do right now)
    3. **Preventative Strategy** (How to tweak rules or physical layouts to stop this in the future)
    
    Keep the response sharp, concise, and structured.`;

    const text = await callGeminiAPI(prompt);
    setLlmContent(text);
    setIsLlmLoading(false);
  };

  // --- VIDEO RECORDING HANDLERS ---
  useEffect(() => {
    // Initialize camera on mount
    initializeCamera();
    // Simulate recording clips for demo
    simulateExistingClips();
    // Initialize POS system
    initializePOS();
    // Initialize cameras
    initializeCameras();
    // Initialize AI Detection
    initializeAI();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Refresh POS data when config changes
  useEffect(() => {
    if (posConfig.type) {
      initializePOS();
    }
  }, [posConfig]);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      streamRef.current = stream;
    } catch (error) {
      console.log('Camera access not available, using simulation mode');
    }
  };

  const simulateExistingClips = () => {
    // Add some demo clips
    const demoClips = [
      {
        id: 'clip_001',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        title: 'THEFT SUSPICION',
        description: 'Subject moving to exit without POS scan',
        module: 'retail',
        status: 'Suspicious',
        duration: 15
      },
      {
        id: 'clip_002',
        url: 'https://www.w3schools.com/html/movie.mp4',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        title: 'Dine & Dash Alert',
        description: 'Guest exited without payment verification',
        module: 'hospitality',
        status: 'Suspicious',
        duration: 15
      }
    ];
    setVideoClips(demoClips);
  };

  const recordSuspiciousEvent = async (eventData) => {
    if (!streamRef.current) {
      console.log('No camera stream available');
      return;
    }

    setIsRecording(true);
    const chunks = [];
    
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      const newClip = {
        id: `clip_${Date.now()}`,
        url,
        blob,
        timestamp: new Date().toISOString(),
        title: eventData.title || 'Suspicious Activity',
        description: eventData.description || 'Automated recording',
        module: activeModule,
        status: 'Suspicious',
        duration: 15
      };

      setVideoClips(prev => [newClip, ...prev]);
      setIsRecording(false);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;

    // Auto-stop after 15 seconds
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, 15000);
  };

  const updateClipStatus = (clipId, newStatus) => {
    setVideoClips(prev =>
      prev.map(clip =>
        clip.id === clipId ? { ...clip, status: newStatus } : clip
      )
    );
  };

  // --- POS INTEGRATION HANDLERS ---
  const initializePOS = async () => {
    try {
      posService.initialize({
        type: posConfig.type,
        apiKey: posConfig.apiKey,
        storeId: posConfig.storeId
      });

      // Fetch recent transactions
      const transactions = await posService.getRecentTransactions(20);
      setPosTransactions(transactions);

      // Get sales statistics
      const stats = await posService.getSalesStats();
      setPosStats(stats);
    } catch (error) {
      console.error('Error initializing POS:', error);
    }
  };

  const savePOSConfig = (newConfig) => {
    setPosConfig(newConfig);
    localStorage.setItem('posConfig', JSON.stringify(newConfig));
  };

  const verifyItemWithPOS = async (itemName) => {
    const result = await posService.verifyItemScanned(itemName);
    return result;
  };

  // --- CAMERA MANAGEMENT HANDLERS ---
  const initializeCameras = () => {
    // Load mock cameras for demo
    const mockCameras = cameraService.getMockCameras();
    setCameras(mockCameras);
  };

  const handleAddCamera = () => {
    let camera;
    
    switch (newCamera.type) {
      case 'webcam':
        camera = cameraService.addCamera({
          name: newCamera.name,
          type: 'webcam',
          location: newCamera.location,
          module: newCamera.module
        });
        break;
        
      case 'ip':
        camera = cameraService.addCamera({
          name: newCamera.name,
          type: 'ip',
          url: newCamera.url,
          location: newCamera.location,
          module: newCamera.module
        });
        break;
        
      case 'phone':
        const phoneUrl = `http://${newCamera.phoneIP}:${newCamera.phonePort}/video`;
        camera = cameraService.addCamera({
          name: newCamera.name,
          type: 'phone',
          url: phoneUrl,
          location: newCamera.location,
          module: newCamera.module
        });
        break;
    }

    if (camera) {
      setCameras([...cameras, camera]);
      setShowAddCamera(false);
      setNewCamera({
        name: '',
        type: 'webcam',
        url: '',
        location: '',
        module: 'retail',
        phoneIP: '',
        phonePort: '8080',
        phoneApp: 'ipwebcam'
      });
    }
  };

  const handleRemoveCamera = (cameraId) => {
    cameraService.removeCamera(cameraId);
    setCameras(cameras.filter(c => c.id !== cameraId));
  };

  const testCameraConnection = async (cameraId) => {
    const result = await cameraService.testConnection(cameraId);
    alert(result.success ? result.message : `Error: ${result.error}`);
  };

  // --- AI DETECTION HANDLERS ---
  const initializeAI = async () => {
    try {
      const initialized = await aiDetectionService.initialize(aiConfig);
      setAiInitialized(initialized);
      console.log('AI Detection initialized:', initialized);
    } catch (error) {
      console.error('Error initializing AI:', error);
    }
  };

  const saveAIConfig = (newConfig) => {
    setAiConfig(newConfig);
    localStorage.setItem('aiConfig', JSON.stringify(newConfig));
    // Reinitialize AI with new config
    aiDetectionService.initialize(newConfig);
  };

  // Simulated Data for different modules
  const renderModuleContent = () => {
    switch(activeModule) {
      case 'hospitality':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Active Tables" value="24" icon={Coffee} color="blue" />
              <StatCard title="Unpaid Exits Prevented" value="2" icon={DoorOpen} color="emerald" />
              <StatCard title="Dine & Dash Alerts" value="1" icon={AlertTriangle} color="red" alert />
            </div>
            <div className="flex gap-6 h-[400px]">
              <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1934&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                {/* AI Trajectory Overlay */}
                <div className="absolute top-1/4 right-1/4 w-32 h-48 border-2 border-red-500 bg-red-500/20 rounded-lg">
                  <div className="absolute -top-8 left-[-2px] bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded flex flex-col">
                    <span>ID: Guest_88</span>
                    <span>Status: UNPAID</span>
                  </div>
                </div>
                {/* Invisible Exit Zone */}
                <div className="absolute bottom-0 right-0 w-64 h-full border-l-4 border-dashed border-yellow-500/50 bg-yellow-500/10 flex items-center justify-center">
                  <span className="bg-yellow-500/80 text-white text-xs font-bold px-2 py-1 rounded">EXIT ZONE</span>
                </div>
                {/* Trajectory Line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path d="M 300 200 Q 500 250 700 300" fill="transparent" stroke="red" strokeWidth="3" strokeDasharray="5,5" className="animate-pulse"/>
                </svg>
              </div>
              <div className="w-80 bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Live Logic Engine</h3>
                <LogEntry time="19:42" title="Table 4: Bill Requested" desc="Waiter: Michael T." type="info" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="19:45" title="Guest_88 stood up" desc="Trajectory heading to exit" type="warning" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="19:45" title="POS Check: UNPAID" desc="Bill $145.50 pending" type="warning" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="19:46" title="SUSPICION TRIGGERED" desc="Unpaid guest entered Exit Zone. Manager notified." type="danger" onAnalyze={handleAnalyzeIncident} />
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Facility Occupancy" value="142" icon={Users} color="blue" />
              <StatCard title="Restroom Violations" value="0" icon={DoorOpen} color="emerald" />
              <StatCard title="Agitation/Fights" value="1" icon={ShieldAlert} color="red" alert />
            </div>
            <div className="flex gap-6 h-[400px]">
              <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                {/* Pose Estimation Violence Detection */}
                <div className="absolute top-1/3 left-1/3 w-64 h-64 border-2 border-red-500 bg-red-500/10 rounded-lg">
                  <div className="absolute -top-6 left-[-2px] bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                    SKELETON OVERLAP: AGITATION DETECTED
                  </div>
                  {/* Mock Skeletons intersecting */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    <line x1="20" y1="20" x2="50" y2="50" stroke="red" strokeWidth="2" />
                    <line x1="80" y1="20" x2="50" y2="50" stroke="red" strokeWidth="2" />
                    <circle cx="50" cy="50" r="5" fill="red" className="animate-ping" />
                  </svg>
                </div>
              </div>
              <div className="w-80 bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Security Rules Engine</h3>
                <LogEntry time="22:10" title="Washroom A (Female)" desc="Subject identified: Female (98%). Access OK." type="success" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="22:15" title="Lobby Area 2" desc="High-velocity movement detected." type="warning" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="22:15" title="Pose Estimation Alert" desc="Multiple skeletons overlapping. Sudden trajectory shifts." type="danger" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="22:16" title="SECURITY DISPATCHED" desc="Guard unit sent to Lobby 2." type="info" onAnalyze={handleAnalyzeIncident} />
              </div>
            </div>
          </div>
        );

      case 'education':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Active Students" value="450" icon={Users} color="blue" />
              <StatCard title="Odd-Hour Loitering" value="2" icon={Clock} color="red" alert />
              <StatCard title="Wellness Checks" value="1" icon={HeartPulse} color="yellow" />
              <StatCard title="Curriculum Insights" value="12" icon={BrainCircuit} color="purple" />
            </div>
            <div className="flex gap-6 h-[400px]">
              <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
                {/* Loitering Detection */}
                <div className="absolute top-1/2 left-1/2 w-24 h-48 border-2 border-red-500 bg-red-500/20 rounded-lg">
                  <div className="absolute -top-10 left-[-2px] bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded flex flex-col">
                    <span>Zone: Dorm Hall B</span>
                    <span>Time: 02:14 AM (Restricted)</span>
                  </div>
                </div>
                {/* Wellness Detection (Kindergarten context) */}
                <div className="absolute top-1/4 right-1/4 w-20 h-32 border-2 border-yellow-500 bg-yellow-500/20 rounded-lg">
                  <div className="absolute -top-10 left-[-2px] bg-yellow-500 text-slate-900 text-[10px] font-bold px-2 py-1 rounded flex flex-col">
                    <span>Student ID: K-42</span>
                    <span>Isolated: 25 mins</span>
                  </div>
                </div>
              </div>
              <div className="w-80 bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Teacher/ToD Dashboard</h3>
                <LogEntry time="02:14 AM" title="GEOFENCE BREACH" desc="Movement in Dorm Hall B during curfew." type="danger" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="02:14 AM" title="ToD Alert Sent" desc="Pinged Mr. Davis (Duty Master iPad)." type="info" onAnalyze={handleAnalyzeIncident} />
                <div className="my-4 border-t border-slate-800"></div>
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">AI Curriculum Insights</h3>
                <LogEntry time="Today" title="Student K-42 Analysis" desc="Low group participation. High visual focus on puzzles. Suggest kinesthetic learning modules." type="success" onAnalyze={handleAnalyzeIncident} />
              </div>
            </div>
          </div>
        );

      case 'liquor':
        return <LiquorStoreDashboard />;

      case 'clubs':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Active Patrons" value="156" icon={Music} color="pink" />
              <StatCard title="Bouncer Alerts" value="3" icon={Shield} color="red" alert />
              <StatCard title="VIP Access" value="12" icon={Users} color="emerald" />
            </div>
            <div className="flex gap-6 h-[400px]">
              <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566737237500-90a7f88a8462?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                {/* Crowd Density Detection */}
                <div className="absolute top-1/4 left-1/4 w-48 h-64 border-2 border-yellow-500 bg-yellow-500/20 rounded-lg">
                  <div className="absolute -top-8 left-[-2px] bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                    Zone: Dance Floor - HIGH DENSITY
                  </div>
                </div>
              </div>
              <div className="w-80 bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
                <h3 className="text-white font-bold mb-3">Recent Incidents</h3>
                <LogEntry time="23:45" title="Overcrowding Alert" desc="Dance floor exceeds capacity limit." type="warning" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="23:42" title="ID Check Required" desc="Guest at entrance appears underage." type="danger" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="23:38" title="VIP Access" desc="Guest 882 entered VIP lounge." type="success" onAnalyze={handleAnalyzeIncident} />
              </div>
            </div>
          </div>
        );

      case 'agriculture':
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Livestock Count" value="1,240" icon={Tractor} color="emerald" />
              <StatCard title="Predator Alerts" value="0" icon={ShieldAlert} color="blue" />
              <StatCard title="Health Anomalies" value="1" icon={HeartPulse} color="red" alert />
            </div>
            <div className="flex gap-6 h-[400px]">
              <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
                {/* Drone/Camera view of cows */}
                <div className="absolute inset-0 bg-emerald-900/10"></div>
                {/* Sick Cow Detection */}
                <div className="absolute top-1/2 right-1/3 w-32 h-24 border-2 border-red-500 bg-red-500/20 rounded-lg">
                  <div className="absolute -top-10 left-[-2px] bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded flex flex-col">
                    <span>Subject: Bovine_492</span>
                    <span>Mobility: -85% (Lethargic)</span>
                  </div>
                </div>
                 {/* Healthy Cow Detection */}
                 <div className="absolute bottom-1/4 left-1/4 w-32 h-24 border-2 border-emerald-500 bg-emerald-500/10 rounded-lg">
                  <div className="absolute -top-6 left-[-2px] bg-emerald-500 text-slate-900 text-[10px] font-bold px-2 py-1 rounded">
                    Subject: Bovine_493 (Active)
                  </div>
                </div>
              </div>
              <div className="w-80 bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Farm Operations AI</h3>
                <LogEntry time="08:00 AM" title="Headcount Verified" desc="1,240 animals present in Sector 4." type="success" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="14:30 PM" title="Behavioral Baseline Shift" desc="Bovine_492 activity dropped below 15%." type="warning" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="16:00 PM" title="DISEASE PRE-WARNING" desc="Subject lethargic for 4+ hours. Vet check recommended." type="danger" onAnalyze={handleAnalyzeIncident} />
              </div>
            </div>
          </div>
        );

      default: // Retail (Shoe Shop)
        return (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Foot Traffic" value="342" icon={Users} color="blue" />
              <StatCard title="Shoes Tried On" value="84" icon={Store} color="purple" />
              <StatCard title="Missed Scans" value="2" icon={AlertTriangle} color="red" alert />
              <StatCard title="Conversion Rate" value="24%" icon={Activity} color="emerald" />
            </div>
            <div className="flex gap-6 h-[400px]">
              <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=1925&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
                {/* Complex Pose Estimation / Concealment */}
                <div className="absolute top-1/3 left-1/4 w-48 h-64 border-2 border-red-500 bg-red-500/10 rounded-lg">
                  <div className="absolute -top-10 left-[-2px] bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded flex flex-col">
                    <span>Nike Air Max (Unpaid)</span>
                    <span>Action: Concealed in Bag</span>
                  </div>
                  {/* Hand to Bag vector */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                    <path d="M 50 20 L 50 80" stroke="red" strokeWidth="2" strokeDasharray="4" className="animate-pulse" />
                    <circle cx="50" cy="80" r="4" fill="red" />
                  </svg>
                </div>
              </div>
              <div className="w-80 bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Retail Behavior AI</h3>
                <LogEntry time="11:42 AM" title="Item Picked Up" desc="Nike Air Max selected from Shelf A." type="info" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="11:45" title="Pose Interaction" desc="Subject sitting. Trying on shoes." type="success" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="11:48" title="Behavior Anomaly" desc="Item moved to personal bag trajectory." type="warning" onAnalyze={handleAnalyzeIncident} />
                <LogEntry time="11:49" title="THEFT SUSPICION" desc="Subject moving to exit without POS scan." type="danger" onAnalyze={handleAnalyzeIncident} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {/* Access Code Gate - Skip for admin users */}
      {!accessVerified && !isAdmin && <AccessCodeGate onVerified={handleAccessVerified} />}

      {/* Main App */}
      <div className="flex h-screen bg-slate-950 text-slate-300 font-sans">
        {/* NEW ZERO Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            NEW <span className="text-blue-400">ZERO</span>
          </h1>
        </div>

        <div className="px-4 py-4">
          <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Select AI Environment</p>
          <nav className="space-y-2">
            {modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeModule === mod.id
                    ? `${mod.bg} ${mod.color} border border-${mod.color.split('-')[1]}-500/30 font-bold`
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <mod.icon className={`w-5 h-5 mr-3 ${activeModule === mod.id ? mod.color : 'text-slate-500'}`} />
                <span>{mod.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="px-4 py-2 border-t border-slate-800">
          <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Quick Access</p>
          <div className="space-y-2">
            <button
              onClick={() => setActiveView(activeView === 'clips' ? 'dashboard' : 'clips')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === 'clips'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Film className={`w-5 h-5 mr-3 ${activeView === 'clips' ? 'text-red-400' : 'text-slate-500'}`} />
              <span>Video Clips</span>
              {videoClips.filter(c => c.status === 'Suspicious').length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {videoClips.filter(c => c.status === 'Suspicious').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView(activeView === 'cameras' ? 'dashboard' : 'cameras')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === 'cameras'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Camera className={`w-5 h-5 mr-3 ${activeView === 'cameras' ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>Live Cameras</span>
              {cameras.filter(c => c.status === 'online').length > 0 && (
                <span className="ml-auto bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {cameras.filter(c => c.status === 'online').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView(activeView === 'settings' ? 'dashboard' : 'settings')}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === 'settings'
                  ? 'bg-slate-500/10 text-slate-200 border border-slate-500/30 font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Settings className={`w-5 h-5 mr-3 ${activeView === 'settings' ? 'text-slate-200' : 'text-slate-500'}`} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center text-xs text-slate-400 mb-2">
              <HeartPulse className="w-4 h-4 mr-2 text-emerald-500 animate-pulse" /> Core AI Engine
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-full" />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">Processing 24 Video Streams</p>
          </div>
        </div>
      </aside>

      {/* Main Command Center */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8">
          <div className="flex items-center">
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center">
              <Map className="w-4 h-4 mr-2" />
              Global Command Hub <ArrowRight className="w-3 h-3 mx-2 text-slate-600" />
              <span className="text-white">{modules.find((m) => m.id === activeModule)?.name}</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGenerateShiftReport}
              className="flex items-center px-4 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-medium rounded-lg border border-indigo-500/30 transition-colors shadow-sm shadow-indigo-500/10"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate AI Shift Report
            </button>

            <button 
              onClick={() => setShowAlerts(true)}
              className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors"
              title="View Alerts"
            >
              <Bell className="w-5 h-5" />
              {unreadAlertCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                  </span>
                </>
              )}
            </button>
            <GoogleAuth onAuthChange={handleAuthChange} />
            {isAdmin ? (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                title="Admin Panel"
              >
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white">Admin</span>
              </button>
            ) : isAuthenticated && (
              <button
                onClick={() => setShowMessaging(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors"
                title="Contact Admin"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Contact Admin</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          {activeView === 'cameras' ? (
            <div className="space-y-6">
              {/* CORS Warning Banner */}
              {window.location.protocol === 'https:' && (
                <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-yellow-400 mb-2">⚠️ Camera Feeds May Not Work (CORS Issue)</h3>
                      <p className="text-sm text-slate-300 mb-3">
                        Your site is HTTPS but phone cameras use HTTP. Browsers block this for security.
                      </p>
                      <div className="bg-slate-950 rounded-lg p-3 mb-3">
                        <p className="text-xs font-mono text-emerald-400 mb-1">✅ SOLUTION: Run app locally</p>
                        <code className="text-xs text-slate-400 block">
                          cd "/Users/admin/Desktop/zero reason/omni-vision-platform"<br/>
                          npm run dev
                        </code>
                        <p className="text-xs text-slate-400 mt-2">Then open: <span className="text-blue-400">http://localhost:5173</span></p>
                      </div>
                      <p className="text-xs text-slate-400">
                        💡 On localhost (HTTP), cameras will work perfectly with no CORS issues!
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Live Camera Feeds</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">
                    {cameras.filter(c => c.status === 'online').length} of {cameras.length} online
                  </span>
                  <button
                    onClick={() => setActiveView('settings')}
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors text-sm font-semibold"
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Manage Cameras
                  </button>
                </div>
              </div>

              {cameras.length > 0 ? (
                <CameraGridView 
                  cameras={cameras}
                  onSelectCamera={(camera) => setSelectedCamera(camera)}
                />
              ) : (
                <div className="text-center py-16">
                  <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Cameras Configured</h3>
                  <p className="text-slate-400 mb-6">Add your first camera to start monitoring</p>
                  <button
                    onClick={() => setActiveView('settings')}
                    className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors font-semibold inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Camera
                  </button>
                </div>
              )}
            </div>
          ) : activeView === 'settings' ? (
            <div className="space-y-6 max-w-4xl">
              <h2 className="text-2xl font-bold text-white">System Settings</h2>

              {/* Sector-Specific AI Configuration */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Sector-Specific AI Models</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure custom AI models and training databases for each business sector
                    </p>
                  </div>
                </div>

                {/* Sector Selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {modules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => setSelectedSectorForConfig(module.id)}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedSectorForConfig === module.id
                          ? `${module.bg} ${module.color} border-${module.color.split('-')[1]}-500/50 font-semibold`
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <module.icon className={`w-6 h-6 mx-auto mb-2 ${
                        selectedSectorForConfig === module.id ? module.color : 'text-slate-500'
                      }`} />
                      <p className="text-xs text-center">{module.name}</p>
                    </button>
                  ))}
                </div>

                {/* Sector Configuration Panel */}
                {selectedSectorForConfig && sectorConfigs[selectedSectorForConfig] && (
                  <div className="space-y-4 bg-slate-950 rounded-lg p-6 border border-slate-800">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        {modules.find(m => m.id === selectedSectorForConfig)?.icon &&
                          React.createElement(modules.find(m => m.id === selectedSectorForConfig).icon, {
                            className: `w-5 h-5 ${modules.find(m => m.id === selectedSectorForConfig)?.color}`
                          })
                        }
                        {sectorConfigs[selectedSectorForConfig].name} AI Configuration
                      </h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sectorConfigs[selectedSectorForConfig].enabled}
                          onChange={(e) => {
                            const updated = sectorAIConfig.updateSectorConfig(selectedSectorForConfig, {
                              enabled: e.target.checked
                            });
                            setSectorConfigs({ ...sectorConfigs, [selectedSectorForConfig]: updated });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {/* AI Model Selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">AI Model Type</label>
                      <select
                        value={sectorConfigs[selectedSectorForConfig].aiModel}
                        onChange={(e) => {
                          const updated = sectorAIConfig.updateSectorConfig(selectedSectorForConfig, {
                            aiModel: e.target.value
                          });
                          setSectorConfigs({ ...sectorConfigs, [selectedSectorForConfig]: updated });
                        }}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general-retail">General Retail Detection</option>
                        <option value="hospitality">Hospitality & Dining</option>
                        <option value="liquor-specialized">Liquor Store Specialized</option>
                        <option value="nightlife-specialized">Nightlife & Clubs Specialized</option>
                        <option value="security">Security & Surveillance</option>
                        <option value="agriculture">Agriculture & Livestock</option>
                        <option value="education">Education & Wellness</option>
                        <option value="custom">Custom Trained Model</option>
                      </select>
                    </div>

                    {/* Custom ML Model URL */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Custom ML Model URL (Optional)
                        <span className="text-xs text-slate-500 ml-2">Roboflow, TensorFlow.js, etc.</span>
                      </label>
                      <input
                        type="text"
                        value={sectorConfigs[selectedSectorForConfig].mlModelUrl || ''}
                        onChange={(e) => {
                          const updated = sectorAIConfig.updateSectorConfig(selectedSectorForConfig, {
                            mlModelUrl: e.target.value
                          });
                          setSectorConfigs({ ...sectorConfigs, [selectedSectorForConfig]: updated });
                        }}
                        placeholder="https://detect.roboflow.com/your-model/1"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Detection Types */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Detection Types</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['theft', 'shoplifting', 'dine_dash', 'intrusion', 'violence', 'fraud'].map((type) => (
                          <label key={type} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={sectorConfigs[selectedSectorForConfig].detectionTypes?.includes(type)}
                              onChange={(e) => {
                                const currentTypes = sectorConfigs[selectedSectorForConfig].detectionTypes || [];
                                const updatedTypes = e.target.checked
                                  ? [...currentTypes, type]
                                  : currentTypes.filter(t => t !== type);
                                const updated = sectorAIConfig.updateSectorConfig(selectedSectorForConfig, {
                                  detectionTypes: updatedTypes
                                });
                                setSectorConfigs({ ...sectorConfigs, [selectedSectorForConfig]: updated });
                              }}
                              className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-300 capitalize">{type.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Confidence Threshold */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Confidence Threshold: {sectorConfigs[selectedSectorForConfig].confidenceThreshold}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={sectorConfigs[selectedSectorForConfig].confidenceThreshold}
                        onChange={(e) => {
                          const updated = sectorAIConfig.updateSectorConfig(selectedSectorForConfig, {
                            confidenceThreshold: parseFloat(e.target.value)
                          });
                          setSectorConfigs({ ...sectorConfigs, [selectedSectorForConfig]: updated });
                        }}
                        className="w-full"
                      />
                    </div>

                    {/* Training Image Manager */}
                    <div className="pt-4 border-t border-slate-800">
                      <TrainingImageManager sectorId={selectedSectorForConfig} />
                    </div>
                  </div>
                )}
              </div>

              {/* POS Integration Settings */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">POS Integration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">POS System</label>
                    <select
                      value={posConfig.type}
                      onChange={(e) => setPosConfig({ ...posConfig, type: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mock">Demo / Mock Data</option>
                      <option value="loyverse">Loyverse</option>
                      <option value="square">Square</option>
                    </select>
                  </div>
                  
                  {posConfig.type !== 'mock' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">API Key</label>
                        <input
                          type="password"
                          value={posConfig.apiKey}
                          onChange={(e) => setPosConfig({ ...posConfig, apiKey: e.target.value })}
                          placeholder="Enter your API key"
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Store ID</label>
                        <input
                          type="text"
                          value={posConfig.storeId}
                          onChange={(e) => setPosConfig({ ...posConfig, storeId: e.target.value })}
                          placeholder="Enter your store ID"
                          className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={() => savePOSConfig(posConfig)}
                    className="flex items-center px-6 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors font-semibold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </button>
                </div>
              </div>

              {/* POS Statistics */}
              {posStats && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">POS Statistics (Last Hour)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950 p-4 rounded-lg">
                      <p className="text-xs text-slate-400 uppercase mb-1">Transactions</p>
                      <p className="text-2xl font-bold text-white">{posStats.totalTransactions}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-lg">
                      <p className="text-xs text-slate-400 uppercase mb-1">Revenue</p>
                      <p className="text-2xl font-bold text-emerald-400">${posStats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-lg">
                      <p className="text-xs text-slate-400 uppercase mb-1">Avg Transaction</p>
                      <p className="text-2xl font-bold text-blue-400">${posStats.averageTransaction.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-lg">
                      <p className="text-xs text-slate-400 uppercase mb-1">Top Employee</p>
                      <p className="text-sm font-bold text-purple-400">{posStats.topEmployee.name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {posTransactions.length > 0 && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {posTransactions.map((transaction) => (
                      <div key={transaction.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-white">#{transaction.id}</p>
                            <p className="text-xs text-slate-400">{new Date(transaction.timestamp).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-400">${transaction.total.toFixed(2)}</p>
                            <p className="text-xs text-slate-400">{transaction.employee}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {transaction.items.map((item, idx) => (
                            <div key={idx} className="text-xs text-slate-300 flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="text-slate-400">${item.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Camera Management</h3>
                  <button
                    onClick={() => {
                      setNewCamera(prev => ({ ...prev, module: activeModule }));
                      setShowAddCamera(!showAddCamera);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors font-semibold"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Camera
                  </button>
                </div>

                {/* Add Camera Form */}
                {showAddCamera && (
                  <div className="mb-6 p-4 bg-slate-950 rounded-lg border border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3">New Camera Configuration</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Camera Name</label>
                          <input
                            type="text"
                            value={newCamera.name}
                            onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                            placeholder="e.g., Front Counter"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Camera Type</label>
                          <select
                            value={newCamera.type}
                            onChange={(e) => setNewCamera({ ...newCamera, type: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-sm"
                          >
                            <option value="webcam">Webcam</option>
                            <option value="ip">IP Camera</option>
                            <option value="phone">Phone Camera</option>
                          </select>
                        </div>
                      </div>

                      {newCamera.type === 'ip' && (
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Camera URL</label>
                          <input
                            type="text"
                            value={newCamera.url}
                            onChange={(e) => setNewCamera({ ...newCamera, url: e.target.value })}
                            placeholder="http://192.168.1.100:8080/video"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-sm"
                          />
                        </div>
                      )}

                      {newCamera.type === 'phone' && (
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Phone IP Address</label>
                          <input
                            type="text"
                            value={newCamera.url}
                            onChange={(e) => setNewCamera({ ...newCamera, url: e.target.value })}
                            placeholder="http://192.168.1.102:4747/video"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-sm"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Resolution</label>
                        <select
                          value={newCamera.resolution}
                          onChange={(e) => setNewCamera({ ...newCamera, resolution: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-sm"
                        >
                          <option value="640x480">640x480 (SD)</option>
                          <option value="1280x720">1280x720 (HD)</option>
                          <option value="1920x1080">1920x1080 (FHD)</option>
                          <option value="3840x2160">3840x2160 (4K)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">FPS</label>
                        <select
                          value={newCamera.fps}
                          onChange={(e) => setNewCamera({ ...newCamera, fps: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-sm"
                        >
                          <option value="15">15 FPS</option>
                          <option value="24">24 FPS</option>
                          <option value="30">30 FPS</option>
                          <option value="60">60 FPS</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setShowAddCamera(false)}
                          className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddCamera}
                          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 text-sm font-semibold"
                        >
                          Add Camera
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Camera List */}
                <div className="space-y-2">
                  {cameras.map((camera) => (
                    <div key={camera.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          camera.status === 'online' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                          camera.status === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                          'bg-slate-500/10 border border-slate-500/30'
                        }`}>
                          <Camera className={`w-5 h-5 ${
                            camera.status === 'online' ? 'text-emerald-400' :
                            camera.status === 'error' ? 'text-red-400' :
                            'text-slate-400'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{camera.name}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="capitalize">{camera.type}</span>
                            <span>•</span>
                            <span>{camera.location}</span>
                            <span>•</span>
                            <span className="capitalize">{camera.module}</span>
                            <span>•</span>
                            <span className={`font-semibold ${
                              camera.status === 'online' ? 'text-emerald-400' :
                              camera.status === 'error' ? 'text-red-400' :
                              'text-slate-500'
                            }`}>
                              {camera.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => testCameraConnection(camera.id)}
                          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Test Connection"
                        >
                          <Eye className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleRemoveCamera(camera.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove Camera"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {cameras.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No cameras configured yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Detection Configuration */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">AI Detection Settings</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Status: <span className={`font-semibold ${aiInitialized ? 'text-emerald-400' : 'text-red-400'}`}>
                        {aiInitialized ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div>
                        <label className="text-sm font-medium text-slate-300">Pose Detection</label>
                        <p className="text-xs text-slate-500 mt-1">Analyze body movements</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiConfig.enablePoseDetection}
                          onChange={(e) => setAiConfig({ ...aiConfig, enablePoseDetection: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div>
                        <label className="text-sm font-medium text-slate-300">Object Detection</label>
                        <p className="text-xs text-slate-500 mt-1">Identify items & products</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiConfig.enableObjectDetection}
                          onChange={(e) => setAiConfig({ ...aiConfig, enableObjectDetection: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Confidence Threshold: {(aiConfig.confidenceThreshold * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={aiConfig.confidenceThreshold}
                      onChange={(e) => setAiConfig({ ...aiConfig, confidenceThreshold: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>More detections</span>
                      <span>Higher accuracy</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <label className="text-sm font-medium text-slate-300">Auto-Record Suspicious Events</label>
                      <p className="text-xs text-slate-500 mt-1">Automatically capture video clips</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiConfig.autoRecordSuspicious}
                        onChange={(e) => setAiConfig({ ...aiConfig, autoRecordSuspicious: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <button
                    onClick={() => saveAIConfig(aiConfig)}
                    className="w-full flex items-center justify-center px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors font-semibold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save AI Configuration
                  </button>
                </div>
              </div>
            </div>
          ) : activeView === 'clips' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Recorded Incident Clips</h2>
                {isRecording && (
                  <div className="flex items-center px-4 py-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    Recording...
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videoClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-all group cursor-pointer"
                    onClick={() => setSelectedClip(clip)}
                  >
                    <div className="relative aspect-video bg-slate-950 overflow-hidden">
                      <video src={clip.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                      <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <PlayCircle className="w-10 h-10 text-white" />
                        </div>
                      </button>
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold ${
                        clip.status === 'Suspicious' ? 'bg-red-500/90 text-white' : 
                        clip.status === 'Verified' ? 'bg-emerald-500/90 text-white' : 
                        'bg-slate-500/90 text-white'
                      }`}>
                        {clip.status}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-1">{clip.title}</h3>
                      <p className="text-sm text-slate-400 mb-2">{clip.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{new Date(clip.timestamp).toLocaleString()}</span>
                        <span className="capitalize">{clip.module}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateClipStatus(clip.id, 'Verified');
                          }}
                          className="flex-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
                        >
                          Verify
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateClipStatus(clip.id, 'Flagged');
                          }}
                          className="flex-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                        >
                          Flag
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {videoClips.length === 0 && (
                <div className="text-center py-20">
                  <Film className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No recorded clips yet</p>
                </div>
              )}
            </div>
          ) : (
            renderModuleContent()
          )}
        </div>
      </main>

      {/* --- GEMINI LLM MODAL OVERLAY --- */}
      {llmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setLlmModalOpen(false)}></div>
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[80vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mr-3 border border-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">{llmTitle}</h3>
              </div>
              <button
                onClick={() => setLlmModalOpen(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-950/50 flex-1">
              {isLlmLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-indigo-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-sm font-medium animate-pulse">Gemini AI is analyzing behavior patterns...</p>
                </div>
              ) : (
                <div className="space-y-1">{formatLLMText(llmContent)}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedClip && (
        <VideoPlayer 
          clip={selectedClip} 
          onClose={() => setSelectedClip(null)}
          onVerify={() => {
            updateClipStatus(selectedClip.id, 'Verified');
            setSelectedClip(null);
          }}
          onFlag={() => {
            updateClipStatus(selectedClip.id, 'Flagged');
            setSelectedClip(null);
          }}
        />
      )}

      {/* Camera Viewer Modal */}
      {selectedCamera && (
        <CameraViewer 
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Admin Panel</h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <AdminPanel />
            </div>
          </div>
        </div>
      )}

      {/* Alerts Dashboard Modal */}
      {showAlerts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Alerts Dashboard</h2>
              <button
                onClick={() => setShowAlerts(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
              <AlertsDashboard 
                sectors={sectors} 
                onClose={() => setShowAlerts(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Messaging Modal */}
      {showMessaging && (
        <UserMessaging 
          isAdmin={isAdmin}
          onClose={() => setShowMessaging(false)}
        />
      )}
      </div>
    </>
  );
}

function StatCard({ title, value, icon: Icon, color, alert }) {
  const colorMap = {
    blue: 'text-blue-500',
    emerald: 'text-emerald-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500'
  };
  const bgMap = {
    blue: 'bg-blue-500/10',
    emerald: 'bg-emerald-500/10',
    red: 'bg-red-500/10',
    yellow: 'bg-yellow-500/10',
    purple: 'bg-purple-500/10'
  };

  return (
    <div
      className={`bg-slate-900 p-5 rounded-2xl border ${
        alert ? 'border-red-900/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-slate-800'
      } relative overflow-hidden`}
    >
      <div className={`absolute top-4 right-4 w-10 h-10 ${bgMap[color]} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${colorMap[color]}`} />
      </div>
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${alert ? 'text-red-400' : 'text-slate-100'}`}>{value}</p>
    </div>
  );
}

function LogEntry({ time, title, desc, type, onAnalyze }) {
  const typeStyles = {
    info: { icon: Clock, color: 'text-blue-400', border: 'border-blue-900/30', bg: 'bg-blue-500/5' },
    success: { icon: CheckCircle, color: 'text-emerald-400', border: 'border-emerald-900/30', bg: 'bg-emerald-500/5' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', border: 'border-yellow-900/30', bg: 'bg-yellow-500/5' },
    danger: { icon: ShieldAlert, color: 'text-red-400', border: 'border-red-900/50', bg: 'bg-red-500/10' }
  };
  const Style = typeStyles[type];
  const Icon = Style.icon;

  return (
    <div className={`mb-3 p-3 rounded-xl border ${Style.border} ${Style.bg} flex items-start group relative`}>
      <Icon className={`w-4 h-4 mt-0.5 mr-3 ${Style.color} shrink-0`} />
      <div className="flex-1 pr-8">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-200 leading-tight">{title}</h4>
          <span className="text-[10px] text-slate-500 ml-2 whitespace-nowrap">{time}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-snug">{desc}</p>
      </div>

      {onAnalyze && (
        <button
          onClick={() => onAnalyze(title, desc)}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-md border border-indigo-500/30"
          title="Analyze with Gemini AI"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

