import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.USER_DATA_PATH
  ? path.join(process.env.USER_DATA_PATH, 'data.db')
  : path.join(__dirname, '../data.db');

// Ensure database directory exists
if (process.env.USER_DATA_PATH && !fs.existsSync(process.env.USER_DATA_PATH)) {
  fs.mkdirSync(process.env.USER_DATA_PATH, { recursive: true });
}

const db = new Database(dbPath);

// ==========================================
// 1. Schema Creation (Initialize all tables)
// ==========================================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    expiry_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    members_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    phone TEXT NOT NULL,
    platform TEXT,
    source TEXT,
    extracted_from TEXT,
    status TEXT DEFAULT 'new',
    email TEXT,
    job_title TEXT,
    location TEXT,
    interests TEXT,
    age_range TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    content TEXT,
    comments_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS system_info (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS pipelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pipeline_id INTEGER,
      name TEXT NOT NULL,
      color TEXT,
      position INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS whatsapp_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    name TEXT,
    last_message TEXT,
    last_message_time TEXT,
    unread_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER,
    message_id TEXT,
    from_me BOOLEAN,
    content TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'sent',
    FOREIGN KEY (chat_id) REFERENCES whatsapp_chats(id)
  );

  CREATE TABLE IF NOT EXISTS auto_reply_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger TEXT NOT NULL,
    response TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    priority INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'MEDIUM',
    is_read INTEGER DEFAULT 0,
    patient_id INTEGER,
    appointment_id INTEGER,
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    read_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (patient_id) REFERENCES contacts(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
  );

  CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, 
    trigger_id INTEGER,
    phone TEXT,
    content TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trigger_id) REFERENCES auto_reply_templates(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS customer_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    customer_name TEXT,
    appointment_date DATETIME NOT NULL,
    status TEXT DEFAULT 'confirmed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(phone) REFERENCES whatsapp_chats(phone)
  );

  CREATE TABLE IF NOT EXISTS telegram_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_message TEXT,
    unread_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS telegram_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER,
    message_id INTEGER,
    from_me BOOLEAN,
    content TEXT,
    type TEXT DEFAULT 'text',
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES telegram_chats(id)
  );

  CREATE TABLE IF NOT EXISTS customer_tag_map (
    phone TEXT,
    tag_id INTEGER,
    PRIMARY KEY (phone, tag_id),
    FOREIGN KEY (tag_id) REFERENCES customer_tags(id)
  );

  CREATE TABLE IF NOT EXISTS contact_groups (
    contact_id INTEGER,
    group_id INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (contact_id, group_id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    platform TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS campaign_recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER,
    phone TEXT,
    name TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    patient_id INTEGER,
    diagnosis TEXT,
    treatment TEXT,
    fee_amount DECIMAL(10, 2) DEFAULT 0,
    fee_details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(appointment_id) REFERENCES appointments(id),
    FOREIGN KEY(patient_id) REFERENCES contacts(id)
  );

  -- Track installation date
  INSERT OR IGNORE INTO system_info (key, value) VALUES ('install_date', CURRENT_TIMESTAMP);
`);

// ==========================================
// 2. Column Migrations (safeAlter)
// ==========================================
const safeAlter = (query: string) => {
  try {
    db.prepare(query).run();
  } catch (e: any) {
    if (!e.message.includes('duplicate column name')) {
      console.error(`[DB] Migration error for ${query}:`, e.message);
    }
  }
};

// Application Migrations
safeAlter('ALTER TABLE contacts ADD COLUMN email TEXT');
safeAlter('ALTER TABLE contacts ADD COLUMN job_title TEXT');
safeAlter('ALTER TABLE contacts ADD COLUMN location TEXT');
safeAlter('ALTER TABLE contacts ADD COLUMN interests TEXT');
safeAlter('ALTER TABLE contacts ADD COLUMN age_range TEXT');
safeAlter('ALTER TABLE contacts ADD COLUMN profile_url TEXT');
safeAlter('ALTER TABLE contacts ADD COLUMN status TEXT DEFAULT "new"');
safeAlter('ALTER TABLE contacts ADD COLUMN pipeline_id INTEGER');
safeAlter('ALTER TABLE contacts ADD COLUMN stage_id INTEGER');
safeAlter('ALTER TABLE contacts ADD COLUMN deal_value DECIMAL(10, 2)');
safeAlter('ALTER TABLE contacts ADD COLUMN priority TEXT DEFAULT "medium"');
safeAlter('ALTER TABLE contacts ADD COLUMN expected_close_date DATETIME');
safeAlter('ALTER TABLE contacts ADD COLUMN probability INTEGER DEFAULT 0');
safeAlter('ALTER TABLE contacts ADD COLUMN last_visit DATE');
safeAlter('ALTER TABLE contacts ADD COLUMN medical_notes TEXT');
safeAlter('ALTER TABLE contacts ADD COLUMN patient_status TEXT DEFAULT "new"');
safeAlter('ALTER TABLE contacts ADD COLUMN blood_type TEXT');
safeAlter('ALTER TABLE contacts ADD COLUMN allergies TEXT');
safeAlter('ALTER TABLE contacts ADD COLUMN chronic_diseases TEXT');

safeAlter('ALTER TABLE whatsapp_chats ADD COLUMN current_agent TEXT DEFAULT "general"');
safeAlter('ALTER TABLE telegram_chats ADD COLUMN current_agent TEXT DEFAULT "general"');

safeAlter('ALTER TABLE users ADD COLUMN name TEXT');
safeAlter('ALTER TABLE users ADD COLUMN avatar TEXT');

safeAlter('ALTER TABLE appointments ADD COLUMN patient_id INTEGER');
safeAlter('ALTER TABLE appointments ADD COLUMN doctor_id INTEGER');
safeAlter('ALTER TABLE appointments ADD COLUMN duration INTEGER DEFAULT 30');
safeAlter('ALTER TABLE appointments ADD COLUMN appointment_type TEXT DEFAULT "consultation"');
safeAlter('ALTER TABLE appointments ADD COLUMN reminder_sent BOOLEAN DEFAULT 0');
safeAlter('ALTER TABLE appointments ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');

// ==========================================
// 3. Performance Indexes (After all tables exist)
// ==========================================
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
  CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
  CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
  CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
`);


