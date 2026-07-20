import { describe, expect, it, vi } from "vitest";
import { renderToCss } from "../src";
import type { RectState } from "../src";
import { getGlobalPivot } from "../src/dom/htmlUtil";

function mockRect(
  el: HTMLElement,
  rect: { left: number; top: number; width: number; height: number },
) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    x: rect.left,
    y: rect.top,
    left: rect.left,
    top: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    width: rect.width,
    height: rect.height,
    toJSON: () => ({}),
  });
}

describe("renderToCss", () => {
  it("sets width and height on the element by default", () => {
    const el = document.createElement("div");
    const state: RectState = {
      x: 10,
      y: 20,
      width: 200,
      height: 100,
      rotation: 45,
    };

    renderToCss(el, state);

    expect(el.style.width).toBe("200px");
    expect(el.style.height).toBe("100px");
  });

  it("sets transform with translate and rotate", () => {
    const el = document.createElement("div");
    const state: RectState = {
      x: 10,
      y: 20,
      width: 200,
      height: 100,
      rotation: 45,
    };

    renderToCss(el, state);

    expect(el.style.transform).toMatch(/translate\(10px,\s*20px\)/);
    expect(el.style.transform).toMatch(/rotate\(45deg\)/);
  });

  it("does not set width and height when autoSize is true", () => {
    const el = document.createElement("div");
    const state: RectState = {
      x: 10,
      y: 20,
      width: 200,
      height: 100,
      rotation: 0,
    };

    renderToCss(el, state, true);

    expect(el.style.width).toBe("");
    expect(el.style.height).toBe("");
    expect(el.style.transform).toMatch(/translate\(10px,\s*20px\)/);
  });

  it("does not set transformOrigin when pivotOffset is omitted", () => {
    const el = document.createElement("div");
    const state: RectState = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
    };

    renderToCss(el, state);
    expect(el.style.transformOrigin).toBe("");
  });

  it("sets transformOrigin when pivotOffset is provided (top-left)", () => {
    const el = document.createElement("div");
    const state: RectState = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
    };

    renderToCss(el, state, false, { x: -0.5, y: -0.5 });
    expect(el.style.transformOrigin).toBe("0% 0%");
  });

  it("sets transformOrigin to center with zero pivotOffset", () => {
    const el = document.createElement("div");
    const state: RectState = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
    };

    renderToCss(el, state, false, { x: 0, y: 0 });
    expect(el.style.transformOrigin).toBe("50% 50%");
  });

  it("sets transformOrigin to bottom-right with positive pivotOffset", () => {
    const el = document.createElement("div");
    const state: RectState = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
    };

    renderToCss(el, state, false, { x: 0.5, y: 0.5 });
    expect(el.style.transformOrigin).toBe("100% 100%");
  });

  it("composes autoSize and pivotOffset correctly", () => {
    const el = document.createElement("div");
    const state: RectState = {
      x: 50,
      y: 25,
      width: 300,
      height: 200,
      rotation: 90,
    };

    renderToCss(el, state, true, { x: 0.25, y: -0.25 });

    expect(el.style.width).toBe("");
    expect(el.style.height).toBe("");
    expect(el.style.transformOrigin).toBe("75% 25%");
    expect(el.style.transform).toMatch(/translate\(50px,\s*25px\)/);
    expect(el.style.transform).toMatch(/rotate\(90deg\)/);
  });
});

describe("getGlobalPivot", () => {
  it("returns element center when pivotOffset is omitted", () => {
    const el = document.createElement("div");
    mockRect(el, { left: 100, top: 100, width: 200, height: 100 });

    const pivot = getGlobalPivot(el);

    expect(pivot.x).toBe(200); // 100 + 200/2
    expect(pivot.y).toBe(150); // 100 + 100/2
  });

  it("offsets to bottom-right with positive pivotOffset", () => {
    const el = document.createElement("div");
    mockRect(el, { left: 100, top: 100, width: 200, height: 100 });

    const pivot = getGlobalPivot(el, { x: 0.5, y: 0.5 });

    expect(pivot.x).toBe(300); // 100 + 100 + 0.5*200
    expect(pivot.y).toBe(200); // 100 + 50 + 0.5*100
  });

  it("offsets to top-left with negative pivotOffset", () => {
    const el = document.createElement("div");
    mockRect(el, { left: 100, top: 100, width: 200, height: 100 });

    const pivot = getGlobalPivot(el, { x: -0.5, y: -0.5 });

    expect(pivot.x).toBe(100); // 100 + 100 + (-0.5)*200
    expect(pivot.y).toBe(100); // 100 + 50 + (-0.5)*100
  });

  it("returns center with zero pivotOffset", () => {
    const el = document.createElement("div");
    mockRect(el, { left: 100, top: 100, width: 200, height: 100 });

    const pivot = getGlobalPivot(el, { x: 0, y: 0 });

    expect(pivot.x).toBe(200);
    expect(pivot.y).toBe(150);
  });
});
