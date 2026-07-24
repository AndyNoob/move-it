import {convertTo, moveRect, type RectState} from "../geometry/state";
import type {MoveMeOpt, Moving, SnappingGrid, SnappingRotation} from "./createMoveMe";
import {normalizeDeg} from "../geometry/geometry";

export function handleDragSnap(moving: Moving, state: RectState, grid: SnappingGrid, options: MoveMeOpt) {
  const converted = convertTo(moving, moving.getOptions(), state);
  const width = moving.element.offsetWidth;
  const height = moving.element.offsetHeight;
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const x = converted.x;
  const y = converted.y;

  let newX = x;
  let newY = y;

  const offset = options.pivotOffset ?? {x: 0, y: 0};
  const pivot = {
    x: (x + halfWidth) + offset.x * width,
    y: (y + halfHeight) + offset.y * height
  };

  if (!grid) return state;
  if (grid.horizontalY) {
    for (let number of grid.horizontalY) {
      number = (grid.asPercent ? options.controlRoot.offsetHeight : 1) * number;
      if (Math.abs(number - pivot.y) < grid.threshold) {
        newY = number - halfHeight - offset.y * height;
        break;
      }
    }
  }
  if (grid.verticalX) {
    for (let number of grid.verticalX) {
      number = (grid.asPercent ? options.controlRoot.offsetWidth : 1) * number;
      if (Math.abs(number - pivot.x) < grid.threshold) {
        newX = number - halfWidth - offset.x * width;
        break;
      }
    }
  }

  return moveRect(moving.getOptions(), state, newX - x, newY - y);
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