"""
OmniVision AI Brain
Wraps YOLO + ByteTrack + Polygon Zones for real-time edge inference.
Inspired by 'the brain' — adapted for multi-sector support.
"""
import cv2
import json
import asyncio
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, asdict
from datetime import datetime

# Optional imports — gracefully degrade if not installed
try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    print("⚠️ ultralytics not installed. AI will run in MOCK mode.")

try:
    import supervision as sv
    SUPERVISION_AVAILABLE = True
except ImportError:
    SUPERVISION_AVAILABLE = False
    print("⚠️ supervision not installed. Tracking disabled.")

import database as db


@dataclass
class DetectionBox:
    class_id: int
    label: str
    confidence: float
    box: List[float]          # [x_min, y_min, x_max, y_max]
    tracker_id: Optional[int] = None
    in_zone: bool = False
    severity: str = "normal"  # normal | warning | alert


@dataclass
class ZoneConfig:
    name: str
    polygon: List[List[int]]  # [[x1,y1], [x2,y2], ...]
    trigger_on_enter: bool = True
    trigger_on_exit: bool = False


class SectorAIBrain:
    """
    Per-sector AI brain with YOLO detection, ByteTrack tracking,
    polygon zones, and sales trigger logic.
    """

    def __init__(self, sector_id: str, model_path: str = "yolov8n.pt",
                 frame_resolution: tuple = (640, 480)):
        self.sector_id = sector_id
        self.resolution = frame_resolution
        self.model_path = model_path
        self.model = None
        self.tracker = None
        self.zones: List[ZoneConfig] = []
        self.zone_objects: List[Optional[sv.PolygonZone]] = []
        self.counted_tracker_ids: set = set()
        self._listeners: List[Callable] = []
        self._mock_mode = not (ULTRALYTICS_AVAILABLE and SUPERVISION_AVAILABLE)

        self._load_config()
        self._init_model()
        self._setup_zones()

    def _load_config(self):
        """Load sector config from database."""
        config = db.get_sector_config(self.sector_id)
        if config:
            self.confidence_threshold = config.get("confidence_threshold", 0.75)
            self.detection_types = config.get("detection_types", [])
            self.special_rules = config.get("special_rules", {})
        else:
            self.confidence_threshold = 0.75
            self.detection_types = []
            self.special_rules = {}

    def _init_model(self):
        """Load YOLO model or fall back to mock."""
        if self._mock_mode:
            print(f"🧠 [{self.sector_id}] Brain initialized in MOCK mode")
            return

        model_file = Path(self.model_path)
        if not model_file.exists():
            # Try downloading yolov8n if not present
            self.model_path = "yolov8n.pt"

        try:
            self.model = YOLO(self.model_path)
            self.tracker = sv.ByteTrack()
            print(f"🧠 [{self.sector_id}] YOLO model loaded: {self.model_path}")
        except Exception as e:
            print(f"❌ [{self.sector_id}] Failed to load model: {e}")
            self._mock_mode = True

    def _setup_zones(self):
        """Create polygon zones based on sector type."""
        w, h = self.resolution

        # Default zones per sector type
        zone_presets = {
            "liquor": [
                ZoneConfig("shelf_exit", [[w // 2, h // 2], [w, h // 2], [w, h], [w // 2, h]]),
            ],
            "retail": [
                ZoneConfig("exit_door", [[w * 0.7, 0], [w, 0], [w, h], [w * 0.7, h]]),
                ZoneConfig("fitting_room", [[0, 0], [w * 0.3, 0], [w * 0.3, h], [0, h]]),
            ],
            "clubs": [
                ZoneConfig("dance_floor", [[w * 0.2, h * 0.3], [w * 0.8, h * 0.3], [w * 0.8, h * 0.9], [w * 0.2, h * 0.9]]),
                ZoneConfig("bar", [[0, 0], [w * 0.4, 0], [w * 0.4, h * 0.4], [0, h * 0.4]]),
            ],
            "security": [
                ZoneConfig("perimeter", [[0, 0], [w, 0], [w, h * 0.1], [0, h * 0.1]]),
            ],
            "hospitality": [
                ZoneConfig("exit", [[w * 0.6, h * 0.3], [w, h * 0.3], [w, h], [w * 0.6, h]]),
            ],
            "education": [
                ZoneConfig("hallway", [[w * 0.3, 0], [w * 0.7, 0], [w * 0.7, h], [w * 0.3, h]]),
            ],
            "agriculture": [
                ZoneConfig("water_trough", [[w * 0.6, h * 0.5], [w, h * 0.5], [w, h], [w * 0.6, h]]),
            ],
        }

        presets = zone_presets.get(self.sector_id, [])
        for zc in presets:
            self.add_zone(zc)

    def add_zone(self, zone_config: ZoneConfig):
        self.zones.append(zone_config)
        if not self._mock_mode and SUPERVISION_AVAILABLE:
            poly = np.array(zone_config.polygon)
            self.zone_objects.append(sv.PolygonZone(
                polygon=poly
            ))
        else:
            self.zone_objects.append(None)

    def subscribe(self, callback: Callable):
        """Register a listener for detection events."""
        self._listeners.append(callback)

    def _notify(self, event_type: str, data: Dict):
        for cb in self._listeners:
            try:
                cb(event_type, self.sector_id, data)
            except Exception as e:
                print(f"Listener error: {e}")

    def process_frame(self, frame: np.ndarray) -> Dict:
        """
        Run full inference pipeline on a single frame.
        Returns: {boxes: [...], sales: [...], alerts: [...]}
        """
        if self._mock_mode:
            return self._mock_process(frame)

        # Resize for inference speed
        frame_resized = cv2.resize(frame, self.resolution)

        # YOLO inference
        results = self.model(frame_resized, verbose=False)[0]
        detections = sv.Detections.from_ultralytics(results)

        # Filter by confidence
        mask = detections.confidence >= self.confidence_threshold
        detections = detections[mask]

        # ByteTrack tracking
        detections = self.tracker.update_with_detections(detections)

        boxes = []
        new_sales = []
        new_alerts = []

        for i, detection in enumerate(detections):
            bbox = detection[0]  # xyxy
            confidence = detection[2]
            class_id = int(detection[3]) if detection[3] is not None else -1
            tracker_id = int(detection[4]) if detection[4] is not None else None

            label = self.model.names.get(class_id, f"class_{class_id}")

            # Check zones
            in_zone = False
            for zi, zone in enumerate(self.zone_objects):
                if zone is not None:
                    zmask = zone.trigger(detections=detections)
                    if len(zmask) > i and zmask[i]:
                        in_zone = True
                        zone_name = self.zones[zi].name
                        break

            # Severity logic per sector
            severity = self._determine_severity(label, in_zone)

            det_box = DetectionBox(
                class_id=class_id,
                label=label,
                confidence=float(confidence),
                box=[float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])],
                tracker_id=tracker_id,
                in_zone=in_zone,
                severity=severity
            )
            boxes.append(asdict(det_box))

            # Sales trigger: item enters zone and hasn't been counted
            if in_zone and tracker_id is not None and tracker_id not in self.counted_tracker_ids:
                self.counted_tracker_ids.add(tracker_id)
                sale = self._record_sale_from_detection(class_id, label)
                if sale:
                    new_sales.append(sale)
                    # Also create an alert for high-value items
                    if sale.get("profit", 0) > 500:
                        new_alerts.append({
                            "type": "high_value_sale",
                            "title": f"High-Value Sale: {sale['brand']}",
                            "description": f"{sale['brand']} sold for KES {sale['revenue']:.0f}",
                            "severity": "info"
                        })

            # Alert: concealment detection
            if "concealment" in label.lower() or (in_zone and label.lower() in ["bag", "jacket"]):
                new_alerts.append({
                    "type": "concealment",
                    "title": "Concealment Detected",
                    "description": f"{label} near exit zone",
                    "severity": "alert"
                })

        # Save to database
        for box in boxes:
            db.save_detection(
                camera_id="cam_1", sector_id=self.sector_id,
                label=box["label"], confidence=box["confidence"],
                bbox=box["box"], severity=box["severity"]
            )

        # Create alerts in DB
        for alert in new_alerts:
            db.create_alert(
                sector_id=self.sector_id,
                alert_type=alert["type"],
                title=alert["title"],
                description=alert["description"],
                severity=alert["severity"],
                camera_id="cam_1"
            )

        # Notify listeners
        if new_sales:
            self._notify("sale", {"sales": new_sales})
        if new_alerts:
            self._notify("alert", {"alerts": new_alerts})

        return {"boxes": boxes, "sales": new_sales, "alerts": new_alerts}

    def _determine_severity(self, label: str, in_zone: bool) -> str:
        """Sector-specific severity rules."""
        label_lower = label.lower()
        rules = self.special_rules

        if self.sector_id == "security":
            if any(w in label_lower for w in ["weapon", "knife", "gun"]):
                return "alert"
            if any(w in label_lower for w in ["violence", "fight"]):
                return "alert"
        elif self.sector_id == "liquor":
            if "concealment" in label_lower:
                return "alert"
            if in_zone and any(w in label_lower for w in ["bottle", "wine"]):
                return "warning"
        elif self.sector_id == "clubs":
            if any(w in label_lower for w in ["fight", "aggressive"]):
                return "alert"
            if any(w in label_lower for w in ["crowd", "density"]):
                return "warning"
        elif self.sector_id == "retail":
            if "concealment" in label_lower:
                return "alert"
            if in_zone:
                return "warning"
        elif self.sector_id == "hospitality":
            if "unpaid" in label_lower:
                return "alert"

        return "normal"

    def _record_sale_from_detection(self, class_id: int, label: str) -> Optional[Dict]:
        """Look up product by class_id and record a sale."""
        products = db.get_products()
        for p in products:
            if p.get("class_id") == class_id:
                sale_id = db.record_sale(
                    product_id=p["id"],
                    brand_name=p["brand_name"],
                    revenue=p["selling_price"],
                    profit=p["selling_price"] - p["buying_price"],
                    camera_id="cam_1",
                    detected=True
                )
                return {
                    "sale_id": sale_id,
                    "brand": p["brand_name"],
                    "revenue": p["selling_price"],
                    "profit": p["selling_price"] - p["buying_price"],
                    "class_id": class_id
                }
        return None

    def _mock_process(self, frame: np.ndarray) -> Dict:
        """Fallback when YOLO/supervision not available."""
        h, w = frame.shape[:2]
        boxes = []
        # Simulate a few random detections
        for _ in range(3):
            cx, cy = np.random.randint(w // 4, 3 * w // 4), np.random.randint(h // 4, 3 * h // 4)
            bw, bh = np.random.randint(50, 150), np.random.randint(80, 200)
            boxes.append({
                "class_id": np.random.randint(0, 80),
                "label": np.random.choice(["person", "bottle", "bag", "shoes"]),
                "confidence": round(0.7 + np.random.random() * 0.25, 2),
                "box": [float(cx - bw / 2), float(cy - bh / 2), float(cx + bw / 2), float(cy + bh / 2)],
                "tracker_id": None,
                "in_zone": np.random.random() > 0.7,
                "severity": np.random.choice(["normal", "normal", "warning", "alert"])
            })
        return {"boxes": boxes, "sales": [], "alerts": []}

    def reset_counts(self):
        """Reset daily tracker counts (call at midnight)."""
        self.counted_tracker_ids.clear()


class BrainManager:
    """Manages multiple sector brains."""

    def __init__(self):
        self.brains: Dict[str, SectorAIBrain] = {}

    def get_or_create(self, sector_id: str, model_path: str = "yolov8n.pt") -> SectorAIBrain:
        if sector_id not in self.brains:
            self.brains[sector_id] = SectorAIBrain(sector_id, model_path)
        return self.brains[sector_id]

    def remove(self, sector_id: str):
        if sector_id in self.brains:
            del self.brains[sector_id]

    def list(self) -> List[str]:
        return list(self.brains.keys())
