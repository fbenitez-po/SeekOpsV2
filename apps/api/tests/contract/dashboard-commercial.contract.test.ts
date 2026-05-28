import request from 'supertest';
import { Pool } from 'pg';
import app from '../../src/app';
import { apiPath } from '../helpers/api';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Claves exactas del contrato v1 (.values con paths `__`), en inglés.
const COMMERCIAL_KEYS = [
  'date',
  'detail',
  'price',
  'coin',
  'type',
  'document',
  'status',
  'billing',
  'division__name',
  'project__name',
  'project__code',
  'project__client__business_name',
  'project__client__business_number',
  'project__client__business_reason',
  'project__client__sector__name',
  'project__client__segmentation__name',
  'project__category__name',
  'project__manager__first_name',
  'responsible__first_name',
  'responsible__last_name',
  'responsible__document_number',
  'duration',
];

const RUC = '20555555555';
const PROJECT_CODE = 'COMM-TEST-1';
const OWNER_EMAIL = 'comm-owner@seekglobal.co';
const OWNER_DOC = '77777777';

let docTypeName: string;
let createdDocTypeId: string | null = null;

async function cleanup() {
  await pool.query(
    `DELETE FROM commercial_records WHERE project_id IN (SELECT id FROM projects WHERE code = $1)`,
    [PROJECT_CODE]
  );
  await pool.query('DELETE FROM projects WHERE code = $1', [PROJECT_CODE]);
  await pool.query('DELETE FROM clients WHERE ruc = $1', [RUC]);
  await pool.query('DELETE FROM users WHERE email = $1', [OWNER_EMAIL]);
  if (createdDocTypeId) await pool.query('DELETE FROM document_types WHERE id = $1', [createdDocTypeId]);
}

beforeAll(async () => {
  await cleanup();

  const seg = await pool.query('SELECT id FROM client_segmentations LIMIT 1');
  if (!seg.rows.length) throw new Error('No client_segmentations seeded — run prisma db seed first');
  const segmentationId = seg.rows[0].id;
  const sec = await pool.query('SELECT id FROM client_sectors LIMIT 1');
  const sectorId: string | null = sec.rows[0]?.id ?? null;

  // Tipo de documento: reusar uno existente o crear uno propio (y trackearlo).
  const dt = await pool.query('SELECT id, name FROM document_types LIMIT 1');
  if (dt.rows.length) {
    docTypeName = dt.rows[0].name;
  } else {
    docTypeName = 'Contrato Test';
    const ins = await pool.query('INSERT INTO document_types (name) VALUES ($1) RETURNING id', [docTypeName]);
    createdDocTypeId = ins.rows[0].id;
  }
  const docTypeId = createdDocTypeId ?? (await pool.query('SELECT id FROM document_types WHERE name = $1', [docTypeName])).rows[0].id;

  const owner = await pool.query(
    `INSERT INTO users (email, first_name, last_name, document_number, hire_date, is_active)
     VALUES ($1, 'Owner', 'Commercial', $2, '2024-01-01', true) RETURNING id`,
    [OWNER_EMAIL, OWNER_DOC]
  );
  const ownerId = owner.rows[0].id;

  const client = await pool.query(
    `INSERT INTO clients (legal_name, trade_name, ruc, segmentation_id, sector_id)
     VALUES ('Comm Test SAC', 'Comm Test', $1, $2, $3) RETURNING id`,
    [RUC, segmentationId, sectorId]
  );
  const clientId = client.rows[0].id;

  const project = await pool.query(
    `INSERT INTO projects (code, name, client_id, manager_id) VALUES ($1, 'Proyecto Comm Test', $2, $3) RETURNING id`,
    [PROJECT_CODE, clientId, ownerId]
  );
  const projectId = project.rows[0].id;

  await pool.query(
    `INSERT INTO commercial_records (record_date, project_id, owner_id, price, currency, document_type_id, has_contract, is_billed)
     VALUES ('2026-05-01', $1, $2, 25000, 'USD', $3, true, false)`,
    [projectId, ownerId, docTypeId]
  );
});

afterAll(async () => {
  await cleanup();
  await pool.end();
});

describe('GET /dashboard/commercial', () => {
  it('returns 200 without a token (open endpoint, like v1)', async () => {
    const res = await request(app).get(apiPath('/dashboard/commercial'));
    expect(res.status).toBe(200);
  });

  it('returns a flat array (not the paginated { data, pagination } shape)', async () => {
    const res = await request(app).get(apiPath('/dashboard/commercial'));
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).not.toHaveProperty('data');
    expect(res.body).not.toHaveProperty('pagination');
  });

  it('each element has exactly the v1 commercial keys (with __ paths)', async () => {
    const res = await request(app).get(apiPath('/dashboard/commercial'));
    const rec = res.body.find((r: { project__code: string }) => r.project__code === PROJECT_CODE);
    expect(rec).toBeDefined();
    expect(Object.keys(rec).sort()).toEqual([...COMMERCIAL_KEYS].sort());
  });

  it('translates renamed fields and denormalizes client/owner', async () => {
    const res = await request(app).get(apiPath('/dashboard/commercial'));
    const rec = res.body.find((r: { project__code: string }) => r.project__code === PROJECT_CODE);
    expect(rec.date).toBe('2026-05-01');
    expect(rec.coin).toBe('USD');
    expect(rec.status).toBe(true);
    expect(rec.billing).toBe(false);
    expect(rec.document).toBe(docTypeName);
    expect(rec.project__name).toBe('Proyecto Comm Test');
    expect(rec.project__client__business_reason).toBe('Comm Test SAC');
    expect(rec.project__client__business_name).toBe('Comm Test');
    expect(rec.project__client__business_number).toBe(RUC);
    expect(rec.responsible__first_name).toBe('Owner');
    expect(rec.responsible__last_name).toBe('Commercial');
    expect(rec.responsible__document_number).toBe(OWNER_DOC);
    expect(rec.project__manager__first_name).toBe('Owner');
  });

  it('exposes the v2-gap fields as null (type, division__name, duration)', async () => {
    const res = await request(app).get(apiPath('/dashboard/commercial'));
    const rec = res.body.find((r: { project__code: string }) => r.project__code === PROJECT_CODE);
    expect(rec.type).toBeNull();
    expect(rec.division__name).toBeNull();
    expect(rec.duration).toBeNull();
  });
});
