import { getChartData } from './data.js'

const WIDTH = 600
const HEIGHT = 200
const PADDING = 40
const DPI_WIDTH = WIDTH * 2
const DPI_HEIGHT = HEIGHT * 2
const VIEW_HEIGHT = DPI_HEIGHT - PADDING * 2
const ROWS_COUNT = 5
const VIEW_WIDTH = DPI_WIDTH

function chart(canvas, data) {
  const ctx = canvas.getContext('2d')
  canvas.style.width = WIDTH + 'px'
  canvas.style.height = HEIGHT + 'px'
  canvas.width = DPI_WIDTH
  canvas.height = DPI_HEIGHT

  const [yMin, yMax] = computeBoundaries(data)
  const yRatio = VIEW_HEIGHT / (yMax - yMin)
  const xRatio = VIEW_WIDTH / (data.columns[0].length - 2)

  const yData = data.columns.filter(col => data.types[col[0]] === 'line')
  const xData = data.columns.filter(col => data.types[col[0]] !== 'line')[0]

  yData.map(toCoords(xRatio, yRatio)).forEach((coords, i) => {
    const color = data.colors[yData[i][0]]
    line(ctx, coords, { color })
  })

  yAxis(ctx, yMax, yMin)
  xAxis(ctx, xData, xRatio)
}

function toCoords(xRatio, yRatio) {
  return (col) => col.map((y, i) => [
    Math.floor((i - 1) * xRatio),
    Math.floor(DPI_HEIGHT - PADDING - y * yRatio)
  ]).filter((_,i) => i !== 0)
}

function yAxis(ctx, yMax, yMin) {
  // === painting Y axis markup
  const step = VIEW_HEIGHT / ROWS_COUNT
  const textStep = (yMax - yMin) / ROWS_COUNT
  ctx.beginPath()
  ctx.strokeStyle = '#bbb'
  ctx.font = 'normal 20px Helvetica,sans-serif'
  ctx.fillStyle = '#96a2aa'
  for (let i = 1; i <= ROWS_COUNT; i++) {
    const y = step * i
    const text = Math.round(yMax - textStep * i)
    ctx.fillText(text.toString(), 5, y + PADDING - 10)
    ctx.moveTo(0, y + PADDING) // moving start point according coords
    ctx.lineTo(DPI_WIDTH, y + PADDING)
  }
  ctx.stroke()
  ctx.closePath()
  // ===
}

function xAxis(ctx, data, xRatio) {
  // === painting X axis markup
  const colsCount = 6
  const step = Math.round(data.length / colsCount)
  ctx.beginPath()
    for (let i = 1; i < data.length; i += step) {
      const text = toDate(data[i])
      const x = i * xRatio
      ctx.fillText(text.toString(), x, DPI_HEIGHT - 10)
    }
    ctx.closePath()
  // ===
}

chart(document.getElementById('chart'), getChartData())

function line(ctx, coords, { color }) {
  ctx.beginPath() // command inform canvas that painting will be here
  ctx.lineWidth = 4
  ctx.strokeStyle = color
  for (const [x ,y] of coords) {
    ctx.lineTo(x, y) // command painting line in buffer
  }
  ctx.stroke() // command connecting dots with lines from buffer
  ctx.closePath() // command inform canvas that painting stopped
}

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

function toDate(timestamp) {
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
