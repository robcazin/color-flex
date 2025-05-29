// renderRoomPattern.js

import { processImage } from './processImage.js';
import { lookupColor } from './color-functions.js';
import { appState } from './state.js';

export const renderRoomPattern = async (canvas, backgroundColor, isWall) => {
    const ctx = canvas.getContext("2d");
    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = canvas.width;
    patternCanvas.height = canvas.height;
    const patternCtx = patternCanvas.getContext("2d");

    const tilingType = appState.currentPattern?.tilingType || "straight";
    const isHalfDrop = tilingType === "half-drop";
    const scale = (appState.currentScale / 100 || 1) * (appState.scaleMultiplier || 1);

    const isTintWhite = appState.currentPattern?.tintWhite;
    if (isTintWhite && (appState.currentPattern?.baseComposite || appState.currentPattern?.layers?.length)) {
        const imageSrc = appState.currentPattern?.baseComposite || appState.currentPattern?.layers[0]?.path;
        if (!imageSrc) return;

        const baseImage = new Image();
        baseImage.src = imageSrc;
        await new Promise((resolve) => {
            baseImage.onload = () => {
                const tileWidth = baseImage.width * scale;
                const tileHeight = baseImage.height * scale;
                const offsetY = isHalfDrop ? tileHeight / 2 : 0;

                for (let x = -tileWidth; x < canvas.width + tileWidth; x += tileWidth) {
                    const isOddCol = Math.floor(x / tileWidth) % 2 !== 0;
                    const yOffset = isOddCol && isHalfDrop ? offsetY : 0;
                    for (let y = -tileHeight + yOffset; y < canvas.height + tileHeight; y += tileHeight) {
                        patternCtx.drawImage(baseImage, x, y, tileWidth, tileHeight);
                    }
                }

                const imageData = patternCtx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
                    if (r > 240 && g > 240 && b > 240 && a > 0) {
                        const hex = backgroundColor.replace("#", "");
                        data[i] = parseInt(hex.substring(0, 2), 16);
                        data[i + 1] = parseInt(hex.substring(2, 4), 16);
                        data[i + 2] = parseInt(hex.substring(4, 6), 16);
                    }
                }
                patternCtx.putImageData(imageData, 0, 0);
                ctx.drawImage(patternCanvas, 0, 0);
                resolve();
            };
            baseImage.onerror = resolve;
        });
    } else if (appState.currentPattern?.layers?.length) {
        let nonShadowLayerIndex = isWall ? 2 : 1;
        const colorCount = appState.currentLayers.length;

        for (let i = 0; i < appState.currentPattern.layers.length; i++) {
            const layer = appState.currentPattern.layers[i];
            const path = layer.path;
            const label = appState.currentPattern.layerLabels?.[i] || `Layer ${i + 1}`;
            const isShadow = label.toUpperCase().includes("SHADOW") || path.toUpperCase().includes("ISSHADOW");

            const colorIndex = isShadow ? null : (nonShadowLayerIndex < colorCount ? nonShadowLayerIndex : (nonShadowLayerIndex - 1) % (colorCount - 1) + 1);
            const layerColor = isShadow ? null : lookupColor(
                appState.currentLayers[colorIndex]?.color ||
                appState.layerInputs[colorIndex]?.input?.value ||
                "Snowbound"
            );

            await new Promise((resolve) => {
                processImage(path, (processedUrl) => {
                    const img = new Image();
                    img.src = processedUrl;
                    img.onload = () => {
                        const tileWidth = img.width * scale;
                        const tileHeight = img.height * scale;
                        const offsetY = isHalfDrop ? tileHeight / 2 : 0;

                        patternCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
                        patternCtx.globalAlpha = isShadow ? 0.3 : 1.0;

                        for (let x = -tileWidth; x < canvas.width + tileWidth; x += tileWidth) {
                            const isOddCol = Math.floor(x / tileWidth) % 2 !== 0;
                            const yOffset = isOddCol && isHalfDrop ? offsetY : 0;
                            for (let y = -tileHeight + yOffset; y < canvas.height + tileHeight; y += tileHeight) {
                                patternCtx.drawImage(img, x, y, tileWidth, tileHeight);
                            }
                        }

                        if (!isShadow) nonShadowLayerIndex++;
                        resolve();
                    };
                    img.onerror = resolve;
                }, layerColor, 2.2, isShadow);
            });
        }

        ctx.drawImage(patternCanvas, 0, 0);
    }
};
