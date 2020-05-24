import { Vector2 } from './vector2.js'
import * as Box from './box.js'

class Propeller {
  constructor (manager, {
    spritesheet,
    // Position of the anchor
    position = new Vector2(),
    // Offset of the top left corner from the anchor for rendering the propeller (will be rotated)
    offset = new Vector2(),
    // Angle of the propeller
    angle = 0,
    // Offset from the anchor from where the particles will be spawned (will be rotated)
    source = new Vector2(),
    // The speed of the particles (will be rotated)
    speed = new Vector2(0, 1),
    maxAge = 10
    cooldown = 1,
    auto = true,
  } = {}) {
    this.manager = manager
    this.spritesheet = spritesheet
    this.position = position
    this.offset = offset
    this.angle = angle
    this.source = source
    this.speed = speed
    this.maxAge = maxAge
    this.cooldown = cooldown
    this.auto = auto

    this.active = false
    this._lastShot = 0
  }

  attemptShoot (time) {
    if (time > this._lastShot + his.cooldown) {
      this.manager.addParticle({
        position: this.source.clone().rotate(this.angle).add(this.position),
        velocity: this.speed.clone().rotate(this.angle),
        propeller: this
      })
      this._lastShot = time
    }
    return this
  }

  simulate (_, totalTime) {
    if (this.auto && this.active) {
      this.attemptShoot(totalTime)
    }
    return this
  }

  draw ({ canvas, scale, frame }) {
    const { context: canvas } = canvas
    c.save()
    c.translate(...this.position)
    c.rotate(this.angle)
    c.translate(...this.position.clone().scale(-1))
    this.spritesheet.draw({ canvas, ...this.offset, scale, frame, alwaysDraw: true })
    c.restore()
    return this
  }
}

const PARTICLE_SIZE = 2

export class ParticleManager {
  constructor ({
    bounds = Box.universe()
  } = {}) {
    this.bounds = bounds
    this._particles = new Set()
    this._propellers = new Set()
  }

  createPropeller (options) {
    const propeller = new Propeller(this, options)
    this._propellers.add(propeller)
    return propeller
  }

  addParticle (particle) {
    this._particles.add(particle)
    return this
  }

  simulate (elapsedTime, totalTime) {
    for (const particle of this._particles) {
      particle.position.add(particle.velocity.clone().scale(elapsedTime))
      if (!this.bounds.contains(particle.position)) {
        this._particles.delete(particle)
      }
    }
    for (const propeller of this._propellers) {
      propeller.simulate(elapsedTime, totalTime)
    }
    return this
  }

  draw ({
    canvas: { context: c, width, height },
    scale = 1,
    // Visual offset
    offset = new Vector2(),
    // Space around the edges of the screen where if the particle is in that space
    // it still gets rendered (in rendered/visual px)
    margin = 10
  }) {
    c.save()
    c.fillStyle = 'red'
    const visibleBox = Box.fromDimensions({
      x: -margin,
      y: -margin,
      width: width + margin,
      height: height + margin
    }).offset(offset)
    for (const particle of this._particles) {
      const corner = particle.position.clone()
        .add({ x: -PARTICLE_SIZE / 2, y: -PARTICLE_SIZE / 2 })
        .scale(scale)
        .add(offset)
      if (visibleBox.contains(corner)) {
        c.fillRect(...corner, PARTICLE_SIZE * scale, PARTICLE_SIZE * scale)
      }
    }
    c.restore()
    return this
  }
}
