// Toggle flag to switch between local JSON and Airtable
const USE_LOCAL_DATA = true; // Set to true for ./data/local-collections.json, false for Airtable

const collectionName = "FARMHOUSE"

async function loadLocalCollectionData(collectionName) {
    try {
      console.log("Fetching local-collections.json...");
      const response = await fetch('./data/local-collections.json');
      const data = await response.json();
      const collection = data.collections.find(c => c.name === collectionName);
      return collection ? collection.records : null;
    } catch (error) {
      console.error('Error loading local data:', error);
      return null;
    }
  }
  
// Add to your global scope or appState
let colorData = null; // Global declaration
let currentPattern = null;
let currentLayers = [];
let patterns = []; // Populated by initialize


document.querySelectorAll(".thumbnail").forEach(thumb => {
    thumb.addEventListener("click", () => {
        const patternId = thumb.dataset.patternId;
        console.log("Thumbnail clicked, pattern ID:", patternId);

        const selectedPattern = patterns.find(p => p.id === patternId);
        if (!selectedPattern) {
            console.error("Pattern not found for ID:", patternId);
            return;
        }

        console.log("Selected pattern:", selectedPattern.name);
        console.log("LAYER SEPARATIONS:", selectedPattern.layers);

        // Determine background color
        let backgroundColor;
        if (selectedPattern.curatedColors && selectedPattern.curatedColors.length > 0) {
            backgroundColor = selectedPattern.curatedColors[0];
        } else {
            const topRow = patterns.find(p => p.number && p.number.endsWith("-000") && p.collection === selectedPattern.collection);
            backgroundColor = topRow && topRow.curatedColors && topRow.curatedColors.length > 0
                ? topRow.curatedColors[0]
                : "#ffffff";
        }

        // Update state
        currentPattern = selectedPattern;
        currentLayers = [];

        // Add background layer
        const backgroundLayer = {
            imageUrl: null,
            color: backgroundColor,
            label: "background"
        };
        currentLayers.push(backgroundLayer);

        // Add overlay layers with position-based labels
        const overlayLayers = selectedPattern.layers || [];
        overlayLayers.forEach((layerUrl, index) => {
            const label = `layer-${index + 1}`; // Position-based label (Layer 1, Layer 2, etc.)

            currentLayers.push({
                imageUrl: layerUrl,
                color: selectedPattern.curatedColors[index + 1] || "#000000",
                label: label
            });
        });

        console.log("Total layers (including background):", currentLayers.length);
        console.log("Overlay layers:", overlayLayers);

        // Update appState
        appState.layerInputs = [];
        createColorInput("Background", "bgColorInput", backgroundColor, true);
        currentLayers.slice(1).forEach((layer, index) => {
            createColorInput(`Layer ${index + 1}`, `layer${index + 1}ColorInput`, layer.color);
        });

        appState.cachedLayerPaths = currentLayers.slice(1).map(layer => ({ url: layer.imageUrl }));
        console.log("Updated cachedLayerPaths:", appState.cachedLayerPaths);

  
      // Trigger preview update
      updatePreview();
    });
  });

