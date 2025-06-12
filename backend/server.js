require('dotenv').config();
const express = require('express');
const Twilio = require('twilio');
const admin = require('firebase-admin');
const cors = require('cors');
const { VoiceResponse, MessagingResponse } = Twilio.twiml;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
});

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.API_KEY;
const baseUrl = process.env.BASE_URL;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = new Twilio(accountSid, authToken);

// Mock users (replace with a database in production)
const MOCK_USERS = [
  {
    id: 'user1',
    twilioNumbers: [{ phoneNumber: twilioPhoneNumber }],
  },
];

// Store device tokens (replace with a database)
const deviceTokens = new Map();

const authenticate = (req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'];
  if (!apiKeyHeader || apiKeyHeader !== apiKey) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
};

// Register device token
app.post('/api/register-device', authenticate, async (req, res) => {
  const { identity, fcmToken } = req.body;
  if (!identity || !fcmToken) {
    return res.status(400).json({ success: false, error: 'Missing identity or FCM token' });
  }
  deviceTokens.set(identity, fcmToken);
  res.json({ success: true });
});

// Voice inbound endpoint
app.post('/api/voice-inbound', async (req, res) => {
  console.log('Incoming call:', req.body);
  const twiml = new VoiceResponse();

  const { CallStatus, From, To, CallSid } = req.body || {};
  if (!CallSid || !From || !To) {
    twiml.say('This has to work today.');
    twiml.hangup();
    res.set('Content-Type', 'text/xml');
    return res.send(twiml.toString());
  }

  if (CallStatus === 'ringing') {
    const user = MOCK_USERS.find(u => u.twilioNumbers.some(n => n.phoneNumber === To));
    if (user) {
      const fcmToken = deviceTokens.get(user.id);
      if (fcmToken) {
        try {
          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: 'Incoming Call',
              body: `Call from ${From}`,
            },
            data: {
              callSid: CallSid,
              from: From,
              to: To,
              type: 'incoming_call',
            },
          });
        } catch (error) {
          console.error('FCM send error:', error);
        }
      }
      const dial = twiml.dial();
      dial.client({
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallback: `${baseUrl}/api/call-status`,
      }, user.id);
    } else {
      twiml.say('The person you are trying to reach is unavailable. Please leave a message.');
      twiml.record({
        maxLength: 60,
        action: `${baseUrl}/api/voicemail-recorded`,
      });
    }
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
  } else {
    res.status(200).send('OK');
  }
});

// Make call
app.post('/api/make-call', authenticate, async (req, res) => {
  const { from, to, url, statusCallback, record } = req.body;
  if (!from || !to || !url) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }
  try {
    const call = await client.calls.create({
      from,
      to,
      url,
      statusCallback,
      record,
    });
    res.json({ success: true, callSid: call.sid });
  } catch (error) {
    console.error('Make call error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Call with voicemail
app.post('/api/call-with-voicemail', authenticate, async (req, res) => {
  const { from, to, timeout } = req.body;
  if (!from || !to || !timeout) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }
  try {
    const call = await client.calls.create({
      from,
      to,
      url: `${baseUrl}/api/voicemail-handler?timeout=${timeout}`,
      statusCallback: `${baseUrl}/api/call-status`,
    });
    res.json({ success: true, callSid: call.sid });
  } catch (error) {
    console.error('Call with voicemail error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send message
app.post('/api/send-message', authenticate, async (req, res) => {
  const { from, to, body, mediaUrl, statusCallback } = req.body;
  if (!from || !to || !body) {
    return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }
  try {
    const message = await client.messages.create({
      from,
      to,
      body,
      mediaUrl,
      statusCallback,
    });
    res.json({ success: true, messageSid: message.sid });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get voicemail recordings
app.get('/api/voicemail-recordings/:callSid', authenticate, async (req, res) => {
  const { callSid } = req.params;
  try {
    const recordings = await client.recordings.list({ callSid });
    res.json({ success: true, recordings });
  } catch (error) {
    console.error('Get voicemail recordings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all voicemail recordings
app.get('/api/all-voicemail-recordings', authenticate, async (req, res) => {
  try {
    const recordings = await client.recordings.list();
    res.json({ success: true, recordings });
  } catch (error) {
    console.error('Get all voicemail recordings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Get call logs
app.get('/api/call-logs', authenticate, async (req, res) => {
  try {
    const calls = await client.calls.list();
    res.json({ success: true, calls });
  } catch (error) {
    console.error('Get call logs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get message logs
app.get('/api/message-logs', authenticate, async (req, res) => {
  try {
    const messages = await client.messages.list();
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get message logs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SMS inbound
app.post('/api/sms-inbound', (req, res) => {
  const { From, Body } = req.body || {};
  console.log(`Received SMS from ${From}: ${Body}`);
  const twiml = new MessagingResponse();
  twiml.message(`Thanks for your message: ${Body}`);
  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// Voicemail handler
app.post('/api/voicemail-handler', (req, res) => {
  const twiml = new VoiceResponse();
  twiml.say('I’m sorry, the person you are trying to reach is unavailable. Please leave a message after the tone.');
  twiml.record({
    maxLength: 60,
    action: `${baseUrl}/api/voicemail-recorded`,
  });
  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// Voicemail recorded
app.post('/api/voicemail-recorded', (req, res) => {
  console.log('Voicemail recorded:', req.body.RecordingUrl);
  const twiml = new VoiceResponse();
  twiml.say('Thank you for your message. Goodbye.');
  twiml.hangup();
  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// Twilio token
app.post('/api/twilio-token', authenticate, async (req, res) => {
  const { identity } = req.body;
  if (!identity) {
    return res.status(400).json({ success: false, error: 'Missing identity' });
  }
  try {
    const AccessToken = Twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY_SID,
      process.env.TWILIO_API_KEY_SECRET,
      { identity }
    );
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: 'APcc7678ae64519581e926644864495dc6',
      incomingAllow: true,
    });
    token.addGrant(voiceGrant);
    res.json({ success: true, token: token.toJwt() });
  } catch (error) {
    console.error('Twilio token error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Call status
app.post('/api/call-status', (req, res) => {
  console.log('Call status update:', req.body);
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
