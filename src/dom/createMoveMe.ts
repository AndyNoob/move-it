import {convertTo, moveRect, type RectState, resizeRect, rotateRect} from "../geometry/state"
import {getRotation, renderToCss} from "./htmlUtil";
import type {Controls, DotDesignation, LineDesignation} from "./controls";
import {updateControls} from "./controls";
import {cross, delta, dot, normalize, radToDeg, rotate, scale, type Vec2} from "../geometry/geometry";
import {handleDragSnap, handleRotateSnap} from "./snapping";
import {findOverlap} from "../geometry/findOverlap";

export interface FormatOptions {
  centered?: boolean,
  asPercent?: boolean,
}

export interface MoveMeOpt {
  initialState?: RectState,
  /**
   * @description by setting `asPercent`, the library will automatically scale the element whenever the control root
   * changes dimension. by setting `centered`, the library will always anchor the element at the designated pivot point
   */
  format?: FormatOptions,
  snapping?: SnappingOpt,
  onChange?: (next: RectState) => void,
  /**
   * @description this should ideally be the same parent as the target element ({@linkcode HTMLElement.parentElement}),
   * otherwise there might be weird issues with coordinates
   */
  controlRoot: HTMLElement,
  disableFeatures?: DisableFeatures,
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
  horizontalY?: number[],
  /**
   * should the values be in pixels or percent (decimal)
   */
  asPercent?: boolean
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
   * @description a copy of the current `RectState`. in the format option provided in the initial options
   */
  getState: () => RectState,
  /**
   * @description partial in the format option provided in the options
   */
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
  getOptions: () => MoveMeOpt
}

export function computeState(element: HTMLElement, options: MoveMeOpt) {
  const format = options.format;
  const controlRoot = options.controlRoot;
  const state = {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
    rotation: getRotation(element),
  };
  if (format?.centered) {
    state.x += state.width / 2;
    state.y += state.height / 2;
  }
  if (format?.asPercent) {
    state.x /= controlRoot.offsetWidth;
    state.width /= controlRoot.offsetWidth;
    state.y /= controlRoot.offsetHeight;
    state.height /= controlRoot.offsetHeight;
  }
  return state;
}

class MovingClass implements Moving {

  id: string;
  element: HTMLElement;
  state: RectState;
  readonly options: MoveMeOpt;
  siblings: Moving[] = [];
  controls: Controls;

  selected = false;
  mode: "drag" | "resize" | "rotate" | null = null;
  designation: Exclude<DotDesignation, "rotate"> | Exclude<LineDesignation, "rotate"> | null = null;
  mouseStartPos: Vec2 | null = null;
  mousePrevPos: Vec2 | null = null;
  startState: RectState | null = null;

  readonly sizeObs: ResizeObserver | null = null;
  readonly pctObs: ResizeObserver | null = null;

  onPointerDown: (e: Event) => void;
  onPointerMove: (e: Event) => void;
  onPointerUp: (e: Event) => void;
  onKeydown: (e: Event) => void;
  onShiftRatio: (e: Event) => void;
  onArrowKeys: (e: Event) => void;

  constructor(element: HTMLElement, options: MoveMeOpt) {
    this.element = element;
    this.options = options;
    this.state = options && options.initialState ? options.initialState : computeState(element, options);

    this.id = generateUID();
    element.dataset.moveItId = this.id;

    if (options.initialState)
      renderToCss(element, this.state, options.format?.centered, options.pivotOffset);

    window.addEventListener("pointerdown", this.onPointerDown = (e) => onPointerDown(this, e as PointerEvent));
    window.addEventListener("pointermove", this.onPointerMove = (e) => onPointerMove(this, e as PointerEvent));
    window.addEventListener("pointerup", this.onPointerUp = () => onPointerUp(this));
    window.addEventListener("keydown", this.onKeydown = (e) => onKeydown(this, e as KeyboardEvent));
    window.addEventListener("keyup", this.onShiftRatio = (e) => onShiftRatio(this, e as KeyboardEvent));
    this.onArrowKeys = (e) => onArrowKeys(this, e as KeyboardEvent);

    this.pctObs = new ResizeObserver(() => {
      this.render();
    });
    this.pctObs.observe(options.controlRoot);

    if (options.autoSize) {
      this.sizeObs = new ResizeObserver(() => {
        this.state.width = element.offsetWidth;
        this.state.height = element.offsetHeight;
        if (options.format?.asPercent) {
          this.state.width /= options.controlRoot.offsetWidth;
          this.state.height /= options.controlRoot.offsetHeight;
        }
        this.render();
        if (options.onChange) options.onChange(this.state);
        this.controls = updateControls(element, this, options, this.selected);
      });
      this.sizeObs.observe(element);
    }

    this.controls = updateControls(element, this, options, false);
  }

