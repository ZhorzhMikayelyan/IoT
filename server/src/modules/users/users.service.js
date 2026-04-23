const { auth } = require('../../integrations/firebase/firebase.client')

const {
  upsertUser,
  listUsers,
  getUserByActiveCardUid,
  getUserByAuthUid,
  getUserById,
  updateUserById,
  updateAllowedDeviceIds,
  deleteUserById,
} = require('./users.store.firestore')

const seedData = [
  {
    userId: 'user123',
    name: 'Harry Potter',
    role: 'admin',
    active: true,
    allowedDeviceIds: ['fan-1'],
    cards: [
    {
      uid: "A27A7B38",
      status: "active"
    },
    {
      uid: "B12C44D9",
      status: "lost"
    }
  ]
  },
]

async function getUsers(limit = 50) {
  return listUsers(limit)
}

async function seedUsers() {
  for (const user of seedData) {
    await upsertUser(user)
  }

  return seedData
}

async function findUserByUid(uid) {
  return getUserByActiveCardUid(uid)
}

async function findActiveUserByUid(uid) {
  const user = await getUserByActiveCardUid(uid)

  if (!user) return null
  if (user.active !== true) return null

  return user
}

async function findUserByAuthUid(authUid) {
  return getUserByAuthUid(authUid)
}

async function ensureAuthUserProfile({ authUid, email, name }) {
  const existing = await getUserByAuthUid(authUid)
  if (existing) return existing

  const profile = {
    userId: authUid,
    authUid,
    email: email || null,
    name: name || null,
    role: 'user',
    active: true,
    allowedDeviceIds: [],
    cards: [],
  }

  await upsertUser(profile)
  return getUserByAuthUid(authUid)
}

async function patchUser(uid, patch) {
  return updateUserById(uid, patch)
}

async function patchUserAllowedDeviceIds(uid, allowedDeviceIds) {
  return updateAllowedDeviceIds(uid, allowedDeviceIds)
}

async function removeUser(uid) {
  const user = await getUserById(uid)
  if (!user) return false

  await deleteUserById(uid)

  try {
    await auth.deleteUser(uid)
  } catch (err) {
    console.error('Failed to delete Firebase Auth user:', err)
  }

  return true
}

module.exports = {
  getUsers,
  seedUsers,
  findUserByUid,
  findActiveUserByUid,
  findUserByAuthUid,
  ensureAuthUserProfile,
  patchUser,
  patchUserAllowedDeviceIds,
  removeUser,
}