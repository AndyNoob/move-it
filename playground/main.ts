import {moveMe} from "../src/html/moveMe";
import {getRotation} from "../src/html/htmlUtil";

const el = document.getElementById('rect')!;
let w = (window as any);

w.moveMe = moveMe(el, {
  initialState: {
    x: 200,
    y: 200,
    width: 200,
    height: 120,
    rotation: 95
  },
  onChange(next) {
    // console.log(next);
    localStorage.setItem('rect', JSON.stringify(next));
  },
});


w.reset = (v: number) => {
  w.moveMe.state.rotation = v || 0;
  w.moveMe.render();
}

let i = 0;

// setInterval(() => {
//   i = (i + 1) % 360;
//   window.reset(i);
// }, 50);

console.log(getRotation(el));

const text = document.body.appendChild(document.createTextNode("YO"));

w.addEventListener("mousemove", (e: PointerEvent) => {
  text.textContent = `${e.x} ${e.y}`;
});