// patternSelection.js
import { appState } from './state.js';
import { lookupColor } from './color-functions.js';
import { updateDisplays } from './displayController.js';
import { toInitialCaps } from './utils.js';

// Handle pattern selection and setup layer data
export function handlePatternSelection(patternName) {
    console.log(`handlePatternSelection: pattern=${patternName}, lockedCollection=${appState.lockedCollection}, currentCollection=${appState.selectedCollection?.name}`);
    const pattern = appState.selectedCollection.patterns.find(
        p => p.name.toUpperCase() === patternName.toUpperCase()
    ) || appState.selectedCollection.patterns[0];
    if (!pattern) {
        console.error(`Pattern ${patternName} not found in selected collection`);
        return;
    }
    appState.currentPattern = pattern;
    console.log("Pattern set to:", appState.currentPattern.name);
    console.log("Layer labels available:", appState.currentPattern.layerLabels);
    console.log("Layers available:", JSON.stringify(appState.currentPattern.layers, null, 2));

    const designerColors = appState.currentPattern.designer_colors || [];
    const curatedColors = appState.selectedCollection.curatedColors || [];
    const colorSource = designerColors.length > 0 ? designerColors : curatedColors;
    console.log("Color source:", JSON.stringify(colorSource, null, 2));

    appState.currentLayers = [];
    let colorIndex = 0;

    const isWallPanel = appState.selectedCollection?.name === "wall-panels";
    const isWall = pattern.isWall || isWallPanel;

    if (isWall) {
        const wallColor = colorSource[colorIndex] || "#FFFFFF";
        appState.currentLayers.push({ imageUrl: null, color: wallColor, label: "Wall Color" });
        colorIndex++;
    }

    const backgroundColor = colorSource[colorIndex] || "#FFFFFF";
    appState.currentLayers.push({ imageUrl: null, color: backgroundColor, label: "Background" });
    colorIndex++;

    if (!appState.currentPattern.tintWhite) {
        const overlayLayers = pattern.layers || [];
        console.log(`Processing ${overlayLayers.length} overlay layers`);
        overlayLayers.forEach((layer, index) => {
            const layerPath = layer.path || "";
            const label = pattern.layerLabels[index] || `Layer ${index + 1}`;
            const isShadow = label.toUpperCase().includes("SHADOW") || 
                             layerPath.toUpperCase().includes("ISSHADOW");
            if (!isShadow) {
                const layerColor = colorSource[colorIndex] || "#000000";
                appState.currentLayers.push({
                    imageUrl: layerPath,
                    color: layerColor,
                    label: label
                });
                console.log(`Assigned color to ${label}: ${layerColor}`);
                colorIndex++;
            }
        });
        console.log("Final appState.currentLayers:", JSON.stringify(appState.currentLayers, null, 2));
    }
}

// Apply color values to inputs based on layers
export function applyColorsToLayerInputs(colors, curatedColors = []) {
    console.log("Applying colors to layer inputs:", colors, 
                "Curated colors:", curatedColors,
                "Layer inputs length:", appState.layerInputs.length,
                "Current layers length:", appState.currentLayers.length);
    appState.layerInputs.forEach((layer, index) => {
        if (index >= appState.currentLayers.length) {
            console.warn(`Skipping input ${layer.label} at index ${index}: no corresponding currentLayer`);
            return;
        }
        const color = colors[index] || curatedColors[index] || (layer.isBackground ? "#FFFFFF" : "Snowbound");
        const cleanColor = color.replace(/^(SW|SC)\d+\s*/i, "").trim();
        const hex = lookupColor(color) || "#FFFFFF";
        layer.input.value = toInitialCaps(cleanColor);
        layer.circle.style.backgroundColor = hex;
        console.log(`Applied ${cleanColor} (${hex}) to ${layer.label} input (index ${index})`);

        appState.currentLayers[index].color = cleanColor;
    });
    console.log("Inputs after apply:", 
                appState.layerInputs.map(l => ({ id: l.input.id, label: l.label, value: l.input.value })));
    updateDisplays();
}

// Highlight active input layer
export function highlightActiveLayer(circle) {
    document.querySelectorAll(".circle-input").forEach((c) => (c.style.outline = "none"));
    circle.style.outline = "6px solid rgb(244, 255, 219)";
} 
