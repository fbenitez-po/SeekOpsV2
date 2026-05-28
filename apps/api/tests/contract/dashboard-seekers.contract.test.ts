import request from 'supertest';
import { Pool } from 'pg';
import app from '../../src/app';
import { apiPath } from '../helpers/api';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Claves exactas del contrato v1 (SeekerSerializer), en inglés.
const SEEKER_KEYS = [
  'email',
  'first_name',
  'last_name',
  'job',
  'cellphone',
  'document_number',
  'team',
  'is_active',
];

const TEST_EMAIL = 'dashboard-seeker-test@seekglobal.co';
const TEST_DOC = '88888888';

let teamName: string | null = null;

beforeAll(async () => {
  const { rows } = await pool.query('SELECT id, name FROM teams LIMIT 1');
  const teamId: string | null = rows[0]?.id ?? null;
  teamName = rows[0]?.name ?? null;

  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  await pool.query(
    `INSERT INTO users
       (email, password_hash, first_name, last_name, document_number, position, mobile_phone, team_id, hire_date, is_active)
     VALUES ($1, '$placeholder$', 'Dash', 'Seeker', $2, 'QA Engineer', '+5215555555', $3, '2024-01-01', true)`,
    [TEST_EMAIL, TEST_DOC, teamId]
  );
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  await pool.end();
});

describe('GET /dashboard/seekers', () => {
  it('returns 200 without a token (open endpoint, like v1)', async () => {
    const res = await request(app).get(apiPath('/dashboard/seekers'));
    expect(res.status).toBe(200);
  });

  it('returns a flat array (not the paginated { data, pagination } shape)', async () => {
    const res = await request(app).get(apiPath('/dashboard/seekers'));
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).not.toHaveProperty('pagination');
  });

  it('each element has exactly the v1 seeker keys (English)', async () => {
    const res = await request(app).get(apiPath('/dashboard/seekers'));
    const seeker = res.body.find((s: { email: string }) => s.email === TEST_EMAIL);
    expect(seeker).toBeDefined();
    expect(Object.keys(seeker).sort()).toEqual([...SEEKER_KEYS].sort());
  });

  it('maps position→job, mobile_phone→cellphone, and team as string (or null)', async () => {
    const res = await request(app).get(apiPath('/dashboard/seekers'));
    const seeker = res.body.find((s: { email: string }) => s.email === TEST_EMAIL);
    expect(seeker.job).toBe('QA Engineer');
    expect(seeker.cellphone).toBe('+5215555555');
    expect(seeker.is_active).toBe(true);
    expect(typeof seeker.team === 'string' || seeker.team === null).toBe(true);
    if (teamName) expect(seeker.team).toBe(teamName);
  });
});
