import { expect, it, describe, afterEach } from "vitest";
import {handleDragSnap, handleRotateSnap} from "../src/dom/snapping";
import {createMoveMe, type SnappingOpt} from "../src";
import type {RectState} from "../src";
import type {SnappingGrid} from "../src/dom/createMoveMe";
import type {MoveMeOpt} from "../src";

describe("snapping", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("snaps to a nearby vertical guide and displays the guide", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const snapping: SnappingOpt = {
      grid: {
        threshold: 5,
        displayThreshold: 200,
        verticalX: [150],
      },
    };

    const options = {
      initialState: { x: 98, y: 0, width: 100, height: 50, rotation: 0 },
      controlRoot: document.body,
      snapping,
    };
    const instance = createMoveMe(el, options);

    instance.select();

    const controls = instance.updateControls();

    const state = instance.getState();
    handleDragSnap(state, snapping.grid!, options);

    // pivot center = 98 + 50 = 148, |150 - 148| = 2 < 5 → snaps
    // snapped x = 150 - 50 = 100
    expect(state.x).toBe(100);
    expect(controls.guides.vertical[0]).toBeDefined();
    expect(controls.guides.vertical[0]?.dataset.moveItVal).toBe("150");
  });

  it("snaps rotation when within threshold", () => {
    const snapping: SnappingOpt = {
      rotation: {
        anglesDeg: [99],
        threshold: 5,
      },
    };

    expect(handleRotateSnap(snapping.rotation!, 96)).toBe(99);
  });
});

describe("handleDragSnap with pivotOffset", () => {
  it("snaps pivot point (not center) when pivotOffset shifts pivot left", () => {
    const state: RectState = {
      x: 48,
      y: 0,
      width: 100,
      height: 50,
      rotation: 0,
    };
    const grid: SnappingGrid = {
      threshold: 5,
      displayThreshold: 200,
      verticalX: [150],
    };
    const options: MoveMeOpt = {
      controlRoot: document.body,
      pivotOffset: { x: 0.5, y: 0 },
    };

    handleDragSnap(state, grid, options);

    // pivot = 48 + 50 + 0.5*100 = 148, |150 - 148| = 2 < 5 → snaps
    // snapped x = 150 - 50 - 0.5*100 = 50
    expect(state.x).toBe(50);
  });

  it("does not snap when center is far from grid but pivotOffset brings it close", () => {
    // without pivotOffset: pivot center = 48 + 50 = 98, |150 - 98| = 52 > 5 → no snap
    // with pivotOffset {x:0.5}: pivot = 48 + 50 + 50 = 148, |150 - 148| = 2 < 5 → snaps
    const state: RectState = {
      x: 48,
      y: 0,
      width: 100,
      height: 50,
      rotation: 0,
    };
    const grid: SnappingGrid = {
      threshold: 5,
      displayThreshold: 200,
      verticalX: [150],
    };

    // Without pivotOffset, the center is too far — no snap
    const optionsNoOffset: MoveMeOpt = { controlRoot: document.body };
    const stateNoOffset = { ...state };
    handleDragSnap(stateNoOffset, grid, optionsNoOffset);
    expect(stateNoOffset.x).toBe(48); // unchanged

    // With pivotOffset, the pivot point moves closer — snaps
    const optionsWithOffset: MoveMeOpt = {
      controlRoot: document.body,
      pivotOffset: { x: 0.5, y: 0 },
    };
    const stateWithOffset = { ...state };
    handleDragSnap(stateWithOffset, grid, optionsWithOffset);
    expect(stateWithOffset.x).toBe(50); // snapped
  });

  it("snaps horizontal with pivotOffset affecting y-axis pivot", () => {
    const state: RectState = {
      x: 0,
      y: 48,
      width: 50,
      height: 100,
      rotation: 0,
    };
    const grid: SnappingGrid = {
      threshold: 5,
      displayThreshold: 200,
      horizontalY: [150],
    };
    const options: MoveMeOpt = {
      controlRoot: document.body,
      pivotOffset: { x: 0, y: 0.5 },
    };

    handleDragSnap(state, grid, options);

    // pivot y = 48 + 50 + 0.5*100 = 148, |150 - 148| = 2 < 5 → snaps
    // snapped y = 150 - 50 - 0.5*100 = 50
    expect(state.y).toBe(50);
  });
});
