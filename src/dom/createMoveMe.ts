import type {RectState} from "../geometry/state.js"
import {moveRect, resizeRect, rotateRect} from "../geometry/state.js";
import {getPivot, getRotation, renderToCss} from "./htmlUtil.js";
import type {Controls, DotDesignation, LineDesignation} from "./controls.js";
import {updateControls} from "./controls.js";
import type {Vec2} from "../geometry/geometry.js";
import {cross, delta, dot, normalize, radToDeg, rotate, scale} from "../geometry/geometry.js";
import {handleDragSnap, handleRotateSnap} from "./snapping.js";

export interface MoveMeOpt {
  initialState?: RectState,
  snapping?: SnappingOpt,
  onChange?: (next: RectState) => void,
  /**
   * this should ideally be the same parent as the target element ({@linkcode HTMLElement.parentElement}),
   * otherwise there might be weird issues with coordinates
   */
  controlRoot: HTMLElement
}

export interface SnappingOpt {
  rotation?: SnappingRotation,
  grid?: SnappingGrid
}

export interface SnappingGrid {
  /**
   * number of pixels away to snap the element
   */
  threshold: number,
  /**
   * number of pixels away to display the nearest grid/guideline
   */
  displayThreshold: number,
  verticalX?: number[],
  horizontalY?: number[]
}

export interface SnappingRotation {
  anglesDeg: number[],
  threshold: number
}

export interface Moving {
  element: HTMLElement,
  state: RectState,
  destroy: () => void,
  render: () => void,
  select: () => void,
  checkBounds: () => void,
  updateControls: () => Controls,
}

export function createMoveMe(element: HTMLElement, option: MoveMeOpt): Moving {
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

  function onPointerMove(event: { x: number, y: number, shiftKey: boolean }) {
    if (!state || !startPos || !startState || !lastPos) return;

    const old = {...state};
    const movement = delta(lastPos, event);

    switch (mode) {
      case "drag": {
        state = moveRect(state, movement.x, movement.y);
        const grid = option?.snapping?.grid;
        if (grid && !event.shiftKey) handleDragSnap(element, state, grid);
        break;
      }
      case "resize": {
        const designation: Exclude<DotDesignation, "rotate"> | Exclude<LineDesignation, "rotate"> = data;
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
          angle = handleRotateSnap(option.snapping.rotation, angle);
        }

        state = rotateRect(state, angle);
        break;
      }
    }

    if (!state) throw new Error("state is undef after processing pointer move");

    const finalDiff = delta(old, state);
    checkBounds(finalDiff.x, finalDiff.y);

    lastPos = event;

    if (option?.onChange)
      option?.onChange(state);
    moving.state = state;
    render();
  }

  //<editor-fold desc="Listeners">
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

  function onArrowKeys(event: KeyboardEvent) {
    if (!state) return;
    if (mode != null) return;
    let key = event.key.toLowerCase();
    if (!key.startsWith("arrow")) return;
    key = key.slice(5);
    const d = {x: 0, y: 0};
    const step =
      event.shiftKey ? 10 : (event.altKey ? 0.5 : 1);
    switch (key) {
      case "left":
        d.x = -step;
        break;
      case "right":
        d.x = step;
        break;
      case "up":
        d.y = -step;
        break;
      case "down":
        d.y = step;
        break;
    }
    moving.state = state = moveRect(state, d.x, d.y);
    if (option.onChange)
      option.onChange(state);
    render();
  }

  function keydown(event: KeyboardEvent) {
    onShiftRatio(event);
    onArrowKeys(event);
  }

  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", onShiftRatio);

  //</editor-fold>

  function render() {
    renderToCss(element, state!);
    controls = updateControls(element, moving, option, selected);
  }

  function checkBounds(dx = 0, dy = 0): boolean {
    if (!state) return false;
    let changed = false;
    const clientRect = element.getBoundingClientRect();
    const rect = {
      left: clientRect.left,
      right: clientRect.right,
      top: clientRect.top,
      bottom: clientRect.bottom,
    };
    const bounds = option.controlRoot.getBoundingClientRect();

    rect.left += dx;
    rect.right += dx;
    rect.top += dy;
    rect.bottom += dy;

    if (rect.left < bounds.left) {
      state = moveRect(state, bounds.left - rect.left, 0);
      changed = true;
    }
    if (rect.right > bounds.right) {
      state = moveRect(state, bounds.right - rect.right, 0);
      changed = true;
    }
    if (rect.top < bounds.top) {
      state = moveRect(state, 0, bounds.top - rect.top);
      changed = true;
    }
    if (rect.bottom > bounds.bottom) {
      state = moveRect(state, 0, bounds.bottom - rect.bottom);
      changed = true;
    }
    return changed;
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
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", onShiftRatio);
    },
    render,
    select: () => {
      selected = true;
      controls = updateControls(element, moving, option);
    },
    updateControls: (select = false) => {
      return controls = updateControls(element, moving, option, selected = select);
    },
    checkBounds: () => {
      if (checkBounds() && state) {
        moving.state = state;
        if (option.onChange)
          option.onChange(state);
        render();
      }
    }
  };

  let controls = updateControls(element, moving, option, false);
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

  const old = {...state};
  state = resizeRect(state, dx, dy);

  if (state.rotation === 0) {
    if (designation.direction.x < 0) {
      const adjust = scale(horizontal, dx);
      state = moveRect(state, adjust.x, adjust.y);
    }
    console.log(state);

    if (designation.direction.y < 0) {
      const adjust = scale(vertical, dy);
      state = moveRect(state, adjust.x, adjust.y);
    }

    return state;
  } else {
    // shift half as much in each direction
    const h = scale(horizontal, dx / 2);
    const v = scale(vertical, dy / 2);

    {
      // adjust for pivot point change
      const dx = state.width - old.width;
      const dy = state.height - old.height;
      state.x -= dx / 2;
      state.y -= dy / 2;
    }

    return moveRect(state, h.x + v.x, h.y + v.y);
  }
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

