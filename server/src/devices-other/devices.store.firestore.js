const { db, FieldValue } = require('../integrations/firebase/firebase.client')

function mapDoc(doc) {
  return {
    id: doc.id,
    ...doc.data(),
  }
}

async function createDevice(device) {
  const deviceId = device.deviceId
  const docRef = db.collection('devices').doc(deviceId)
  const existing = await docRef.get()

  if (existing.exists) {
    throw new Error('DEVICE_ALREADY_EXISTS')
  }

  await docRef.set({
    ...device,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return getDeviceById(deviceId)
}

async function getDeviceById(deviceId) {
  const doc = await db.collection('devices').doc(deviceId).get()
  if (!doc.exists) return null

  return mapDoc(doc)
}

async function listDevices(limit = 50) {
  const snapshot = await db.collection('devices').limit(limit).get()
  return snapshot.docs.map(mapDoc)
}

async function updateDeviceById(deviceId, patch) {
  const docRef = db.collection('devices').doc(deviceId)
  const existing = await docRef.get()

  if (!existing.exists) return null

  await docRef.set(
    {
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  const updated = await docRef.get()
  return mapDoc(updated)
}

async function deleteDeviceById(deviceId) {
  const docRef = db.collection('devices').doc(deviceId)
  const existing = await docRef.get()

  if (!existing.exists) return false

  await docRef.delete()
  return true
}

module.exports = {
  createDevice,
  getDeviceById,
  listDevices,
  updateDeviceById,
  deleteDeviceById,
}