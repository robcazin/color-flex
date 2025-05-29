// patternController.js
import { appState } from './state.js';
import { populateLayerInputs } from './populateLayerInputs.js';
import { populateCoordinates } from './populateCoordinates.js';
import { updatePreview } from './updatePreview.js';
import { updateRoomMockup } from './updateRoomMockup.js';

export async function loadPatternData(collection, patternId) {
    const pattern = collection.patterns.find(p => p.id === patternId);
    if (!pattern) {
        console.error(`Pattern with ID '${patternId}' not found in collection '${collection.name}'`);
        return;
    }

    console.log(`🎨 Loading pattern: ${pattern.name}`);

    appState.currentPattern = pattern;
    appState.currentLayers = structuredClone(pattern.layers || []);
    appState.originalPattern = structuredClone(pattern);
    appState.originalCurrentLayers = structuredClone(pattern.layers || []);
    appState.originalCoordinates = structuredClone(pattern.coordinates || []);
    appState.originalLayerInputs = null; // clear unless restored elsewhere

    populateLayerInputs(appState.currentPattern);
    populateCoordinates(pattern.coordinates || []);
    updatePreview();
    updateRoomMockup();
}
