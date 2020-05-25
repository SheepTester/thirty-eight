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
import { SinglePointer } from './lib/pointer.js'
import { HealthBar } from './lib/health-bar.js'

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
  let currentSpeaker = null
  async function dialogueInteraction (lines) {
    dialoguing = true
    dialogue.addTo(document.body)
    for (const [speakerID, line] of lines) {
      currentSpeaker = speakerID
      const speakingDone = dialogue.setSpeaker(speakers[speakerID])
        .speak(line)
      dialogue.resize()
      await speakingDone
    }
    dialogue.remove()
    dialoguing = false
    currentSpeaker = null
  }

  const canvas = new CanvasWrapper().addTo(document.body)
  const resizer = new Resizer([canvas, dialogue]).listen()
  const { keys } = new Keys().listen()
  const pointer = new SinglePointer(canvas.canvas).listen()

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
      guardPropeller: './assets/particle-propeller.png',
      cloud: './assets/cloud.png'
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
  const maxX = 600

  function targetHit ({ data: { affects: healthBar } }, { data: { damage } }) {
    healthBar.damage(damage)
  }

  const sheepStill = new SpritesheetAnimation({ image: images.sheepStill, fps: FPS, frames: 3 })
  const sheepWalk = new SpritesheetAnimation({ image: images.sheepWalk, fps: FPS, frames: 8 })
  const particleManager = new ParticleManager({
    bounds: Box.fromDiagonal({ x1: minX - sheepStill.width / 2, x2: maxX + sheepStill.width / 2, y1: 0, y2: -Infinity })
  })
  const sheepPropeller = particleManager.createPropeller({
    spritesheet: new SpritesheetAnimation({
      image: images.sheepPropeller,
      fps: FPS,
      frames: 3,
      getFrame (totalFrames) {
        return totalFrames % 2 + 1
      }
    }),
    position: new Vector2(0, -sheepStill.height + 10),
    speed: new Vector2(200, 0),
    maxAge: 10,
    cooldown: 0.05,
    targetHit,
    damage: 0.2
  })
  const sheepUglyOffset = new Vector2(15, 5) // Ugly not because of the sheep but because of the code
  sheepPropeller.offset.set(new Vector2(-sheepPropeller.spritesheet.width / 2, -sheepPropeller.spritesheet.height).add(sheepUglyOffset))
  sheepPropeller.source.set(new Vector2(sheepPropeller.spritesheet.width / 2 - 20, -sheepPropeller.spritesheet.height / 2 - 5).add(sheepUglyOffset))
  const sheepHealth = new HealthBar(10)

  const cloud = new SpritesheetAnimation({ image: images.cloud, fps: FPS, frames: 3 })
  const dead = { sheep: false, guard: false }

  function getGoodAngle (mouse) {
    // Assumes that speed has no y component lol
    const { position, source } = sheepPropeller
    const positionToMouse = mouse.clone().sub(position)
    return Math.acos(source.y / positionToMouse.length) + positionToMouse.angle - Math.PI / 2
  }

  const guard = new SpritesheetAnimation({ image: images.guard, fps: FPS, frames: 3 })
  const guardPropeller = particleManager.createPropeller({
    spritesheet: new SpritesheetAnimation({ image: images.guardPropeller, fps: 2, frames: 2 }),
    position: new Vector2(maxX, -5 - sheepPropeller.spritesheet.height / 2),
    speed: new Vector2(-100, 0),
    maxAge: 10,
    cooldown: 0.3,
    targetHit,
    damage: 1
  })
  guardPropeller.offset.set(new Vector2(-sheepPropeller.spritesheet.width + 20, -sheepPropeller.spritesheet.height / 2))
  guardPropeller.source.set(new Vector2(-guardPropeller.spritesheet.width - 5, -guardPropeller.spritesheet.height / 2 + 5))
  const guardHealth = new HealthBar(15)

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
    Box.fromDimensions({ x: maxX - 180, width: 100 }, { say: dialogueSrc.guardInteraction, auto: true }),
    Box.fromDimensions({ x: maxX - 130, width: 100 }, { say: dialogueSrc.goAway, auto: true }),
    Box.fromDimensions({ x: maxX - 80, width: 100 }, {
      combat () {
        guardPropeller.active = true
      },
      auto: true
    })
  ])
  const sheepHitbox = sheepBox.clone()
  sheepHitbox.data.affects = sheepHealth
  guardPropeller.targets.add(sheepHitbox)
  const guardHitbox = Box.fromDimensions({
    x: maxX - guard.width / 2,
    y: 0,
    width: guard.width,
    height: -guard.height
  })
  guardHitbox.data.affects = guardHealth
  sheepPropeller.targets.add(guardHitbox)

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
  let offset = new Vector2()
  function setCombatMode (mode) {
    if (mode !== combatMode) {
      combatMode = mode
      combatModeSince = Date.now()
    }
  }

  let wasPressingArrowUp = false
  let wasPressingEnter = false
  function simulateDead (deadObj, elapsedTime) {
    if (deadObj.opacity > 0) {
      deadObj.opacity -= elapsedTime * 0.3
      if (deadObj.opacity < 0) deadObj.opacity = 0
    }
  }
  function simulate (elapsedTime, totalTime) {
    const sheep = sheepBox.clone().offset({ x })
    if (!dialoguing && !dead.sheep) {
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
    if (keys.has('ArrowLeft') !== keys.has('ArrowRight') && !dialoguing && !dead.sheep) {
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
    const focusX = currentSpeaker === 'guard' ? maxX : x
    cameraX += (focusX * scale - cameraX) * 0.1 // Assumes constant step time
    if (combatMode) {
      if (sheepHealth.isDead() || guardHealth.isDead()) {
        setCombatMode(false)
        sheepPropeller.active = false
        guardPropeller.active = false
        if (sheepHealth.isDead()) dead.sheep = { opacity: 1 }
        if (guardHealth.isDead()) dead.guard = { opacity: 1 }
        interactables.add(Box.fromRadius({ x: maxX, width: sheepStill.width / 2 }, { end: true }))
      }
    }
    if (combatMode) {
      sheepHitbox.set(sheep)
      let angle = getGoodAngle(pointer.position.clone().sub(offset).scale(1 / scale))
      if (!Number.isNaN(angle)) {
        if (angle < -Math.PI / 4) angle = -Math.PI / 4
        else if (angle > Math.PI / 4) angle = Math.PI / 4
        sheepPropeller.angle = angle
      }
      sheepPropeller.active = pointer.down
      if (guardPropeller.active) {
        guardPropeller.angle = Math.sin(totalTime * 5) * Math.PI / 6
      }
    }
    if (dead.sheep) simulateDead(dead.sheep, elapsedTime)
    if (dead.guard) simulateDead(dead.guard, elapsedTime)
  }
  const simulator = new Simulator({ simulations: [
    { simulate },
    sheepStill,
    guard,
    particleManager,
    sheepPropeller.spritesheet,
    cloud
  ], stepTime: 0.01 })
  const drawer = new PropDrawer({ canvas, scale })
  function drawCloud ({ opacity }, { x, y }) {
    cloud.draw({ canvas, x: x - cloud.width / 2 * scale, y: y - (cloud.height + (1 - opacity) * 100) * scale, scale })
  }
  const animator = new Animator(() => {
    simulator.simulate()
    canvas.context.clearRect(0, 0, canvas.width, canvas.height)
    canvas.context.imageSmoothingEnabled = false

    const floorY = canvas.height / 2
    const shiftX = canvas.width / 2 - cameraX
    offset = new Vector2(shiftX, floorY)
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
    if (dead.guard) {
      if (dead.guard.opacity > 0) {
        canvas.context.globalAlpha = dead.guard.opacity
        drawCloud(dead.guard, { x: maxX * scale + shiftX, y: floorY })
        canvas.context.globalAlpha = 1
      }
    } else {
      guard.draw({ // GUARD
        canvas,
        x: (maxX - guard.width / 2) * scale + shiftX,
        y: floorY - guard.height * scale,
        scale
      })
      guardHealth.draw({ canvas, x: maxX * scale + shiftX, y: floorY - 150 })
    }
    if (dead.sheep) {
      if (dead.sheep.opacity > 0) {
        canvas.context.globalAlpha = dead.sheep.opacity
        drawCloud(dead.sheep, { x: x * scale + shiftX, y: floorY })
        canvas.context.globalAlpha = 1
      } else {
        animator.stop()
        document.body.classList.add('show-death')
      }
    } else {
      if (combatMode) {
        sheepPropeller.position.set({ x: direction === 'left' ? x + 5 : x - 5 })
        sheepPropeller.draw({
          canvas,
          scale,
          offset,
          frame: sheepPropeller.active ? sheepPropeller.spritesheet.frame : 0
        })
        guardPropeller.draw({
          canvas,
          scale,
          offset,
          frame: guardPropeller.timeSinceLastShot(simulator.simulatedTime) < 0.05 ? 1 : 0
        })
      }
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
      sheepHealth.draw({ canvas, x: x * scale + shiftX, y: floorY - 150 })
    }
    particleManager.draw({ canvas, scale, offset })
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
