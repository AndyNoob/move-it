import {describe, expect, it} from "vitest";
import type {RectState} from "../src";
import {convertToAnchored, convertFromAnchored, convertToCentered, convertToPercent, convertToPixels, convertFromCentered} from "../src";

const container = {
  offsetWidth: 800,
  offsetHeight: 600,
};

describe("convertToCentered", () => {
  it("converts pixel top-left coordinates to centered coordinates", () => {
    const state: RectState = {
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      rotation: 0,
      usePercent: false,
      centered: false,
    };

    expect(convertToCentered(state)).toEqual({
      ...state,
      x: 200,
      y: 200,
      centered: true,
    });
  });

  it("converts percentage top-left coordinates to centered coordinates", () => {
    const state: RectState = {
      x: 0.125,
      y: 0.25,
      width: 0.25,
      height: 1 / 6,
      rotation: 0,
      usePercent: true,
      centered: false,
    };

    expect(convertToCentered(state)).toEqual({
      ...state,
      x: 0.25,
      y: 1 / 3,
      centered: true,
    });
  });

  it("returns the same object when already centered", () => {
    const state: RectState = {
      x: 200,
      y: 200,
      width: 200,
      height: 100,
      rotation: 0,
      usePercent: false,
      centered: true,
    };

    expect(convertToCentered(state)).toBe(state);
  });
});

describe("convertFromCentered", () => {
  it("converts centered pixel coordinates to top-left coordinates", () => {
    const state: RectState = {
      x: 200,
      y: 200,
      width: 200,
      height: 100,
      rotation: 0,
      usePercent: false,
      centered: true,
    };

    expect(convertFromCentered(state)).toEqual({
      ...state,
      x: 100,
      y: 150,
      centered: false,
    });
  });

  it("converts centered percentage coordinates to top-left coordinates", () => {
    const state: RectState = {
      x: 0.25,
      y: 1 / 3,
      width: 0.25,
      height: 1 / 6,
      rotation: 0,
      usePercent: true,
      centered: true,
    };

    expect(convertFromCentered(state)).toEqual({
      ...state,
      x: 0.125,
      y: 0.25,
      centered: false,
    });
  });

  it("returns the same object when already top-left based", () => {
    const state: RectState = {
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      rotation: 0,
      usePercent: false,
      centered: false,
    };

    expect(convertFromCentered(state)).toBe(state);
  });
});

describe("centered conversion round trips", () => {
  it("round-trips a pixel state", () => {
    const original: RectState = {
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      rotation: 30,
      usePercent: false,
      centered: false,
    };

    const centered = convertToCentered(original);
    const restored = convertFromCentered(centered);

    expect(restored).toEqual(original);
  });

  it("round-trips a percentage state", () => {
    const original: RectState = {
      x: 0.125,
      y: 0.25,
      width: 0.25,
      height: 1 / 6,
      rotation: 30,
      usePercent: true,
      centered: false,
    };

    const centered = convertToCentered(original);
    const restored = convertFromCentered(centered);

    expect(restored.x).toBeCloseTo(original.x);
    expect(restored.y).toBeCloseTo(original.y);
    expect(restored.width).toBeCloseTo(original.width);
    expect(restored.height).toBeCloseTo(original.height);
    expect(restored).toMatchObject({
      rotation: original.rotation,
      usePercent: true,
      centered: false,
    });
  });

  it("converts centered pixels to percentages and back", () => {
    const original: RectState = {
      x: 200,
      y: 200,
      width: 200,
      height: 100,
      rotation: 30,
      usePercent: false,
      centered: true,
    };

    const percent = convertToPercent(container, original);

    expect(percent.x).toBeCloseTo(0.25);
    expect(percent.y).toBeCloseTo(1 / 3);
    expect(percent.width).toBeCloseTo(0.25);
    expect(percent.height).toBeCloseTo(1 / 6);
    expect(percent).toMatchObject({
      rotation: 30,
      usePercent: true,
      centered: true,
    });

    const restored = convertToPixels(container, percent);

    expect(restored.x).toBeCloseTo(original.x);
    expect(restored.y).toBeCloseTo(original.y);
    expect(restored.width).toBeCloseTo(original.width);
    expect(restored.height).toBeCloseTo(original.height);
    expect(restored).toMatchObject({
      rotation: 30,
      usePercent: false,
      centered: true,
    });
  });
});

