import request from 'supertest';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import app from '../../src/app';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const TEST_EMAIL = 'test-admin@seekglobal.co';
export const TEST_PASSWORD = 'TestAdmin123!';

export async function setupTestAdmin(): Promise<void> {
  const hash = await bcrypt.hash(TEST_PASSWORD, 10);

  // Get a valid team_id from DB
  const { rows: teams } = await pool.query('SELECT id FROM teams LIMIT 1');
  if (!teams.length) throw new Error('No teams seeded — run prisma db seed first');
  const teamId = teams[0].id;

  await pool.query(`
    INSERT INTO users (email, password_hash, first_name, last_name, document_number, position, team_id, hire_date, is_active, is_staff, is_superuser)
    VALUES ($1, $2, 'Test', 'Admin', '99999999', 'Tester', $3, '2024-01-01', true, true, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $2
  `, [TEST_EMAIL, hash, teamId]);

  // Assign ADMIN profile
  await pool.query(`
    INSERT INTO user_profile (user_id, profile_id)
    SELECT u.id, p.id FROM users u, profiles p
    WHERE u.email = $1 AND p.code = 'ADMIN'
    ON CONFLICT DO NOTHING
  `, [TEST_EMAIL]);
}

export async function cleanupTestAdmin(): Promise<void> {
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  await pool.end();
}

export async function getAdminToken(): Promise<string> {
  const res = await request(app)
    .post('/auth/login')
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  return res.body.access_token as string;
}
