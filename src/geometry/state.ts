import {normalizeDeg} from "./geometry";

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
   * @description when `true`, the `x`, `y`, `width`, and `height` properties become relative to the `controlRoot`'s width and height
   */
  readonly usePercent?: boolean
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

export function convertToPercent(container: {
  offsetWidth: number,
  offsetHeight: number
}, state: RectState): RectState {
  if (state.usePercent) return state;
  const left = state.x / container.offsetWidth;
  const top = state.y / container.offsetHeight;
  const width = state.width / container.offsetWidth;
  const height = state.height / container.offsetWidth;
  return {...state, x: left, y: top, width, height, usePercent: true};
}

export function convertToPixels(container: { offsetWidth: number, offsetHeight: number }, state: RectState): RectState {
  if (!state.usePercent) return state;
  const x = state.x * container.offsetWidth;
  const y = state.y * container.offsetHeight;
  const width = state.width * container.offsetWidth;
  const height = state.height * container.offsetWidth;
  return {...state, x, y, width, height, usePercent: false};
}