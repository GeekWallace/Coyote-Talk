const request = require('supertest');

// Mock firebase-admin to avoid requiring real credentials
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  messaging: jest.fn(() => ({ send: jest.fn() })),
}));

// Set env vars before requiring the app
process.env.API_KEY = 'test-key';
const app = require('../server');

describe('API routes', () => {
  test('POST /api/make-call without auth returns 401', async () => {
    const res = await request(app).post('/api/make-call');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: 'Unauthorized' });
  });

  test('POST /api/voice-inbound parses urlencoded form data', async () => {
    const res = await request(app)
      .post('/api/voice-inbound')
      .type('form')
      .send({
        CallStatus: 'ringing',
        From: '+1234567890',
        To: '+19876543210',
        CallSid: 'CA1234567890abcdef'
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.text).not.toContain('This has to work today.');
  });
});
