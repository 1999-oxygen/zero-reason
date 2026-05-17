import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AlertTriangle, Shield, Info, AlertCircle, Filter,
  Clock, MapPin, BrainCircuit, ChevronDown, ChevronUp,
  Bell, CheckCircle2, X, Eye, Zap, Activity, Server, Store
} from 'lucide-react';
import { api } from '../services/apiClient';

// Alert generator for demo data
function generateMockAlert(sectorId, index) {
  const now = new Date();
  const timeOffset = Math.floor(Math.random() * 30); // 0-30 minutes ago
  const alertTime = new Date(now.getTime() - timeOffset * 60000);

  const alertsBySector = {
    liquor: [
      { type: 'concealment', title: 'Concealment Detected', desc: 'Wine bottle moved to jacket area', severity: 'alert', icon: 'conceal' },
      { type: 'age_check', title: 'Age Verification Required', desc: 'Customer appears under 25', severity: 'warning', icon: 'age' },
      { type: 'premium_theft', title: 'High-Value Item Alert', desc: 'Premium whiskey ($450) leaving shelf area', severity: 'alert', icon: 'value' },
      { type: 'shoplifting', title: 'Shoplifting Pattern', desc: 'Subject heading to exit without payment', severity: 'alert', icon: 'theft' },
      { type: 'shelf_check', title: 'Shelf Restocking Needed', desc: 'Whiskey section low on inventory', severity: 'info', icon: 'info' }
    ],
    clubs: [
      { type: 'crowd_surge', title: 'Crowd Surge Warning', desc: 'Density increased to 85% - monitor closely', severity: 'warning', icon: 'crowd' },
      { type: 'fight', title: 'Fight Detection', desc: 'Aggressive behavior near bar area', severity: 'alert', icon: 'fight' },
      { type: 'vip_breach', title: 'VIP Area Breach', desc: 'Unauthorized entry attempt detected', severity: 'alert', icon: 'vip' },
      { type: 'intoxication', title: 'Intoxication Alert', desc: 'Subject showing signs of heavy intoxication', severity: 'warning', icon: 'drink' },
      { type: 'normal', title: 'Dance Floor Analysis', desc: 'Crowd density at 78% - normal levels', severity: 'info', icon: 'crowd' }
    ],
    retail: [
      { type: 'concealment', title: 'Item Concealment', desc: 'Nike Air Max hidden in personal bag', severity: 'alert', icon: 'conceal' },
      { type: 'exit_no_scan', title: 'Exit Without Scan', desc: 'Subject moving to exit without POS scan', severity: 'alert', icon: 'theft' },
      { type: 'try_on', title: 'Item Interaction', desc: 'Customer trying on shoes in fitting area', severity: 'info', icon: 'shoe' },
      { type: 'high_traffic', title: 'High Foot Traffic', desc: '342 customers today - above average', severity: 'info', icon: 'crowd' }
    ],
    hospitality: [
      { type: 'unpaid', title: 'Unpaid Exit Prevented', desc: 'Guest_88 attempted exit with $145.50 bill', severity: 'alert', icon: 'bill' },
      { type: 'table_request', title: 'Table Service', desc: 'Table 4 requesting bill - waiter assigned', severity: 'info', icon: 'table' },
      { type: 'dine_dash', title: 'Dine & Dash Alert', desc: 'Guest trajectory heading to exit zone', severity: 'alert', icon: 'run' }
    ],
    security: [
      { type: 'violence', title: 'Violence Detected', desc: 'Multiple skeletons overlapping in lobby', severity: 'alert', icon: 'fight' },
      { type: 'restricted', title: 'Restricted Area', desc: 'Unauthorized access to staff-only zone', severity: 'alert', icon: 'lock' },
      { type: 'movement', title: 'Rapid Movement', desc: 'High-velocity movement in corridor B', severity: 'warning', icon: 'run' }
    ],
    education: [
      { type: 'loitering', title: 'Curfew Violation', desc: 'Movement detected in Dorm Hall B at 02:14 AM', severity: 'alert', icon: 'clock' },
      { type: 'wellness', title: 'Student Welfare Check', desc: 'Student K-42 isolated for 25 minutes', severity: 'warning', icon: 'heart' },
      { type: 'classroom', title: 'Classroom Activity', desc: '450 students present across all rooms', severity: 'info', icon: 'book' }
    ],
    agriculture: [
      { type: 'health', title: 'Animal Health Alert', desc: 'Bovine_492 mobility dropped 85% - lethargic', severity: 'alert', icon: 'heart' },
      { type: 'headcount', title: 'Headcount Verified', desc: '1,240 animals present in Sector 4', severity: 'info', icon: 'crowd' },
      { type: 'predator', title: 'Predator Warning', desc: 'Unknown animal detected near fence line', severity: 'warning', icon: 'alert' }
    ]
  };

  const sectorAlerts = alertsBySector[sectorId] || alertsBySector.retail;
  const alertTemplate = sectorAlerts[index % sectorAlerts.length];

  return {
    id: `alert_${sectorId}_${index}_${Date.now()}`,
    sectorId,
    ...alertTemplate,
    timestamp: alertTime.toISOString(),
    read: false,
    cameraId: `cam_${sectorId}_1`
  };
}

