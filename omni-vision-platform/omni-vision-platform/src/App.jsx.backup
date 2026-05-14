import React, { useState, useEffect } from 'react';
import { 
  Store, Utensils, ShieldAlert, GraduationCap, Tractor,
  Video, Bell, Search, AlertTriangle, CheckCircle, Clock,
  Activity, Settings, Users, ArrowRight, Map, HeartPulse,
  BrainCircuit, LayoutDashboard, Fingerprint, DoorOpen, Coffee,
  Sparkles, X, Loader2
} from 'lucide-react';

// --- GEMINI API INTEGRATION ---
const apiKey = ""; // Supplied by the execution environment

const callGeminiAPI = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  let retries = 5;
  let delay = 1000;
  
  while (retries > 0) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No insights generated.";
    } catch (error) {
      retries--;
      if (retries === 0) {
        return "Failed to generate AI insights after multiple attempts. Please try again later or check your network connection.";
      }
      await new Promise(r => setTimeout(r, delay));
      delay *= 2; // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    }
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
  const [isSimulating, setIsSimulating] = useState(true);

  // LLM Modal State
  const [llmModalOpen, setLlmModalOpen] = useState(false);
  const [llmTitle, setLlmTitle] = useState("");
  const [llmContent, setLlmContent] = useState("");
  const [isLlmLoading, setIsLlmLoading] = useState(false);

  // Define the different industry modules
  const modules = [
    { id: 'retail', name: 'Retail & Shoes', icon: Store, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'hospitality', name: 'Hotels & Dining', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10' },
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

            <button className="relative p-2 text-slate-400 hover:text-slate-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
            <div className="flex items-center pl-4 border-l border-slate-800">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">Admin</div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">{renderModuleContent()}</div>
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
    </div>
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

