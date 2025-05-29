// coordinatePatternManager.js

import { appState } from './state.js';
import { dom } from './ui.js';
import { toInitialCaps } from './utils.js';
import { lookupColor } from './color-functions.js';
import { createColorInput } from './colorInputPanel.js';
import { updatePreview } from './updatePreview.js';
import { updateRoomMockup } from './updateRoomMockup.js';
// import { updateFurniturePreview } from './updateFurniturePreview.js';
import { populateCoordinates } from './populateCoordinates.js';

export function setupCoordinateImageHandlers() {
    const coordinateImages = document.querySelectorAll(".coordinate-image");
    console.log(`Found ${coordinateImages.length} coordinate images`);
    coordinateImages.forEach(image => {
        image.removeEventListener("click", handleCoordinateClick);
        image.addEventListener("click", handleCoordinateClick);
    });

    function handleCoordinateClick() {
        const image = this;
        console.log('>>> handleCoordinateClick START <<<');

        if (!appState.originalPattern) {
            appState.originalPattern = { ...appState.currentPattern };
            appState.originalCoordinates = appState.selectedCollection?.coordinates ? [...appState.selectedCollection.coordinates] : [];
            appState.originalLayerInputs = appState.layerInputs.map((layer, index) => ({
                id: `layer-${index}`,
                label: layer.label,
                inputValue: layer.input.value,
                hex: layer.circle.style.backgroundColor,
                isBackground: layer.isBackground
            }));
            appState.originalCurrentLayers = appState.currentLayers.map(layer => ({ ...layer }));
            console.log("Stored original state:", {
                pattern: appState.originalPattern.name,
                coordinates: appState.originalCoordinates,
                layerInputs: appState.originalLayerInputs,
                currentLayers: appState.originalCurrentLayers
            });
        }

        document.querySelectorAll(".coordinate-image").forEach(img => img.classList.remove("selected"));
        image.classList.add("selected");

        const filename = image.dataset.filename;
        console.log(`Coordinate image clicked: ${filename}`);

        const coordinate = appState.selectedCollection?.coordinates?.find(coord => coord.path === filename);
        if (!coordinate) {
            console.error(`Coordinate not found for filename: ${filename}`);
            if (dom.coordinatesContainer) {
                dom.coordinatesContainer.innerHTML += "<p style='color: red;'>Error: Coordinate not found.</p>";
            }
            return;
        }
        console.log(`Found coordinate:`, coordinate);

        const primaryLayerIndex = appState.currentLayers.findIndex(layer => 
            layer.label !== "Background" && 
            !layer.label.toUpperCase().includes("SHADOW") && 
            !layer.imageUrl?.toUpperCase().includes("ISSHADOW")
        );
        if (primaryLayerIndex === -1) {
            console.error("No primary pattern layer found in appState.currentLayers:", appState.currentLayers);
            return;
        }
        console.log(`Primary layer index: ${primaryLayerIndex}`);

        const layerPaths = coordinate.layerPaths || (coordinate.layerPath ? [coordinate.layerPath] : []);
        if (layerPaths.length === 0) {
            console.error(`No layers found for coordinate: ${filename}`);
            return;
        }

        const coordImage = new Image();
        coordImage.src = layerPaths[0];
        coordImage.onload = () => {
            const imageWidth = coordImage.naturalWidth;
            const imageHeight = coordImage.naturalHeight;

            const layers = layerPaths.map(path => ({ path }));
            const layerLabels = layerPaths.map((_, index) => index === 0 ? "Flowers" : `Layer ${index + 1}`);

            appState.currentPattern = {
                ...appState.currentPattern,
                name: coordinate.filename.replace(/\.jpg$/, ''),
                thumbnail: coordinate.path,
                size: [imageWidth / 100, imageHeight / 100],
                layers,
                layerLabels,
                tintWhite: false
            };
            console.log(`Updated appState.currentPattern:`, appState.currentPattern);

            appState.currentLayers = appState.currentLayers.map((layer, index) => {
                if (index === primaryLayerIndex) {
                    console.log(`Updating layer at index ${index} with layerPath: ${layerPaths[0]}`);
                    return {
                        ...layer,
                        imageUrl: layerPaths[0]
                    };
                }
                return layer;
            });

            const currentColors = appState.layerInputs.map(layer => layer.input.value);
            console.log("Preserving colors:", currentColors);

            appState.layerInputs = [];
            if (dom.layerInputsContainer) dom.layerInputsContainer.innerHTML = "";
            appState.currentLayers.forEach((layer, index) => {
                const id = `layer-${index}`;
                const isBackground = layer.label === "Background";
                const initialColor = currentColors[index] || (isBackground ? "#FFFFFF" : "Snowbound");
                const layerData = createColorInput(layer.label, id, initialColor, isBackground);
                layerData.input.value = toInitialCaps(initialColor.replace(/^(SW|SC)\d+\s*/i, "").trim());
                layerData.circle.style.backgroundColor = lookupColor(initialColor) || "#FFFFFF";
                appState.layerInputs[index] = layerData;
                console.log(`Set ${layer.label} input to ${layerData.input.value}, circle to ${layerData.circle.style.backgroundColor}, id=${id}`);
            });

            // const isFurniturePattern = appState.currentPattern?.isFurniture || false;
            // if (isFurniturePattern) {
            //     updateFurniturePreview();
            // } else {
            //     updatePreview();
            // }

            updateRoomMockup();

            const coordinatesSection = document.getElementById("coordinatesSection");
            let backLink = document.getElementById("backToPatternLink");
            if (backLink) backLink.remove();
            backLink = document.createElement("a");
            backLink.id = "backToPatternLink";
            backLink.className = "font-island-moments text-[#f0e6d2] hover:text-[#beac9f] cursor-pointer mt-2 text-lg";
            backLink.textContent = "Back to Pattern";
            coordinatesSection.appendChild(backLink);
            backLink.addEventListener("click", restoreOriginalPattern);
        };
        coordImage.onerror = () => {
            console.error(`Failed to load coordinate image: ${layerPaths[0] || coordinate.layerPath}`);
        };
    }
}

