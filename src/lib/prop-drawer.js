export class PropDrawer {
  constructor (commonOptions = {}) {
    Object.assign(this, commonOptions)
  }

  draw (options = {}) {
    const {
      canvas: { width, height, context },
      image,
      x = 0,
      y = 0,
      scale = 1
    } = Object.assign({}, this, options)
    const visualWidth = image.width * scale
    const visualHeight = image.height * scale
    if (!(x + visualWidth < 0 || y + visualHeight < 0 ||
      x > width || y > height)) {
      context.drawImage(image, x, y, visualWidth, visualHeight)
    }
    return this
  }
}
