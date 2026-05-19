import request from 'supertest';
import app from '../../src/app';
import { setupTestAdmin, cleanupTestAdmin, TEST_EMAIL, TEST_PASSWORD, getAdminToken } from '../helpers/auth';

beforeAll(async () => { await setupTestAdmin(); });
afterAll(async () => { await cleanupTestAdmin(); });

describe('POST /auth/login', () => {
  it('returns access_token and refresh_token on valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 on missing email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Token middleware', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/clients');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/Token requerido/);
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .get('/clients')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/Token inválido/);
  });
});

describe('POST /auth/refresh-token', () => {
  it('returns new access_token with valid refresh_token', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const res = await request(app)
      .post('/auth/refresh-token')
      .send({ refresh_token: loginRes.body.refresh_token });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
  });
});
