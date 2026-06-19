import {getControlBox} from "../html/htmlUtil";
import {Moving} from "../html/moveMe";

export interface Controls {
  container: HTMLElement,
  lines: {
    top: HTMLElement,
    bottom: HTMLElement,
    left: HTMLElement,
    right: HTMLElement,
    rotate: HTMLElement
  },
  dots: {
    topLeft: HTMLElement,
    topRight: HTMLElement,
    bottomLeft: HTMLElement,
    bottomRight: HTMLElement,
    rotate: HTMLElement,
  }
  destroy: () => void,
  getDotDesignation: (el: HTMLElement) => DotDesignation | null,
  getLineDesignation: (el: HTMLElement) => Exclude<LineDesignation, "rotate"> | null,
}

export const lineDesignations = {
  top: {
    name: "top",
    direction: { x: 0, y: -1 },
    cardinal: true
  },

  bottom: {
    name: "bottom",
    direction: { x: 0, y: 1 },
    cardinal: true
  },

  left: {
    name: "left",
    direction: { x: -1, y: 0 },
    cardinal: true
  },

  right: {
    name: "right",
    direction: { x: 1, y: 0 },
    cardinal: true
  },

  rotate: {
    name: "rotate",
    direction: { x: 0, y: 0 },
    cardinal: false
  },
};
export const dotDesignations = {
  topLeft: {
    name: "topLeft",
    direction: { x: -1, y: -1 },
    cardinal: false
  },

  topRight: {
    name: "topRight",
    direction: { x: 1, y: -1 },
    cardinal: false
  },

  bottomLeft: {
    name: "bottomLeft",
    direction: { x: -1, y: 1 },
    cardinal: false
  },

  bottomRight: {
    name: "bottomRight",
    direction: { x: 1, y: 1 },
    cardinal: false
  },

  rotate: {
    name: "rotate",
    direction: { x: 0, y: 0 },
    cardinal: false
  },
};

export type LineDesignation =
  typeof lineDesignations[keyof typeof lineDesignations];

export type DotDesignation =
  typeof dotDesignations[keyof typeof dotDesignations];

const LINE_SIZE = 1;
const DOT_SIZE = 5;
const ROTATE_WIDTH = 20;

export function updateControls(el: HTMLElement, moving: Moving, selected = true): Controls {
  const target = el.dataset.moveItId!;
  const box = getControlBox();
  const container: HTMLElement =
    document.querySelector(`.container[data-move-it-target=${target}]`) ||
    box.appendChild(document.createElement("div"));
  container.style.visibility = selected ? "visible" : "hidden";
  container.classList.contains("container") || container.classList.add("container");
  container.dataset.moveItTarget = target;
  const state = moving.state;
  container.style.transformOrigin = `${el.offsetWidth / 2}px ${el.offsetHeight / 2}px`;
  container.style.transform = `
    translate(${state.x - LINE_SIZE / 2}px, ${state.y - LINE_SIZE / 2}px)
    rotate(${state.rotation}deg)
  `;
  return {
    container,
    lines: {
      top: getLine(container, target, lineDesignations.top, moving),
      bottom: getLine(container, target, lineDesignations.bottom, moving),
      left: getLine(container, target, lineDesignations.left, moving),
      right: getLine(container, target, lineDesignations.right, moving),
      rotate: getLine(container, target, lineDesignations.rotate, moving)
    },
    dots: {
      topLeft: getDot(container, target, dotDesignations.topLeft, moving),
      topRight: getDot(container, target, dotDesignations.topRight, moving),
      bottomLeft: getDot(container, target, dotDesignations.bottomLeft, moving),
      bottomRight: getDot(container, target, dotDesignations.bottomRight, moving),
      rotate: getDot(container, target, dotDesignations.rotate, moving)
    },
    destroy: () => {
      container.replaceChildren();
      container.remove();
    },
    getDotDesignation: (checking) => {
      const key = checking.dataset.moveItDesignation;
      if (!(key && key in dotDesignations)) return null;
      return checking.matches(`.dot[data-move-it-target=${target}]`) ?
        dotDesignations[key as keyof typeof dotDesignations] : null;
    },
    getLineDesignation: (checking) => {
      const key = checking.dataset.moveItDesignation;
      if (!(key && key in lineDesignations)) return null;
      if (!checking.matches(`.line[data-move-it-target=${target}]`)) return null;
      if (key === "rotate") return null;
      return lineDesignations[key as keyof typeof lineDesignations] as Exclude<LineDesignation, "rotate">;
    }
  };
}

