const { auth } = require('../../integrations/firebase/firebase.client')
const {
  signUpWithEmailPassword,
  signInWithEmailPassword,
} = require('./auth.firebase.rest')
const {
  ensureAuthUserProfile,
  findUserByAuthUid,
} = require('../users/users.service')

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session'
const COOKIE_MAX_AGE_MS = Number(process.env.AUTH_COOKIE_MAX_AGE_MS || 432000000)

async function registerUser({ email, password, name }) {
  const result = await signUpWithEmailPassword(email, password)
  const decoded = await auth.verifyIdToken(result.idToken)

  const profile = await ensureAuthUserProfile({
    authUid: decoded.uid,
    email: decoded.email || email,
    name,
  })

  return {
    idToken: result.idToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
    profile,
  }
}

async function loginUser({ email, password }) {
  const result = await signInWithEmailPassword(email, password)
  const decoded = await auth.verifyIdToken(result.idToken)

  const profile = await ensureAuthUserProfile({
    authUid: decoded.uid,
    email: decoded.email || email,
    name: null,
  })

  return {
    idToken: result.idToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
    profile,
  }
}

async function createSessionCookie(idToken) {
  return auth.createSessionCookie(idToken, {
    expiresIn: COOKIE_MAX_AGE_MS,
  })
}

async function getMeFromAuthUid(authUid) {
  return findUserByAuthUid(authUid)
}

module.exports = {
  COOKIE_NAME,
  COOKIE_MAX_AGE_MS,
  registerUser,
  loginUser,
  createSessionCookie,
  getMeFromAuthUid,
}