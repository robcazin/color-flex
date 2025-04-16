// Create a dimensions display element
const dimensionsDisplay = document.createElement('div');
dimensionsDisplay.id = 'dimensions-display';
dimensionsDisplay.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    font-size: 14px;
    font-family: monospace;
    z-index: 1000;
    border-radius: 3px;
`;
document.body.appendChild(dimensionsDisplay);

// Function to update dimensions in the UI
const updateDimensionsDisplay = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    dimensionsDisplay.textContent = `${width} x ${height}px`;
};

updateDimensionsDisplay();

window.addEventListener('resize', updateDimensionsDisplay);

// Optional: Remove later by commenting out or deleting these lines// Toggle flag for normalization (set to false for binary threshold, true for normalization)
const USE_NORMALIZATION = true; // Change to true to enable normalization

// App state
const appState = {
    collections: [],
    colorsData: [],
    currentPattern: null,
    currentLayers: [],
    curatedColors: [],
    layerInputs: [],
    selectedCollection: null,
    cachedLayerPaths: [],
    lastSelectedLayer: null,
    currentScale: 10
};

// DOM references
const dom = {
    patternName: document.getElementById("patternName"),
    collectionHeader: document.getElementById("collectionHeader"),
    collectionThumbnails: document.getElementById("collectionThumbnails"),
    layerInputsContainer: document.getElementById("layerInputsContainer"),
    curatedColorsContainer: document.getElementById("curatedColorsContainer"),
    coordinatesContainer: document.getElementById("coordinatesContainer"),
    preview: document.getElementById("preview"),
    roomMockup: document.getElementById("roomMockup"),
    printButton: document.getElementById("printButton") // Assuming a button exists
};

// Watch changes to patternName
const patternNameElement = document.getElementById("patternName");
Object.defineProperty(dom, 'patternName', {
    get() {
        return patternNameElement;
    },
    set(value) {
        console.log("Setting #patternName to:", value, "Caller:", new Error().stack.split('\n')[2].trim());
        patternNameElement.textContent = value;
    },
    configurable: true
});

dom._patternName = document.getElementById("patternName"); // Initial assignment

// Fetch colors from colors.json
async function loadColors() {
    try {
        const response = await fetch("./data/colors.json");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        appState.colorsData = await response.json();
        console.log("Colors loaded:", appState.colorsData.length);
    } catch (error) {
        console.error("Error loading colors:", error);
    }
}

// Utility Functions

// Reusable listener setup
const setupPrintListener = () => {
    const tryAttachListener = (attempt = 1, maxAttempts = 10) => {
        const printButton = document.getElementById("printButton");
        console.log(`Print listener - Attempt ${attempt} - Looking for printButton: ${printButton ? "Found" : "Not found"}`);

        if (printButton) {
            const newButton = printButton.cloneNode(true);
            printButton.parentNode.replaceChild(newButton, printButton);

            newButton.addEventListener("click", async () => {
                console.log("Print preview triggered");
                const result = await generatePrintPreview();
                if (!result) {
                    console.error("Print preview - Failed to generate output");
                }
            });
            console.log("Print listener attached");
        } else if (attempt < maxAttempts) {
            console.warn(`Print button not found, retrying (${attempt}/${maxAttempts})`);
            setTimeout(() => tryAttachListener(attempt + 1, maxAttempts), 500);
        } else {
            console.error("Print button not found after max attempts");
        }
    };

    console.log("Print listener - Initial DOM state:", document.readyState);
    console.log("Print listener - Pattern preview wrapper:", document.getElementById("patternPreviewWrapper"));

    if (document.readyState === "complete" || document.readyState === "interactive") {
        tryAttachListener();
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            console.log("Print listener - DOMContentLoaded fired");
            tryAttachListener();
        });
    }
};




    const toInitialCaps = (str) =>
        str
            .toLowerCase()
            .replace(/\.\w+$/, '') // Remove file extensions like .jpg, .png, etc.
            .replace(/-\d+x\d+$|-variant$/i, '') // Remove suffixes like -24x24, -variant
            .replace(/_/g, ' ') // Replace underscores with spaces
            .split(/[\s-]+/) // Split on spaces and hyphens
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

        const stripSWNumber = (colorName) => {
        return colorName.replace(/(SW|SC)\d+\s*/, '').trim(); // Removes "SW" followed by digits and optional space
    };

const getContrastClass = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "text-black" : "text-white";
};

// Lookup color from colors.json data
const lookupColor = (colorName) => {
    if (!colorName || typeof colorName !== "string") {
        console.warn(`Invalid colorName: ${colorName}, defaulting to #FFFFFF`);
        return "#FFFFFF";
    }
    const cleanedColorName = colorName.replace(/^(SW|SC)\d+\s*/i, "").toLowerCase().trim();
    console.log(`lookupColor: cleanedColorName=${cleanedColorName}`);
    if (/^#[0-9A-F]{6}$/i.test(cleanedColorName)) {
        console.log(`lookupColor: ${colorName} is a hex value, returning ${cleanedColorName}`);
        return cleanedColorName;
    }
    const colorEntry = appState.colorsData.find(c => c.color_name.toLowerCase() === cleanedColorName);
    if (!colorEntry) {
        console.warn(`Color '${cleanedColorName}' not found in colorsData, defaulting to #FFFFFF`);
        return "#FFFFFF";
    }
    console.log(`Looked up ${colorName} -> #${colorEntry.hex}`);
    return `#${colorEntry.hex}`;
};

// Create a color input UI element
const createColorInput = (label, id, initialColor, isBackground = false) => {
    console.log(`Creating ${label} input, ID: ${id}, initialColor: ${initialColor}`);
    
    const container = document.createElement("div");
    container.className = "layer-input-container";

    const labelEl = document.createElement("div");
    labelEl.className = "layer-label";
    labelEl.textContent = label || "Unknown Layer";

    const colorCircle = document.createElement("div");
    colorCircle.className = "circle-input";
    colorCircle.id = `${id}Circle`;
    const cleanInitialColor = (initialColor || "Snowbound").replace(/^(SW|SC)\d+\s*/i, "").trim();
    const colorValue = lookupColor(cleanInitialColor);
    console.log(`Setting ${label} circle background to: ${colorValue}`);
    colorCircle.style.backgroundColor = colorValue;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "layer-input";
    input.id = id;
    input.placeholder = `Enter ${label ? label.toLowerCase() : 'layer'} color`;
    input.value = toInitialCaps(cleanInitialColor);
    console.log(`Setting ${label} input value to: ${input.value}`);

    container.append(labelEl, colorCircle, input);
    if (dom.layerInputsContainer) {
        dom.layerInputsContainer.appendChild(container);
    } else {
        console.error("layerInputsContainer not found in DOM");
    }

    const layerData = { input, circle: colorCircle, label, isBackground };
    if (!appState.layerInputs.some(li => li.input.id === id)) {
        appState.layerInputs.push(layerData);
    }

    const updateColor = () => {
        console.log(`updateColor called for ${label}, input value: ${input.value}`);
        const formatted = toInitialCaps(input.value.trim());
        if (!formatted) {
            input.value = toInitialCaps(cleanInitialColor);
            colorCircle.style.backgroundColor = colorValue;
            console.log(`${label} input restored to initial color: ${colorValue}`);
        } else {
            const hex = lookupColor(formatted) || "#FFFFFF";
            if (hex === "#FFFFFF" && formatted !== "Snowbound") {
                input.value = toInitialCaps(cleanInitialColor);
                colorCircle.style.backgroundColor = colorValue;
                console.log(`${label} input restored to initial color due to invalid color: ${colorValue}`);
            } else {
                input.value = formatted;
                colorCircle.style.backgroundColor = hex;
                console.log(`${label} input updated to: ${hex}`);
            }
        }

        const layerIndex = appState.currentLayers.findIndex(layer => layer.label === label);
        if (layerIndex !== -1) {
            appState.currentLayers[layerIndex].color = input.value;
            console.log(`Updated appState.currentLayers[${layerIndex}].color to: ${input.value}`);
        }

        updatePreview();
        updateRoomMockup();
        populateCoordinates();
    };

    // Restore original event listeners
    input.addEventListener("blur", updateColor);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") updateColor();
    });

    // Restore original click handler
    console.log(`Attaching click handler to ${label} color circle, ID: ${colorCircle.id}`);
    colorCircle.addEventListener("click", () => {
        appState.lastSelectedLayer = layerData;
        highlightActiveLayer(colorCircle);
        console.log(`Clicked ${label} color circle`);
    });

    return layerData;
};



