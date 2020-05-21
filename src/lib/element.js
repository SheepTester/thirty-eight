// Abstract class: requires `wrapper` and `parentClass`
export class Element {
  constructor () {
    this.parent = null
  }

  addTo (parent) {
    if (this.parent) {
      this.parent.removeChild(this.wrapper)
      this.parent.classList.remove(this.parentClass)
    }
    this.parent = parent
    if (parent) {
      parent.appendChild(this.wrapper)
      parent.classList.add(this.parentClass)
    }
    return this
  }

  remove () {
    return this.addTo(null)
  }
}
