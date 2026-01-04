
import db from '../database.js';

console.log('--- Checking Appointments ---');
const appointments = db.prepare('SELECT * FROM appointments').all();
console.log(JSON.stringify(appointments, null, 2));
console.log('--- End of Appointments ---');
