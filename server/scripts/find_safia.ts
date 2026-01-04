import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data.db');

const db = new Database(dbPath);

console.log("--- Searching for Safia in Logs ---");
try {
    const logs = db.prepare("SELECT * FROM whatsapp_logs WHERE content LIKE ? ORDER BY id DESC").all('%صفية%');
    console.log(JSON.stringify(logs, null, 2));

    console.log("\n--- Searching for Safia in Appointments ---");
    const appts = db.prepare("SELECT * FROM appointments WHERE customer_name LIKE ?").all('%صفية%');
    console.log(JSON.stringify(appts, null, 2));
} catch (e: any) {
    console.error("Error:", e.message);
}

db.close();
