// utils.js

export const toInitialCaps = (str) =>
    str
        .toLowerCase()
        .replace(/\.\w+$/, '')
        .replace(/-\d+x\d+$|-variant$/i, '')
        .replace(/_/g, ' ')
        .split(/[\s-]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

export const stripSWNumber = (colorName) => {
    return colorName.replace(/(SW|SC)\d+\s*/, '').trim();
};

export const getContrastClass = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "text-black" : "text-white";
};

export const patternNameBinding = (patternNameElement, dom) => {
    Object.defineProperty(dom, 'patternName', {
        get() {
            return patternNameElement;
        },
        set(value) {
            console.log("Setting #patternName to:", value, "Caller:", new Error().stack.split('\n')[2].trim());
            patternNameElement.textContent = value;
        },
        configurable: true
    });
    dom._patternName = patternNameElement;
};

// loadColors.js
import { appState } from './state.js';

export async function loadColors() {
    try {
        const response = await fetch("./data/colors.json");
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Colors data is empty or invalid");
        }

        appState.colorsData = data;
        console.log("🎨 Colors loaded:", appState.colorsData.length);
    } catch (err) {
        console.error("❌ Error loading colors:", err);
        alert("Failed to load Sherwin-Williams colors.");
    }
}

// imageLoader.js
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(`❌ Failed to load image: ${src}`);
        img.src = src;
    });
}

// events.js
export function setupPrintListener(generatePrintPreview) {
    const tryAttachListener = (attempt = 1, maxAttempts = 10) => {
        const printButton = document.getElementById("printButton");
        console.log(`Print listener - Attempt ${attempt} - Looking for printButton: ${printButton ? "Found" : "Not found"}`);

        if (printButton) {
            const newButton = printButton.cloneNode(true);
            printButton.parentNode.replaceChild(newButton, printButton);

            newButton.addEventListener("click", async () => {
                console.log("Print preview triggered");
                const result = await generatePrintPreview();
                if (!result) {
                    console.error("Print preview - Failed to generate output");
                }
            });
            console.log("Print listener attached");
        } else if (attempt < maxAttempts) {
            console.warn(`Print button not found, retrying (${attempt}/${maxAttempts})`);
            setTimeout(() => tryAttachListener(attempt + 1, maxAttempts), 500);
        } else {
            console.error("Print button not found after max attempts");
        }
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
        tryAttachListener();
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            console.log("Print listener - DOMContentLoaded fired");
            tryAttachListener();
        });
    }
}

