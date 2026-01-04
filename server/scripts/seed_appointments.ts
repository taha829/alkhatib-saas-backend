import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data.db');

const db = new Database(dbPath);

console.log('--- Cleaning and Seeding Clinic Data ---');

try {
    // Enable foreign keys
    db.exec('PRAGMA foreign_keys = ON');

    // 1. Data Prep
    const today = new Date().toISOString().split('T')[0];
    const dayAfter = new Date(new Date().getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

    const patients = [
        { phone: '962782633162', name: 'صفية محمد سليم' },
        { phone: '962791234567', name: 'أحمد محمود العلي' },
        { phone: '962770001122', name: 'ليلى إبراهيم' }
    ];

    // 2. Seeding WhatsApp Chats (Required for Appointments FK)
    console.log('\n--- Seeding WhatsApp Chats ---');
    const insertChat = db.prepare(`
        INSERT OR IGNORE INTO whatsapp_chats (phone, name)
        VALUES (?, ?)
    `);

    for (const p of patients) {
        insertChat.run(p.phone, p.name);
        console.log(`✅ WhatsApp Chat: ${p.name}`);
    }

    // 3. Seeding Contacts
    console.log('\n--- Seeding Contacts ---');
    const insertContact = db.prepare(`
        INSERT OR IGNORE INTO contacts (phone, name, patient_status)
        VALUES (?, ?, 'active')
    `);

    for (const p of patients) {
        try {
            insertContact.run(p.phone, p.name);
            console.log(`✅ Contact: ${p.name}`);
        } catch (e: any) {
            console.log(`ℹ️ Contact Meta: ${p.name} (${e.message})`);
        }
    }

    // 4. Seeding Appointments
    console.log('\n--- Seeding Appointments ---');
    db.prepare('DELETE FROM appointments').run();

    const appointments = [
        {
            phone: '962782633162',
            name: 'صفية محمد سليم',
            date: `${dayAfter} 10:30:00`,
            status: 'confirmed',
            notes: 'متابعة ضغط وسكري - مريض مزمن',
            type: 'consultation'
        },
        {
            phone: '962791234567',
            name: 'أحمد محمود العلي',
            date: `${today} 09:00:00`,
            status: 'scheduled',
            notes: 'فحص دوري - يحتاج أشعة',
            type: 'checkup'
        },
        {
            phone: '962770001122',
            name: 'ليلى إبراهيم',
            date: `${today} 14:15:00`,
            status: 'confirmed',
            notes: 'استشارة أولية',
            type: 'consultation'
        }
    ];

    const insertApt = db.prepare(`
        INSERT INTO appointments (phone, customer_name, appointment_date, status, notes, appointment_type)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const apt of appointments) {
        insertApt.run(apt.phone, apt.name, apt.date, apt.status, apt.notes, apt.type);
        console.log(`✅ Appointment: ${apt.name} - ${apt.date}`);
    }

    console.log('\n--- Database successfully updated! ---');

} catch (error: any) {
    console.error('\n🔴 CRITICAL ERROR:', error.message);
} finally {
    db.close();
}
