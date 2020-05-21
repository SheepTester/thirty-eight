import { mod } from './math.js'

export class Walkway {
  constructor ({ image } = {}) {
    this.image = image
  }

  draw ({
    canvas: { canvas: { width }, context },
    start = 0,
    end = width,
    y = 0,
    height = this.image.height
  }) {
    const scale = height / this.image.height
    const imageWidth = this.image.width * scale
    const actualStart = mod(start, imageWidth) - imageWidth
    for (let x = actualStart; x < width; x += imageWidth) {
      context.drawImage(this.image, x, y, imageWidth, height)
    }
    return this
  }
}
