import {moveRect, RectState, resizeRect, rotateRect} from "../geometry/state";
import {getPivot, getRotation, renderToCss} from "./htmlUtil";
import {Controls, DotDesignation, LineDesignation, updateControls} from "./controls";
import {cross, delta, dot, normalize, radToDeg, rotate, scale, Vec2} from "../geometry/geometry";

export interface MoveMeOpt {
  initialState?: RectState,
  snapping?: SnappingOpt,
  onChange?: (next: RectState) => void,
  controlRoot: HTMLElement
}

export interface SnappingOpt {
  rotation?: {
    anglesDeg: number[],
    threshold: number
  },
  grid?: {
    /**
     * number of pixels away to snap the element
     */
    threshold: number,
    /**
     * number of pixels away to display the nearest grid/guide line
     */
    displayThreshold: number,
    verticalX?: number[],
    horizontalY?: number[]
  }
}

export interface Moving {
  element: HTMLElement,
  state: RectState,
  destroy: () => void,
  render: () => void,
  select: () => void,
  updateControls: () => Controls,
}

export function moveMe(element: HTMLElement, option: MoveMeOpt): Moving {
  element.dataset.moveItId = generateUID();
  let state: RectState | null;
  if (option && (state = option.initialState || null))
    renderToCss(element, option.initialState!);
  else {
    state = {
      x: ((element.parentElement?.clientLeft || 0) - element.clientLeft),
      y: ((element.parentElement?.clientTop || 0) - element.clientTop),
      width: element.clientWidth,
      height: element.offsetHeight,
      rotation: getRotation(element),
    }
  }

  let selected = false;

  let mode: "drag" | "resize" | "rotate" | null = null;
  let data: any = null;

  let startPos: Vec2 | null;
  let lastPos: Vec2 | null;
  let startState: RectState | null;

  function onPointerDown(event: PointerEvent) {
    if (!(event.target instanceof HTMLElement)) {
      selected = false;
      render();
      return;
    }

    const sameElement = element.isSameNode(event.target);
    const dotClick = controls.getDotDesignation(event.target);
    const lineClick = controls.getLineDesignation(event.target);

    if (!(sameElement || dotClick || (lineClick && lineClick.name !== "rotate"))) {
      selected = false;
      render();
      return;
    }

    selected = true;
    render();

    if (sameElement) {
      mode = "drag";
    } else {
      if (dotClick?.name === "rotate") mode = "rotate";
      else {
        data = dotClick || lineClick;
        mode = "resize";
      }
    }

    startState = state!;
    startPos = lastPos = event;
  }

  function onPointerMove(event: {x: number, y: number, shiftKey: boolean}) {
    if (!state || !startPos || !startState || !lastPos) return;

    switch (mode) {
      case "drag": {
        const diff = delta(startPos, event);
        state = moveRect(startState, diff.x, diff.y);

        const grid = option?.snapping?.grid;
        const halfWidth = element.offsetWidth / 2;
        const halfHeight = element.offsetHeight / 2;
        const pivot = {x: (state.x + halfWidth), y: (state.y + halfHeight)};
        if (!event.shiftKey && grid) {
          if (grid.horizontalY) {
            for (let number of grid.horizontalY) {
              if (Math.abs(number - pivot.y) < grid.threshold) {
                state.y = number - halfHeight;
                break;
              }
            }
          }
          if (grid.verticalX) {
            for (let number of grid.verticalX) {
              if (Math.abs(number - pivot.x) < grid.threshold) {
                state.x = number - halfWidth;
                break;
              }
            }
          }
        }
        break;
      }
      case "resize": {
        const designation: Exclude<DotDesignation, "rotate"> | Exclude<LineDesignation, "rotate"> = data;
        const movement = delta(lastPos, event);
        state = handleResize(designation, state, event.shiftKey, movement);
        break;
      }
      case "rotate": {
        const pivot = getPivot(element);

        const toStart = normalize(delta(pivot, startPos));
        const toCur = normalize(delta(pivot, event));
        const rad = Math.atan2(cross(toStart, toCur), dot(toStart, toCur));
        let angle = startState.rotation + radToDeg(rad);

        if (!event.shiftKey && option?.snapping && option.snapping.rotation) {
          const rotSnap = option.snapping.rotation;
          for (let number of rotSnap.anglesDeg) {
            if (Math.abs(angle - number) < rotSnap.threshold) {
              angle = number;
              break;
            }
          }
        }

        state = rotateRect(state, angle);
        break;
      }
    }
    lastPos = event;
    if (option?.onChange)
      option?.onChange(state!);
    moving.state = state!;
    render();
  }

  function onPointerUp() {
    mode = null;
    startPos = null;
    lastPos = null;
    startState = null;
  }

  function onShiftRatio(event: KeyboardEvent) {
    if (mode !== "resize") return;
    if (!startState || !lastPos || !startPos) return;
    if (!event.key.toLowerCase().includes("shift")) return;
    if (data?.cardinal) return;
    if (event.shiftKey) {
      state = startState;
    } else {
      // now unpressing it, free ratio and recalc to cursor
      console.log("unpress");
      state = handleResize(data,
        state,
        event.shiftKey,
        {x: lastPos.x - startPos.x, y: lastPos.y - startPos.y}
      );
    }
    moving.state = state!;
    if (option?.onChange)
      option?.onChange(state!);
    render();
  }

  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("keydown", onShiftRatio);
  window.addEventListener("keyup", onShiftRatio);

  function render() {
    renderToCss(element, state!);
    controls = updateControls(element, moving, option?.snapping, selected);
  }

  const moving: Moving = {
    element,
    state,
    destroy: () => {
      controls.destroy();
      delete element.dataset.moveItId;
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onShiftRatio);
      window.removeEventListener("keyup", onShiftRatio);
    },
    render,
    select: () => {
      selected = true;
      controls = updateControls(element, moving, option?.snapping);
    },
    updateControls: (select = false) => {
      return controls = updateControls(element, moving, option?.snapping, selected = select);
    }
  };

  let controls = updateControls(element, moving, option?.snapping, false);
  return moving
}

