export class SpritesheetAnimation {
  constructor ({
    image,
    frames = 1
  } = {}) {
    this.image = image
    this.width = image.width
    this.height = image.height / frames
    this._frame = 0
    this._frames = frames
  }

  draw ({ canvas: { context }, x = 0, y = 0, width = this.width, height = this.height }) {
    this._frame = Math.random() * this._frames | 0
    context.drawImage(
      this.image,
      0,
      this._frame * this.height,
      this.width,
      this.height,
      x,
      y,
      width,
      height
    )
    return this
  }
}
