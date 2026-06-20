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
    rotation: 0
  },
  onChange(next) {
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
  controlRoot: document.body
});


w.reset = (v: number) => {
  w.moveMe.state.rotation = v || 0;
  w.moveMe.render();
}

// let i = 0;

// setInterval(() => {
//   i = (i + 1) % 360;
//   window.reset(i);
// }, 50);

console.log(getRotation(el));

const text = document.body.appendChild(document.createTextNode("YO"));

w.addEventListener("mousemove", (e: PointerEvent) => {
  text.textContent = `${e.x} ${e.y}`;
});