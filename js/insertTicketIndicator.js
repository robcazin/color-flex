function insertTicketIndicator(ticketNumber) {
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

    dom.curatedColorsContainer.prepend(indicator);
}


function promptTicketNumber() {
    const input = prompt("Enter Sherwin-Williams ticket number (e.g., 280):");
    const ticketNum = parseInt(input?.trim());
    if (isNaN(ticketNum)) {
        alert("Please enter a valid numeric ticket number.");
        return;
    }
    runStaticTicket(ticketNum);
}

function runTheTicket(baseColor) {
    console.log("ðŸŽŸï¸ Running the Ticket for:", baseColor);

    if (!isAppReady) {
        console.warn("ðŸš§ App is not ready yet. Ignoring runTheTicket call.");
        alert("Please wait while the app finishes loading.");
        return;
    }

    if (!baseColor || !baseColor.hex) {
        console.warn("âŒ No base color provided to runTheTicket.");
        return;
    }

    if (!Array.isArray(appState.colorsData) || appState.colorsData.length === 0) {
        console.warn("âš ï¸ Sherwin-Williams colors not loaded yet.");
        alert("Color data is still loading. Please try again shortly.");
        return;
    }

    const baseHSL = hexToHSL(baseColor.hex);
    if (!baseHSL) {
        console.error("âŒ Failed to convert base HEX to HSL.");
        return;
    }

    console.log("ðŸŽ¯ Base color HSL:", baseHSL);

    const swColors = appState.colorsData
        .filter(c => c.hex && c.name)
        .map(c => ({
            name: c.name,
            hex: c.hex,
            hsl: hexToHSL(c.hex)
        }));

    console.log("ðŸ“Š Total SW Colors to search:", swColors.length);

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

    console.log("ðŸŽ¯ Top Ticket matches:", scored);

    if (!Array.isArray(appState.layerInputs) || appState.layerInputs.length === 0) {
        console.warn("âŒ No layer inputs available. Cannot apply ticket.");
        return;
    }

    scored.forEach((ticketColor, idx) => {
        const inputSet = appState.layerInputs[idx];
        if (!inputSet || !inputSet.input || !inputSet.circle) {
            console.warn(`âŒ Missing input or circle at index ${idx}`);
            return;
        }

        const formatted = toInitialCaps(ticketColor.name);
        inputSet.input.value = formatted;
        inputSet.circle.style.backgroundColor = ticketColor.hex;
        appState.currentLayers[idx].color = formatted;

        console.log(`ðŸŽ¯ Layer ${idx + 1} set to ${formatted} (${ticketColor.hex})`);
    });

    insertTicketIndicator(ticketNumber);

    updateDisplays();
    console.log("âœ… Ticket run complete.");
}

function runStaticTicket(ticketNumber) {
    console.log(`ðŸŽ« Static Ticket Requested: ${ticketNumber}`);

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
    appState.activeTicketNumber = ticketNumber; // ðŸ†• Track it for label update
    populateCuratedColors(ticketColors);

    console.log(`ðŸŽ¯ Loaded ticket ${ticketNumber} with ${ticketColors.length} colors`);
}

