// Toggle flag for normalization (set to false for binary threshold, true for normalization)
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
    currentScale: 100
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
    if (dom.printButton) {
        dom.printButton.removeEventListener('click', generatePrintPreview); // Avoid duplicates
        dom.printButton.addEventListener('click', generatePrintPreview);
        console.log("Print listener attached");
    } else {
        console.warn("Print button not found in DOM");
    }
};

const toInitialCaps = (str) =>
    str
        .toLowerCase()
        .replace(/_/g, ' ') // Replace all underscores with spaces
        .split(/[\s-]+/)     // Split on spaces and hyphens
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const stripSWNumber = (colorName) => {
    return colorName.replace(/SW\d+\s*/, '').trim(); // Removes "SW" followed by digits and optional space
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
    if (/^#[0-9A-F]{6}$/i.test(cleanedColorName)) return cleanedColorName;
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
    colorCircle.style.backgroundColor = colorValue;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "layer-input";
    input.id = id;
    input.placeholder = `Enter ${label ? label.toLowerCase() : 'layer'} color`;
    input.value = toInitialCaps(cleanInitialColor);

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
        const formatted = toInitialCaps(input.value.trim());
        input.value = formatted;
        const hex = lookupColor(formatted) || "#FFFFFF";
        colorCircle.style.backgroundColor = hex;
        console.log(`${label} input updated to: ${hex}`);
        updateDisplays();
    };

    input.addEventListener("blur", updateColor);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") updateColor();
    });

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
        circle.className = "w-24 h-24 rounded-full cursor-pointer relative flex items-center justify-center";
        circle.style.backgroundColor = hex;

        const text = document.createElement("span");
        text.className = `text-xs font-bold text-center ${getContrastClass(hex)} whitespace-pre-line`;
        
        const match = color.match(/^(SW|SC)\s*(\d+)\s+(.+)$/i);
        if (match) {
            const prefix = match[1];       // "SW" or "SC"
            const number = match[2];       // "7069" or "0001"
            const colorName = match[3];    // "Iron Ore" or "Deep Blue"
            text.textContent = `${prefix}${number}\n${toInitialCaps(colorName)}`;
        } else {
            text.textContent = toInitialCaps(color);
        }
        circle.appendChild(text);

        circle.addEventListener("click", () => {
            const strippedColor = stripSWNumber(color); // Strip SW number here
            console.log(`Curated color clicked: ${color} -> Stripped: ${strippedColor}`);
            if (appState.lastSelectedLayer) {
                appState.lastSelectedLayer.input.value = toInitialCaps(strippedColor);
                appState.lastSelectedLayer.circle.style.backgroundColor = hex;
                updateDisplays();
            } else {
                appState.layerInputs[0].input.value = toInitialCaps(strippedColor);
                appState.layerInputs[0].circle.style.backgroundColor = hex;
                updateDisplays();
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
        console.log("Raw collections data:", data);
        
        appState.collections = data.collections;
        if (!Array.isArray(appState.collections)) {
            throw new Error("collections property in local-collections.json is not an array");
        }

        const urlParams = new URLSearchParams(window.location.search);
        const collectionName = urlParams.get("collection")?.trim();
        console.log("URL parameter 'collection':", collectionName);

        appState.selectedCollection = null;
        appState.lockedCollection = false;

        if (collectionName) {
            appState.selectedCollection = appState.collections.find(c => {
                const jsonName = c.name.trim().toLowerCase();
                const urlName = collectionName.toLowerCase();
                const match = jsonName === urlName;
                console.log(`Comparing: '${jsonName}' (json) === '${urlName}' (url) -> ${match}`);
                return match;
            });
        }

        if (!appState.selectedCollection) {
            console.error(`${collectionName || 'No collection'} not found, falling back to first available collection. Available:`, appState.collections.map(c => c.name));
            appState.selectedCollection = appState.collections[0]; // Default to first collection instead of undefined
        }

        appState.curatedColors = appState.selectedCollection.curatedColors || [];
        console.log("Curated colors reset for:", appState.selectedCollection.name, "count:", appState.curatedColors.length, "values:", appState.curatedColors);
        appState.lockedCollection = true;
        console.log("Selected collection locked:", appState.selectedCollection.name);

        const initialCollection = appState.selectedCollection;

        if (dom.collectionHeader) dom.collectionHeader.textContent = `${toInitialCaps(appState.selectedCollection.name)} Collection`;
        if (appState.curatedColors.length) {
            populateCuratedColors(appState.curatedColors);
        } else {
            console.warn("Skipping populateCuratedColors due to empty curatedColors");
        }
        
        // Load "PINK TULIP LARGE" explicitly
        loadPatternData('recAln3HFRJX37JUY');
        populatePatternThumbnails(appState.selectedCollection.patterns);
        setupPrintListener();

        if (dom.printButton) {
            dom.printButton.addEventListener("click", generatePrintPreview);
        }

        Object.defineProperty(appState, 'selectedCollection', {
            get: () => initialCollection,
            set: (newValue) => {
                console.warn("Attempt to change selectedCollection to", newValue?.name, "blocked");
            },
            configurable: true
        });
    } catch (error) {
        console.error("Error loading collections:", error);
        if (dom.collectionHeader) dom.collectionHeader.textContent = "Error Loading Collection";
        if (dom.preview) dom.preview.innerHTML = "<p>Error loading data. Please try refreshing.</p>";
    }
};

// Run on initial load and refresh
window.addEventListener('load', () => {
    initializeApp().catch(error => console.error("Initialization failed:", error));
});

window.addEventListener('popstate', () => {
    initializeApp().catch(error => console.error("Refresh initialization failed:", error));
});

// Populate pattern thumbnails in sidebar
function populatePatternThumbnails(patterns) {
    if (!dom.collectionThumbnails) {
        console.error("collectionThumbnails not found in DOM");
        return;
    }
    dom.collectionThumbnails.innerHTML = "";
    patterns.forEach(pattern => {
        const thumb = document.createElement("div");
        thumb.className = "thumbnail cursor-pointer border-2 border-transparent";
        thumb.dataset.patternId = pattern.name;
        
        const img = document.createElement("img");
        img.src = pattern.thumbnail;
        img.alt = pattern.name;
        img.className = "w-full h-auto";
        thumb.appendChild(img);

        const label = document.createElement("p");
        label.textContent = pattern.name.replace(/_/g, " ").toUpperCase();
        label.className = "text-center mt-2";
        thumb.appendChild(label);

        if (appState.currentPattern && appState.currentPattern.name === pattern.name) {
            thumb.style.borderColor = "rgb(244, 255, 219)";
        }

        thumb.addEventListener("click", () => {
            handleThumbnailClick(pattern.name);
            document.querySelectorAll(".thumbnail").forEach(t => t.style.borderColor = "transparent");
            thumb.style.borderColor = "rgb(244, 255, 219)";
        });

        dom.collectionThumbnails.appendChild(thumb);
    });
    console.log("Pattern thumbnails populated:", patterns.length);
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
        img.style.width = "150px";
        img.style.height = "auto";
        img.style.objectFit = "cover";
        img.onerror = () => {
            console.warn(`Failed to load coordinate image: ${img.src}`);
            img.remove();
            if (div.children.length === 0) div.remove();
        };
        div.appendChild(img);
        dom.coordinatesContainer.appendChild(div);
    });
    console.log("Coordinates populated:", coordinates.length);
};