function handleResize(designation: DotDesignation | LineDesignation,
                      state: RectState | null,
                      shiftKey: boolean,
                      movement: Vec2): RectState | null {
  if (!state) return null;

  const horizontal = rotate({x: designation.direction.x, y: 0}, state.rotation);
  const vertical = rotate({x: 0, y: designation.direction.y}, state.rotation);
  let dx, dy;

  if (designation.cardinal || shiftKey) {
    const direction = normalize(rotate(designation.direction, state.rotation));
    const dotVal = dot(direction, movement);
    dx = Math.abs(designation.direction.x) * dotVal;
    dy = Math.abs(designation.direction.y) * dotVal;
  } else {
    dx = dot(horizontal, movement);
    dy = dot(vertical, movement);
  }

  state = resizeRect(state, dx, dy);

  if (state.rotation === 0) {
    if (designation.direction.x < 0) {
      const adjust = scale(horizontal, dx);
      state = moveRect(state, adjust.x, adjust.y);
    }

    if (designation.direction.y < 0) {
      const adjust = scale(vertical, dy);
      return moveRect(state, adjust.x, adjust.y);
    }
  } else {
    // shift half as much in each direction
    const h = scale(horizontal, dx / 2);
    const v = scale(vertical, dy / 2);
    return moveRect(state, h.x + v.x, h.y + v.y);
  }

  return null;
}

// Source - https://stackoverflow.com/a/6248722
// Posted by kennytm, modified by community. See post 'Timeline' for change history
// Retrieved 2026-06-17, License - CC BY-SA 3.0

function generateUID() {
  // I generate the UID from two parts here
  // to ensure the random number provide enough bits.
  let firstPart: any = (Math.random() * 46656) | 0;
  let secondPart: any = (Math.random() * 46656) | 0;
  firstPart = ("000" + firstPart.toString(36)).slice(-3);
  secondPart = ("000" + secondPart.toString(36)).slice(-3);
  return firstPart + secondPart;
}

