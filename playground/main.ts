import {createMoveMe, findOverlap} from "../src";
import {getRotation} from "../src/dom/htmlUtil";

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
    horizontalY: [controlRoot.offsetHeight / 10 * 8]
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
  snapping,
  controlRoot,
  disableFeatures: {
    resize: true
  }
});

w.moveMe1.addCollisionSibling(w.moveMe2);
w.moveMe2.addCollisionSibling(w.moveMe1);

createMoveMe(document.querySelector("#move-me")!, {
  controlRoot: controlRoot
});

w.reset = (v: number) => {
  w.moveMe.state.rotation = v || 0;
  w.moveMe.render();
}

w.findOverlap = findOverlap;

console.log(getRotation(el));

const text = document.body.appendChild(document.createTextNode("YO"));

w.addEventListener("mousemove", (e: PointerEvent) => {
  text.textContent = `${e.x} ${e.y}`;
});