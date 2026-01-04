const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL.replace('%40', '@'),
});

async function main() {
    console.log('Testing connection to:', process.env.DATABASE_URL.split('@')[1]);
    try {
        await client.connect();
        console.log('✅ Connected successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('Current Time:', res.rows[0].now);
        await client.end();
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        process.exit(1);
    }
}

main();
