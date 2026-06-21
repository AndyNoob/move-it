import { describe, expect, it, afterEach } from "vitest";
import {createMoveMe} from "../src/index.js";
import {CONTROLS_ID} from "../src/dom/htmlUtil.js";

describe("createMoveMe", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates controls and can destroy them", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const instance = createMoveMe(el, {
      initialState: { x: 0, y: 0, width: 100, height: 50, rotation: 0 },
      onChange: () => {},
      controlRoot: document.body,
    });

    const target = el.dataset.moveItId;

    expect(instance).toBeDefined();
    expect(target).toBeDefined();

    instance.destroy();

    expect(
      document.querySelector(
        `.${CONTROLS_ID} .container[data-move-it-target="${target}"]`
      )
    ).toBeNull();
  });
});