// Populate curated colors in header
function populateCuratedColors(colors) {
    if (!dom.curatedColorsContainer) {
        console.error("curatedColorsContainer not found in DOM");
        return;
    }
    if (!colors || !colors.length) {
        console.warn("No curated colors provided yet, waiting...");
        return;
    }
    dom.curatedColorsContainer.innerHTML = "";
    colors.forEach(color => {
        const hex = lookupColor(color);
        const circle = document.createElement("div");
        circle.className = "w-20 h-20 rounded-full cursor-pointer relative flex items-center justify-center";
        circle.style.backgroundColor = hex;

        const text = document.createElement("span");
        text.className = `text-xs font-bold text-center ${getContrastClass(hex)} whitespace-pre-line`;
        
        const match = color.match(/^(SW|SC)\s*(\d+)\s+(.+)$/i);
        if (match) {
            const prefix = match[1];
            const number = match[2];
            const colorName = match[3];
            text.textContent = `${prefix}${number}\n${toInitialCaps(colorName)}`;
        } else {
            text.textContent = toInitialCaps(color);
        }
        circle.appendChild(text);

        circle.addEventListener("click", () => {
            const strippedColor = stripSWNumber(color);
            console.log(`Curated color clicked: ${color} -> Stripped: ${strippedColor}`);
            if (appState.lastSelectedLayer) {
                const selectedLayer = appState.lastSelectedLayer;
                selectedLayer.input.value = toInitialCaps(strippedColor);
                selectedLayer.circle.style.backgroundColor = hex;

                // Update appState.currentLayers
                const layerIndex = appState.currentLayers.findIndex(layer => layer.label === selectedLayer.label);
                if (layerIndex !== -1) {
                    appState.currentLayers[layerIndex].color = strippedColor;
                    console.log(`Updated appState.currentLayers[${layerIndex}].color to: ${strippedColor}`);
                }

                updateDisplays();
            } else {
                console.warn("No layer selected; please select a layer to apply the color.");
                // Optionally, you could highlight the first layer or show a UI message
            }
        });

        dom.curatedColorsContainer.appendChild(circle);
    });
    console.log("Curated colors populated:", colors.length);
}

async function initializeApp() {
    console.log("Starting app...");
    await loadColors();

    try {
        const response = await fetch("./data/local-collections.json", { cache: "no-store" });
        if (!response.ok) throw new Error(`Failed to fetch collections: ${response.status}`);
        const data = await response.json();
        
        if (!appState.collections.length) {
            appState.collections = data.collections;
            console.log("Collections loaded:", appState.collections.length);
        }

        const urlParams = new URLSearchParams(window.location.search);
        const collectionName = urlParams.get("collection")?.trim();
        console.log("URL parameter 'collection':", collectionName);

        let selectedCollection = null;
        if (collectionName) {
            selectedCollection = appState.collections.find(c => c.name.trim().toLowerCase() === collectionName.toLowerCase());
        }
        if (!selectedCollection) {
            console.error(`${collectionName || 'No collection'} not found, falling back to first available collection.`);
            selectedCollection = appState.collections[0];
        }

        if (appState.selectedCollection?.name !== selectedCollection.name) {
            appState.selectedCollection = selectedCollection;
            appState.lockedCollection = true;
            console.log("Selected collection:", selectedCollection.name, "Locked:", appState.lockedCollection);
            console.log("Patterns in selected collection:", selectedCollection.patterns);
            appState.curatedColors = appState.selectedCollection.curatedColors || [];
            console.log("Curated colors reset for:", appState.selectedCollection.name, "count:", appState.curatedColors.length, "values:", appState.curatedColors);

            if (dom.collectionHeader) dom.collectionHeader.textContent = `${toInitialCaps(appState.selectedCollection.name)}`;
            if (appState.curatedColors.length) {
                populateCuratedColors(appState.curatedColors);
            } else {
                console.warn("Skipping populateCuratedColors due to empty curatedColors");
            }
            
            const initialPatternId = selectedCollection.patterns[0]?.id;
            console.log("Initial pattern ID:", initialPatternId);
            if (initialPatternId) {
                loadPatternData(initialPatternId);
            } else {
                console.warn("No patterns found for", selectedCollection.name);
            }
            populatePatternThumbnails(appState.selectedCollection.patterns);
            setupPrintListener();
        }
    } catch (error) {
        console.error("Error loading collections:", error);
        if (dom.collectionHeader) dom.collectionHeader.textContent = "Error Loading Collection";
        if (dom.preview) dom.preview.innerHTML = "<p>Error loading data. Please try refreshing.</p>";
    }
}

// Ensure appState has a default
appState._selectedCollection = null;

// Run on initial load and refresh
window.addEventListener('load', () => {
    initializeApp().catch(error => console.error("Initialization failed:", error));
});

window.addEventListener('popstate', () => {
    initializeApp().catch(error => console.error("Refresh initialization failed:", error));
});

// Populate pattern thumbnails in sidebar
function populatePatternThumbnails(patterns) {
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
        // Use name as fallback ID if id is empty
        thumb.dataset.patternId = pattern.id || pattern.name.toLowerCase().replace(/\s+/g, '-');
        thumb.style.width = "120px";
        thumb.style.boxSizing = "border-box";

        const img = document.createElement("img");
        img.src = pattern.thumbnail || "./data/collections/placeholder.jpg";
        img.alt = pattern.displayName;
        img.className = "w-full h-auto";
        img.onerror = () => {
            console.warn(`Failed to load thumbnail for ${pattern.displayName}: ${img.src}`);
            img.src = "./data/collections/placeholder.jpg";
        };
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

    // Update collection header
    if (dom.collectionHeader) {
        dom.collectionHeader.textContent = toInitialCaps(appState.selectedCollection?.name || "Unknown");
        console.log("Updated collectionHeader:", dom.collectionHeader.textContent);
    }
}

// Populate coordinates thumbnails in #coordinatesContainer
const populateCoordinates = () => {
    if (!dom.coordinatesContainer) {
        console.error("coordinatesContainer not found in DOM");
        return;
    }
    dom.coordinatesContainer.innerHTML = "";
    dom.coordinatesContainer.style.position = "relative";
    const coordinates = appState.currentPattern?.coordinates || [];
    console.log("Coordinates data:", coordinates);
    if (!coordinates.length) {
        dom.coordinatesContainer.textContent = "No matching coordinates available.";
        return;
    }
    const numCoordinates = coordinates.length;
    const xStep = 80;
    const yStep = 60;
    const totalXSpan = (numCoordinates - 1) * xStep;
    const totalYSpan = numCoordinates > 1 ? yStep : 0;
    const xStart = -(totalXSpan / 2);
    const yStart = -(totalYSpan / 2.5);
    coordinates.forEach((coord, index) => {
        const div = document.createElement("div");
        div.className = "coordinate-item";
        const xOffset = xStart + (index * xStep);
        const yOffset = yStart + 10 + (index % 2 === 0 ? yStep : 0);
        div.style.setProperty("--x-offset", `${xOffset}px`);
        div.style.setProperty("--y-offset", `${yOffset}px`);
        div.style.left = "50%";
        div.style.top = "50%";
        const img = document.createElement("img");
        img.src = `./data/collections/${coord.collection}/coordinates/${coord.filename}`;
        img.alt = `${coord.pattern || 'Coordinate'} ${index + 1}`;
        img.className = "coordinate-image";
        img.dataset.filename = `./data/collections/${coord.collection}/coordinates/${coord.filename}`;
        img.style.width = "150px";
        img.style.height = "auto";
        img.style.objectFit = "cover";
        img.style.cursor = "pointer";
        img.onerror = () => {
            console.warn(`Failed to load coordinate image: ${img.src}`);
            img.remove();
            if (div.children.length === 0) div.remove();
        };
        div.appendChild(img);
        dom.coordinatesContainer.appendChild(div);
    });
    console.log("Coordinates populated:", coordinates.length);
    setupCoordinateImageHandlers();
};

// Populate the layer inputs UI
function populateLayerInputs(patternId) {
    const pattern = appState.selectedCollection.patterns.find(p => p.id === patternId);
    if (!pattern) {
        console.error(`Pattern ${patternId} not found`);
        return;
    }
    handlePatternSelection(pattern.name);

    // Preserve input values, but only for non-background layers if designer_colors exist
    const previousValues = appState.layerInputs.map(layer => ({
        label: layer.label,
        value: layer.input.value
    }));
    console.log("Preserved input values:", previousValues);

    appState.layerInputs = [];
    if (dom.layerInputsContainer) {
        dom.layerInputsContainer.innerHTML = "";
    } else {
        console.error("layerInputsContainer not found");
        return;
    }

    const hasDesignerColors = pattern.designer_colors && pattern.designer_colors.length > 0;
    console.log("Has designer_colors:", hasDesignerColors, pattern.designer_colors);

    appState.currentLayers.forEach((layer, index) => {
        const id = `layer-${index}`;
        const isBackground = layer.label === "Background";
        const initialColor = layer.color || (isBackground ? "#FFFFFF" : "Snowbound");
        console.log(`Assigning color to ${layer.label} (index ${index}): ${initialColor}`);
        createColorInput(layer.label, id, initialColor, isBackground);

        // Restore previous value only for non-background layers or if no designer_colors
        if (!isBackground || !hasDesignerColors) {
            const previousValue = previousValues.find(pv => pv.label === layer.label)?.value;
            if (previousValue) {
                console.log(`Restoring ${layer.label} input value to: ${previousValue}`);
                appState.layerInputs[index].input.value = previousValue;
                const hex = lookupColor(previousValue) || "#FFFFFF";
                appState.layerInputs[index].circle.style.backgroundColor = hex;
            }
        }
    });

    console.log("Layer inputs populated:", appState.layerInputs.map(l => ({ label: l.label, value: l.input.value })));
}