// Populate the layer inputs UI
const populateLayerInputs = (curatedColors, pattern = null) => {
    curatedColors = curatedColors || appState.curatedColors || [];
    if (!curatedColors.length) {
        console.warn("No curated colors available; relying on DESIGNER COLORS or defaults.");
    }

    if (!appState.selectedCollection?.patterns?.length) {
        console.error("No patterns available in selected collection!");
        return;
    }

    console.log("populateLayerInputs called with collection:", appState.selectedCollection?.name);
    const selectedPattern = pattern || appState.selectedCollection.patterns[0];
    if (!selectedPattern) {
        console.error("No valid pattern provided or found in collection!");
        return;
    }

    console.log("Pattern selected:", selectedPattern.name);
    handlePatternSelection(selectedPattern.name);

    // Debug: Verify layer inputs after handlePatternSelection
    console.log("Layer inputs post-selection:", appState.layerInputs.map(li => ({ id: li.input.id, value: li.input.value })));
};

const handlePatternSelection = (patternName) => {
    console.log(`handlePatternSelection: pattern=${patternName}, lockedCollection=${appState.lockedCollection}, currentCollection=${appState.selectedCollection?.name}`);
    const pattern = appState.selectedCollection.patterns.find(
        p => p.name.toUpperCase() === patternName.toUpperCase()
    ) || appState.selectedCollection.patterns[0];
    appState.currentPattern = pattern;
    console.log("Pattern set to:", appState.currentPattern.name);
    console.log("Layer labels available:", appState.currentPattern.layerLabels);
    console.log("Layers available:", appState.currentPattern.layers);

    const designerColors = appState.currentPattern.designer_colors || [];
    const curatedColors = appState.selectedCollection.curatedColors || [];
    const colorSource = designerColors.length > 0 ? designerColors : curatedColors;

    let backgroundColor = colorSource[0] || "#FFFFFF";
    appState.currentLayers = [];
    appState.currentLayers.push({ imageUrl: null, color: backgroundColor, label: "Background" });

    if (!appState.currentPattern.tintWhite) {
        const overlayLayers = pattern.layers || [];
        overlayLayers.forEach((layerUrl, index) => {
            const label = (pattern.layerLabels && pattern.layerLabels[index]) || `Layer ${index + 1}`;
            const isShadow = label.toUpperCase().includes("ISSHADOW") || layerUrl.toUpperCase().includes("ISSHADOWS");
            console.log(`Layer ${index + 1} label: ${label}, URL: ${layerUrl}, IsShadow: ${isShadow}`);
            if (!isShadow) {
                appState.currentLayers.push({
                    imageUrl: layerUrl,
                    color: colorSource[index + 1] || "#000000", // Adjust index for non-shadow layers
                    label: label
                });
            } else {
                console.log(`Excluding shadow layer from UI inputs: ${label} (${layerUrl})`);
            }
        });
    }

    dom.layerInputsContainer.innerHTML = "";
    appState.layerInputs = [];
    createColorInput("Background", "bgColorInput", stripSWNumber(backgroundColor), true);
    
    if (!appState.currentPattern.tintWhite) {
        appState.currentLayers.slice(1).forEach((layer, index) => {
            const inputId = `layer${index + 1}ColorInput`;
            createColorInput(toInitialCaps(layer.label), inputId, stripSWNumber(layer.color));
        });
    }

    appState.cachedLayerPaths = appState.currentLayers.slice(1).map(layer => ({
        url: layer.imageUrl,
        name: layer.label
    }));
    
    dom.patternName.textContent = toInitialCaps(appState.currentPattern.name);
    console.log("Updated #patternName to:", dom.patternName.textContent);
    console.log("Layer inputs after setup:", appState.layerInputs.map(li => ({ id: li.input.id, value: li.input.value })));

    setupPrintListener();
    updateDisplays();
};

