/**
 * Database Seed Script
 * =====================
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed.ts
 * Or add to package.json: "seed": "npx tsx scripts/seed.ts"
 */

import mongoose from "mongoose";

// MongoDB connection string - update if needed
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/haseeb-traders";

// ── Schemas (inline to avoid import issues) ──────────────

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

const summarySchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  summaryNumber: { type: String, required: true, unique: true },
  date: { type: Date },
  taxPeriod: { type: String, required: true },
  status: { type: String, enum: ["Draft", "Converted"], default: "Draft" },
  discount: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
}, { timestamps: true });

const taxChargeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  baseAmount: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const billSchema = new mongoose.Schema({
  summary: { type: mongoose.Schema.Types.ObjectId, ref: "Summary", required: true },
  billNumber: { type: String },
  date: { type: Date },
  description: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxes: [taxChargeSchema],
}, { timestamps: true });

const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);
const Summary = mongoose.models.Summary || mongoose.model("Summary", summarySchema);
const Bill = mongoose.models.Bill || mongoose.model("Bill", billSchema);

// ── Test Data ────────────────────────────────────────────

const testClients = [
  { name: "ABC Construction Ltd" },
  { name: "XYZ Builders" },
  { name: "Prime Contractors" },
  { name: "City Development Corp" },
  { name: "Metro Infrastructure" },
];

const testSummaries = [
  { summaryNumber: "SUM-001", taxPeriod: "Mar 2026", status: "Draft" },
  { summaryNumber: "SUM-002", taxPeriod: "Mar 2026", status: "Converted" },
  { summaryNumber: "SUM-003", taxPeriod: "Feb 2026", status: "Draft" },
  { summaryNumber: "SUM-004", taxPeriod: "Feb 2026", status: "Converted" },
  { summaryNumber: "SUM-005", taxPeriod: "Jan 2026", status: "Draft" },
];

const billTemplates = [
  { description: "Cement (50kg bags)", category: "Building Materials", quantity: 100, unitPrice: 850 },
  { description: "Steel Bars (16mm)", category: "Building Materials", quantity: 50, unitPrice: 2500 },
  { description: "Sand (cubic meters)", category: "Building Materials", quantity: 20, unitPrice: 3000 },
  { description: "Bricks (1000 pcs)", category: "Building Materials", quantity: 5, unitPrice: 12000 },
  { description: "Labour - Mason Work", category: "Labour", quantity: 10, unitPrice: 1500 },
  { description: "Labour - Plumbing", category: "Labour", quantity: 5, unitPrice: 2000 },
  { description: "Paint (Emulsion 20L)", category: "Finishing", quantity: 10, unitPrice: 4500 },
  { description: "Tiles (sqft)", category: "Finishing", quantity: 500, unitPrice: 150 },
  { description: "Electrical Wiring", category: "Electrical", quantity: 1, unitPrice: 25000 },
  { description: "PVC Pipes", category: "Plumbing", quantity: 30, unitPrice: 800 },
];

// ── Seed Function ────────────────────────────────────────

async function seed() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data (optional - comment out to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await Bill.deleteMany({});
    await Summary.deleteMany({});
    await Client.deleteMany({});

    // Create clients
    console.log("👥 Creating clients...");
    const clients = await Client.insertMany(testClients);
    console.log(`   Created ${clients.length} clients`);

    // Create summaries with bills
    console.log("📄 Creating summaries with bills...");
    let totalBills = 0;

    for (let i = 0; i < testSummaries.length; i++) {
      const summaryData = testSummaries[i];
      const client = clients[i % clients.length];

      // Create summary
      const summary = await Summary.create({
        client: client._id,
        summaryNumber: summaryData.summaryNumber,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Each summary 1 day apart
        taxPeriod: summaryData.taxPeriod,
        status: summaryData.status,
      });

      // Create 2-4 bills per summary
      const numBills = 2 + Math.floor(Math.random() * 3);
      const bills = [];

      for (let j = 0; j < numBills; j++) {
        const template = billTemplates[(i * 3 + j) % billTemplates.length];
        const baseAmount = template.quantity * template.unitPrice;

        bills.push({
          summary: summary._id,
          billNumber: `${summaryData.summaryNumber.replace("SUM-", "")}-${j + 1}`,
          date: new Date(Date.now() - (i * 24 + j) * 60 * 60 * 1000),
          description: template.description,
          category: template.category,
          quantity: template.quantity,
          unitPrice: template.unitPrice,
          taxes: [
            {
              name: "GST",
              percentage: 18,
              baseAmount: baseAmount,
              amount: Math.round(baseAmount * 0.18),
            },
          ],
        });
      }

      await Bill.insertMany(bills);
      totalBills += bills.length;
      console.log(`   Summary ${summary.summaryNumber}: ${bills.length} bills (Client: ${client.name})`);
    }

    console.log("\n✅ Seed completed successfully!");
    console.log(`   📊 Clients: ${clients.length}`);
    console.log(`   📄 Summaries: ${testSummaries.length}`);
    console.log(`   🧾 Bills: ${totalBills}`);

  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the seed
seed();
