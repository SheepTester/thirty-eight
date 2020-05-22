import { CanvasWrapper, loadImages } from './lib/canvas.js'
import { SpritesheetAnimation } from './lib/spritesheet-animation.js'
import { Resizer } from './lib/resizer.js'
import { Animator } from './lib/animator.js'
import { Simulator } from './lib/simulator.js'
import { tile } from './lib/tiler.js'
import { Keys } from './lib/keys.js'
import { Dialogue } from './lib/dialogue.js'
import * as Box from './lib/box.js'
import { PropDrawer } from './lib/prop-drawer.js'

const FPS = 6
const PX_PER_WALK_CYCLE = 18
const FRAMES_PER_WALK_CYCLE = 6

const BACKGROUND_PARALLAX = 0.5

const params = new URL(window.location).searchParams
const showBoxes = params.get('show-boxes')

export default async function main () {
  const sheepSpeaker = { image: new URL('./assets/happy.png', import.meta.url), name: '19811764' }
  const dialogue = new Dialogue().setSpeaker(sheepSpeaker)

  const canvas = new CanvasWrapper().addTo(document.body)
  const resizer = new Resizer([canvas, dialogue]).listen()
  const { keys } = new Keys().listen()

  const [images, dialogueSrc] = await Promise.all([
    loadImages({
      sheepStill: './assets/sheep3.png',
      sheepWalk: './assets/sheep-walk.png',
      walkway: './assets/metal-walkway.png',
      warehouseWall: './assets/warehouse-wall.png',
      warehouseWallFront: './assets/warehouse-wall-darker.png',
      enterKey: './assets/enter-key.png',
      light: './assets/light.png',
      walkwayDoor: './assets/walkway-door.png',
      warningSign: './assets/warning-sign.png'
    }, import.meta.url),
    fetch(new URL('./dialogue/test.json', import.meta.url))
      .then(r => r.json()),
    resizer.resize()
  ])

  const sheepStill = new SpritesheetAnimation({ image: images.sheepStill, fps: FPS, frames: 3 })
  const sheepWalk = new SpritesheetAnimation({ image: images.sheepWalk, fps: FPS, frames: 8 })

  const minX = -300
  const maxX = 300

  const sheepBox = Box.fromDimensions({
    x: -sheepStill.width / 2,
    y: 0,
    width: sheepStill.width,
    height: -sheepStill.height
  })
  const interactables = [
    Box.fromDimensions({ x: minX - sheepStill.width / 2, width: 30 }, { say: dialogueSrc.startDoor }),
    Box.fromDimensions({ x: 40, width: images.warningSign.width }, { say: dialogueSrc.warningSign })
  ]

  const scale = 3
  const speed = 40 // px/s
  const enterKeys = new Set()
  let x = minX + 50
  let cameraX = x * scale
  let walkInitX
  let walkChangeTime
  let visualX
  let walking = false
  let direction

  let wasPressingArrowUp = false
  let wasPressingEnter = false
  function simulate (elapsedTime, totalTime) {
    if (!dialogue.speaking) {
      const sheep = sheepBox.clone().offset({ x })
      let selectedBox
      for (const interactable of interactables) {
        if (interactable.intersects(sheep)) {
          selectedBox = interactable
          if (!interactable.data.enterKey) {
            interactable.data.enterKey = {
              opacity: 0,
              x: interactable.middle().x
            }
            enterKeys.add(interactable.data.enterKey)
          }
          const { enterKey } = interactable.data
          if (enterKey.opacity < 1) {
            enterKey.opacity += elapsedTime / 0.2
            if (enterKey.opacity > 1) enterKey.opacity = 1
          }
        } else if (interactable.data.enterKey) {
          interactable.data.enterKey.opacity -= elapsedTime / 0.2
          if (interactable.data.enterKey.opacity < 0) {
            enterKeys.delete(interactable.data.enterKey)
            interactable.data.enterKey = null
          }
        }
      }
      if (keys.has('Enter')) {
        if (selectedBox && !wasPressingEnter) {
          dialogue.speak(selectedBox.data.say)
          dialogue.addTo(document.body)
          dialogue.resize()
          wasPressingEnter = true
        }
      } else if (wasPressingEnter) {
        wasPressingEnter = false
      }
    }
    if (dialogue.speaking) {
      if (keys.has('ArrowUp')) {
        if (!wasPressingArrowUp) {
          dialogue.up()
          wasPressingArrowUp = true
        }
      } else if (wasPressingArrowUp) {
        wasPressingArrowUp = false
      }
      if (keys.has('Enter')) {
        if (!wasPressingEnter) {
          const done = dialogue.down()
          if (done) dialogue.remove()
          wasPressingEnter = true
        }
      } else if (wasPressingEnter) {
        wasPressingEnter = false
      }
    }
    if (keys.has('ArrowLeft') !== keys.has('ArrowRight') && !dialogue.speaking) {
      if (!walking) {
        walking = true
        walkChangeTime = totalTime
        walkInitX = x
      }
      if (keys.has('ArrowLeft')) {
        x -= speed * elapsedTime
        direction = 'left'
      }
      if (keys.has('ArrowRight')) {
        x += speed * elapsedTime
        direction = 'right'
      }
      if (x < minX) x = minX
      if (x > maxX) x = maxX
      const walkFrame = Math.floor(Math.abs(x - walkInitX) / PX_PER_WALK_CYCLE * FRAMES_PER_WALK_CYCLE)
      sheepWalk.frame = walkFrame % FRAMES_PER_WALK_CYCLE + 1
      visualX = walkInitX + Math.floor(Math.abs(x - walkInitX) / PX_PER_WALK_CYCLE) * PX_PER_WALK_CYCLE * Math.sign(x - walkInitX)
    } else if (walking) {
      walking = false
    }
    cameraX += (x * scale - cameraX) * 1e-60 ** elapsedTime
  }
  const simulator = new Simulator({ simulations: [{ simulate }, sheepStill] })
  const drawer = new PropDrawer({ canvas, scale })
  const animator = new Animator(() => {
    simulator.simulate()
    canvas.context.clearRect(0, 0, canvas.width, canvas.height)
    canvas.context.imageSmoothingEnabled = false

    const floorY = canvas.height / 2
    const shiftX = canvas.width / 2 - cameraX
    tile({ // BACKGROUND
      image: images.warehouseWall,
      canvas,
      startX: (minX - sheepStill.width / 2) * scale + canvas.width / 2 - cameraX * BACKGROUND_PARALLAX,
      endX: (maxX + sheepStill.width / 2) * scale + canvas.width / 2 - cameraX * BACKGROUND_PARALLAX,
      startY: 0,
      endY: canvas.height,
      scale: scale * 2
    })
    drawer.draw({ // Light
      image: images.light,
      x: (minX - sheepStill.width / 2) * scale + shiftX,
      y: floorY - 100 * scale
    })
    tile({ // WALL (start)
      image: images.warehouseWallFront,
      canvas,
      startX: (minX - sheepStill.width / 2) * scale - Math.ceil(canvas.width / (images.warehouseWallFront.width * scale * 3)) * images.warehouseWallFront.width * scale * 2.7 + shiftX,
      endX: (minX - sheepStill.width / 2) * scale + shiftX,
      startY: -100,
      endY: canvas.height,
      scale: scale * 2.7
    })
    tile({ // WALL (office)
      image: images.warehouseWallFront,
      canvas,
      startX: (maxX + sheepStill.width / 2) * scale + shiftX,
      endX: canvas.width,
      startY: -100,
      endY: canvas.height,
      scale: scale * 2.7
    })
    drawer.draw({ // Door
      image: images.walkwayDoor,
      x: 0 * scale + shiftX,
      y: floorY - images.walkwayDoor.height * scale * 1.5 - scale * 5,
      scale: scale * 1.5
    })
    drawer.draw({ // Sign
      image: images.warningSign,
      x: 40 * scale + shiftX,
      y: floorY - (images.warningSign.height + 15) * scale
    })
    if (walking) { // SHEEP
      if (direction === 'left') {
        canvas.context.save()
        canvas.context.scale(-1, 1)
        sheepWalk.draw({
          canvas,
          x: -(visualX + sheepStill.width / 2) * scale - shiftX,
          y: floorY - sheepWalk.height * scale,
          width: sheepWalk.width * scale,
          height: sheepWalk.height * scale
        })
        canvas.context.restore()
      } else {
        sheepWalk.draw({
          canvas,
          x: (visualX - sheepStill.width / 2) * scale + shiftX,
          y: floorY - sheepWalk.height * scale,
          width: sheepWalk.width * scale,
          height: sheepWalk.height * scale
        })
      }
    } else {
      if (direction === 'left') {
        canvas.context.save()
        canvas.context.scale(-1, 1)
        sheepStill.draw({
          canvas,
          x: -(x + sheepStill.width / 2) * scale - shiftX,
          y: floorY - sheepStill.height * scale,
          width: sheepStill.width * scale,
          height: sheepStill.height * scale
        })
        canvas.context.restore()
      } else {
        sheepStill.draw({
          canvas,
          x: (x - sheepStill.width / 2) * scale + shiftX,
          y: floorY - sheepStill.height * scale,
          width: sheepStill.width * scale,
          height: sheepStill.height * scale
        })
      }
    }
    tile({ // WALKWAY
      image: images.walkway,
      canvas,
      startX: (minX - sheepStill.width / 2) * scale + shiftX,
      endX: (maxX + sheepStill.width / 2) * scale + shiftX,
      startY: floorY - images.walkway.height * scale,
      scale
    })
    if (!dialogue.speaking) {
      canvas.context.save()
      for (const { opacity, x } of enterKeys) {
        canvas.context.globalAlpha = opacity
        canvas.context.drawImage(
          images.enterKey,
          (x - images.enterKey.width / 2) * scale + shiftX,
          floorY + (1 - (1 - opacity) ** 3) * scale * 3 + 10,
          images.enterKey.width * scale,
          images.enterKey.height * scale
        )
      }
      canvas.context.restore()
    }
    if (showBoxes) {
      canvas.context.strokeStyle = 'rgba(255, 0, 0, 0.5)'
      canvas.context.beginPath()
      for (const box of [sheepBox.clone().offset({ x }), ...interactables]) {
        box.drawDebug({ canvas, scale, offsetX: shiftX, offsetY: floorY })
      }
      canvas.context.stroke()
    }
  }).start()
}
