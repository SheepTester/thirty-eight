export function mod (a, b) {
  return (a % b + b) % b
}

export function inRange (num, { min = -Infinity, max = Infinity} = {}) {
  return num >= min && num <= max
}
