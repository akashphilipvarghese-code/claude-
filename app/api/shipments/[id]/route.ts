import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Sign in to see this shipment." }, { status: 401 });
  }

  const r = db.prepare("SELECT * FROM shipments WHERE id = ?").get(params.id) as Record<string, unknown> | undefined;

  if (!r) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  if (session.role === "customer" && r.customer_id !== session.userId) {
    // Don't leak "exists but isn't yours" vs "doesn't exist" — same 404 either way.
    return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  }

  const aiPredictions = db.prepare("SELECT kind, reasoning, confidence, source_signal as sourceSignal, created_at FROM ai_predictions WHERE shipment_id = ? ORDER BY created_at DESC").all(params.id);
  const statusHistory = db.prepare("SELECT status, note, recorded_at as recordedAt FROM shipment_status_history WHERE shipment_id = ? ORDER BY recorded_at ASC").all(params.id);

  // Mapped to the same camelCase shape as the list endpoint — kept consistent
  // on purpose, since the frontend adapter (toViewShipment) expects this shape.
  const shipment = {
    id: r.id, bookingNumber: r.booking_number, containerNumber: r.container_number,
    carrier: r.carrier, vesselName: r.vessel_name, voyageNumber: r.voyage_number,
    transportMode: r.transport_mode, status: r.status,
    originPort: r.origin_port, destinationPort: r.destination_port,
    routeProgressPct: r.route_progress_pct, eta: r.eta,
    cargoType: r.cargo_type, cargoWeightKg: r.cargo_weight_kg,
    isDangerousGoods: !!r.is_dangerous_goods,
    aiPredictions, statusHistory,
  };

  return NextResponse.json({ shipment });
}
