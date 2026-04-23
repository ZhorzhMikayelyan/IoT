# README — latest backend changes

## Overview

This update adds and stabilizes four main areas of the backend:

1. **Firebase Authentication backend**
   - register / login / logout / current user
   - session cookie support
   - Firestore profile sync for authenticated users

2. **Admin CRUD for users**
   - patch user by `uid`
   - delete user by `uid`
   - patch `allowedDeviceIds`

3. **Admin CRUD for devices and boxes**
   - create / list / get one
   - patch
   - delete

4. **Activities collection**
   - latest activity snapshots from MQTT state messages
   - separate documents per box/device and activity type
   - read routes for frontend monitoring

---

## What was added

### 1) Firebase Auth backend

Implemented backend support for Firebase Authentication with:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Behavior

- User registers through Firebase Auth
- Backend creates a session cookie
- Backend creates or syncs a Firestore profile in `users`
- `authUid` is used as the main user id in Firestore

### User identity model

For users:

- `uid` in routes = **Firebase Auth UID**
- `authUid` in Firestore = same value
- `userId` in Firestore = same value
- Firestore document id = same value

So user operations work directly with:

```js
db.collection('users').doc(uid)
```

---

## 2) Users module updates

### Existing routes

- `GET /users`
- `POST /users/seed`
- `GET /users/by-uid/:uid`

### New routes

- `PATCH /users/:uid`
- `DELETE /users/:uid`
- `PATCH /users/:uid/allowedDeviceIds`

### Behavior

#### `PATCH /users/:uid`
Updates selected user fields, for example:
- `name`
- `role`
- `active`
- `email`
- `cards`

#### `PATCH /users/:uid/allowedDeviceIds`
Updates access permissions for the user.

#### `DELETE /users/:uid`
Deletes:
- user document from Firestore
- matching Firebase Auth user via `auth.deleteUser(uid)`

### Example: patch user

```http
PATCH /users/<uid>
Content-Type: application/json
```

```json
{
  "name": "Updated User",
  "role": "admin",
  "active": true
}
```

### Example: patch allowed devices

```http
PATCH /users/<uid>/allowedDeviceIds
Content-Type: application/json
```

```json
{
  "allowedDeviceIds": ["fan-1", "fan-2"]
}
```

### Example: delete user

```http
DELETE /users/<uid>
```

---

## 3) Devices module updates

### Existing routes

- `POST /devices`
- `GET /devices`
- `GET /devices/:deviceId`

### New routes

- `PATCH /devices/:deviceId`
- `DELETE /devices/:deviceId`

### Behavior

Devices are patched and deleted by **Firestore document id**.

### Example: create device

```http
POST /devices
Content-Type: application/json
```

```json
{
  "deviceId": "fan-2",
  "name": "Second Fan",
  "type": "fan",
  "boxId": "main-1",
  "active": true,
  "status": "idle",
  "metadata": {
    "model": "ESP32"
  }
}
```

### Example: patch device

```http
PATCH /devices/fan-2
Content-Type: application/json
```

```json
{
  "name": "Second Fan Updated",
  "status": "busy",
  "active": true
}
```

### Example: delete device

```http
DELETE /devices/fan-2
```

---

## 4) Boxes module updates

### Existing routes

- `POST /boxes`
- `GET /boxes`
- `GET /boxes/:boxId`

### New routes

- `PATCH /boxes/:boxId`
- `DELETE /boxes/:boxId`

### Behavior

Boxes are now stored in a separate Firestore collection:

```text
boxes
```

Each box is handled by its own document id:

```text
boxes/<boxId>
```

### Example: create box

```http
POST /boxes
Content-Type: application/json
```

```json
{
  "boxId": "main-1",
  "name": "Main Box",
  "location": "Lab A",
  "active": true,
  "status": "offline",
  "deviceIds": ["fan-1", "fan-2"]
}
```

### Example: patch box

```http
PATCH /boxes/main-1
Content-Type: application/json
```

```json
{
  "name": "Main Box Updated",
  "location": "Lab A",
  "active": true,
  "status": "online",
  "deviceIds": ["fan-1", "fan-2"]
}
```

### Example: delete box

```http
DELETE /boxes/main-1
```

---

## 5) Activities collection

### Why it was added

The box and devices send frequent state updates such as:

- box status
- sessions state
- device status
- fan state

These are **not audit logs** and should not be mixed with `logs`.

Because of that, a separate Firestore collection was added:

```text
activities
```

### Data model

One object + one activity type = one document.

Examples:

```text
activities/box_main-1_status
activities/box_main-1_sessions
activities/device_fan-1_status
activities/device_fan-1_fan
activities/device_fan-2_status
```

### Document structure

```json
{
  "docId": "box_main-1_status",
  "type": "box",
  "entityId": "main-1",
  "activityType": "status",
  "payload": {
    "online": true,
    "wifi": true,
    "mqtt": true,
    "mode": "ONLINE"
  },
  "updatedAt": "server timestamp"
}
```

