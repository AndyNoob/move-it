import { describe, expect, it } from "vitest";
import { findOverlap } from "../src";
import type { RectState } from "../src";
import type { Vec2 } from "../src/geometry/geometry";

function rect(partial: Partial<RectState>): RectState {
  return { x: 0, y: 0, width: 100, height: 100, rotation: 0, ...partial };
}

function len(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

describe("findOverlap", () => {
  it("returns null when horizontally separated", () => {
    expect(findOverlap(rect({ x: 0 }), rect({ x: 150 }))).toBeNull();
  });

  it("returns null when vertically separated", () => {
    expect(findOverlap(rect({ y: 0 }), rect({ y: 150 }))).toBeNull();
  });

  it("returns MTV for horizontal overlap", () => {
    const mtv = findOverlap(rect({ x: 0 }), rect({ x: 90 }));
    expect(mtv).not.toBeNull();
    expect(mtv!.x).toBeCloseTo(-10);
    expect(mtv!.y).toBeCloseTo(0);
  });

  it("returns MTV for vertical overlap", () => {
    const mtv = findOverlap(rect({ y: 0 }), rect({ y: 90 }));
    expect(mtv).not.toBeNull();
    expect(mtv!.x).toBeCloseTo(0);
    expect(mtv!.y).toBeCloseTo(-10);
  });

  it("chooses the smaller overlap axis", () => {
    // x overlap = 20, y overlap = 10 → MTV should be vertical
    const mtv = findOverlap(rect({ x: 0, y: 0 }), rect({ x: 80, y: 90 }));
    expect(mtv).not.toBeNull();
    expect(mtv!.x).toBeCloseTo(0);
    expect(mtv!.y).toBeCloseTo(-10);
  });

  it("handles full containment", () => {
    const mtv = findOverlap(
      rect({ x: 0, y: 0, width: 200, height: 200 }),
      rect({ x: 50, y: 50, width: 50, height: 50 }),
    );
    expect(mtv).not.toBeNull();
    expect(len(mtv!)).toBeGreaterThan(0);
  });

  it("detects overlap between rotated rectangles", () => {
    const mtv = findOverlap(
      rect({ x: 0, y: 0, rotation: 45 }),
      rect({ x: 50, y: 0, rotation: -15 }),
    );
    expect(mtv).not.toBeNull();
    expect(len(mtv!)).toBeGreaterThan(0);
  });

  it("returns null for separated rotated rectangles", () => {
    expect(
      findOverlap(
        rect({ x: 0, y: 0, rotation: 45 }),
        rect({ x: 250, y: 0, rotation: -15 }),
      ),
    ).toBeNull();
  });

  it("small MTV for small overlap", () => {
    const mtv = findOverlap(rect({ x: 0 }), rect({ x: 99.5 }));
    expect(mtv).not.toBeNull();
    expect(len(mtv!)).toBeCloseTo(0.5);
  });

  it("no NaN in result", () => {
    const mtv = findOverlap(
      rect({ x: 0, y: 0, rotation: 33 }),
      rect({ x: 80, y: 20, rotation: 77 }),
    );
    expect(mtv).not.toBeNull();
    expect(Number.isNaN(mtv!.x)).toBe(false);
    expect(Number.isNaN(mtv!.y)).toBe(false);
  });

  it("arguments swapped → opposite direction", () => {
    const ab = findOverlap(rect({ x: 0 }), rect({ x: 90 }));
    const ba = findOverlap(rect({ x: 90 }), rect({ x: 0 }));
    expect(ab).not.toBeNull();
    expect(ba).not.toBeNull();
    expect(ab!.x).toBeCloseTo(-ba!.x);
    expect(ab!.y).toBeCloseTo(-ba!.y);
  });
});
