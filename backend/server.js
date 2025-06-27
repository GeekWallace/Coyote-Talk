require('dotenv').config();
const express = require('express');
const Twilio = require('twilio');
const admin = require('firebase-admin');
const cors = require('cors');
const axios = require('axios');
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
const twilioApplicationSid = process.env.TWILIO_APPLICATION_SID;

const client = new Twilio(accountSid, authToken);

const ninoxApiKey         = process.env.NINOX_API_KEY;
const ninoxTeamId         = process.env.NINOX_TEAM_ID;
const ninoxDatabaseId     = process.env.NINOX_DATABASE_ID;
const ninoxAppUsersTableId= process.env.NINOX_APPUSERS_TABLE_ID;

// Base URL for Ninox record operations
const ninoxBaseUrl =
  `https://api.ninox.com/v1/teams/${ninoxTeamId}`
 + `/databases/${ninoxDatabaseId}/query`;

//if (!apiKey) {
//  console.warn("⚠️  Warning: API_KEY is not defined in your .env!");
//}
//
//function authenticate(req, res, next) {
//  // Expect clients to send "Authorization: Bearer <API_KEY>"
//  const auth = req.headers.authorization || "";
//  const [, token] = auth.split(" ");
//  if (token !== apiKey) {
//    return res.status(401).json({ success: false, error: "Unauthorized" });
//  }
//  next();
//}
// -------------------------------
// 1) Find by AppUserId
// -------------------------------
async function findUserByAppUserId(appUserId) {
  try {
	const resp = await axios.post(
	  `${ninoxBaseUrl}`,
	  {

		query: `(select ${ninoxAppUsersTableId} where AppUserId = "${appUserId}").AppUserId`
	  },
	  {
		headers: {
		  Authorization: `Bearer ${ninoxApiKey}`,
		  'Content-Type': 'application/json'
		}
	  }
	);
	return resp.data;  // an array of matching records
  } catch (err) {
	console.error('Error in findUserByAppUserId:', err.response?.data || err.message);
	throw err;
  }
}

// -------------------------------
// 2) Find by Twilio Number
// -------------------------------
async function findUserByTwilioNumber(twilioNumber) {
  try {
	const resp = await axios.post(
	  `${ninoxBaseUrl}`,
	  {
		query: `(select ${ninoxAppUsersTableId} where AssignedTwilioNumber = "${twilioNumber}").AppUserId`
	  },
	  {
		headers: {
		  Authorization: `Bearer ${ninoxApiKey}`,
		  'Content-Type': 'application/json'
		}
	  }
	);
	return resp.data;
  } catch (err) {
	console.error('Error in findUserByTwilioNumber:', err.response?.data || err.message);
	throw err;
  }
}

// -------------------------------
// 3) Update the FCM Token Field
// -------------------------------
async function updateUserFCMToken(appUserId, fcmToken) {
  try {
	// 1) Lookup record
	const users = await findUserByAppUserId(appUserId);
	if (!Array.isArray(users) || users.length === 0) {
	  console.warn(`No AppUsers record found for AppUserId=${appUserId}`);
	  return false;
	}
	const ninoxRecordId = users[0].Id;

	// 2) PATCH to update only the FCM Token field
	const updateUrl = `${ninoxBaseUrl}/records/${ninoxRecordId}`;
	const updateResp = await axios.patch(
	  updateUrl,
	  { fields: { 'FCM Token': fcmToken } },
	  {
		headers: {
		  Authorization: `Bearer ${ninoxApiKey}`,
		  'Content-Type': 'application/json'
		}
	  }
	);
	console.log(`Successfully updated FCM Token for record ${ninoxRecordId}`);
	return true;
  } catch (err) {
	console.error('Error in updateUserFCMToken:', err.response?.data || err.message);
	return false;
  }
}

