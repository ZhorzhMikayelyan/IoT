const { auth } = require('../../integrations/firebase/firebase.client')
const { COOKIE_NAME } = require('./auth.service')

function extractBearerToken(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim()
}

async function requireAuth(req, res, next) {
  try {
    const sessionCookie = req.cookies?.[COOKIE_NAME]
    const bearerToken = extractBearerToken(req)

    if (sessionCookie) {
      req.auth = await auth.verifySessionCookie(sessionCookie, true)
      return next()
    }

    if (bearerToken) {
      req.auth = await auth.verifyIdToken(bearerToken, true)
      return next()
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  requireAuth,
}