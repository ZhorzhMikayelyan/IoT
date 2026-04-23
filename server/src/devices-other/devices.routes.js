const express = require('express')
const { Errors } = require('ds-express-errors')
const {
  addDevice,
  getDevices,
  getDevice,
  patchDevice,
  removeDevice,
} = require('./devices.service')

const router = express.Router()

router.post('/devices', async (req, res, next) => {
  try {
    const { deviceId, name, type, boxId, active, status, metadata } = req.body || {}

    if (!deviceId || typeof deviceId !== 'string') {
      return next(Errors.BadRequest('`deviceId` must be a non-empty string'))
    }

    if (!name || typeof name !== 'string') {
      return next(Errors.BadRequest('`name` must be a non-empty string'))
    }

    if (!type || typeof type !== 'string') {
      return next(Errors.BadRequest('`type` must be a non-empty string'))
    }

    const item = await addDevice({
      deviceId,
      name,
      type,
      boxId,
      active,
      status,
      metadata,
    })

    res.json({
      success: true,
      item,
    })
  } catch (err) {
    if (err.message === 'DEVICE_ALREADY_EXISTS') {
      return next(Errors.Conflict('Device already exists'))
    }

    next(err)
  }
})

router.get('/devices', async (req, res, next) => {
  try {
    const parsedLimit = Number(req.query.limit || 50)
    const limit = Number.isNaN(parsedLimit) ? 50 : parsedLimit

    const items = await getDevices(limit)

    res.json({
      success: true,
      items,
      count: items.length,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/devices/:deviceId', async (req, res, next) => {
  try {
    const item = await getDevice(req.params.deviceId)

    if (!item) {
      return next(Errors.NotFound('Device not found'))
    }

    res.json({
      success: true,
      item,
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/devices/:deviceId', async (req, res, next) => {
  try {
    const { deviceId } = req.params
    const { name, type, boxId, active, status, metadata } = req.body || {}

    const patch = {}

    if (name !== undefined) {
      if (typeof name !== 'string') {
        return next(Errors.BadRequest('`name` must be a string'))
      }
      patch.name = name
    }

    if (type !== undefined) {
      if (typeof type !== 'string') {
        return next(Errors.BadRequest('`type` must be a string'))
      }
      patch.type = type
    }

    if (boxId !== undefined) {
      if (boxId !== null && typeof boxId !== 'string') {
        return next(Errors.BadRequest('`boxId` must be a string or null'))
      }
      patch.boxId = boxId
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

    if (metadata !== undefined) {
      if (typeof metadata !== 'object' || Array.isArray(metadata) || metadata === null) {
        return next(Errors.BadRequest('`metadata` must be an object'))
      }
      patch.metadata = metadata
    }

    const item = await patchDevice(deviceId, patch)

    if (!item) {
      return next(Errors.NotFound('Device not found'))
    }

    res.json({
      success: true,
      item,
    })
  } catch (err) {
    next(err)
  }
})

router.delete('/devices/:deviceId', async (req, res, next) => {
  try {
    const { deviceId } = req.params

    const deleted = await removeDevice(deviceId)

    if (!deleted) {
      return next(Errors.NotFound('Device not found'))
    }

    res.json({
      success: true,
      deleted: true,
      id: deviceId,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router