### Why this structure is important

It allows storing activity data for many boxes and many devices without collisions:

- different `boxId` → different documents
- different `deviceId` → different documents
- same object but different activity type → different documents

### Current activity types

#### For boxes
- `status`
- `sessions`

#### For devices
- `status`
- `fan`

---

## 6) MQTT integration for activities

The MQTT handlers were updated so that incoming state messages are written into `activities`.

### State messages currently recorded

#### Box
- `box/<boxId>/state/status`
- `box/<boxId>/state/sessions`

#### Device
- `device/<deviceId>/state/status`
- `device/<deviceId>/state/fan`

### Result

Every incoming state message updates the latest snapshot document in `activities`.

This means frontend monitoring can always read the latest known state from Firestore.

---

## 7) Activities read routes

Read-only routes were added for frontend monitoring.

### `GET /activities`
Returns a filtered list of activity snapshots.

Supported query params:
- `type`
- `entityId`
- `activityType`
- `limit`

### Examples

#### All activities

```http
GET /activities
```

#### Only box activities

```http
GET /activities?type=box
```

#### Only one device

```http
GET /activities?type=device&entityId=fan-2
```

#### Sessions state of one box

```http
GET /activities?type=box&entityId=main-1&activityType=sessions
```

### `GET /activities/:docId`

Example:

```http
GET /activities/box_main-1_status
```

---

## Files added or updated

### Activities
- `server/src/modules/activities/activities.store.firestore.js`
- `server/src/modules/activities/activities.service.js`
- `server/src/modules/activities/activities.routes.js`

### MQTT
- `server/src/mqtt/handlers.js`

### Users
- `server/src/modules/users/users.store.firestore.js`
- `server/src/modules/users/users.service.js`
- `server/src/modules/users/users.routes.js`

### Devices
- `server/src/modules/devices/.../devices.store.firestore.js`
- `server/src/modules/devices/.../devices.service.js`
- `server/src/modules/devices/.../devices.routes.js`

### Boxes
- `server/src/modules/boxes/.../boxes.store.firestore.js`
- `server/src/modules/boxes/.../boxes.service.js`
- `server/src/modules/boxes/.../boxes.routes.js`

### Auth
- `server/src/modules/auth/auth.routes.js`
- `server/src/modules/auth/auth.service.js`
- `server/src/modules/auth/auth.middleware.js`
- `server/src/integrations/firebase/firebase.client.js`

---

## How to test

### A. Auth

#### Register

```http
POST /auth/register
Content-Type: application/json
```

```json
{
  "email": "testuser@example.com",
  "password": "Test1234!",
  "name": "Test User"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "testuser@example.com",
  "password": "Test1234!"
}
```

#### Current user

```http
GET /auth/me
```

Use session cookie from login/register response.

#### Logout

```http
POST /auth/logout
```

---

### B. Users

1. `GET /users`
2. `PATCH /users/:uid`
3. `PATCH /users/:uid/allowedDeviceIds`
4. `DELETE /users/:uid`

---

### C. Devices

1. `POST /devices`
2. `GET /devices`
3. `GET /devices/:deviceId`
4. `PATCH /devices/:deviceId`
5. `DELETE /devices/:deviceId`

---

### D. Boxes

1. `POST /boxes`
2. `GET /boxes`
3. `GET /boxes/:boxId`
4. `PATCH /boxes/:boxId`
5. `DELETE /boxes/:boxId`

---

### E. Activities

1. Let the box/device send state messages over MQTT
2. Check:
   - `GET /activities`
   - `GET /activities?type=box`
   - `GET /activities?type=device&entityId=fan-1`
   - `GET /activities/box_main-1_status`

---

## Notes for frontend developers

### Users
User routes work with:
- `uid = Firebase Auth UID`
- same value is used as Firestore document id

### Devices
Use `deviceId` in routes.

### Boxes
Use `boxId` in routes.

### Activities
Frontend should treat `activities` as a **latest snapshot store**, not a historical log.

If history is needed later, a separate collection such as `activities_history` should be introduced.

---

## Important implementation decisions

### 1. Logs and activities are separated
- `logs` = important event history
- `activities` = latest monitoring/state snapshots

### 2. Activities do not overwrite each other incorrectly
Because document id is built as:

```text
<type>_<entityId>_<activityType>
```

Examples:
- `box_main-1_status`
- `device_fan-1_status`
- `device_fan-2_fan`

### 3. Boxes are now a separate collection
This was added in advance so admin users can manage boxes from the frontend.

### 4. Deleting a user removes Firebase Auth account too
`DELETE /users/:uid` removes:
- Firestore profile
- Firebase Authentication user

Use with care.

---

## Recommended next steps

1. Add admin authorization to protected CRUD routes
2. Add `PATCH` validation cleanup and shared validators
3. Add pagination or stronger filtering for larger collections
4. Optionally add `activities_history` if historical activity tracking becomes necessary
