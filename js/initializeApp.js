// initializeApp.js
import { appState } from './state.js';
import { loadColors } from './loadColors.js';
import { loadPatternData } from './patternController.js';
import { dom } from './ui.js';
import { toInitialCaps } from './utils.js';
import { populateCuratedColors } from './colorInputPanel.js';
import { populatePatternThumbnails } from './patternThumbnails.js';
import { setupPrintListener } from './events.js';
import { setupScaleControls } from './scaleControls.js';
import { setupTicketFeature } from './ticketFeature.js';


export async function initializeApp() {
  console.log("🚀 Starting app...");

  // Step 1: Load Sherwin-Williams Colors
  await loadColors();
  console.log("🎨 Colors loaded:", appState.colorsData.length);

  try {
    // Step 2: Load Collections
    const response = await fetch("./data/local-collections.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to fetch collections: ${response.status}`);
    const data = await response.json();

    if (!data.collections?.length) {
      console.error("❌ No collections found in local-collections.json");
      dom.collectionHeader.textContent = "No Collections Available";
      dom.preview.innerHTML = "<p>No collections available. Please run the data import script.</p>";
      return;
    }

    // Step 3: Save collections once
    if (!appState.collections.length) {
      appState.collections = data.collections;
      console.log("📦 Collections loaded:", appState.collections.length);
    }

    // Step 4: Select collection via URL param or fallback
    const urlParams = new URLSearchParams(window.location.search);
    const collectionName = urlParams.get("collection")?.trim();
    let selectedCollection = appState.collections.find(
      c => c.name.trim().toLowerCase() === collectionName?.toLowerCase()
    ) || appState.collections[0];

    if (!selectedCollection) {
      console.error("❌ No valid collection found.");
      return;
    }

    // Step 5: Set collection in appState
    appState.selectedCollection = selectedCollection;
    appState.lockedCollection = true;
    appState.curatedColors = selectedCollection.curatedColors || [];
    console.log("📦 Selected Collection:", selectedCollection.name);
    console.log("🎨 Curated colors:", appState.curatedColors.length);

    // Step 6: Update UI header
    if (dom.collectionHeader) {
      dom.collectionHeader.textContent = toInitialCaps(selectedCollection.name);
    }


    // Step 7.5 Setup ticket feature
    setupTicketFeature("curatedColorsContainer");


    // Step 8: Load first pattern
    const initialPatternId = selectedCollection.patterns[0]?.id;
    if (initialPatternId) {
      await loadPatternData(selectedCollection, initialPatternId); // Ensure this is awaited

      // ✅ Only call this after pattern is fully loaded
      setupScaleControls();

      // Step 9: Curated colors
      populateCuratedColors(appState.curatedColors);
    }


    // Step 9: Load thumbnails + setup print
    populatePatternThumbnails(selectedCollection.patterns);
    setupPrintListener();

  } catch (error) {
    console.error("❌ Error loading collections:", error);
    dom.collectionHeader.textContent = "Error Loading Collection";
    dom.preview.innerHTML = "<p>Error loading data. Please try refreshing.</p>";
  }
}
