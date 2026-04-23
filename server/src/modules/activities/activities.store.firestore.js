const { db, FieldValue } = require('../../integrations/firebase/firebase.client')

function sanitizePart(value) {
  return String(value)
    .trim()
    .replace(/[\/\\\s]+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

function buildActivityDocId(type, entityId, activityType) {
  return [
    sanitizePart(type),
    sanitizePart(entityId),
    sanitizePart(activityType),
  ].join('_')
}

function mapDoc(doc) {
  return {
    id: doc.id,
    ...doc.data(),
  }
}

async function upsertActivity({ type, entityId, activityType, payload }) {
  const docId = buildActivityDocId(type, entityId, activityType)
  const docRef = db.collection('activities').doc(docId)

  await docRef.set(
    {
      docId,
      type,
      entityId,
      activityType,
      payload,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  return getActivityByDocId(docId)
}

async function getActivityByDocId(docId) {
  const doc = await db.collection('activities').doc(docId).get()
  if (!doc.exists) return null

  return mapDoc(doc)
}

async function listActivities({ type, entityId, activityType, limit = 50 } = {}) {
  let query = db.collection('activities')

  if (type) {
    query = query.where('type', '==', type)
  }

  if (entityId) {
    query = query.where('entityId', '==', entityId)
  }

  if (activityType) {
    query = query.where('activityType', '==', activityType)
  }

  const snapshot = await query
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get()

  return snapshot.docs.map(mapDoc)
}

module.exports = {
  buildActivityDocId,
  upsertActivity,
  getActivityByDocId,
  listActivities,
}