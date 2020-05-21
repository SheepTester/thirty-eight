export class SpritesheetAnimation {
  constructor ({
    image,
    frames = 1,
    fps = 30,
    getFrame = null
  } = {}) {
    this.image = image
    this.width = image.width
    this.height = image.height / frames
    this.frame = 0
    this.frames = frames
    this.fps = fps
    this.getFrame = getFrame
  }

  simulate (_, totalTime) {
    const totalFrames = Math.floor(totalTime * this.fps)
    this.frame = this.getFrame ? this.getFrame(totalFrames) : totalFrames % this.frames
    return this
  }

  draw ({ canvas: { context }, x = 0, y = 0, width = this.width, height = this.height }) {
    context.drawImage(
      this.image,
      0,
      this.frame * this.height,
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
