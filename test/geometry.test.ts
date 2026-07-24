import { describe, it, expect } from "vitest";
import {
  degToRad,
  radToDeg,
  normalize,
  dot,
  scale,
  abs,
  cross,
  rotate,
  delta,
  add,
  normalizeDeg,
  type Vec2,
} from "../src/geometry/geometry";

const PI = Math.PI;

describe("degToRad", () => {
  it("0° → 0 rad", () => expect(degToRad(0)).toBe(0));
  it("90° → π/2", () => expect(degToRad(90)).toBeCloseTo(PI / 2));
  it("180° → π", () => expect(degToRad(180)).toBeCloseTo(PI));
  it("360° → 2π", () => expect(degToRad(360)).toBeCloseTo(2 * PI));
  it("negative", () => expect(degToRad(-90)).toBeCloseTo(-PI / 2));
});

describe("radToDeg", () => {
  it("0 rad → 0°", () => expect(radToDeg(0)).toBe(0));
  it("π/2 → 90°", () => expect(radToDeg(PI / 2)).toBeCloseTo(90));
  it("π → 180°", () => expect(radToDeg(PI)).toBeCloseTo(180));
  it("2π → 360°", () => expect(radToDeg(2 * PI)).toBeCloseTo(360));
  it("negative", () => expect(radToDeg(-PI / 2)).toBeCloseTo(-90));
});

describe("degToRad ↔ radToDeg round-trip", () => {
  it("0°", () => expect(radToDeg(degToRad(0))).toBeCloseTo(0));
  it("90°", () => expect(radToDeg(degToRad(90))).toBeCloseTo(90));
  it("42°", () => expect(radToDeg(degToRad(42))).toBeCloseTo(42));
});

describe("normalize", () => {
  it("unit vector unchanged", () => {
    const n = normalize({ x: 0, y: 1 });
    expect(n.x).toBeCloseTo(0);
    expect(n.y).toBeCloseTo(1);
  });
  it("(3,4) → (0.6,0.8)", () => {
    expect(normalize({ x: 3, y: 4 })).toEqual({ x: 0.6, y: 0.8 });
  });
  it("result has magnitude 1", () => {
    const n = normalize({ x: 7, y: 13 });
    expect(Math.sqrt(dot(n, n))).toBeCloseTo(1);
  });
  it("zero → NaN", () => {
    const n = normalize({ x: 0, y: 0 });
    expect(n.x).toBeNaN();
    expect(n.y).toBeNaN();
  });
});

describe("dot", () => {
  it("identical = 1", () => expect(dot({ x: 1, y: 0 }, { x: 1, y: 0 })).toBe(1));
  it("orthogonal = 0", () => expect(dot({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(0));
  it("parallel", () => expect(dot({ x: 2, y: 0 }, { x: 3, y: 0 })).toBe(6));
  it("arbitrary", () => expect(dot({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(11));
});

describe("scale", () => {
  it("positive", () => expect(scale({ x: 2, y: 3 }, 2)).toEqual({ x: 4, y: 6 }));
  it("negative", () => expect(scale({ x: 2, y: 3 }, -1)).toEqual({ x: -2, y: -3 }));
  it("zero", () => expect(scale({ x: 5, y: 7 }, 0)).toEqual({ x: 0, y: 0 }));
});

describe("abs", () => {
  it("positive unchanged", () => expect(abs({ x: 3, y: 4 })).toEqual({ x: 3, y: 4 }));
  it("flips negatives", () => expect(abs({ x: -3, y: -4 })).toEqual({ x: 3, y: 4 }));
  it("mixed", () => expect(abs({ x: -3, y: 4 })).toEqual({ x: 3, y: 4 }));
});

describe("cross", () => {
  it("parallel = 0", () => expect(cross({ x: 1, y: 0 }, { x: 2, y: 0 })).toBe(0));
  it("ccw = 1", () => expect(cross({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(1));
  it("cw = -1", () => expect(cross({ x: 0, y: 1 }, { x: 1, y: 0 })).toBe(-1));
});

describe("rotate", () => {
  it("0° unchanged", () => {
    const r = rotate({ x: 1, y: 0 }, 0);
    expect(r.x).toBeCloseTo(1);
    expect(r.y).toBeCloseTo(0);
  });
  it("90° (1,0) → (0,1)", () => {
    const r = rotate({ x: 1, y: 0 }, 90);
    expect(r.x).toBeCloseTo(0, 5);
    expect(r.y).toBeCloseTo(1);
  });
  it("180° (1,0) → (-1,0)", () => {
    const r = rotate({ x: 1, y: 0 }, 180);
    expect(r.x).toBeCloseTo(-1, 5);
    expect(r.y).toBeCloseTo(0, 5);
  });
  it("360° returns to original", () => {
    const r = rotate({ x: 1, y: 0 }, 360);
    expect(r.x).toBeCloseTo(1);
    expect(r.y).toBeCloseTo(0, 5);
  });
  it("preserves magnitude", () => {
    const v: Vec2 = { x: 3, y: 4 };
    const r = rotate(v, 37);
    expect(Math.sqrt(dot(r, r))).toBeCloseTo(Math.sqrt(dot(v, v)));
  });
});

describe("delta", () => {
  it("end − start", () => expect(delta({ x: 10, y: 20 }, { x: 30, y: 50 })).toEqual({ x: 20, y: 30 }));
  it("falsy start → {0,0}", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(delta(undefined as any, { x: 10, y: 20 })).toEqual({ x: 0, y: 0 });
  });
  it("falsy end → {0,0}", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(delta({ x: 10, y: 20 }, undefined as any)).toEqual({ x: 0, y: 0 });
  });
});

describe("add", () => {
  it("adds", () => expect(add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 }));
  it("negatives", () => expect(add({ x: -1, y: 2 }, { x: 3, y: -4 })).toEqual({ x: 2, y: -2 }));
});

describe("normalizeDeg", () => {
  it("0 → 0", () => expect(normalizeDeg(0)).toBe(0));
  it("360 → 0", () => expect(normalizeDeg(360)).toBe(0));
  it("720 → 0", () => expect(normalizeDeg(720)).toBe(0));
  it("-90 → 270", () => expect(normalizeDeg(-90)).toBe(270));
  it("450 → 90", () => expect(normalizeDeg(450)).toBe(90));
  it("180 unchanged", () => expect(normalizeDeg(180)).toBe(180));
});
