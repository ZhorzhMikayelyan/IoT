const express = require('express')
const { Errors } = require('ds-express-errors')
const {
  getActivities,
  getActivity,
} = require('./activities.service')

const router = express.Router()

router.get('/activities', async (req, res, next) => {
  try {
    const parsedLimit = Number(req.query.limit || 50)
    const limit = Number.isNaN(parsedLimit) ? 50 : parsedLimit

    const { type, entityId, activityType } = req.query

    const items = await getActivities({
      type: type || undefined,
      entityId: entityId || undefined,
      activityType: activityType || undefined,
      limit,
    })

    res.json({
      success: true,
      items,
      count: items.length,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/activities/:docId', async (req, res, next) => {
  try {
    const item = await getActivity(req.params.docId)

    if (!item) {
      return next(Errors.NotFound('Activity not found'))
    }

    res.json({
      success: true,
      item,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router