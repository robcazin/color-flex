// Populate coordinates thumbnails in #coordinatesContainer
// populateCoordinates.js
import { appState } from './state.js';
import { dom } from './ui.js';
import { setupCoordinateImageHandlers } from './coordinatePatternManager.js';

export function populateCoordinates() {
    if (!dom.coordinatesContainer) {
        console.error("coordinatesContainer not found in DOM");
        return;
    }
    dom.coordinatesContainer.innerHTML = "";
    dom.coordinatesContainer.style.position = "relative";

    const coordinates = appState.selectedCollection?.coordinates || [];
    console.log("Collection coordinates data:", coordinates);

    if (!coordinates.length) {
        console.log("No matching coordinates available for collection:", appState.selectedCollection?.name);
        return;
    }

    const numCoordinates = coordinates.length;
    const xStep = 80;
    const yStep = 60;
    const totalXSpan = (numCoordinates - 1) * xStep;
    const totalYSpan = numCoordinates > 1 ? yStep : 0;
    const xStart = -(totalXSpan / 2);
    const yStart = -(totalYSpan / 2.5);

    coordinates.forEach((coord, index) => {
        const div = document.createElement("div");
        div.className = "coordinate-item";
        const xOffset = xStart + (index * xStep);
        const yOffset = yStart + 10 + (index % 2 === 0 ? yStep : 0);
        div.style.setProperty("--x-offset", `${xOffset}px`);
        div.style.setProperty("--y-offset", `${yOffset}px`);
        div.style.left = "50%";
        div.style.top = "50%";

        const img = document.createElement("img");
        img.src = coord.path;
        img.alt = coord.pattern || `Coordinate ${index + 1}`;
        img.className = "coordinate-image";
        img.dataset.filename = coord.path;
        img.style.width = "150px";
        img.style.height = "auto";
        img.style.objectFit = "cover";
        img.style.cursor = "pointer";

        img.onerror = () => {
            console.warn(`Failed to load coordinate image: ${img.src}`);
            const placeholder = document.createElement("div");
            placeholder.textContent = coord.pattern || "Coordinate Unavailable";
            placeholder.style.width = "150px";
            placeholder.style.height = "100px";
            placeholder.style.backgroundColor = "#e0e0e0";
            placeholder.style.border = "1px solid #ccc";
            placeholder.style.display = "flex";
            placeholder.style.alignItems = "center";
            placeholder.style.justifyContent = "center";
            placeholder.style.fontSize = "12px";
            placeholder.style.textAlign = "center";
            placeholder.style.padding = "5px";
            div.replaceChild(placeholder, img);
            img.onerror = null;
            console.log(`Replaced failed coordinate image for ${coord.pattern || index + 1} with placeholder`);
        };

        div.appendChild(img);
        dom.coordinatesContainer.appendChild(div);
    });

    console.log("Coordinates populated:", coordinates.length);
    setupCoordinateImageHandlers();
}