const loadJSON = async (url) => {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${url}:`, error);
        throw error;
    }
};

// Utility Functions
const toInitialCaps = (str) =>
    str
        .toLowerCase()
        .split(/[\s-]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const getContrastClass = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "text-black" : "text-white";
};

// State Management
const appState = {
    selectedCollection: null,
    selectedPattern: null,
    currentScale: 40,
    layerInputs: [],
    colorsData: [],
    cachedLayerPaths: [],
    lastSelectedLayer: null,
    collectionsData: null,
    curatedColors: []
};

// DOM Cache - Lazy load after DOMContentLoaded
let dom = {};


// Airtable Setup
if (typeof Airtable === 'undefined') {
    console.error('Airtable library not loaded in color-flex2.html.');
    throw new Error('Airtable not defined');
}

const airtable = new Airtable({ apiKey: 'patFtSWH6rXymvmio.c4b5cf40de13b1c3f8468c169a391dd4bfd49bb4d0079220875703ff5affe7c3' });
const base = airtable.base('appsywaKYiyKQTnl3');

const loadAirtableData = async (tableName, options = {}) => {
    return new Promise((resolve, reject) => {
        console.log(`Starting fetch for ${tableName} with options:`, options);
        base(tableName).select(options).all((err, records) => {
            if (err) {
                console.error(`Error loading ${tableName}:`, err, 'Status:', err.statusCode || 'N/A', 'Headers:', err.response?.headers);
                reject(err);
            } else {
                console.log(`Loaded ${records.length} records from ${tableName}`);
                resolve(records);
            }
        });
    });
};

async function saveLocalData() {
    const collections = [
        { name: '1 - ABUNDANCE COLLECTION', enabled: true },
        { name: '2 - COVERLETS', enabled: true },
        { name: '3 - ENGLISH COTTAGE', enabled: true },
        { name: '5 - FARMHOUSE', enabled: true },
        { name: '6 - BOTANICALS', enabled: true },
        { name: '7 - DISHED UP', enabled: true },
        { name: '8 - BOMBAY', enabled: true },
        { name: '9 - PAGES', enabled: true },
        { name: '10 - GALLERIA', enabled: true },
        { name: '12 - OCEANA', enabled: true },
        { name: '13 - ANCIENT TILES', enabled: true },
        { name: '14 - GEOMETRY', enabled: true },
        { name: '15 - SILK ROAD', enabled: true }
    ];
    const collectionsData = [];
    for (const collection of collections) {
        if (!collection.enabled) continue;
        const name = collection.name;
        console.log(`Processing table: ${name}`);
        try {
            const allRecords = await loadAirtableData(name, {});
            const records = await loadAirtableData(name, { filterByFormula: "{TRADE SHOW} = 1" });
            console.log(`Fetched ${records.length} records from ${name}`);
            const baseName = name.split(' - ')[1].toLowerCase().replace(/ /g, '_');
            const collectionThumbPath = `./collections/${baseName}/${baseName}-thumb.jpg`;

            collectionsData.push({
                name,
                collection_thumbnail: collectionThumbPath,
                records: records.map(r => {
                    const fullName = r.get('name') || `${baseName}-product`;
                    const layerAttachments = r.get('LAYER SEPARATIONS') || [];
                    const layerPaths = layerAttachments.map((layer, index) => {
                        const attachmentName = layer.filename || `default-layer-${index + 1}.jpg`;
                        const parts = attachmentName.split(' - ');
                        const patternName = parts.length > 2 ? parts[1].toLowerCase().replace(/ /g, '_') : fullName.toLowerCase().replace(/ /g, '_');
                        const layerLabel = parts.length > 3 ? parts[2].toLowerCase().replace(/ /g, '_') : `layer-${index + 1}`;
                        console.log(`Pattern name for ${r.id}, layer ${index + 1}: ${patternName}, label: ${layerLabel}`);
                        return `./collections/${baseName}/layers/${patternName}-${layerLabel}.jpg`;
                    });
                    const coordinateAttachments = r.get('COORDINATES') || [];
                    const coordinatePaths = coordinateAttachments.map((coordinate, index) => {
                        const attachmentName = coordinate.filename || `default-coordinate-${index + 1}.jpg`;
                        const parts = attachmentName.split(' - ');
                        const patternName = parts.length > 2 ? parts[1].toLowerCase().replace(/ /g, '_') : fullName.toLowerCase().replace(/ /g, '_');
                        const coordinateLabel = parts.length > 3 ? parts[2].toLowerCase().replace(/ /g, '_') : `coordinate-${index + 1}`;
                        console.log(`Coordinate name for ${r.id}, coordinate ${index + 1}: ${patternName}, label: ${coordinateLabel}`);
                        return `./collections/${baseName}/coordinates/${patternName}-${coordinateLabel}.jpg`;
                    });
                    
                    const recordName = layerAttachments.length > 0 ? layerAttachments[0].filename.split(' - ')[1].toLowerCase().replace(/ /g, '_') : fullName.toLowerCase().replace(/ /g, '_');
                    const thumbnailUrl = r.get('THUMBNAIL') ? r.get('THUMBNAIL')[0].url : null;
                    const thumbnailPath = thumbnailUrl ? `./collections/${baseName}/thumbnails/${recordName}.jpg` : "";

                    return {
                        id: r.id,
                        name: recordName,
                        thumbnail: thumbnailPath, // Add pattern thumbnail
                        layerSeparations: layerPaths.length > 0 ? layerPaths : null,
                        coordinatePrints: coordinatePaths.length > 0 ? coordinatePaths : null,
                        updatedAt: new Date().toISOString()
                    };
                })
            });
        } catch (error) {
            console.error(`Failed to process ${name}:`, error, 'Status:', error.statusCode || 'N/A');
            continue;
        }
    }
    console.log('Data processed, creating JSON:', collectionsData);
    const dataStr = JSON.stringify({ collections: collectionsData }, null, 2);
    console.log('JSON string created, length:', dataStr.length, 'Sample:', dataStr.substring(0, 100) + '...');
    const blob = new Blob([dataStr], { type: 'application/json' });
    console.log('Blob created, size:', blob.size);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = './data/local-collections.json';
    document.body.appendChild(a);
    a.style.display = 'none';
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    a.dispatchEvent(clickEvent);
    document.body.removeChild(a);
    console.log('Download triggered, check your downloads folder');
}

// Run this in the console after loading CF4.html
// saveLocalData();

const getColorHex = (colorName) => {
    console.log("getColorHex called with:", colorName);
    if (!colorName) return "#000000";

    const cleanedColorName = colorName.toLowerCase().trim();
    console.log("Cleaned color name (initial):", cleanedColorName);

    const strippedPrefix = cleanedColorName.replace(/^sw\d+\s*/i, "");
    console.log("Cleaned color name (after stripping prefix):", strippedPrefix);

    if (/^#[0-9A-Fa-f]{6}$/.test(cleanedColorName)) {
        console.log("Valid hex color, returning:", cleanedColorName);
        return cleanedColorName;
    }

    if (!appState.colorsData || !Array.isArray(appState.colorsData)) {
        console.warn("colorData is not loaded or invalid, returning default #FF0000");
        return "#FF0000";
    }

    const colorEntry = appState.colorsData.find(c => c.name.toLowerCase() === strippedPrefix);
    if (colorEntry && colorEntry.hex) {
        console.log("Found color hex:", colorEntry.hex);
        return colorEntry.hex;
    }

    console.warn("Color not found, returning default #000000");
    return "#000000";
};


const fallbackCuratedColors = [
    "SW7069 Iron Ore",
    "SW7067 Cityscape",
    "SW3441 Foothills",
    "SW6135 Ecru",
    "SW7699 Rustic City",
    "SW6206 Oyster Bay",
    "SW6186 Dried Thyme",
    "HGSW1472 Slate Tile",
    "SW0006 Toile Red"
];

// UI Creation
// const createColorInput = (labelText, id, initialColor, isBackground = false) => {
//     const container = document.createElement("div");
//     container.className = "layer-input-container";
//     const label = document.createElement("div");
//     label.className = "layer-label";
//     label.textContent = labelText || "Unknown Layer";
//     console.log(`Creating color input with label: ${labelText}, ID: ${id}`);
//     const circle = document.createElement("div");
//     circle.className = "circle-input";
//     circle.id = `${id}Circle`;
//     const input = document.createElement("input");
//     input.type = "text";
//     input.className = "layer-input";
//     input.id = id;
//     input.placeholder = `Enter ${labelText ? labelText.toLowerCase() : 'layer'} color`;
//     // Strip SW/HGSW number prefix
//     const cleanInitialColor = (initialColor || "Snowbound").replace(/^(SW|HGSW)\d+\s*/i, "").trim();
//     input.value = toInitialCaps(cleanInitialColor);
//     circle.style.backgroundColor = getColorHex(initialColor || "Snowbound"); // Use full name for hex
//     container.append(label, circle, input);
//     if (dom.layerInputsContainer) {
//         dom.layerInputsContainer.appendChild(container);
//     } else {
//         console.error("layerInputsContainer not found in DOM");
//     }

//     const layerData = { input, circle, isBackground };
//     if (!appState.layerInputs.some(li => li.input.id === id)) {
//         appState.layerInputs.push(layerData);
//     }

//     circle.addEventListener("click", () => {
//         appState.lastSelectedLayer = layerData;
//         highlightActiveLayer(circle);
//         if (localStorage.getItem("hidePopup") !== "true") {
//             showPopupMessage("🎨 Now, click a curated color to set this color, OR enter an SW name.", "hidePopup");
//         }
//     });

//     const updateColor = () => {
//         const formatted = toInitialCaps(input.value.trim());
//         input.value = formatted;
//         const hex = getColorHex(formatted) || getColorHex("Snowbound");
//         circle.style.backgroundColor = hex;
//         updateDisplays();
//     };

//     input.addEventListener("blur", updateColor);
//     input.addEventListener("keydown", (e) => e.key === "Enter" && updateColor());

//     return layerData;
// };
const createColorInput = (label, id, initialColor) => {
    console.log("Creating color input with label:", label, "ID:", id);
    const container = document.createElement("div");
    container.className = "color-input-container";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    labelEl.htmlFor = id;

    const input = document.createElement("input");
    input.type = "color";
    input.id = id;
    input.value = getColorHex(initialColor);

    container.appendChild(labelEl);
    container.appendChild(input);
    dom.layerInputsContainer.appendChild(container);

    return input;
};


const highlightActiveLayer = (circle) => {
    document.querySelectorAll(".circle-input").forEach((c) => (c.style.outline = "none"));
    circle.style.outline = "6px solid rgb(244, 255, 219)";
};

const showPopupMessage = (message, storageKey) => {
    console.log("Attempting to show popup:", message, "Storage check:", localStorage.getItem(storageKey));
    if (localStorage.getItem(storageKey) === "true" || document.getElementById("popupMessage")) {
        console.log("Popup suppressed or already exists");
        return;
    }
    const popup = document.createElement("div");
    popup.id = "popupMessage";
    popup.className = "custom-popup";
    Object.assign(popup.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgb(243, 230, 212)",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        zIndex: "10000",
        textAlign: "center",
        fontFamily: "'Special Elite', cursive",
        color: "#333",
    });
    popup.innerHTML = `
        <p style="margin-bottom: 15px; font-size: 18px">${message}</p>
        <div style="display: flex; align-items: center; justify-content: center; margin-top: 10px">
            <input type="checkbox" id="popupDismiss" style="margin-right: 5px">
            <label for="popupDismiss" style="font-size: 14px">Don't show this again</label>
        </div>
        <button style="margin-top: 10px; padding: 10px 20px; background: rgb(123, 128, 112); color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Special Elite', cursive">OK</button>
    `;
    popup.querySelector("button").addEventListener("click", () => {
        if (popup.querySelector("#popupDismiss").checked) {
            localStorage.setItem(storageKey, "true");
            console.log("Popup dismissed forever:", storageKey);
        }
        document.body.removeChild(popup);
    });
    document.body.appendChild(popup);
    console.log("Popup added to DOM");
};


// Core Logic
const loadThumbnails = (patterns) => {
    if (!dom.collectionThumbnails) {
        console.error("thumbnailsContainer not found in DOM");
        return;
    }
    if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
        console.warn("No valid patterns provided to loadThumbnails:", patterns);
        dom.collectionThumbnails.innerHTML = "<p>No patterns available</p>";
        return;
    }

    console.log("Loading thumbnails for patterns:", patterns.map(p => ({ name: p.name, thumbnail: p.thumbnail })));
    const thumbnailsContainer = dom.collectionThumbnails;
    thumbnailsContainer.innerHTML = "";

    patterns.forEach(pattern => {
        if (!pattern || typeof pattern !== 'object') {
            console.warn("Invalid pattern object:", pattern);
            return;
        }

        const thumbDiv = document.createElement("div");
        thumbDiv.className = "thumbnail";
        thumbDiv.dataset.patternId = pattern.id || "unknown-id";

        const img = document.createElement("img");
        img.src = pattern.thumbnail || "https://placehold.co/150x150?text=No+Thumbnail";
        if (!pattern.thumbnail) {
            console.warn(`Using fallback thumbnail for pattern ${pattern.name || 'unnamed'}`);
        }
        img.alt = pattern.name || "Unknown Pattern";
        img.onerror = () => {
            console.error(`Failed to load thumbnail for ${pattern.name || 'unnamed'}: ${img.src}`);
            img.src = "https://placehold.co/150x150?text=Error";
        };

        thumbDiv.appendChild(img);
        thumbnailsContainer.appendChild(thumbDiv);
    });
};
// INPUTS create inputs for pattern based on layer separation count
const populateLayerInputs = (curatedColors) => {
    const totalLayerCount = appState.cachedLayerPaths.length + 1;
    console.log(`Populating inputs for ${totalLayerCount} layers`);
    console.log("Cached layer paths for inputs:", appState.cachedLayerPaths); // Debug
    dom.layerInputsContainer.innerHTML = "";
    appState.layerInputs = [];
    createColorInput("Background", "bgColorInput", curatedColors[0], true); // Background input

    // Populate layer inputs with derived names
    // appState.cachedLayerPaths.forEach((layer, index) => {
    //     const label = layer.name || `Layer ${index + 1}`; // Use derived name
    //     console.log(`Creating input for layer ${index + 1} with label: ${label}`); // Debug
    //     const colorIndex = index + 1; // Offset for curatedColors
    //     const initialColor = curatedColors[colorIndex] || "#000000"; // Fallback color
    //     createColorInput(label, `layer${index + 1}ColorInput`, initialColor);
    // });
    appState.cachedLayerPaths.forEach((layer, index) => {
        const label = layer.name || `Layer ${index + 1}`;
        console.log(`Creating input for layer ${index + 1} with label: ${label}`);
        const colorIndex = index + 1;
        const fullColor = appState.collectionsData[0].curatedColors[colorIndex] || "#000000"; // "SW7069 Iron Ore"
        const initialColor = fullColor.startsWith("#") ? fullColor : fullColor.replace(/^(SW|HGSW)\d+\s*/i, ""); // "Iron Ore"
        createColorInput(label, `layer${index + 1}ColorInput`, initialColor);
    });

    console.log("Layer inputs:", appState.layerInputs.map(input => ({
        id: input.input.id,
        label: input.input.previousSibling.textContent,
        value: input.input.value
    })));
};
const updateDisplays = () => {
    console.log("Updating displays...");
    console.log("DOM elements:", {
        preview: !!dom.preview,
        roomMockup: !!dom.roomMockup,
        coordinatesContainer: !!dom.coordinatesContainer,
        layerInputsContainer: !!dom.layerInputsContainer,
        curatedColorsContainer: !!dom.curatedColorsContainer
    });
    updatePreview();
    updateRoomMockup();
    populateCoordinates(appState.currentPattern?.coordinates || []);
};

// Add selectPattern before startApp
const selectPattern = (patternName) => {
    console.log("Attempting to select pattern:", patternName);
    const pattern = appState.collections
        .flatMap(c => c.patterns)
        .find(p => p.name === patternName);
    if (pattern) {
        console.log("Selected pattern:", pattern);
        appState.currentPattern = pattern;
        populateLayerInputs(pattern);
        updateDisplays();
    } else {
        console.warn(`Pattern "${patternName}" not found`);
    }
};

const handleCollectionSelection = (collection) => {
    console.log("Handling collection selection:", collection);
    if (!collection) {
        console.warn("No collection provided, skipping");
        return;
    }
    const collectionPatterns = appState.collections
        .flatMap(c => c.patterns.map(p => ({ ...p, collection: c.name })))
        .filter(p => p.collection === collection);
    console.log("Loading thumbnails for patterns:", collectionPatterns);

    if (collectionPatterns.length === 0) {
        console.warn("Invalid collection or missing patterns:", collection);
        return;
    }

    dom.collectionThumbnails.innerHTML = "";
    collectionPatterns.forEach(pattern => {
        const img = document.createElement("img");
        img.src = pattern.thumbnail;
        img.alt = pattern.name;
        img.className = "thumbnail";
        img.addEventListener("click", () => selectPattern(pattern.name));
        dom.collectionThumbnails.appendChild(img);
    });
};



const handlePatternSelection = (patternName) => {
    console.log(`Attempting to select pattern: ${patternName}`);
    const pattern = appState.selectedCollection.patterns.find(
        p => p.name.toUpperCase() === patternName.toUpperCase()
    ) || appState.selectedCollection.patterns[0];
    appState.selectedPattern = pattern;
    console.log("Selected pattern:", appState.selectedPattern);

    let backgroundColor;
    if (appState.selectedPattern.curatedColors && appState.selectedPattern.curatedColors.length > 0) {
        backgroundColor = appState.selectedPattern.curatedColors[0];
    } else {
        const topRow = appState.selectedCollection.patterns.find(p => p.number && p.number.endsWith("-000") && p.collection === appState.selectedPattern.collection);
        backgroundColor = topRow && topRow.curatedColors && topRow.curatedColors.length > 0
            ? topRow.curatedColors[0]
            : "#ffffff";
    }

    currentPattern = appState.selectedPattern;
    currentLayers = [];

    const backgroundLayer = {
        imageUrl: null,
        color: backgroundColor,
        label: "Background" // Fixed label, not from LAYER LABELS
    };
    currentLayers.push(backgroundLayer);

    const overlayLayers = appState.selectedPattern.layers || [];
    overlayLayers.forEach((layerUrl, index) => {
        const label = pattern.layerLabels[index] || `Layer ${index + 1}`; // Start at index 0 for overlay layers
        console.log(`Using LAYER LABELS for layer ${index + 1}: "${label}"`);
        currentLayers.push({
            imageUrl: layerUrl,
            color: appState.selectedPattern.curatedColors[index + 1] || "#000000",
            label: label
        });
    });

    console.log("Total layers (including background):", currentLayers.length);
    console.log("Overlay layers with names:", currentLayers.slice(1).map(l => l.label));

    appState.layerInputs = [];
    createColorInput("Background", "bgColorInput", backgroundColor, true);
    currentLayers.slice(1).forEach((layer, index) => {
        createColorInput(layer.label, `layer${index + 1}ColorInput`, layer.color);
    });

    appState.cachedLayerPaths = currentLayers.slice(1).map(layer => ({
        url: layer.imageUrl,
        name: layer.label
    }));
    console.log("Cached layer paths:", appState.cachedLayerPaths);

    if (dom.patternName) dom.patternName.textContent = appState.selectedPattern.name;

    const curatedColors = appState.selectedCollection.curatedColors || fallbackCuratedColors;
    appState.curatedColors = curatedColors;
    console.log("Collection curated colors:", curatedColors);

    try {
        populateLayerInputs(curatedColors);
        populateCuratedColors(curatedColors);
        populateCoordinates(appState.selectedPattern.coordinatePrints || []);
        updateDisplays();
    } catch (error) {
        console.error("Error in handlePatternSelection:", error);
    }
};



const populateCuratedColors = (colors) => {
    console.log("Populating curated colors:", colors);
    if (!dom.curatedColorsContainer) {
        console.error("curatedColorsContainer not found in DOM");
        return;
    }
    dom.curatedColorsContainer.innerHTML = "";
    if (!colors.length) {
        dom.curatedColorsContainer.textContent = "No curated colors available.";
        return;
    }
    colors.forEach((colorName) => {
        const hex = getColorHex(colorName);
        const container = document.createElement("div");
        container.className = "curated-color-container flex items-center justify-center";
        container.innerHTML = `
            <div class="curated-color-circle w-24 h-24 rounded-full overflow-hidden relative flex items-center justify-center" style="background-color: ${hex}">
                <div class="absolute ${getContrastClass(hex)} text-xs text-center" style="line-height: 1.4">
                    <span>${toInitialCaps(colorName)}</span>
                </div>
            </div>
        `;
        console.log("Created curated color container for:", colorName);
        container.addEventListener("click", () => {
            console.log("Curated color clicked:", colorName, "lastSelectedLayer:", appState.lastSelectedLayer);
            if (!appState.lastSelectedLayer) {
                showPopupMessage("❌ Please click a background or layer circle first.", "hideSelectionWarning");
                return;
            }
            appState.lastSelectedLayer.input.value = toInitialCaps(colorName);
            appState.lastSelectedLayer.circle.style.backgroundColor = hex;
            updateDisplays();
            updateRoomMockup(); // Ensure mockup updates
            updatePreview();   // Ensure preview updates
            populateCoordinates(); // Trigger coordinates update

            // Optional: Update current pattern if tied to color
            const selectedPattern = appState.collectionsData.flatMap(c => c.patterns).find(p => 
                p.curatedColors.includes(colorName)
            );
            if (selectedPattern && selectedPattern !== appState.currentPattern) {
                appState.currentPattern = selectedPattern;
                console.log("Pattern updated to:", selectedPattern.name, "coordinates:", selectedPattern.coordinatePrints);
                populateCoordinates(); // Call again if pattern change affects coordinates
            }
        });
        dom.curatedColorsContainer.appendChild(container);
    });
    console.log("Finished populating curated colors, total:", colors.length);
};


const populateCoordinates = () => {
    if (!dom.coordinatesContainer) {
        console.error("coordinatesContainer not found in DOM");
        return;
    }

    dom.coordinatesContainer.innerHTML = "";
    dom.coordinatesContainer.style.position = "relative";

    // Get coordinates from current pattern
    const coordinates = appState.currentPattern?.coordinates || [];
    console.log("Coordinates data:", coordinates);

    if (!coordinates || coordinates.length === 0) {
        dom.coordinatesContainer.textContent = "No matching coordinates available.";
        console.log("No coordinates to display - coordinates:", coordinates);
        return;
    }

    // Calculate group dimensions and centering
    const numCoordinates = coordinates.length;
    const xStep = 80; // Horizontal spacing
    const yStep = 60; // Vertical stagger
    const totalXSpan = (numCoordinates - 1) * xStep;
    const totalYSpan = numCoordinates > 1 ? yStep : 0;
    const xStart = -(totalXSpan / 2);
    const yStart = -(totalYSpan / 2.5);
    console.log(`Group span - X: ${totalXSpan}px, Y: ${totalYSpan}px, xStart: ${xStart}px, yStart: ${yStart}px`);

    coordinates.forEach((coord, index) => {
        const div = document.createElement("div");
        div.className = "coordinate-item";

        const xOffset = xStart + (index * xStep);
        const yOffset = yStart + 10 + (index % 2 === 0 ? yStep : 0);
        div.style.setProperty("--x-offset", `${xOffset}px`);
        div.style.setProperty("--y-offset", `${yOffset}px`);
        div.style.left = "50%";
        div.style.top = "50%";
        console.log(`Coordinate ${index + 1} - x-offset: ${xOffset}px, y-offset: ${yOffset}px`);

        const img = document.createElement("img");
        // Construct image path based on collection and pattern
        const imagePath = `./data/collections/${coord.collection}/coordinates/${coord.pattern}.jpg`;
        img.src = imagePath;
        img.alt = `${coord.pattern} Coordinate ${index + 1}`;
        img.style.width = "150px";
        img.style.height = "auto";
        img.style.objectFit = "cover";

        // Handle image loading errors gracefully
        img.onerror = () => {
            console.warn(`Failed to load coordinate image: ${img.src}`);
            img.remove(); // Remove failed image
            if (div.children.length === 0) {
                div.remove(); // Remove empty container
            }
        };

        // Optional: Add scale information
        const scaleLabel = document.createElement("span");
        scaleLabel.textContent = `Scale: ${coord.recommendedscale}%`;
        scaleLabel.style.fontSize = "12px";
        scaleLabel.style.display = "block";
        scaleLabel.style.textAlign = "center";

        div.appendChild(img);
        div.appendChild(scaleLabel);
        dom.coordinatesContainer.appendChild(div);
    });

    console.log("Coordinates populated, count:", coordinates.length);
};

const updatePreview = () => {
    console.log("Updating preview");
    if (!dom.preview) {
        console.error("preview not found in DOM");
        return;
    }
    const bgInput = appState.layerInputs[0]?.input;
    if (!bgInput) {
        console.error("Background input not found in appState.layerInputs");
        return;
    }
    const bgColor = getColorHex(bgInput.value);
    console.log("Updating preview with bgColor from input:", bgInput.value, "converted to:", bgColor);

    dom.preview.classList.remove("aspect-square");
    dom.preview.classList.add("w-[565px]", "h-[630px]", "overflow-hidden", "relative", "z-0", "flex-shrink-0");
    dom.preview.style.cssText = "";
    dom.preview.innerHTML = "";

    const bgDiv = document.createElement("div");
    bgDiv.style.cssText = `
        background-color: ${bgColor};
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 0;
        opacity: 1;
    `;
    dom.preview.appendChild(bgDiv);

    console.log("Current layers for preview:", currentLayers);
    if (currentLayers && currentLayers.length > 1) {
        currentLayers.slice(1).forEach((layer, index) => {
            const layerInput = appState.layerInputs[index + 1]?.input;
            const layerColor = getColorHex(layerInput ? layerInput.value : "#000000");
            console.log(`Layer ${index + 1} URL: ${layer.imageUrl}, Color: ${layerColor}, Label: ${layer.label}`);
            const div = document.createElement("div");
            div.style.cssText = `
                background-color: ${layerColor};
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                z-index: ${index + 1};
                mask-image: url(${layer.imageUrl});
                -webkit-mask-image: url(${layer.imageUrl});
                mask-size: contain;
                -webkit-mask-size: contain;
                mask-position: center;
                -webkit-mask-position: center;
                display: block !important;
                opacity: 1;
            `;
            dom.preview.appendChild(div);
        });
    } else {
        console.warn("No overlay layers to render in preview");
    }
};

const updateRoomMockup = () => {
    console.log("Updating room mockup");
    if (!dom.roomMockup) {
        console.error("roomMockup element not found in DOM");
        return;
    }
    const bgInput = appState.layerInputs[0]?.input;
    if (!bgInput) {
        console.error("Background input not found");
        return;
    }
    const bgColor = getColorHex(bgInput.value);
    console.log("Updating room mockup with bgColor from input:", bgInput.value, "converted to:", bgColor);

    dom.roomMockup.classList.remove("aspect-square");
    dom.roomMockup.classList.add("w-[600px]", "max-w-[600px]", "pb-[75.33%]", "UNIh-0", "overflow-hidden", "relative", "z-0", "flex-shrink-0");
    dom.roomMockup.innerHTML = "";

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 452;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderCanvas = () => {
        console.log("Rendering Canvas to #roomMockup");
        dom.roomMockup.innerHTML = "";
        const img = document.createElement("img");
        img.src = canvas.toDataURL("image/png");
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.position = "absolute";
        img.style.top = "0";
        img.style.left = "0";
        img.onload = () => console.log("Room mockup image loaded");
        img.onerror = () => console.error("Failed to load room mockup image");
        dom.roomMockup.appendChild(img);
    };

    renderCanvas();

    console.log("Current layers for room mockup:", currentLayers);
    if (currentLayers && currentLayers.length > 1) {
        const isHalfDrop = appState.currentPattern.tilingType === "half-drop";
        console.log(`updateRoomMockup: Tiling type: ${appState.currentPattern.tilingType}`);

        const layersPromises = currentLayers.slice(1).map((layer, index) => {
            const layerInput = appState.layerInputs[index + 1]?.input;
            const layerColor = getColorHex(layerInput ? layerInput.value : "#000000");
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = layer.imageUrl;
                img.onload = () => {
                    console.log(`Layer ${index + 1} mask loaded: ${layer.imageUrl}`);
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    const tempCtx = tempCanvas.getContext("2d");

                    const baseTileSize = 400;
                    const scale = appState.currentScale / 100;
                    const tileWidth = baseTileSize * scale;
                    const tileHeight = baseTileSize * scale * (img.height / img.width);
                    console.log(`Layer ${index + 1} tile dimensions: ${tileWidth}x${tileHeight}`);

                    const offsetY = isHalfDrop ? tileHeight / 2 : 0;

                    for (let x = 0; x < canvas.width; x += tileWidth) {
                        const isOddColumn = Math.floor(x / tileWidth) % 2 !== 0;
                        const yOffset = isOddColumn && isHalfDrop ? offsetY : 0;
                        for (let y = -yOffset; y < canvas.height; y += tileHeight) {
                            tempCtx.drawImage(img, x, y, tileWidth, tileHeight);
                        }
                    }

                    tempCtx.globalCompositeOperation = "source-in";
                    tempCtx.fillStyle = layerColor;
                    tempCtx.fillRect(0, 0, canvas.width, canvas.height);

                    ctx.globalCompositeOperation = "source-over";
                    ctx.drawImage(tempCanvas, 0, 0);
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load mask image for layer ${index + 1}: ${layer.imageUrl}`);
                    resolve();
                };
            });
        });

        Promise.all(layersPromises)
            .then(() => {
                console.log("All layers processed, rendering with layers");
                renderCanvas();
                const overlay = new Image();
                overlay.src = "./mockups/English-Countryside-Bedroom-1.png";
                overlay.onload = () => {
                    console.log("Room overlay loaded");
                    ctx.globalCompositeOperation = "source-over";
                    ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
                    renderCanvas();
                };
                overlay.onerror = () => {
                    console.error("Failed to load room overlay image");
                };
            })
            .catch(error => {
                console.error("Error processing layers in updateRoomMockup:", error);
            });
    } else {
        console.warn("No overlay layers to render in room mockup");
    }
};

