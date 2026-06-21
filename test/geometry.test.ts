import { describe, expect, it } from "vitest";
import { cross, degToRad, dot, normalize, radToDeg } from "../src/geometry/geometry.js";

describe("geometry", () => {
  it("converts between degrees and radians", () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
    expect(radToDeg(Math.PI)).toBeCloseTo(180);
  });

  it("calculates dot products", () => {
    expect(dot({ x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(0);
    expect(dot({ x: 1, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(1);
  });

  it("calculates cross product direction", () => {
    expect(cross({ x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(1);
    expect(cross({ x: 0, y: 1 }, { x: 1, y: 0 })).toBeCloseTo(-1);
  });

  it("normalizes vectors", () => {
    expect(normalize({ x: 3, y: 4 })).toEqual({ x: 0.6, y: 0.8 });
  });
});