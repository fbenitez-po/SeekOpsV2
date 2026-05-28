import request from 'supertest';
import { Pool } from 'pg';
import app from '../../src/app';
import { apiPath } from '../helpers/api';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Claves exactas del contrato v1 (.values con paths `__`), en inglés.
const PROJECT_KEYS = [
  'code',
  'layer_productivity__name',
  'name',
  'client__business_name',
  'client__business_reason',
  'client__business_number',
  'client__sector__name',
  'client__segmentation__name',
  'start_date',
  'end_date',
  'real_start_date',
  'real_end_date',
  'manager__first_name',
  'manager__last_name',
  'manager__document_number',
  'status',
  'category__name',
  'image',
  'flag_poll',
  'category_extension__name',
  'category__iframe_poll',
  'created_at',
  'evaluation_internal',
  'evaluation_external',
  'tier',
  'comments_date',
];

// Campos sin equivalente en v2 → siempre null (incluye categorías Q2/Q3 diferidas).
const NULL_GAP_KEYS = [
  'status',
  'category__name',
  'image',
  'flag_poll',
  'category_extension__name',
  'category__iframe_poll',
  'evaluation_internal',
  'evaluation_external',
  'tier',
  'comments_date',
];

const RUC = '20444444444';
const PROJECT_CODE = 'PROJ-TEST-1';
const MANAGER_EMAIL = 'proj-manager@seekglobal.co';
const MANAGER_DOC = '66666666';

let layerName: string;
let createdLayerId: string | null = null;

async function cleanup() {
  await pool.query('DELETE FROM projects WHERE code = $1', [PROJECT_CODE]);
  await pool.query('DELETE FROM clients WHERE ruc = $1', [RUC]);
  await pool.query('DELETE FROM users WHERE email = $1', [MANAGER_EMAIL]);
  if (createdLayerId) await pool.query('DELETE FROM productivity_layers WHERE id = $1', [createdLayerId]);
}

beforeAll(async () => {
  await cleanup();

  const seg = await pool.query('SELECT id FROM client_segmentations LIMIT 1');
  if (!seg.rows.length) throw new Error('No client_segmentations seeded — run prisma db seed first');
  const segmentationId = seg.rows[0].id;
  const sec = await pool.query('SELECT id FROM client_sectors LIMIT 1');
  const sectorId: string | null = sec.rows[0]?.id ?? null;

  const pl = await pool.query('SELECT id, name FROM productivity_layers LIMIT 1');
  if (pl.rows.length) {
    layerName = pl.rows[0].name;
  } else {
    layerName = 'Capa Test';
    const ins = await pool.query(
      "INSERT INTO productivity_layers (code, name) VALUES ('LAYER-TEST', $1) RETURNING id",
      [layerName]
    );
    createdLayerId = ins.rows[0].id;
  }
  const layerId = createdLayerId ?? (await pool.query('SELECT id FROM productivity_layers WHERE name = $1', [layerName])).rows[0].id;

  const manager = await pool.query(
    `INSERT INTO users (email, first_name, last_name, document_number, hire_date, is_active)
     VALUES ($1, 'Manager', 'Project', $2, '2024-01-01', true) RETURNING id`,
    [MANAGER_EMAIL, MANAGER_DOC]
  );
  const managerId = manager.rows[0].id;

  const client = await pool.query(
    `INSERT INTO clients (legal_name, trade_name, ruc, segmentation_id, sector_id)
     VALUES ('Proj Test SAC', 'Proj Test', $1, $2, $3) RETURNING id`,
    [RUC, segmentationId, sectorId]
  );
  const clientId = client.rows[0].id;

  // actual_end_date deliberadamente NULL para verificar el formateo de fechas nulas.
  await pool.query(
    `INSERT INTO projects (code, name, client_id, manager_id, productivity_layer_id, start_date, end_date, actual_start_date, actual_end_date)
     VALUES ($1, 'Proyecto Test', $2, $3, $4, '2026-02-01', '2026-06-30', '2026-02-05', NULL)`,
    [PROJECT_CODE, clientId, managerId, layerId]
  );
});

afterAll(async () => {
  await cleanup();
  await pool.end();
});

describe('GET /dashboard/project', () => {
  it('returns 200 without a token (open endpoint, like v1)', async () => {
    const res = await request(app).get(apiPath('/dashboard/project'));
    expect(res.status).toBe(200);
  });

  it('returns a flat array (not the paginated { data, pagination } shape)', async () => {
    const res = await request(app).get(apiPath('/dashboard/project'));
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).not.toHaveProperty('pagination');
  });

  it('each element has exactly the v1 project keys (with __ paths)', async () => {
    const res = await request(app).get(apiPath('/dashboard/project'));
    const proj = res.body.find((p: { code: string }) => p.code === PROJECT_CODE);
    expect(proj).toBeDefined();
    expect(Object.keys(proj).sort()).toEqual([...PROJECT_KEYS].sort());
  });

  it('denormalizes client/manager/layer and renames real dates', async () => {
    const res = await request(app).get(apiPath('/dashboard/project'));
    const proj = res.body.find((p: { code: string }) => p.code === PROJECT_CODE);
    expect(proj.name).toBe('Proyecto Test');
    expect(proj.layer_productivity__name).toBe(layerName);
    expect(proj.client__business_reason).toBe('Proj Test SAC');
    expect(proj.client__business_name).toBe('Proj Test');
    expect(proj.client__business_number).toBe(RUC);
    expect(proj.manager__first_name).toBe('Manager');
    expect(proj.manager__last_name).toBe('Project');
    expect(proj.manager__document_number).toBe(MANAGER_DOC);
    expect(proj.start_date).toBe('2026-02-01');
    expect(proj.end_date).toBe('2026-06-30');
    expect(proj.real_start_date).toBe('2026-02-05');
    expect(proj.real_end_date).toBeNull();
  });

  it('exposes all v2-gap fields as null (incl. deferred category fields)', async () => {
    const res = await request(app).get(apiPath('/dashboard/project'));
    const proj = res.body.find((p: { code: string }) => p.code === PROJECT_CODE);
    for (const key of NULL_GAP_KEYS) {
      expect(proj[key]).toBeNull();
    }
  });
});
