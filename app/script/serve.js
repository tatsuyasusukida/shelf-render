const http = require('http')
const winston = require('winston')
const {App} = require('../app')
const {LoggerMaker} = require('../util/logger-maker')

class Main {
  async run () {
    const loggerMaker = new LoggerMaker()

    winston.loggers.add('error', loggerMaker.makeLogger('error', 'json', 'error.log'))
    winston.loggers.add('warn', loggerMaker.makeLogger('warn', 'json', 'warn.log'))
    winston.loggers.add('info', loggerMaker.makeLogger('info', 'json', 'info.log'))
    winston.loggers.add('debug', loggerMaker.makeLogger('debug', 'json', 'debug.log'))
    winston.loggers.add('access', loggerMaker.makeLogger('info', 'raw', 'access.log'))
    winston.loggers.add('query', loggerMaker.makeLogger('info', 'json', 'query.log'))

    const server = http.createServer()
    const app = new App()

    server.on('listening', app.onListening.bind(app))
    server.on('request', app.onRequest.bind(app))
    server.on('error', app.onError.bind(app))
    server.listen(process.env.PORT)
  }
}

if (require.main === module) {
  main()
}

async function main () {
  try {
    await new Main().run()
  } catch (err) {
    console.error(err.message)
    console.error(err.stack)
  }
}
