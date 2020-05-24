import { inRange } from './math.js'

class Box {
  constructor (x1, y1, x2, y2, data) {
    this._x1 = x1
    this._y1 = y1
    this._x2 = x2
    this._y2 = y2
    this.data = data
  }

  contains ({ x, y }) {
    return inRange(x, { min: this._x1, max: this._x2 }) &&
      inRange(y, { min: this._y1, max: this._y2 })
  }

  intersects (box) {
    return this._x1 <= box._x2 && box._x1 <= this._x2 &&
      this._y1 <= box._y2 && box._y1 <= this._y2
  }

  drawDebug ({ canvas: { context }, scale = 1, offsetX = 0, offsetY = 0 }) {
    context.rect(
      this._x1 * scale + offsetX,
      this._y1 * scale + offsetY,
      (this._x2 - this._x1) * scale,
      (this._y2 - this._y1) * scale
    )
    return this
  }

  offset ({ x = 0, y = 0 } = {}) {
    this._x1 += x
    this._y1 += y
    this._x2 += x
    this._y2 += y
    return this
  }

  middle () {
    return {
      x: (this._x1 + this._x2) / 2,
      y: (this._y1 + this._y2) / 2
    }
  }

  clone () {
    return new Box(this._x1, this._y1, this._x2, this._y2, this.data)
  }
}

export function fromDiagonal ({ x1 = 0, y1 = 0, x2 = 0, y2 = 0 }, data = null) {
  return new Box(
    Math.min(x1, x2),
    Math.min(y1, y2),
    Math.max(x1, x2),
    Math.max(y1, y2),
    data
  )
}

export function fromDimensions ({ x = 0, y = 0, width = 0, height = 0 }, data = null) {
  return fromDiagonal({ x1: x, y1: y, x2: x + width, y2: y + height }, data)
}

export function fromRadius ({ x = 0, y = 0, xr = 0, yr = 0 }, data = null) {
  return fromDiagonal({ x1: x - xr, y1: y - yr, x2: x + xr, y2: y + yr }, data)
}

export function universe (data = null) {
  return new Box(-Infinity, -Infinity, Infinity, Infinity, data)
}

export function point ({ x = 0, y = 0 } = {}, data = null) {
  return new Box(x, y, x, y, data)
}
