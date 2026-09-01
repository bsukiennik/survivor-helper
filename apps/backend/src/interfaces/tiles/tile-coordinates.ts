/**
 * Standard XYZ tile scheme bounds. `ParseIntPipe` alone accepts a negative
 * or wildly out-of-range integer (e.g. `z=-5`, `x=999999999999`) — it only
 * rejects non-numeric/decimal strings. This adds the bounds check
 * `ParseIntPipe` doesn't do.
 */
const MIN_ZOOM = 0;
const MAX_ZOOM = 22; // generous upper bound; OSM's raster tiles top out around 19-20

export function isValidTileCoordinate(z: number, x: number, y: number): boolean {
  if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y)) {
    return false;
  }
  if (z < MIN_ZOOM || z > MAX_ZOOM) {
    return false;
  }
  const maxIndex = 2 ** z - 1;
  return x >= 0 && x <= maxIndex && y >= 0 && y <= maxIndex;
}
