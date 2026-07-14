import type {RectState} from "../geometry/state";
import type {MoveMeOpt, SnappingGrid, SnappingRotation} from "./createMoveMe";
import {normalizeDeg} from "../geometry/geometry";

export function handleDragSnap(element: HTMLElement, state: RectState, grid: SnappingGrid, options: MoveMeOpt) {
  const halfWidth = element.offsetWidth / 2;
  const halfHeight = element.offsetHeight / 2;
  const pivot = {x: (state.x + halfWidth), y: (state.y + halfHeight)};
  if (!grid) return;
  if (grid.horizontalY) {
    for (let number of grid.horizontalY) {
      number = (options.doResize ? options.controlRoot.offsetHeight : 1) * number;
      if (Math.abs(number - pivot.y) < grid.threshold) {
        state.y = number - halfHeight;
        break;
      }
    }
  }
  if (grid.verticalX) {
    for (let number of grid.verticalX) {
      number = (options.doResize ? options.controlRoot.offsetWidth : 1) * number
      if (Math.abs(number - pivot.x) < grid.threshold) {
        state.x = number - halfWidth;
        break;
      }
    }
  }
}

export function handleRotateSnap(rotSnap: SnappingRotation, angle: number) {
  angle = normalizeDeg(angle);
  for (const number of rotSnap.anglesDeg) {
    if (Math.abs(angle - number) < rotSnap.threshold) {
      angle = number;
      break;
    }
  }
  return angle;
}