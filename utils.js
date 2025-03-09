// In utils.js
window.loadCSV = function (url, callback) {
    Papa.parse(url, {
        download: true,
        header: true,
        complete: function(results) {
            callback(results.data); // results.data is an array of objects
        },
        error: function(error) {
            console.error("Error loading CSV:", error);
            callback([]); // Return empty array on error
        }
    });
};

window.toInitialCaps = function (str) {
    return str.replace(/-/g, ' ').split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

window.getContrastClass = function (hexcolor) {
    // Simplified contrast check (assuming hexcolor is valid, e.g., "#FFFFFF")
    const r = parseInt(hexcolor.substr(1, 2), 16);
    const g = parseInt(hexcolor.substr(3, 2), 16);
    const b = parseInt(hexcolor.substr(5, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128 ? 'text-black' : 'text-white';
};

window.populateCuratedColorsNonInteractive = function (colors, colorsData) {
    const curatedColorsPreview = document.getElementById("curatedColorsPreview");
    curatedColorsPreview.innerHTML = ""; // Clear existing content
    
    if (!colors || !colors.length) {
        console.warn("No colors provided for curated section.");
        curatedColorsPreview.textContent = "No curated colors available.";
        return;
    }

    // Handle missing or undefined colorsData (assume just color names from CSV)
    colors.forEach((colorName) => {
        const container = document.createElement("div");
        container.className = "curated-color-container flex items-center justify-center";

        // Since colorsData isn't available, show only the color name with a default gray background
        container.innerHTML = `
            <div class="curated-color-circle w-[100px] h-[100px] rounded-full border border-b08d49 overflow-hidden flex items-center justify-center bg-gray-500">
                <span class="text-white text-xs font-special-elite">${window.toInitialCaps(colorName)}</span>
            </div>
        `;
        curatedColorsPreview.appendChild(container);
    });
};