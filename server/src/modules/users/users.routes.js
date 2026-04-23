const express = require('express')
const router = express.Router()
const { Errors } = require('ds-express-errors')

const {
  getUsers,
  seedUsers,
  findUserByUid,
  patchUser,
  patchUserAllowedDeviceIds,
  removeUser,
} = require('./users.service')

router.get('/users', async (req, res, next) => {
  try {
    const parsedLimit = Number(req.query.limit || 50)
    const limit = Number.isNaN(parsedLimit) ? 50 : parsedLimit

    const items = await getUsers(limit)

    res.json({
      success: true,
      items,
      count: items.length,
    })
  } catch (err) {
    next(err)
  }
})

router.post('/users/seed', async (req, res, next) => {
  try {
    const items = await seedUsers()

    res.json({
      success: true,
      seeded: true,
      count: items.length,
      items,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/users/by-uid/:uid', async (req, res, next) => {
  try {
    const item = await findUserByUid(req.params.uid)

    res.json({
      success: true,
      item,
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/users/:uid', async (req, res, next) => {
  try {
    const { uid } = req.params
    const { name, role, active, email, cards } = req.body || {}

    const patch = {}

    if (name !== undefined) {
      if (typeof name !== 'string') {
        return next(Errors.BadRequest('`name` must be a string'))
      }
      patch.name = name
    }

    if (role !== undefined) {
      if (typeof role !== 'string') {
        return next(Errors.BadRequest('`role` must be a string'))
      }
      patch.role = role
    }

    if (active !== undefined) {
      if (typeof active !== 'boolean') {
        return next(Errors.BadRequest('`active` must be boolean'))
      }
      patch.active = active
    }

    if (email !== undefined) {
      if (typeof email !== 'string') {
        return next(Errors.BadRequest('`email` must be a string'))
      }
      patch.email = email
    }

    if (cards !== undefined) {
      if (!Array.isArray(cards)) {
        return next(Errors.BadRequest('`cards` must be an array'))
      }
      patch.cards = cards
    }

    const item = await patchUser(uid, patch)

    if (!item) {
      return next(Errors.NotFound('User not found'))
    }

    res.json({
      success: true,
      item,
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/users/:uid/allowedDeviceIds', async (req, res, next) => {
  try {
    const { uid } = req.params
    const { allowedDeviceIds } = req.body || {}

    if (!Array.isArray(allowedDeviceIds)) {
      return next(Errors.BadRequest('`allowedDeviceIds` must be an array'))
    }

    const item = await patchUserAllowedDeviceIds(uid, allowedDeviceIds)

    if (!item) {
      return next(Errors.NotFound('User not found'))
    }

    res.json({
      success: true,
      item,
    })
  } catch (err) {
    next(err)
  }
})

router.delete('/users/:uid', async (req, res, next) => {
  try {
    const { uid } = req.params

    const deleted = await removeUser(uid)

    if (!deleted) {
      return next(Errors.NotFound('User not found'))
    }

    res.json({
      success: true,
      deleted: true,
      id: uid,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router