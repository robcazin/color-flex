// Toggle flag
const USE_LOCAL_DATA = true;
const DEFAULT_COLLECTION = "FARMHOUSE";

// DOM Cache
let dom = {};

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

let currentPattern = null;
let currentLayers = [];
let patterns = [];
let colorData = [];

const toInitialCaps = (str) => {
    if (!str || typeof str !== "string") return "Unknown";
    return str.toLowerCase().split(/[\s-]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const getContrastClass = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "text-black" : "text-white";
};

const getColorHex = (colorName) => {
    if (!colorName || typeof colorName !== "string") {
        console.log("Color name undefined or not a string, returning default: #FF0000");
        return "#FF0000";
    }
    const cleanedColorName = colorName.replace(/^(SW|HGSW)\d+\s*/i, "").toLowerCase().trim();
    console.log("Looking up color:", colorName, "cleaned:", cleanedColorName);
    if (/^#[0-9A-F]{6}$/i.test(cleanedColorName)) return cleanedColorName;
    if (!colorData.length) {
        console.log("No color data loaded, returning default: #FF0000");
        return "#FF0000";
    }
    const colorEntry = colorData.find(c => c && c.name && typeof c.name === "string" && c.name.toLowerCase() === cleanedColorName);
    if (!colorEntry) {
        console.log(`Color "${cleanedColorName}" not found in colorData, returning default: #FF0000`);
        return "#FF0000";
    }
    console.log(`Found color "${cleanedColorName}" with hex: ${colorEntry.hex}`);
    return colorEntry.hex;
};

const createColorInput = (labelText, id, initialColor, isBackground = false) => {
    console.log(`Creating color input with label: ${labelText}, ID: ${id}, initialColor: ${initialColor}`);
    const container = document.createElement("div");
    container.className = "layer-input-container";
    const label = document.createElement("div");
    label.className = "layer-label";
    label.textContent = labelText || "Unknown Layer";
    const circle = document.createElement("div");
    circle.className = "circle-input";
    circle.id = `${id}Circle`;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "layer-input";
    input.id = id;
    input.placeholder = `Enter ${labelText.toLowerCase()} color`;
    const cleanInitialColor = (initialColor || "Snowbound").replace(/^(SW|HGSW)\d+\s*/i, "").trim();
    input.value = toInitialCaps(cleanInitialColor);
    circle.style.backgroundColor = getColorHex(initialColor || "Snowbound");
    container.append(label, circle, input);
    if (dom.layerInputsContainer) dom.layerInputsContainer.appendChild(container);

    const layerData = { input, circle, isBackground };
    if (!appState.layerInputs.some(li => li.input.id === id)) appState.layerInputs.push(layerData);

    circle.addEventListener("click", () => {
        appState.lastSelectedLayer = layerData;
        highlightActiveLayer(circle);
        if (localStorage.getItem("hidePopup") !== "true") {
            showPopupMessage("🎨 Now, click a curated color to set this color, OR enter an SW name.", "hidePopup");
        }
    });

    const updateColor = () => {
        const formatted = toInitialCaps(input.value.trim());
        input.value = formatted;
        const hex = getColorHex(formatted) || getColorHex("Snowbound");
        circle.style.backgroundColor = hex;
        updateDisplays();
    };

    input.addEventListener("blur", updateColor);
    input.addEventListener("keydown", (e) => e.key === "Enter" && updateColor());

    return layerData;
};

const highlightActiveLayer = (circle) => {
    document.querySelectorAll(".circle-input").forEach(c => c.style.outline = "none");
    circle.style.outline = "6px solid rgb(244, 255, 219)";
};

const showPopupMessage = (message, storageKey) => {
    if (localStorage.getItem(storageKey) === "true" || document.getElementById("popupMessage")) return;
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
        if (popup.querySelector("#popupDismiss").checked) localStorage.setItem(storageKey, "true");
        document.body.removeChild(popup);
    });
    document.body.appendChild(popup);
};

