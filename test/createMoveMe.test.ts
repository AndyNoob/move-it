import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createMoveMe } from "../src";
import { CONTROLS_ID } from "../src/dom/htmlUtil";

function mockElDimensions(
  el: HTMLElement,
  width: number,
  height: number,
) {
  Object.defineProperty(el, "offsetWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(el, "offsetHeight", {
    value: height,
    configurable: true,
  });
}

describe("createMoveMe", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      vi.fn(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
      })),
    );
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

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
        `.${CONTROLS_ID} .container[data-move-it-target="${target}"]`,
      ),
    ).toBeNull();
  });

  describe("centered state integration", () => {
    it("initialState.centered: true stores coordinates as top-left internally", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      const instance = createMoveMe(el, {
        initialState: {
          x: 300,
          y: 250,
          width: 200,
          height: 100,
          rotation: 0,
          centered: true,
        },
        onChange: () => {},
        controlRoot: document.body,
      });

      const state = instance.getState();
      // 300 - 200/2 = 200, 250 - 100/2 = 200
      expect(state.x).toBe(200);
      expect(state.y).toBe(200);
      expect(state.width).toBe(200);
      expect(state.height).toBe(100);
    });

    it("getState(false, true) returns centered coordinates", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      const instance = createMoveMe(el, {
        initialState: {
          x: 200,
          y: 200,
          width: 200,
          height: 100,
          rotation: 0,
        },
        onChange: () => {},
        controlRoot: document.body,
      });

      const centered = instance.getState(false, true);
      // 200 + 200/2 = 300, 200 + 100/2 = 250
      expect(centered.x).toBe(300);
      expect(centered.y).toBe(250);
      expect(centered.centered).toBe(true);
    });

    it("getState() returns top-left coordinates by default", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      const instance = createMoveMe(el, {
        initialState: {
          x: 200,
          y: 200,
          width: 200,
          height: 100,
          rotation: 0,
          centered: true,
        },
        onChange: () => {},
        controlRoot: document.body,
      });

      const state = instance.getState();
      // internally stored as top-left: 200 - 100 = 100, 200 - 50 = 150
      expect(state.x).toBe(100);
      expect(state.y).toBe(150);
      expect(state.centered).toBeFalsy();
    });

    it("updateState with centered: true converts to top-left internally", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      const instance = createMoveMe(el, {
        initialState: {
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          rotation: 0,
        },
        onChange: () => {},
        controlRoot: document.body,
      });

      instance.updateState({ x: 300, y: 250, width: 200, height: 100, centered: true });

      const state = instance.getState();
      // 300 - 200/2 = 200, 250 - 100/2 = 200
      expect(state.x).toBe(200);
      expect(state.y).toBe(200);
      expect(state.width).toBe(200);
      expect(state.height).toBe(100);
    });
  });

  describe("autoSize integration", () => {
    it("does not set CSS width/height on the element when autoSize is true", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      createMoveMe(el, {
        initialState: {
          x: 10,
          y: 20,
          width: 300,
          height: 150,
          rotation: 0,
        },
        onChange: () => {},
        controlRoot: document.body,
        autoSize: true,
      });

      expect(el.style.width).toBe("");
      expect(el.style.height).toBe("");
    });

    it("syncs state dimensions from element offsetWidth/offsetHeight", () => {
      const el = document.createElement("div");
      mockElDimensions(el, 200, 100);
      document.body.appendChild(el);

      const instance = createMoveMe(el, {
        autoSize: true,
        onChange: () => {},
        controlRoot: document.body,
      });

      const state = instance.getState();
      expect(state.width).toBe(200);
      expect(state.height).toBe(100);
    });

    it("overrides initialState dimensions with measured element dimensions", () => {
      const el = document.createElement("div");
      mockElDimensions(el, 250, 80);
      document.body.appendChild(el);

      const instance = createMoveMe(el, {
        initialState: {
          x: 50,
          y: 50,
          width: 999,
          height: 999,
          rotation: 0,
        },
        autoSize: true,
        onChange: () => {},
        controlRoot: document.body,
      });

      const state = instance.getState();
      expect(state.width).toBe(250); // from element, not initialState
      expect(state.height).toBe(80);
      expect(state.x).toBe(50); // position preserved
      expect(state.y).toBe(50);
    });

    it("adjusts x/y to anchor the pivot when element dimensions change", () => {
      const el = document.createElement("div");
      mockElDimensions(el, 200, 100);
      document.body.appendChild(el);

      const instance = createMoveMe(el, {
        initialState: {
          x: 100,
          y: 100,
          width: 1,
          height: 1,
          rotation: 0,
        },
        autoSize: true,
        onChange: () => {},
        controlRoot: document.body,
      });

      // Initial state should have element dimensions
      const state1 = instance.getState();
      expect(state1.width).toBe(200);
      expect(state1.height).toBe(100);
      expect(state1.x).toBe(100);
      expect(state1.y).toBe(100);

      // Simulate element resize
      mockElDimensions(el, 300, 200);

      const state2 = instance.getState();
      expect(state2.width).toBe(300);
      expect(state2.height).toBe(200);

      // Pivot anchoring with default pivotOffset {x:0, y:0}:
      // oldPivot = (200/2 + 0, 100/2 + 0) = (100, 50)
      // newPivot = (300/2 + 0, 200/2 + 0) = (150, 100)
      // translation = (100-150, 50-100) = (-50, -50)
      // x = 100 + (-50) = 50, y = 100 + (-50) = 50
      expect(state2.x).toBe(50);
      expect(state2.y).toBe(50);
    });

    it("adjusts x/y with pivotOffset when element dimensions change", () => {
      const el = document.createElement("div");
      mockElDimensions(el, 200, 100);
      document.body.appendChild(el);

      const instance = createMoveMe(el, {
        initialState: {
          x: 100,
          y: 100,
          width: 1,
          height: 1,
          rotation: 0,
        },
        autoSize: true,
        pivotOffset: { x: 0.5, y: 0.5 },
        onChange: () => {},
        controlRoot: document.body,
      });

      const state1 = instance.getState();
      expect(state1.width).toBe(200);
      expect(state1.height).toBe(100);
      expect(state1.x).toBe(100);
      expect(state1.y).toBe(100);

      // Simulate element resize
      mockElDimensions(el, 300, 200);

      const state2 = instance.getState();
      expect(state2.width).toBe(300);
      expect(state2.height).toBe(200);

      // Pivot anchoring with pivotOffset {x:0.5, y:0.5}:
      // oldPivot = (200/2 + 0.5*200, 100/2 + 0.5*100) = (200, 100)
      // newPivot = (300/2 + 0.5*300, 200/2 + 0.5*200) = (300, 200)
      // translation = (200-300, 100-200) = (-100, -100)
      // x = 100 + (-100) = 0, y = 100 + (-100) = 0
      expect(state2.x).toBe(0);
      expect(state2.y).toBe(0);
    });

    it("still sets transform when autoSize is true", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      createMoveMe(el, {
        initialState: {
          x: 15,
          y: 25,
          width: 300,
          height: 150,
          rotation: 45,
        },
        autoSize: true,
        onChange: () => {},
        controlRoot: document.body,
      });

      expect(el.style.transform).toMatch(/translate\(15px,\s*25px\)/);
      expect(el.style.transform).toMatch(/rotate\(45deg\)/);
    });
  });

  describe("pivotOffset integration", () => {
    it("sets transformOrigin on the element", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      createMoveMe(el, {
        initialState: {
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          rotation: 0,
        },
        pivotOffset: { x: -0.5, y: -0.5 },
        onChange: () => {},
        controlRoot: document.body,
      });

      expect(el.style.transformOrigin).toBe("0% 0%");
    });

    it("does not set transformOrigin when pivotOffset is omitted", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      createMoveMe(el, {
        initialState: {
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          rotation: 0,
        },
        onChange: () => {},
        controlRoot: document.body,
      });

      expect(el.style.transformOrigin).toBe("");
    });

    it("composes autoSize and pivotOffset correctly", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      createMoveMe(el, {
        initialState: {
          x: 10,
          y: 20,
          width: 300,
          height: 200,
          rotation: 90,
        },
        autoSize: true,
        pivotOffset: { x: 0.5, y: 0.5 },
        onChange: () => {},
        controlRoot: document.body,
      });

      expect(el.style.transformOrigin).toBe("100% 100%");
      expect(el.style.width).toBe("");
      expect(el.style.height).toBe("");
      expect(el.style.transform).toMatch(/translate\(10px,\s*20px\)/);
      expect(el.style.transform).toMatch(/rotate\(90deg\)/);
    });
  });
});
