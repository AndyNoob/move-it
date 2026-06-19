export function degToRad(deg: number): number {
  return deg / 180 * Math.PI;
}

export function radToDeg(rad: number): number {
  return rad / Math.PI * 180;
}

export function normalize(vec: Vec2): Vec2 {
  const sqrt = Math.sqrt(dot(vec, vec));
  return {x: vec.x / sqrt, y: vec.y / sqrt};
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function scale(vec: Vec2, scalar: number) {
  return {x: vec.x * scalar, y: vec.y * scalar};
}

export function abs(vec: Vec2): Vec2 {
  return {x: Math.abs(vec.x), y: Math.abs(vec.y)};
}

/**
 * @param vec the vec
 * @param angleDeg in degrees, as the name suggests
 */
export function rotate(vec: Vec2, angleDeg: number) {
  const cos = Math.cos(degToRad(angleDeg));
  const sin = Math.sin(degToRad(angleDeg));
  return {x: vec.x * cos - vec.y * sin, y: vec.x * sin + vec.y * cos};
}

export interface Vec2 {
  x: number,
  y: number
}