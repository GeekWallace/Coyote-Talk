const request = require('supertest');

// Set env vars before requiring the app
process.env.API_KEY = 'test-key';
const app = require('../server');

describe('API routes', () => {
  test('POST /api/make-call without auth returns 401', async () => {
    const res = await request(app).post('/api/make-call');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: 'Unauthorized' });
  });

  test('POST /api/voice-inbound responds with TwiML', async () => {
    const res = await request(app)
      .post('/api/voice-inbound')
      .type('form')
      .send({ CallStatus: 'ringing' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
  });
});