// ... (Rest of your existing code unchanged) ...

// Updated processImage function with contrast maximization
const processImage = (url, callback, layerColor = '#7f817e', gamma = 2.2) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
        console.log("Image loaded successfully:", url);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const width = img.width;
        const height = img.height;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        console.log("Original Sample (R,G,B,A):", data[0], data[1], data[2], data[3]);

        let minLuminance = 255, maxLuminance = 0;
        for (let i = 0; i < data.length; i += 4) {
            const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            minLuminance = Math.min(minLuminance, luminance);
            maxLuminance = Math.max(maxLuminance, luminance);
        }

        console.log("Min Luminance:", minLuminance, "Max Luminance:", maxLuminance);

        const range = maxLuminance - minLuminance || 1; // Avoid division by zero

        // Parse the layer color (hex to RGB)
        const hex = layerColor.replace("#", "");
        const rLayer = parseInt(hex.substring(0, 2), 16);
        const gLayer = parseInt(hex.substring(2, 4), 16);
        const bLayer = parseInt(hex.substring(4, 6), 16);

        for (let i = 0; i < data.length; i += 4) {
            let luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            // Normalize to 0-1 range
            let normalized = (luminance - minLuminance) / range;
            normalized = Math.max(0, Math.min(1, normalized));

            // Apply gamma correction
            let gammaCorrected = Math.pow(normalized, 1 / gamma);

            // Invert for mask effect
            let inverted = 1 - gammaCorrected;

            // Use inverted value as a mask to blend with the layer color
            data[i] = Math.round(inverted * rLayer);
            data[i + 1] = Math.round(inverted * gLayer);
            data[i + 2] = Math.round(inverted * bLayer);

            // Transparency: Make originally white areas transparent
            // Use the original luminance to determine transparency
            let alpha = (luminance / 255); // 0 (black) to 1 (white)
            alpha = 1 - alpha; // Invert: white (1) becomes 0 (transparent), black (0) becomes 1 (opaque)
            data[i + 3] = Math.round(alpha * 255); // Scale to 0-255
        }

        console.log("Processed Sample (R,G,B,A):", data[0], data[1], data[2], data[3]);

        ctx.putImageData(imageData, 0, 0);
        callback(canvas.toDataURL("image/png", 1.0));
    };

    img.onerror = () => console.error(`Canvas image load failed: ${url}`);
};



