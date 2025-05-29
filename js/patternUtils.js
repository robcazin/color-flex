// patternUtils.js

export function isWallPattern(pattern, collection) {
  return pattern?.isWall || collection?.name === "wall-panels";
}
