import request from 'supertest';
import { Pool } from 'pg';
import app from '../../src/app';
import { apiPath } from '../helpers/api';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Claves exactas del contrato v1 (ClientModelSerializer), en inglés.
const CLIENT_KEYS = [
  'id',
  'business_reason',
  'business_name',
  'business_number',
  'fiscal_address',
  'legal_address',
  'segmentation',
  'sector',
];

const TEST_RUC = '20987654321';

let segmentationId: string;
let sectorId: string | null = null;

beforeAll(async () => {
  const seg = await pool.query('SELECT id FROM client_segmentations LIMIT 1');
  if (!seg.rows.length) throw new Error('No client_segmentations seeded — run prisma db seed first');
  segmentationId = seg.rows[0].id;

  const sec = await pool.query('SELECT id FROM client_sectors LIMIT 1');
  sectorId = sec.rows[0]?.id ?? null;

  await pool.query('DELETE FROM clients WHERE ruc = $1', [TEST_RUC]);
  await pool.query(
    `INSERT INTO clients (legal_name, trade_name, ruc, address, segmentation_id, sector_id)
     VALUES ('Dashboard Test SAC', 'Dashboard Test', $1, 'Av. Test 999', $2, $3)`,
    [TEST_RUC, segmentationId, sectorId]
  );
});

afterAll(async () => {
  await pool.query('DELETE FROM clients WHERE ruc = $1', [TEST_RUC]);
  await pool.end();
});

describe('GET /dashboard/clients', () => {
  it('returns 200 without a token (open endpoint, like v1)', async () => {
    const res = await request(app).get(apiPath('/dashboard/clients'));
    expect(res.status).toBe(200);
  });

  it('returns a flat array (not the paginated { data, pagination } shape)', async () => {
    const res = await request(app).get(apiPath('/dashboard/clients'));
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).not.toHaveProperty('pagination');
  });

  it('each element has exactly the v1 client keys (English)', async () => {
    const res = await request(app).get(apiPath('/dashboard/clients'));
    const client = res.body.find((c: { business_number: string }) => c.business_number === TEST_RUC);
    expect(client).toBeDefined();
    expect(Object.keys(client).sort()).toEqual([...CLIENT_KEYS].sort());
  });

  it('maps legal_name→business_reason, trade_name→business_name, ruc→business_number, address→fiscal_address', async () => {
    const res = await request(app).get(apiPath('/dashboard/clients'));
    const client = res.body.find((c: { business_number: string }) => c.business_number === TEST_RUC);
    expect(client.business_reason).toBe('Dashboard Test SAC');
    expect(client.business_name).toBe('Dashboard Test');
    expect(client.business_number).toBe(TEST_RUC);
    expect(client.fiscal_address).toBe('Av. Test 999');
    expect(client.legal_address).toBeNull();
    expect(client.segmentation).toBe(segmentationId);
    expect(client.sector).toBe(sectorId);
  });
});
