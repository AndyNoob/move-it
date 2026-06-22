import { describe, expect, it } from "vitest";
import findOverlap from "../src/geometry/findOverlap";
import type { RectState } from "../src";
import type { Vec2 } from "../src/geometry/geometry";

function rect(partial: Partial<RectState>): RectState {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    ...partial,
  };
}

function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

function expectVecClose(actual: Vec2, expected: Vec2, precision = 6) {
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
}

function expectAxisAlignedMtv(actual: Vec2 | null, expected: Vec2) {
  expect(actual).not.toBeNull();
  expectVecClose(actual!, expected);
}

describe("findOverlap", () => {
  it("returns null when axis-aligned rectangles are separated horizontally", () => {
    const a = rect({ x: 0, y: 0, width: 100, height: 100 });
    const b = rect({ x: 150, y: 0, width: 100, height: 100 });

    expect(findOverlap(a, b)).toBeNull();
  });

  it("returns null when axis-aligned rectangles are separated vertically", () => {
    const a = rect({ x: 0, y: 0, width: 100, height: 100 });
    const b = rect({ x: 0, y: 150, width: 100, height: 100 });

    expect(findOverlap(a, b)).toBeNull();
  });

  it("returns the minimum translation vector for horizontal overlap", () => {
    const a = rect({ x: 0, y: 0, width: 100, height: 100 });
    const b = rect({ x: 90, y: 0, width: 100, height: 100 });

    expectAxisAlignedMtv(findOverlap(a, b), { x: -10, y: 0 });
  });

  it("returns the minimum translation vector for vertical overlap", () => {
    const a = rect({ x: 0, y: 0, width: 100, height: 100 });
    const b = rect({ x: 0, y: 90, width: 100, height: 100 });

    expectAxisAlignedMtv(findOverlap(a, b), { x: 0, y: -10 });
  });

  it("chooses the smaller overlap axis", () => {
    const a = rect({ x: 0, y: 0, width: 100, height: 100 });
    const b = rect({ x: 80, y: 90, width: 100, height: 100 });

    // x overlap = 20, y overlap = 10, so MTV should be vertical.
    expectAxisAlignedMtv(findOverlap(a, b), { x: 0, y: -10 });
  });

  it("handles full containment", () => {
    const a = rect({ x: 0, y: 0, width: 200, height: 200 });
    const b = rect({ x: 50, y: 50, width: 50, height: 50 });

    const mtv = findOverlap(a, b);

    expect(mtv).not.toBeNull();
    expect(length(mtv!)).toBeGreaterThan(0);
  });

  it("detects overlap between rotated rectangles", () => {
    const a = rect({ x: 0, y: 0, width: 100, height: 100, rotation: 45 });
    const b = rect({ x: 50, y: 0, width: 100, height: 100, rotation: -15 });

    const mtv = findOverlap(a, b);

    expect(mtv).not.toBeNull();
    expect(length(mtv!)).toBeGreaterThan(0);
  });

  it("returns null for separated rotated rectangles", () => {
    const a = rect({ x: 0, y: 0, width: 100, height: 100, rotation: 45 });
    const b = rect({ x: 250, y: 0, width: 100, height: 100, rotation: -15 });

    expect(findOverlap(a, b)).toBeNull();
  });

  it("returns a very small MTV for a very small overlap", () => {
    const a = rect({ x: 0, y: 0, width: 100, height: 100 });
    const b = rect({ x: 99.5, y: 0, width: 100, height: 100 });

    const mtv = findOverlap(a, b);

    expect(mtv).not.toBeNull();
    expect(length(mtv!)).toBeCloseTo(0.5);
  });

  it("does not return NaN values", () => {
    const a = rect({ x: 0, y: 0, width: 100, height: 100, rotation: 33 });
    const b = rect({ x: 80, y: 20, width: 100, height: 100, rotation: 77 });

    const mtv = findOverlap(a, b);

    expect(mtv).not.toBeNull();
    expect(Number.isNaN(mtv!.x)).toBe(false);
    expect(Number.isNaN(mtv!.y)).toBe(false);
  });

  it("is directionally opposite when arguments are swapped", () => {
    const a = rect({ x: 0, y: 0, width: 100, height: 100 });
    const b = rect({ x: 90, y: 0, width: 100, height: 100 });

    const ab = findOverlap(a, b);
    const ba = findOverlap(b, a);

    expect(ab).not.toBeNull();
    expect(ba).not.toBeNull();

    expectVecClose(ab!, { x: -ba!.x, y: -ba!.y });
  });
});