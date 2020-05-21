export class CanvasWrapper {
  constructor () {
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'wrapped-canvas'

    this.context = this.canvas.getContext('2d')
  }

  addTo (parent) {
    if (this.parent) {
      this.parent.removeChild(this.canvas)
      this.parent.classList.remove('canvas-wrapper')
    }
    this.parent = parent
    if (parent) {
      parent.appendChild(this.canvas)
      parent.classList.add('canvas-wrapper')
    }
    return this
  }

  remove () {
    return this.addTo(null)
  }

  async resize (then = Promise.resolve()) {
    if (this.parent) {
      const { left, top, width, height } = this.parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio

      await then

      this.x = left
      this.y = top
      this.width = width
      this.height = height
      this.dpr = dpr

      this.canvas.width = width * dpr
      this.canvas.height = height * dpr
      this.context.scale(dpr, dpr)

      return this
    }
  }
}

export function loadImage (url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', e => {
      resolve(image)
    })
    image.addEventListener('error', e => {
      reject(e)
    })
    image.src = url
  })
}
