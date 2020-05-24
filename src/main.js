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
import { Vector2 } from './lib/vector2.js'
import { ParticleManager } from './lib/particle-manager.js'

const FPS = 6
const PX_PER_WALK_CYCLE = 18
const FRAMES_PER_WALK_CYCLE = 6

const BACKGROUND_PARALLAX = 0.5

const params = new URL(window.location).searchParams
const showBoxes = params.get('show-boxes')
const speedy = params.get('speedy')

export default async function main () {
  const dialogue = new Dialogue()

  let dialoguing = false
  async function dialogueInteraction (lines) {
    dialoguing = true
    dialogue.addTo(document.body)
    for (const [speakerID, line] of lines) {
      const speakingDone = dialogue.setSpeaker(speakers[speakerID])
        .speak(line)
      dialogue.resize()
      await speakingDone
    }
    dialogue.remove()
    dialoguing = false
  }

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
      warningSign: './assets/warning-sign.png',
      logo: './assets/ol43.png',
      officeWindow: './assets/window.png',
      officeLogo: './assets/office-logo.png',
      guard: './assets/guard.png',
      sheepProfile: './assets/happy.png',
      guardProfile: './assets/guard-profile.png',
      sheepPropeller: './assets/expeller.png',
      guardPropeller: './assets/particle-propeller.png'
    }, import.meta.url),
    fetch(new URL('./dialogue/test.json', import.meta.url))
      .then(r => r.json()),
    resizer.resize()
  ])

  const speakers = {
    sheep: { image: images.sheepProfile, name: '37' },
    guard: { image: images.guardProfile, name: 'Guard' }
  }
  dialogueInteraction([['sheep', dialogueSrc.intro]])

  const minX = -500
  const maxX = 500

  const particleManager = new ParticleManager({
    bounds: Box.fromDiagonal({ x1: minX, x2: maxX, y1: 0, y2: Infinity })
  })

  const sheepStill = new SpritesheetAnimation({ image: images.sheepStill, fps: FPS, frames: 3 })
  const sheepWalk = new SpritesheetAnimation({ image: images.sheepWalk, fps: FPS, frames: 8 })
  const sheepPropeller = particleManager.createPropeller({
    spritesheet: new SpritesheetAnimation({
      image: images.sheepPropeller,
      fps: FPS,
      frames: 3,
      getFrame (totalFrames) {
        return totalFrames % 2 + 1
      }
    }),
    offset: new Vector2(-sheepStill.width / 2, -sheepStill.height),
    source: new Vector2(0, -40),
    speed: new Vector2(10, 0),
    cooldown: 0.05,
    auto: false
  })

  const guard = new SpritesheetAnimation({ image: images.guard, fps: FPS, frames: 3 })
  const guardPropeller = particleManager.createPropeller({
    spritesheet: new SpritesheetAnimation({ image: images.guardPropeller, fps: FPS, frames: 2 }),
    position: new Vector2(maxX, 0),
    offset: new Vector2(0, 0),
    source: new Vector2(-40, 0),
    speed: new Vector2(-10, 0),
    cooldown: 0.5
  })

  const sheepBox = Box.fromDimensions({
    x: -sheepStill.width / 2,
    y: 0,
    width: sheepStill.width,
    height: -sheepStill.height
  })
  const interactables = new Set([
    Box.fromDimensions({ x: minX - sheepStill.width / 2, width: 30 }, { say: dialogueSrc.startDoor }),
    Box.fromDimensions({ x: 40, width: images.warningSign.width }, { say: dialogueSrc.warningSign }),
    Box.fromDimensions({ x: 200, width: images.warningSign.width }, { say: dialogueSrc.milkSpotted, auto: true }),
    Box.fromDimensions({ x: maxX - 100, width: 100 }, { say: dialogueSrc.guardInteraction, auto: true }),
    Box.fromDimensions({ x: maxX - 80, width: 100 }, { say: dialogueSrc.goAway, auto: true }),
    Box.fromDimensions({ x: maxX - 60, width: 100 }, {
      combat () {
        // particleManager.
      },
      auto: true
    })
  ])

  const scale = 3
  const speed = speedy ? 400 : 40 // px/s
  const enterKeys = new Set()
  let x = minX + 50
  let cameraX = x * scale
  let walkInitX
  let walkChangeTime
  let visualX
  let walking = false
  let direction
  let combatMode = false
  let combatModeSince
  function setCombatMode (mode) {
    if (mode !== combatMode) {
      combatMode = mode
      combatModeSince = Date.now()
    }
  }

  let wasPressingArrowUp = false
  let wasPressingEnter = false
  function simulate (elapsedTime, totalTime) {
    if (!dialoguing) {
      const sheep = sheepBox.clone().offset({ x })
      let selectedBox
      for (const interactable of interactables) {
        if (interactable.intersects(sheep)) {
          selectedBox = interactable
          if (interactable.data.auto) continue
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
      if (selectedBox && (keys.has('Enter') && !wasPressingEnter || selectedBox.data.auto)) {
        const { auto, say, combat } = selectedBox.data
        if (auto) {
          interactables.delete(selectedBox)
        }
        if (say) {
          dialogueInteraction(Array.isArray(say) ? say : [['sheep', say]])
        }
        if (combat) {
          setCombatMode(true)
          combat()
        }
        wasPressingEnter = true
      } else if (wasPressingEnter && !keys.has('Enter')) {
        wasPressingEnter = false
      }
    }
    // Using dialogue.speaking instead of dialoguing because it better reflects
    // whether up/enter can actually do things
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
          dialogue.down()
          wasPressingEnter = true
        }
      } else if (wasPressingEnter) {
        wasPressingEnter = false
      }
    }
    if (keys.has('ArrowLeft') !== keys.has('ArrowRight') && !dialoguing) {
      if (!walking) {
        walking = true
        direction = null
      }
      if (keys.has('ArrowLeft')) {
        if (direction !== 'left') {
          walkChangeTime = totalTime
          walkInitX = x
          direction = 'left'
        }
        x -= speed * elapsedTime
      }
      if (keys.has('ArrowRight')) {
        if (direction !== 'right') {
          walkChangeTime = totalTime
          walkInitX = x
          direction = 'right'
        }
        x += speed * elapsedTime
      }
      if (x < minX) x = minX
      if (x > maxX) x = maxX
      const walkFrame = Math.floor(Math.abs(x - walkInitX) / PX_PER_WALK_CYCLE * FRAMES_PER_WALK_CYCLE)
      sheepWalk.frame = walkFrame % FRAMES_PER_WALK_CYCLE + 1
      visualX = walkInitX + Math.floor(Math.abs(x - walkInitX) / PX_PER_WALK_CYCLE) * PX_PER_WALK_CYCLE * Math.sign(x - walkInitX)
    } else if (walking) {
      walking = false
    }
    cameraX += (x * scale - cameraX) * 0.1 // Assumes constant step time
  }
  const simulator = new Simulator({ simulations: [
    { simulate },
    sheepStill,
    guard,
    particleManager,
    sheepPropeller.spritesheet
  ], stepTime: 0.01 })
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
      startX: (minX - sheepStill.width / 2 - canvas.width) * scale + canvas.width / 2 - cameraX * BACKGROUND_PARALLAX,
      endX: (maxX + sheepStill.width / 2 + canvas.width) * scale + canvas.width / 2 - cameraX * BACKGROUND_PARALLAX,
      startY: -20,
      endY: canvas.height,
      scale: scale * 2
    })
    drawer.draw({ // OL-43
      image: images.logo,
      x: -200 * scale + canvas.width / 2 - cameraX * BACKGROUND_PARALLAX,
      y: floorY - 70 * scale,
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
    drawer.draw({ // Window 1
      image: images.officeWindow,
      x: (maxX + sheepStill.width / 2 + 20) * scale + shiftX,
      y: floorY - (images.officeWindow.height * 2 + 20) * scale,
      scale: scale * 2
    })
    drawer.draw({ // Window 2
      image: images.officeWindow,
      x: (maxX + sheepStill.width / 2 + 40 + images.officeWindow.width * 2) * scale + shiftX,
      y: floorY - (images.officeWindow.height * 2 + 20) * scale,
      scale: scale * 2
    })
    drawer.draw({ // Office logo
      image: images.officeLogo,
      x: (maxX + sheepStill.width / 2 + 20) * scale + shiftX,
      y: floorY - (images.officeLogo.height + images.officeWindow.height + 50) * scale
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
      y: floorY - (images.warningSign.height + 15.5) * scale
    })
    if (combatMode) {
      sheepPropeller.draw({ canvas, scale })
      sheepPropeller.draw({ canvas, scale })
    }
    guard.draw({ // GUARD
      canvas,
      x: (maxX - guard.width / 2) * scale + shiftX,
      y: floorY - guard.height * scale,
      scale
    })
    if (walking) { // SHEEP
      if (direction === 'left') {
        canvas.context.save()
        canvas.context.scale(-1, 1)
        sheepWalk.draw({
          canvas,
          x: -(visualX + sheepStill.width / 2) * scale - shiftX,
          y: floorY - sheepWalk.height * scale,
          scale,
          alwaysDraw: true
        })
        canvas.context.restore()
      } else {
        sheepWalk.draw({
          canvas,
          x: (visualX - sheepStill.width / 2) * scale + shiftX,
          y: floorY - sheepWalk.height * scale,
          scale,
          alwaysDraw: true
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
          scale,
          alwaysDraw: true
        })
        canvas.context.restore()
      } else {
        sheepStill.draw({
          canvas,
          x: (x - sheepStill.width / 2) * scale + shiftX,
          y: floorY - sheepStill.height * scale,
          scale,
          alwaysDraw: true
        })
      }
    }
    particleManager.draw({ canvas, scale, offset: new Vector2(shiftX, floorY) })
    tile({ // WALKWAY
      image: images.walkway,
      canvas,
      startX: (minX - sheepStill.width / 2) * scale + shiftX,
      endX: (maxX + sheepStill.width / 2) * scale + shiftX,
      startY: floorY - images.walkway.height * scale,
      scale
    })
    if (!dialoguing) {
      canvas.context.save()
      for (const { opacity, x } of enterKeys) {
        canvas.context.globalAlpha = opacity
        canvas.context.drawImage(
          images.enterKey,
          (x - images.enterKey.width / 2) * scale + shiftX,
          floorY - (1 - (1 - opacity) ** 3) * scale * 3 + 20,
          images.enterKey.width * scale,
          images.enterKey.height * scale
        )
      }
      canvas.context.restore()
    }
    if (combatMode || combatModeSince) {
      let transitionIn = Math.min(1 - (1 - (Date.now() - combatModeSince) / 1000) ** 3, 1)
      if (!combatMode) transitionIn = 1 - transitionIn
      if (transitionIn <= 0) {
        if (!combatMode) {
          combatModeSince = null
        }
      } else {
        canvas.context.fillStyle = `rgba(255, 0, 0, ${transitionIn * 0.3})`
        canvas.context.fillRect(0, 0, canvas.width, canvas.height)
        canvas.context.fillStyle = 'black'
        canvas.context.fillRect(0, 0, canvas.width, canvas.height * 0.15 * transitionIn)
        canvas.context.fillRect(0, canvas.height, canvas.width, -canvas.height * 0.15 * transitionIn)
      }
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
