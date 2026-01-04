import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = process.env.USER_DATA_PATH
    ? path.resolve(process.env.USER_DATA_PATH, 'uploads')
    : path.resolve(__dirname, '../../uploads');

console.log(`[Upload] Uploads directory set to: ${uploadsDir}`);

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('[Upload] Created uploads directory');
    } catch (err) {
        console.error('[Upload] Failed to create uploads directory:', err);
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({ storage });
export const UPLOADS_DIR = uploadsDir;
