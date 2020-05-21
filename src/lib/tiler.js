import { mod } from './math.js'

// More generic version of walkway
export function tile ({
  image,
  canvas: { width, height, context },
  scale = 1,
  startX = 0,
  endX = startX + image.width * scale,
  startY = 0,
  endY = startY + image.height * scale
}) {
  const imageWidth = image.width * scale
  const imageHeight = image.height * scale
  const actualStartX = mod(startX, imageWidth) - imageWidth
  const actualStartY = mod(startY, imageHeight) - imageHeight
  for (let x = Math.max(actualStartX, startX); x < width && x < endX; x += imageWidth) {
    for (let y = Math.max(actualStartY, startY); y < height && y < endY; y += imageHeight) {
      const portionX = Math.min((endX - x) / imageWidth, 1)
      const portionY = Math.min((endY - y) / imageHeight, 1)
      context.drawImage(
        image,
        0,
        0,
        image.width * portionX,
        image.height * portionY,
        x,
        y,
        imageWidth * portionX,
        imageHeight * portionY
      )
    }
  }
  return this
}
