
import db from '../database.js';

// Check for appointments for Safia on 2026-01-06
const safiaAppointments = db.prepare(`
    SELECT * FROM appointments 
    WHERE customer_name LIKE '%صفية%' 
    OR notes LIKE '%صفية%'
`).all();

console.log('--- Appointments for Safia ---');
console.log(JSON.stringify(safiaAppointments, null, 2));

// Check specifically for the conflict date/time mentioned: 2026-01-06 15:00
const conflictDate = '2026-01-06T15:00:00.000Z'; // Assuming 3:00 PM is 15:00. Note: Database stores as ISO string usually.
// Let's broaden the search to the date
const dateCheck = db.prepare(`
    SELECT * FROM appointments 
    WHERE appointment_date LIKE '2026-01-06%'
`).all();

console.log('--- All Appointments on 2026-01-06 ---');
console.log(JSON.stringify(dateCheck, null, 2));
