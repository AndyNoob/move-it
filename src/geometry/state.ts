import {normalizeDeg} from "./geometry";

export interface RectState {
  x: number,
  y: number,
  width: number,
  height: number,
  /**
   * degrees, 0-360
   */
  rotation: number,
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
  const newState = {
    ...start,
    width: Math.max(20, start.width + dx),
    height: Math.max(20, start.height + dy),
  };
  if (newState.rotation !== 0) {
    // adjust for pivot point change
    const dx = newState.width - start.width;
    const dy = newState.height - start.height;
    newState.x -= dx / 2;
    newState.y -= dy / 2;
  }
  return newState;
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