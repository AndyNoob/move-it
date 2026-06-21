import {getControlBox, getDistanceToLine} from "./htmlUtil";
import type {MoveMeOpt, Moving, SnappingOpt} from "./createMoveMe";
import {normalizeDeg} from "../geometry/geometry";
import type {RectState} from "../geometry/state";

//<editor-fold defaultstate="collapsed" desc="Control interface">
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
  },
  guides: {
    vertical: HTMLElement[],
    horizontal: HTMLElement[]
  }
  destroy: () => void,
  getDotDesignation: (el: HTMLElement) => DotDesignation | null,
  getLineDesignation: (el: HTMLElement) => Exclude<LineDesignation, "rotate"> | null,
}

//</editor-fold>

// <editor-fold defaultstate="collapsed" desc="Designations">
export const lineDesignations = {
  top: {
    name: "top",
    direction: {x: 0, y: -1},
    cardinal: true
  },

  bottom: {
    name: "bottom",
    direction: {x: 0, y: 1},
    cardinal: true
  },

  left: {
    name: "left",
    direction: {x: -1, y: 0},
    cardinal: true
  },

  right: {
    name: "right",
    direction: {x: 1, y: 0},
    cardinal: true
  },

  rotate: {
    name: "rotate",
    direction: {x: 0, y: 0},
    cardinal: false
  },
};
export const dotDesignations = {
  topLeft: {
    name: "topLeft",
    direction: {x: -1, y: -1},
    cardinal: false
  },

  topRight: {
    name: "topRight",
    direction: {x: 1, y: -1},
    cardinal: false
  },

  bottomLeft: {
    name: "bottomLeft",
    direction: {x: -1, y: 1},
    cardinal: false
  },

  bottomRight: {
    name: "bottomRight",
    direction: {x: 1, y: 1},
    cardinal: false
  },

  rotate: {
    name: "rotate",
    direction: {x: 0, y: 0},
    cardinal: false
  },
};

export type LineDesignation =
  typeof lineDesignations[keyof typeof lineDesignations];

export type DotDesignation =
  typeof dotDesignations[keyof typeof dotDesignations];
// </editor-fold>

const LINE_SIZE = 1;
const DOT_SIZE = 5;
const ROTATE_WIDTH = 20;

export function updateControls(el: HTMLElement, moving: Moving, options: MoveMeOpt, selected = true): Controls {
  const target = el.dataset.moveItId!;
  const box = getControlBox(options.controlRoot);
  const container: HTMLElement =
    document.querySelector(`.container[data-move-it-target="${target}"]`) ||
    box.appendChild(document.createElement("div"));
  const state = moving.state;

  updateContainer(container, selected, target, el, state);

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
    guides: getGuides(box, target, moving, options.snapping),
    destroy: () => {
      container.replaceChildren();
      container.remove();
    },
    getDotDesignation: (checking) => {
      const key = checking.dataset.moveItDesignation;
      if (!(key && key in dotDesignations)) return null;
      return checking.matches(`.dot[data-move-it-target="${target}"]`) ?
        dotDesignations[key as keyof typeof dotDesignations] : null;
    },
    getLineDesignation: (checking) => {
      const key = checking.dataset.moveItDesignation;
      if (!(key && key in lineDesignations)) return null;
      if (!checking.matches(`.line[data-move-it-target="${target}"]`)) return null;
      if (key === "rotate") return null;
      return lineDesignations[key as keyof typeof lineDesignations] as Exclude<LineDesignation, "rotate">;
    }
  };
}

function updateContainer(container: HTMLElement, selected: boolean, target: string, el: HTMLElement, state: RectState) {
  container.style.visibility = selected ? "visible" : "hidden";
  if (!container.classList.contains("container")) container.classList.add("container");
  container.dataset.moveItTarget = target;
  container.style.transformOrigin = `${el.offsetWidth / 2}px ${el.offsetHeight / 2}px`;
  container.style.transform = `
    translate(${state.x - LINE_SIZE / 2}px, ${state.y - LINE_SIZE / 2}px)
    rotate(${state.rotation}deg)
  `;
}

