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