// Twilio token
app.get('/api/twilio-token', async (req, res) => {
  const { appUserId } = '1';
  if (!appUserId) {
	return res.status(400).json({ success: false, error: 'Missing identity'  });
  }
  try {
	const user = await findUserByAppUserId(appUserId);
	if (!user || !user.length) {
	  return res.status(404).json({ success: false, error: 'User not found' + user });
	}
	const identity = user.TwilioClientIdentity;
	const AccessToken = Twilio.jwt.AccessToken;
	const VoiceGrant = AccessToken.VoiceGrant;
	const token = new AccessToken(
	  process.env.TWILIO_ACCOUNT_SID,
	  process.env.TWILIO_API_KEY_SID,
	  process.env.TWILIO_API_KEY_SECRET,
	  { identity }
	);
	const voiceGrant = new VoiceGrant({
	  outgoingApplicationSid: twilioApplicationSid,
	  incomingAllow: true,
	});
	token.addGrant(voiceGrant);
	res.json({ success: true, token: token.toJwt() });
  } catch (error) {
	console.error('Twilio token error:', error);
	res.status(500).json({ success: false, error: error.message });
  }
});

// Make call
app.post('/api/make-call', async (req, res) => {
  const { appUserId, to, url, statusCallback, record } = req.body;
  if (!appUserId || !to || !url) {
	return res.status(400).json({ success: false, error: 'Missing required parameters' });
  }
  try {
  const user = await findUserByAppUserId(appUserId);
	if (!user || !user.AssignedTwilioNumber) { // Check field names
		return res.status(404).json({ success: false, error: 'User or assigned Twilio number not found in Ninox' });
	  }
	  const fromNumber = user.AssignedTwilioNumber;
	  const call = await client.calls.create({
	  fromNumber,
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

// Voice inbound endpoint
app.post('/api/voice-inbound', async (req, res) => {
  console.log('Incoming call:', req.body);
  const twiml = new VoiceResponse();

  const { CallStatus, From, To, CallSid } = req.body || {};
//  if (!CallSid || !From || !To) {
//	twiml.say('This has to work today.');
//	twiml.hangup();
//	res.set('Content-Type', 'text/xml');
//	return res.send(twiml.toString());
//  }

  if (CallStatus === 'ringing' || CallStatus === 'undefined') {
	//const user = MOCK_USERS.find(u => u.twilioNumbers.some(n => n.phoneNumber === To));
	  const user = await findUserByTwilioNumber(To); // Find by the Twilio number that was dialed
 if (user && user.TwilioClientIdentity) {
	 // const fcmToken = deviceTokens.get(user.id);
	      const appUserClientIdentity = user.TwilioClientIdentity;
          const fcmToken = user.FCMToken; // Check field name
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
	  const dial = twiml.dial().client({},appUserClientIdentity);
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

// Register device token
app.post('/api/register-device', async (req, res) => {
  const { appUserId, fcmToken } = req.body;
  if (!appUserId || !fcmToken) {
	return res.status(400).json({ success: false, error: 'Missing identity or FCM token' });
  }
try {
    const success = await updateUserFCMToken(appUserId, fcmToken);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update FCM token in Ninox' });
    }
  } catch (error) { /* ... */ }
});


// Mock users (replace with a database in production)
const MOCK_USERS = [
  {
	id: 'user1',
	twilioNumbers: [{ phoneNumber: twilioPhoneNumber }],
  },
];


// Call with voicemail
app.post('/api/call-with-voicemail',  async (req, res) => {
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
app.post('/api/send-message',  async (req, res) => {
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
app.get('/api/voicemail-recordings/:callSid', async (req, res) => {
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
app.get('/api/all-voicemail-recordings',  async (req, res) => {
  try {
	const recordings = await client.recordings.list();
	res.json({ success: true, recordings });
  } catch (error) {
	console.error('Get all voicemail recordings error:', error);
	res.status(500).json({ success: false, error: error.message });
  }
});


// Get call logs
app.get('/api/call-logs',  async (req, res) => {
  try {
	const calls = await client.calls.list();
	res.json({ success: true, calls });
  } catch (error) {
	console.error('Get call logs error:', error);
	res.status(500).json({ success: false, error: error.message });
  }
});

// Get message logs
app.get('/api/message-logs',  async (req, res) => {
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