function getLine(box: HTMLElement, target: string, designation: LineDesignation, moving: Moving) {
  const el = (box.querySelector(`.line[data-move-it-target="${target}"][data-move-it-designation="${designation.name}"]`)
    || box.appendChild(document.createElement("div"))) as HTMLElement;

  el.dataset.moveItTarget = target;
  el.dataset.moveItDesignation = `${designation.name}`;
  el.style.cursor = getResizeCursor(designation.name, moving.state.rotation);
  if (!el.classList.contains("line")) el.classList.add("line");

  const targetEl = moving.element;

  // noinspection FallThroughInSwitchStatementJS
  switch (designation.name) {
    case "bottom":
      el.style.transform = `translate(0, ${targetEl.offsetHeight}px)`
    // falls through
    case "top":
      el.style.width = `${targetEl.offsetWidth}px`;
      el.style.height = `${LINE_SIZE}px`;
      break;
    case "right":
      el.style.transform = `translate(${targetEl.offsetWidth}px, 0)`
    // falls through
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

  return el;
}

function getDot(box: HTMLElement, target: string, designation: DotDesignation, moving: Moving) {
  const el = (box.querySelector(`.dot[data-move-it-target="${target}"][data-move-it-designation="${designation.name}"]`)
    || box.appendChild(document.createElement("div"))) as HTMLElement;
  el.dataset.moveItTarget = target;
  el.dataset.moveItDesignation = `${designation.name}`;
  if (!el.classList.contains("dot")) el.classList.add("dot");

  el.style.width = `${DOT_SIZE}px`;
  el.style.height = `${DOT_SIZE}px`;
  el.style.cursor = getResizeCursor(designation.name, moving.state.rotation);

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

  return el;
}

function getGuides(controlBox: HTMLElement, target: string, moving: Moving, snapping: SnappingOpt | undefined): {
  vertical: HTMLElement[];
  horizontal: HTMLElement[]
} {
  const grid = snapping?.grid;
  if (!snapping || !grid) return {vertical: [], horizontal: []};
  const allGuides: { vertical: Record<string, HTMLElement>, horizontal: Record<string, HTMLElement> } =
    {vertical: {}, horizontal: {}};
  const allLines = controlBox.querySelectorAll(
    `.vert-grid[data-move-it-target="${target}"], .hori-grid[data-move-it-target="${target}"]`
  );
  for (const element of allLines as NodeListOf<HTMLElement>) {
    if (element.dataset.moveItVal == null) {
      element.remove();
      continue;
    }
    if (element.classList.contains("vert-grid")) {
      if (!grid.verticalX?.includes(Number(element.dataset.moveItVal))) {
        element.remove();
      } else allGuides.vertical[element.dataset.moveItVal] = element;
    } else {
      if (!grid.horizontalY?.includes(Number(element.dataset.moveItVal))) {
        element.remove();
      } else allGuides.horizontal[element.dataset.moveItVal] = element;
    }
  }

  const rect = moving.element.getBoundingClientRect();

  function makeSureItExists(val: number, vertical: boolean) {
    const elements = vertical ? allGuides.vertical : allGuides.horizontal;
    const existing = elements[val];
    if (getDistanceToLine(rect, val, !vertical) > snapping!.grid!.displayThreshold) {
      if (existing) existing.style.visibility = "hidden";
    } else {
      const line = existing
        || controlBox.appendChild(document.createElement("div"));
      const className = vertical ? "vert-grid" : "hori-grid";
      if (!line.classList.contains(className)) line.classList.add(className);
      if (vertical) line.style.left = `${val}px`;
      else line.style.top = `${val}px`;
      line.style.visibility = "visible";
      line.dataset.moveItVal = `${val}`;
      line.dataset.moveItTarget = target;
      elements[val] = line;
    }
  }

  if (grid.verticalX)
    for (const vert of grid.verticalX) {
      makeSureItExists(vert, true);
    }
  if (grid.horizontalY)
    for (const hori of grid.horizontalY) {
      makeSureItExists(hori, false);
    }
  return {horizontal: Object.values(allGuides.horizontal), vertical: Object.values(allGuides.vertical)};
}

function getResizeCursor(
  handle: string,
  rotation: number
) {
  if (handle === "rotate") return "grab";

  const cursorByHandle: Record<string, string> = {
    topLeft: "nw-resize",
    topRight: "ne-resize",
    bottomLeft: "sw-resize",
    bottomRight: "se-resize",
    top: "row-resize",
    bottom: "row-resize",
    left: "col-resize",
    right: "col-resize",
  };

  const baseAngles: Record<string, number> = {
    topRight: 45,
    topLeft: 135,
    bottomLeft: 225,
    bottomRight: 315,
    right: 0,
    top: 90,
    left: 180,
    bottom: 270,
  };

  if (!Object.keys(baseAngles).includes(handle)) return "move";

  let angle = normalizeDeg(baseAngles[handle]! - rotation);
  if (angle < 0) angle += 360;
  const snapped = Math.round(angle / 45) * 45 % 360;

  for (const key in baseAngles) {
    if (baseAngles[key] === snapped) return cursorByHandle[key]!;
  }

  return "move";
}

