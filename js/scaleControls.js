// scaleControls.js
import { appState } from './state.js';
import { updateRoomMockup } from './updateRoomMockup.js';
import { updatePreview } from './updatePreview.js';

let currentScale = 1;

export function setPatternScale(scale) {
  currentScale = scale;
  console.log("🔍 setPatternScale to:", scale);
  updatePreview(scale); // Pass scale so it can apply it inside rendering logic
  updateScaleButtons(scale);
}

export function setupScaleControls() {
  const scaleButtons = document.querySelectorAll(".scale-btn");
  scaleButtons.forEach(button => {
    const scale = parseFloat(button.getAttribute("data-scale"));
    if (!isNaN(scale)) {
      button.addEventListener("click", () => setPatternScale(scale));
    }
  });
  console.log("✅ Scale controls initialized.");
}

function updateScaleButtons(activeScale) {
  document.querySelectorAll(".scale-btn").forEach(btn => {
    const scale = parseFloat(btn.getAttribute("data-scale"));
    if (scale === activeScale) {
      btn.classList.add("active-scale");
    } else {
      btn.classList.remove("active-scale");
    }
  });
}

export function getCurrentScale() {
  return currentScale;
}
