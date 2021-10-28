export function toDate(timestamp) {
  const shortMonths = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const date = new Date(timestamp)
  return `${shortMonths[date.getMonth()]} ${date.getDate()}`
}

export function isOver(mouse, x, length, DPI_WIDTH) {
  if (!mouse) {
    return false
  }
  const width = DPI_WIDTH / length
  return Math.abs(x - mouse.x) < width / 2
}


export function line(ctx, coords, { color }) {
  ctx.beginPath() // command inform canvas that painting will be here
  ctx.lineWidth = 4
  ctx.strokeStyle = color
  for (const [x ,y] of coords) {
    ctx.lineTo(x, y) // command painting line in buffer
  }
  ctx.stroke() // command connecting dots with lines from buffer
  ctx.closePath() // command inform canvas that painting stopped
}

export function circle(ctx, [x, y], color) {
  const CIRCLE_RADIUS = 8
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.fillStyle = '#fff'
  ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.closePath()
}

export
function computeBoundaries({ columns, types }) {
  let min
  let max
  columns.forEach(col => {
    if (types[col[0]] !== 'line') {
      return
    }
    if (typeof min !== 'number') min = col[1]
    if (typeof max !== 'number') max = col[1]

    if (min > col[1]) min = col[1]
    if (max < col[1]) max = col[1]

    for (let i = 2; i < col.length; i++) {
      if (min > col[i]) min = col[i]
      if (max < col[i]) max = col[i]
    }
  })

  return [min, max]
}

export function css(el, styles = {}) {
  Object.assign(el.style, styles)
}
