const path = require('path')
const morgan = require('morgan')
const winston = require('winston')
const express = require('express')
const helmet = require('helmet')
const {Renderer} = require('./lib/renderer')

class App {
  constructor () {
    this.renderer = new Renderer()

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
    this.router.get('/front.svg', this.onRequestFront.bind(this))
    this.router.get('/side.svg', this.onRequestSide.bind(this))

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
      width: req.query.width ?? '15',
      height: req.query.height ?? '49',
      depth: req.query.depth ?? '19',
      row: req.query.row ?? '1',
      thickness: req.query.thickness ?? '17',
      fix: req.query.fix ?? 'ビス（固定）',
      back: req.query.back ?? 'なし',
      background: req.query.background ?? '#c4b295',
    }

    const {search} = new URL(req.originalUrl, process.env.BASE_URL)
    let imageFront = null
    let imageSide = null

    if (search !== '') {
      imageFront = './front.svg' + search
      imageSide = './side.svg' + search
    }

    res.locals.form = form
    res.locals.imageFront = imageFront
    res.locals.imageSide = imageSide

    res.render('home')
  }

  onRequestFront (req, res, next) {
    try {
      const image = this.renderer.renderFront(req)

      res.locals.image = image

      res.set('Content-Type', 'image/svg+xml')
      res.render('front')
    } catch (err) {
      next(err)
    }
  }

  onRequestSide (req, res, next) {
    try {
      const image = this.renderer.renderSide(req)

      res.locals.image = image

      res.set('Content-Type', 'image/svg+xml')
      res.render('side')
    } catch (err) {
      next(err)
    }
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
