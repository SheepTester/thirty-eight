import { bindMethods } from './bind-methods.js'

export class Resizer {
  constructor (resizers = []) {
    bindMethods(this, [
      'resize'
    ])

    this.resizers = resizers
  }

  resize () {
    let measurementsDone
    const measurementsPromise = new Promise(resolve => (measurementsDone = resolve))
    const resizeDone = Promise.all(this.resizers.map(resizer => resizer.resize(measurementsPromise)))
    measurementsDone()
    return resizeDone.then(() => this)
  }

  listen () {
    window.addEventListener('resize', this.resize)
    return this
  }
}
