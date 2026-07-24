import { afterEach, beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { createMoveMe } from "../src";
import { CONTROLS_ID } from "../src/dom/htmlUtil";
import { dotDesignations, lineDesignations } from "../src/dom/controls";

describe("controls", () => {
  beforeAll(() => {
    vi.stubGlobal("ResizeObserver", vi.fn(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    })));
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  function makeInstance(
    opts?: Partial<{ x: number; y: number; w: number; h: number }>,
  ) {
    const el = document.createElement("div");
    document.body.appendChild(el);
    return createMoveMe(el, {
      initialState: {
        x: opts?.x ?? 50, y: opts?.y ?? 60,
        width: opts?.w ?? 120, height: opts?.h ?? 80,
        rotation: 0,
      },
      controlRoot: document.body,
    });
  }

  describe("updateControls", () => {
    it("creates a control container in the control box", () => {
      const instance = makeInstance();
      const controls = instance.updateControls(true);
      expect(document.querySelector(`.${CONTROLS_ID}`)).toBeDefined();
      expect(controls.container).toBeInstanceOf(HTMLDivElement);
      expect(controls.container.classList.contains("container")).toBe(true);
    });

    it("hides when selected=false, shows when selected=true", () => {
      const instance = makeInstance();
      expect(instance.updateControls(false).container.style.visibility).toBe("hidden");
      expect(instance.updateControls(true).container.style.visibility).toBe("visible");
    });

    it("creates all 5 line handles", () => {
      const c = makeInstance().updateControls(true);
      expect(c.lines.top).toBeInstanceOf(HTMLDivElement);
      expect(c.lines.bottom).toBeInstanceOf(HTMLDivElement);
      expect(c.lines.left).toBeInstanceOf(HTMLDivElement);
      expect(c.lines.right).toBeInstanceOf(HTMLDivElement);
      expect(c.lines.rotate).toBeInstanceOf(HTMLDivElement);
    });

    it("creates all 5 dot handles", () => {
      const c = makeInstance().updateControls(true);
      expect(c.dots.topLeft).toBeInstanceOf(HTMLDivElement);
      expect(c.dots.topRight).toBeInstanceOf(HTMLDivElement);
      expect(c.dots.bottomLeft).toBeInstanceOf(HTMLDivElement);
      expect(c.dots.bottomRight).toBeInstanceOf(HTMLDivElement);
      expect(c.dots.rotate).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("designation lookup", () => {
    it("getDotDesignation returns correct designation", () => {
      const c = makeInstance().updateControls(true);
      expect(c.getDotDesignation(c.dots.topRight)).toBe(dotDesignations.topRight);
      expect(c.getDotDesignation(document.createElement("div"))).toBeNull();
    });

    it("getLineDesignation returns correct designation", () => {
      const c = makeInstance().updateControls(true);
      expect(c.getLineDesignation(c.lines.left)).toBe(lineDesignations.left);
      expect(c.getLineDesignation(c.lines.rotate)).toBeNull();
      expect(c.getLineDesignation(document.createElement("div"))).toBeNull();
    });
  });

  describe("data attributes", () => {
    it("dots and lines have moveItDesignation", () => {
      const c = makeInstance().updateControls(true);
      expect(c.dots.topRight.dataset.moveItDesignation).toBe("topRight");
      expect(c.lines.top.dataset.moveItDesignation).toBe("top");
    });

    it("handles are scoped to target element", () => {
      const instance = makeInstance();
      const c = instance.updateControls(true);
      const target = instance.element.dataset.moveItId;
      expect(c.dots.topLeft.dataset.moveItTarget).toBe(target);
      expect(c.lines.bottom.dataset.moveItTarget).toBe(target);
    });
  });

  describe("destroy", () => {
    it("removes container from DOM", () => {
      const instance = makeInstance();
      const c = instance.updateControls(true);
      const target = instance.element.dataset.moveItId;
      c.destroy();
      expect(
        document.querySelector(`.${CONTROLS_ID} .container[data-move-it-target="${target}"]`),
      ).toBeNull();
    });
  });
});
