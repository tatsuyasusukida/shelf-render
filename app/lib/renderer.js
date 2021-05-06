class Renderer {
  constructor () {
    this.params = {
      canvasWidth: 400,
      canvasHeight: 400,
      marginWidth: 50,
      marginHeight: 50,
      frameThicknessVertical: 30,
      frameThicknessHorizontal: 30,
      dowelRadius: 8,
      dowelLength: 8,
      backThickness: 5,
    }
  }

  renderFront (req) {
    const params = this.params
    const input = {
      width: parseInt(req.query.width, 10),
      height: parseInt(req.query.height, 10),
      depth: parseInt(req.query.depth, 10),
      row: parseInt(req.query.row, 10),
      thickness: parseInt(req.query.thickness, 10),
    }

    const realWidth = params.canvasWidth - 2 * params.marginWidth
    const realHeight = params.canvasHeight - 2 * params.marginHeight
    let scale

    if (Math.max(input.width, input.depth) > input.height) {
      scale = realWidth / Math.max(input.width, input.depth)
    } else {
      scale = realHeight / input.height
    }

    const baseX = params.canvasWidth / 2 - scale * input.width / 2
    const baseY = params.canvasHeight / 2 - scale * input.height / 2
    const viewport = {scale, baseX, baseY}

    const frameTop = {
      x: params.frameThicknessVertical,
      y: input.height - params.frameThicknessHorizontal,
      width: input.width - params.frameThicknessVertical * 2,
      height: params.frameThicknessHorizontal,
    }

    const frameBottom = {
      x: params.frameThicknessVertical,
      y: 0,
      width: input.width - params.frameThicknessVertical * 2,
      height: params.frameThicknessHorizontal,
    }

    const frameLeft = {
      x: 0,
      y: 0,
      width: params.frameThicknessVertical,
      height: input.height,
    }

    const frameRight = {
      x: input.width - params.frameThicknessVertical,
      y: 0,
      width: params.frameThicknessVertical,
      height: input.height,
    }

    const frames = [frameTop, frameBottom, frameLeft, frameRight]
    const plates = []
    const dowels = []

    for (let i = 0; i < input.row; i += 1) {
      const x = params.frameThicknessVertical
      const y = params.frameThicknessHorizontal
        + (i + 1) * (input.height - params.frameThicknessHorizontal * 2) / (input.row + 1)
        - input.thickness / 2

      const width = input.width - params.frameThicknessVertical * 2
      const height = input.thickness
      const plate = {x, y, width, height}

      plates.push(plate)

      if (req.query.fix === '棚ダボ（可動）') {
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

    if (req.query.back === 'あり') {
      const x = 0
      const y = 0
      const width = input.width
      const height = input.height
      const back = {x, y, width, height}

      backs.push(back)
    }

    const color = req.query.color
    const image = {params, viewport, rects, backs, dowels, color}

    return image
  }

  renderSide (req) {
    const params = this.params
    const input = {
      width: parseInt(req.query.width, 10),
      height: parseInt(req.query.height, 10),
      depth: parseInt(req.query.depth, 10),
      row: parseInt(req.query.row, 10),
      thickness: parseInt(req.query.thickness, 10),
    }

    const realWidth = params.canvasWidth - 2 * params.marginWidth
    const realHeight = params.canvasHeight - 2 * params.marginHeight
    let scale

    if (Math.max(input.width, input.depth) > input.height) {
      scale = realWidth / Math.max(input.width, input.depth)
    } else {
      scale = realHeight / input.height
    }

    const baseX = params.canvasWidth / 2 - scale * input.depth / 2
    const baseY = params.canvasHeight / 2 - scale * input.height / 2
    const viewport = {scale, baseX, baseY}

    const frame = {
      x: 0,
      y: 0,
      width: input.depth - (req.query.back === 'あり' ? params.backThickness : 0),
      height: input.height,
    }

    let back = null

    if (req.query.back === 'あり') {
      const x = input.depth - params.backThickness
      const y = 0
      const width = params.backThickness
      const height = input.height

      back = {x, y, width, height}
    }

    const color = req.query.color
    const image = {params, viewport, frame, back, color}

    return image
  }
}

module.exports.Renderer = Renderer