// Generate initial alerts
function generateInitialAlerts() {
  const sectors = ['liquor', 'clubs', 'retail', 'hospitality', 'security', 'education', 'agriculture'];
  const alerts = [];
  let index = 0;

  sectors.forEach(sector => {
    const count = 3 + Math.floor(Math.random() * 5); // 3-7 alerts per sector
    for (let i = 0; i < count; i++) {
      alerts.push(generateMockAlert(sector, index++));
    }
  });

  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

const severityConfig = {
  alert: { color: 'red', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: AlertTriangle },
  warning: { color: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: AlertCircle },
  info: { color: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: Info }
};

const sectorColors = {
  liquor: { name: 'Liquor Stores', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  clubs: { name: 'Clubs & Nightlife', color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  retail: { name: 'Retail & Shoes', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  hospitality: { name: 'Hotels & Dining', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  security: { name: 'Facility Security', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  education: { name: 'Education & Wellness', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  agriculture: { name: 'Livestock & Farms', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
};

function formatTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function AlertsDashboard({ sectors, onClose }) {
  const [alerts, setAlerts] = useState(() => {
    const stored = localStorage.getItem('aiAlerts');
    return stored ? JSON.parse(stored) : generateInitialAlerts();
  });
  const [filterSector, setFilterSector] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterRead, setFilterRead] = useState('all'); // all | unread | read
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [liveMode, setLiveMode] = useState(true);
  const [backendMode, setBackendMode] = useState(false);
  const intervalRef = useRef(null);

  // Check backend availability and fetch real alerts
  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        const health = await api.get('/api/health');
        if (health.online) {
          setBackendMode(true);
          const remoteAlerts = await api.get('/api/alerts?limit=200');
          if (remoteAlerts && remoteAlerts.length > 0) {
            const normalized = remoteAlerts.map(a => ({
              id: `alert_${a.id}`,
              sectorId: a.sector_id,
              type: a.alert_type,
              title: a.title,
              desc: a.description,
              severity: a.severity,
              timestamp: a.created_at,
              read: !!a.read,
              cameraId: a.camera_id
            }));
            setAlerts(normalized);
          }
        }
      } catch (e) {
        setBackendMode(false);
      }
    };
    loadFromBackend();
  }, []);

  // Persist alerts
  useEffect(() => {
    if (!backendMode) {
      localStorage.setItem('aiAlerts', JSON.stringify(alerts));
    }
  }, [alerts, backendMode]);

  // Live alert generation
  useEffect(() => {
    if (!liveMode) return;

    intervalRef.current = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to add new alert
        const randomSector = sectors[Math.floor(Math.random() * sectors.length)]?.id || 'retail';
        const newAlert = generateMockAlert(randomSector, alerts.length);
        setAlerts(prev => [newAlert, ...prev].slice(0, 200)); // Keep max 200
      }
    }, 8000);

    return () => clearInterval(intervalRef.current);
  }, [liveMode, alerts.length, sectors]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filterSector !== 'all' && alert.sectorId !== filterSector) return false;
      if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
      if (filterRead === 'unread' && alert.read) return false;
      if (filterRead === 'read' && !alert.read) return false;
      return true;
    });
  }, [alerts, filterSector, filterSeverity, filterRead]);

  const stats = useMemo(() => {
    const total = alerts.length;
    const unread = alerts.filter(a => !a.read).length;
    const alerts_ = alerts.filter(a => a.severity === 'alert').length;
    const warnings = alerts.filter(a => a.severity === 'warning').length;

    const bySector = {};
    sectors.forEach(s => {
      bySector[s.id] = alerts.filter(a => a.sectorId === s.id).length;
    });

    return { total, unread, alerts: alerts_, warnings, bySector };
  }, [alerts, sectors]);

  const markAsRead = async (alertId) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, read: true } : a
    ));
    if (backendMode) {
      try {
        const numericId = parseInt(alertId.replace('alert_', ''));
        await api.post(`/api/alerts/${numericId}/read`);
      } catch (e) {}
    }
  };

  const markAllAsRead = async () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    if (backendMode) {
      try { await api.post('/api/alerts/read-all'); } catch (e) {}
    }
  };

  const dismissAlert = async (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    if (backendMode) {
      try {
        const numericId = parseInt(alertId.replace('alert_', ''));
        await api.delete(`/api/alerts/${numericId}`);
      } catch (e) {}
    }
  };

  const clearAllAlerts = async () => {
    if (!confirm('Clear all alerts? This cannot be undone.')) return;
    setAlerts([]);
    if (backendMode) {
      // Backend doesn't have bulk delete; individual deletes would be slow
      // Just clear locally for now
    }
  };

  const unreadCount = stats.unread;

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Total Alerts</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-400 font-medium">Critical</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.alerts}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400 font-medium">Warnings</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats.warnings}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400 font-medium">Unread</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{unreadCount}</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Backend Status */}
          {backendMode && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30 text-xs">
              <Server className="w-3.5 h-3.5" />
              Backend
            </div>
          )}

          {/* Sector Filter */}
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-300"
          >
            <option value="all">All Sectors</option>
            {sectors.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-300"
          >
            <option value="all">All Severities</option>
            <option value="alert">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          {/* Read Status */}
          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-300"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>

          <div className="flex-1" />

          {/* Live Mode Toggle */}
          <button
            onClick={() => setLiveMode(!liveMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              liveMode
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${liveMode ? 'animate-pulse' : ''}`} />
            {liveMode ? 'Live' : 'Paused'}
          </button>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark All Read
            </button>
          )}

          {/* Clear All */}
          <button
            onClick={clearAllAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors text-xs"
          >
            <X className="w-3.5 h-3.5" />
            Clear All
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No alerts match your filters</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting filter criteria</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const sev = severityConfig[alert.severity];
            const sector = sectorColors[alert.sectorId];
            const SevIcon = sev.icon;
            const isExpanded = expandedAlert === alert.id;

            return (
              <div
                key={alert.id}
                onClick={() => {
                  markAsRead(alert.id);
                  setExpandedAlert(isExpanded ? null : alert.id);
                }}
                className={`bg-slate-900 rounded-xl border transition-all cursor-pointer ${
                  alert.read ? 'border-slate-800 opacity-70' : `${sev.border} ${sev.bg}`
                } ${isExpanded ? 'ring-1 ring-slate-700' : 'hover:border-slate-700'}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Severity Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${sev.bg} border ${sev.border}`}>
                      <SevIcon className={`w-5 h-5 ${sev.text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold text-sm ${alert.read ? 'text-slate-400' : 'text-white'}`}>
                          {alert.title}
                        </h4>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{alert.desc}</p>

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${sector.bg} ${sector.color} border ${sector.border}`}>
                          {sector.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${sev.bg} ${sev.text} border ${sev.border}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissAlert(alert.id);
                        }}
                        className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4 text-slate-500 hover:text-red-400" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-slate-500 mb-1">Alert Type</p>
                          <p className="text-slate-300 font-medium capitalize">{alert.type.replace(/_/g, ' ')}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-1">Camera</p>
                          <p className="text-slate-300 font-medium">{alert.cameraId}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-1">Timestamp</p>
                          <p className="text-slate-300 font-medium">{new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* AI Analysis Button */}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('AI Analysis:\n\n' +
                              `Detection: ${alert.title}\n` +
                              `Confidence: ${(0.7 + Math.random() * 0.25).toFixed(2)}\n` +
                              `Recommended Action: ${alert.severity === 'alert' ? 'Dispatch security immediately' : 'Monitor and log incident'}\n` +
                              `Pattern Match: ${alert.type === 'concealment' ? 'Known theft pattern #44' : 'No prior pattern detected'}`
                            );
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30 transition-colors text-xs"
                        >
                          <BrainCircuit className="w-3.5 h-3.5" />
                          AI Analysis
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Related alerts:\n- Similar incident 3h ago\n- Same subject detected in sector camera 2\n- Pattern: escalating behavior');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg border border-slate-700 transition-colors text-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Related Events
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sector Activity Summary */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          Activity by Sector
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {sectors.map(sector => {
            const sectorData = sectorColors[sector.id];
            const count = stats.bySector[sector.id] || 0;
            const sectorAlerts = alerts.filter(a => a.sectorId === sector.id);
            const critical = sectorAlerts.filter(a => a.severity === 'alert').length;

            return (
              <button
                key={sector.id}
                onClick={() => setFilterSector(filterSector === sector.id ? 'all' : sector.id)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  filterSector === sector.id
                    ? `${sectorData.bg} ${sectorData.border}`
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Store className={`w-4 h-4 ${sectorData.color}`} />
                  <span className="text-xs text-slate-400 truncate">{sector.name}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white">{count}</span>
                  {critical > 0 && (
                    <span className="text-xs text-red-400 mb-1">{critical} critical</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
