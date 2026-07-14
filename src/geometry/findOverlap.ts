import type {RectState} from "./state";
import {add, delta, dot, rotate, scale, type Vec2} from "./geometry";

// browser's up vector, y is negative :)
const UP: Vec2 = {x: 0, y: -1};
const RIGHT: Vec2 = {x: 1, y: 0};

interface Basis {
  up: Vec2,
  right: Vec2,
}

interface Range {
  min: number;
  max: number
}

/*

Separating Axis Theorem
===>  two arbitrarily rotated boxes DOESN'T overlap if there is not an axis at which their projected "shadows"
      (in practice dot product min/max range along the axis) overlap.

however, to actually prevent objects from being stuck, you also have to calculate the quantity at which box A is
stuck in box B. in the simplest case, we do so by checking the overlap area of the shadows (min/max ranges).
by calculating the width of the overlap area, we can scale the direction (normalized vector) of the axis using the width
and apply that to one of the boxes.

 */

export function findOverlap(a: RectState, b: RectState, debugLog = false): Vec2 | null {
  if (a.usePercent || b.usePercent) {
    throw new Error("convert RectState object with convertToPixels first");
  }
  const ab = getBasis(a);
  const bb = getBasis(b);
  const axes: Vec2[] = [
    ab.up,
    ab.right
  ];

  if (Math.abs(dot(ab.up, bb.right) - 1) > 0.01 && Math.abs(dot(ab.right, bb.right) - 1) > 0.01) {
    axes.push(bb.right);
  }

  if (Math.abs(dot(ab.up, bb.up) - 1) > 0.01 && Math.abs(dot(ab.right, bb.up) - 1) > 0.01) {
    axes.push(bb.up);
  }

  if (debugLog) console.log("start overlap check", {axes, ab, bb});

  let sAxis: Vec2 | null = null;
  let amt: number | null = null;

  for (const axis of axes) {
    const rangeA = project(a, ab, axis, debugLog);
    const rangeB = project(b, bb, axis, debugLog);

    if (debugLog) console.log("axis check", {axis, rangeA, rangeB});

    const checkA = {
      min: inRange(rangeA.min, rangeB),
      max: inRange(rangeA.max, rangeB),
    }
    const checkB = {
      min: inRange(rangeB.min, rangeA),
      max: inRange(rangeB.max, rangeA),
    }

    if (debugLog) console.log("check a & b", {checkA, checkB});

    // definitely does not overlap or completely contain
    if (!checkA.min && !checkA.max && !checkB.min && !checkB.max) return null;

    const bContainsA = checkA.min && checkA.max;
    const aContainsB = checkB.min && checkB.max;

    if (bContainsA || aContainsB) {
      // complete containment of one of the boxes when projected on this axis
      const outer = bContainsA ? rangeB : rangeA;
      const inner = bContainsA ? rangeA : rangeB;

      const leftShiftAmt = outer.min - inner.min;
      const rightShiftAmt = outer.max - inner.max;

      let val = Math.abs(leftShiftAmt) < Math.abs(rightShiftAmt) ? leftShiftAmt : rightShiftAmt;
      val += (inner.max - inner.min);

      if (debugLog) console.log("containment", val);

      if (amt == null || Math.abs(val) < Math.abs(amt)) {
        sAxis = axis;
        amt = val + (inner.max - inner.min);
        if (debugLog) console.log("mtv updated", {sAxis, amt});
      }
    } else {
      // incomplete overlap of the two boxes on this axis
      // geometrically speaking, it has to be either:
      //
      //     checkA.min && checkB.max
      //                OR
      //     checkA.max && checkB.min
      //
      let val: number;
      if (checkA.min) {
        val = rangeB.max - rangeA.min;
      } else {
        val = rangeB.min - rangeA.max;
      }
      if (debugLog) console.log("incomplete overlap", val)
      if (amt == null || Math.abs(val) < Math.abs(amt)) {
        sAxis = axis;
        amt = val;
        if (debugLog) console.log("mtv updated", {sAxis, amt});
      }
    }
  }

  if (!(sAxis != null && amt != null)) return null;

  return scale(sAxis, amt);
}

function getBasis(r: RectState): Basis {
  return {
    up: rotate(UP, r.rotation),
    right: rotate(RIGHT, r.rotation)
  }
}

function project(r: RectState, basis: Basis, axis: Vec2, debugLog: boolean): Range {
  const halfWidth = r.width / 2;
  const halfHeight = r.height / 2;
  const pivot = {x: r.x + halfWidth, y: r.y + halfHeight};

  const hWRight = scale(basis.right, halfWidth);
  const hHUp = scale(basis.up, halfHeight);

  const pts: Vec2[] = [
    delta(hWRight, add(hHUp, pivot)),   // top left
    add(hWRight, add(hHUp, pivot)),     // top right
    delta(hWRight, delta(hHUp, pivot)), // bottom left
    add(hWRight, delta(hHUp, pivot)),   // bottom right
  ];

  if (debugLog) console.log("projection", {axis, pts});

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const pt of pts) {
    const v = dot(pt, axis);
    if (v < min) min = v;
    if (v > max) max = v;
  }

  return {min, max};
}

function inRange(n: number, range: Range) {
  return range.min <= n && n <= range.max;
}
