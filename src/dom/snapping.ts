import type {RectState} from "../geometry/state";
import type {SnappingGrid, SnappingRotation} from "./createMoveMe";

export function handleDragSnap(element: HTMLElement, state: RectState, grid: SnappingGrid) {
  const halfWidth = element.offsetWidth / 2;
  const halfHeight = element.offsetHeight / 2;
  const pivot = {x: (state.x + halfWidth), y: (state.y + halfHeight)};
  if (!grid) return;
  if (grid.horizontalY) {
    for (const number of grid.horizontalY) {
      if (Math.abs(number - pivot.y) < grid.threshold) {
        state.y = number - halfHeight;
        break;
      }
    }
  }
  if (grid.verticalX) {
    for (const number of grid.verticalX) {
      if (Math.abs(number - pivot.x) < grid.threshold) {
        state.x = number - halfWidth;
        break;
      }
    }
  }
}

export function handleRotateSnap(rotSnap: SnappingRotation, angle: number) {
  for (const number of rotSnap.anglesDeg) {
    if (Math.abs(angle - number) < rotSnap.threshold) {
      angle = number;
      break;
    }
  }
  return angle;
}