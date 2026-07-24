-- Tradeix Core Schema (Step 1 of the interface build plan)
-- Lifecycle entities carry append-only history tables, not just a mutable status column.
-- Indexes are tied to real Live Map / dashboard query patterns, not speculative.

CREATE TYPE transport_mode AS ENUM ('ocean', 'air', 'road', 'rail');

CREATE TYPE shipment_status AS ENUM (
  'booking_confirmed', 'container_loaded', 'in_transit', 'at_port',
  'customs', 'delayed', 'exception', 'delivered', 'cancelled'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'ops', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kyc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
  evidence_ref TEXT,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  booking_number TEXT UNIQUE NOT NULL,
  container_number TEXT,
  carrier TEXT NOT NULL,
  vessel_name TEXT,
  voyage_number TEXT,
  transport_mode transport_mode NOT NULL,
  status shipment_status NOT NULL DEFAULT 'booking_confirmed',
  origin_port TEXT NOT NULL,
  destination_port TEXT NOT NULL,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  current_speed_knots DOUBLE PRECISION,
  heading_degrees DOUBLE PRECISION,
  route_progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  eta TIMESTAMPTZ,
  cargo_type TEXT,
  cargo_weight_kg NUMERIC,
  is_dangerous_goods BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only: every status/location change is a row, never an overwrite.
-- This is what powers the Journey Timeline and Historical Playback.
CREATE TABLE shipment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  status shipment_status NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  note TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  kind TEXT NOT NULL CHECK (kind IN ('delay', 'congestion', 'route_optimization', 'risk')),
  reasoning TEXT NOT NULL,          -- mandatory: the "why", never a bare score
  confidence NUMERIC(4,3),
  source_signal TEXT NOT NULL,      -- e.g. 'weather_api', 'port_feed' — for data-scope auditing
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  shipment_id UUID REFERENCES shipments(id),
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes tied to actual Live Map / dashboard queries:
CREATE INDEX idx_shipments_customer ON shipments(customer_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_mode ON shipments(transport_mode);
CREATE INDEX idx_shipments_location ON shipments(current_lat, current_lng); -- map viewport queries
CREATE INDEX idx_status_history_shipment ON shipment_status_history(shipment_id, recorded_at);
CREATE INDEX idx_ai_predictions_shipment ON ai_predictions(shipment_id, created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read_at IS NULL;
