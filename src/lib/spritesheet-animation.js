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

  draw ({
    canvas: { context, width, height },
    x = 0,
    y = 0,
    scale = 1,
    frame = this.frame,
    alwaysDraw = false
  }) {
    const visualWidth = this.width * scale
    const visualHeight = this.height * scale
    if (alwaysDraw || x + visualWidth >= 0 && y + visualHeight >= 0 && x < width && y < height) {
      context.drawImage(
        this.image,
        0,
        frame * this.height,
        this.width,
        this.height,
        x,
        y,
        visualWidth,
        visualHeight
      )
    }
    return this
  }
}
