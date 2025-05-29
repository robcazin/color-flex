// renderStandardPattern.js

import { processImage } from './processImage.js';
import { lookupColor } from './color-functions.js';
import { appState } from './state.js';

export async function renderStandardPattern(canvas, backgroundColor, isWall, isHalfDrop, scale = 1) {
    const ctx = canvas.getContext("2d");
    const gridSize = appState.scaleMultiplier === 0.5 ? 2 : appState.scaleMultiplier === 0.25 ? 3 : appState.scaleMultiplier === 0.125 ? 4 : 1;
    const pattern = appState.currentPattern;
    const aspectRatio = pattern?.size?.[1] / pattern?.size?.[0] || 1;

    const shadowLayers = [];
    const nonShadowLayers = [];

    (pattern?.layers || []).forEach((layer, index) => {
        const label = pattern.layerLabels?.[index] || `Layer ${index + 1}`;
        const isShadow = label.toUpperCase().includes("SHADOW") ||
                         (layer.path && layer.path.toUpperCase().includes("ISSHADOW") && !layer.path.toUpperCase().includes("FLOWER"));
        (isShadow ? shadowLayers : nonShadowLayers).push({ layer, index, label });
    });

    let tileWidth = 0;
    let tileHeight = 0;

    const renderLayer = async ({ layer, index, label }, color, compositeMode = "source-over", alpha = 1.0) => {
        return new Promise(resolve => {
            processImage(layer.path, (processedUrl) => {
                const img = new Image();
                img.src = processedUrl;
                img.onload = () => {
                    if (!tileWidth || !tileHeight) {
                        const patternWidthInches = pattern?.size?.[0] || 24;
                        const patternHeightInches = pattern?.size?.[1] || 24;
                        const dpi = img.width / patternWidthInches; // assume image width = patternWidthInches inches at natural scale
                        const drawWidth = patternWidthInches * dpi * scale;
                        const drawHeight = patternHeightInches * dpi * scale;

                        tileWidth = img.width * scale;
                        tileHeight = img.height * scale;
                    }

                    const patternCanvas = document.createElement("canvas");
                    patternCanvas.width = tileWidth;
                    patternCanvas.height = tileHeight;
                    const patternCtx = patternCanvas.getContext("2d");

                    patternCtx.globalCompositeOperation = compositeMode;
                    patternCtx.globalAlpha = alpha;
                    patternCtx.drawImage(img, 0, 0, tileWidth, tileHeight);

                    const padding = isWall ? 20 : 0;
                    const startX = Math.round((canvas.width - (gridSize * tileWidth + (gridSize - 1) * padding)) / 2);
                    const startY = Math.round((canvas.height - (gridSize * tileHeight + (gridSize - 1) * padding)) / 2) - (isHalfDrop ? tileHeight / 2 : 0);

                    const rows = Math.ceil((canvas.height + (isHalfDrop ? tileHeight / 2 : 0)) / (tileHeight + padding));

                    for (let x = 0; x < gridSize; x++) {
                        const isOddCol = x % 2 !== 0;
                        const yOffset = isHalfDrop && isOddCol ? tileHeight / 2 : 0;
                        for (let y = 0; y < rows; y++) {
                            const px = startX + x * (tileWidth + padding);
                            const py = startY + y * (tileHeight + padding) + yOffset;
                            if (py + tileHeight < 0 || py > canvas.height) continue;
                            ctx.globalCompositeOperation = compositeMode;
                            ctx.globalAlpha = alpha;
                            ctx.drawImage(patternCanvas, px, py);
                        }
                    }
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load standard pattern layer: ${layer.path}`);
                    resolve();
                };
            }, color, 2.2, compositeMode === "multiply", isWall);
        });
    };

    for (const shadow of shadowLayers) {
        await renderLayer(shadow, null, "multiply", 0.3);
    }

    let nonShadowLayerIndex = isWall ? 2 : 1;
    const colorCount = appState.currentLayers.length;

    for (const layer of nonShadowLayers) {
        const colorIndex = nonShadowLayerIndex < colorCount ? nonShadowLayerIndex : (nonShadowLayerIndex - 1) % (colorCount - 1) + 1;
        const color = lookupColor(appState.currentLayers[colorIndex]?.color || "Snowbound");
        await renderLayer(layer, color);
        nonShadowLayerIndex++;
    }
}
