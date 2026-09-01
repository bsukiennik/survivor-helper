import { describe, expect, it } from 'vitest';
import { isValidTileCoordinate } from './tile-coordinates.js';

describe('isValidTileCoordinate', () => {
  it('accepts a valid coordinate within bounds for its zoom level', () => {
    expect(isValidTileCoordinate(5, 16, 11)).toBe(true);
    expect(isValidTileCoordinate(0, 0, 0)).toBe(true);
  });

  it('rejects negative x/y even though they parse as integers', () => {
    expect(isValidTileCoordinate(5, -1, 11)).toBe(false);
    expect(isValidTileCoordinate(5, 16, -1)).toBe(false);
  });

  it('rejects negative zoom', () => {
    expect(isValidTileCoordinate(-1, 0, 0)).toBe(false);
  });

  it('rejects x/y out of range for the given zoom', () => {
    // at z=5 the valid index range is 0..31
    expect(isValidTileCoordinate(5, 32, 0)).toBe(false);
    expect(isValidTileCoordinate(5, 0, 32)).toBe(false);
  });

  it('rejects zoom above the configured maximum', () => {
    expect(isValidTileCoordinate(23, 0, 0)).toBe(false);
  });

  it('rejects non-integer values', () => {
    expect(isValidTileCoordinate(5.5, 16, 11)).toBe(false);
    expect(isValidTileCoordinate(5, 16.1, 11)).toBe(false);
  });
});