const loadLocalCollectionData = async (collectionName) => {
    try {
        console.log("Fetching local-collections.json...");
        const response = await fetch('./data/local-collections.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        const collection = data.collections.find(c => c.name.toLowerCase() === collectionName.toLowerCase());
        if (!collection) throw new Error(`Collection ${collectionName} not found in JSON`);
        console.log("Collection data:", collection);
        return collection;
    } catch (error) {
        console.error('Error loading local data:', error);
        return null;
    }
};

const loadThumbnails = (patterns) => {
    if (!dom.collectionThumbnails) {
        console.error("thumbnailsContainer not found in DOM");
        return;
    }
    dom.collectionThumbnails.innerHTML = "";
    console.log("Loading thumbnails for patterns:", patterns.map(p => p.name));
    patterns.forEach(pattern => {
        const thumbDiv = document.createElement("div");
        thumbDiv.className = "thumbnail";
        thumbDiv.dataset.patternId = pattern.id;

        const img = document.createElement("img");
        img.src = pattern.thumbnail || "https://placehold.co/150x150?text=No+Thumbnail";
        img.alt = pattern.name || "Unknown Pattern";
        img.onerror = () => {
            console.warn(`Failed to load thumbnail: ${img.src}`);
            img.src = "https://placehold.co/150x150?text=Error";
        };

        thumbDiv.appendChild(img);
        dom.collectionThumbnails.appendChild(thumbDiv);

        thumbDiv.addEventListener("click", () => {
            const patternId = thumbDiv.dataset.patternId;
            console.log("Thumbnail clicked, pattern ID:", patternId);
            const selectedPattern = patterns.find(p => p.id === patternId);
            if (!selectedPattern) return;

            let backgroundColor = selectedPattern.curatedColors?.[0] || "#ffffff";
            currentPattern = selectedPattern;
            currentLayers = [{ imageUrl: null, color: backgroundColor, label: "Background" }];

            const overlayLayers = selectedPattern.layers || [];
            console.log("Overlay layers:", overlayLayers);
            overlayLayers.forEach((layerUrl, index) => {
                const label = `Layer ${index + 1}`;
                currentLayers.push({
                    imageUrl: layerUrl,
                    color: selectedPattern.curatedColors?.[index + 1] || "#000000",
                    label
                });
            });
            console.log("Current layers:", currentLayers);

            appState.layerInputs = [];
            createColorInput("Background", "bgColorInput", backgroundColor, true);
            currentLayers.slice(1).forEach((layer, index) => {
                createColorInput(layer.label, `layer${index + 1}ColorInput`, layer.color);
            });

            appState.cachedLayerPaths = currentLayers.slice(1).map(layer => ({ url: layer.imageUrl }));
            appState.curatedColors = selectedPattern.curatedColors || appState.selectedCollection.curatedColors || [];
            populateCuratedColors(appState.curatedColors);
            updateDisplays();
            if (dom.patternName) dom.patternName.textContent = selectedPattern.name;
        });
    });
    console.log("Thumbnails loaded, count:", patterns.length);
};

const handleCollectionSelection = (collection) => {
    if (!collection || !collection.patterns) {
        console.error("Invalid collection or missing patterns:", collection);
        return;
    }
    dom.collectionHeader.textContent = `${collection.name} Collection`;
    loadThumbnails(collection.patterns);
};

const populateCuratedColors = (colors) => {
    if (!dom.curatedColorsContainer) {
        console.error("curatedColorsContainer not found in DOM");
        return;
    }
    dom.curatedColorsContainer.innerHTML = "";
    console.log("Populating curated colors:", colors);
    if (!colors.length) {
        dom.curatedColorsContainer.textContent = "No curated colors available.";
        return;
    }
    colors.forEach((colorName) => {
        if (!colorName) {
            console.warn("Skipping undefined colorName");
            return;
        }
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
        container.addEventListener("click", () => {
            if (!appState.lastSelectedLayer) {
                showPopupMessage("❌ Please click a background or layer circle first.", "hideSelectionWarning");
                return;
            }
            appState.lastSelectedLayer.input.value = toInitialCaps(colorName);
            appState.lastSelectedLayer.circle.style.backgroundColor = hex;
            updateDisplays();
        });
        dom.curatedColorsContainer.appendChild(container);
    });
    console.log("Curated colors populated, count:", colors.length);
};

const populateCoordinates = () => {
    if (!dom.coordinatesContainer) {
        console.error("coordinatesContainer not found in DOM");
        return;
    }
    dom.coordinatesContainer.innerHTML = "";
    dom.coordinatesContainer.style.position = "relative";

    const coordinates = currentPattern?.coordinatePrints || [];
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

    coordinates.forEach((image, index) => {
        const div = document.createElement("div");
        div.className = "coordinate-item";

        const xOffset = xStart + (index * xStep);
        const yOffset = yStart + 10 + (index % 2 === 0 ? yStep : 0);
        div.style.setProperty("--x-offset", `${xOffset}px`);
        div.style.setProperty("--y-offset", `${yOffset}px`);
        div.style.left = "50%";
        div.style.top = "50%";

        const img = document.createElement("img");
        img.src = image; // Assuming coordinatePrints are URLs
        img.alt = `Coordinate ${index + 1}`;
        img.style.width = "150px";
        img.style.height = "auto";
        img.style.objectFit = "cover";
        img.onerror = () => console.warn(`Failed to load coordinate image: ${img.src}`);

        div.appendChild(img);
        dom.coordinatesContainer.appendChild(div);
    });
    console.log("Coordinates populated, count:", coordinates.length);
};

const updatePreview = () => {
    if (!dom.preview) {
        console.error("preview not found in DOM");
        return;
    }
    const bgInput = appState.layerInputs[0]?.input;
    if (!bgInput) {
        console.error("Background input not found");
        return;
    }
    const bgColor = getColorHex(bgInput.value);
    console.log("Updating preview with bgColor:", bgColor);

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
    `;
    dom.preview.appendChild(bgDiv);

    if (currentLayers.length > 1) {
        currentLayers.slice(1).forEach((layer, index) => {
            const layerInput = appState.layerInputs[index + 1]?.input;
            const layerColor = getColorHex(layerInput ? layerInput.value : "#000000");
            console.log(`Rendering layer ${index + 1}: ${layer.imageUrl}, color: ${layerColor}`);
            processImage(layer.imageUrl, (processedUrl) => {
                const div = document.createElement("div");
                div.style.cssText = `
                    background-color: ${layerColor};
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: ${index + 1};
                    mask-image: url(${processedUrl});
                    -webkit-mask-image: url(${processedUrl});
                    mask-size: contain;
                    -webkit-mask-size: contain;
                    mask-position: center;
                    -webkit-mask-position: center;
                `;
                dom.preview.appendChild(div);
            }, layerColor);
        });
    }
};

const updateRoomMockup = () => {
    if (!dom.roomMockup) {
        console.error("roomMockup not found in DOM");
        return;
    }
    const bgInput = appState.layerInputs[0]?.input;
    if (!bgInput) {
        console.error("Background input not found");
        return;
    }
    const bgColor = getColorHex(bgInput.value);
    console.log("Updating room mockup with bgColor:", bgColor);

    dom.roomMockup.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 452;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderCanvas = () => {
        dom.roomMockup.innerHTML = "";
        const img = document.createElement("img");
        img.src = canvas.toDataURL("image/png");
        img.style.cssText = "width: 100%; height: 100%; position: absolute; top: 0; left: 0;";
        dom.roomMockup.appendChild(img);
    };

    if (currentLayers.length > 1) {
        const layerPromises = currentLayers.slice(1).map((layer, index) => {
            const layerColor = getColorHex(appState.layerInputs[index + 1]?.input?.value || "#000000");
            console.log(`Processing mockup layer ${index + 1}: ${layer.imageUrl}, color: ${layerColor}`);
            return new Promise((resolve) => {
                processImage(layer.imageUrl, (processedUrl) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.src = processedUrl;
                    img.onload = () => {
                        const tempCanvas = document.createElement("canvas");
                        tempCanvas.width = canvas.width;
                        tempCanvas.height = canvas.height;
                        const tempCtx = tempCanvas.getContext("2d");
                        tempCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        tempCtx.globalCompositeOperation = "source-in";
                        tempCtx.fillStyle = layerColor;
                        tempCtx.fillRect(0, 0, canvas.width, canvas.height);

                        ctx.globalCompositeOperation = "source-over";
                        ctx.drawImage(tempCanvas, 0, 0);
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn(`Failed to load layer image: ${processedUrl}`);
                        resolve();
                    };
                }, layerColor);
            });
        });

        Promise.all(layerPromises).then(() => {
            const overlay = new Image();
            overlay.src = "./mockups/English-Countryside-Bedroom-1.png";
            overlay.onload = () => {
                console.log("Overlay loaded");
                ctx.globalCompositeOperation = "source-over";
                ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
                renderCanvas();
            };
            overlay.onerror = () => console.warn("Failed to load overlay");
        });
    } else {
        renderCanvas();
    }
};

const processImage = (url, callback, layerColor = '#7f817e', gamma = 2.2) => {
    console.log("Processing image:", url, "with color:", layerColor);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
        console.log("Image loaded:", url);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let minLuminance = 255, maxLuminance = 0;
        for (let i = 0; i < data.length; i += 4) {
            const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            minLuminance = Math.min(minLuminance, luminance);
            maxLuminance = Math.max(maxLuminance, luminance);
        }

        const range = maxLuminance - minLuminance || 1;
        const hex = layerColor.replace("#", "");
        const rLayer = parseInt(hex.substring(0, 2), 16);
        const gLayer = parseInt(hex.substring(2, 4), 16);
        const bLayer = parseInt(hex.substring(4, 6), 16);

        for (let i = 0; i < data.length; i += 4) {
            let luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            let normalized = (luminance - minLuminance) / range;
            normalized = Math.max(0, Math.min(1, normalized));
            let gammaCorrected = Math.pow(normalized, 1 / gamma);
            let inverted = 1 - gammaCorrected;
            data[i] = Math.round(inverted * rLayer);
            data[i + 1] = Math.round(inverted * gLayer);
            data[i + 2] = Math.round(inverted * bLayer);
            let alpha = 1 - (luminance / 255);
            data[i + 3] = Math.round(alpha * 255);
        }

        ctx.putImageData(imageData, 0, 0);
        callback(canvas.toDataURL("image/png", 1.0));
    };

    img.onerror = () => console.error(`Failed to load image: ${url}`);
};

const updateDisplays = () => {
    console.log("Updating displays...");
    updatePreview();
    updateRoomMockup();
    populateCoordinates();
};

const initialize = async () => {
    try {
        console.log("Initializing...");
        ["hidePopup", "hideSelectionWarning"].forEach(key => {
            if (localStorage.getItem(key) === null) localStorage.setItem(key, "false");
        });

        console.log("Fetching colors.json...");
        const colorsResponse = await fetch("./data/colors.json");
        if (!colorsResponse.ok) throw new Error("Failed to fetch colors.json");
        colorData = await colorsResponse.json();
        console.log("Loaded colors:", colorData.length);
        console.log("Sample colorData:", colorData.slice(0, 5));

        console.log("Fetching local collections...");
        let collectionsData = [];
        if (USE_LOCAL_DATA) {
            const collection = await loadLocalCollectionData(DEFAULT_COLLECTION);
            if (!collection || !collection.patterns?.length) throw new Error(`No patterns found for ${DEFAULT_COLLECTION}`);
            collectionsData = [collection];
            patterns = collection.patterns;
            console.log("Loaded patterns:", patterns);
        }

        appState.collectionsData = collectionsData;
        appState.selectedCollection = collectionsData[0];
        currentPattern = collectionsData[0].patterns[0];

        let backgroundColor = currentPattern.curatedColors?.[0] || "#ffffff";
        currentLayers = [{ imageUrl: null, color: backgroundColor, label: "Background" }];
        const overlayLayers = currentPattern.layers || [];
        console.log("Initial overlay layers:", overlayLayers);
        overlayLayers.forEach((layerUrl, index) => {
            currentLayers.push({
                imageUrl: layerUrl,
                color: currentPattern.curatedColors?.[index + 1] || "#000000",
                label: `Layer ${index + 1}`
            });
        });
        console.log("Initial currentLayers:", currentLayers);

        appState.layerInputs = [];
        createColorInput("Background", "bgColorInput", backgroundColor, true);
        currentLayers.slice(1).forEach((layer, index) => {
            createColorInput(layer.label, `layer${index + 1}ColorInput`, layer.color);
        });
        appState.cachedLayerPaths = currentLayers.slice(1).map(layer => ({ url: layer.imageUrl }));
        appState.curatedColors = appState.selectedCollection.curatedColors || [];
        populateCuratedColors(appState.curatedColors);

        appState.layerInputs.forEach((layerInput, index) => {
            if (layerInput?.input) {
                layerInput.input.addEventListener("input", updateDisplays);
            }
        });

        handleCollectionSelection(appState.selectedCollection);
        updateDisplays();
        if (dom.patternName) dom.patternName.textContent = currentPattern.name;

        return collectionsData;
    } catch (error) {
        console.error("Error in initialize:", error);
        return null;
    }
};

const startApp = (collectionsData, collectionName = DEFAULT_COLLECTION) => {
    console.log(`Starting app with collection: ${collectionName}`);
    const collection = collectionsData.find(c => c.name.toLowerCase() === collectionName.toLowerCase());
    if (!collection) {
        console.error(`Collection ${collectionName} not found`);
        return;
    }
    appState.selectedCollection = collection;
    handleCollectionSelection(collection);
};

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM content loaded, initializing...");
    dom = {
        patternName: document.getElementById("patternName"),
        collectionHeader: document.getElementById("collectionHeader"),
        collectionThumbnails: document.getElementById("collectionThumbnails"),
        layerInputsContainer: document.getElementById("layerInputsContainer"),
        curatedColorsContainer: document.getElementById("curatedColorsContainer"),
        preview: document.getElementById("preview"),
        roomMockup: document.getElementById("roomMockup"),
        coordinatesContainer: document.getElementById("coordinatesContainer"),
        printButton: document.getElementById("printButton")
    };
    const domCheck = Object.keys(dom).reduce((acc, key) => { acc[key] = !!dom[key]; return acc; }, {});
    console.log("Initial DOM check:", domCheck);

    const collectionsData = await initialize();
    if (collectionsData) startApp(collectionsData, DEFAULT_COLLECTION);
});