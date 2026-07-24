import {normalizeDeg} from "./geometry";
import type {FormatOptions, MoveMeOpt, Moving} from "../dom/createMoveMe";

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
  rotation: number
}

interface Container {
  offsetWidth: number,
  offsetHeight: number
}

export function moveRect(
  opt: MoveMeOpt,
  start: RectState,
  dx: number,
  dy: number
): RectState {
  const asPercent = opt.format?.asPercent;
  if (asPercent) {
    dx /= opt.controlRoot.offsetWidth;
    dy /= opt.controlRoot.offsetHeight;
  }
  return {
    ...start,
    x: start.x + dx,
    y: start.y + dy,
  };
}

export function resizeRect(
  opt: MoveMeOpt,
  start: RectState,
  dx: number,
  dy: number
): RectState {
  const asPercent = opt.format?.asPercent;
  if (asPercent) {
    dx /= opt.controlRoot.offsetWidth;
    dy /= opt.controlRoot.offsetHeight;
  }
  const min = asPercent ? 20 / opt.controlRoot.offsetWidth : 20;
  return {
    ...start,
    width: Math.max(min, start.width + dx),
    height: Math.max(min, start.height + dy),
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

export function convertTo(
  moving: Moving,
  opt: MoveMeOpt,
  state: RectState,
  targetFormat: FormatOptions = {centered: false, asPercent: false}
): RectState {
  let newState = {...state};
  const currentFormat = opt.format || {centered: false, asPercent: false};
  const controlRoot = opt.controlRoot;

  if (currentFormat.asPercent !== targetFormat.asPercent) {
    if (targetFormat.asPercent) {
      // currently in pixels, divide by control root size
      newState = convertToPercent(controlRoot, newState);
    } else {
      // currently in percent
      newState = convertToPixels(controlRoot, newState);
    }
  }

  if (currentFormat.centered !== targetFormat.centered) {
    let width: number;
    if (opt.autoSize) {
      width = moving.element.offsetWidth;
      if (targetFormat.asPercent)
        width /= controlRoot.offsetWidth;
    } else {
      width = newState.width;
    }
    let height: number;
    if (opt.autoSize) {
      height = moving.element.offsetHeight;
      if (targetFormat.asPercent)
        height /= controlRoot.offsetHeight;
    } else {
      height = newState.height;
    }

    const offset = opt.pivotOffset || {x: 0, y: 0};

    if (targetFormat.centered) {
      // convert from top left to centered
      newState.x += width * (offset.x + 0.5);
      newState.y += height * (offset.y + 0.5);
    } else {
      // convert from centered to top left
      newState.x -= width * (offset.x + 0.5);
      newState.y -= height * (offset.y + 0.5);
    }
  }

  return newState;
}

function convertToPercent(container: Container, state: RectState): RectState {
  const left = state.x / container.offsetWidth;
  const top = state.y / container.offsetHeight;
  const width = state.width / container.offsetWidth;
  const height = state.height / container.offsetHeight;
  return {...state, x: left, y: top, width, height};
}

function convertToPixels(container: Container, state: RectState): RectState {
  const x = state.x * container.offsetWidth;
  const y = state.y * container.offsetHeight;
  const width = state.width * container.offsetWidth;
  const height = state.height * container.offsetHeight;
  return {...state, x, y, width, height};
}