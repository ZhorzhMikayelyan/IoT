const express = require('express')
const { requireAuth } = require('./auth.middleware')
const {
  COOKIE_NAME,
  COOKIE_MAX_AGE_MS,
  registerUser,
  loginUser,
  createSessionCookie,
  getMeFromAuthUid,
} = require('./auth.service')

const router = express.Router()

router.post('/auth/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {}

    const result = await registerUser({ email, password, name })
    const sessionCookie = await createSessionCookie(result.idToken)

    res.cookie(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE_MS,
    })

    res.json({
      success: true,
      item: {
        profile: result.profile,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}

    const result = await loginUser({ email, password })
    const sessionCookie = await createSessionCookie(result.idToken)

    res.cookie(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE_MS,
    })

    res.json({
      success: true,
      item: {
        profile: result.profile,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/auth/logout', async (req, res) => {
  res.clearCookie(COOKIE_NAME)
  res.json({ success: true })
})

router.get('/auth/me', requireAuth, async (req, res, next) => {
  try {
    const profile = await getMeFromAuthUid(req.auth.uid)

    res.json({
      success: true,
      item: {
        auth: {
          uid: req.auth.uid,
          email: req.auth.email || null,
          emailVerified: req.auth.email_verified || false,
        },
        profile,
      },
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router