const sessionsService = require('../modules/sessions/sessions.service')
const {
  recordBoxStatus,
  recordBoxSessions,
  recordDeviceStatus,
  recordDeviceFanState,
} = require('../modules/activities/activities.service')

function parseTopic(topic) {
  const parts = topic.split('/')

  if (parts.length !== 4) return null

  const [entityType, entityId, channelType, name] = parts
  return { entityType, entityId, channelType, name }
}

async function handleMqttMessage(topic, messageBuffer) {
  try {
    const msg = JSON.parse(messageBuffer.toString())
    const parsed = parseTopic(topic)

    if (!parsed) return

    const { entityType, entityId, channelType, name } = parsed

    if (entityType === 'device' && channelType === 'state' && name === 'fan') {
      return await handleFanState(entityId, msg)
    }

    if (entityType === 'device' && channelType === 'state' && name === 'status') {
      return await handleDeviceStatus(entityId, msg)
    }

    if (entityType === 'box' && channelType === 'state' && name === 'status') {
      return await handleBoxStatus(entityId, msg)
    }

    if (entityType === 'box' && channelType === 'event' && name === 'auth_request') {
      return await sessionsService.handleAuthRequest({
        ...msg,
        payload: {
          ...msg.payload,
          boxId: msg.payload.boxId || entityId,
        },
      })
    }

    if (entityType === 'box' && channelType === 'event' && name === 'session_started') {
      return await sessionsService.handleSessionStarted(msg)
    }

    if (entityType === 'box' && channelType === 'event' && name === 'session_ended') {
      return await sessionsService.handleSessionEnded(msg)
    }

    if (entityType === 'box' && channelType === 'state' && name === 'sessions') {
      return await handleBoxSessionsState(entityId, msg)
    }
  } catch (err) {
    console.error('MQTT handler error:', err)
  }
}

async function handleFanState(deviceId, msg) {
  const payload = msg.payload || msg

  await recordDeviceFanState(deviceId, payload)
  console.log(`Fan state updated [${deviceId}]:`, payload)
}

async function handleDeviceStatus(deviceId, msg) {
  const payload = msg.payload || msg

  await recordDeviceStatus(deviceId, payload)
  console.log(`Device status updated [${deviceId}]:`, payload)
}

async function handleBoxStatus(boxId, msg) {
  const payload = msg.payload || msg

  await recordBoxStatus(boxId, payload)
  console.log(`Box status updated [${boxId}]:`, payload)
}

async function handleBoxSessionsState(boxId, msg) {
  const payload = msg.payload || msg

  await recordBoxSessions(boxId, payload)
  await sessionsService.handleSessionsState(msg)
}

module.exports = {
  handleMqttMessage,
}