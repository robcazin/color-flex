// displayController.js
import { appState } from './state.js';
import { updatePreview } from './updatePreview.js';
import { updateRoomMockup } from './updateRoomMockup.js';
import { populateCoordinates } from './populateCoordinates.js';

// import { updateFurniturePreview } from './updateFurniture.js'; // if applicable

export function updateDisplays() {
  try {
    console.log('updateDisplays called');
    console.log('appState.currentLayers:', JSON.stringify(appState.currentLayers, null, 2));
    console.log('appState.layerInputs:', appState.layerInputs.map(li => ({
      label: li.label,
      value: li.input.value
    })));

    // const isFurniture = appState.currentPattern?.isFurniture;

    // if (isFurniture) {
    //   updateFurniturePreview();
    // } else {
    //   updatePreview();
    // }

    updateRoomMockup();
    populateCoordinates();
  } catch (e) {
    console.error('Error in updateDisplays:', e);
  }
}
