const {
  createBox,
  getBoxById,
  listBoxes,
  updateBoxById,
  deleteBoxById,
} = require('./boxes.store.firestore')

async function addBox(data) {
  return createBox({
    boxId: data.boxId,
    name: data.name,
    location: data.location || null,
    active: data.active ?? true,
    status: data.status || 'offline',
    deviceIds: Array.isArray(data.deviceIds) ? data.deviceIds : [],
  })
}

async function getBoxes(limit = 50) {
  return listBoxes(limit)
}

async function getBox(boxId) {
  return getBoxById(boxId)
}

async function patchBox(boxId, patch) {
  return updateBoxById(boxId, patch)
}

async function removeBox(boxId) {
  return deleteBoxById(boxId)
}

module.exports = {
  addBox,
  getBoxes,
  getBox,
  patchBox,
  removeBox,
}