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
  controlRoot: controlRoot,
  doResize: true,
  snapping: {
    grid: {
      displayThreshold: 10,
      threshold: 4,
      verticalX: [0.5],
      horizontalY: [0.9]
    }
  }
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

const lines = [
  "To be or not to be, that is the question. Probably. Maybe?",
  "I forgot to bring my pants today.",
  "Did you know? You're the dumbest person I know.",
  "Go to the principals office... actually scratch that just go entertain yourself and get out of my sight.",
  "Don't let a good day distract you from the failure you've become.",
  "I got inflammation. I am finna go spread some misinformation."
];

const dialoguesEl = document.querySelector("#dialogues")! as HTMLElement;
const dialoguesMoving = createMoveMe(dialoguesEl, {
  doResize: true,
  controlRoot,
  snapping: {
    grid: {
      displayThreshold: 10,
      threshold: 4,
      verticalX: [0.5],
      horizontalY: [0.9]
    }
  },
  autoSize: true
});

console.log(dialoguesMoving.getState());

let counter = 0;

setInterval(() => {
  const state = dialoguesMoving.getState(true, true);
  dialoguesEl.textContent = lines[counter++ % lines.length]!;
  console.log(state);
}, 3000);