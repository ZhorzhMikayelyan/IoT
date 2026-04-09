# Backend README: Firebase Authentication + Firestore integration

## Overview

This document describes the backend implementation of **registration and authorization via Firebase Authentication** for the IoT project, as well as the related Firestore user profile integration.

The goal of this implementation is to add a **web/backend authentication layer** without breaking the existing **RFID/card-based physical access flow**.

In this architecture:

- **Firebase Authentication** is responsible for web registration and login.
- **Firestore** stores the application user profile.
- **Express backend** verifies authentication and serves protected endpoints.
- **RFID/card UID** remains a separate concept and is still used for the physical access flow.

---

## What was implemented

### Added backend authentication support

The backend was extended to support:

- user registration through Firebase Authentication
- user login through Firebase Authentication
- issuing a server-side session cookie
- logout
- retrieving the current authenticated user through `/auth/me`
- creating or synchronizing a Firestore profile after successful registration/login

### Important architectural decision

Two identifiers are intentionally kept separate:

- `authUid` — Firebase Authentication user UID
- `cards[].uid` — RFID/card UID used for physical device access

This prevents mixing web authentication with hardware access logic.

---

## Current backend responsibilities

The backend now handles:

1. accepting registration/login requests
2. communicating with Firebase Authentication
3. verifying Firebase ID tokens on the server
4. creating session cookies
5. reading/writing user profiles in Firestore
6. returning the current authenticated user

The backend does **not** handle frontend forms or Firebase client-side UI.

---

## Expected project structure

The relevant backend structure should look approximately like this:

```text
server/
  index.js
  package.json
  .env
  secrets/
      firebase-service-account.json
  src/
    integrations/
      firebase/
        firebase.client.js
    modules/
      auth/
        auth.routes.js
        auth.service.js
        auth.middleware.js
        auth.firebase.rest.js
      users/
        users.routes.js
        users.service.js
        users.store.firestore.js
      sessions/
        sessions.route.js
        sessions.service.js
        sessions.store.firestore.js
      logs/
        logs.routes.js
        logs.service.js
        logs.store.firestore.js
```

> Note: in this project the service account JSON is stored under `server/secrets/`, so the `.env` path must point there.

---

## Dependencies

### Existing backend dependencies

From `server/package.json`:

- `express`
- `dotenv`
- `ds-express-errors`
- `firebase-admin`
- `mqtt`
- `uuid`
- `nodemon`

### Additional dependency required for auth cookies

Install:

```bash
npm install cookie-parser
```

This is required because session cookies are used for authenticated requests.

---

## Environment variables

Create or update `server/.env`.

### Recommended example

```env
PORT=3000
NODE_ENV=development

BROKER_URL=
BROKER_USERNAME=
BROKER_PASSWORD=

GOOGLE_APPLICATION_CREDENTIALS=./src/secrets/firebase-service-account.json
FIREBASE_WEB_API_KEY=your_firebase_web_api_key
AUTH_COOKIE_NAME=session
AUTH_COOKIE_MAX_AGE_MS=432000000
```

### Important notes

#### `GOOGLE_APPLICATION_CREDENTIALS`
This must point to the Firebase **service account JSON** file used by Firebase Admin SDK.

In this project, the correct relative path is:

```env
GOOGLE_APPLICATION_CREDENTIALS=./src/secrets/firebase-service-account.json
```

#### `FIREBASE_WEB_API_KEY`
This is the **Web API Key** from Firebase project settings. It is used by backend calls to Firebase Authentication REST endpoints.

#### `AUTH_COOKIE_NAME`
Cookie name used for server-side authenticated sessions.

#### `AUTH_COOKIE_MAX_AGE_MS`
Cookie expiration time in milliseconds.

Example:

- `432000000` = 5 days

---

## Firebase Console setup

Before testing the backend auth flow, the following must be configured in Firebase Console.

### 1. Firebase project
A Firebase project must already exist.

### 2. Firestore
Cloud Firestore must be enabled.

### 3. Firebase Authentication
Open:

- **Authentication**
- **Sign-in method**
- Enable **Email/Password**

### 4. Web API Key
Open:

- **Project settings**
- **Your apps**
- select the web app
- copy `apiKey`

Put this value into:

```env
FIREBASE_WEB_API_KEY=...
```

### 5. Service account key
Download a service account JSON and place it locally at:

```text
server/src/secrets/firebase-service-account.json
```

This file must **not** be committed to git.

---

## Git ignore

Add the service account file or the whole secrets folder to `.gitignore`.

Recommended:

