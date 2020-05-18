import { bindMethods } from './bind-methods.js'

export class Animator {
  constructor (animate) {
    bindMethods(this, [
      '_frame'
    ])

    this.animate = animate
    this.animating = false
    this._lastRequest = null
  }

  start () {
    if (!this.animating) {
      this.animating = true
      this._frame()
    }
    return this
  }

  _frame () {
    this.animate()
    if (this.animating) {
      this._lastRequest = window.requestAnimationFrame(this._frame)
    }
  }

  stop () {
    if (this.animating) {
      this.animating = false
      window.cancelAnimationFrame(this._lastRequest)
      this._lastRequest = null
    }
    return this
  }
}
