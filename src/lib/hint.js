export function showHint (hint) {
  const p = document.createElement('p')
  p.className = 'sans-nouveaux hint-wrapper'
  const span = document.createElement('span')
  span.className = 'hint'
  span.textContent = hint
  p.appendChild(span)
  document.body.appendChild(p)

  setTimeout(() => {
    document.body.removeChild(p)
  }, 5000)
}
