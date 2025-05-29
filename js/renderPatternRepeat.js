// renderPatternRepeat.js

import { processImage } from './processImage.js';
import { lookupColor } from './utils.js';
import { appState } from './state.js';

export const renderPatternRepeat = async (canvas, backgroundColor, options = {}) => {
    const {
        isWall = false,
        isHalfDrop = false,
        tintWhite = false,
        baseImageSrc = null,
        widthInches = 24,
        heightInches = 24,
        gridSize = 1,
        scaleMultiplier = 1
    } = options;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const patternCanvas = document.createElement("canvas");
    const patternCtx = patternCanvas.getContext("2d");

    const layers = appState.currentPattern?.layers || [];
    const layerLabels = appState.currentPattern?.layerLabels || [];

    let nonShadowLayerIndex = isWall ? 2 : 1;
    let layerTileWidth, layerTileHeight;

    const drawLayer = async ({ layerPath, isShadow, layerColor }) => {
        await new Promise((resolve) => {
            processImage(
                layerPath,
                (processedUrl) => {
                    const img = new Image();
                    img.src = processedUrl;
                    img.onload = () => {
                        if (!layerTileWidth) {
                            const scale = Math.min(
                                canvas.width / (img.width * gridSize),
                                canvas.height / (img.height * gridSize)
                            );
                            layerTileWidth = img.width * scale * scaleMultiplier;
                            layerTileHeight = img.height * scale * scaleMultiplier;
                            patternCanvas.width = layerTileWidth;
                            patternCanvas.height = layerTileHeight;
                        }

                        patternCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
                        patternCtx.globalAlpha = isShadow ? 0.3 : 1.0;
                        patternCtx.drawImage(img, 0, 0, layerTileWidth, layerTileHeight);
                        resolve();
                    };
                    img.onerror = () => resolve();
                },
                layerColor,
                2.2,
                isShadow,
                isWall
            );
        });
    };

    // Process tintWhite base image if applicable
    if (tintWhite && baseImageSrc) {
        const img = new Image();
        img.src = baseImageSrc;
        await new Promise((resolve) => {
            img.onload = () => {
                const scale = Math.min(
                    canvas.width / (img.width * gridSize),
                    canvas.height / (img.height * gridSize)
                );
                layerTileWidth = img.width * scale * scaleMultiplier;
                layerTileHeight = img.height * scale * scaleMultiplier;
                patternCanvas.width = layerTileWidth;
                patternCanvas.height = layerTileHeight;
                patternCtx.drawImage(img, 0, 0, layerTileWidth, layerTileHeight);
                resolve();
            };
            img.onerror = () => resolve();
        });
    } else {
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            const layerPath = layer.path;
            const label = layerLabels[i] || `Layer ${i + 1}`;
            const isShadow = label.toUpperCase().includes("SHADOW") ||
                             (layerPath && layerPath.toUpperCase().includes("ISSHADOW"));
            const colorIndex = isShadow ? null : nonShadowLayerIndex;
            const layerColor = isShadow ? null : lookupColor(
                appState.currentLayers[colorIndex]?.color ||
                appState.layerInputs[colorIndex]?.input?.value ||
                "Snowbound"
            );

            await drawLayer({ layerPath, isShadow, layerColor });

            if (!isShadow) nonShadowLayerIndex++;
        }
    }

    // Tile the pattern canvas
    const padding = isWall ? 20 : 0;
    const rows = Math.ceil(canvas.height / (layerTileHeight + padding));
    const offsetY = isHalfDrop ? layerTileHeight / 2 : 0;
    const totalWidth = gridSize * layerTileWidth + (gridSize - 1) * padding;
    const startX = Math.round((canvas.width - totalWidth) / 2);
    const startY = Math.round((canvas.height - gridSize * layerTileHeight) / 2) - offsetY;

    for (let x = 0; x < gridSize; x++) {
        const isOddCol = x % 2 !== 0;
        const yOffset = isHalfDrop && isOddCol ? offsetY : 0;

        for (let y = 0; y < rows; y++) {
            const px = startX + x * (layerTileWidth + padding);
            const py = startY + y * (layerTileHeight + padding) + yOffset;
            if (py + layerTileHeight < 0 || py > canvas.height) continue;
            ctx.drawImage(patternCanvas, px, py);
        }
    }
};