describe("centered with unit conversions", () => {
  it("convertToPercent preserves the centered flag", () => {
    const state: RectState = {
      x: 400,
      y: 300,
      width: 200,
      height: 100,
      rotation: 0,
      usePercent: false,
      centered: true,
    };

    const result = convertToPercent(container, state);

    expect(result.centered).toBe(true);
    expect(result.usePercent).toBe(true);
    expect(result.x).toBeCloseTo(0.5);
    expect(result.y).toBeCloseTo(0.5);
  });

  it("convertToPixels preserves the centered flag", () => {
    const state: RectState = {
      x: 0.5,
      y: 0.5,
      width: 0.25,
      height: 1 / 6,
      rotation: 0,
      usePercent: true,
      centered: true,
    };

    const result = convertToPixels(container, state);

    expect(result.centered).toBe(true);
    expect(result.usePercent).toBe(false);
    expect(result.x).toBeCloseTo(400);
    expect(result.y).toBeCloseTo(300);
  });

  it("convertToPercent does not add centered flag when input is top-left", () => {
    const state: RectState = {
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      rotation: 0,
      usePercent: false,
      centered: false,
    };

    const result = convertToPercent(container, state);

    expect(result.centered).toBeFalsy();
    expect(result.usePercent).toBe(true);
  });

  it("convertToCentered works when centered is undefined", () => {
    const state: RectState = {
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      rotation: 0,
    };

    const result = convertToCentered(state);

    expect(result.x).toBe(200);
    expect(result.y).toBe(200);
    expect(result.centered).toBe(true);
  });
});

describe("anchored conversions", () => {
  describe("convertToAnchored", () => {
    it("converts top-left coordinates to anchored with zero offset (pivot = center)", () => {
      const state: RectState = {
        x: 100,
        y: 150,
        width: 200,
        height: 100,
        rotation: 0,
      };

      const result = convertToAnchored(state, { x: 0, y: 0 });

      // x = 100 + 200/2 + 200*0 = 200
      // y = 150 + 100/2 + 100*0 = 200
      expect(result.x).toBe(200);
      expect(result.y).toBe(200);
      expect(result.anchored).toBe(true);
    });

    it("converts top-left coordinates to anchored with non-zero offset", () => {
      const state: RectState = {
        x: 100,
        y: 150,
        width: 200,
        height: 100,
        rotation: 0,
      };

      const result = convertToAnchored(state, { x: 0.5, y: -0.5 });

      // x = 100 + 100 + 0.5*200 = 300
      // y = 150 + 50 + (-0.5)*100 = 150
      expect(result.x).toBe(300);
      expect(result.y).toBe(150);
      expect(result.anchored).toBe(true);
    });

    it("is idempotent when already anchored", () => {
      const state: RectState = {
        x: 200,
        y: 200,
        width: 200,
        height: 100,
        rotation: 0,
        anchored: true,
      };

      const result = convertToAnchored(state, { x: 0.5, y: 0.5 });

      expect(result).toBe(state);
    });

    it("converts from centered state, skipping half-dimension addition", () => {
      const state: RectState = {
        x: 200,
        y: 200,
        width: 200,
        height: 100,
        rotation: 0,
        centered: true,
      };

      const result = convertToAnchored(state, { x: 0, y: 0 });

      // centered skips adding half-dimensions:
      // x = 200 + 0 + 0 = 200
      // y = 200 + 0 + 0 = 200
      expect(result.x).toBe(200);
      expect(result.y).toBe(200);
      expect(result.anchored).toBe(true);
      expect(result.centered).toBe(true);
    });

    it("converts from centered state with non-zero offset", () => {
      const state: RectState = {
        x: 200,
        y: 200,
        width: 200,
        height: 100,
        rotation: 0,
        centered: true,
      };

      const result = convertToAnchored(state, { x: 0.5, y: 0.5 });

      // x = 200 + 0 + 0.5*200 = 300
      // y = 200 + 0 + 0.5*100 = 250
      expect(result.x).toBe(300);
      expect(result.y).toBe(250);
      expect(result.anchored).toBe(true);
      expect(result.centered).toBe(true);
    });
  });

  describe("convertFromAnchored", () => {
    it("converts anchored coordinates back to top-left with zero offset", () => {
      const state: RectState = {
        x: 200,
        y: 200,
        width: 200,
        height: 100,
        rotation: 0,
        anchored: true,
      };

      const result = convertFromAnchored(state, { x: 0, y: 0 });

      // x = 200 - 200/2 - 0 = 100
      // y = 200 - 100/2 - 0 = 150
      expect(result.x).toBe(100);
      expect(result.y).toBe(150);
      expect(result.anchored).toBe(false);
    });

    it("converts anchored coordinates back with non-zero offset", () => {
      const state: RectState = {
        x: 300,
        y: 150,
        width: 200,
        height: 100,
        rotation: 0,
        anchored: true,
      };

      const result = convertFromAnchored(state, { x: 0.5, y: -0.5 });

      // x = 300 - 100 - 0.5*200 = 100
      // y = 150 - 50 - (-0.5)*100 = 150
      expect(result.x).toBe(100);
      expect(result.y).toBe(150);
      expect(result.anchored).toBe(false);
    });

    it("is idempotent when not anchored", () => {
      const state: RectState = {
        x: 100,
        y: 150,
        width: 200,
        height: 100,
        rotation: 0,
      };

      const result = convertFromAnchored(state, { x: 0.5, y: 0.5 });

      expect(result).toBe(state);
    });

    it("returns anchored=false when converting from centered-anchored state", () => {
      const state: RectState = {
        x: 300,
        y: 250,
        width: 200,
        height: 100,
        rotation: 0,
        centered: true,
        anchored: true,
      };

      const result = convertFromAnchored(state, { x: 0.5, y: 0.5 });

      // x = 300 - 0 - 0.5*200 = 200 (skips half-dim subtract since centered)
      // y = 250 - 0 - 0.5*100 = 200
      expect(result.x).toBe(200);
      expect(result.y).toBe(200);
      expect(result.anchored).toBe(false);
      expect(result.centered).toBe(true);
    });

    it("restores top-left correctly from anchored when input was not centered", () => {
      const state: RectState = {
        x: 300,
        y: 250,
        width: 200,
        height: 100,
        rotation: 0,
        anchored: true,
      };

      const result = convertFromAnchored(state, { x: 0.5, y: 0.5 });

      // x = 300 - 100 - 0.5*200 = 100
      // y = 250 - 50 - 0.5*100 = 150
      expect(result.x).toBe(100);
      expect(result.y).toBe(150);
      expect(result.anchored).toBe(false);
    });
  });
});

