import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "dev.db"));
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id),
  booking_number TEXT UNIQUE NOT NULL,
  container_number TEXT,
  carrier TEXT NOT NULL,
  vessel_name TEXT,
  voyage_number TEXT,
  transport_mode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booking_confirmed',
  origin_port TEXT NOT NULL,
  destination_port TEXT NOT NULL,
  current_lat REAL,
  current_lng REAL,
  current_speed_knots REAL,
  heading_degrees REAL,
  route_progress_pct REAL NOT NULL DEFAULT 0,
  eta TEXT,
  cargo_type TEXT,
  cargo_weight_kg REAL,
  is_dangerous_goods INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Append-only: every status/location change is a row, never an overwrite.
CREATE TABLE IF NOT EXISTS shipment_status_history (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL REFERENCES shipments(id),
  status TEXT NOT NULL,
  lat REAL,
  lng REAL,
  note TEXT,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_predictions (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL REFERENCES shipments(id),
  kind TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  confidence REAL,
  source_signal TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  shipment_id TEXT REFERENCES shipments(id),
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_mode ON shipments(transport_mode);
CREATE INDEX IF NOT EXISTS idx_status_history_shipment ON shipment_status_history(shipment_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_shipment ON ai_predictions(shipment_id, created_at);
`);

console.log("Migration complete: dev.db is ready.");
db.close();
