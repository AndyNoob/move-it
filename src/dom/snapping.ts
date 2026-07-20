import type {RectState} from "../geometry/state";
import type {MoveMeOpt, SnappingGrid, SnappingRotation} from "./createMoveMe";
import {normalizeDeg} from "../geometry/geometry";

export function handleDragSnap(state: RectState, grid: SnappingGrid, options: MoveMeOpt) {
  const halfWidth = state.width / 2;
  const halfHeight = state.height / 2;
  const offset = options.pivotOffset ?? {x: 0, y: 0};
  const pivot = {
    x: (state.x + halfWidth) + offset.x * state.width, 
    y: (state.y + halfHeight) + offset.y * state.height
  };
  if (!grid) return;
  if (grid.horizontalY) {
    for (let number of grid.horizontalY) {
      number = (options.doResize ? options.controlRoot.offsetHeight : 1) * number;
      if (Math.abs(number - pivot.y) < grid.threshold) {
        state.y = number - halfHeight - offset.y * state.height;
        break;
      }
    }
  }
  if (grid.verticalX) {
    for (let number of grid.verticalX) {
      number = (options.doResize ? options.controlRoot.offsetWidth : 1) * number;
      if (Math.abs(number - pivot.x) < grid.threshold) {
        state.x = number - halfWidth - offset.x * state.width;
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