import {createMoveMe} from "../src";
import {getRotation} from "../src/dom/htmlUtil";
import type {RectState} from "../src";

const el = document.getElementById('rect')!;
const el1 = document.getElementById('rect2')!;
let w = (window as any);

const controlRoot = el.parentElement!;
const snapping = {
  rotation: {
    anglesDeg: [0, 180],
    threshold: 5
  },
  grid: {
    displayThreshold: 20,
    threshold: 5,
    verticalX: [controlRoot.offsetWidth / 2],
    horizontalY: [controlRoot.offsetWidth / 10 * 9]
  }
};

w.moveMe1 = createMoveMe(el, {
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
  snapping,
  controlRoot
});

w.moveMe2 = createMoveMe(el1, {
  initialState: {
    x: 400,
    y: 400,
    width: 150,
    height: 120,
    rotation: 299
  },
  onChange(next: RectState) {
    localStorage.setItem('rect', JSON.stringify(next));
  },
  snapping,
  controlRoot
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