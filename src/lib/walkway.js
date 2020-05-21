import { mod } from './math.js'

export class Walkway {
  constructor ({ image } = {}) {
    this.image = image
  }

  draw ({
    canvas: { width, context },
    start = 0,
    end = width,
    y = 0,
    height = this.image.height
  }) {
    const scale = height / this.image.height
    const imageWidth = this.image.width * scale
    const actualStart = mod(start, imageWidth) - imageWidth
    for (let x = Math.max(actualStart, start); x < width && x < end; x += imageWidth) {
      if (x + imageWidth > end) {
        const portion = (end - x) / imageWidth
        context.drawImage(this.image, 0, 0, this.image.width * portion, this.image.height, x, y, imageWidth * portion, height)
      } else {
        context.drawImage(this.image, x, y, imageWidth, height)
      }
    }
    return this
  }
}
