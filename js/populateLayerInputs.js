// populateLayerInputs.js
import { createColorInput } from './colorInputPanel.js';
import { dom } from './ui.js';
import { lookupColor } from './color-functions.js';
import { handlePatternSelection } from './patternSelection.js';
import { appState } from './state.js';

// Populate the layer inputs UI
export function populateLayerInputs(patternOverride) {
    try {
        const pattern = patternOverride || appState.selectedCollection.patterns.find(p => p.id === patternId);
        if (!pattern) {
            console.error(`Pattern ${patternId} not found`);
            return;
        }

        handlePatternSelection(pattern.name);
        appState.layerInputs = [];
        appState.currentLayers = [];

        if (dom.layerInputsContainer) {
            dom.layerInputsContainer.innerHTML = "";
        } else {
            console.error("layerInputsContainer not found");
            return;
        }

        const designerColors = (appState.currentPattern?.designer_colors || pattern.designer_colors || []);

        // Add background
        appState.currentLayers.push({
            label: "Background",
            color: designerColors[0] || "Snowbound"
        });

        // Add optional furniture base
        if (pattern.furnitureBase) {
            appState.currentLayers.push({
                label: "Furniture Base",
                color: designerColors[1] || "Snowbound"
            });
        }

        const startIndex = pattern.furnitureBase ? 2 : 1;
        const layerLabels = pattern.layerLabels || [];
        const patternLayers = pattern.layers || [];

        patternLayers.forEach((_, i) => {
            const color = designerColors[startIndex + i] || "Snowbound";
            const label = layerLabels[i] || `Layer ${i + 1}`;
            appState.currentLayers.push({ label, color });
        });

        appState.currentLayers.forEach((layer, index) => {
            const id = `layer-${index}`;
            const isBackground = layer.label === "Background";
            const layerData = createColorInput(layer.label, id, layer.color, isBackground);
            appState.layerInputs[index] = {
                ...layerData,
                color: layer.color,
                hex: lookupColor(layer.color) || "#FFFFFF"
            };
        });

        console.log("✅ Populated layerInputs:", appState.layerInputs.map(l => ({ label: l.label, value: l.input.value })));
    } catch (e) {
        console.error("❌ Error in populateLayerInputs:", e);
    }
}
