/**
 * The simulator likes to deal with times in seconds.
 */
export class Simulator {
  constructor ({
    simulations = [],
    maxElapsedTime = 0.5,
    stepTime = null
  } = {}) {
    this.simulations = simulations
    this.maxElapsedTime = maxElapsedTime
    this.stepTime = stepTime

    this._totalTime = 0
    this._simulatedTime = 0
    this._lastTime = 0
  }

  simulate () {
    const now = Date.now()
    const elapsedTime = (now - this._lastTime) / 1000
    this._lastTime = now

    if (elapsedTime <= this.maxElapsedTime) {
      this._totalTime += elapsedTime

      const stepTime = this.stepTime || elapsedTime
      while (this._simulatedTime < this._totalTime) {
        this._simulatedTime += stepTime
        for (const simulation of this.simulations) {
          simulation.simulate(stepTime, this._simulatedTime)
        }
      }
    }
    return this
  }
}
