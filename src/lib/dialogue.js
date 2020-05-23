import { Element } from './element.js'

// 2 lines of double-spaced 20px text
const PORTION_HEIGHT = 2 * 2 * 20

export class Dialogue extends Element {
  constructor (text) {
    super()
    this.parentClass = 'dialogue-parent'

    this._initElems()

    this.speaking = false
    this.section = 0
  }

  _initElems () {
    const speakerName = document.createElement('h2')
    speakerName.className = 'speaker-name sans-nouveaux'

    const speakerImage = document.createElement('img')
    speakerImage.className = 'speaker-image pixelated'

    const dialogueText = document.createElement('div')
    dialogueText.className = 'dialogue-text sans-nouveaux'

    const dialogueTextWrapper = document.createElement('div')
    dialogueTextWrapper.className = 'dialogue-text-wrapper'
    dialogueTextWrapper.appendChild(dialogueText)

    const dialogueHintUp = document.createElement('span')
    dialogueHintUp.className = 'dialogue-hint dialogue-hint-up'
    dialogueHintUp.textContent = 'Press UP ARROW to scroll up.'

    const dialogueHintDown = document.createElement('span')
    dialogueHintDown.className = 'dialogue-hint dialogue-hint-down'
    dialogueHintDown.textContent = 'Press ENTER to continue.'

    const dialogueHintWrapper = document.createElement('div')
    dialogueHintWrapper.className = 'dialogue-hint-wrapper sans-nouveaux'
    dialogueHintWrapper.appendChild(dialogueHintUp)
    dialogueHintWrapper.appendChild(dialogueHintDown)

    const dialogueRightSide = document.createElement('div')
    dialogueRightSide.className = 'dialogue-right-side'
    dialogueRightSide.appendChild(dialogueTextWrapper)
    dialogueRightSide.appendChild(dialogueHintWrapper)

    const dialogueBody = document.createElement('div')
    dialogueBody.className = 'dialogue-body'
    dialogueBody.appendChild(speakerImage)
    dialogueBody.appendChild(dialogueRightSide)

    const wrapper = document.createElement('div')
    wrapper.className = 'dialogue dialogue-can-go-down'
    wrapper.appendChild(speakerName)
    wrapper.appendChild(dialogueBody)

    this._elems = { speakerName, speakerImage, dialogueText, wrapper }
  }

  get wrapper () {
    return this._elems.wrapper
  }

  setSpeaker ({ name, image }) {
    const { speakerName, speakerImage } = this._elems
    speakerName.textContent = name
    speakerImage.src = image
    return this
  }

  speak (text, speaker) {
    if (this.speaking) {
      throw new Error('cannot')
    }

    if (speaker) this.setSpeaker(speaker)

    this._elems.dialogueText.textContent = text
    this.setSection(0)
    this.speaking = new Promise(resolve => (this._onDone = resolve)).then(() => {
      this.speaking = false
    })

    return this.speaking
  }

  measureSections () {
    const { height } = this._elems.dialogueText.getBoundingClientRect()
    this.sections = Math.ceil(height / PORTION_HEIGHT)
    return this
  }

  async resize (then = Promise.resolve()) {
    if (this.speaking) this.measureSections()
    await then
    return this
  }

  setSection (section) {
    if (section < 0) section = 0
    if (section >= this.sections) {
      throw new Error('Too far down!')
    }
    this.section = section
    const { dialogueText, wrapper } = this._elems
    dialogueText.style.top = -section * PORTION_HEIGHT + 'px'
    if (section > 0) {
      wrapper.classList.add('dialogue-can-go-up')
    } else {
      wrapper.classList.remove('dialogue-can-go-up')
    }
    return this
  }

  up () {
    this.setSection(this.section - 1)
    return false
  }

  down () {
    if (this.section >= this.sections - 1) {
      this._onDone()
    } else {
      this.setSection(this.section + 1)
    }
    return this
  }
}
