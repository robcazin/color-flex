// printPreview.js

import { appState } from './state.js';
import { toInitialCaps } from './utils.js';
import { lookupColor } from './color-functions.js';
import { processImage } from './processImage.js';

export const generatePrintPreview = () => {
    if (!appState.currentPattern) {
        console.error("No current pattern selected for print preview");
        return null;
    }

    const isWall = appState.currentPattern?.isWall || appState.selectedCollection?.name === "wall-panels";
    const backgroundIndex = isWall ? 1 : 0;
    const backgroundInput = appState.layerInputs[backgroundIndex]?.input;
    if (!backgroundInput) {
        console.error(`Background input not found at index ${backgroundIndex}`, appState.layerInputs);
        return null;
    }

    const backgroundColor = lookupColor(backgroundInput.value);
    const dpi = 100;
    const patternWidthInches = appState.currentPattern?.size?.[0] || 24;
    const patternHeightInches = appState.currentPattern?.size?.[1] || 24;
    const printWidth = Math.round(patternWidthInches * dpi);
    const printHeight = Math.round(patternHeightInches * dpi);
    const aspectRatio = patternHeightInches / patternWidthInches;

    const printCanvas = document.createElement("canvas");
    const printCtx = printCanvas.getContext("2d", { willReadFrequently: true });
    printCanvas.width = printWidth;
    printCanvas.height = printHeight;

    const collectionName = toInitialCaps(appState.selectedCollection?.name || "Unknown");
    const patternName = toInitialCaps(appState.currentPattern.name || "Pattern");
    let layerLabels = [];

    const processPrintPreview = async () => {
        printCtx.fillStyle = backgroundColor;
        printCtx.fillRect(0, 0, printWidth, printHeight);

        const isTintWhite = appState.currentPattern?.tintWhite || false;

        if (isTintWhite && appState.currentPattern?.baseComposite) {
            const baseImage = new Image();
            baseImage.src = appState.currentPattern.baseComposite.replace('./', './');
            await new Promise((resolve) => {
                baseImage.onload = () => {
                    printCtx.drawImage(baseImage, 0, 0, printWidth, printHeight);
                    const imageData = printCtx.getImageData(0, 0, printWidth, printHeight);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        if (data[i] > 220 && data[i + 1] > 220 && data[i + 2] > 220) {
                            const hex = backgroundColor.replace("#", "");
                            data[i] = parseInt(hex.substring(0, 2), 16);
                            data[i + 1] = parseInt(hex.substring(2, 4), 16);
                            data[i + 2] = parseInt(hex.substring(4, 6), 16);
                        }
                    }
                    printCtx.putImageData(imageData, 0, 0);
                    layerLabels = [{ label: "Tinted Base", color: backgroundInput.value }];
                    resolve();
                };
                baseImage.onerror = () => resolve();
            });
        } else if (appState.currentPattern?.layers?.length) {
            layerLabels = appState.currentPattern.layers.map((l, i) => ({
                label: appState.currentPattern.layerLabels?.[i] || `Layer ${i + 1}`,
                color: appState.layerInputs[i + (isWall ? 2 : 1)]?.input?.value || "Snowbound"
            }));

            const shadowLayers = [];
            const nonShadowLayers = [];
            appState.currentPattern.layers.forEach((layer, index) => {
                const label = layerLabels[index].label;
                const isShadow = label.toUpperCase().includes("SHADOW") || layer.path.toUpperCase().includes("SHADOW");
                (isShadow ? shadowLayers : nonShadowLayers).push({ layer, index, label });
            });

            let nonShadowInputIndex = isWall ? 2 : 1;

            for (const { layer, index, label } of shadowLayers) {
                const layerPath = layer.path || "";
                await new Promise((resolve) => {
                    processImage(layerPath, (processedUrl) => {
                        const img = new Image();
                        img.src = processedUrl;
                        img.onload = () => {
                            printCtx.globalCompositeOperation = "multiply";
                            printCtx.globalAlpha = 0.3;
                            printCtx.drawImage(img, 0, 0, printWidth, printHeight);
                            resolve();
                        };
                        img.onerror = () => resolve();
                    }, null, 2.2, true, isWall);
                });
            }

            for (const { layer, index, label } of nonShadowLayers) {
                const layerPath = layer.path || "";
                const layerInput = appState.layerInputs[nonShadowInputIndex];
                const layerColor = lookupColor(layerInput?.input?.value || "Snowbound");
                await new Promise((resolve) => {
                    processImage(layerPath, (processedUrl) => {
                        const img = new Image();
                        img.src = processedUrl;
                        img.onload = () => {
                            printCtx.globalCompositeOperation = "source-over";
                            printCtx.globalAlpha = 1.0;
                            printCtx.drawImage(img, 0, 0, printWidth, printHeight);
                            nonShadowInputIndex++;
                            resolve();
                        };
                        img.onerror = () => resolve();
                    }, layerColor, 2.2, false, isWall);
                });
            }
        }

        const dataUrl = printCanvas.toDataURL("image/png");

        let textContent = `
            <img src="./img/SC-header-mage.jpg" alt="SC Logo" class="sc-logo">
            <h2>${collectionName}</h2>
            <h3>${patternName}</h3>
            <ul style="list-style: none; padding: 0;">
        `;
        layerLabels.forEach(({ label, color }, index) => {
            const swNumber = appState.selectedCollection?.curatedColors?.[index] || color || "N/A";
            textContent += `<li>${toInitialCaps(label)} | ${swNumber}</li>`;
        });
        textContent += "</ul>";

        const previewWindow = window.open('', '_blank', 'width=800,height=1200');
        if (!previewWindow) return { canvas: printCanvas, dataUrl };

        previewWindow.document.write(`
            <html>
            <head>
                <title>Print Preview</title>
                <link href="https://fonts.googleapis.com/css2?family=Special+Elite&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Special Elite', serif; padding: 20px; background: #111827; color: #f0e6d2; }
                    .print-container { background: #434341; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; text-align: center; }
                    .sc-logo { width: 300px; }
                    button { margin: 10px; padding: 10px 20px; font-size: 16px; background: #f0e6d2; color: #111827; border: none; border-radius: 4px; cursor: pointer; }
                    button:hover { background: #e0d6c2; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    ${textContent}
                    <img src="${dataUrl}" alt="Pattern Preview">
                    <div class="button-container">
                        <button onclick="window.print();">Print</button>
                        <button onclick="download()">Download</button>
                        <button onclick="window.close();">Close</button>
                    </div>
                </div>
                <script>
                    function download() {
                        const link = document.createElement('a');
                        link.href = "${dataUrl}";
                        link.download = "${patternName}-print.png";
                        link.click();
                    }
                </script>
            </body>
            </html>
        `);
        previewWindow.document.close();

        return { canvas: printCanvas, dataUrl, layerLabels, collectionName, patternName };
    };

    return processPrintPreview().catch(error => {
        console.error("Print preview error:", error);
        return null;
    });
};
