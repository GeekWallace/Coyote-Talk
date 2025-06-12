const request = require('supertest');

// Mock firebase-admin to avoid needing real credentials during tests
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  messaging: () => ({
    send: jest.fn(),
  }),
  credential: { cert: jest.fn() },
}));

// Set env vars before requiring the app
process.env.API_KEY = 'test-key';
process.env.TWILIO_PHONE_NUMBER = '+15558675310';
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
      .send({ CallStatus: 'ringing' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
  });

  test('POST /api/voice-inbound with call data returns dial TwiML', async () => {
    const res = await request(app)
      .post('/api/voice-inbound')
      .send({
        CallSid: 'CA1234567890',
        From: '+15005550006',
        To: process.env.TWILIO_PHONE_NUMBER,
        CallStatus: 'ringing',
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.text).toMatch(/<Dial>/);
  });
});