function handlePatternSelection(patternName) {
    console.log(`handlePatternSelection: pattern=${patternName}, lockedCollection=${appState.lockedCollection}, currentCollection=${appState.selectedCollection?.name}`);
    const pattern = appState.selectedCollection.patterns.find(
        p => p.name.toUpperCase() === patternName.toUpperCase()
    ) || appState.selectedCollection.patterns[0];
    if (!pattern) {
        console.error(`Pattern ${patternName} not found in selected collection`);
        return;
    }
    appState.currentPattern = pattern;
    console.log("Pattern set to:", appState.currentPattern.name);
    console.log("Layer labels available:", appState.currentPattern.layerLabels);
    console.log("Layers available:", JSON.stringify(appState.currentPattern.layers, null, 2));

    const designerColors = appState.currentPattern.designer_colors || [];
    const curatedColors = appState.selectedCollection.curatedColors || [];
    const colorSource = designerColors.length > 0 ? designerColors : curatedColors;
    console.log("Color source:", JSON.stringify(colorSource, null, 2));

    appState.currentLayers = [];
    let colorIndex = 0;

    const isWallPanel = appState.selectedCollection?.name === "wall-panels";
    const isWall = pattern.isWall || isWallPanel;

    if (isWall) {
        const wallColor = colorSource[colorIndex] || "#FFFFFF";
        appState.currentLayers.push({ imageUrl: null, color: wallColor, label: "Wall Color" });
        colorIndex++;
    }

    const backgroundColor = colorSource[colorIndex] || "#FFFFFF";
    appState.currentLayers.push({ imageUrl: null, color: backgroundColor, label: "Background" });
    colorIndex++;

    if (!appState.currentPattern.tintWhite) {
        const overlayLayers = pattern.layers || [];
        console.log(`Processing ${overlayLayers.length} overlay layers`);
        overlayLayers.forEach((layer, index) => {
            const layerPath = layer.path || "";
            const label = pattern.layerLabels[index] || `Layer ${index + 1}`;
            const isShadow = label.toUpperCase().includes("SHADOW") || 
                             layerPath.toUpperCase().includes("ISSHADOW");
            if (!isShadow) {
                const layerColor = colorSource[colorIndex] || "#000000";
                appState.currentLayers.push({
                    imageUrl: layerPath,
                    color: layerColor,
                    label: label
                });
                console.log(`Assigned color to ${label}: ${layerColor}`);
                colorIndex++;
            }
        });
        console.log("Final appState.currentLayers:", JSON.stringify(appState.currentLayers, null, 2));
    }
}

function applyColorsToLayerInputs(currentColors, curatedColors) {
    const newLayerInputs = appState.layerInputs;
    const curatedColorsCopy = [...curatedColors]; // Create a copy to avoid mutating the original

    newLayerInputs.forEach((layer, index) => {
        let color;
        if (index < currentColors.length) {
            // Use the existing color from the previous layer inputs
            color = currentColors[index];
        } else {
            // Use the next available curated color
            color = curatedColorsCopy.shift() || "Snowbound"; // Fallback to "Snowbound" if no curated colors left
            color = color.replace(/^(SW|SC)\d+\s*/i, ""); // Strip SW/SC number
        }

        layer.input.value = toInitialCaps(color);
        const hex = lookupColor(color) || "#FFFFFF";
        layer.circle.style.backgroundColor = hex;
        console.log(`Applied color to ${layer.label}: ${color} (${hex})`);

        // Update appState.currentLayers
        const layerIndex = appState.currentLayers.findIndex(l => l.label === layer.label);
        if (layerIndex !== -1) {
            appState.currentLayers[layerIndex].color = color;
            console.log(`Updated appState.currentLayers[${layerIndex}].color to: ${color}`);
        }
    });

    // Update the preview and mockup
    updatePreview();
    updateRoomMockup();
    populateCoordinates();
}


// Highlight active layer
const highlightActiveLayer = (circle) => {
    document.querySelectorAll(".circle-input").forEach((c) => (c.style.outline = "none"));
    circle.style.outline = "6px solid rgb(244, 255, 219)";
};


// Process image with color tinting (toggleable normalization)
const processImage = (url, callback, layerColor = '#7f817e', gamma = 2.2, isShadow = false, isWallPanel = false, isWall = false) => {
    console.log(`Processing image ${url} with color ${layerColor}, Normalization: ${USE_NORMALIZATION}, IsShadow: ${isShadow}, IsWallPanel: ${isWallPanel}, IsWall: ${isWall}`);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = `${url}?t=${new Date().getTime()}`;

    img.onload = () => {
        console.log("Image loaded successfully:", url);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const width = img.width;
        const height = img.height;
        canvas.width = width;
        canvas.height = height;

        if (isWall && (!url || url === "")) {
            ctx.fillStyle = layerColor;
            ctx.fillRect(0, 0, width, height);
            console.log("Applied solid wall color:", layerColor);
            callback(canvas.toDataURL("image/png", 1.0));
            return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        console.log("Original Sample (R,G,B,A):", data[0], data[1], data[2], data[3]);

        let rLayer, gLayer, bLayer;
        if (layerColor && !isShadow) {
            const hex = layerColor.replace("#", "");
            rLayer = parseInt(hex.substring(0, 2), 16);
            gLayer = parseInt(hex.substring(2, 4), 16);
            bLayer = parseInt(hex.substring(4, 6), 16);
            console.log(`Layer color parsed: R=${rLayer}, G=${gLayer}, B=${bLayer}`);
        } else if (isShadow) {
            console.log("Shadow layer: Skipping color parsing");
        }

        if (isWallPanel && layerColor && !isShadow) {
            const isDesignLayer = url.toLowerCase().includes("design");
            const isBackLayer = url.toLowerCase().includes("back");
            const layerType = isDesignLayer ? "Design" : isBackLayer ? "Back" : "Other";
            let designPixelCount = 0; // Non-white pixels (design details)
            let transparentPixelCount = 0; // White pixels (to be transparent)

            // Apply inversion to all non-shadow layers in wall panels
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                const isNearWhite = r > 240 && g > 240 && b > 240 && a > 0;

                if (!isNearWhite) {
                    // Non-white areas (design details): Apply the layer's chosen color and make fully opaque
                    data[i] = rLayer;
                    data[i + 1] = gLayer;
                    data[i + 2] = bLayer;
                    data[i + 3] = 255; // Fully opaque
                    designPixelCount++;
                } else {
                    // White areas: Fully transparent to reveal background
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                    data[i + 3] = 0;
                    transparentPixelCount++;
                }
            }

            console.log(`Processed ${layerType} layer: Design pixels=${designPixelCount}, Transparent pixels=${transparentPixelCount}`);
        } else if (isShadow) {
            for (let i = 0; i < data.length; i += 4) {
                const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const alpha = 1 - (luminance / 255);
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = Math.round(alpha * 255);
            }
        } else if (layerColor && USE_NORMALIZATION) {
            let minLuminance = 255, maxLuminance = 0;
            for (let i = 0; i < data.length; i += 4) {
                const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                minLuminance = Math.min(minLuminance, luminance);
                maxLuminance = Math.max(maxLuminance, luminance);
            }
            const range = maxLuminance - minLuminance || 1;
            console.log("Min Luminance:", minLuminance, "Max Luminance:", maxLuminance);

            for (let i = 0; i < data.length; i += 4) {
                const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                let normalized = (luminance - minLuminance) / range;
                normalized = Math.max(0, Math.min(1, normalized));
                let alpha = 1 - normalized;
                alpha = alpha > 0.5 ? 1 : alpha * 2;

                if (alpha > 0) {
                    data[i] = rLayer;
                    data[i + 1] = gLayer;
                    data[i + 2] = bLayer;
                } else {
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                }
                data[i + 3] = Math.round(alpha * 255);
            }
        } else if (layerColor) {
            for (let i = 0; i < data.length; i += 4) {
                const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const threshold = 128;
                const alpha = luminance < threshold ? 1 : 0;

                if (alpha === 1) {
                    data[i] = rLayer;
                    data[i + 1] = gLayer;
                    data[i + 2] = bLayer;
                } else {
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                }
                data[i + 3] = Math.round(alpha * 255);
            }
        }

        console.log("Processed Sample (R,G,B,A):", data[0], data[1], data[2], data[3]);
        ctx.putImageData(imageData, 0, 0);
        callback(canvas.toDataURL("image/png", 1.0));
    };

    img.onerror = () => console.error(`Canvas image load failed: ${url}`);
};

// Load pattern data from JSON
function loadPatternData(patternId) {
    console.log(`loadPatternData: patternId=${patternId}`);
    const pattern = appState.collections
        .flatMap(c => c.patterns)
        .find(p => p.id === patternId);
    if (pattern) {
        console.log("Found pattern:", pattern);
        appState.currentPattern = pattern;
        console.log(">>> Updated appState.currentPattern:", JSON.stringify(pattern, null, 2));
        appState.curatedColors = appState.selectedCollection.curatedColors || [];
        console.log(">>> Updated appState.curatedColors:", appState.curatedColors);
        populateLayerInputs(patternId);
        populateCuratedColors(appState.curatedColors); // Ensure this is called
        updatePreview();
        updateRoomMockup();
        populatePatternThumbnails(appState.selectedCollection.patterns);
        populateCoordinates();
    } else {
        console.error(">>> Pattern not found:", patternId);
    }
}

    // Ensure updatePreview is defined before updateDisplays uses it
    // Replace updatePreview in CF8.3.js (line ~700, adjust as needed)
