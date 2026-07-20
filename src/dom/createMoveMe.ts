import {convertToCentered, convertToPercent, convertToPixels, convertToTopLeft, type RectState} from "../geometry/state"
import {moveRect, resizeRect, rotateRect} from "../geometry/state";
import {getGlobalPivot, getRotation, renderToCss} from "./htmlUtil";
import type {Controls, DotDesignation, LineDesignation} from "./controls";
import {updateControls} from "./controls";
import {type Vec2} from "../geometry/geometry";
import {cross, delta, dot, normalize, radToDeg, rotate, scale} from "../geometry/geometry";
import {handleDragSnap, handleRotateSnap} from "./snapping";
import {findOverlap} from "../geometry/findOverlap";

export interface MoveMeOpt {
  initialState?: RectState,
  snapping?: SnappingOpt,
  onChange?: (next: RectState) => void,
  /**
   * @description this should ideally be the same parent as the target element ({@linkcode HTMLElement.parentElement}),
   * otherwise there might be weird issues with coordinates
   */
  controlRoot: HTMLElement,
  disableFeatures?: DisableFeatures,
  doResize?: boolean,
  /**
   * @description when `true`, the library stops assigning width and height directly via CSS, but rather syncs the
   * `RectState` automatically whenever the size changes via DOM `ResizeObserver`. this also implicitly disables the
   * resize feature
   */
  autoSize?: boolean,
  /**
   * @description percent (expressed as decimal) of each axis to offset the pivot point of the moving element.
   * this will impact the rotation pivot, the grid snapping location, and `autoSize` if enabled. the default pivot
   * point is the center of the element. to make it top left, do `{x: -0.5, y: -0.5}`.
   */
  pivotOffset?: Vec2
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

/**
 * Set to `true` to disable, leave as is (or `false`) to keep enabled.
 */
export interface DisableFeatures {
  drag?: boolean,
  rotate?: boolean,
  resize?: boolean
}

export interface Moving {
  element: HTMLElement,
  id: string,
  /**
   * @description a copy of the current `RectState`.
   */
  getState: (usePercent?: boolean, centered?: boolean) => RectState,
  updateState: (partial: Partial<RectState>) => void,
  destroy: () => void,
  render: () => void,
  select: () => void,
  isSelected: () => boolean,
  checkBounds: () => void,
  updateControls: (select: boolean) => Controls,
  getCollisionSiblings: () => Moving[],
  /**
   * You need to do this for both instances, the behavior is not mirrored by default
   * For example, say you have `instanceA` and `instanceB`, you need to run both
   * `instanceA.addCollisionSibling(instanceB)` and `instanceB.addCollisionSibling(instanceA)`
   * for both instances to collide with the other.
   */
  addCollisionSibling: (sibling: Moving) => void,
  removeCollisionSibling: (sibling: Moving) => void,
}

export function computeState(element: HTMLElement) {
  return {
    x: ((element.parentElement?.clientLeft || 0) - element.clientLeft),
    y: ((element.parentElement?.clientTop || 0) - element.clientTop),
    width: element.offsetWidth,
    height: element.offsetHeight,
    rotation: getRotation(element),
  }
}

export function createMoveMe(element: HTMLElement, option: MoveMeOpt): Moving {
  const id = generateUID();
  element.dataset.moveItId = id;

  const siblings: Moving[] = [];
  let state: RectState = option && option.initialState ? option.initialState : computeState(element);

  if (state.centered) state = convertToTopLeft(state);
  if (state.usePercent) state = convertToPixels(option.controlRoot, state);
  if (option.autoSize) {
    state.width = -1
    state.height = -1;
    syncMeasuredSize();
  }
  if (option.initialState)
    renderToCss(element, state!, option.autoSize, option.pivotOffset);

  let selected = false;

  let mode: "drag" | "resize" | "rotate" | null = null;
  let designation: Exclude<DotDesignation, "rotate"> | Exclude<LineDesignation, "rotate"> | null = null;

  let startPos: Vec2 | null;
  let lastPos: Vec2 | null;
  let startState: RectState | null;

  function onPointerMove(event: { x: number, y: number, shiftKey: boolean }) {
    if (!state || !startPos || !startState || !lastPos || !mode) return;

    const old = {...state};
    const movement = delta(lastPos, event);

    switch (mode) {
      case "drag": {
        state = moveRect(state, movement.x, movement.y);
        const grid = option?.snapping?.grid;
        if (grid && !event.shiftKey) handleDragSnap(state, grid, option);
        break;
      }
      case "resize": {
        if (!designation) throw Error("designation is null (resize) in pointer move")
        state = handleResize(designation, state, event.shiftKey, movement);
        break;
      }
      case "rotate": {
        const pivot = getGlobalPivot(element, option.pivotOffset);

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
    render();
  }

  //<editor-fold desc="Listeners" defaultstate="collapsed">
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
        designation = (dotClick || lineClick)!;
        mode = "resize";
      }
    }

    switch (mode) {
      case "resize":
        if (option.disableFeatures?.resize || option.autoSize) mode = null;
        break;
      case "drag":
        if (option.disableFeatures?.drag) mode = null;
        break;
      case "rotate":
        if (option.disableFeatures?.rotate) mode = null;
        break;
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
    if (!startState || !lastPos || !startPos || !designation) return;
    if (!event.key.toLowerCase().includes("shift")) return;
    if (designation?.cardinal) return;
    if (event.shiftKey) {
      state = startState;
    } else {
      // now unpressing it, free ratio and recalc to cursor
      state = handleResize(designation!,
        state,
        event.shiftKey,
        {x: lastPos.x - startPos.x, y: lastPos.y - startPos.y}
      );
    }
    if (option?.onChange)
      option?.onChange(state!);
    render();
  }

  function onArrowKeys(event: KeyboardEvent) {
    if (!state) return;
    if (!selected) return;
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
    state = moveRect(state, d.x, d.y);
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
    renderToCss(element, state!, option.autoSize, option.pivotOffset);
    if (option.autoSize) syncMeasuredSize();
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

    for (const sibling of siblings) {
      const shift = findOverlap(state, sibling.getState());
      if (!shift) continue;
      state = moveRect(state, shift.x, shift.y);
      changed = true;
    }

    return changed;
  }

  let pctObs: ResizeObserver | null = null;
  if (option.doResize) {
    let prevSize: {offsetWidth: number, offsetHeight: number} | null = null;
    pctObs = new ResizeObserver(() => {
      if (prevSize === null) {
        prevSize = {offsetWidth: option.controlRoot.offsetWidth, offsetHeight: option.controlRoot.offsetHeight};
        return;
      }
      const relativeState = convertToPercent(prevSize, state);
      state = convertToPixels(option.controlRoot, relativeState);
      render();
      prevSize = {offsetWidth: option.controlRoot.offsetWidth, offsetHeight: option.controlRoot.offsetHeight};
    });
    pctObs.observe(option.controlRoot);
  }

  function syncMeasuredSize() {
    if (!state) return;
    const newWidth = element.offsetWidth;
    const newHeight = element.offsetHeight;
    if (state.width === -1) {
      state.width = newWidth;
      state.height = newHeight;
      return;
    }
    if (newWidth === state.width && newHeight === state.height) return;
    /*
     * when the element resizes, the top left x & y remains the same
     * but the pivot point is moved/no longer anchored
     *
     * so we just compute the old pivot and subtract the new pivot
     * to get the translation to anchor the pivot
     */
    const oldPivotOffset = {
      x: state.width / 2 + (option.pivotOffset?.x || 0) * state.width,
      y: state.height / 2 + (option.pivotOffset?.y || 0) * state.height
    }
    const newPivotOffset = {
      x: newWidth / 2 + (option.pivotOffset?.x || 0) * newWidth,
      y: newHeight / 2 + (option.pivotOffset?.y || 0) * newHeight,
    };
    const translation = delta(newPivotOffset, oldPivotOffset);
    console.log({width: state.width, height: state.height}, {newWidth, newHeight}, oldPivotOffset, newPivotOffset, translation);

    state = {
      ...state,
      x: state.x + translation.x,
      y: state.y + translation.y,
      width: newWidth,
      height: newHeight,
    };
  }

  let sizeObs: ResizeObserver | null = null;
  if (option.autoSize) {
    sizeObs = new ResizeObserver(() => {
      syncMeasuredSize();
      render();
      if (option.onChange) option.onChange(state!);
      controls = updateControls(element, moving, option, selected);
    });
    sizeObs.observe(element);
  }

  const moving: Moving = {
    element,
    id,
    getState: (usePercent = false, centered = false) => {
      if (option.autoSize) syncMeasuredSize();
      let s: RectState = state!;
      if (usePercent) s = convertToPercent(option.controlRoot, s);
      if (centered) s = convertToCentered(s);
      return {...s};
    },
    updateState: (partial: Partial<RectState>) => {
      let next = {...state!, ...partial};
      if (next.usePercent) next = convertToPixels(option.controlRoot, next);
      if (next.centered) next = convertToTopLeft(next);
      state = next;
      if (option.autoSize) syncMeasuredSize();
      if (option.onChange) option.onChange(state);
      render();
    },
    destroy: () => {
      controls.destroy();
      delete element.dataset.moveItId;
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", onShiftRatio);
      if (pctObs) pctObs.disconnect();
      if (sizeObs) sizeObs.disconnect();
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
        if (option.onChange)
          option.onChange(state);
        render();
      }
    },
    isSelected: () => selected,
    getCollisionSiblings: () => siblings,
    removeCollisionSibling: (sibling: Moving) => siblings.filter(m => m.id === sibling.id),
    addCollisionSibling: (sibling: Moving) => siblings.push(sibling),
  };

  let controls = updateControls(element, moving, option, false);
  return moving
}

function handleResize(designation: DotDesignation | LineDesignation,
                      state: RectState,
                      shiftKey: boolean,
                      movement: Vec2): RectState {
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
  const firstPart: number = (Math.random() * 46656) | 0;
  const secondPart: number = (Math.random() * 46656) | 0;
  const firstPartB = ("000" + firstPart.toString(36)).slice(-3);
  const secondPartB = ("000" + secondPart.toString(36)).slice(-3);
  return firstPartB + secondPartB;
}

