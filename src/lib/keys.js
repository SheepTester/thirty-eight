export class Keys {
  constructor () {
    this.keys = new Set()
  }

  listen () {
    window.addEventListener('keydown', e => {
      this.keys.add(e.key)
    })
    window.addEventListener('keyup', e => {
      this.keys.delete(e.key)
    })
    return this
  }
}
