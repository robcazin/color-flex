// populateThumbnails.js
import { appState } from './state.js';
import { dom } from './ui.js';
import { toInitialCaps } from './utils.js';
import { handleThumbnailClick } from './events.js';

export function populatePatternThumbnails(patterns) {
  console.log("populatePatternThumbnails called with patterns:", patterns);
  if (!dom.collectionThumbnails) {
    console.error("collectionThumbnails not found in DOM");
    return;
  }
  if (!Array.isArray(patterns)) {
    console.error("Patterns is not an array:", patterns);
    return;
  }

  const validPatterns = patterns.filter(p => p && typeof p === 'object' && p.name);
  if (!validPatterns.length) {
    console.warn("No valid patterns to display");
    dom.collectionThumbnails.innerHTML = "<p>No patterns available.</p>";
    return;
  }

  function cleanPatternName(str) {
    return str
      .toLowerCase()
      .replace(/\.\w+$/, '')
      .replace(/-\d+x\d+$|-variant$/i, '')
      .replace(/^\d+[a-z]+-|-.*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  dom.collectionThumbnails.innerHTML = "";
  console.log("Cleared existing thumbnails");

  validPatterns.forEach(pattern => {
    console.log("Processing pattern:", pattern);
    pattern.displayName = cleanPatternName(pattern.name);
    const thumb = document.createElement("div");
    thumb.className = "thumbnail cursor-pointer border-1 border-transparent";
    thumb.dataset.patternId = pattern.id || pattern.name.toLowerCase().replace(/\s+/g, '-');
    thumb.style.width = "120px";
    thumb.style.boxSizing = "border-box";

    const img = document.createElement("img");
    img.src = pattern.thumbnail || "./data/collections/fallback.jpg";
    img.alt = pattern.displayName;
    img.className = "w-full h-auto";
    img.onerror = () => {
      console.warn(`Failed to load thumbnail for ${pattern.displayName}: ${img.src}`);
      if (img.src !== "./data/collections/fallback.jpg") {
        img.src = "./data/collections/fallback.jpg";
        img.onerror = () => replaceWithPlaceholder();
      } else {
        replaceWithPlaceholder();
      }
    };

    function replaceWithPlaceholder() {
      const placeholder = document.createElement("div");
      placeholder.textContent = pattern.displayName || "Thumbnail Unavailable";
      placeholder.style.width = "100%";
      placeholder.style.height = "80px";
      placeholder.style.backgroundColor = "#e0e0e0";
      placeholder.style.border = "1px solid #ccc";
      placeholder.style.display = "flex";
      placeholder.style.alignItems = "center";
      placeholder.style.justifyContent = "center";
      placeholder.style.fontSize = "12px";
      placeholder.style.textAlign = "center";
      placeholder.style.padding = "5px";
      placeholder.style.boxSizing = "border-box";
      thumb.replaceChild(placeholder, img);
      img.onerror = null;
      console.log(`Replaced failed thumbnail for ${pattern.displayName} with placeholder div`);
    }

    thumb.appendChild(img);

    const label = document.createElement("p");
    label.textContent = pattern.displayName;
    label.className = "text-center";
    thumb.appendChild(label);

    if (appState.currentPattern && String(appState.currentPattern.id) === String(pattern.id)) {
      thumb.classList.add("selected");
      console.log(`Applied 'selected' class to ${pattern.displayName}`);
    }

    thumb.addEventListener("click", (e) => {
      console.log(`Thumbnail clicked: ${pattern.displayName}, ID: ${thumb.dataset.patternId}`);
      handleThumbnailClick(thumb.dataset.patternId);
      document.querySelectorAll(".thumbnail").forEach(t => t.classList.remove("selected"));
      thumb.classList.add("selected");
    });

    dom.collectionThumbnails.appendChild(thumb);
  });
  console.log("Pattern thumbnails populated:", validPatterns.length);

  if (dom.collectionHeader) {
    dom.collectionHeader.textContent = toInitialCaps(appState.selectedCollection?.name || "Unknown");
    console.log("Updated collectionHeader:", dom.collectionHeader.textContent);
  }
}
