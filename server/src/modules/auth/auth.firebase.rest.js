const FIREBASE_AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1/accounts'

function getApiKey() {
  if (!process.env.FIREBASE_WEB_API_KEY) {
    throw new Error('FIREBASE_WEB_API_KEY is not set')
  }

  return process.env.FIREBASE_WEB_API_KEY
}

async function callAuthEndpoint(path, payload) {
  const apiKey = getApiKey()

  const response = await fetch(`${FIREBASE_AUTH_BASE}${path}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    const message = data?.error?.message || 'Firebase Auth request failed'
    throw new Error(message)
  }

  return data
}

async function signUpWithEmailPassword(email, password) {
  return callAuthEndpoint(':signUp', {
    email,
    password,
    returnSecureToken: true,
  })
}

async function signInWithEmailPassword(email, password) {
  return callAuthEndpoint(':signInWithPassword', {
    email,
    password,
    returnSecureToken: true,
  })
}

module.exports = {
  signUpWithEmailPassword,
  signInWithEmailPassword,
}