  getState() {
    return this.state;
  }

  getOptions() {
    return this.options;
  }

  render() {
    renderToCss(
      this.element,
      convertTo(this, this.options, this.state),
      this.options.autoSize,
      this.options.pivotOffset
    );
    this.controls = updateControls(this.element, this, this.options, this.selected);
  }

  destroy() {
    this.controls.destroy();
    delete this.element.dataset.moveItId;
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("keydown", this.onKeydown);
    window.removeEventListener("keyup", this.onShiftRatio);
    if (this.pctObs) this.pctObs.disconnect();
    if (this.sizeObs) this.sizeObs.disconnect();
  }

  updateState(partial: Partial<RectState>) {
    this.state = {...this.state, ...partial};
    if (this.options.onChange) this.options.onChange(this.state);
    this.render();
  }

  updateControls(select = false) {
    return this.controls = updateControls(this.element, this, this.options, this.selected = select);
  }

  isSelected() {
    return this.selected
  }

  getCollisionSiblings() {
    return this.siblings;
  }

  removeCollisionSibling(sibling: Moving) {
    this.siblings.filter(m => m.id === sibling.id)
  }

  addCollisionSibling(sibling: Moving) {
    this.siblings.push(sibling)
  }

  select() {
    this.selected = true;
    this.controls = updateControls(this.element, this, this.options);
  }

  checkBounds(dx = 0, dy = 0): boolean {
    let changed = false;
    const clientRect = this.element.getBoundingClientRect();
    const rect = {
      left: clientRect.left,
      right: clientRect.right,
      top: clientRect.top,
      bottom: clientRect.bottom,
    };
    const bounds = this.options.controlRoot.getBoundingClientRect();

    rect.left += dx;
    rect.right += dx;
    rect.top += dy;
    rect.bottom += dy;

    if (rect.left < bounds.left) {
      this.state = moveRect(this.options, this.state, bounds.left - rect.left, 0);
      changed = true;
    }
    if (rect.right > bounds.right) {
      this.state = moveRect(this.options, this.state, bounds.right - rect.right, 0);
      changed = true;
    }
    if (rect.top < bounds.top) {
      this.state = moveRect(this.options, this.state, 0, bounds.top - rect.top);
      changed = true;
    }
    if (rect.bottom > bounds.bottom) {
      this.state = moveRect(this.options, this.state, 0, bounds.bottom - rect.bottom);
      changed = true;
    }

    for (const sibling of this.siblings) {
      const shift = findOverlap(
        convertTo(this, this.options, this.state),
        convertTo(sibling, sibling.getOptions(), sibling.getState())
      );
      if (!shift) continue;
      this.state = moveRect(this.options, this.state, shift.x, shift.y);
      changed = true;
    }

    return changed;
  }
}

export function createMoveMe(element: HTMLElement, option: MoveMeOpt): Moving {
  return new MovingClass(element, option);
}

function onPointerDown(moving: MovingClass, event: PointerEvent) {
  if (!(event.target instanceof HTMLElement)) {
    moving.selected = false;
    moving.render();
    return;
  }

  const sameElement = moving.element.isSameNode(event.target);
  const dotClick = moving.controls.getDotDesignation(event.target);
  const lineClick = moving.controls.getLineDesignation(event.target);

  if (!(sameElement || dotClick || (lineClick && lineClick.name !== "rotate"))) {
    moving.selected = false;
    moving.render();
    return;
  }

  moving.selected = true;
  moving.render();

  if (sameElement) {
    moving.mode = "drag";
  } else {
    if (dotClick?.name === "rotate") moving.mode = "rotate";
    else {
      moving.designation = (dotClick || lineClick)!;
      moving.mode = "resize";
    }
  }

  switch (moving.mode) {
    case "resize":
      if (moving.options.disableFeatures?.resize
        || moving.options.autoSize) moving.mode = null;
      break;
    case "drag":
      if (moving.options.disableFeatures?.drag) moving.mode = null;
      break;
    case "rotate":
      if (moving.options.disableFeatures?.rotate) moving.mode = null;
      break;
  }

  moving.startState = moving.state!;
  moving.mouseStartPos = moving.mousePrevPos = event;
}