// Replace updatePreview in CF8.3.js (line ~700, adjust as needed)
// Replace updatePreview in CF8.3.js (line ~700, adjust as needed)
const updatePreview = () => {
    if (!dom.preview) {
        console.error("preview not found in DOM");
        return;
    }

    if (!appState.currentPattern) {
        console.error("No current pattern selected");
        return;
    }

    // Reset layerInputs to match designer_colors
    const isWall = appState.currentPattern?.isWall || appState.selectedCollection?.name === "wall-panels";
    const backgroundIndex = isWall ? 1 : 0;
    const designerColors = appState.currentPattern?.designer_colors || ["Snowbound"];
    const expectedInputCount = (isWall ? 2 : 1) + appState.currentPattern.layers.length;

    // Always reset layerInputs to avoid stale values
    console.log(`Resetting layerInputs: expected ${expectedInputCount}, was ${appState.layerInputs?.length || 0}`);
    appState.layerInputs = [];
    appState.layerInputs.push({ input: { value: designerColors[0] || "Snowbound" } });
    if (isWall) {
        appState.layerInputs.push({ input: { value: "Snowbound" } }); // Shadow color
    }
    for (let i = 1; i < appState.currentPattern.layers.length + 1; i++) {
        appState.layerInputs.push({ input: { value: designerColors[i] || "Snowbound" } });
    }

    const backgroundInput = appState.layerInputs[backgroundIndex]?.input;
    if (!backgroundInput) {
        console.error(`Background input not found at index ${backgroundIndex}`, appState.layerInputs);
        return;
    }

    const backgroundColor = lookupColor(backgroundInput.value);
    console.log("Updating preview - Background color:", backgroundColor, "isWall:", isWall);
    console.log("Updating preview - Layer inputs:", appState.layerInputs.map((li, i) => ({
        index: i,
        value: li?.input?.value || "undefined"
    })));
    console.log("Updating preview - Designer colors:", designerColors);

    const previewCanvas = document.createElement("canvas");
    const previewCtx = previewCanvas.getContext("2d", { willReadFrequently: true });
    previewCanvas.width = 700;
    previewCanvas.height = 700;

    const patternWidthInches = appState.currentPattern?.size?.[0] || 24;
    const patternHeightInches = appState.currentPattern?.size?.[1] || 24;
    const aspectRatio = patternHeightInches / patternWidthInches;
    const scaleFactor = Math.min(700 / patternWidthInches, 700 / patternHeightInches);
    const drawWidth = Math.round(patternWidthInches * scaleFactor);
    const drawHeight = Math.round(patternHeightInches * scaleFactor);
    const offsetX = Math.round((700 - drawWidth) / 2);
    const offsetY = Math.round((700 - drawHeight) / 2);

    console.log(`Pattern: ${patternWidthInches}x${patternHeightInches}, Aspect: ${aspectRatio}`);
    console.log(`Canvas: ${previewCanvas.width}x${previewCanvas.height}`);
    console.log(`Drawing: ${drawWidth}x${drawHeight}, Offset: ${offsetX}x${offsetY}, Scale: ${scaleFactor}`);

    const processPreview = async () => {
        previewCtx.fillStyle = backgroundColor;
        previewCtx.fillRect(offsetX, offsetY, drawWidth, drawHeight);
        console.log("Filled background with:", backgroundColor);

        const isTintWhite = appState.currentPattern?.tintWhite || false;
        console.log(`tintWhite flag: ${isTintWhite}`);

        if (isTintWhite && appState.currentPattern?.baseComposite) {
            console.log(`Processing tintWhite with baseComposite: ${appState.currentPattern.baseComposite}`);
            const baseImage = new Image();
            baseImage.src = appState.currentPattern.baseComposite.replace('./', './');
            await new Promise((resolve) => {
                baseImage.onload = () => {
                    console.log(`Base image loaded: ${baseImage.src}, Natural: ${baseImage.naturalWidth}x${baseImage.naturalHeight}`);
                    const imageAspect = baseImage.naturalHeight / baseImage.naturalWidth;
                    console.log(`Base image aspect: ${imageAspect}, Expected: ${aspectRatio}`);

                    if (Math.abs(imageAspect - aspectRatio) > 0.01) {
                        console.warn(`Base image aspect mismatch, using pattern proportions`);
                    }

                    previewCtx.drawImage(baseImage, offsetX, offsetY, drawWidth, drawHeight);

                    const tintCanvas = (ctx, x, y, width, height) => {
                        const imageData = ctx.getImageData(x, y, width, height);
                        const data = imageData.data;
                        let whitePixels = 0;
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const a = data[i + 3];
                            if (r > 220 && g > 220 && b > 220 && a > 0) {
                                whitePixels++;
                                const hex = backgroundColor.replace("#", "");
                                data[i] = parseInt(hex.substring(0, 2), 16);
                                data[i + 1] = parseInt(hex.substring(2, 4), 16);
                                data[i + 2] = parseInt(hex.substring(4, 6), 16);
                            }
                        }
                        ctx.putImageData(imageData, x, y);
                        console.log(`Tinted ${whitePixels} white pixels with ${backgroundColor}`);
                        return whitePixels;
                    };
                    const whitePixels = tintCanvas(previewCtx, offsetX, offsetY, drawWidth, drawHeight);
                    if (whitePixels === 0) {
                        console.warn("No white pixels found to tint; image may be incorrect");
                    }

                    const imageData = previewCtx.getImageData(offsetX + drawWidth / 2, offsetY + drawHeight / 2, 1, 1).data;
                    console.log(`Sample pixel after tint: R=${imageData[0]}, G=${imageData[1]}, B=${imageData[2]}, A=${imageData[3]}`);

                    resolve();
                };
                baseImage.onerror = () => {
                    console.error(`Failed to load base image: ${baseImage.src}`);
                    resolve();
                };
            });
        } else if (appState.currentPattern?.layers?.length) {
            console.log(`Layers:`, appState.currentPattern.layers.map((l, i) => ({
                index: i,
                label: appState.currentPattern.layerLabels?.[i] || `Layer ${i + 1}`,
                path: l.path
            })));

            // Separate shadow and non-shadow layers
            const shadowLayers = [];
            const nonShadowLayers = [];
            appState.currentPattern.layers.forEach((layer, index) => {
                const label = appState.currentPattern.layerLabels?.[index] || `Layer ${index + 1}`;
                const isShadow = label.toUpperCase().includes("SHADOW") || 
                                 (layer.path.toUpperCase().includes("ISSHADOW") && !layer.path.toUpperCase().includes("FLOWER"));
                (isShadow ? shadowLayers : nonShadowLayers).push({ layer, index, label });
            });

            console.log(`Shadow layers:`, shadowLayers.map(l => l.label));
            console.log(`Non-shadow layers:`, nonShadowLayers.map(l => l.label));

            let nonShadowInputIndex = isWall ? 2 : 1;

            // Draw shadow layers first
            for (const { layer, index, label } of shadowLayers) {
                const layerPath = layer.path || "";
                console.log(`Drawing shadow layer ${index}: ${label}, Path: ${layerPath}`);

                await new Promise((resolve) => {
                    processImage(
                        layerPath,
                        (processedUrl) => {
                            const img = new Image();
                            img.src = processedUrl;
                            img.onload = () => {
                                console.log(`Image: ${label}, URL: ${processedUrl}, Natural: ${img.naturalWidth}x${img.naturalHeight}`);
                                const imageAspect = img.naturalHeight / img.naturalWidth;
                                console.log(`Image aspect: ${imageAspect}, Expected: ${aspectRatio}`);

                                if (Math.abs(imageAspect - aspectRatio) > 0.01) {
                                    console.warn(`Image aspect mismatch for ${label}, using pattern proportions`);
                                }

                                previewCtx.globalCompositeOperation = "multiply";
                                previewCtx.globalAlpha = 0.3;
                                previewCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

                                const center = previewCtx.getImageData(offsetX + drawWidth / 2, offsetY + drawHeight / 2, 1, 1).data;
                                console.log(`Sample pixel for ${label}: R=${center[0]}, G=${center[1]}, B=${center[2]}, A=${center[3]}`);

                                resolve();
                            };
                            img.onerror = () => {
                                console.error(`Failed to load image: ${processedUrl}`);
                                resolve();
                            };
                        },
                        null,
                        2.2,
                        true,
                        isWall
                    );
                });
            }

            // Draw non-shadow layers
            for (const { layer, index, label } of nonShadowLayers) {
                const layerPath = layer.path || "";
                const layerInput = appState.layerInputs[nonShadowInputIndex];
                const layerColor = lookupColor(layerInput?.input?.value || "Snowbound");
                console.log(`Drawing non-shadow layer ${index}: ${label}, Path: ${layerPath}, Color: ${layerColor}, Input index: ${nonShadowInputIndex}, Input value: ${layerInput?.input?.value || "undefined"}`);

                if (!layerInput?.input?.value) {
                    console.warn(`No input value for layer ${label} at index ${nonShadowInputIndex}; using default`);
                }

                await new Promise((resolve) => {
                    processImage(
                        layerPath,
                        (processedUrl) => {
                            const img = new Image();
                            img.src = processedUrl;
                            img.onload = () => {
                                console.log(`Image: ${label}, URL: ${processedUrl}, Natural: ${img.naturalWidth}x${img.naturalHeight}`);
                                const imageAspect = img.naturalHeight / img.naturalWidth;
                                console.log(`Image aspect: ${imageAspect}, Expected: ${aspectRatio}`);

                                if (Math.abs(imageAspect - aspectRatio) > 0.01) {
                                    console.warn(`Image aspect mismatch for ${label}, using pattern proportions`);
                                }

                                previewCtx.globalCompositeOperation = "source-over";
                                previewCtx.globalAlpha = 1.0;
                                previewCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

                                const center = previewCtx.getImageData(offsetX + drawWidth / 2, offsetY + drawHeight / 2, 1, 1).data;
                                const topLeft = previewCtx.getImageData(offsetX + drawWidth / 4, offsetY + drawHeight / 4, 1, 1).data;
                                const bottomRight = previewCtx.getImageData(offsetX + 3 * drawWidth / 4, offsetY + 3 * drawHeight / 4, 1, 1).data;
                                console.log(`Sample pixels for ${label}:`);
                                console.log(`  Center: R=${center[0]}, G=${center[1]}, B=${center[2]}, A=${center[3]}`);
                                console.log(`  Top-left: R=${topLeft[0]}, G=${topLeft[1]}, B=${topLeft[2]}, A=${topLeft[3]}`);
                                console.log(`  Bottom-right: R=${bottomRight[0]}, G=${bottomRight[1]}, B=${bottomRight[2]}, A=${bottomRight[3]}`);

                                nonShadowInputIndex++;
                                resolve();
                            };
                            img.onerror = () => {
                                console.error(`Failed to load image: ${processedUrl}`);
                                resolve();
                            };
                        },
                        layerColor,
                        2.2,
                        false,
                        isWall
                    );
                });
            }
        } else {
            console.warn("No layers or baseComposite for pattern:", appState.currentPattern?.name);
        }

        dom.preview.innerHTML = "";
        dom.preview.appendChild(previewCanvas);
        dom.preview.style.width = "700px";
        dom.preview.style.height = "700px";
        dom.preview.style.backgroundColor = "rgba(17, 24, 39, 1)";
        dom.preview.style.overflow = "hidden";
        dom.preview.style.transform = "none";
        dom.preview.style.boxSizing = "border-box";
        dom.preview.style.padding = "0";
        dom.preview.style.margin = "0";
        dom.preview.className = "w-[700px] h-[700px] overflow-hidden relative z-0 flex-shrink-0";

        console.log(`DOM preview computed: width=${dom.preview.offsetWidth}, height=${dom.preview.offsetHeight}`);
        console.log(`Canvas style: width=${previewCanvas.style.width}, height=${previewCanvas.style.height}`);
        console.log(`Parent styles: width=${dom.preview.parentElement?.offsetWidth}, height=${dom.preview.parentElement?.offsetHeight}`);

        if (appState.currentPattern?.name) {
            dom.patternName.textContent = toInitialCaps(appState.currentPattern.name);
        }
    };

    processPreview().catch(error => {
        console.error("Preview error:", error);
        dom.preview.innerHTML = "";
        dom.preview.appendChild(previewCanvas);
    });
};
    

    const updateRoomMockup = () => {
        console.log(">>> Entered updateRoomMockup function");
    
        if (!dom.roomMockup) {
            console.error("roomMockup element not found in DOM");
            return;
        }
    
        const wallColorInput = appState.layerInputs[0]?.input;
        if (!wallColorInput) {
            console.error("Wall Color input not found");
            return;
        }
        const wallColor = lookupColor(wallColorInput.value);
        console.log(">>> Updating room mockup with wallColor from input:", wallColorInput.value, "converted to:", wallColor);
    
        const isWall = appState.currentPattern?.isWall || appState.selectedCollection?.name === "wall-panels";
        const backgroundIndex = isWall ? 1 : 0;
        const backgroundInput = appState.layerInputs[backgroundIndex]?.input;
        const backgroundColor = backgroundInput ? lookupColor(backgroundInput.value) : "#FFFFFF";
        console.log(">>> Background color for rectangles:", backgroundInput?.value, "converted to:", backgroundColor);
    
        const UI_WIDTH_DEFAULT = 600;
        const UI_HEIGHT_DEFAULT = 450;
    
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = UI_WIDTH_DEFAULT;
        canvas.height = UI_HEIGHT_DEFAULT;
    
        const renderCanvas = () => {
            dom.roomMockup.className = `w-[${UI_WIDTH_DEFAULT}px] max-w-[${UI_WIDTH_DEFAULT}px] h-[${UI_HEIGHT_DEFAULT}px] relative flex-shrink-0 ml-20 grid-update`;
            dom.roomMockup.style.cssText = "width: 600px; height: 450px; position: relative; background: none;";
            dom.roomMockup.innerHTML = "";
    
            try {
                const dataUrl = canvas.toDataURL("image/png");
                console.log(">>> Canvas Data URL length:", dataUrl.length);
                const img = document.createElement("img");
                img.src = dataUrl;
                img.style.cssText = "width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; display: block;";
                img.onload = () => console.log(">>> Room mockup image final load SUCCESSFUL");
                img.onerror = (err) => console.error(">>> Failed to load final room mockup image from Data URL", err);
                dom.roomMockup.appendChild(img);
            } catch (e) {
                console.error(">>> Error during canvas.toDataURL() or image creation:", e);
            }
        };
    
        const scaleToFit = (img, targetWidth, targetHeight) => {
            const aspectRatio = img.width / img.height;
            let drawWidth = targetWidth;
            let drawHeight = targetHeight;
            if (aspectRatio > targetWidth / targetHeight) {
                drawHeight = drawWidth / aspectRatio;
            } else {
                drawWidth = drawHeight * aspectRatio;
            }
            const x = (targetWidth - drawWidth) / 2;
            const y = (targetHeight - drawHeight) / 2;
            return { width: drawWidth, height: drawHeight, x, y };
        };
    
        const processOverlay = async () => {
            console.log(">>> Starting processOverlay");
            console.log(">>> Current pattern:", JSON.stringify(appState.currentPattern, null, 2));
    
            ctx.fillStyle = wallColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            console.log(">>> Wall Color filled with:", wallColor);
    
            const isWallPanel = appState.selectedCollection?.name === "wall-panels";
            if (isWallPanel && appState.currentPattern?.layers?.length) {
                const panelWidthInches = appState.currentPattern.size[0] || 24;
                const panelHeightInches = appState.currentPattern.size[1] || 36;
    
                const mockupWidthInches = appState.selectedCollection?.mockupWidthInches || 100;
                const mockupHeightInches = appState.selectedCollection?.mockupHeightInches || 80;
                console.log(`>>> Mockup dimensions: ${mockupWidthInches}x${mockupHeightInches} inches`);
    
                const scale = Math.min(canvas.width / mockupWidthInches, canvas.height / mockupHeightInches);
                const panelWidth = panelWidthInches * scale;
                const panelHeight = panelHeightInches * scale;
                console.log(`>>> Panel dimensions: ${panelWidth}x${panelHeight} pixels (scale: ${scale})`);
    
                const layout = appState.currentPattern.layout || "3,20";
                const [numPanelsStr, spacingStr] = layout.split(",");
                const numPanels = parseInt(numPanelsStr, 10) || 3;
                const spacing = parseInt(spacingStr, 10) || 20;
                console.log(`>>> Wall panel layout: ${numPanels} panels, ${spacing}px spacing`);
    
                const totalWidth = (numPanels * panelWidth) + ((numPanels - 1) * spacing);
                const startX = (canvas.width - totalWidth) / 2;
    
                const verticalOffset = appState.currentPattern?.verticalOffset || 50;
                const startY = (canvas.height - panelHeight) / 2 - verticalOffset;
                console.log(`>>> Adjusted startY: ${startY} (original center: ${(canvas.height - panelHeight) / 2}, offset: ${verticalOffset})`);
    
                const panelCanvas = document.createElement("canvas");
                panelCanvas.width = panelWidth;
                panelCanvas.height = panelHeight;
                const panelCtx = panelCanvas.getContext("2d");
    
                let nonShadowInputIndex = 2;
                for (let index = 0; index < appState.currentPattern.layers.length; index++) {
                    const layer = appState.currentPattern.layers[index];
                    const layerPath = layer.path || "";
                    const label = appState.currentPattern.layerLabels?.[index] || `Layer ${index + 1}`;
                    const isShadow = (label && label.toUpperCase().includes("SHADOW")) || 
                                     (layerPath && (layerPath.toUpperCase().includes("ISSHADOW"))) || 
                                     false;
                    const layerColor = isShadow ? null : lookupColor(appState.layerInputs[nonShadowInputIndex]?.input?.value || "Snowbound");
                    console.log(`Processing layer ${index + 1}: Label=${label}, Path=${layerPath}, Color=${layerColor}, Index=${nonShadowInputIndex}, IsShadow=${isShadow}`);
    
                    await new Promise((resolve) => {
                        processImage(layerPath, (processedUrl) => {
                            const img = new Image();
                            img.src = processedUrl;
                            img.onload = () => {
                                panelCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
                                panelCtx.globalAlpha = isShadow ? 0.3 : 1.0;
                                panelCtx.drawImage(img, 0, 0, panelWidth, panelHeight);
                                if (!isShadow) nonShadowInputIndex++;
                                resolve();
                            };
                            img.onerror = () => {
                                console.error(`>>> Failed to load layer image: ${processedUrl}`);
                                resolve();
                            };
                        }, layerColor, 2.2, isShadow, isWallPanel);
                    });
                }
    
                for (let i = 0; i < numPanels; i++) {
                    const x = startX + (i * (panelWidth + spacing));
                    
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(x, startY, panelWidth, panelHeight);
                    console.log(`>>> Drew Background color rectangle for panel ${i + 1} at (${x}, ${startY}), size: ${panelWidth}x${panelHeight}`);
    
                    ctx.drawImage(panelCanvas, x, startY, panelWidth, panelHeight);
                    console.log(`>>> Panel ${i + 1} drawn at (${x}, ${startY}), size: ${panelWidth}x${panelHeight}`);
                    if (i < numPanels - 1) {
                        const nextX = startX + ((i + 1) * (panelWidth + spacing));
                        console.log(`>>> Spacing between panel ${i + 1} and ${i + 2}: ${nextX - (x + panelWidth)}px (expected: ${spacing}px)`);
                    }
                }
            } else {
                const patternCanvas = document.createElement("canvas");
                patternCanvas.width = canvas.width;
                patternCanvas.height = canvas.height;
                const patternCtx = patternCanvas.getContext("2d");
    
                const tilingType = appState.currentPattern?.tilingType || "straight";
                const isHalfDrop = tilingType === "half-drop";
                const scale = appState.currentScale / 100 || 1;
    
                const isTintWhite = appState.currentPattern?.tintWhite;
                if (isTintWhite && (appState.currentPattern?.baseComposite || appState.currentPattern?.layers?.length)) {
                    const imageSrc = appState.currentPattern?.baseComposite || appState.currentPattern?.layers[0]?.path;
                    if (!imageSrc) {
                        console.error(">>> No valid tintWhite image source");
                        renderCanvas();
                        return;
                    }
                    const baseImage = new Image();
                    baseImage.src = imageSrc.replace('./', './');
                    await new Promise((resolve) => {
                        baseImage.onload = () => {
                            const layerTileWidth = baseImage.width * scale;
                            const layerTileHeight = baseImage.height * scale;
                            const offsetY = isHalfDrop ? layerTileHeight / 2 : 0;
                            const startY = -layerTileHeight;
                            for (let x = -layerTileWidth; x < canvas.width + layerTileWidth; x += layerTileWidth) {
                                const isOddColumn = Math.floor(x / layerTileWidth) % 2 !== 0;
                                const yOffset = isOddColumn && isHalfDrop ? offsetY : 0;
                                for (let y = startY + yOffset; y < canvas.height + layerTileHeight; y += layerTileHeight) {
                                    patternCtx.drawImage(baseImage, x, y, layerTileWidth, layerTileHeight);
                                }
                            }
                            const imageData = patternCtx.getImageData(0, 0, canvas.width, canvas.height);
                            const data = imageData.data;
                            for (let i = 0; i < data.length; i += 4) {
                                const r = data[i];
                                const g = data[i + 1];
                                const b = data[i + 2];
                                const a = data[i + 3];
                                if (r > 240 && g > 240 && b > 240 && a > 0) {
                                    const hex = wallColor.replace("#", "");
                                    data[i] = parseInt(hex.substring(0, 2), 16);
                                    data[i + 1] = parseInt(hex.substring(2, 4), 16);
                                    data[i + 2] = parseInt(hex.substring(4, 6), 16);
                                }
                            }
                            patternCtx.putImageData(imageData, 0, 0);
                            ctx.drawImage(patternCanvas, 0, 0);
                            resolve();
                        };
                        baseImage.onerror = () => resolve();
                    });
                } else if (appState.currentPattern?.layers?.length) {
                    let nonShadowInputIndex = 1;
                    for (let index = 0; index < appState.currentPattern.layers.length; index++) {
                        const layer = appState.currentPattern.layers[index];
                        const layerPath = layer.path;
                        const label = appState.currentPattern.layerLabels?.[index] || `Layer ${index + 1}`;
                        const isShadow = label.toUpperCase().includes("SHADOW") || 
                                         (layerPath && (layerPath.toUpperCase().includes("ISSHADOW")));
                        const layerColor = isShadow ? null : lookupColor(appState.layerInputs[nonShadowInputIndex]?.input?.value || "Snowbound");
                        console.log(`Processing layer ${index + 1}: Label=${label}, Path=${layerPath}, Color=${layerColor}, Index=${nonShadowInputIndex}, IsShadow=${isShadow}`);
                        await new Promise((resolve) => {
                            processImage(layerPath, (processedUrl) => {
                                const img = new Image();
                                img.src = processedUrl;
                                img.onload = () => {
                                    const layerTileWidth = img.width * scale;
                                    const layerTileHeight = img.height * scale;
                                    const offsetY = isHalfDrop ? layerTileHeight / 2 : 0;
                                    const startY = -layerTileHeight;
                                    patternCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
                                    patternCtx.globalAlpha = isShadow ? 0.3 : 1.0;
                                    for (let x = -layerTileWidth; x < canvas.width + layerTileWidth; x += layerTileWidth) {
                                        const isOddColumn = Math.floor(x / layerTileWidth) % 2 !== 0;
                                        const yOffset = isOddColumn && isHalfDrop ? offsetY : 0;
                                        for (let y = startY + yOffset; y < canvas.height + layerTileHeight; y += layerTileHeight) {
                                            patternCtx.drawImage(img, x, y, layerTileWidth, layerTileHeight);
                                        }
                                    }
                                    if (!isShadow) nonShadowInputIndex++;
                                    resolve();
                                };
                                img.onerror = () => resolve();
                            }, layerColor, 2.2, isShadow);
                        });
                    }
                    ctx.drawImage(patternCanvas, 0, 0);
                }
            }
    
            const mockupImage = new Image();
            let mockupNeeded = appState.selectedCollection?.mockup;
            if (mockupNeeded) {
                mockupImage.src = appState.selectedCollection.mockup;
                console.log(">>> Loading mockup image:", mockupImage.src);
                await new Promise((resolve) => {
                    mockupImage.onload = () => {
                        console.log(`>>> Mockup loaded: ${mockupImage.naturalWidth}x${mockupImage.naturalHeight}`);
                        const fit = scaleToFit(mockupImage, UI_WIDTH_DEFAULT, UI_HEIGHT_DEFAULT);
                        ctx.drawImage(mockupImage, fit.x, fit.y, fit.width, fit.height);
                        console.log(">>> Mockup drawn at:", fit);
                        resolve();
                    };
                    mockupImage.onerror = () => {
                        console.error(">>> Failed to load mockup image:", mockupImage.src);
                        resolve();
                    };
                });
            }
    
            if (appState.selectedCollection?.mockupShadow) {
                const shadowOverlay = new Image();
                shadowOverlay.src = appState.selectedCollection.mockupShadow;
                console.log(">>> Loading shadow overlay:", shadowOverlay.src);
                await new Promise((resolve) => {
                    shadowOverlay.onload = () => {
                        console.log(">>> Applying shadow overlay");
                        ctx.globalCompositeOperation = "multiply";
                        const fit = scaleToFit(shadowOverlay, UI_WIDTH_DEFAULT, UI_HEIGHT_DEFAULT);
                        ctx.drawImage(shadowOverlay, fit.x, fit.y, fit.width, fit.height);
                        ctx.globalCompositeOperation = "source-over";
                        console.log(">>> Shadow drawn at:", fit);
                        resolve();
                    };
                    shadowOverlay.onerror = () => {
                        console.error(">>> Failed to load shadow overlay:", shadowOverlay.src);
                        resolve();
                    };
                });
            }
    
            console.log(">>> Finalizing canvas");
            renderCanvas();
    
            if (appState.currentPattern?.name) {
                dom.patternName.textContent = toInitialCaps(appState.currentPattern.name);
                console.log("Updated #patternName to:", dom.patternName.textContent);
            }
            setupPrintListener();
        };
    
        processOverlay().catch(error => {
            console.error("Error processing room mockup:", error);
            renderCanvas();
            if (appState.currentPattern?.name) {
                dom.patternName.textContent = toInitialCaps(appState.currentPattern.name);
            }
        });
    };
    
    function parseCoordinateFilename(filename) {
        const parts = filename.split('/');
        const filePart = parts[5]; // "BOMBAY-KITANELLI-VINE.jpg"
        const collectionName = 'coordinates';
        const patternPart = filePart
            .replace(/^BOMBAY-/, '') // Remove "BOMBAY-"
            .replace(/\.jpg$/i, ''); // Remove ".jpg"
        const patternName = patternPart
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        // No mapping needed to match JSON
        const normalizedPatternName = patternName;
        console.log(`Parsed filename: ${filename} → collection: ${collectionName}, pattern: ${normalizedPatternName}`);
        return { collectionName, patternName: normalizedPatternName };
    }

    function loadPatternFromLocalCollections(collectionName, patternName) {
        try {
            if (!appState.collections || !appState.collections.length) {
                console.error("appState.collections is empty or not initialized");
                return null;
            }
            const collection = appState.collections.find(
                c => c.name.toLowerCase() === "coordinates"
            );
            if (!collection) {
                console.error("Coordinates collection not found in appState.collections");
                return null;
            }
            const pattern = collection.patterns.find(
                p => p.name.toLowerCase() === patternName.toLowerCase()
            );
            if (!pattern) {
                console.error(`Pattern ${patternName} not found in coordinates collection`);
                return null;
            }
            console.log(`Loaded pattern: ${pattern.name} from coordinates collection`);
            return { collection, pattern };
        } catch (error) {
            console.error(`Error accessing collections: ${error.message}`);
            return null;
        }
    }

    function setupCoordinateImageHandlers() {
        const coordinateImages = document.querySelectorAll(".coordinate-image");
        console.log(`Found ${coordinateImages.length} coordinate images`);
        if (coordinateImages.length === 0) {
            console.warn("No coordinate images found; check populateCoordinates for class assignment");
        }
        coordinateImages.forEach(image => {
            image.addEventListener("click", () => {
                const filename = image.dataset.filename;
                console.log(`Coordinate image clicked: ${filename}`);
                const { collectionName, patternName } = parseCoordinateFilename(filename);
                console.log(`Parsed coordinate: collection=${collectionName}, pattern=${patternName}`);
                
                // Preserve original mockup
                const originalMockup = appState.selectedCollection?.mockup || "";
                console.log("Preserving original mockup:", originalMockup);
    
                const result = loadPatternFromLocalCollections(collectionName, patternName);
                if (!result) {
                    console.error("Failed to load pattern, aborting UI update");
                    if (dom.coordinatesContainer) {
                        dom.coordinatesContainer.innerHTML += "<p style='color: red;'>Error: Pattern not found.</p>";
                    }
                    return;
                }
                const { collection, pattern } = result;
                
                // Update selectedCollection but restore original mockup
                appState.selectedCollection = {
                    ...collection,
                    mockup: originalMockup // Keep original mockup
                };
                appState.currentPattern = pattern;
                console.log(`Updated appState: collection=${collection.name}, pattern=${pattern.name}, mockup=${originalMockup}`);
                
                const currentColors = appState.layerInputs.map(layer => layer.input.value);
                console.log("Preserved colors:", currentColors);
                populateLayerInputs(pattern.id);
                applyColorsToLayerInputs(currentColors, collection.curatedColors);
            });
        });
    }

