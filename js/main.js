// main.js
import { initializeApp } from './initializeApp.js';
import { appState } from './state.js';
import { dom } from './ui.js';
import { patternNameBinding } from './utils.js';
import { setupScaleControls } from './scaleControls.js';
import { setupPrintListener } from './events.js';
import { generatePrintPreview } from './printPreview.js'; // Assuming you’ve exported this from its module

console.log("🌱 App bootstrap starting");

// Bind dynamic DOM logic
const patternNameElement = document.getElementById("patternName");
patternNameBinding(patternNameElement, dom);

// Ensure appState is clean before initializing
appState.selectedCollection = null;

// Run initialization on page load and browser nav
window.addEventListener('load', () => {
  initializeApp().catch(error => console.error("Initialization failed:", error));
});

window.addEventListener('popstate', () => {
  initializeApp().catch(error => console.error("Refresh initialization failed:", error));
});

// Set up pattern scale controls
// document.addEventListener('DOMContentLoaded', () => {
//   setupScaleControls();
// });

// Attach print preview
setupPrintListener(generatePrintPreview);
