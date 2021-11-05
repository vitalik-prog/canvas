import {getChartData} from "./data";
import {chart} from "./chart";
import {checkbox} from "./checkbox";
import {filterData} from "./helpers";

const data = getChartData()
checkbox(document.querySelector('[data-el="checkbox"]'), data)
const colors = data.colors

export const dataChoice = (event) => {
  let data = getChartData()
  if (event) {
    const el = event.target
    const attribute = el.getAttribute('data-el')

    const inputEl = document.getElementById(attribute)
    if (inputEl.hasAttribute('checked')) {
      el.style.backgroundColor = 'transparent'
      inputEl.removeAttribute('checked')
    } else {
      el.style.backgroundColor = attribute === 'joined' ? colors.y0 : colors.y1
      inputEl.setAttribute('checked', 'checked')
    }
  }
  if (!document.getElementById('joined').hasAttribute('checked')) {
    data = filterData(data, 'y0')
  }
  if (!document.getElementById('detached').hasAttribute('checked')) {
    data = filterData(data, 'y1')
  }

  const tgChart = chart(document.getElementById('chart'), data)
  tgChart.init()
}

dataChoice()
