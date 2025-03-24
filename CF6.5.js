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

// Lookup color from colors.json data
const lookupColor = (colorName) => {
    if (!colorName || typeof colorName !== "string") {
        console.warn(`Invalid colorName: ${colorName}, defaulting to #FFFFFF`);
        return "#FFFFFF";
    }
    const cleanedColorName = colorName.replace(/^(SW|HGSW)\d+\s*/i, "").toLowerCase().trim();
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
    const cleanInitialColor = (initialColor || "Snowbound").replace(/^(SW|HGSW)\d+\s*/i, "").trim();
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
    dom.curatedColorsContainer.innerHTML = "";
    colors.forEach(color => {
        const hex = lookupColor(color);
        const circle = document.createElement("div");
        circle.className = "w-24 h-24 rounded-full cursor-pointer relative flex items-center justify-center";
        circle.style.backgroundColor = hex;

        const text = document.createElement("span");
        text.className = `text-xs font-bold text-center ${getContrastClass(hex)}`;
        text.textContent = toInitialCaps(color);
        circle.appendChild(text);

        circle.addEventListener("click", () => {
            if (appState.lastSelectedLayer) {
                appState.lastSelectedLayer.input.value = toInitialCaps(color);
                appState.lastSelectedLayer.circle.style.backgroundColor = hex;
                console.log(`Curated color ${hex} clicked, updating ${appState.lastSelectedLayer.label}`);
                updateDisplays();
            } else {
                console.log("No layer selected; applying to background");
                appState.layerInputs[0].input.value = toInitialCaps(color);
                appState.layerInputs[0].circle.style.backgroundColor = hex;
                updateDisplays();
            }
        });
        dom.curatedColorsContainer.appendChild(circle);
    });
}

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
        console.error("No curated colors available!");
    }

    if (pattern) {
        handlePatternSelection(pattern.name);
    } else {
        const defaultPattern = appState.selectedCollection.patterns[0];
        handlePatternSelection(defaultPattern.name);
    }
};

