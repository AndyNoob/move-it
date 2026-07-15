import { describe, expect, it } from "vitest";
import { moveRect, rotateRect } from "../src/geometry/state";
import {
  convertToPercent,
  convertToPixels,
} from "../src";
import type { RectState } from "../src";

describe("state", () => {
  const rect = {
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    rotation: 0,
  };

  it("moves a rect by dx/dy", () => {
    expect(moveRect(rect, 5, -10)).toEqual({
      ...rect,
      x: 15,
      y: 10,
    });
  });

  it("rotates a rect", () => {
    expect(rotateRect(rect, 45)).toEqual({
      ...rect,
      rotation: 45,
    });
  });
});

const container = {
  offsetWidth: 800,
  offsetHeight: 600,
};

const pixelState: RectState = {
  x: 200,
  y: 150,
  width: 400,
  height: 300,
  rotation: 30,
  usePercent: false,
};

describe("convertToPercent", () => {
  it("converts pixel values into container-relative values", () => {
    expect(convertToPercent(container, pixelState)).toEqual({
      ...pixelState,
      x: 0.25,
      y: 0.25,
      width: 0.5,
      height: 0.5,
      usePercent: true,
    });
  });

  it("preserves unrelated state properties", () => {
    const result = convertToPercent(container, pixelState);

    expect(result.rotation).toBe(30);
  });

  it("returns the same object when already using percentages", () => {
    const percentState: RectState = {
      ...pixelState,
      x: 0.25,
      y: 0.25,
      width: 0.5,
      height: 0.5,
      usePercent: true,
    };

    expect(convertToPercent(container, percentState)).toBe(percentState);
  });

  it("supports positions outside the container", () => {
    const state: RectState = {
      ...pixelState,
      x: -80,
      y: 900,
    };

    expect(convertToPercent(container, state)).toMatchObject({
      x: -0.1,
      y: 1.5,
      usePercent: true,
    });
  });
});

describe("convertToPixels", () => {
  it("converts container-relative values into pixels", () => {
    const percentState: RectState = {
      ...pixelState,
      x: 0.25,
      y: 0.25,
      width: 0.5,
      height: 0.5,
      usePercent: true,
    };

    expect(convertToPixels(container, percentState)).toEqual({
      ...percentState,
      x: 200,
      y: 150,
      width: 400,
      height: 300,
      usePercent: false,
    });
  });

  it("returns the same object when already using pixels", () => {
    expect(convertToPixels(container, pixelState)).toBe(pixelState);
  });

  it("supports fractional pixel results", () => {
    const percentState: RectState = {
      ...pixelState,
      x: 1 / 3,
      y: 1 / 3,
      width: 1 / 3,
      height: 1 / 3,
      usePercent: true,
    };

    const result = convertToPixels(container, percentState);

    expect(result.x).toBeCloseTo(800 / 3);
    expect(result.y).toBeCloseTo(200);
    expect(result.width).toBeCloseTo(800 / 3);
    expect(result.height).toBeCloseTo(200);
  });
});

describe("pixel/percent conversion", () => {
  it("round-trips a pixel state", () => {
    const percent = convertToPercent(container, pixelState);
    const pixels = convertToPixels(container, percent);

    expect(pixels).toEqual(pixelState);
  });
});