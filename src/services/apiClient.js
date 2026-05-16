/**
 * OmniVision API Client v2
 * Connects the React frontend to the Python FastAPI backend.
 * Falls back to localStorage when backend is offline (edge mode).
 * Updated: 2026-05-16 - Cloud Run deployment
 */

const API_BASE = import.meta.env.VITE_API_URL || "https://omnivision-backend-608881410748.us-central1.run.app";

// ── HTTP Helpers ──
async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    // Network error — backend not reachable
    throw new Error(`Backend unreachable: ${e.message}`);
  }
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, data) => request("POST", path, data),
  delete: (path) => request("DELETE", path),
};

// ── WebSocket Manager ──
class WSManager {
  constructor() {
    this.ws = null;
    this.listeners = new Map(); // eventType -> [callbacks]
    this.reconnectInterval = 3000;
    this.url = null;
    this.sectorId = null;
    this.cameraUrl = null;
    this.connected = false;
  }

  connect(sectorId, cameraUrl = "0", modelPath = "yolov8n.pt") {
    this.sectorId = sectorId;
    this.cameraUrl = cameraUrl;
    this.url = API_BASE.replace(/^http/, "ws") + "/ws/video_feed";

    if (this.ws) this.disconnect();

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.connected = true;
        console.log("[WS] Connected to AI Brain");
        // Send config handshake
        this.ws.send(JSON.stringify({ sectorId, cameraUrl, modelPath }));
        this._emit("status", { connected: true, sectorId });
      };

      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.error) {
            this._emit("error", data);
          } else if (data.status) {
            this._emit("status", data);
          } else {
            this._emit("frame", data); // {boxes, sales, alerts, frame_preview}
          }
        } catch (e) {
          console.error("[WS] Parse error:", e);
        }
      };

      this.ws.onerror = (err) => {
        this.connected = false;
        console.error("[WS] Error:", err);
        this._emit("error", { message: "WebSocket error" });
      };

      this.ws.onclose = () => {
        this.connected = false;
        console.log("[WS] Disconnected");
        this._emit("status", { connected: false });
        // Auto-reconnect
        setTimeout(() => {
          if (this.sectorId) this.connect(this.sectorId, this.cameraUrl);
        }, this.reconnectInterval);
      };
    } catch (e) {
      console.error("[WS] Failed to connect:", e);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
    // Return unsubscribe function
    return () => {
      const arr = this.listeners.get(eventType);
      const idx = arr.indexOf(callback);
      if (idx > -1) arr.splice(idx, 1);
    };
  }

  _emit(eventType, data) {
    const cbs = this.listeners.get(eventType);
    if (cbs) cbs.forEach((cb) => cb(data));
  }
}

export const videoFeedWS = new WSManager();

// ── Health Check ──
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: "GET", mode: "cors" });
    if (res.ok) {
      const data = await res.json();
      return { online: true, ...data };
    }
  } catch (e) {
    // Backend offline
  }
  return { online: false, mode: "localstorage" };
}
