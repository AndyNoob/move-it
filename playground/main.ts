import {createMoveMe} from "../src/index.js";
import {getRotation} from "../src/dom/htmlUtil.js";
import type {RectState} from "../src/index.js";

const el = document.getElementById('rect')!;
let w = (window as any);

w.moveMe = createMoveMe(el, {
  initialState: {
    x: 200,
    y: 200,
    width: 200,
    height: 120,
    rotation: 75
  },
  onChange(next: RectState) {
    localStorage.setItem('rect', JSON.stringify(next));
  },
  snapping: {
    rotation: {
      anglesDeg: [0, 180],
      threshold: 5
    },
    grid: {
      displayThreshold: 20,
      threshold: 5,
      verticalX: [window.innerWidth / 2],
      horizontalY: [window.innerHeight / 10 * 9]
    }
  },
  controlRoot: el.parentElement!
});


w.reset = (v: number) => {
  w.moveMe.state.rotation = v || 0;
  w.moveMe.render();
}

console.log(getRotation(el));

const text = document.body.appendChild(document.createTextNode("YO"));

w.addEventListener("mousemove", (e: PointerEvent) => {
  text.textContent = `${e.x} ${e.y}`;
});