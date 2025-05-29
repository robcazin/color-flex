// ticketFeature.js

import { appState } from './state.js';
import { toInitialCaps } from './utils.js';
import { populateCuratedColors } from './colorInputPanel.js';
import { updateDisplays } from './displayController.js';
import { hexToHSL } from './color-functions.js';

export function insertTicketIndicator(ticketNumber) {
    const existing = document.getElementById("ticketIndicator");
    if (existing) {
        existing.innerHTML = `TICKET<br>${ticketNumber}`;
        return;
    }

    const indicator = document.createElement("div");
    indicator.id = "ticketIndicator";
    indicator.className = "w-20 h-20 rounded-full flex items-center justify-center text-center text-xs font-bold text-gray-800";
    indicator.style.backgroundColor = "#e5e7eb"; // Tailwind gray-200
    indicator.style.marginRight = "8px";
    indicator.innerHTML = `TICKET<br>${ticketNumber}`;

    const container = document.getElementById("curatedColorsContainer");
    if (container) container.prepend(indicator);
}

export function promptTicketNumber() {
    const input = prompt("Enter Sherwin-Williams ticket number (e.g., 280):");
    const ticketNum = parseInt(input?.trim());
    if (isNaN(ticketNum)) {
        alert("Please enter a valid numeric ticket number.");
        return;
    }
    runStaticTicket(ticketNum);
}

export function runTheTicket(baseColor) {
    console.log("🎯 Running the Ticket for:", baseColor);

    if (!window.isAppReady) {
        console.warn("🚫 App is not ready yet. Ignoring runTheTicket call.");
        alert("Please wait while the app finishes loading.");
        return;
    }

    if (!baseColor || !baseColor.hex) {
        console.warn("❌ No base color provided to runTheTicket.");
        return;
    }

    if (!Array.isArray(appState.colorsData) || appState.colorsData.length === 0) {
        console.warn("⚠️ Sherwin-Williams colors not loaded yet.");
        alert("Color data is still loading. Please try again shortly.");
        return;
    }

    const baseHSL = hexToHSL(baseColor.hex);
    if (!baseHSL) {
        console.error("❌ Failed to convert base HEX to HSL.");
        return;
    }

    const swColors = appState.colorsData
        .filter(c => c.hex && c.name)
        .map(c => ({
            name: c.name,
            hex: c.hex,
            hsl: hexToHSL(c.hex)
        }));

    const scored = swColors
        .map(c => {
            const hueDiff = Math.abs(baseHSL.h - c.hsl.h);
            const satDiff = Math.abs(baseHSL.s - c.hsl.s);
            const lightDiff = Math.abs(baseHSL.l - c.hsl.l);
            return {
                ...c,
                score: hueDiff + satDiff * 0.5 + lightDiff * 0.8
            };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, appState.currentLayers.length);

    if (!Array.isArray(appState.layerInputs) || appState.layerInputs.length === 0) {
        console.warn("❌ No layer inputs available. Cannot apply ticket.");
        return;
    }

    scored.forEach((ticketColor, idx) => {
        const inputSet = appState.layerInputs[idx];
        if (!inputSet || !inputSet.input || !inputSet.circle) {
            console.warn(`❌ Missing input or circle at index ${idx}`);
            return;
        }

        const formatted = toInitialCaps(ticketColor.name);
        inputSet.input.value = formatted;
        inputSet.circle.style.backgroundColor = ticketColor.hex;
        appState.currentLayers[idx].color = formatted;

        console.log(`🎯 Layer ${idx + 1} set to ${formatted} (${ticketColor.hex})`);
    });

    insertTicketIndicator(baseColor.sw_number || "?");
    updateDisplays();
    console.log("✅ Ticket run complete.");
}

export function runStaticTicket(ticketNumber) {
    console.log(`🎫 Static Ticket Requested: ${ticketNumber}`);

    if (!Array.isArray(appState.colorsData) || appState.colorsData.length === 0) {
        alert("Color data not loaded yet.");
        return;
    }

    const ticketColors = [];
    for (let i = 1; i <= 7; i++) {
        const locatorId = `${ticketNumber}-C${i}`;
        const color = appState.colorsData.find(c => c.locator_id?.toUpperCase() === locatorId.toUpperCase());
        if (color) {
            const displayName = `${color.sw_number?.toUpperCase() || ""} ${toInitialCaps(color.color_name)}`;
            ticketColors.push(displayName.trim());
        }
    }

    if (ticketColors.length === 0) {
        alert(`No colors found for ticket ${ticketNumber}`);
        return;
    }

    appState.curatedColors = ticketColors;
    appState.activeTicketNumber = ticketNumber;
    populateCuratedColors(ticketColors);
    insertTicketIndicator(ticketNumber);

    console.log(`🎯 Loaded ticket ${ticketNumber} with ${ticketColors.length} colors`);
}

export function setupTicketFeature(containerId = "curatedColorsContainer") {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`🎟️ Ticket feature: container #${containerId} not found.`);
        return;
    }

    const ticketButton = document.createElement("button");
    ticketButton.textContent = "🎟️ Get My Color Ticket";
    ticketButton.style.marginTop = "10px";
    ticketButton.style.padding = "8px 12px";
    ticketButton.style.fontSize = "14px";
    ticketButton.style.cursor = "pointer";
    ticketButton.style.backgroundColor = "#2d3748";
    ticketButton.style.color = "#f7fafc";
    ticketButton.style.border = "none";
    ticketButton.style.borderRadius = "4px";

    ticketButton.addEventListener("click", () => {
        const selections = Array.from(
            container.querySelectorAll(".curated-color.selected")
        ).map((el) => el.textContent.trim());

        runStaticTicket(selections);
    });

    container.appendChild(ticketButton);
    console.log("🎟️ Ticket feature initialized.");
}
