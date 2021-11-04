import {
  toDate,
  isOver,
  line,
  circle,
  computeBoundaries,
  css,
  toCoords,
  computeYRatio,
  computeXRatio,
  getSlicedGapColumns
} from './helpers'
import {tooltip} from "./tooltip";
import {sliderChart} from "./slider";

const WIDTH = 600
const HEIGHT = 200
const PADDING = 40
const DPI_WIDTH = WIDTH * 2
const DPI_HEIGHT = HEIGHT * 2
const VIEW_HEIGHT = DPI_HEIGHT - PADDING * 2
const ROWS_COUNT = 5
const VIEW_WIDTH = DPI_WIDTH
const SPEED = 300

export function chart(root, data) {
  const canvas = root.querySelector('[data-el="main"]')
  const tip = tooltip(root.querySelector('[data-el="tooltip"]'))
  const slider = sliderChart(root.querySelector('[data-el="slider"]'), data, DPI_WIDTH)
  const ctx = canvas.getContext('2d')
  let raf
  let prevMax
  css(canvas, {
    width: WIDTH + 'px',
    height: HEIGHT + 'px'
  })
  canvas.width = DPI_WIDTH
  canvas.height = DPI_HEIGHT
  const proxy = new Proxy({}, {
    set(...args) {
      const result = Reflect.set(...args)
      raf = requestAnimationFrame(paint)
      return result
    }
  })

  function getMax(yMax) {
    const step = (yMax - prevMax) / SPEED

    if (proxy.max < yMax) {
      proxy.max += step
    } else if (proxy.max > yMax) {
      proxy.max = yMax
      prevMax = yMax
    }

    return proxy.max
  }

  function translateX(length, xRatio, left) {
    return -1 * Math.round((length * left * xRatio) / 100 )
  }

  function paint() {
    clearCanvas()
    const length = data.columns[0].length
    const leftIndex = Math.round(length * proxy.pos[0] / 100)
    const rightIndex = Math.round(length * proxy.pos[1] / 100)

    const columns = getSlicedGapColumns(data, leftIndex, rightIndex)

    const [yMin, yMax] = computeBoundaries({ columns, types: data.types })

    if (!prevMax) {
      prevMax = yMax
      proxy.max = yMax
    }

    const max = getMax(yMax)

    const yRatio = computeYRatio(VIEW_HEIGHT, max, yMin)
    const xRatio = computeXRatio(VIEW_WIDTH, columns[0].length)

    const translate = translateX(data.columns[0].length, xRatio, proxy.pos[0])

    const yData = data.columns.filter(col => data.types[col[0]] === 'line')
    const xData = data.columns.filter(col => data.types[col[0]] !== 'line')[0]
    const slicedYData = columns.filter(col => data.types[col[0]] === 'line')
    const slicedXData = columns.filter(col => data.types[col[0]] !== 'line')[0]

    yData.map(toCoords(xRatio, yRatio, DPI_HEIGHT, PADDING, yMin)).forEach((coords, i) => {
      const color = data.colors[yData[i][0]]
      line(ctx, coords, { color, translate })
    })

    slicedYData.map(toCoords(xRatio, yRatio, DPI_HEIGHT, PADDING, yMin)).forEach((coords, i) => {
      const color = data.colors[yData[i][0]]

      for (const [x, y] of coords) { // painting circle on charts lines
        if (isOver(proxy.mouse, x, coords.length, DPI_WIDTH)) {
          circle(ctx, [x, y], color)
          break
        }
      }
    })

    yAxis(yMin, max)
    xAxis(slicedXData, slicedYData, xRatio)
  }

  function xAxis(slicedXData, slicedYData, xRatio) {
    // === painting X axis markup
    const colsCount = 6
    const step = Math.round(slicedXData.length / colsCount)
    ctx.beginPath()
    for (let i = 1; i < slicedXData.length; i++) {
      const x = i * xRatio
      if ((i - 1) % step === 0) {
        const text = toDate(slicedXData[i])
        ctx.fillText(text.toString(), x, DPI_HEIGHT - 10)
      }

      if (isOver(proxy.mouse, x, slicedXData.length, DPI_WIDTH)) {
        ctx.save() // saving previous canvas
        ctx.moveTo(x, PADDING / 2)
        ctx.lineTo(x, DPI_HEIGHT - PADDING)
        ctx.restore() // restore canvas

        tip.show(proxy.mouse.tooltip, {
          title: toDate(slicedXData[i]),
          items: slicedYData.map(col => ({
            color: data.colors[col[0]],
            name: data.names[col[0]],
            value: col[i + 1]
          }))
        })
      }
    }
    ctx.stroke()
    ctx.closePath()
    // ===
  }

  function yAxis(yMin, yMax) {
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

  slider.subscribe(pos => {
    proxy.pos = pos
  })

  canvas.addEventListener('mousemove', mousemove)
  canvas.addEventListener('mouseleave', mouseleave)

  function mousemove({ clientX, clientY }) {
    const { left, top } = canvas.getBoundingClientRect() // get canvas coords
    proxy.mouse = {
      x: (clientX - left) * 2,
      tooltip: {
        left: clientX - left,
        top: clientY - top
      }
    }
  }

  function mouseleave() {
    proxy.mouse = null
    tip.hide()
  }

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