export function restoreOriginalPattern() {
    try {
        console.log('>>> restoreOriginalPattern START <<<');

        if (!appState.originalPattern || !appState.originalCurrentLayers || !appState.originalLayerInputs) {
            console.warn("No original state to restore", {
                originalPattern: appState.originalPattern,
                originalCurrentLayers: appState.originalCurrentLayers,
                originalLayerInputs: appState.originalLayerInputs
            });
            return;
        }
        console.log("Restoring original pattern:", appState.originalPattern.name);

        appState.currentPattern = { ...appState.originalPattern };
        appState.currentLayers = appState.originalCurrentLayers.map(layer => ({ ...layer }));

        appState.layerInputs = [];
        if (dom.layerInputsContainer) {
            dom.layerInputsContainer.innerHTML = "";
        } else {
            console.error("layerInputsContainer not found");
            return;
        }

        appState.originalLayerInputs.forEach((layer, index) => {
            const id = layer.id || `layer-${index}`;
            const layerData = createColorInput(layer.label, id, layer.inputValue, layer.isBackground);
            layerData.input.value = toInitialCaps(layer.inputValue.replace(/^(SW|SC)\d+\s*/i, "").trim());
            layerData.circle.style.backgroundColor = layer.hex;
            appState.layerInputs[index] = layerData;
            console.log(`Restored ${layer.label} input to ${layer.inputValue}, circle to ${layer.hex}, id=${id}`);
        });

        updatePreview();
        updateRoomMockup();
        populateCoordinates();

        const coordinatesSection = document.getElementById("coordinatesSection");
        const backLink = document.getElementById("backToPatternLink");
        if (backLink) {
            backLink.remove();
            console.log("Removed Back to Pattern link");
        }
        const errorMessages = coordinatesSection.querySelectorAll("p[style*='color: red']");
        errorMessages.forEach(msg => msg.remove());
        console.log("Cleared error messages:", errorMessages.length);

        console.log('>>> restoreOriginalPattern END <<<');
    } catch (e) {
        console.error("Error restoring original pattern:", e);
    }
}

export function parseCoordinateFilename(filename) {
    console.log('Before click - Scroll Y:', window.scrollY);
    const parts = filename.split('/');
    const filePart = parts[5];
    const collectionName = 'coordinates';
    const patternPart = filePart
        .replace(/^BOMBAY-/, '')
        .replace(/\.jpg$/i, '');
    const patternName = patternPart
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    const normalizedPatternName = patternName;
    console.log(`Parsed filename: ${filename} → collection: ${collectionName}, pattern: ${normalizedPatternName}`);
    return { collectionName, patternName: normalizedPatternName };
}

export function loadPatternFromLocalCollections(collectionName, patternName) {
    try {
        if (!appState.collections || !appState.collections.length) {
            console.error("appState.collections is empty or not initialized");
            return null;
        }
        const collection = appState.collections.find(
            c => c.name.toLowerCase() === "coordinates"
        );
        if (!collection) {
            console.error("Coordinates collection not found in appState.collections");
            return null;
        }
        const pattern = collection.patterns.find(
            p => p.name.toLowerCase() === patternName.toLowerCase()
        );
        if (!pattern) {
            console.error(`Pattern ${patternName} not found in coordinates collection`);
            return null;
        }
        console.log(`Loaded pattern: ${pattern.name} from coordinates collection`);
        return { collection, pattern };
    } catch (error) {
        console.error(`Error accessing collections: ${error.message}`);
        return null;
    }
}
