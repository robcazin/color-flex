// renderWallPanelLayout.js

import { processImage } from './processImage.js';
import { lookupColor } from './utils.js';
import { appState } from './state.js';

export const renderWallPanelLayout = async (canvas, ctx, backgroundColor) => {
    const pattern = appState.currentPattern;
    const panelLayers = pattern.layers || [];
    const labels = pattern.layerLabels || [];
    const panelSize = pattern.size || [24, 36];
    const layout = pattern.layout || "3,20";
    const scaleMultiplier = appState.scaleMultiplier || 1;

    const [numPanelsStr, spacingStr] = layout.split(',');
    const numPanels = parseInt(numPanelsStr, 10) || 3;
    const spacing = parseInt(spacingStr, 10) || 20;

    const scale = Math.min(canvas.width / 100, canvas.height / 80) * scaleMultiplier;
    const panelWidth = panelSize[0] * scale;
    const panelHeight = panelSize[1] * scale;

    const totalWidth = (numPanels * panelWidth) + ((numPanels - 1) * spacing);
    const startX = (canvas.width - totalWidth) / 2;
    const startY = (canvas.height - panelHeight) / 2 - (pattern.verticalOffset || 50);

    const panelCanvas = document.createElement('canvas');
    panelCanvas.width = panelWidth;
    panelCanvas.height = panelHeight;
    const panelCtx = panelCanvas.getContext('2d');

    let nonShadowLayerIndex = 1;

    for (let i = 0; i < panelLayers.length; i++) {
        const layer = panelLayers[i];
        const path = layer.path || "";
        const label = labels[i] || `Layer ${i + 1}`;
        const isShadow = label.toUpperCase().includes("SHADOW") || path.toUpperCase().includes("ISSHADOW");

        const colorIndex = isShadow ? null : nonShadowLayerIndex;
        const color = isShadow ? null : lookupColor(
            appState.currentLayers[colorIndex]?.color ||
            appState.layerInputs[colorIndex]?.input?.value ||
            "Snowbound"
        );

        await new Promise(resolve => {
            processImage(path, processedUrl => {
                const img = new Image();
                img.src = processedUrl;
                img.onload = () => {
                    panelCtx.globalCompositeOperation = isShadow ? 'multiply' : 'source-over';
                    panelCtx.globalAlpha = isShadow ? 0.3 : 1.0;
                    panelCtx.drawImage(img, 0, 0, panelWidth, panelHeight);
                    if (!isShadow) nonShadowLayerIndex++;
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load wall panel layer: ${processedUrl}`);
                    resolve();
                };
            }, color, 2.2, isShadow);
        });
    }

    for (let i = 0; i < numPanels; i++) {
        const x = startX + i * (panelWidth + spacing);
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x, startY, panelWidth, panelHeight);
        ctx.drawImage(panelCanvas, x, startY, panelWidth, panelHeight);
    }
};
