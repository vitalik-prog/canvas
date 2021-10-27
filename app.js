import { getChartData } from './data.js'

const WIDTH = 600
const HEIGHT = 200
const PADDING = 40
const DPI_WIDTH = WIDTH * 2
const DPI_HEIGHT = HEIGHT * 2
const VIEW_HEIGHT = DPI_HEIGHT - PADDING * 2
const ROWS_COUNT = 5
const VIEW_WIDTH = DPI_WIDTH
const CIRCLE_RADIUS = 8

const tgChart = chart(document.getElementById('chart'), getChartData())
tgChart.init()

function chart(canvas, data) {
  const ctx = canvas.getContext('2d')
  let raf
  canvas.style.width = WIDTH + 'px'
  canvas.style.height = HEIGHT + 'px'
  canvas.width = DPI_WIDTH
  canvas.height = DPI_HEIGHT

  const proxy = new Proxy({}, {
    set(...args) {
      const result = Reflect.set(...args)
      raf = requestAnimationFrame(paint)
      return result
    }
  })

  function paint() {
    clearCanvas()
    const [yMin, yMax] = computeBoundaries(data)
    const yRatio = VIEW_HEIGHT / (yMax - yMin)
    const xRatio = VIEW_WIDTH / (data.columns[0].length - 2)

    const yData = data.columns.filter(col => data.types[col[0]] === 'line')
    const xData = data.columns.filter(col => data.types[col[0]] !== 'line')[0]

    yData.map(toCoords(xRatio, yRatio)).forEach((coords, i) => {
      const color = data.colors[yData[i][0]]
      line(ctx, coords, { color })

      for (const [x, y] of coords) { // painting circle on charts lines
        if (isOver(proxy.mouse, x, coords.length)) {
          circle(ctx, [x, y], color)
          break
        }
      }
    })

    yAxis(ctx, yMax, yMin)
    xAxis(ctx, xData, xRatio, proxy)
  }

  function mousemove({ clientX, clientY }) {
    const { left } = canvas.getBoundingClientRect() // get canvas coords
    proxy.mouse = {
      x: (clientX - left) * 2
    }
  }

  function mouseleave() {
    proxy.mouse = null
  }

  canvas.addEventListener('mousemove', mousemove)
  canvas.addEventListener('mouseleave', mouseleave)

  function clearCanvas() {
    ctx.clearRect(0, 0, DPI_WIDTH, DPI_HEIGHT)
  }

  return {
    init() {
      paint()
    },
    destroy() {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('mousemove', mousemove)
      canvas.removeEventListener('mouseleave', mouseleave)
    }
  }
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
  ctx.lineWidth = 1
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

function xAxis(ctx, data, xRatio, { mouse }) {
  // === painting X axis markup
  const colsCount = 6
  const step = Math.round(data.length / colsCount)
  ctx.beginPath()
    for (let i = 1; i < data.length; i++) {
      const x = i * xRatio
      if ((i - 1) % step === 0) {
        const text = toDate(data[i])
        ctx.fillText(text.toString(), x, DPI_HEIGHT - 10)
      }

      if (isOver(mouse, x, data.length)) {
        ctx.save() // saving previous canvas
        ctx.moveTo(x, PADDING / 2)
        ctx.lineTo(x, DPI_HEIGHT - PADDING)
        ctx.restore() // restore canvas
      }
    }
    ctx.stroke()
    ctx.closePath()
  // ===
}

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

function circle(ctx, [x, y], color) {
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.fillStyle = '#fff'
  ctx.arc(x, y, CIRCLE_RADIUS, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.closePath()
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

function isOver(mouse, x, length) {
  if (!mouse) {
    return false
  }
  const width = DPI_WIDTH / length
  return Math.abs(x - mouse.x) < width / 2
}
