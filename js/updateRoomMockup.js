// updateRoomMockup.js

import { lookupColor } from './color-functions.js';
import { renderRoomPattern } from './renderRoomPattern.js';
import { isWallPattern } from './patternUtils.js';
import { appState } from './state.js';
import { dom } from './ui.js';

export const updateRoomMockup = async () => {
    try {
        console.log(">>> updateRoomMockup called");

        if (!dom.roomMockup) {
            console.error("roomMockup element not found in DOM");
            return;
        }

        const isWall = isWallPattern(appState.currentPattern, appState.selectedCollection);
        const backgroundIndex = isWall ? 1 : 0;
        const wallColor = lookupColor(appState.currentLayers[0]?.color || "Snowbound", appState.colorsData);
        const backgroundColor = lookupColor(appState.currentLayers[backgroundIndex]?.color || "Snowbound", appState.colorsData);

        const UI_WIDTH_DEFAULT = 600;
        const UI_HEIGHT_DEFAULT = 450;

        const canvas = document.createElement("canvas");
        canvas.width = UI_WIDTH_DEFAULT;
        canvas.height = UI_HEIGHT_DEFAULT;
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = wallColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await renderRoomPattern(canvas, backgroundColor, isWall);

        dom.roomMockup.className = `w-[${UI_WIDTH_DEFAULT}px] max-w-[${UI_WIDTH_DEFAULT}px] h-[${UI_HEIGHT_DEFAULT}px] relative flex-shrink-0 ml-20 grid-update`;
        dom.roomMockup.style.cssText = "width: 600px; height: 450px; position: relative; background: none;";
        dom.roomMockup.innerHTML = "";

        const dataUrl = canvas.toDataURL("image/png");
        const img = document.createElement("img");
        img.src = dataUrl;
        img.style.cssText = "width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; display: block;";
        dom.roomMockup.appendChild(img);

        if (appState.currentPattern?.name) {
            dom.patternName.textContent = appState.currentPattern.name;
        }

    } catch (e) {
        console.error("Error in updateRoomMockup:", e);
    }
};