// Highlight active layer
const highlightActiveLayer = (circle) => {
    document.querySelectorAll(".circle-input").forEach((c) => (c.style.outline = "none"));
    circle.style.outline = "6px solid rgb(244, 255, 219)";
};

// Show popup message (kept for reference, currently disabled)
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

// Process image with color tinting (toggleable normalization)
const processImage = (url, callback, layerColor = '#7f817e', gamma = 2.2, isShadow = false) => {
    console.log(`Processing image ${url} with color ${layerColor}, Normalization: ${USE_NORMALIZATION}, IsShadow: ${isShadow}`);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = `${url}?t=${new Date().getTime()}`; // Cache busting with timestamp

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

        let rLayer, gLayer, bLayer;
        if (layerColor && !isShadow) {
            const hex = layerColor.replace("#", "");
            rLayer = parseInt(hex.substring(0, 2), 16);
            gLayer = parseInt(hex.substring(2, 4), 16);
            bLayer = parseInt(hex.substring(4, 6), 16);
        } else if (isShadow) {
            console.log("Shadow layer: Skipping color parsing");
        }

        if (isShadow) {
            // Ensure shadow layer has proper alpha for multiply blending
            for (let i = 0; i < data.length; i += 4) {
                const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const alpha = 1 - (luminance / 255); // Darker areas more opaque
                data[i] = 0; // Black for multiply
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = Math.round(alpha * 255); // Alpha based on luminance
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
    fetch(`data/local-collections.json?${new Date().getTime()}`)
        .then(response => response.json())
        .then(data => {
            const pattern = data.collections
                .flatMap(c => c.patterns)
                .find(p => p.id === patternId);
            if (pattern) {
                appState.currentPattern = pattern;
                console.log(">>> Updated appState.currentPattern:", JSON.stringify(pattern, null, 2));
                appState.selectedCollection = data.collections.find(c => c.patterns.some(p => p.id === patternId));
                appState.curatedColors = appState.selectedCollection.curatedColors || [];
                populateLayerInputs(appState.curatedColors, pattern);
                updatePreview();
                updateRoomMockup();
                populatePatternThumbnails(appState.selectedCollection.patterns);
                populateCoordinates();
            } else {
                console.error(">>> Pattern not found:", patternId);
            }
        })
        .catch(error => console.error(">>> Error loading JSON:", error));
}

const updatePreview = () => {
    if (!dom.preview) {
        console.error("preview not found in DOM");
        return;
    }
    const bgInput = appState.layerInputs[0]?.input;
    if (!bgInput) {
        console.error("Background input not found in appState.layerInputs");
        return;
    }
    const bgColor = lookupColor(bgInput.value);
    console.log("Updating preview with bgColor from input:", bgInput.value, "converted to:", bgColor);

    const progressContainer = document.createElement("div");
    progressContainer.className = "absolute inset-0 flex items-center justify-center z-10";
    const progressBar = document.createElement("div");
    progressBar.className = "w-3/4 bg-blue-200 rounded-full h-4";
    const progressFill = document.createElement("div");
    progressFill.className = "bg-purple-600 h-4 rounded-full transition-all duration-300";
    progressFill.style.width = "0%";
    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);
    dom.preview.appendChild(progressContainer);

    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = 700;
    previewCanvas.height = 700;
    const previewCtx = previewCanvas.getContext("2d");

    const roomCanvas = document.createElement("canvas");
    roomCanvas.width = 600;
    roomCanvas.height = 450;
    const roomCtx = roomCanvas.getContext("2d");

    const isHalfDrop = appState.currentPattern?.tilingType === "half-drop" || false;
    console.log(`updatePreview: Tiling type: ${appState.currentPattern?.tilingType || "none"}`);

    const processPreview = async () => {
        console.log(">>> Current pattern in updatePreview:", JSON.stringify(appState.currentPattern, null, 2));
        const isTintWhite = appState.currentPattern?.tintWhite;
        const totalSteps = (appState.currentPattern?.baseComposite ? 1 : 0) + (appState.currentPattern?.layers?.length || 0) || 1;
        let completedSteps = 0;

        const updateProgress = () => {
            completedSteps++;
            const progress = Math.min(100, (completedSteps / totalSteps) * 100);
            progressFill.style.width = `${progress}%`;
            console.log(`Preview progress: ${completedSteps}/${totalSteps} (${progress.toFixed(2)}%)`);
        };

        previewCtx.fillStyle = bgColor;
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        roomCtx.fillStyle = bgColor;
        roomCtx.fillRect(0, 0, roomCanvas.width, roomCanvas.height);
        console.log(">>> Preview and room backgrounds filled with:", bgColor);

        const fitToCanvas = (img, canvasWidth, canvasHeight, applyScale = false) => {
            const aspect = img.width / img.height;
            const scaleFactor = applyScale ? (appState.currentScale / 100) : 1;
            let width = applyScale ? 400 * scaleFactor : canvasWidth;
            let height = applyScale ? 400 * scaleFactor * (img.height / img.width) : canvasWidth / aspect;
            if (!applyScale && height > canvasHeight) {
                height = canvasHeight;
                width = canvasHeight * aspect;
            } else if (applyScale && height > canvasHeight) {
                height = canvasHeight;
                width = height * aspect;
            }
            return { width, height, x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2 };
        };

        if (appState.currentPattern?.baseComposite && isTintWhite) {
            const baseImage = new Image();
            baseImage.src = `http://127.0.0.1:5500${appState.currentPattern.baseComposite.replace('./', '/')}`;
            console.log(">>> Loading base composite image:", baseImage.src);
            await new Promise((resolve) => {
                baseImage.onload = () => {
                    console.log(`>>> Base composite loaded: ${baseImage.naturalWidth}x${baseImage.naturalHeight}`);
                    const previewFit = fitToCanvas(baseImage, 700, 700, false);
                    previewCtx.drawImage(baseImage, previewFit.x, previewFit.y, previewFit.width, previewFit.height);
                    const roomFit = fitToCanvas(baseImage, 600, 450, true);
                    roomCtx.drawImage(baseImage, roomFit.x, roomFit.y, roomFit.width, roomFit.height);

                    console.log(">>> Tinting white areas with:", bgColor);
                    const tintCanvas = (ctx, width, height) => {
                        const imageData = ctx.getImageData(0, 0, width, height);
                        const data = imageData.data;
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const a = data[i + 3];
                            if (r > 240 && g > 240 && b > 240 && a > 0) {
                                const hex = bgColor.replace("#", "");
                                data[i] = parseInt(hex.substring(0, 2), 16);
                                data[i + 1] = parseInt(hex.substring(2, 4), 16);
                                data[i + 2] = parseInt(hex.substring(4, 6), 16);
                            }
                        }
                        ctx.putImageData(imageData, 0, 0);
                    };
                    tintCanvas(previewCtx, previewCanvas.width, previewCanvas.height);
                    tintCanvas(roomCtx, roomCanvas.width, roomCanvas.height);

                    updateProgress();
                    resolve();
                };
                baseImage.onerror = () => {
                    console.error(">>> Failed to load base composite image:", baseImage.src);
                    updateProgress();
                    resolve();
                };
            });
        } else if (appState.currentPattern?.layers?.length) {
            let nonShadowInputIndex = 1;
            for (let index = 0; index < appState.currentPattern.layers.length; index++) {
                const layerUrl = appState.currentPattern.layers[index];
                const label = appState.currentPattern.layerLabels?.[index] || `Layer ${index + 1}`;
                const isShadow = label.toUpperCase().includes("ISSHADOW") || layerUrl.toUpperCase().includes("ISSHADOWS");
                const layerColor = isShadow ? null : lookupColor(appState.layerInputs[nonShadowInputIndex]?.input?.value || "Snowbound");
                console.log(`>>> Processing layer ${index + 1}: ${layerUrl}, Label: ${label}, IsShadow: ${isShadow}, Color: ${layerColor || "None"}, NonShadowInputIndex: ${nonShadowInputIndex}`);

                await new Promise((resolve) => {
                    processImage(layerUrl, (processedUrl) => {
                        const img = new Image();
                        img.src = processedUrl; // Use base64 directly, no http:// prefix
                        img.onload = () => {
                            console.log(`Layer ${index + 1} loaded: ${img.width}x${img.height}, Composite Mode: ${isShadow ? "multiply" : "source-over"}`);
                            previewCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
                            previewCtx.globalAlpha = isShadow ? 0.3 : 1.0;
                            const previewFit = fitToCanvas(img, 700, 700, false);
                            previewCtx.drawImage(img, previewFit.x, previewFit.y, previewFit.width, previewFit.height);

                            roomCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
                            roomCtx.globalAlpha = isShadow ? 0.3 : 1.0;
                            const roomFit = fitToCanvas(img, 600, 450, true);
                            roomCtx.drawImage(img, roomFit.x, roomFit.y, roomFit.width, roomFit.height);

                            updateProgress();
                            if (!isShadow) nonShadowInputIndex++;
                            resolve();
                        };
                        img.onerror = () => {
                            console.error(`>>> Failed to load layer ${index + 1}: ${processedUrl}`);
                            updateProgress();
                            if (!isShadow) nonShadowInputIndex++;
                            resolve();
                        };
                    }, layerColor, 2.2, isShadow);
                });
            }
        } else {
            console.log(">>> No baseComposite or layers to process");
            updateProgress();
        }

        console.log(">>> Preview canvas state before append:", previewCanvas.toDataURL().substring(0, 50));
        dom.preview.classList.remove("aspect-square");
        dom.preview.classList.add("w-[700px]", "h-[700px]", "overflow-hidden", "relative", "z-0", "flex-shrink-0");
        dom.preview.style.cssText = "";
        dom.preview.innerHTML = "";
        dom.preview.appendChild(previewCanvas);

        const roomMockup = document.getElementById("roomMockup");
        if (roomMockup) {
            console.log("Updating roomMockup DOM");
            roomMockup.innerHTML = "";
            roomMockup.appendChild(roomCanvas);
            roomMockup.classList.remove("pb-[75.33%]");
            roomMockup.style.height = "450px";
        }

        if (appState.currentPattern?.name) {
            dom.patternName.textContent = toInitialCaps(appState.currentPattern.name);
            console.log("Updated #patternName to:", dom.patternName.textContent);
        }

        setTimeout(() => {
            if (progressContainer && progressContainer.parentNode) {
                progressContainer.parentNode.removeChild(progressContainer);
                console.log(">>> Progress bar removed from DOM");
            }
        }, 0);
    };

    processPreview().catch(error => {
        console.error("Error processing preview:", error);
        dom.preview.innerHTML = "";
        dom.preview.appendChild(previewCanvas);
        const roomMockup = document.getElementById("roomMockup");
        if (roomMockup) {
            roomMockup.innerHTML = "";
            roomMockup.appendChild(roomCanvas);
        }
        if (appState.currentPattern?.name) {
            dom.patternName.textContent = toInitialCaps(appState.currentPattern.name);
        }
    });
};