const dom = {
    patternName: "patternName",
    collectionHeader: "collectionHeader",
    collectionThumbnails: "collectionThumbnails",
    layerInputsContainer: "layerInputsContainer",
    curatedColorsContainer: "curatedColorsContainer",
    designerColorsContainer: "designerColorsContainer",
    preview: "preview",
    roomMockup: "roomMockup",
    coordinatesContainer: "coordinatesContainer"
};

const appState = {
    collections: [],
    colorsData: [],
    currentPattern: null,
    curatedColors: [],
    layerInputs: []
};

const initialize = async () => {
    try {
        console.log("Fetching colors.json...");
        const colorsResponse = await fetch("./data/colors.json");
        if (!colorsResponse.ok) {
            throw new Error(`Failed to fetch colors.json: ${colorsResponse.status}`);
        }
        const colorsData = await colorsResponse.json();
        console.log("Successfully loaded colors.json:", colorsData);
        if (!Array.isArray(colorsData)) {
            throw new Error("colors.json is not an array");
        }
        appState.colorsData = colorsData;
        console.log("colorsData set:", appState.colorsData.length);

        console.log("Fetching local-collections.json...");
        const collectionsResponse = await fetch("./data/local-collections.json");
        if (!collectionsResponse.ok) {
            throw new Error(`HTTP error! Status: ${collectionsResponse.status}`);
        }
        const data = await collectionsResponse.json();
        const collectionsData = data.collections;
        console.log("Collections loaded:", collectionsData);

        appState.collections = collectionsData;
        console.log("Updated colorsData:", appState.colorsData);

        return collectionsData;
    } catch (error) {
        console.error("Error in initialize:", error);
        return null;
    }
};

