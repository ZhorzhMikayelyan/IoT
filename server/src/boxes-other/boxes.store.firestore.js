const { db, FieldValue } = require('../integrations/firebase/firebase.client')

function mapDoc(doc) {
  return {
    id: doc.id,
    ...doc.data(),
  }
}

async function createBox(box) {
  const boxId = box.boxId
  const docRef = db.collection('boxes').doc(boxId)
  const existing = await docRef.get()

  if (existing.exists) {
    throw new Error('BOX_ALREADY_EXISTS')
  }

  await docRef.set({
    ...box,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return getBoxById(boxId)
}

async function getBoxById(boxId) {
  const doc = await db.collection('boxes').doc(boxId).get()
  if (!doc.exists) return null

  return mapDoc(doc)
}

async function listBoxes(limit = 50) {
  const snapshot = await db.collection('boxes').limit(limit).get()
  return snapshot.docs.map(mapDoc)
}

async function updateBoxById(boxId, patch) {
  const docRef = db.collection('boxes').doc(boxId)
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

async function deleteBoxById(boxId) {
  const docRef = db.collection('boxes').doc(boxId)
  const existing = await docRef.get()

  if (!existing.exists) return false

  await docRef.delete()
  return true
}

module.exports = {
  createBox,
  getBoxById,
  listBoxes,
  updateBoxById,
  deleteBoxById,
}