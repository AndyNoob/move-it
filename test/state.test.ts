import { describe, expect, it } from "vitest";
import { moveRect, rotateRect } from "../src/geometry/state";

describe("state", () => {
  const rect = {
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    rotation: 0,
  };

  it("moves a rect by dx/dy", () => {
    expect(moveRect(rect, 5, -10)).toEqual({
      ...rect,
      x: 15,
      y: 10,
    });
  });

  it("rotates a rect", () => {
    expect(rotateRect(rect, 45)).toEqual({
      ...rect,
      rotation: 45,
    });
  });
});