const startApp = async (collectionName = "FARMHOUSE", patternName = "first available") => {
    console.log("Starting app with collection:", collectionName, "pattern:", patternName);
    const collectionsData = appState.collections || [];
    const collectionPatterns = collectionsData
        .flatMap(c => c.patterns.map(p => ({ ...p, collection: c.name })))
        .filter(p => p.collection === collectionName.toLowerCase());
    console.log("Available patterns:", collectionPatterns);

    if (collectionPatterns.length === 0) {
        console.error(`No patterns found for collection: ${collectionName}`);
        return;
    }

    const lowerCaseCollection = collectionName.toLowerCase();
    console.log("Passing to handleCollectionSelection:", lowerCaseCollection);
    handleCollectionSelection(lowerCaseCollection); // Ensure this line is correct

    const patternToSelect = patternName === "first available" ? 
        collectionPatterns[0].name : 
        patternName;
    const selectedPattern = collectionPatterns.find(p => p.name === patternToSelect);

    if (selectedPattern) {
        selectPattern(selectedPattern.name);
    } else {
        console.warn(`Pattern "${patternToSelect}" not found, using first available pattern`);
        selectPattern(collectionPatterns[0].name);
    }

    if (!appState.layerInputs[0]) {
        createColorInput("Background", "backgroundColorInput", "Iron Ore");
        appState.layerInputs[0] = { input: document.getElementById("backgroundColorInput") };
    }

    appState.layerInputs.forEach((layerInput, index) => {
        if (layerInput?.input) {
            layerInput.input.addEventListener("input", () => {
                console.log(`Layer ${index} input changed to: ${layerInput.input.value}`);
                // updateRoomMockup();
                // updatePreview();
                // populateCoordinates();
            });
        }
    });

    // populateCoordinates();

    const displaySize = document.createElement('div');
    document.body.appendChild(displaySize);
    displaySize.style.position = 'fixed';
    displaySize.style.top = '10px';
    displaySize.style.left = '10px';
    displaySize.style.background = 'rgba(0,0,0,0.7)';
    displaySize.style.color = 'white';
    displaySize.style.padding = '5px';
    displaySize.style.borderRadius = '5px';

    function updateSize() {
        displaySize.textContent = `Viewport: ${window.innerWidth} x ${window.innerHeight}`;
    }

    window.addEventListener('resize', updateSize);
    updateSize();
};


