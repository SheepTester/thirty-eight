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
      scrollX = 0,
      scrollY = 0,
      scale = 1
    } = Object.assign({}, this, options)
    const visualX = x * scale + scrollX
    const visualY = y * scale + scrollY
    const visualWidth = image.width * scale
    const visualHeight = image.height * scale
    if (!(visualX + visualWidth < 0 || visualY + visualHeight < 0 ||
      visualX > width || visualY > height)) {
      context.drawImage(image, visualX, visualY, visualWidth, visualHeight)
    }
    return this
  }
}