describe("multi-family round trips", () => {
  it("top-left → anchored → top-left round trip with offset {0,0}", () => {
    const original: RectState = {
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      rotation: 30,
    };
    const offset = { x: 0, y: 0 };

    const anchored = convertToAnchored(original, offset);
    const restored = convertFromAnchored(anchored, offset);

    expect(restored).toEqual({ ...original, anchored: false });
  });

  it("top-left → anchored → top-left round trip with non-zero offset", () => {
    const original: RectState = {
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      rotation: 45,
    };
    const offset = { x: 0.5, y: -0.25 };

    const anchored = convertToAnchored(original, offset);
    const restored = convertFromAnchored(anchored, offset);

    expect(restored.x).toBeCloseTo(original.x);
    expect(restored.y).toBeCloseTo(original.y);
    expect(restored.width).toBe(original.width);
    expect(restored.height).toBe(original.height);
    expect(restored.rotation).toBe(original.rotation);
    expect(restored.anchored).toBe(false);
  });

  it("centered → anchored → centered round trip with non-zero offset", () => {
    const original: RectState = {
      x: 200,
      y: 200,
      width: 200,
      height: 100,
      rotation: 22.5,
      centered: true,
    };
    const offset = { x: 0.5, y: 0.5 };

    const anchored = convertToAnchored(original, offset);
    const restored = convertFromAnchored(anchored, offset);

    expect(restored.x).toBeCloseTo(original.x);
    expect(restored.y).toBeCloseTo(original.y);
    expect(restored.anchored).toBe(false);
    expect(restored.centered).toBe(true);
  });

  it("top-left → centered → anchored → centered → top-left three-way round trip", () => {
    const original: RectState = {
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      rotation: 30,
    };
    const offset = { x: -0.25, y: 0.5 };

    const centered = convertToCentered(original);
    const anchored = convertToAnchored(centered, offset);
    const backToCentered = convertFromAnchored(anchored, offset);
    const backToTopLeft = convertFromCentered(backToCentered);

    expect(backToTopLeft.x).toBeCloseTo(original.x);
    expect(backToTopLeft.y).toBeCloseTo(original.y);
    expect(backToTopLeft.width).toBe(original.width);
    expect(backToTopLeft.height).toBe(original.height);
    expect(backToTopLeft.rotation).toBe(original.rotation);
    expect(backToTopLeft.centered).toBe(false);
    expect(backToTopLeft.anchored).toBeFalsy();
  });

  it("anchored preserves identity through centered ↔ top-left conversions", () => {
    const original: RectState = {
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      rotation: 0,
    };
    const offset = { x: 0.25, y: 0.25 };

    const anchored = convertToAnchored(original, offset);
    expect(anchored.anchored).toBe(true);

    // Anchored → centered: convertToCentered treats anchored x/y as top-left,
    // so we get meaningful coordinates either way
    const anchoredAndCentered = convertToCentered(anchored);
    expect(anchoredAndCentered.centered).toBe(true);
    expect(anchoredAndCentered.anchored).toBe(true);

    // And back: convertFromCentered should still work
    const anchoredTopLeft = convertFromCentered(anchoredAndCentered);
    expect(anchoredTopLeft.centered).toBe(false);
    expect(anchoredTopLeft.anchored).toBe(true);

    // Original round trip through anchored still works
    const restored = convertFromAnchored(anchoredTopLeft, offset);
    expect(restored.x).toBeCloseTo(original.x);
    expect(restored.y).toBeCloseTo(original.y);
    expect(restored.anchored).toBe(false);
  });
});