// ==========================================
// 4. Default Seed Data
// ==========================================

// Seed CRM Pipeline
const checkPipeline = db.prepare('SELECT * FROM pipelines WHERE is_default = 1').get();
if (!checkPipeline) {
  const info = db.prepare('INSERT INTO pipelines (name, is_default) VALUES (?, ?)').run('Pipeline المبيعات', 1);
  const pipelineId = info.lastInsertRowid;

  const stages = [
    { name: 'عملاء جدد', color: '#3b82f6', position: 1 },
    { name: 'تحت المعالجة', color: '#eab308', position: 2 },
    { name: 'تم التواصل', color: '#8b5cf6', position: 3 },
    { name: 'عرض سعر', color: '#f97316', position: 4 },
    { name: 'تم البيع', color: '#22c55e', position: 5 },
    { name: 'خسارة', color: '#ef4444', position: 6 }
  ];

  const insertStage = db.prepare('INSERT INTO stages (pipeline_id, name, color, position) VALUES (?, ?, ?, ?)');
  stages.forEach(s => insertStage.run(pipelineId, s.name, s.color, s.position));
  console.log('[DB] seeded default CRM pipeline');
}

// Seed Global Settings
db.exec(`
  INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_enabled', '1');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_system_instruction', 'أنت سكرتير طبي ذكي ومحترف لعيادة الدكتور طه الخطيب. مهمتك تنظيم المواعيد والإجابة على استفسارات المرضى بلطف ومهنية.');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_voice_enabled', '0');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_voice_language', 'ar');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('clinic_name', 'عيادتي');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('clinic_description', 'نظام إدارة العيادات');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('clinic_logo', '/logo.png');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('trial_days', '7');
`);

// Fix: Force update if old marketing instruction exists
db.prepare("UPDATE settings SET value = ? WHERE key = 'ai_system_instruction' AND value LIKE '%شركة الخطيب للتسويق%'")
  .run('أنت سكرتير طبي ذكي ومحترف لعيادة الدكتور طه الخطيب. مهمتك تنظيم المواعيد والإجابة على استفسارات المرضى بلطف ومهنية.');

// Fix: Ensure clinic name logic
db.prepare("UPDATE settings SET value = 'عيادة الدكتور طه الخطيب' WHERE key = 'clinic_name' AND value = 'عيادتي'").run();

// Sync AI API Key from .env if present
let envApiKey = process.env.VITE_GEMINI_API_KEY;

// Fallback: try reading .env directly if process.env is empty (can happen with import order)
if (!envApiKey) {
  try {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/VITE_GEMINI_API_KEY=["']?([^"'\n\s]+)["']?/);
      if (match) {
        envApiKey = match[1];
        console.log('[DB] Found API Key by direct .env file read');
      }
    }
  } catch (e) {
    console.error('[DB] Error reading .env directly:', e);
  }
}

if (envApiKey) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('ai_api_key', ?)").run(envApiKey);
  console.log('[DB] ✅ AI API Key synchronized successfully');
} else {
  console.error('[DB] ❌ AI API Key NOT FOUND in environment or .env file');
}

// Add default auto-reply templates
const defaultTemplates = [
  { trigger: 'السلام عليكم', response: 'وعليكم السلام ورحمة الله وبركاته! كيف يمكنني مساعدتك؟', priority: 1 },
  { trigger: 'مرحبا', response: 'مرحباً بك! كيف يمكنني خدمتك؟', priority: 2 },
  { trigger: 'السعر', response: 'أسعارنا تبدأ من 100 دينار. هل تريد تفاصيل أكثر؟', priority: 3 },
  { trigger: 'شكرا', response: 'العفو! سعداء بخدمتك 😊', priority: 4 }
];

defaultTemplates.forEach(template => {
  const exists = db.prepare('SELECT id FROM auto_reply_templates WHERE trigger = ?').get(template.trigger);
  if (!exists) {
    db.prepare('INSERT INTO auto_reply_templates (trigger, response, priority) VALUES (?, ?, ?)')
      .run(template.trigger, template.response, template.priority);
  }
});

// Seed Initial Admin
const adminEmail = 'admin@alkhatib.com';
const checkAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
const adminName = 'د. طه الخطيب';

if (!checkAdmin) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (email, password, role, name, expiry_date) VALUES (?, ?, ?, ?, ?)')
    .run(adminEmail, hashedPassword, 'admin', adminName, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());
  console.log('[DB] Default admin account created: admin@alkhatib.com / admin123');
} else {
  db.prepare("UPDATE users SET expiry_date = ?, name = COALESCE(name, ?) WHERE email = ?")
    .run(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), adminName, adminEmail);
}

export default db;
