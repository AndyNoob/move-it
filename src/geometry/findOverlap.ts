import type {RectState} from "./state";
import {add, dot, rotate, scale, type Vec2} from "./geometry";

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

export default function findOverlap(a: RectState, b: RectState): Vec2 | null {
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

  let sAxis: Vec2 | null = null;
  let amt: number | null = null;

  for (const axis of axes) {
    const rangeA = project(a, ab, axis);
    const rangeB = project(b, bb, axis);

    const checkA = {
      min: inRange(rangeA.min, rangeB),
      max: inRange(rangeA.max, rangeB),
    }
    const checkB = {
      min: inRange(rangeB.min, rangeA),
      max: inRange(rangeB.max, rangeA),
    }

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

      if (amt == null || Math.abs(val) < Math.abs(amt)) {
        sAxis = axis;
        amt = val + (inner.max - inner.min);
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
      if (amt == null || Math.abs(val) < Math.abs(amt)) {
        sAxis = axis;
        amt = val;
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

function project(r: RectState, basis: Basis, axis: Vec2): Range {
  const topLeft: Vec2 = r;
  const topRight = add(topLeft, scale(basis.right, r.width));

  const heightShift = scale(basis.up, -r.height);

  const pts: Vec2[] = [
    topLeft, // top left
    topRight,
    add(topLeft, heightShift), // bottom left
    add(topRight, heightShift), // bottom right
  ];

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
