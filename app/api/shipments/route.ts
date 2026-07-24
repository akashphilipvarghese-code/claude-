import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Sign in to see your shipments." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const status = searchParams.get("status");

  // ops/admin can see everything; customers only ever see their own shipments —
  // this is the actual data-isolation fix, not just a UI-level filter.
  const clauses: string[] = [];
  const args: unknown[] = [];
  if (session.role === "customer") {
    clauses.push("customer_id = ?");
    args.push(session.userId);
  }
  if (mode) { clauses.push("transport_mode = ?"); args.push(mode); }
  if (status) { clauses.push("status = ?"); args.push(status); }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const rows = db.prepare(`SELECT * FROM shipments ${where} ORDER BY updated_at DESC`).all(...args) as Record<string, unknown>[];

  const aiStmt = db.prepare("SELECT kind, reasoning, confidence, source_signal as sourceSignal, created_at FROM ai_predictions WHERE shipment_id = ? ORDER BY created_at DESC LIMIT 1");
  const historyStmt = db.prepare("SELECT status, note, recorded_at as recordedAt FROM shipment_status_history WHERE shipment_id = ? ORDER BY recorded_at ASC");

  const shipments = rows.map((r) => ({
    id: r.id, bookingNumber: r.booking_number, containerNumber: r.container_number,
    carrier: r.carrier, vesselName: r.vessel_name, voyageNumber: r.voyage_number,
    transportMode: r.transport_mode, status: r.status,
    originPort: r.origin_port, destinationPort: r.destination_port,
    routeProgressPct: r.route_progress_pct, eta: r.eta,
    cargoType: r.cargo_type, cargoWeightKg: r.cargo_weight_kg,
    isDangerousGoods: !!r.is_dangerous_goods,
    aiPredictions: aiStmt.all(r.id as string),
    statusHistory: historyStmt.all(r.id as string),
  }));

  return NextResponse.json({ shipments });
}
