const WIDTH = 40
const HEIGHT = 10

export class HealthBar {
  constructor (maxHealth) {
    this.maxHealth = maxHealth
    this.health = maxHealth
  }

  damage (damage) {
    this.health -= damage
    if (this.health < 0) this.health = 0
    return this
  }

  heal (health) {
    this.health += health
    if (this.health > this.maxHealth) this.health = this.maxHealth
    return this
  }

  isDead () {
    return this.health <= 0
  }

  draw ({ canvas: { context: c }, x, y, invisibleIfFull = true }) {
    if (!invisibleIfFull || this.health < this.maxHealth) {
      const rect = [x - WIDTH / 2, y, WIDTH, HEIGHT]
      c.fillStyle = 'white'
      c.fillRect(...rect)
      c.fillStyle = 'red'
      c.fillRect(x - WIDTH / 2, y, WIDTH * this.health / this.maxHealth, HEIGHT)
      c.strokeStyle = 'black'
      c.lineWidth = 2
      c.strokeRect(...rect)
    }
    return this
  }
}
