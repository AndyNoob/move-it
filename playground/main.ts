import {moveMe} from "../src/html/moveMe";
import {getRotation} from "../src/html/htmlUtil";

const el = document.getElementById('rect')!;

window.moveMe = moveMe(el, {
  initialState: {
    x: 200,
    y: 200,
    width: 200,
    height: 120,
    rotation: 0
  },
  onChange(next) {
    console.log(next);
    localStorage.setItem('rect', JSON.stringify(next));
  },
});

window.reset = (v: number) => {
  window.moveMe.state.rotation = v || 0;
  window.moveMe.render();
}

let i = 0;

// setInterval(() => {
//   i = (i + 1) % 360;
//   window.reset(i);
// }, 50);

console.log(getRotation(el));

const text = document.body.appendChild(document.createTextNode("YO"));

window.addEventListener("mousemove", e => {
  text.textContent = `${e.x} ${e.y}`;
});