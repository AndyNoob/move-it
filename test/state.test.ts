import { describe, expect, it } from "vitest";
import type { RectState } from "../src";
import {
  convertToCentered,
  convertToPercent,
  convertToPixels,
  convertFromCentered,
} from "../src";

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

describe("pixel ↔ percent round trips", () => {
  it("round-trips top-left pixel state through percent and back", () => {
    const original: RectState = {
      x: 100,
      y: 150,
      width: 200,
      height: 100,
      rotation: 45,
      usePercent: false,
      centered: false,
    };

    const percent = convertToPercent(container, original);
    const restored = convertToPixels(container, percent);

    expect(restored.x).toBeCloseTo(original.x);
    expect(restored.y).toBeCloseTo(original.y);
    expect(restored.width).toBeCloseTo(original.width);
    expect(restored.height).toBeCloseTo(original.height);
    expect(restored.rotation).toBe(original.rotation);
    expect(restored.usePercent).toBe(false);
    expect(restored.centered).toBe(false);
  });

  it("round-trips centered pixel state through percent and back", () => {
    const original: RectState = {
      x: 400,
      y: 300,
      width: 200,
      height: 100,
      rotation: 90,
      usePercent: false,
      centered: true,
    };

    const percent = convertToPercent(container, original);
    const restored = convertToPixels(container, percent);

    expect(restored.x).toBeCloseTo(original.x);
    expect(restored.y).toBeCloseTo(original.y);
    expect(restored.width).toBeCloseTo(original.width);
    expect(restored.height).toBeCloseTo(original.height);
    expect(restored.rotation).toBe(original.rotation);
    expect(restored.usePercent).toBe(false);
    expect(restored.centered).toBe(true);
  });

  it("convertToPercent is a no-op when already in percent", () => {
    const state: RectState = {
      x: 0.5,
      y: 0.5,
      width: 0.25,
      height: 0.25,
      rotation: 0,
      usePercent: true,
    };

    const result = convertToPercent(container, state);

    expect(result).toBe(state);
  });

  it("convertToPixels is a no-op when already in pixels", () => {
    const state: RectState = {
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      rotation: 0,
      usePercent: false,
    };

    const result = convertToPixels(container, state);

    expect(result).toBe(state);
  });

  it("preserves rotation through percent ↔ pixel round-trip", () => {
    const original: RectState = {
      x: 200,
      y: 100,
      width: 300,
      height: 150,
      rotation: 270,
      usePercent: false,
    };

    const percent = convertToPercent(container, original);
    expect(percent.rotation).toBe(270);

    const restored = convertToPixels(container, percent);
    expect(restored.rotation).toBe(270);
  });
});

describe("multi-conversion round trips", () => {
  it("top-left → centered → percent → pixels → top-left (full identity chain)", () => {
    const original: RectState = {
      x: 160,
      y: 120,
      width: 320,
      height: 240,
      rotation: 45,
      usePercent: false,
      centered: false,
    };

    const centered = convertToCentered(original);
    const percent = convertToPercent(container, centered);
    const pixels = convertToPixels(container, percent);
    const backToTopLeft = convertFromCentered(pixels);

    expect(backToTopLeft.x).toBeCloseTo(original.x);
    expect(backToTopLeft.y).toBeCloseTo(original.y);
    expect(backToTopLeft.width).toBeCloseTo(original.width);
    expect(backToTopLeft.height).toBeCloseTo(original.height);
    expect(backToTopLeft.rotation).toBe(original.rotation);
    expect(backToTopLeft.usePercent).toBe(false);
    expect(backToTopLeft.centered).toBe(false);
  });

  it("centered → top-left → percent → pixels → centered (reverse chain)", () => {
    const original: RectState = {
      x: 400,
      y: 300,
      width: 200,
      height: 100,
      rotation: 180,
      usePercent: false,
      centered: true,
    };

    const topLeft = convertFromCentered(original);
    const percent = convertToPercent(container, topLeft);
    const pixels = convertToPixels(container, percent);
    const backToCentered = convertToCentered(pixels);

    expect(backToCentered.x).toBeCloseTo(original.x);
    expect(backToCentered.y).toBeCloseTo(original.y);
    expect(backToCentered.width).toBeCloseTo(original.width);
    expect(backToCentered.height).toBeCloseTo(original.height);
    expect(backToCentered.rotation).toBe(original.rotation);
    expect(backToCentered.usePercent).toBe(false);
    expect(backToCentered.centered).toBe(true);
  });

  it("percentage state survives centered ↔ top-left round-trip", () => {
    const original: RectState = {
      x: 0.2,
      y: 0.3,
      width: 0.4,
      height: 0.2,
      rotation: 15,
      usePercent: true,
      centered: false,
    };

    const centered = convertToCentered(original);
    const backToTopLeft = convertFromCentered(centered);

    expect(backToTopLeft.x).toBeCloseTo(original.x);
    expect(backToTopLeft.y).toBeCloseTo(original.y);
    expect(backToTopLeft.usePercent).toBe(true);
    expect(backToTopLeft.centered).toBe(false);
  });
});

describe("edge cases", () => {
  it("convertToPercent and convertToPixels preserve usePercent flag correctly", () => {
    const pixelState: RectState = {
      x: 200,
      y: 150,
      width: 400,
      height: 300,
      rotation: 0,
      usePercent: false,
    };

    const percentState = convertToPercent(container, pixelState);
    expect(percentState.usePercent).toBe(true);

    const backToPixels = convertToPixels(container, percentState);
    expect(backToPixels.usePercent).toBe(false);
  });

  it("convertToCentered followed by convertFromCentered restores original values with rotation", () => {
    const angles = [0, 45, 90, 135, 180, 225, 270, 315, 359];

    for (const angle of angles) {
      const original: RectState = {
        x: 100,
        y: 200,
        width: 150,
        height: 75,
        rotation: angle,
        centered: false,
      };

      const centered = convertToCentered(original);
      const restored = convertFromCentered(centered);

      expect(restored).toEqual(original);
    }
  });

  it("conversion chain works with undefined centered (implicit top-left)", () => {
    const state: RectState = {
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      rotation: 0,
      usePercent: false,
    };

    // centered should be undefined, treated as top-left
    expect(state.centered).toBeUndefined();

    const percent = convertToPercent(container, state);
    expect(percent.usePercent).toBe(true);
    expect(percent.centered).toBeFalsy();

    const restored = convertToPixels(container, percent);
    expect(restored.x).toBeCloseTo(state.x);
    expect(restored.y).toBeCloseTo(state.y);
  });
});
