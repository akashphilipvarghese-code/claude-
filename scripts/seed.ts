import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import path from "path";

const db = new Database(path.join(process.cwd(), "dev.db"));

async function main() {
  const passwordHash = bcrypt.hashSync("demo1234", 10);
  let user = db.prepare("SELECT id FROM users WHERE email = ?").get("demo@tradeix.com") as { id: string } | undefined;

  if (!user) {
    const id = randomUUID();
    db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run(id, "demo@tradeix.com", passwordHash, "customer");
    user = { id };
  }

  const shipments = [
    { bookingNumber: "TRX-88213", carrier: "MSC", vesselName: "MSC Aurora", mode: "ocean", status: "in_transit", origin: "New York", destination: "Mumbai", progress: 62, cargoType: "Industrial Machinery", cargoWeight: 18400, dangerous: 0,
      ai: { kind: "delay", reasoning: "Heavy weather near the Arabian Sea may delay arrival by approximately 8 hours.", confidence: 0.81, source: "weather_api" } },
    { bookingNumber: "TRX-77042", carrier: "Evergreen", vesselName: "Evergreen Star", mode: "ocean", status: "delayed", origin: "Shanghai", destination: "Los Angeles", progress: 34, cargoType: "Consumer Electronics", cargoWeight: 9200, dangerous: 0,
      ai: { kind: "congestion", reasoning: "Los Angeles Port is currently operating at 83% capacity — expected unloading delay of 12 hours.", confidence: 0.74, source: "port_feed" } },
    { bookingNumber: "TRX-91120", carrier: "Cargolux", vesselName: "Cargolux 4471", mode: "air", status: "in_transit", origin: "Rotterdam", destination: "Singapore", progress: 78, cargoType: "Pharmaceuticals", cargoWeight: 2100, dangerous: 1,
      ai: { kind: "route_optimization", reasoning: "Recommended reroute via Colombo could save approximately 3 hours versus current flight path.", confidence: 0.69, source: "flight_tracking_api" } },
    { bookingNumber: "TRX-65590", carrier: "DHL Freight", vesselName: null, mode: "road", status: "customs", origin: "Rotterdam", destination: "Suez Canal", progress: 91, cargoType: "Automotive Parts", cargoWeight: 14200, dangerous: 0, ai: null },
    { bookingNumber: "TRX-50218", carrier: "Nordic Rail", vesselName: "Nordic Rail 12", mode: "rail", status: "delivered", origin: "Shanghai", destination: "Singapore", progress: 100, cargoType: "Textiles", cargoWeight: 7600, dangerous: 0, ai: null },
  ];

  const insertShipment = db.prepare(`
    INSERT OR IGNORE INTO shipments
      (id, customer_id, booking_number, carrier, vessel_name, transport_mode, status, origin_port, destination_port, route_progress_pct, cargo_type, cargo_weight_kg, is_dangerous_goods)
    VALUES (@id, @customerId, @bookingNumber, @carrier, @vesselName, @mode, @status, @origin, @destination, @progress, @cargoType, @cargoWeight, @dangerous)
  `);
  const insertHistory = db.prepare(`INSERT INTO shipment_status_history (id, shipment_id, status, note) VALUES (?, ?, ?, ?)`);
  const insertAI = db.prepare(`INSERT INTO ai_predictions (id, shipment_id, kind, reasoning, confidence, source_signal) VALUES (?, ?, ?, ?, ?, ?)`);

  for (const s of shipments) {
    const existing = db.prepare("SELECT id FROM shipments WHERE booking_number = ?").get(s.bookingNumber) as { id: string } | undefined;
    const id = existing?.id || randomUUID();
    if (!existing) {
      insertShipment.run({ id, customerId: user.id, ...s });
      insertHistory.run(randomUUID(), id, s.status, "seeded initial state");
      if (s.ai) insertAI.run(randomUUID(), id, s.ai.kind, s.ai.reasoning, s.ai.confidence, s.ai.source);
    }
  }

  console.log(`Seeded ${shipments.length} shipments for demo@tradeix.com (password: demo1234)`);
}

main();
db.close();
