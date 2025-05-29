// state.js
export const BACKGROUND_INDEX = 0;
export const FURNITURE_BASE_INDEX = 1;
export const PATTERN_BASE_INDEX = 2;

export const appState = {
  collections: [],
  colorsData: [],
  currentPattern: null,
  currentLayers: [],
  curatedColors: [],
  layerInputs: [],
  selectedCollection: null,
  cachedLayerPaths: [],
  lastSelectedLayer: null,
  currentScale: 10,
  designer_colors: [],
  originalPattern: null,
  originalCoordinates: null,
  originalLayerInputs: null,
  originalCurrentLayers: null,
  lastSelectedColor: null
};
