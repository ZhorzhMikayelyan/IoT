const {
  upsertActivity,
  getActivityByDocId,
  listActivities,
} = require('./activities.store.firestore')

async function recordBoxStatus(boxId, payload) {
  return upsertActivity({
    type: 'box',
    entityId: boxId,
    activityType: 'status',
    payload,
  })
}

async function recordBoxSessions(boxId, payload) {
  return upsertActivity({
    type: 'box',
    entityId: boxId,
    activityType: 'sessions',
    payload,
  })
}

async function recordDeviceStatus(deviceId, payload) {
  return upsertActivity({
    type: 'device',
    entityId: deviceId,
    activityType: 'status',
    payload,
  })
}

async function recordDeviceFanState(deviceId, payload) {
  return upsertActivity({
    type: 'device',
    entityId: deviceId,
    activityType: 'fan',
    payload,
  })
}

async function getActivities(filters = {}) {
  return listActivities(filters)
}

async function getActivity(docId) {
  return getActivityByDocId(docId)
}

module.exports = {
  recordBoxStatus,
  recordBoxSessions,
  recordDeviceStatus,
  recordDeviceFanState,
  getActivities,
  getActivity,
}