function getLine(box: HTMLElement, target: string, designation: LineDesignation, moving: Moving) {
  const el = (box.querySelector(`.line[data-move-it-target=${target}][data-move-it-designation="${designation.name}"]`)
    || box.appendChild(document.createElement("div"))) as HTMLElement;

  el.dataset.moveItTarget = target;
  el.dataset.moveItDesignation = `${designation.name}`;
  el.classList.contains("line") || el.classList.add("line");

  // const state = moving.state;
  const targetEl = moving.element;

  switch (designation.name) {
    case "bottom":
      el.style.transform = `translate(0, ${targetEl.offsetHeight}px)`
    case "top":
      el.style.width = `${targetEl.offsetWidth}px`;
      el.style.height = `${LINE_SIZE}px`;
      break;
    case "right":
      el.style.transform = `translate(${targetEl.offsetWidth}px, 0)`
    case "left":
      el.style.width = `${LINE_SIZE}px`;
      el.style.height = `${targetEl.offsetHeight}px`;
      break;
    case "rotate":
      el.style.width = `${ROTATE_WIDTH}px`;
      el.style.height = `${LINE_SIZE}px`;
      el.style.transform = `translate(${targetEl.offsetWidth}px, ${targetEl.offsetHeight / 2}px)`
      break;
  }

  // const halfWidth = targetEl.offsetWidth / 2;
  // const halfHeight = targetEl.offsetHeight / 2;
  // const targetAngle = degToRad(state.rotation) + Math.PI;
  //
  // let {x, y} = state;
  // let centerX = x + halfWidth;
  // let centerY = y + halfHeight;
  // let newX = centerX, newY = centerY;
  //
  // /*
  //
  //     tracking the location of the x's
  //     o is the pivot of the rect
  //
  //     |------------x------------|
  //     |                         |
  //     x            o            |
  //     |                         |
  //     |-------------------------|
  //
  //
  //  */
  //
  // switch (designation) {
  //   case "top":
  //   case "bottom":
  //   case "rotate":
  //     newX += halfHeight * Math.cos(targetAngle + Math.PI / 2) - halfWidth;
  //     newY += halfHeight * Math.sin(targetAngle + Math.PI / 2);
  //     break;
  //   case "left":
  //   case "right":
  //     newX += halfWidth * Math.cos(targetAngle);
  //     newY += halfWidth * Math.sin(targetAngle) - halfHeight;
  //     break;
  // }
  //
  // let dx = newX - x;
  // let dy = newY - y;
  //
  // if (designation === "rotate") {
  //   el.style.transform = `
  //     translate(${state.x + (targetEl.offsetWidth - ROTATE_WIDTH) / 2}px, ${state.y}px)
  //     translate(${dx}px, ${dy}px)
  //     rotate(${state.rotation}deg)
  //     translate(${halfWidth + ROTATE_WIDTH / 2}px, ${halfHeight}px)
  //   `
  // } else {
  //   el.style.transform = `
  //     translate(${state.x}px, ${state.y}px)
  //     translate(${dx}px, ${dy}px)
  //     rotate(${state.rotation}deg)
  //   `;
  //
  //   if (designation === "right") el.style.transform += ` translate(${targetEl.offsetWidth}px, 0)`;
  //   if (designation === "bottom") el.style.transform += ` translate(0, ${targetEl.offsetHeight}px)`;
  // }
  return el;
}

function getDot(box: HTMLElement, target: string, designation: DotDesignation, moving: Moving) {
  const el = (box.querySelector(`.dot[data-move-it-target=${target}][data-move-it-designation="${designation.name}"]`)
    || box.appendChild(document.createElement("div"))) as HTMLElement;
  el.dataset.moveItTarget = target;
  el.dataset.moveItDesignation = `${designation.name}`;
  el.classList.contains("dot") || el.classList.add("dot");

  el.style.width = `${DOT_SIZE}px`;
  el.style.height = `${DOT_SIZE}px`;

  const targetEl = moving.element;

  switch (designation.name) {
    case "topLeft":
      el.style.transform = `translate(${-DOT_SIZE / 2}px, ${-DOT_SIZE / 2}px)`;
      break;
    case "topRight":
      el.style.transform = `translate(${targetEl.offsetWidth - DOT_SIZE / 2 - LINE_SIZE}px, ${-DOT_SIZE / 2}px)`;
      break;
    case "bottomLeft":
      el.style.transform = `translate(${-DOT_SIZE / 2}px, ${targetEl.offsetHeight - DOT_SIZE / 2 - LINE_SIZE}px)`;
      break;
    case "bottomRight":
      el.style.transform = `translate(${targetEl.offsetWidth - DOT_SIZE / 2 - LINE_SIZE}px, ${targetEl.offsetHeight - DOT_SIZE / 2 - LINE_SIZE}px)`;
      break;
    case "rotate":
      el.style.transform = `translate(${targetEl.offsetWidth + ROTATE_WIDTH - DOT_SIZE / 2}px, ${targetEl.offsetHeight / 2 - DOT_SIZE / 2 - LINE_SIZE / 2}px)`;
      break;
  }

  // const state = moving.state;
  // const targetEl = moving.element;
  //
  // const halfWidth = state.width / 2;
  // const halfHeight = state.height / 2;
  // // const diag = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);
  // const targetAngle = degToRad(state.rotation + 180);
  //
  // let dx = halfWidth + halfWidth * Math.cos(targetAngle);
  // let dy = halfHeight + halfWidth * Math.sin(targetAngle);
  // console.log(`designation ${designation} dx ${dx} dy ${dy}`);

  // el.style.transform = `
  //   translate(${state.x}px, ${state.y}px)
  //   translate(${dx}px, ${dy}px)
  //   rotate(${state.rotation}deg)
  //   translate(${5 * Math.sin(degToRad(state.rotation / 2))}px, 0)
  // `;

  // switch (designation) {
  //   case "topLeft":
  //     el.style.transform += ` translate(0, -${halfHeight}px)`;
  //     break;
  //   case "topRight":
  //     el.style.transform += ` translate(${targetEl.offsetWidth}px, -${halfHeight}px)`;
  //     break;
  //   case "bottomLeft":
  //     el.style.transform += ` translate(0, ${halfHeight}px)`;
  //     break;
  //   case "bottomRight":
  //     el.style.transform += ` translate(${targetEl.offsetWidth}px, ${halfHeight}px)`;
  //     break;
  //   case "rotate":
  //     el.style.transform += ` translate(${targetEl.offsetWidth + ROTATE_WIDTH}px, 0)`;
  //     break;
  // }

  return el;
}