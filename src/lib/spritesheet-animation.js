export class SpritesheetAnimation {
  constructor ({
    image,
    frames = 1,
    fps = 30
  } = {}) {
    this.image = image
    this.width = image.width
    this.height = image.height / frames
    this._frame = 0
    this._frames = frames
    this.fps = fps
  }

  draw ({ canvas: { context }, x = 0, y = 0, width = this.width, height = this.height }) {
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
