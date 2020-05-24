import { Vector2 } from './vector2.js'

export class SinglePointer {
  constructor (wrapper) {
    this.wrapper = wrapper
    wrapper.classList.add('pointer-target')
    this.position = new Vector2()
    this.down = false
  }

  listen () {
    this.wrapper.addEventListener('pointerdown', e => {
      this.down = true
      this.position.set(Vector2.fromMouseEvent(e))
      this.wrapper.setPointerCapture(e.pointerId)
    })
    this.wrapper.addEventListener('pointermove', e => {
      this.position.set(Vector2.fromMouseEvent(e))
    })
    const pointerEnd = e => {
      this.down = false
      this.position.set(Vector2.fromMouseEvent(e))
    }
    this.wrapper.addEventListener('pointerup', pointerEnd)
    this.wrapper.addEventListener('pointercancel', pointerEnd)
    return this
  }
}