```gitignore
server/src/secrets/
```

---

## Backend implementation details

## 1. Firebase Admin client

### File
`server/src/integrations/firebase/firebase.client.js`

### Responsibilities

- initialize Firebase Admin SDK
- normalize credentials path
- create Firestore client
- create Firebase Auth admin client
- export shared Firebase tools

### Expected exports

- `firebaseApp`
- `db`
- `auth`
- `FieldValue`

---

## 2. Auth REST helper

### File
`server/src/modules/auth/auth.firebase.rest.js`

### Responsibilities

- call Firebase REST endpoint for registration
- call Firebase REST endpoint for login

### Functions

- `signUpWithEmailPassword(email, password)`
- `signInWithEmailPassword(email, password)`

This module uses:

- `FIREBASE_WEB_API_KEY`

---

## 3. Auth service

### File
`server/src/modules/auth/auth.service.js`

### Responsibilities

- register a user through Firebase Auth
- login a user through Firebase Auth
- verify/decode returned token
- create session cookie
- ensure Firestore profile exists

### Typical exported functions

- `registerUser({ email, password, name })`
- `loginUser({ email, password })`
- `createSessionCookie(idToken)`
- `getMeFromAuthUid(authUid)`

---

## 4. Auth middleware

### File
`server/src/modules/auth/auth.middleware.js`

### Responsibilities

- read cookie-based session
- optionally accept `Authorization: Bearer <token>`
- verify the session/token using Firebase Admin SDK
- attach decoded auth info to `req.auth`

### Typical behavior

If authentication is missing or invalid:

- respond with `401`

If valid:

- continue to protected route

---

## 5. Auth routes

### File
`server/src/modules/auth/auth.routes.js`

### Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

---

## 6. Users store/service changes

To support Firebase web auth, the user profile model must support:

- `authUid`
- `email`
- `name`
- `role`
- `active`
- `allowedDeviceIds`
- `cards`

The physical card model remains:

```json
{
  "cards": [
    {
      "uid": "A27A7B38",
      "status": "active"
    }
  ]
}
```

### Additional users store function

`server/src/modules/users/users.store.firestore.js`

Should include a function similar to:

- `getUserByAuthUid(authUid)`

### Additional users service functions

`server/src/modules/users/users.service.js`

Should include:

- `findUserByAuthUid(authUid)`
- `ensureAuthUserProfile({ authUid, email, name })`

---

## Required server changes

## 1. Update `firebase.client.js`
The file must export `auth` in addition to Firestore client.

## 2. Update `index.js`
The main server file must:

- register `cookie-parser`
- register `auth.routes`

Typical additions:

```js
const cookieParser = require('cookie-parser')
const authRoutes = require('./src/modules/auth/auth.routes')

app.use(cookieParser())
app.use(authRoutes)
```

---

## API documentation

## 1. Register

### Endpoint

```http
POST /auth/register
```

### Headers

```http
Content-Type: application/json
```

### JSON body

```json
{
  "email": "testuser@example.com",
  "password": "Test1234!",
  "name": "Test User"
}
```

### Expected result

- creates a user in Firebase Authentication
- creates a profile in Firestore
- sets session cookie
- returns the profile

### Example successful response

```json
{
  "success": true,
  "item": {
    "profile": {
      "id": "firebase_uid",
      "userId": "firebase_uid",
      "authUid": "firebase_uid",
      "email": "testuser@example.com",
      "name": "Test User",
      "role": "user",
      "active": true,
      "allowedDeviceIds": [],
      "cards": []
    }
  }
}
```

---

## 2. Login

### Endpoint

```http
POST /auth/login
```

### Headers

```http
Content-Type: application/json
```

### JSON body

```json
{
  "email": "testuser@example.com",
  "password": "Test1234!"
}
```

### Expected result

- authenticates existing Firebase user
- creates session cookie
- returns linked Firestore profile

---

## 3. Logout

### Endpoint

```http
POST /auth/logout
```

### Expected result

- clears cookie
- returns success

### Example response

```json
{
  "success": true
}
```

---

## 4. Get current user

### Endpoint

```http
GET /auth/me
```

### Authentication

Either:

- valid session cookie
- or valid Bearer token

### Expected result

Returns:

- decoded auth info
- Firestore profile

### Example response

```json
{
  "success": true,
  "item": {
    "auth": {
      "uid": "firebase_uid",
      "email": "testuser@example.com",
      "emailVerified": false
    },
    "profile": {
      "id": "firebase_uid",
      "userId": "firebase_uid",
      "authUid": "firebase_uid",
      "email": "testuser@example.com",
      "name": "Test User",
      "role": "user",
      "active": true,
      "allowedDeviceIds": [],
      "cards": []
    }
  }
}
```

