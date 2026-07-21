import {describe, expect, it} from "vitest";
import type {RectState} from "../src";
import {convertToCentered, convertToPercent, convertToPixels, convertFromCentered,} from "../src";

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

describe("convertToTopLeft", () => {
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