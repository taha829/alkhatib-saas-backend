import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data.db');

const db = new Database(dbPath);

console.log("--- Appointments Table Info ---");
try {
    const info = db.prepare("PRAGMA table_info(appointments)").all();
    console.log(JSON.stringify(info, null, 2));

    console.log("--- Appointments Data ---");
    const data = db.prepare("SELECT * FROM appointments").all();
    console.log(JSON.stringify(data, null, 2));
} catch (e: any) {
    console.error("Error:", e.message);
}

db.close();
