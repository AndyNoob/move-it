import {normalizeDeg} from "./geometry";

/**
 * @description the `RectState` interface mirrors the default behavior of the CSS `transform` property. `x` and `y`
 * represent the top left of the rectangle whereas the `rotation` is pivoting from the center of the rectangle.
 */
export interface RectState {
  x: number,
  y: number,
  width: number,
  height: number,
  /**
   * @description degrees, 0-360
   */
  rotation: number,
  /**
   * @description when `true`, the `x`, `y`, `width`, and `height` properties become relative to the `controlRoot`'s
   * width and height
   */
  readonly usePercent?: boolean,
  /**
   * @description marks that this state object is representing a state whose `x` and `y` values are representing the
   * center of the rectangle rather than the top left.
   */
  readonly centered?: boolean
}

interface Container {
  offsetWidth: number,
  offsetHeight: number
}

export function moveRect(
  start: RectState,
  dx: number,
  dy: number
): RectState {
  return {
    ...start,
    x: start.x + dx,
    y: start.y + dy,
  };
}

export function resizeRect(
  start: RectState,
  dx: number,
  dy: number
): RectState {
  return {
    ...start,
    width: Math.max(20, start.width + dx),
    height: Math.max(20, start.height + dy),
  };
}

export function rotateRect(
  start: RectState,
  angle: number
): RectState {
  return {
    ...start,
    rotation: normalizeDeg(angle),
  };
}

export function convertToPercent(container: Container, state: RectState): RectState {
  if (state.usePercent) return state;
  const wasCentered = state.centered ?? false;
  if (wasCentered) state = convertToTopLeft(state, container);
  const left = state.x / container.offsetWidth;
  const top = state.y / container.offsetHeight;
  const width = state.width / container.offsetWidth;
  const height = state.height / container.offsetHeight;
  const next = {...state, x: left, y: top, width, height, usePercent: true};
  return wasCentered ? convertToCentered(next, container) : next;
}

export function convertToPixels(container: { offsetWidth: number, offsetHeight: number }, state: RectState): RectState {
  if (!state.usePercent) return state;
  const wasCentered = state.centered ?? false;
  if (wasCentered) state = convertToTopLeft(state, container);
  const x = state.x * container.offsetWidth;
  const y = state.y * container.offsetHeight;
  const width = state.width * container.offsetWidth;
  const height = state.height * container.offsetHeight;
  const next = {...state, x, y, width, height, usePercent: false};
  return wasCentered ? convertToCentered(next, container) : next;
}

export function convertToCentered(state: RectState, container?: Container): RectState {
  if (state.centered) return state;
  if (state.usePercent) {
    if (container) {
      return {
        ...state,
        x: state.x + state.width / 2 / container.offsetWidth,
        y: state.y + state.width / 2 / container.offsetHeight,
        centered: true
      };
    } else throw new Error("convertToCentered: container/control root needed");
  } else {
    return {
      ...state,
      x: state.x + state.width / 2,
      y: state.y + state.height / 2,
      centered: true
    };
  }
}

export function convertToTopLeft(state: RectState, container?: Container): RectState {
  if (!state.centered) return state;
  if (state.usePercent) {
    if (container) {
      return {
        ...state,
        x: state.x - state.width / 2 / container.offsetWidth,
        y: state.y - state.height / 2 / container.offsetHeight,
        centered: false
      };
    } else throw new Error("convertToCentered: container/control root needed");
  } else {
    return {
      ...state,
      x: state.x - state.width / 2,
      y: state.y - state.height / 2,
      centered: false
    };
  }
}