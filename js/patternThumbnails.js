// patternThumbnails.js
import { dom } from './ui.js';
import { appState } from './state.js';
import { loadPatternData } from './patternController.js';


export function populatePatternThumbnails(patterns) {
  if (!Array.isArray(patterns)) {
    console.error("❌ populatePatternThumbnails: Invalid patterns array");
    return;
  }


  dom.collectionThumbnails.innerHTML = "";

  patterns.forEach((pattern) => {
    const thumb = document.createElement("img");
    thumb.className = "thumbnail";
    thumb.src = pattern.thumbnail || "./img/placeholder.png";
    thumb.alt = pattern.name;
    thumb.title = pattern.name;
    thumb.dataset.patternId = pattern.id;

    thumb.addEventListener("click", () => {
      handleThumbnailClick(pattern.id);
    });

    dom.collectionThumbnails.appendChild(thumb);
  });

  console.log("🖼️ Pattern thumbnails populated:", patterns.length);
}

export function handleThumbnailClick(patternId) {
    console.log(`handleThumbnailClick: patternId=${patternId}`);
    if (!patternId) {
        console.error("Invalid pattern ID:", patternId);
        return;
    }
    try {
        // Preserve current mockup
        const originalMockup = appState.selectedCollection?.mockup || "";
        console.log("Preserving mockup for thumbnail click:", originalMockup);

        loadPatternData(appState.selectedCollection, patternId);

        // Update thumbnails
        document.querySelectorAll(".thumbnail").forEach(t => t.classList.remove("selected"));
        const selectedThumb = document.querySelector(`.thumbnail[data-pattern-id="${patternId}"]`);
        if (selectedThumb) {
            selectedThumb.classList.add("selected");
            console.log(`Selected thumbnail: ${patternId}`);
        } else {
            console.warn(`Thumbnail not found for ID: ${patternId}`);
        }
    } catch (error) {
        console.error("Error handling thumbnail click:", error);
    }
}
