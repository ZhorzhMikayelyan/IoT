const { db, FieldValue } = require('../../integrations/firebase/firebase.client')

async function upsertUser(user) {
  const userId = user.userId
  const docRef = db.collection('users').doc(userId)
  const existing = await docRef.get()

  await docRef.set(
    {
      ...user,
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  return {
    id: userId,
  }
}

async function getUserByActiveCardUid(uid) {
  const snapshot = await db.collection('users').limit(100).get()

  const item = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .find((user) =>
      Array.isArray(user.cards) &&
      user.cards.some((card) => card.uid === uid && card.status === 'active')
    )

  return item || null
}

async function getUserByAuthUid(authUid) {
  const snapshot = await db
    .collection('users')
    .where('authUid', '==', authUid)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data(),
  }
}

async function listUsers(limit = 50) {
  const snapshot = await db.collection('users').limit(limit).get()

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

module.exports = {
  upsertUser,
  listUsers,
  getUserByActiveCardUid,
  getUserByAuthUid
}