const updateRoomMockup = () => {
    console.log(">>> Entered updateRoomMockup function"); // Confirm entry

    if (!dom.roomMockup) {
        console.error("roomMockup element not found in DOM");
        return;
    }

    const bgInput = appState.layerInputs[0]?.input;
    if (!bgInput) {
        console.error("Background input not found");
        return;
    }
    const bgColor = lookupColor(bgInput.value);
    console.log(">>> Updating room mockup with bgColor from input:", bgInput.value, "converted to:", bgColor);

    const UI_WIDTH_DEFAULT = 600;
    const UI_HEIGHT_DEFAULT = 450;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = UI_WIDTH_DEFAULT;
    canvas.height = UI_HEIGHT_DEFAULT;

    const renderCanvas = () => {
        console.log(">>> Entering renderCanvas");
        dom.roomMockup.className = `w-[${UI_WIDTH_DEFAULT}px] max-w-[${UI_WIDTH_DEFAULT}px] h-[${UI_HEIGHT_DEFAULT}px] relative flex-shrink-0 ml-20 grid-update`;
        dom.roomMockup.style.height = `${UI_HEIGHT_DEFAULT}px`;
        dom.roomMockup.style.maxHeight = `${UI_HEIGHT_DEFAULT}px`;
        dom.roomMockup.style.border = "1px solid black !important";
        console.log(">>> roomMockup styles:", dom.roomMockup.style.cssText);

        dom.roomMockup.innerHTML = ''; // Clear previous content

        try {
            const dataUrl = canvas.toDataURL("image/png");
            console.log(">>> Canvas Data URL length:", dataUrl.length);
            console.log(">>> Canvas Data URL sample:", dataUrl.substring(0, 50)); // Debug final content
            if (dataUrl.length < 100) {
                console.warn(">>> Canvas Data URL seems very short - Canvas might be blank!");
            }
            const img = document.createElement("img");
            img.src = dataUrl;
            img.style.cssText = "width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0;";
            console.log(">>> Image styles:", img.style.cssText);

            img.onload = () => {
                console.log(">>> Room mockup image final load SUCCESSFUL");
                console.log(`>>> Image natural dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
                console.log(`>>> Image computed dimensions: ${img.clientWidth}x${img.clientHeight}`);
            };
            img.onerror = (err) => console.error(">>> Failed to load final room mockup image from Data URL", err);
            dom.roomMockup.appendChild(img);
            console.log(">>> Image appended to dom.roomMockup");
        } catch (e) {
            console.error(">>> Error during canvas.toDataURL() or image creation:", e);
        }

        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.classList.add("grid-update");
            console.log(">>> MainContent classes after update:", mainContent.className);
        }
    };

    const tilingType = appState.currentPattern?.tilingType || "straight";
    const isHalfDrop = tilingType === "half-drop";
    console.log(`>>> updateRoomMockup: Tiling type: ${tilingType}, isHalfDrop: ${isHalfDrop}`);

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

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        console.log(">>> Background filled with:", bgColor);

        const patternCanvas = document.createElement("canvas");
        patternCanvas.width = canvas.width;
        patternCanvas.height = canvas.height;
        const patternCtx = patternCanvas.getContext("2d");

        const mockupWidthInches = appState.selectedCollection?.mockupWidthInches || 60;
        const mockupHeightInches = appState.selectedCollection?.mockupHeightInches || 45;
        console.log(`>>> Mockup dimensions from appState: ${mockupWidthInches}x${mockupHeightInches} inches`);

        const size = appState.currentPattern?.size || [24, 24];
        console.log(`>>> Pattern size: [${size[0]}, ${size[1]}] inches`);
        const scale = appState.currentScale / 100;
        const pixelsPerInchWidth = UI_WIDTH_DEFAULT / mockupWidthInches;
        const pixelsPerInchHeight = UI_HEIGHT_DEFAULT / mockupHeightInches;
        const tileWidth = size[0] * pixelsPerInchWidth * scale;
        const tileHeight = size[1] * pixelsPerInchHeight * scale;
        console.log(`>>> Tile dimensions: ${tileWidth}x${tileHeight}px (scale: ${scale}, pixelsPerInch: ${pixelsPerInchWidth.toFixed(2)}x${pixelsPerInchHeight.toFixed(2)})`);

        const isTintWhite = appState.currentPattern?.tintWhite;
        if (isTintWhite && (appState.currentPattern?.baseComposite || appState.currentPattern?.layers?.length)) {
            const imageSrc = appState.currentPattern?.baseComposite || appState.currentPattern?.layers[0];
            const baseImage = new Image();
            baseImage.src = `http://127.0.0.1:5500${imageSrc.replace('./', '/')}`;
            console.log(">>> Loading tintWhite image:", baseImage.src);
            await new Promise((resolve) => {
                baseImage.onload = () => {
                    console.log(`>>> TintWhite image loaded: ${baseImage.naturalWidth}x${baseImage.naturalHeight}`);
                    const offsetY = isHalfDrop ? tileHeight / 2 : 0;
                    const startY = -tileHeight;
                    for (let x = -tileWidth; x < canvas.width + tileWidth; x += tileWidth) {
                        const isOddColumn = Math.floor(x / tileWidth) % 2 !== 0;
                        const yOffset = isOddColumn && isHalfDrop ? offsetY : 0;
                        for (let y = startY + yOffset; y < canvas.height + tileHeight; y += tileHeight) {
                            patternCtx.drawImage(baseImage, x, y, tileWidth, tileHeight);
                            console.log(`>>> TintWhite tile at (${x}, ${y}), size: ${tileWidth}x${tileHeight}`);
                        }
                    }
                    console.log(">>> TintWhite layer tiled with size:", tileWidth, "x", tileHeight);

                    console.log(">>> Tinting white areas with:", bgColor);
                    const imageData = patternCtx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const a = data[i + 3];
                        if (r > 240 && g > 240 && b > 240 && a > 0) {
                            const hex = bgColor.replace("#", "");
                            data[i] = parseInt(hex.substring(0, 2), 16);
                            data[i + 1] = parseInt(hex.substring(2, 4), 16);
                            data[i + 2] = parseInt(hex.substring(4, 6), 16);
                        }
                    }
                    patternCtx.putImageData(imageData, 0, 0);
                    console.log(">>> Pattern canvas state after tinting:", patternCanvas.toDataURL().substring(0, 50));
                    ctx.drawImage(patternCanvas, 0, 0);
                    console.log(">>> Pattern canvas applied to main canvas");
                    resolve();
                };
                baseImage.onerror = () => {
                    console.error(">>> Failed to load tintWhite image:", baseImage.src);
                    resolve();
                };
            });
        } else if (appState.currentPattern?.layers?.length) {
            let nonShadowInputIndex = 1;
            for (let index = 0; index < appState.currentPattern.layers.length; index++) {
                const layerUrl = appState.currentPattern.layers[index];
                const label = appState.currentPattern.layerLabels?.[index] || `Layer ${index + 1}`;
                const isShadow = label.toUpperCase().includes("ISSHADOW") || layerUrl.toUpperCase().includes("ISSHADOWS");
                const layerColor = isShadow ? null : lookupColor(appState.layerInputs[nonShadowInputIndex]?.input?.value || "Snowbound");
                console.log(`>>> Processing layer ${index + 1}: ${layerUrl}, Label: ${label}, IsShadow: ${isShadow}, Color: ${layerColor || "None"}, NonShadowInputIndex: ${nonShadowInputIndex}`);

                await new Promise((resolve) => {
                    processImage(layerUrl, (processedUrl) => {
                        const img = new Image();
                        img.src = processedUrl;
                        img.onload = () => {
                            console.log(`>>> Layer ${index + 1} loaded: ${img.width}x${img.height}`);
                            const layerTileWidth = tileWidth;
                            const layerTileHeight = tileHeight * (img.height / img.width);
                            const offsetY = isHalfDrop ? layerTileHeight / 2 : 0;
                            const startY = -layerTileHeight;
                            patternCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
                            patternCtx.globalAlpha = isShadow ? 0.3 : 1.0;
                            for (let x = -layerTileWidth; x < canvas.width + layerTileWidth; x += layerTileWidth) {
                                const isOddColumn = Math.floor(x / layerTileWidth) % 2 !== 0;
                                const yOffset = isOddColumn && isHalfDrop ? offsetY : 0;
                                for (let y = startY + yOffset; y < canvas.height + layerTileHeight; y += layerTileHeight) {
                                    patternCtx.drawImage(img, x, y, layerTileWidth, layerTileHeight);
                                    console.log(`>>> Layer ${index + 1} tile at (${x}, ${y}), size: ${layerTileWidth}x${layerTileHeight}`);
                                }
                            }
                            console.log(`>>> Layer ${index + 1} tiled with size: ${layerTileWidth}x${layerTileHeight}, offsetY: ${offsetY}, Mode: ${isShadow ? "multiply (alpha 0.3)" : "source-over"}`);
                            if (!isShadow) nonShadowInputIndex++;
                            resolve();
                        };
                        img.onerror = () => {
                            console.error(`>>> Failed to load layer ${index + 1}: ${processedUrl}`);
                            resolve();
                        };
                    }, layerColor, 2.2, isShadow);
                });
            }
            ctx.drawImage(patternCanvas, 0, 0);
            console.log(">>> Pattern canvas applied to main canvas for layers");
        } else {
            console.log(">>> No baseComposite or layers to process");
        }

        const mockupImage = new Image();
        let mockupNeeded = appState.selectedCollection?.mockup;
        let mockupLoaded = false;
        if (mockupNeeded) {
            mockupImage.src = appState.selectedCollection.mockup;
            console.log(">>> Loading mockup image:", mockupImage.src);
            await new Promise((resolve) => {
                mockupImage.onload = () => {
                    console.log(`>>> Mockup loaded: ${mockupImage.naturalWidth}x${mockupImage.naturalHeight}`);
                    mockupLoaded = true;
                    const fit = scaleToFit(mockupImage, UI_WIDTH_DEFAULT, UI_HEIGHT_DEFAULT);
                    ctx.drawImage(mockupImage, fit.x, fit.y, fit.width, fit.height);
                    console.log(">>> Mockup drawn at:", fit);
                    resolve();
                };
                mockupImage.onerror = () => {
                    console.error(">>> Failed to load mockup image:", mockupImage.src);
                    mockupNeeded = false;
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


// Generate print preview
const generatePrintPreview = () => {
    const pattern = appState.currentPattern;
    const collectionName = appState.selectedCollection.name;
    const patternName = toInitialCaps(pattern.name); // Apply toInitialCaps here

    console.log("appState.curatedColors:", appState.selectedCollection.curatedColors);
    console.log("appState.layerInputs:", appState.layerInputs);

    let textContent = `
        <img src="./img/SC-header-mage.jpg" alt="SC Logo" class="sc-logo">
        <h2>${toInitialCaps(collectionName)}</h2>
        <h3>${patternName}</h3>
        <ul style="list-style: none; padding: 0;">
    `;

    appState.currentLayers.forEach((layer, index) => {
        const swNumber = index === 0 
            ? appState.selectedCollection.curatedColors[0] 
            : (appState.selectedCollection.curatedColors[index] || "N/A");
        textContent += `
            <li>${toInitialCaps(layer.label)} | ${swNumber}</li>
        `;
    });

    textContent += "</ul>";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 700;
    canvas.height = 630; // NEED TO FIX THIS HEIGHT FOR TALL IMAGES

    const bgInput = appState.layerInputs[0]?.input;
    const bgColor = bgInput ? lookupColor(bgInput.value) : "gray";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawLayers = async () => {
        for (let i = 0; i < appState.cachedLayerPaths.length; i++) {
            const layer = appState.cachedLayerPaths[i];
            const layerInput = appState.layerInputs[i + 1];
            const layerColor = layerInput?.circle?.style.backgroundColor || "gray";
            const processedUrl = await new Promise(resolve => {
                processImage(layer.url, resolve, layerColor);
            });

            const maskImg = new Image();
            maskImg.crossOrigin = "Anonymous";
            await new Promise((resolve, reject) => {
                maskImg.onload = resolve;
                maskImg.onerror = () => {
                    console.error(`Failed to load layer ${i + 1}:`, processedUrl);
                    reject();
                };
                maskImg.src = processedUrl;
            });

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext("2d");

            tempCtx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);

            const isShadowLayer = layer.name.toLowerCase().includes("shadow");
            console.log(`Processing layer ${i + 1}: "${layer.name}", Is Shadow: ${isShadowLayer}`);

            ctx.globalCompositeOperation = isShadowLayer ? "multiply" : "source-over";
            console.log(`Using globalCompositeOperation: ${ctx.globalCompositeOperation} for layer ${i + 1}`);

            tempCtx.globalCompositeOperation = "source-in";
            tempCtx.fillStyle = layerColor;
            tempCtx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(tempCanvas, 0, 0);

            if (isShadowLayer) {
                ctx.globalCompositeOperation = "source-over";
                console.log("Reset to source-over after shadow layer");
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
                            font-family: 'Special Elite', 'Times New Roman', serif !important;
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

// Update displays with layer compositing
function updateDisplays() {
    updatePreview();
    updateRoomMockup();
    populatePatternThumbnails(appState.selectedCollection.patterns);
    populateCoordinates();
}

// Modify handleThumbnailClick to respect the lock
function handleThumbnailClick(patternId) {
    const pattern = appState.selectedCollection.patterns.find(p => p.name === patternId);
    console.log("Thumbnail clicked, pattern ID:", patternId);
    if (pattern && appState.lockedCollection) { // Only update pattern, not collection
        populateLayerInputs(appState.curatedColors, pattern);
    }
}

// Start the app
initializeApp();