// Add this new function
const generatePrintPreview = () => {
    const pattern = appState.selectedPattern;
    const collectionName = appState.selectedCollection.name;
    const patternName = pattern.name;

    console.log("appState.curatedColors:", appState.curatedColors);

    let textContent = `
        <img src="./img/SC-header-mage.jpg" alt="SC Logo" class="sc-logo">
        <h2>${toInitialCaps(collectionName)}</h2>
        <h3>${patternName}</h3>
        <ul style="list-style: none; padding: 0;">
    `;

    currentLayers.forEach((layer, index) => {
        const swNumber = index === 0 ? appState.curatedColors[0] : pattern.curatedColors[index] || "N/A";
        textContent += `
            <li>${layer.label} | ${swNumber}</li>
        `;
    });

    textContent += "</ul>";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 565;
    canvas.height = 630;

    const bgLayer = dom.preview.children[0];
    const bgColor = bgLayer.style.backgroundColor || "gray";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawLayers = async () => {
        for (let i = 0; i < appState.cachedLayerPaths.length; i++) {
            const layer = appState.cachedLayerPaths[i];
            const layerDiv = dom.preview.children[i + 1];
            const layerColor = layerDiv.style.backgroundColor || "gray";
            const maskUrl = layerDiv.style.webkitMaskImage || layerDiv.style.maskImage || "";
            const maskSrc = maskUrl.replace(/url\(["']?/, '').replace(/["']?\)/, '');

            // Determine if this is a shadow layer (placeholder logic)
            const isShadowLayer = layer.name.toLowerCase().includes("shadow"); // Replace with your logic
            console.log(`Processing layer ${i + 1}: "${layer.name}", Is Shadow: ${isShadowLayer}`);

            if (maskSrc) {
                try {
                    const maskImg = new Image();
                    maskImg.crossOrigin = "Anonymous";
                    await new Promise((resolve, reject) => {
                        maskImg.onload = resolve;
                        maskImg.onerror = reject;
                        maskImg.src = maskSrc;
                    });

                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    const tempCtx = tempCanvas.getContext("2d");

                    tempCtx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);

                    // Apply appropriate compositing mode
                    ctx.globalCompositeOperation = isShadowLayer ? "multiply" : "source-over";
                    console.log(`Using globalCompositeOperation: ${ctx.globalCompositeOperation} for layer ${i + 1}`);

                    tempCtx.globalCompositeOperation = "source-in";
                    tempCtx.fillStyle = layerColor;
                    tempCtx.fillRect(0, 0, canvas.width, canvas.height);

                    ctx.drawImage(tempCanvas, 0, 0);

                    // Reset to source-over after shadow layer
                    if (isShadowLayer) {
                        ctx.globalCompositeOperation = "source-over";
                        console.log("Reset to source-over after shadow layer");
                    }
                } catch (error) {
                    console.error(`Failed to load mask for layer ${i + 1}:`, error);
                }
            }
        }

        const previewImage = canvas.toDataURL("image/png");
        console.log("Canvas created:", previewImage);

        const previewWindow = window.open('', '_blank', 'width=800,height=1200');
        previewWindow.document.write(`
            <html>
                <head>
                    <title>Print Preview</title>
                    <link href="https://fonts.googleapis.com/css2?family=Special+Elite&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Special Elite', 'Times New Roman', serif !important; /* Force Special Elite, fallback to Times */
                            padding: 20px;
                            margin: 0;
                            display: flex;
                            justify-content: center;
                            align-items: flex-start;
                            min-height: 100vh;
                            overflow: auto;
                        }
                        .print-container {
                            text-align: center;
                            max-width: 600px;
                            width: 100%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                        }
                        .sc-logo {
                            width: 300px !important;
                            height: auto;
                            margin: 0 auto 20px;
                            display: block;
                        }
                        h1 { font-size: 24px; margin-bottom: 10px; }
                        h2 { font-size: 20px; margin: 5px 0; }
                        h3 { font-size: 18px; margin: 5px 0; }
                        ul { margin: 10px 0; }
                        li { margin: 5px 0; }
                        img { max-width: 100%; height: auto; margin: 20px auto; display: block; }
                        .button-container { margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${textContent}
                        <img src="${previewImage}" alt="Pattern Preview">
                        <div class="button-container">
                            <button onclick="window.print();">Print</button>
                            <button onclick="window.close();">Close</button>
                        </div>
                    </div>
                </body>
            </html>
        `);

        const logoImg = previewWindow.document.querySelector('.sc-logo');
        const previewImg = previewWindow.document.querySelector('img[alt="Pattern Preview"]');
        previewWindow.document.addEventListener('DOMContentLoaded', () => {
            if (logoImg) {
                console.log("SC Logo computed width:", logoImg.offsetWidth, "px");
                const computedStyle = window.getComputedStyle(logoImg);
                console.log("SC Logo computed style - margin:", computedStyle.marginLeft, computedStyle.marginRight);
                console.log("SC Logo position:", logoImg.getBoundingClientRect());
            }
            if (previewImg) {
                console.log("Preview Image computed width:", previewImg.offsetWidth, "px");
                console.log("Preview Image position:", previewImg.getBoundingClientRect());
            }
        });

        previewWindow.document.close();
    };

    drawLayers().catch(error => {
        console.error("Error generating preview image:", error);
        const fallbackWindow = window.open('', '_blank', 'width=600,height=400');
        fallbackWindow.document.write(`
            <html>
                <head><title>Print Preview (Text Only)</title><style>body { font-family: 'Special Elite', cursive; padding: 20px; text-align: center; }</style></head>
                <body>${textContent}<div><button onclick="window.print();">Print</button><button onclick="window.close();">Close</button></div></body>
            </html>
        `);
        fallbackWindow.document.close();
    });
};

            
            document.addEventListener("DOMContentLoaded", async () => {
                console.log("DOM content loaded, initializing...");
                const domCheck = Object.keys(dom).reduce((acc, key) => {
                    acc[key] = !!document.getElementById(key);
                    return acc;
                }, {});
                console.log("Initial DOM check:", domCheck);

                await initialize();
                await startApp("FARMHOUSE");
            });

// DOMContentLoaded 
//     document.addEventListener("DOMContentLoaded", async () => {
//     try {
//         console.log("DOM content loaded, initializing...");
//         window.resizeTo(1850, 1240);
//         window.moveTo(0, 0);

//         dom = {
//             patternName: document.getElementById("patternName"),
//             collectionHeader: document.getElementById("collectionHeader"),
//             collectionThumbnails: document.getElementById("collectionThumbnails"),
//             layerInputsContainer: document.getElementById("layerInputsContainer"),
//             curatedColorsContainer: document.getElementById("curatedColorsContainer"),
//             preview: document.getElementById("preview"),
//             roomMockup: document.getElementById("roomMockup"),
//             coordinatesContainer: document.getElementById("coordinatesContainer"),
//             printButton: document.getElementById("printButton")
//         };
//         console.log("Initial DOM check:", {
//             patternName: !!dom.patternName,
//             collectionHeader: !!dom.collectionHeader,
//             collectionThumbnails: !!dom.collectionThumbnails,
//             layerInputsContainer: !!dom.layerInputsContainer,
//             curatedColorsContainer: !!dom.curatedColorsContainer,
//             preview: !!dom.preview,
//             roomMockup: !!dom.roomMockup,
//             coordinatesContainer: !!dom.coordinatesContainer,
//             printButton: !!dom.printButton
//         });

//         // Get collection name from URL parameter 'name'
//         const urlParams = new URLSearchParams(window.location.search);
//         const selectedCollectionName = urlParams.get('name')?.toLowerCase() || 'FARMHOUSE';

//         const collectionsData = await initialize();
//         if (!collectionsData) {
//             console.error("initialize returned undefined");
//             return;
//         }

//         // Start the app with the URL parameter
//         // startApp(collectionsData, selectedCollectionName);
//         await startApp("FARMHOUSE"); // Explicitly start with FARMHOUSE


//         // Add thumbnail click handler (assuming thumbnails are populated elsewhere)
//         document.querySelectorAll(".thumbnail").forEach(thumb => {
//             thumb.addEventListener("click", () => {
//                 const patternId = thumb.dataset.patternId;
//                 console.log("Thumbnail clicked, pattern ID:", patternId);
//                 const pattern = appState.selectedCollection.patterns.find(p => p.id === patternId);
//                 if (pattern) {
//                     const derivedPatternName = pattern.name;
//                     console.log("Selected pattern name:", derivedPatternName);
//                     handlePatternSelection(derivedPatternName);
//                 } else {
//                     console.error("Pattern not found for ID:", patternId);
//                 }
//             });
//         });

//         // Add print button handler
//         dom.printButton.addEventListener("click", () => {
//             console.log("Print button clicked");
//             generatePrintPreview();
//         });

//     } catch (error) {
//         console.error("Error in DOMContentLoaded handler:", error);
//     }
// });

