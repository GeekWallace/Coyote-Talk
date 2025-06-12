# Coyote Talk

This repository contains a Node.js backend and an Expo React Native mobile application for handling Twilio voice calls and messages.

## Environment Variables

### Twilio
- `TWILIO_ACCOUNT_SID` – Your Twilio Account SID.
- `TWILIO_AUTH_TOKEN` – Twilio Auth Token.
- `TWILIO_API_KEY_SID` – API Key SID used when generating access tokens.
- `TWILIO_API_KEY_SECRET` – API Key secret used when generating access tokens.
- `TWILIO_PHONE_NUMBER` – Twilio phone number that will send and receive calls.
- `BASE_URL` – Publicly reachable URL of the backend (used in Twilio webhooks).
- `API_KEY` – Simple API key expected in the `x-api-key` header.
- `PORT` – Port the backend server listens on (defaults to `3000`).

### Firebase
- `serviceAccountKey.json` – Firebase service account credentials used by the backend. Update the file or point `firebase-admin` to your credentials.

### APNs
APNs credentials are required for push notifications on iOS. Typical variables include:
- `APNS_KEY_ID` – Key ID of your `.p8` push key.
- `APNS_TEAM_ID` – Your Apple Developer team ID.
- `APNS_BUNDLE_ID` – Bundle identifier of the iOS app.
- `APNS_KEY_FILE` – Path to the `.p8` key file.

### Mobile App
The Expo project reads the following variables via `react-native-dotenv`:
- `REACT_NATIVE_BACKEND_URL` – URL of the backend server.
- `REACT_NATIVE_API_KEY` – API key value sent in requests.
- `TWILIO_ACCOUNT_SID` – Twilio Account SID for the mobile client.
- `TWILIO_AUTH_TOKEN` – Twilio Auth Token for the mobile client.

Create a `.env` file inside `src/TwilioMobileApp` defining these values. See the existing `.env` file for an example.

## Installing Dependencies
Run `npm install` for both projects:

```bash
npm install --prefix backend
npm install --prefix src/TwilioMobileApp
```

## Running Tests
### Backend
The backend uses Jest. Run tests with:

```bash
npm test --prefix backend
```

### Mobile
No automated tests are included yet. After adding tests you can run them with `npm test --prefix src/TwilioMobileApp`.

## Starting the Applications
### Backend Server
Start the Node.js server (make sure environment variables are configured):

```bash
npm start --prefix backend
```

### Mobile App
To start the Expo development server run:

```bash
npm start --prefix src/TwilioMobileApp
```

From there you can run `npm run android` or `npm run ios` in the same directory to launch the app on a device or simulator.
