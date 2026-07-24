import { describe, expect, it, vi } from "vitest";
import { renderToCss } from "../src";
import { getRotation, getDistanceToLine } from "../src/dom/htmlUtil";

// =========================================================================
// renderToCss
// =========================================================================

describe("renderToCss", () => {
  it("sets width and height by default", () => {
    const el = document.createElement("div");
    renderToCss(el, { x: 10, y: 20, width: 200, height: 100, rotation: 45 });
    expect(el.style.width).toBe("200px");
    expect(el.style.height).toBe("100px");
  });

  it("sets transform with translate and rotate", () => {
    const el = document.createElement("div");
    renderToCss(el, { x: 10, y: 20, width: 200, height: 100, rotation: 45 });
    expect(el.style.transform).toMatch(/translate\(10px,\s*20px\)/);
    expect(el.style.transform).toMatch(/rotate\(45deg\)/);
  });

  it("skips width/height when autoSize is true", () => {
    const el = document.createElement("div");
    renderToCss(el, { x: 10, y: 20, width: 200, height: 100, rotation: 0 }, true);
    expect(el.style.width).toBe("");
    expect(el.style.height).toBe("");
  });

  it("omit pivotOffset → no transformOrigin", () => {
    const el = document.createElement("div");
    renderToCss(el, { x: 0, y: 0, width: 100, height: 100, rotation: 0 });
    expect(el.style.transformOrigin).toBe("");
  });

  it("pivotOffset top-left → 0% 0%", () => {
    const el = document.createElement("div");
    renderToCss(el, { x: 0, y: 0, width: 100, height: 100, rotation: 0 }, false, { x: -0.5, y: -0.5 });
    expect(el.style.transformOrigin).toBe("0% 0%");
  });

  it("pivotOffset center → 50% 50%", () => {
    const el = document.createElement("div");
    renderToCss(el, { x: 0, y: 0, width: 100, height: 100, rotation: 0 }, false, { x: 0, y: 0 });
    expect(el.style.transformOrigin).toBe("50% 50%");
  });

  it("pivotOffset bottom-right → 100% 100%", () => {
    const el = document.createElement("div");
    renderToCss(el, { x: 0, y: 0, width: 100, height: 100, rotation: 0 }, false, { x: 0.5, y: 0.5 });
    expect(el.style.transformOrigin).toBe("100% 100%");
  });

  it("composes autoSize and pivotOffset", () => {
    const el = document.createElement("div");
    renderToCss(el, { x: 50, y: 25, width: 300, height: 200, rotation: 90 }, true, { x: 0.25, y: -0.25 });
    expect(el.style.width).toBe("");
    expect(el.style.height).toBe("");
    expect(el.style.transformOrigin).toBe("75% 25%");
    expect(el.style.transform).toMatch(/translate\(50px,\s*25px\)/);
    expect(el.style.transform).toMatch(/rotate\(90deg\)/);
  });
});

// =========================================================================
// getRotation
// =========================================================================

describe("getRotation", () => {
  it("returns 0 for an element with no transform", () => {
    const el = document.createElement("div");
    expect(getRotation(el)).toBe(0);
  });

  it("returns 0 when getComputedStyle returns 'none'", () => {
    const el = document.createElement("div");
    const spy = vi
      .spyOn(window, "getComputedStyle")
      .mockReturnValue({ getPropertyValue: () => "none" } as unknown as CSSStyleDeclaration);
    expect(getRotation(el)).toBe(0);
    spy.mockRestore();
  });
});

// =========================================================================
// getDistanceToLine
// =========================================================================

describe("getDistanceToLine", () => {
  function domRect(l: number, t: number, w: number, h: number): DOMRect {
    return {
      left: l, top: t, right: l + w, bottom: t + h,
      width: w, height: h, x: l, y: t,
      toJSON: () => ({}),
    };
  }

  describe("vertical line (x = k)", () => {
    it("returns 0 when intersecting", () => {
      expect(getDistanceToLine(domRect(100, 0, 200, 100), 200, false)).toBe(0);
    });
    it("rect to the right of line", () => {
      expect(getDistanceToLine(domRect(100, 0, 200, 100), 50, false)).toBe(50);
    });
    it("rect to the left of line", () => {
      expect(getDistanceToLine(domRect(100, 0, 200, 100), 350, false)).toBe(50);
    });
  });

  describe("horizontal line (y = k)", () => {
    it("returns 0 when intersecting", () => {
      expect(getDistanceToLine(domRect(0, 100, 100, 200), 200, true)).toBe(0);
    });
    it("rect below line", () => {
      expect(getDistanceToLine(domRect(0, 100, 100, 200), 50, true)).toBe(50);
    });
    it("rect above line", () => {
      expect(getDistanceToLine(domRect(0, 100, 100, 200), 350, true)).toBe(50);
    });
  });
});
