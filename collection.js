// Use utility functions from utils.js directly via window (traditional script)
const toInitialCaps = window.toInitialCaps;
const getContrastClass = window.getContrastClass;
const populateCuratedColorsNonInteractive = window.populateCuratedColorsNonInteractive || function (colors, colorsData) {
  const curatedColorsPreview = document.getElementById("curatedColorsPreview");
  curatedColorsPreview.innerHTML = ""; // Clear existing content
  if (!colors.length) {
    console.warn("No colors provided for curated section.");
    curatedColorsPreview.textContent = "No curated colors available.";
    return;
  }
  colors.forEach((colorName) => {
    const colorData = colorsData.find(
      (c) => c.color_name.trim().toLowerCase() === colorName.trim().toLowerCase()
    );
    if (!colorData) return;
    const hex = `#${colorData.hex}`;
    const container = document.createElement("div");
    container.className = "curated-color-container flex items-center justify-center";
    container.innerHTML = `
      <div class="curated-color-circle w-[100px] h-[100px] rounded-full border border-b08d49 overflow-hidden relative flex items-center justify-center" style="background-color: ${hex}">
        <div class="absolute ${getContrastClass(hex)} text-xs text-center font-special-elite" style="line-height: 1.4; background-color: transparent !important;">
          <span class="font-bold">${colorData.sw_number.replace(/sw/gi, "SW")}</span><br>
          <span>${toInitialCaps(colorData.color_name)}</span>
        </div>
      </div>
    `;
    curatedColorsPreview.appendChild(container);
  });
};

// Main script
Promise.all([
  fetch("./collections/collections.json")
])
  .then(responses => Promise.all(responses.map(response => response.json())))
  .then(([collectionsData]) => {
    // Function to format pattern/collection names
    function formatPatternName(name) {
      const parts = name.split('-');
      let nameParts;
      if (!isNaN(parts[0])) {
        nameParts = parts.slice(1); // Skip numeric prefix (e.g., "109")
      } else {
        nameParts = parts;
      }
      const capitalized = nameParts.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
      return capitalized.join(' ');
    }

    // Function to populate patternsGrid with a given collection's patterns
    function populatePatternsGrid(collection) {
      const patternsGrid = document.getElementById("patternsGrid");
      const collectionTitle = document.querySelector("#mainContent h3");
      patternsGrid.innerHTML = ""; // Clear existing content
      collectionTitle.textContent = `${toInitialCaps(collection.name)} Collection`; // Update title

      collection.patterns.forEach(pattern => {
        const formattedName = formatPatternName(pattern.name);
        const div = document.createElement("div");
        div.className = "mb-4 flex flex-col items-center relative cursor-pointer";
        div.innerHTML = `
          <img src="./collections/${collection.name.toLowerCase()}/${pattern.thumbnail}" alt="${formattedName}" class="w-full max-w-md rounded border border-b08d49 object-cover" style="aspect-ratio: 1;">
          <div class="collection-label absolute bottom-0 left-0 right-0 mx-auto" style="width: 75%; transform: translateY(50%);"></div>
        `;
        // Set the label text after creating the div
        div.querySelector('.collection-label').textContent = formattedName;

        // Make the container clickable to launch the customizer
        div.addEventListener("click", () => {
          const newWindow = window.open(
            `color-flex2.html?collection=${collection.name.toLowerCase()}&pattern=${pattern.name}`,
            "_blank",
            "width=2210,height=1220,top=100,left=100"
          );

          if (newWindow) {
            console.log("Window opened with initial size 2210x1220 content area.");
            setTimeout(() => {
              try {
                let uiOverheadWidth = newWindow.outerWidth - newWindow.innerWidth;
                let uiOverheadHeight = newWindow.outerHeight - newWindow.innerHeight;
                console.log("Calculated overheads:", uiOverheadWidth, "x", uiOverheadHeight);
                console.log("Current window size before resize - Outer:", newWindow.outerWidth, "x", newWindow.outerHeight);
                console.log("Current content area before resize - Inner:", newWindow.innerWidth, "x", newWindow.innerHeight);
                newWindow.resizeTo(2210 + uiOverheadWidth, 1220 + uiOverheadHeight);
                setTimeout(() => {
                  console.log("Window resized. Final size - Outer:", newWindow.outerWidth, "x", newWindow.outerHeight);
                  console.log("Final content area - Inner:", newWindow.innerWidth, "x", newWindow.innerHeight);
                }, 200);
              } catch (error) {
                console.error("Resize failed:", error);
                console.warn("Resizing failed due to browser restrictions. Redirecting to the customizer...");
                window.location.href = `color-flex2.html?collection=${collection.name.toLowerCase()}&pattern=${pattern.name}`;
              }
            }, 500);
          } else {
            console.warn("New window was blocked by the browser. Please allow popups for this site.");
            window.location.href = `color-flex2.html?collection=${collection.name.toLowerCase()}&pattern=${pattern.name}`;
          }
        });
        patternsGrid.appendChild(div);
      });
    }

    // Populate Sidebar Thumbnails - All collections
    const collectionThumbnails = document.getElementById("collectionThumbnails");
    collectionsData.collections.forEach(collection => {
      const img = document.createElement("img");
      img.src = `./collections/${collection.name.toLowerCase()}/thumbnail.jpg`;
      img.alt = collection.name;
      img.className = "w-full h-24 object-cover rounded border border-b08d49 cursor-pointer";
      img.addEventListener("click", () => {
        populatePatternsGrid(collection);
        populateCuratedColorsNonInteractive(collection.curatedColors || [], collectionsData); // Update curated colors
      });
      collectionThumbnails.appendChild(img);
    });

    // Initial population of patternsGrid and curated colors with Farmhouse
    const initialCollection = collectionsData.collections.find(c => c.name.toLowerCase() === "farmhouse");
    if (initialCollection) {
      populatePatternsGrid(initialCollection);
      populateCuratedColorsNonInteractive(initialCollection.curatedColors || [], collectionsData);
    } else {
      console.error("Farmhouse collection not found in collections.json");
    }
  })
  .catch(error => console.error("Error loading collections:", error));