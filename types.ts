// Tradeix Frontend Type Contracts (Step 3 of the interface build plan)
// These mirror schema.sql exactly — no ad hoc frontend-only shapes.

export type TransportMode = "ocean" | "air" | "road" | "rail";

export type ShipmentStatus =
  | "booking_confirmed"
  | "container_loaded"
  | "in_transit"
  | "at_port"
  | "customs"
  | "delayed"
  | "exception"
  | "delivered"
  | "cancelled";

export interface Shipment {
  id: string;
  bookingNumber: string;
  containerNumber: string | null;
  carrier: string;
  vesselName: string | null;
  voyageNumber: string | null;
  transportMode: TransportMode;
  status: ShipmentStatus;
  originPort: string;
  destinationPort: string;
  currentLat: number | null;
  currentLng: number | null;
  currentSpeedKnots: number | null;
  headingDegrees: number | null;
  routeProgressPct: number;
  eta: string | null; // ISO timestamp
  cargoType: string | null;
  cargoWeightKg: number | null;
  isDangerousGoods: boolean;
}

export type MilestoneState = "done" | "current" | "pending";

export interface JourneyMilestone {
  label: string;
  state: MilestoneState;
  recordedAt: string | null;
}

export type AIPredictionKind = "delay" | "congestion" | "route_optimization" | "risk";

// Every AI prediction MUST carry reasoning — never render a bare score.
// This is the type-level enforcement of the AI Systems Designer's explainability principle.
export interface AIPrediction {
  id: string;
  shipmentId: string;
  kind: AIPredictionKind;
  reasoning: string;
  confidence: number | null;
  sourceSignal: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  shipmentId: string | null;
  eventType: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

// Explicit state contract every Live Map panel must implement —
// mirrors the Frontend Engineer skill's "loading/empty/error are part of done" rule.
export type PanelState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "ready"; data: T }
  | { status: "ai_unavailable"; data: T }; // core data still renders, AI layer degrades gracefully