---

## Thunder Client testing guide

## Prerequisites

Before testing:

- server must be running
- `.env` must be configured
- Firebase Auth Email/Password must be enabled
- service account JSON must exist locally

Start server:

```bash
npm start
```

---

## Test sequence

### Step 1. Register

**Method:** `POST`  
**URL:**

```text
http://localhost:3000/auth/register
```

**Headers:**

```text
Content-Type: application/json
```

**Body → JSON:**

```json
{
  "email": "testuser4@example.com",
  "password": "Test1234!",
  "name": "Test User 4"
}
```

**Expected:**

- `success: true`
- Firestore profile created
- response contains `Set-Cookie`

---

### Step 2. Check current user

**Method:** `GET`  
**URL:**

```text
http://localhost:3000/auth/me
```

If Thunder Client does not persist cookie automatically, manually pass:

```text
Cookie: session=<copied_cookie_value>
```

**Expected:**

- current authenticated Firebase user
- linked Firestore profile

---

### Step 3. Logout

**Method:** `POST`  
**URL:**

```text
http://localhost:3000/auth/logout
```

**Expected:**

```json
{
  "success": true
}
```

---

### Step 4. Login

**Method:** `POST`  
**URL:**

```text
http://localhost:3000/auth/login
```

**Headers:**

```text
Content-Type: application/json
```

**Body → JSON:**

```json
{
  "email": "testuser4@example.com",
  "password": "Test1234!"
}
```

**Expected:**

- successful login
- new `Set-Cookie`
- profile returned

---

### Step 5. Check current user again

Repeat:

```http
GET /auth/me
```

using the new cookie.

---

## Negative test cases

### 1. Register same email twice

Expected error:

- `EMAIL_EXISTS`

This means the route is working and Firebase rejected duplicate registration.

### 2. Login with wrong password

Expected error such as:

- `INVALID_PASSWORD`

### 3. Access `/auth/me` without cookie

Expected:

- `401`
- authentication required message

### 4. Missing service account JSON

Expected error similar to:

- credentials file does not exist

This means `GOOGLE_APPLICATION_CREDENTIALS` path is wrong.

---

## Troubleshooting

## Problem: `Cannot GET /auth/register`

Cause:

- request was sent as `GET`

Fix:

- use `POST /auth/register`

---

## Problem: `EMAIL_EXISTS`

Cause:

- the email is already registered in Firebase Authentication

Fix:

- use another email for register
- or use `/auth/login` instead
- or delete the user in Firebase Console if you need a clean test

---

## Problem: service account JSON not found

Cause:

- wrong path in `.env`

Fix for this project:

```env
GOOGLE_APPLICATION_CREDENTIALS=./src/secrets/firebase-service-account.json
```

---

## Problem: `Cannot access 'firebaseApp' before initialization`

Cause:

- `getAuth(firebaseApp)` was called before `firebaseApp` was created

Fix:

- create `firebaseApp` first
- then create `db`
- then create `auth`

Correct order:

```js
const firebaseApp = createFirebaseApp()
const db = getFirestore(firebaseApp)
const auth = getAuth(firebaseApp)
```

---

## Problem: hidden generic backend error

Cause:

- server is not running in development mode

Fix:

```env
NODE_ENV=development
```

This allows `ds-express-errors` to show request details and stack trace.

---

## Security notes

- Never commit `firebase-service-account.json`
- Keep service account JSON only locally
- Add the secrets path to `.gitignore`
- For production, use `secure: true` on cookies behind HTTPS
- Avoid returning sensitive tokens in API responses unless needed for debugging

---

## Suggested `.gitignore` entries

```gitignore
server/src/secrets/
server/.env
```

---

## Suggested next steps

If the backend auth flow is already working, the next improvements could be:

1. add role-based middleware for admin endpoints
2. add user profile update endpoint
3. add admin-only user listing for authenticated admins
4. link web users to cards from an admin workflow
5. move cookie security settings to environment variables
6. optionally add Firebase custom claims for roles

---

## Summary

At this point, the backend supports a complete Firebase Authentication flow for web users:

- registration
- login
- logout
- authenticated session
- current user endpoint
- Firestore profile synchronization

This was implemented without breaking the existing RFID/card-based IoT access logic.

The result is a backend-ready authentication layer that can later be consumed by a frontend without major backend refactoring.
