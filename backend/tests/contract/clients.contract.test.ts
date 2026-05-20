import request from 'supertest';
import { Pool } from 'pg';
import app from '../../src/app';
import { setupTestAdmin, cleanupTestAdmin, getAdminToken } from '../helpers/auth';
import { apiPath } from '../helpers/api';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let token: string;
let createdClientId: string;

beforeAll(async () => {
  await setupTestAdmin();
  token = await getAdminToken();
  await pool.query("DELETE FROM clients WHERE ruc = '20123456789'");
});
afterAll(async () => {
  if (createdClientId) {
    await pool.query('DELETE FROM clients WHERE id = $1', [createdClientId]);
  }
  await pool.end();
  await cleanupTestAdmin();
});

function auth() {
  return { Authorization: `Bearer ${token}` };
}

describe('GET /clients', () => {
  it('returns paginated list with Spanish keys', async () => {
    const res = await request(app).get(apiPath('/clients')).set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('limit');
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('pages');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(apiPath('/clients'));
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /clients', () => {
  it('creates a client and returns Spanish keys', async () => {
    const configRes = await request(app).get(apiPath('/config/segmentaciones')).set(auth());
    const segmentacionId = configRes.body[0]?.id;
    if (!segmentacionId) {
      console.warn('No segmentaciones seeded — skipping create test');
      return;
    }

    const res = await request(app)
      .post(apiPath('/clients'))
      .set(auth())
      .send({
        razon_social: 'Cliente Test SA',
        ruc: '20123456789',
        segmentacion_id: segmentacionId,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('razon_social');
    expect(res.body).toHaveProperty('ruc');
    createdClientId = res.body.id;
  });

  it('returns 400 on missing razon_social', async () => {
    const res = await request(app).post(apiPath('/clients')).set(auth()).send({ ruc: '20111111111' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /clients/:id', () => {
  it('returns client with Spanish keys including proyectos', async () => {
    if (!createdClientId) {
      return;
    }
    const res = await request(app).get(apiPath(`/clients/${createdClientId}`)).set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('razon_social');
    expect(res.body).toHaveProperty('ruc');
    expect(res.body).toHaveProperty('activo');
    expect(res.body).toHaveProperty('proyectos');
    expect(Array.isArray(res.body.proyectos)).toBe(true);
  });

  it('returns 404 for non-existent client', async () => {
    const res = await request(app)
      .get(apiPath('/clients/00000000-0000-0000-0000-000000000000'))
      .set(auth());

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /clients/:id/toggle-activo', () => {
  it('toggles is_active and returns activo key', async () => {
    if (!createdClientId) {
      return;
    }
    const res = await request(app)
      .patch(apiPath(`/clients/${createdClientId}/toggle-activo`))
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('activo');
    expect(res.body).toHaveProperty('id');
  });
});
