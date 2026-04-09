const {
  upsertUser,
  listUsers,
  getUserByActiveCardUid,
} = require('./users.store.firestore')

const { getUserByAuthUid } = require('./users.store.firestore')

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

module.exports = {
  getUsers,
  seedUsers,
  findUserByUid,
  findActiveUserByUid,
  findUserByAuthUid,
  ensureAuthUserProfile
}