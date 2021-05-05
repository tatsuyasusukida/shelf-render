const path = require('path')
const morgan = require('morgan')
const winston = require('winston')
const express = require('express')
const helmet = require('helmet')

class App {
  constructor () {
    this.router = express()

    this.router.set('strict routing', true)
    this.router.set('views', path.join(__dirname, 'view'))
    this.router.set('view engine', 'pug')
    this.router.set('trust proxy', true)

    this.router.use(helmet())
    this.router.use(morgan(process.env.LOG_ACCESS, {
      stream: {
        write: message => {
          winston.loggers.get('access').info(message.trim())
        },
      },
    }))

    this.router.use(this.onRequestInitialize.bind(this))

    this.router.get('/', this.onRequestHome.bind(this))

    this.router.use(this.onNotFound.bind(this))
    this.router.use(this.onInternalServerError.bind(this))
  }

  onListening () {
    winston.loggers.get('info').info(`Listening on ${process.env.PORT}`)
  }

  onRequest (req, res) {
    this.router(req, res)
  }

  onRequestHome (req, res, next) {
    const form = {
      width: req.query.width ?? '150',
      height: req.query.height ?? '490',
      depth: req.query.depth ?? '190',
      row: req.query.row ?? '1',
      thickness: req.query.thickness ?? '17',
      fix: req.query.fix ?? 'ビス（固定）',
      back: req.query.back ?? 'なし',
      color: req.query.color ?? '#c4b295',
    }

    const params = {
      canvasWidth: 400,
      canvasHeight: 400,
      marginWidth: 50,
      marginHeight: 50,
      thicknessVertical: 30,
      thicknessHorizontal: 30,
      dowelRadius: 8,
      dowelLength: 8,
    }

    const width = parseInt(form.width, 10)
    const height = parseInt(form.height, 10)
    const depth = parseInt(form.depth, 10)
    const row = parseInt(form.row, 10)

    const realWidth = params.canvasWidth - 2 * params.marginWidth
    const realHeight = params.canvasHeight - 2 * params.marginHeight
    let scale

    if (width > height) {
      scale = realWidth / width
    } else {
      scale = realHeight / height
    }

    const baseX = params.canvasWidth / 2 - scale * width / 2
    const baseY = params.canvasHeight / 2 - scale * height / 2
    const viewport = {scale, baseX, baseY}

    const frameTop = {
      x: params.thicknessVertical,
      y: form.height - params.thicknessHorizontal,
      width: form.width - params.thicknessVertical * 2,
      height: params.thicknessHorizontal,
    }

    const frameBottom = {
      x: params.thicknessVertical,
      y: 0,
      width: form.width - params.thicknessVertical * 2,
      height: params.thicknessHorizontal,
    }

    const frameLeft = {
      x: 0,
      y: 0,
      width: params.thicknessVertical,
      height: form.height,
    }

    const frameRight = {
      x: form.width - params.thicknessVertical,
      y: 0,
      width: params.thicknessVertical,
      height: form.height,
    }

    const frames = [frameTop, frameBottom, frameLeft, frameRight]
    const plates = []
    const dowels = []

    for (let i = 0; i < row; i += 1) {
      const x = params.thicknessVertical
      const y = params.thicknessHorizontal
        + (i + 1) * (form.height - params.thicknessHorizontal * 2) / (row + 1)
        - form.thickness / 2

      const width = form.width - params.thicknessVertical * 2
      const height = form.thickness
      const plate = {x, y, width, height}

      plates.push(plate)

      if (form.fix === '棚ダボ（可動）') {
        const dowelLeft = {
          x: x,
          y: y - params.dowelRadius / 2,
          width: params.dowelLength,
          height: params.dowelRadius / 2,
        }

        const dowelRight = {
          x: x + width - params.dowelLength,
          y: y - params.dowelRadius / 2,
          width: params.dowelLength,
          height: params.dowelRadius / 2,
        }

        dowels.push(dowelLeft)
        dowels.push(dowelRight)
      }
    }

    const rects = [...frames, ...plates]
    const backs = []

    if (form.back === 'あり') {
      const x = 0
      const y = 0
      const width = form.width
      const height = form.height
      const back = {x, y, width, height, backs}

      backs.push(back)
    }

    const image = {params, viewport, rects, backs, dowels}

    res.locals.form = form
    res.locals.image = image

    res.render('home')
  }

  onRequestInitialize (req, res, next) {
    res.locals.env = process.env

    next()
  }

  onNotFound (req, res) {
    res.status(404).end()
  }

  onInternalServerError (err, req, res, next) {
    res.status(500).end()
    this.onError(err)
  }

  onError (err) {
    winston.loggers.get('error').error(err.message)
    winston.loggers.get('debug').debug(err.stack)
  }
}

module.exports.App = App
