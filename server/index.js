require('dotenv').config()
const { errorHandler, setConfig, logDebug, Errors } = require('ds-express-errors')
const express = require('express')

const fanRoutes = require('./src/modules/devices/fan-1/device.routes')
const mainBoxRoutes = require('./src/modules/boxes/main-box/boxes.routes')
const sessionRoutes = require('./src/modules/sessions/sessions.route')
const userRoutes = require('./src/modules/users/users.routes')
const logsRoutes = require('./src/modules/logs/logs.routes')
const authRoutes = require('./src/modules/auth/auth.routes')
const devicesRoutes = require('./src/devices-other/devices.routes')
const boxesRoutes = require('./src/boxes-other/boxes.routes')
const activitiesRoutes = require('./src/modules/activities/activities.routes')

const cookieParser = require('cookie-parser')

const client = require('./src/mqtt/client')
const { initMqtt } = require('./src/mqtt/init')
const { db } = require('./src/integrations/firebase/firebase.client')
const { writeLog, getRecentLogs } = require('./src/modules/logs/logs.store.firestore')
const {
  logAuthRequestReceived,
  logAuthDenied,
  logAuthGranted,
  logSessionStarted,
  logSessionEnded,
} = require('./src/modules/logs/logs.service')

initMqtt()

const app = express()
app.use(express.json())

setConfig({
  maxLoggerRequests: 100000,
  devEnvironments: ['development', 'test'],
  formatError: (err, {req, isDev}) => ({
      success: false,
      mqttConnected: client.connected,
      ...(isDev ? {
        request: {
          method: req.method,
          url: req.originalUrl,
        }
      } : {}),
      error: {
        name: err.name,
        message: err.message,
        stack: isDev ? err.stack : undefined,
      },
      
  }),
})

app.use(fanRoutes)
app.use(mainBoxRoutes)
app.use(devicesRoutes)
app.use(boxesRoutes)
app.use(activitiesRoutes)

app.use(sessionRoutes)
app.use(userRoutes)

app.use(logsRoutes)

app.use(cookieParser())
app.use(authRoutes)

app.get('/health', (req, res, next) => {
  res.json({
    success: true,
    mqttConnected: client.connected,
  })
})

app.listen(process.env.PORT || 3000, () => {
  logDebug(
    'HTTP server running on http://localhost:' + (process.env.PORT || 3000),
  )
})

app.use(errorHandler)
