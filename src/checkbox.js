import {css} from "./helpers";
import {dataChoice} from "./app";

const checkboxBlockTemplate = (colors) => `
 <div class="tg-chart-checkbox">
    <label for="joined">Joined<span style="background-color: ${colors.y0}" data-el="joined"></span><input id="joined" checked="checked" type="checkbox" name="checkbox" value="value"></label>
 </div>
 <div class="tg-chart-checkbox">
    <label for="left">Left<span style="background-color: ${colors.y1}" data-el="detached"></span><input id="detached" checked="checked" type="checkbox" name="checkbox" value="value"></label>
 </div>
`

export function checkbox(el, data) {

  el.innerHTML = ''
  el.insertAdjacentHTML("afterbegin", checkboxBlockTemplate(data.colors))
  const joinedElement = document.querySelector('[data-el="joined"]')
  const leftElement = document.querySelector('[data-el="detached"]')
  joinedElement.addEventListener('click', (event) => dataChoice(event))
  leftElement.addEventListener('click', (event) => dataChoice(event))
}
