import { expect, it, describe, afterEach } from "vitest";
import {handleDragSnap, handleRotateSnap} from "../src/dom/snapping";
import {createMoveMe, type SnappingOpt} from "../src";

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
        verticalX: [100],
      },
    };

    const instance = createMoveMe(el, {
      initialState: { x: 98, y: 0, width: 100, height: 50, rotation: 0 },
      onChange: () => {},
      controlRoot: document.body,
      snapping,
    });

    instance.select();

    const controls = instance.updateControls();

    handleDragSnap(el, instance.state, snapping.grid!);

    expect(instance.state.x).toBe(100);
    expect(controls.guides.vertical[0]).toBeDefined();
    expect(controls.guides.vertical[0]?.dataset.moveItVal).toBe("100");
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