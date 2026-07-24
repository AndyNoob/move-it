import { describe, expect, it, afterEach, beforeAll, afterAll, vi } from "vitest";
import { createMoveMe, computeState, type RectState } from "../src";
import { rotateRect } from "../src/geometry/state";

// =========================================================================
// setup
// =========================================================================

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

// =========================================================================
// computeState
// =========================================================================

describe("computeState", () => {
  it("reads width and height from an element", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "offsetWidth", { value: 200, configurable: true });
    Object.defineProperty(el, "offsetHeight", { value: 100, configurable: true });
    const controlRoot = document.createElement("div");

    const state = computeState(el, { controlRoot });
    expect(state.width).toBe(200);
    expect(state.height).toBe(100);
    expect(typeof state.x).toBe("number");
    expect(typeof state.y).toBe("number");
    expect(typeof state.rotation).toBe("number");
  });
});

// =========================================================================
// rotateRect
// =========================================================================

describe("rotateRect", () => {
  it("sets and normalizes rotation", () => {
    const start: RectState = { x: 0, y: 0, width: 100, height: 50, rotation: 0 };
    expect(rotateRect(start, 400).rotation).toBe(40);
  });

  it("preserves other properties", () => {
    const start: RectState = { x: 42, y: 17, width: 100, height: 50, rotation: 0 };
    const result = rotateRect(start, 90);
    expect(result.x).toBe(42);
    expect(result.y).toBe(17);
    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
  });
});

// =========================================================================
// Format options: centered & asPercent (tested through createMoveMe)
// =========================================================================

describe("createMoveMe — format options", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("initialState with format.centered preserves centered coordinates", () => {
    const el = document.createElement("div");
    const controlRoot = document.createElement("div");
    controlRoot.appendChild(el);
    document.body.appendChild(controlRoot);

    const instance = createMoveMe(el, {
      initialState: { x: 300, y: 250, width: 200, height: 100, rotation: 0 },
      format: { centered: true },
      controlRoot,
    });

    // State is stored as prescribed by format — centered coords returned as-is.
    const state = instance.getState();
    expect(state.x).toBe(300);
    expect(state.y).toBe(250);
    expect(state.width).toBe(200);
    expect(state.height).toBe(100);
  });

  it("initialState with format.asPercent preserves percent values", () => {
    const el = document.createElement("div");
    const controlRoot = document.createElement("div");
    Object.defineProperty(controlRoot, "offsetWidth", { value: 800, configurable: true });
    Object.defineProperty(controlRoot, "offsetHeight", { value: 600, configurable: true });
    controlRoot.appendChild(el);
    document.body.appendChild(controlRoot);

    const instance = createMoveMe(el, {
      initialState: { x: 0.25, y: 0.5, width: 0.5, height: 0.25, rotation: 0 },
      format: { asPercent: true },
      controlRoot,
    });

    // State is stored as prescribed by format — percent values returned as-is.
    const state = instance.getState();
    expect(state.x).toBe(0.25);
    expect(state.y).toBe(0.5);
    expect(state.width).toBe(0.5);
    expect(state.height).toBe(0.25);
  });

  it("updateState with partial update preserves unspecified fields", () => {
    const el = document.createElement("div");
    const controlRoot = document.createElement("div");
    controlRoot.appendChild(el);
    document.body.appendChild(controlRoot);

    const instance = createMoveMe(el, {
      initialState: { x: 100, y: 100, width: 100, height: 50, rotation: 0 },
      controlRoot,
    });

    instance.updateState({ rotation: 45 });
    const state = instance.getState();
    expect(state.x).toBe(100);
    expect(state.rotation).toBe(45);
    expect(state.width).toBe(100);
    expect(state.height).toBe(50);
  });

  it("fires onChange on updateState", () => {
    const el = document.createElement("div");
    const controlRoot = document.createElement("div");
    controlRoot.appendChild(el);
    document.body.appendChild(controlRoot);

    let last: RectState | null = null;
    const instance = createMoveMe(el, {
      initialState: { x: 100, y: 100, width: 100, height: 50, rotation: 0 },
      controlRoot,
      onChange: (s) => { last = s; },
    });

    instance.updateState({ x: 200 });
    expect(last).not.toBeNull();
    expect(last!.x).toBe(200);
  });
});
