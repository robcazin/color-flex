// renderTintWhitePattern.js

import { processImage } from './processImage.js';
import { appState } from './state.js';

export async function renderTintWhitePattern(canvas, backgroundColor, isWall, isHalfDrop, scale = 1) {
    const ctx = canvas.getContext("2d");
    const gridSize = getGridSize(appState.scaleMultiplier);
    const pattern = appState.currentPattern;
    const baseImageSrc = pattern?.baseComposite || pattern?.layers?.[0]?.path;

    if (!baseImageSrc) {
        console.error("No valid tintWhite image source found");
        return;
    }

    const baseImage = new Image();
    baseImage.src = baseImageSrc.replace('./', './');

    await new Promise((resolve) => {
        baseImage.onload = () => {
            const patternWidthInches = pattern?.size?.[0] || 24;
            const patternHeightInches = pattern?.size?.[1] || 24;
            const dpi = baseImage.width / patternWidthInches;
            const drawWidth = patternWidthInches * dpi * scale;
            const drawHeight = patternHeightInches * dpi * scale;


            const patternCanvas = document.createElement("canvas");
            const patternCtx = patternCanvas.getContext("2d");
            patternCanvas.width = drawWidth;
            patternCanvas.height = drawHeight;
            patternCtx.drawImage(baseImage, 0, 0, drawWidth, drawHeight);

            const imageData = patternCtx.getImageData(0, 0, drawWidth, drawHeight);
            const data = imageData.data;

            const r = parseInt(backgroundColor.substring(1, 3), 16);
            const g = parseInt(backgroundColor.substring(3, 5), 16);
            const b = parseInt(backgroundColor.substring(5, 7), 16);

            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 220 && data[i + 1] > 220 && data[i + 2] > 220) {
                    data[i] = r;
                    data[i + 1] = g;
                    data[i + 2] = b;
                }
            }

            patternCtx.putImageData(imageData, 0, 0);

            const padding = isWall ? 20 : 0;
            const tileWidth = drawWidth;
            const tileHeight = drawHeight;
            const totalWidth = gridSize * tileWidth + (gridSize - 1) * padding;
            const totalHeight = gridSize * tileHeight + (gridSize - 1) * padding;
            const startX = Math.round((canvas.width - totalWidth) / 2);
            const startY = Math.round((canvas.height - totalHeight) / 2) - (isHalfDrop ? tileHeight / 2 : 0);

            for (let x = 0; x < gridSize; x++) {
                const isOddCol = x % 2 !== 0;
                const yOffset = isHalfDrop && isOddCol ? tileHeight / 2 : 0;

                for (let y = 0; y < gridSize; y++) {
                    const px = startX + x * (tileWidth + padding);
                    const py = startY + y * (tileHeight + padding) + yOffset;
                    if (py + tileHeight < 0 || py > canvas.height) continue;
                    ctx.drawImage(patternCanvas, px, py);
                }
            }

            resolve();
        };
        baseImage.onerror = () => {
            console.error("Failed to load base image:", baseImageSrc);
            resolve();
        };
    });
}

function getGridSize(scaleMultiplier) {
    switch (scaleMultiplier) {
        case 1: return 1;
        case 0.5: return 2;
        case 0.25: return 3;
        case 0.125: return 4;
        default: return 1;
    }
}
