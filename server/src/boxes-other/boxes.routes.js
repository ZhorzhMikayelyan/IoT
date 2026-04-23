const express = require('express')
const { Errors } = require('ds-express-errors')
const {
  addBox,
  getBoxes,
  getBox,
  patchBox,
  removeBox,
} = require('./boxes.service')

const router = express.Router()

router.post('/boxes', async (req, res, next) => {
  try {
    const { boxId, name, location, active, status, deviceIds } = req.body || {}

    if (!boxId || typeof boxId !== 'string') {
      return next(Errors.BadRequest('`boxId` must be a non-empty string'))
    }

    if (!name || typeof name !== 'string') {
      return next(Errors.BadRequest('`name` must be a non-empty string'))
    }

    if (deviceIds && !Array.isArray(deviceIds)) {
      return next(Errors.BadRequest('`deviceIds` must be an array'))
    }

    const item = await addBox({
      boxId,
      name,
      location,
      active,
      status,
      deviceIds,
    })

    res.json({
      success: true,
      item,
    })
  } catch (err) {
    if (err.message === 'BOX_ALREADY_EXISTS') {
      return next(Errors.Conflict('Box already exists'))
    }

    next(err)
  }
})

router.get('/boxes', async (req, res, next) => {
  try {
    const parsedLimit = Number(req.query.limit || 50)
    const limit = Number.isNaN(parsedLimit) ? 50 : parsedLimit

    const items = await getBoxes(limit)

    res.json({
      success: true,
      items,
      count: items.length,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/boxes/:boxId', async (req, res, next) => {
  try {
    const item = await getBox(req.params.boxId)

    if (!item) {
      return next(Errors.NotFound('Box not found'))
    }

    res.json({
      success: true,
      item,
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/boxes/:boxId', async (req, res, next) => {
  try {
    const { boxId } = req.params
    const { name, location, active, status, deviceIds } = req.body || {}

    const patch = {}

    if (name !== undefined) {
      if (typeof name !== 'string') {
        return next(Errors.BadRequest('`name` must be a string'))
      }
      patch.name = name
    }

    if (location !== undefined) {
      if (location !== null && typeof location !== 'string') {
        return next(Errors.BadRequest('`location` must be a string or null'))
      }
      patch.location = location
    }

    if (active !== undefined) {
      if (typeof active !== 'boolean') {
        return next(Errors.BadRequest('`active` must be boolean'))
      }
      patch.active = active
    }

    if (status !== undefined) {
      if (typeof status !== 'string') {
        return next(Errors.BadRequest('`status` must be a string'))
      }
      patch.status = status
    }

    if (deviceIds !== undefined) {
      if (!Array.isArray(deviceIds)) {
        return next(Errors.BadRequest('`deviceIds` must be an array'))
      }
      patch.deviceIds = deviceIds
    }

    const item = await patchBox(boxId, patch)

    if (!item) {
      return next(Errors.NotFound('Box not found'))
    }

    res.json({
      success: true,
      item,
    })
  } catch (err) {
    next(err)
  }
})

router.delete('/boxes/:boxId', async (req, res, next) => {
  try {
    const { boxId } = req.params

    const deleted = await removeBox(boxId)

    if (!deleted) {
      return next(Errors.NotFound('Box not found'))
    }

    res.json({
      success: true,
      deleted: true,
      id: boxId,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router