import { Pool } from 'pg';
import * as path from 'path';
import * as fs from 'fs';

const dataFile = path.resolve(__dirname, '../../.ai/db/data.sql');

if (!fs.existsSync(dataFile)) {
  console.error(`data.sql not found at: ${dataFile}`);
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const sql = fs.readFileSync(dataFile, 'utf-8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Seed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
