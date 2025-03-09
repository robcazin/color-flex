// Use utility functions from utils.js directly via window (traditional script)
const toInitialCaps = window.toInitialCaps;
const getContrastClass = window.getContrastClass;
const populateCuratedColorsNonInteractive = window.populateCuratedColorsNonInteractive;

// Main script
fetch("./collections/collections.json")
  .then(response => response.json())
  .then(data => {
    const collectionsGrid = document.getElementById("collectionsGrid");
    data.collections.forEach(collection => {
      const div = document.createElement("div");
      div.className = "collection-card cursor-pointer";
      div.innerHTML = `
        <img src="./collections/${collection.name.toLowerCase()}/thumbnail.jpg" alt="${collection.name}" class="w-full h-64 object-cover rounded">
        <div class="collection-label mt-2">${collection.name}</div>
      `;
      div.addEventListener("click", () => {
        window.location.href = `collection.html`; // Hardcoded for now, adjust if multiple collections
      });
      collectionsGrid.appendChild(div);
    });

    // If adding curated colors for a specific collection (e.g., farmhouse), uncomment and adapt:
    // const farmhouse = data.collections.find(c => c.name.toLowerCase() === "farmhouse");
    // if (farmhouse) {
    //   populateCuratedColorsNonInteractive(farmhouse.curatedColors, await (await fetch("./colors.json")).json(), "curatedColorsPreview");
    // }
  })
  .catch(error => console.error("Error loading collections:", error));