// Handle pattern selection
const handlePatternSelection = (patternName) => {
    console.log(`Attempting to select pattern: ${patternName}`);
    const pattern = appState.selectedCollection.patterns.find(
        p => p.name.toUpperCase() === patternName.toUpperCase()
    ) || appState.selectedCollection.patterns[0];
    appState.currentPattern = pattern;
    console.log("Selected pattern:", appState.currentPattern);

    let backgroundColor = appState.curatedColors[0] || "#FFFFFF";

    appState.currentLayers = [];
    const backgroundLayer = {
        imageUrl: null,
        color: backgroundColor,
        label: "Background"
    };
    appState.currentLayers.push(backgroundLayer);

    const overlayLayers = pattern.layers || [];
    overlayLayers.forEach((layerUrl, index) => {
        const label = pattern.layerLabels[index] || `Layer ${index + 1}`;
        console.log(`Using layer label for layer ${index + 1}: "${label}"`);
        appState.currentLayers.push({
            imageUrl: layerUrl,
            color: appState.curatedColors[index + 1] || "#000000",
            label: label
        });
    });

    console.log("Total layers (including background):", appState.currentLayers.length);
    console.log("Overlay layers with names:", appState.currentLayers.slice(1).map(l => l.label));

    dom.layerInputsContainer.innerHTML = "";
    appState.layerInputs = [];
    createColorInput("Background", "bgColorInput", backgroundColor, true);
    appState.currentLayers.slice(1).forEach((layer, index) => {
        createColorInput(layer.label, `layer${index + 1}ColorInput`, layer.color);
    });

    appState.cachedLayerPaths = appState.currentLayers.slice(1).map(layer => ({
        url: layer.imageUrl,
        name: layer.label
    }));
    console.log("Cached layer paths:", appState.cachedLayerPaths);

    if (dom.patternName) dom.patternName.textContent = pattern.name.replace(/_/g, " ").toUpperCase();
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
const processImage = (url, callback, layerColor = '#7f817e', gamma = 2.2) => {
    console.log(`Processing image ${url} with color ${layerColor}, Normalization: ${USE_NORMALIZATION}`);
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

        const hex = layerColor.replace("#", "");
        const rLayer = parseInt(hex.substring(0, 2), 16);
        const gLayer = parseInt(hex.substring(2, 4), 16);
        const bLayer = parseInt(hex.substring(4, 6), 16);

        if (USE_NORMALIZATION) {
            // Normalized version
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
                let alpha = 1 - normalized; // Dark (0) → 1, Light (1) → 0

                // Boost opacity for dark areas
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
        } else {
            // Binary threshold version (no normalization)
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

// Compositing functions
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

    dom.preview.classList.remove("aspect-square");
    dom.preview.classList.add("w-[700px]", "h-[630px]", "overflow-hidden", "relative", "z-0", "flex-shrink-0");
    dom.preview.style.cssText = "";
    dom.preview.innerHTML = "";

    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (appState.currentPattern && appState.currentPattern.layers) {
        let loadedLayers = 0;
        const totalLayers = appState.currentPattern.layers.length;
        appState.currentPattern.layers.forEach((layerUrl, index) => {
            const layerColor = lookupColor(appState.layerInputs[index + 1]?.input?.value || "Snowbound");
            console.log(`Layer ${index + 1} URL: ${layerUrl}, Color: ${layerColor}`);
            processImage(layerUrl, (processedUrl) => {
                const img = new Image();
                img.src = processedUrl;
                img.onload = () => {
                    ctx.globalCompositeOperation = "source-over";
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    loadedLayers++;
                    if (loadedLayers === totalLayers) {
                        dom.preview.innerHTML = "";
                        dom.preview.appendChild(canvas);
                    }
                };
            }, layerColor);
        });
    } else {
        dom.preview.appendChild(canvas);
    }
};


const updateRoomMockup = () => {
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
    console.log("Updating room mockup with bgColor from input:", bgInput.value, "converted to:", bgColor);

    dom.roomMockup.classList.remove("aspect-square");
    dom.roomMockup.classList.add("w-[600px]", "max-w-[600px]", "pb-[75.33%]", "h-0", "overflow-hidden", "relative", "z-0", "flex-shrink-0");
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

    const isHalfDrop = appState.currentPattern?.tilingType === "half-drop" || false;
    console.log(`updateRoomMockup: Tiling type: ${appState.currentPattern?.tilingType || "none"}`);

    const layersPromises = (appState.currentPattern?.layers || []).map((layerUrl, index) => {
        const layerColor = lookupColor(appState.layerInputs[index + 1]?.input?.value || "Snowbound");
        return new Promise((resolve) => {
            processImage(layerUrl, (processedUrl) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = processedUrl;
                img.onload = () => {
                    console.log(`Layer ${index + 1} mask loaded:`, processedUrl);
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

                    ctx.globalCompositeOperation = "source-over";
                    ctx.drawImage(tempCanvas, 0, 0);
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load mask image for layer ${index + 1}:`, processedUrl);
                    resolve();
                };
            }, layerColor);
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
                console.error("Failed to load room overlay image: ./mockups/English-Countryside-Bedroom-1.png");
            };
        })
        .catch(error => {
            console.error("Error processing layers in updateRoomMockup:", error);
        });
};

// Generate print preview
const generatePrintPreview = () => {
    const pattern = appState.currentPattern; // Changed from selectedPattern to currentPattern
    const collectionName = appState.selectedCollection.name;
    const patternName = pattern.name;

    console.log("appState.curatedColors:", appState.curatedColors);

    let textContent = `
        <img src="./img/SC-header-mage.jpg" alt="SC Logo" class="sc-logo">
        <h2>${toInitialCaps(collectionName)}</h2>
        <h3>${patternName}</h3>
        <ul style="list-style: none; padding: 0;">
    `;

    appState.currentLayers.forEach((layer, index) => { // Changed from currentLayers to appState.currentLayers
        const swNumber = index === 0 ? appState.curatedColors[0] : pattern.curatedColors[index] || "N/A";
        textContent += `
            <li>${layer.label} | ${swNumber}</li>
        `;
    });

    textContent += "</ul>";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 700; // Updated to match preview size
    canvas.height = 630;

    const bgInput = appState.layerInputs[0]?.input;
    const bgColor = bgInput ? lookupColor(bgInput.value) : "gray";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawLayers = async () => {
        for (let i = 0; i < appState.cachedLayerPaths.length; i++) {
            const layer = appState.cachedLayerPaths[i];
            const layerColor = appState.layerInputs[i + 1]?.circle.style.backgroundColor || "gray";
            const processedUrl = await new Promise(resolve => {
                processImage(layer.url, resolve, layerColor);
            });

            const maskImg = new Image();
            maskImg.crossOrigin = "Anonymous";
            await new Promise((resolve, reject) => {
                maskImg.onload = resolve;
                maskImg.onerror = reject;
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

// Initialize app
// Initialize app
async function initializeApp() {
    console.log("Starting app...");
    await loadColors();

    try {
        const response = await fetch("./data/local-collections.json");
        const data = await response.json();
        console.log("Raw collections data:", data);
        
        appState.collections = data.collections;
        if (!Array.isArray(appState.collections)) {
            throw new Error("collections property in local-collections.json is not an array");
        }

        // Get collection name from URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const collectionName = urlParams.get("collection") || "farmhouse"; // Fallback to "farmhouse" if none specified

        appState.selectedCollection = appState.collections.find(c => c.name === collectionName);
        if (!appState.selectedCollection) {
            throw new Error(`${collectionName} collection not found`);
        }
        appState.curatedColors = appState.selectedCollection.curatedColors;
        console.log("Selected collection:", appState.selectedCollection);

        if (dom.collectionHeader) dom.collectionHeader.textContent = `${toInitialCaps(collectionName)} Collection`;
        populateCuratedColors(appState.curatedColors);
        populatePatternThumbnails(appState.selectedCollection.patterns);

        populateLayerInputs(appState.curatedColors);

        // Add print button event listener
        if (dom.printButton) {
            dom.printButton.addEventListener("click", generatePrintPreview);
        } else {
            console.warn("Print button not found in DOM. Add <button id='printButton'>Print</button> to enable printing.");
        }
    } catch (error) {
        console.error("Error loading collections:", error);
    }
}

// Handle thumbnail click
function handleThumbnailClick(patternId) {
    const pattern = appState.selectedCollection.patterns.find(p => p.name === patternId);
    console.log("Thumbnail clicked, pattern ID:", patternId);
    if (pattern) {
        populateLayerInputs(appState.curatedColors, pattern);
    }
}

// Start the app
initializeApp();