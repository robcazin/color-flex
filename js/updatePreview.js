// updatePreview.js
import { appState } from './state.js';
import { dom } from './ui.js';
import { isWallPattern } from './patternUtils.js';
import { lookupColor } from './color-functions.js';
import { renderTintWhitePattern } from './renderTintWhitePattern.js';
import { renderStandardPattern } from './renderStandardPattern.js';
import { getCurrentScale } from './scaleControls.js';

export const updatePreview = async () => {
    try {
        console.log("🔍 updatePreview starting");
        console.log("🔍 appState.currentPattern:", appState.currentPattern);
        console.log("🔍 appState.currentPattern.name:", appState.currentPattern?.name);

        if (!dom.preview) {
            console.error("preview not found in DOM");
            return;
        }

        if (!appState.currentPattern) {
            console.error("No current pattern selected");
            return;
        }

        console.log('updatePreview called');
        console.log('appState.currentLayers:', appState.currentLayers);
        console.log('appState.layerInputs:', appState.layerInputs);

        const isWall = isWallPattern(appState.currentPattern, appState.selectedCollection);
        const tilingType = appState.currentPattern?.tilingType || "";
        const isHalfDrop = !isWall && tilingType === "half-drop";
        const backgroundIndex = isWall ? 1 : 0;
        const backgroundColor = lookupColor(appState.currentLayers[backgroundIndex]?.color || "Snowbound");
        console.log("Updating preview - Background color:", backgroundColor, "isWall:", isWall);

        const scale = getCurrentScale();
        const patternWidthInches = appState.currentPattern?.size?.[0] || 24;
        const patternHeightInches = appState.currentPattern?.size?.[1] || 24;

        const aspectRatio = patternHeightInches / patternWidthInches;
        const scaleFactor = Math.min(700 / patternWidthInches, 700 / patternHeightInches) * scale;
        const drawWidth = Math.round(patternWidthInches * scaleFactor);
        const drawHeight = Math.round(patternHeightInches * scaleFactor);
        const offsetX = Math.round((700 - drawWidth) / 2);
        const offsetY = Math.round((700 - drawHeight) / 2);

        const previewCanvas = document.createElement("canvas");
        const previewCtx = previewCanvas.getContext("2d", { willReadFrequently: true });
        previewCanvas.width = 700;
        previewCanvas.height = 700;

        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.fillStyle = backgroundColor;
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

        dom.preview.innerHTML = "";
        dom.preview.appendChild(previewCanvas);
        dom.preview.style.width = "700px";
        dom.preview.style.height = "700px";
        dom.preview.style.backgroundColor = "rgba(17, 24, 39, 1)";
        dom.preview.style.overflow = "hidden";
        dom.preview.style.transform = "none";
        dom.preview.style.boxSizing = "border-box";
        dom.preview.style.padding = "0";
        dom.preview.className = "w-[700px] h-[700px] overflow-hidden relative z-0 flex-shrink-0";

        console.log(`Preview initialized: background only.`);

        if (appState.currentPattern.tintWhite) {
            console.log("Rendering tintWhite pattern");
            await renderTintWhitePattern(previewCanvas, backgroundColor, isWall, isHalfDrop, scaleFactor);
        } else {
            console.log("Rendering standard pattern");
            await renderStandardPattern(previewCanvas, backgroundColor, isWall, isHalfDrop, scaleFactor);
        }

    } catch (e) {
        console.error('Error in updatePreview:', e);
    }
};