// Update displays with layer compositing
function updateDisplays() {
    updatePreview();
    updateRoomMockup();
    populateCoordinates();
}

function handleThumbnailClick(patternId) {
    console.log(`handleThumbnailClick: patternId=${patternId}`);
    if (!patternId) {
        console.error("Invalid pattern ID:", patternId);
        return;
    }
    try {
        // Preserve current mockup
        const originalMockup = appState.selectedCollection?.mockup || "";
        console.log("Preserving mockup for thumbnail click:", originalMockup);

        loadPatternData(patternId);

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

function loadPatternData(patternId) {
    console.log(`loadPatternData: patternId=${patternId}`);
    const pattern = appState.collections
        .flatMap(c => c.patterns)
        .find(p => p.id === patternId || p.name.toLowerCase().replace(/\s+/g, '-') === patternId);
    if (!pattern) {
        console.error(">>> Pattern not found:", patternId);
        return;
    }

    const collection = appState.collections.find(c => c.patterns.some(p => p.id === patternId || p.name.toLowerCase().replace(/\s+/g, '-') === patternId));
    if (!collection) {
        console.error(">>> Collection not found for pattern:", patternId);
        return;
    }

    const originalMockup = appState.selectedCollection?.mockup || "";
    console.log(">>> Preserving mockup:", originalMockup);

    try {
        appState.currentPattern = pattern;
        appState.selectedCollection = {
            ...collection,
            mockup: originalMockup
        };
        console.log(">>> Updated appState:", appState.selectedCollection.name, appState.currentPattern.name);

        populateLayerInputs(patternId);
        populateCuratedColors(appState.selectedCollection.curatedColors || []);
        updatePreview();
        updateRoomMockup();
        populatePatternThumbnails(appState.selectedCollection.patterns);
        populateCoordinates();
    } catch (error) {
        console.error(">>> Error in loadPatternData:", error);
        // Fallback UI
        if (dom.preview) {
            dom.preview.innerHTML = "<p>Error loading pattern. Please try another.</p>";
        }
    }
}

// Generate print preview
const generatePrintPreview = () => {
    if (!appState.currentPattern) {
        console.error("No current pattern selected for print preview");
        return null;
    }

    const isWall = appState.currentPattern?.isWall || appState.selectedCollection?.name === "wall-panels";
    const backgroundIndex = isWall ? 1 : 0;
    const backgroundInput = appState.layerInputs[backgroundIndex]?.input;
    if (!backgroundInput) {
        console.error(`Background input not found at index ${backgroundIndex}`, appState.layerInputs);
        return null;
    }

    const backgroundColor = lookupColor(backgroundInput.value);
    console.log("Print preview - Background color:", backgroundColor, "isWall:", isWall);
    console.log("Print preview - Layer inputs:", appState.layerInputs.map((li, i) => ({
        index: i,
        value: li?.input?.value
    })));

    const dpi = 100;
    const patternWidthInches = appState.currentPattern?.size?.[0] || 24;
    const patternHeightInches = appState.currentPattern?.size?.[1] || 24;
    const printWidth = Math.round(patternWidthInches * dpi);
    const printHeight = Math.round(patternHeightInches * dpi);
    const aspectRatio = patternHeightInches / patternWidthInches;

    console.log(`Print preview - Pattern: ${patternWidthInches}x${patternHeightInches}, Aspect: ${aspectRatio}`);
    console.log(`Print canvas: ${printWidth}x${printHeight}, DPI: ${dpi}`);

    const printCanvas = document.createElement("canvas");
    const printCtx = printCanvas.getContext("2d", { willReadFrequently: true });
    printCanvas.width = printWidth;
    printCanvas.height = printHeight;

    const collectionName = toInitialCaps(appState.selectedCollection?.name || "Unknown");
    const patternName = toInitialCaps(appState.currentPattern.name || "Pattern");
    let layerLabels = [];

    const processPrintPreview = async () => {
        printCtx.fillStyle = backgroundColor;
        printCtx.fillRect(0, 0, printWidth, printHeight);
        console.log("Print preview - Filled background with:", backgroundColor);

        const isTintWhite = appState.currentPattern?.tintWhite || false;
        console.log(`Print preview - tintWhite flag: ${isTintWhite}`);

        if (isTintWhite && appState.currentPattern?.baseComposite) {
            console.log(`Print preview - Processing tintWhite with baseComposite: ${appState.currentPattern.baseComposite}`);
            const baseImage = new Image();
            baseImage.src = appState.currentPattern.baseComposite.replace('./', './');
            await new Promise((resolve) => {
                baseImage.onload = () => {
                    console.log(`Print preview - Base image loaded: ${baseImage.src}, Natural: ${baseImage.naturalWidth}x${baseImage.naturalHeight}`);
                    const imageAspect = baseImage.naturalHeight / baseImage.naturalWidth;
                    console.log(`Print preview - Base image aspect: ${imageAspect}, Expected: ${aspectRatio}`);

                    if (Math.abs(imageAspect - aspectRatio) > 0.01) {
                        console.warn(`Print preview - Base image aspect mismatch, using pattern proportions`);
                    }

                    printCtx.drawImage(baseImage, 0, 0, printWidth, printHeight);

                    const tintCanvas = (ctx, x, y, width, height) => {
                        const imageData = ctx.getImageData(x, y, width, height);
                        const data = imageData.data;
                        let whitePixels = 0;
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const a = data[i + 3];
                            if (r > 220 && g > 220 && b > 220 && a > 0) {
                                whitePixels++;
                                const hex = backgroundColor.replace("#", "");
                                data[i] = parseInt(hex.substring(0, 2), 16);
                                data[i + 1] = parseInt(hex.substring(2, 4), 16);
                                data[i + 2] = parseInt(hex.substring(4, 6), 16);
                            }
                        }
                        ctx.putImageData(imageData, x, y);
                        console.log(`Print preview - Tinted ${whitePixels} white pixels with ${backgroundColor}`);
                        return whitePixels;
                    };
                    const whitePixels = tintCanvas(printCtx, 0, 0, printWidth, printHeight);
                    if (whitePixels === 0) {
                        console.warn("Print preview - No white pixels found to tint; image may be incorrect");
                    }

                    const imageData = printCtx.getImageData(printWidth / 2, printHeight / 2, 1, 1).data;
                    console.log(`Print preview - Sample pixel after tint: R=${imageData[0]}, G=${imageData[1]}, B=${imageData[2]}, A=${imageData[3]}`);
                    layerLabels = [{ label: "Tinted Base", color: backgroundInput.value }];
                    resolve();
                };
                baseImage.onerror = () => {
                    console.error(`Print preview - Failed to load base image: ${baseImage.src}`);
                    resolve();
                };
            });
        } else if (appState.currentPattern?.layers?.length) {
            layerLabels = appState.currentPattern.layers.map((l, i) => ({
                label: appState.currentPattern.layerLabels?.[i] || `Layer ${i + 1}`,
                color: appState.layerInputs[i + (isWall ? 2 : 1)]?.input?.value || "Snowbound"
            }));
            console.log(`Print preview - Layers:`, appState.currentPattern.layers.map((l, i) => ({
                index: i,
                label: layerLabels[i].label,
                path: l.path,
                color: layerLabels[i].color
            })));

            // Separate shadow and non-shadow layers
            const shadowLayers = [];
            const nonShadowLayers = [];
            appState.currentPattern.layers.forEach((layer, index) => {
                const label = layerLabels[index].label;
                const isShadow = label.toUpperCase().includes("SHADOW") || layer.path.toUpperCase().includes("SHADOW");
                (isShadow ? shadowLayers : nonShadowLayers).push({ layer, index, label });
            });

            console.log(`Print preview - Shadow layers:`, shadowLayers.map(l => l.label));
            console.log(`Print preview - Non-shadow layers:`, nonShadowLayers.map(l => l.label));

            let nonShadowInputIndex = isWall ? 2 : 1;

            // Draw shadow layers first
            for (const { layer, index, label } of shadowLayers) {
                const layerPath = layer.path || "";
                console.log(`Print preview - Drawing shadow layer ${index}: ${label}, Path: ${layerPath}`);

                await new Promise((resolve) => {
                    processImage(
                        layerPath,
                        (processedUrl) => {
                            const img = new Image();
                            img.src = processedUrl;
                            img.onload = () => {
                                console.log(`Print preview - Image: ${label}, URL: ${processedUrl}, Natural: ${img.naturalWidth}x${img.naturalHeight}`);
                                const imageAspect = img.naturalHeight / img.naturalWidth;
                                console.log(`Print preview - Image aspect: ${imageAspect}, Expected: ${aspectRatio}`);

                                if (Math.abs(imageAspect - aspectRatio) > 0.01) {
                                    console.warn(`Print preview - Image aspect mismatch for ${label}, using pattern proportions`);
                                }

                                printCtx.globalCompositeOperation = "multiply";
                                printCtx.globalAlpha = 0.3;
                                printCtx.drawImage(img, 0, 0, printWidth, printHeight);

                                const center = printCtx.getImageData(printWidth / 2, printHeight / 2, 1, 1).data;
                                console.log(`Print preview - Sample pixel for ${label}: R=${center[0]}, G=${center[1]}, B=${center[2]}, A=${center[3]}`);

                                resolve();
                            };
                            img.onerror = () => {
                                console.error(`Print preview - Failed to load image: ${processedUrl}`);
                                resolve();
                            };
                        },
                        null,
                        2.2,
                        true,
                        isWall
                    );
                });
            }

            // Draw non-shadow layers (e.g., Flower)
            for (const { layer, index, label } of nonShadowLayers) {
                const layerPath = layer.path || "";
                const layerInput = appState.layerInputs[nonShadowInputIndex];
                const layerColor = lookupColor(layerInput?.input?.value || "Snowbound");
                console.log(`Print preview - Drawing non-shadow layer ${index}: ${label}, Path: ${layerPath}, Color: ${layerColor}, Input index: ${nonShadowInputIndex}, Input value: ${layerInput?.input?.value}`);

                await new Promise((resolve) => {
                    processImage(
                        layerPath,
                        (processedUrl) => {
                            const img = new Image();
                            img.src = processedUrl;
                            img.onload = () => {
                                console.log(`Print preview - Image: ${label}, URL: ${processedUrl}, Natural: ${img.naturalWidth}x${img.naturalHeight}`);
                                const imageAspect = img.naturalHeight / img.naturalWidth;
                                console.log(`Print preview - Image aspect: ${imageAspect}, Expected: ${aspectRatio}`);

                                if (Math.abs(imageAspect - aspectRatio) > 0.01) {
                                    console.warn(`Print preview - Image aspect mismatch for ${label}, using pattern proportions`);
                                }

                                printCtx.globalCompositeOperation = "source-over";
                                printCtx.globalAlpha = 1.0;
                                printCtx.drawImage(img, 0, 0, printWidth, printHeight);

                                const center = printCtx.getImageData(printWidth / 2, printHeight / 2, 1, 1).data;
                                const topLeft = printCtx.getImageData(printWidth / 4, printHeight / 4, 1, 1).data;
                                const bottomRight = printCtx.getImageData(3 * printWidth / 4, 3 * printHeight / 4, 1, 1).data;
                                console.log(`Print preview - Sample pixels for ${label}:`);
                                console.log(`  Center: R=${center[0]}, G=${center[1]}, B=${center[2]}, A=${center[3]}`);
                                console.log(`  Top-left: R=${topLeft[0]}, G=${topLeft[1]}, B=${topLeft[2]}, A=${topLeft[3]}`);
                                console.log(`  Bottom-right: R=${bottomRight[0]}, G=${bottomRight[1]}, B=${bottomRight[2]}, A=${bottomRight[3]}`);

                                nonShadowInputIndex++;
                                resolve();
                            };
                            img.onerror = () => {
                                console.error(`Print preview - Failed to load image: ${processedUrl}`);
                                resolve();
                            };
                        },
                        layerColor,
                        2.2,
                        false,
                        isWall
                    );
                });
            }
        } else {
            console.warn("Print preview - No layers or baseComposite for pattern:", appState.currentPattern?.name);
            layerLabels = [];
        }

        const dataUrl = printCanvas.toDataURL("image/png");
        console.log(`Print preview - Generated data URL, length: ${dataUrl.length}`);

        // Generate HTML content
        let textContent = `
            <img src="./img/SC-header-mage.jpg" alt="SC Logo" class="sc-logo">
            <h2>${collectionName}</h2>
            <h3>${patternName}</h3>
            <ul style="list-style: none; padding: 0;">
        `;
        layerLabels.forEach(({ label, color }, index) => {
            const swNumber = appState.selectedCollection?.curatedColors?.[index] || color || "N/A";
            textContent += `
                <li>${toInitialCaps(label)} | ${swNumber}</li>
            `;
        });
        textContent += "</ul>";

        // Open preview window
        const previewWindow = window.open('', '_blank', 'width=800,height=1200');
        if (!previewWindow) {
            console.error("Print preview - Failed to open preview window");
            return { canvas: printCanvas, dataUrl };
        }

        previewWindow.document.write(`
            <html>
                <head>
                    <title>Print Preview</title>
                    <link href="https://fonts.googleapis.com/css2?family=Special+Elite&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Special Elite', 'Times New Roman', serif !important;
                            padding: 20px;
                            margin: 0;
                            display: flex;
                            justify-content: center;
                            align-items: flex-start;
                            min-height: 100vh;
                            background-color: #111827;
                            color: #f0e6d2;
                            overflow: auto;
                        }
                        .print-container {
                            text-align: center;
                            max-width: 600px;
                            width: 100%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            background-color: #434341;
                            padding: 20px;
                            border-radius: 8px;
                        }
                        .sc-logo {
                            width: 300px !important;
                            height: auto;
                            margin: 0 auto 20px;
                            display: block;
                        }
                        h2 { font-size: 24px; margin: 10px 0; }
                        h3 { font-size: 20px; margin: 5px 0; }
                        ul { margin: 10px 0; }
                        li { margin: 5px 0; font-size: 16px; }
                        img { max-width: 100%; height: auto; margin: 20px auto; display: block; }
                        .button-container { margin-top: 20px; }
                        button {
                            font-family: 'Special Elite', serif;
                            padding: 10px 20px;
                            margin: 0 10px;
                            font-size: 16px;
                            cursor: pointer;
                            background-color: #f0e6d2;
                            color: #111827;
                            border: none;
                            border-radius: 4px;
                        }
                        button:hover {
                            background-color: #e0d6c2;
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${textContent}
                        <img src="${dataUrl}" alt="Pattern Preview">
                        <div class="button-container">
                            <button onclick="window.print();">Print</button>
                            <button onclick="download()">Download</button>
                            <button onclick="window.close();">Close</button>
                        </div>
                    </div>
                    <script>
                        function download() {
                            const link = document.createElement("a");
                            link.href = "${dataUrl}";
                            link.download = "${patternName}-print.png";
                            link.click();
                        }
                    </script>
                </body>
            </html>
        `);
        previewWindow.document.close();
        console.log("Print preview - Preview window opened");

        return { canvas: printCanvas, dataUrl, layerLabels, collectionName, patternName };
    };

    return processPrintPreview().catch(error => {
        console.error("Print preview error:", error);
        return null;
    });
};



// Start the app
initializeApp();