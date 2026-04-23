const {
  createDevice,
  getDeviceById,
  listDevices,
  updateDeviceById,
  deleteDeviceById,
} = require('./devices.store.firestore')

async function addDevice(data) {
  return createDevice({
    deviceId: data.deviceId,
    name: data.name,
    type: data.type,
    boxId: data.boxId || null,
    active: data.active ?? true,
    status: data.status || 'idle',
    metadata: data.metadata || {},
  })
}

async function getDevices(limit = 50) {
  return listDevices(limit)
}

async function getDevice(deviceId) {
  return getDeviceById(deviceId)
}

async function patchDevice(deviceId, patch) {
  return updateDeviceById(deviceId, patch)
}

async function removeDevice(deviceId) {
  return deleteDeviceById(deviceId)
}

module.exports = {
  addDevice,
  getDevices,
  getDevice,
  patchDevice,
  removeDevice,
}