function onPointerMove(moving: MovingClass, event: { x: number, y: number, shiftKey: boolean }) {
  if (!moving.state || !moving.mouseStartPos || !moving.startState || !moving.mousePrevPos || !moving.mode) return;

  const old = {...moving.state};
  const movement = delta(moving.mousePrevPos, event);

  switch (moving.mode) {
    case "drag": {
      moving.state = moveRect(moving.options, moving.state, movement.x, movement.y);
      const grid = moving.options?.snapping?.grid;
      if (grid && !event.shiftKey) moving.state = handleDragSnap(moving, moving.state, grid, moving.options);
      break;
    }
    case "resize": {
      if (!moving.designation) throw Error("designation is null (resize) in pointer move")
      moving.state = handleResize(
        moving.designation,
        moving.options,
        moving.state,
        event.shiftKey,
        movement
      );
      break;
    }
    case "rotate": {
      const state = convertTo(moving, moving.getOptions(), moving.state);
      const pivot = {
        x: state.x + state.width * (0.5 + (moving.options.pivotOffset?.x || 0)),
        y: state.y + state.height * (0.5 + (moving.options.pivotOffset?.y || 0))
      };
      const rect = moving.options.controlRoot.getBoundingClientRect();
      pivot.x += rect.left;
      pivot.y += rect.top;

      const toStart = normalize(delta(pivot, moving.mouseStartPos));
      const toCur = normalize(delta(pivot, event));

      const rad = Math.atan2(
        cross(toStart, toCur),
        dot(toStart, toCur)
      );

      let angle = moving.startState.rotation + radToDeg(rad);

      if (!event.shiftKey && moving.options?.snapping && moving.options.snapping.rotation) {
        angle = handleRotateSnap(moving.options.snapping.rotation, angle);
      }

      moving.state = rotateRect(moving.state, angle);
      break;
    }
  }

  const finalDiff = delta(old, moving.state);
  moving.checkBounds(finalDiff.x, finalDiff.y);

  moving.mousePrevPos = event;

  if (moving.options?.onChange)
    moving.options?.onChange(moving.state);
  moving.render();
}

function onPointerUp(moving: MovingClass) {
  moving.mode = null;
  moving.mouseStartPos = null;
  moving.mousePrevPos = null;
  moving.startState = null;
}

function onShiftRatio(moving: MovingClass, event: KeyboardEvent) {
  if (moving.mode !== "resize") return;
  if (!moving.startState || !moving.mousePrevPos || !moving.mouseStartPos || !moving.designation) return;
  if (!event.key.toLowerCase().includes("shift")) return;
  if (moving.designation?.cardinal) return;
  if (event.shiftKey) {
    moving.state = moving.startState;
  } else {
    // now unpressing it, free ratio and recalc to cursor
    moving.state = handleResize(
      moving.designation!,
      moving.options,
      moving.state,
      event.shiftKey,
      {x: moving.mousePrevPos.x - moving.mouseStartPos.x, y: moving.mousePrevPos.y - moving.mouseStartPos.y}
    );
  }
  if (moving.options?.onChange)
    moving.options?.onChange(moving.state!);
  moving.render();
}

function onArrowKeys(moving: MovingClass, event: KeyboardEvent) {
  if (!moving.state) return;
  if (!moving.selected) return;
  if (moving.mode != null) return;
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
  moving.state = moveRect(moving.options, moving.state, d.x, d.y);
  if (moving.options.onChange)
    moving.options.onChange(moving.state);
  moving.render();
}

function onKeydown(moving: MovingClass, event: KeyboardEvent) {
  moving.onShiftRatio(event);
  moving.onArrowKeys(event);
}

function handleResize(designation: DotDesignation | LineDesignation,
                      moveMeOpt: MoveMeOpt,
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
  state = resizeRect(moveMeOpt, state, dx, dy);

  if (state.rotation === 0) {
    if (designation.direction.x < 0) {
      const adjust = scale(horizontal, dx);
      state = moveRect(moveMeOpt, state, adjust.x, adjust.y);
    }

    if (designation.direction.y < 0) {
      const adjust = scale(vertical, dy);
      state = moveRect(moveMeOpt, state, adjust.x, adjust.y);
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

    return moveRect(moveMeOpt, state, h.x + v.x, h.y + v.y);
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

