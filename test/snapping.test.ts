import { describe, expect, it, afterEach, beforeAll, afterAll, vi } from "vitest";
import { handleDragSnap, handleRotateSnap } from "../src/dom/snapping";
import { createMoveMe } from "../src";

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
// handleRotateSnap
// =========================================================================

describe("handleRotateSnap", () => {
  it("snaps when within threshold", () => {
    expect(handleRotateSnap({ anglesDeg: [99], threshold: 5 }, 96)).toBe(99);
  });

  it("returns original when outside threshold", () => {
    expect(handleRotateSnap({ anglesDeg: [0, 90], threshold: 5 }, 50)).toBe(50);
  });

  it("snaps to the first matching angle", () => {
    // 48 is within 10 of both [45, 90]; first match (45) wins
    expect(handleRotateSnap({ anglesDeg: [45, 90], threshold: 10 }, 48)).toBe(45);
  });

  it("normalizes angle before checking", () => {
    // 400 → 40, |40 - 45| = 5, threshold is 6 → snaps
    expect(handleRotateSnap({ anglesDeg: [45], threshold: 6 }, 400)).toBe(45);
  });

  it("near 0° snaps", () => {
    expect(handleRotateSnap({ anglesDeg: [0], threshold: 5 }, 3)).toBe(0);
  });
});

// =========================================================================
// handleDragSnap — tested via createMoveMe for the Moving instance
// =========================================================================

describe("handleDragSnap via createMoveMe", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("snaps to a nearby vertical guide", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "offsetWidth", { value: 100, configurable: true });
    Object.defineProperty(el, "offsetHeight", { value: 50, configurable: true });
    document.body.appendChild(el);

    const instance = createMoveMe(el, {
      initialState: { x: 98, y: 0, width: 100, height: 50, rotation: 0 },
      controlRoot: document.body,
      snapping: { grid: { threshold: 5, displayThreshold: 200, verticalX: [150] } },
    });
    instance.select();
    instance.updateControls(true);

    const state = instance.getState();
    const snapped = handleDragSnap(instance, state, { threshold: 5, displayThreshold: 200, verticalX: [150] }, instance.getOptions());

    // pivot = 98 + 50 = 148, |150-148| = 2 < 5 → snap
    // snapped x = 150 - 50 = 100
    expect(snapped).toBeDefined();
    expect(snapped!.x).toBe(100);
  });

  it("does not snap when outside threshold", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "offsetWidth", { value: 100, configurable: true });
    Object.defineProperty(el, "offsetHeight", { value: 50, configurable: true });
    document.body.appendChild(el);

    const instance = createMoveMe(el, {
      initialState: { x: 0, y: 0, width: 100, height: 50, rotation: 0 },
      controlRoot: document.body,
    });

    const state = instance.getState();
    const snapped = handleDragSnap(instance, state, { threshold: 5, displayThreshold: 200, verticalX: [150] }, instance.getOptions());

    // pivot = 0 + 50 = 50, |150-50| = 100 > 5 → no snap, returns unchanged state
    expect(snapped!.x).toBe(0);
    expect(snapped!.y).toBe(0);
  });

  it("snaps with pivotOffset affecting pivot point", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "offsetWidth", { value: 100, configurable: true });
    Object.defineProperty(el, "offsetHeight", { value: 50, configurable: true });
    document.body.appendChild(el);

    const instance = createMoveMe(el, {
      initialState: { x: 48, y: 0, width: 100, height: 50, rotation: 0 },
      controlRoot: document.body,
      pivotOffset: { x: 0.5, y: 0 },
    });

    const state = instance.getState();
    const snapped = handleDragSnap(instance, state, { threshold: 5, displayThreshold: 200, verticalX: [150] }, instance.getOptions());

    // pivot = 48 + 50 + 0.5*100 = 148, |150-148| = 2 < 5 → snap
    // snapped x = 150 - 50 - 50 = 50
    expect(snapped).toBeDefined();
    expect(snapped!.x).toBe(50);
  });
});
