
// Create a dimensions display element
// const dimensionsDisplay = document.createElement('div');
// dimensionsDisplay.id = 'dimensions-display';
// dimensionsDisplay.style.cssText = `
//     position: fixed;
//     top: 10px;
//     right: 10px;
//     background: rgba(0, 0, 0, 0.7);
//     color: white;
//     padding: 5px 10px;
//     font-size: 14px;
//     font-family: monospace;
//     z-index: 1000;
//     border-radius: 3px;
// `;
// document.body.appendChild(dimensionsDisplay);

// // Function to update dimensions in the UI
// const updateDimensionsDisplay = () => {
//     const width = window.innerWidth;
//     const height = window.innerHeight;
//     dimensionsDisplay.textContent = `${width} x ${height}px`;
// };

// updateDimensionsDisplay();

// window.addEventListener('resize', updateDimensionsDisplay);

// Wrap your key functions:
function traceWrapper(fn, name) {
  return function(...args) {
    console.group(`🧠 ${name}`);
    console.log('Arguments:', args);
    const result = fn.apply(this, args);
    console.log('Result:', result);
    console.groupEnd();
    return result;
  };
}

// Then guard against premature loading:
function guard(fn) {
  return function (...args) {
    if (!isAppReady) {
      console.warn(`⏳ Skipping ${fn.name} — app not ready`);
      return;
    }
    return fn.apply(this, args);
  };
}


// ---- Debug Logging Setup ----
const DEBUG_TRACE = false; // set to false to disable tracing
const USE_GUARD = false;

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
    currentScale: 10,
    designer_colors: [],
    originalPattern: null,
    originalCoordinates: null,
    originalLayerInputs: null,
    originalCurrentLayers: null,
    lastSelectedColor: null
};

const BACKGROUND_INDEX = 0;
const FURNITURE_BASE_INDEX = 1;
const PATTERN_BASE_INDEX = 2;
let isAppReady = false; // Flag to track if the app is fully initialized

// Store furniture view settings globally for consistency
const furnitureViewSettings = {
    scale: 2.0,
    offsetX: 0,
    offsetY: 0
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

// Load furniture config on app init
let furnitureConfig = null;

async function loadFurnitureConfig() {
    try {
        console.log("📁 Loading furniture config...");
        const response = await fetch('data/furniture-config.json');
        if (response.ok) {
            furnitureConfig = await response.json();
            console.log('✅ Loaded furniture config:', furnitureConfig);
            
            // Debug the structure
            Object.keys(furnitureConfig).forEach(key => {
                console.log(`  ${key}:`, Object.keys(furnitureConfig[key]));
            });
        } else {
            console.error("❌ Furniture config response not ok:", response.status);
        }
    } catch (e) {
        console.error("❌ Error loading furniture config:", e);
    }
}


dom._patternName = document.getElementById("patternName"); // Initial assignment

// Fetch colors from colors.json
async function loadColors() {
    try {
        const response = await fetch("./data/colors.json");
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Colors data is empty or invalid");
        }

        appState.colorsData = data;
        console.log(" Colors loaded:", appState.colorsData.length);
    } catch (err) {
        console.error("âŒ Error loading colors:", err);
        alert("Failed to load Sherwin-Williams colors.");
    }
}

// Lookup color from colors.json data
let lookupColor = (colorName) => {
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
if (USE_GUARD && DEBUG_TRACE) {
    lookupColor = guard(traceWrapper(lookupColor, "lookupColor")); // Wrapped for debugging
} else if (USE_GUARD) {
    lookupColor = guard(lookupColor, "lookupColor"); // Wrapped for debugging
}

// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('leftSidebar');
    
    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', function() {
            hamburgerBtn.classList.toggle('active');
            sidebar.classList.toggle('open');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 1023 && 
                !sidebar.contains(e.target) && 
                !hamburgerBtn.contains(e.target) && 
                sidebar.classList.contains('open')) {
                hamburgerBtn.classList.remove('active');
                sidebar.classList.remove('open');
            }
        });
    }
});

// Check if a specific pattern has furniture renders
async function checkFurnitureAvailability(patternName) {
  const patternSlug = patternName.toLowerCase().replace(/ /g, '-');
  const manifestUrl = `data/furniture/sofa-capitol/patterns/${patternSlug}/manifest.json`;
  
  try {
    const response = await fetch(manifestUrl);
    if (response.ok) {
      const manifest = await response.json();
      return {
        available: true,
        manifest: manifest,
        furnitureType: 'sofa-capitol'
      };
    }
  } catch (e) {
    // No furniture version
  }
  return { available: false };
}

// Call loadFurnitureConfig when your app initializes
loadFurnitureConfig();



// Utility Functions

// Helper function for scaling
function scaleToFit(img, targetWidth, targetHeight) {
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
}
// Shared helper for loading and tinting a masked image
async function drawMaskedLayer(imgPath, tintColor, label) {
    // Check if this is a wall panel image
    const isWallPanel = imgPath.includes('wall-panels');
    
    // Get the original, untinted grayscale image for alpha calculation
    const originalUrl = await new Promise(resolve => 
        processImage(imgPath, resolve, null, 2.2, false, false, false)
    );
    const img = await loadImage(originalUrl);

    // Draw the original image centered on an offscreen canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = 1080;
    offscreen.height = 1080;
    const offCtx = offscreen.getContext("2d");
    drawCenteredImage(offCtx, img, 1080, 1080);

    // Get pixel data
    const imageData = offCtx.getImageData(0, 0, 1080, 1080);
    const { data } = imageData;

    // Invert luminance for alpha: white (255) â†’ alpha 0, black (0) â†’ alpha 255
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i + 3] = 255 - luminance; // INVERTED for correct alpha
    }
    offCtx.putImageData(imageData, 0, 0);

    // Prepare the colored (tint) layer and mask it with the alpha
    const tintLayer = document.createElement("canvas");
    tintLayer.width = 1080;
    tintLayer.height = 1080;
    const tintCtx = tintLayer.getContext("2d");
    tintCtx.fillStyle = tintColor;
    tintCtx.fillRect(0, 0, 1080, 1080);
    tintCtx.globalCompositeOperation = "destination-in";
    tintCtx.drawImage(offscreen, 0, 0);

    // Composite result onto main canvas
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(tintLayer, 0, 0);

    console.log(`✅ [${label}] tint-mask drawn.`);
}

function applyNormalizationProcessing(data, rLayer, gLayer, bLayer) {
    // IMPROVED normalization logic for better detail preservation
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
        
        if (alpha > 0.8) {
            alpha = 1;
        } else if (alpha > 0.5) {
            alpha = 0.8 + (alpha - 0.5) * 0.67;
        } else if (alpha > 0.2) {
            alpha = alpha * 1.6;
        } else {
            alpha = alpha * 0.5;
        }
        alpha = Math.min(1, Math.max(0, alpha));

        if (alpha > 0.05) {
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

function resolveColor(raw) {
    const color = (!raw || typeof raw !== "string") ? "Snowbound" : raw.trim().toUpperCase();
    const resolved = lookupColor(color);
    if (!resolved) console.warn(`âš ï¸ [resolveColor] Could not resolve color: '${color}', using Snowbound`);
    return resolved || lookupColor("Snowbound") || "#DDDDDD";
}

function drawCenteredImage(ctx, img, canvasWidth, canvasHeight) {
    const aspect = img.width / img.height;
    let drawWidth = canvasWidth;
    let drawHeight = drawWidth / aspect;

    if (drawHeight > canvasHeight) {
        drawHeight = canvasHeight;
        drawWidth = drawHeight * aspect;
    }

    const offsetX = Math.round((canvasWidth - drawWidth) / 2);
    const offsetY = Math.round((canvasHeight - drawHeight) / 2);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function hexToHSL(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Convert 3-digit to 6-digit hex
    if (hex.length === 3) {
        hex = hex.split('').map(x => x + x).join('');
    }

    if (hex.length !== 6) {
        console.error("âŒ Invalid HEX color:", hex);
        return null;
    }

    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
            case g: h = ((b - r) / d + 2); break;
            case b: h = ((r - g) / d + 4); break;
        }
        h *= 60;
    }

    return {
        h: Math.round(h),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;

    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
        Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

    return `#${[f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function findClosestSWColor(targetHex) {
    let bestMatch = null;
    let bestDistance = Infinity;

    for (const color of colorsData) {
        const dist = colorDistance(`#${color.hex}`, targetHex);
        if (dist < bestDistance) {
            bestDistance = dist;
            bestMatch = color;
        }
    }

    return bestMatch;
}

function colorDistance(hex1, hex2) {
    const rgb1 = hexToRGB(hex1);
    const rgb2 = hexToRGB(hex2);
    return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
}

function hexToRGB(hex) {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const bigint = parseInt(hex, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: (bigint & 255) };
}
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
    // console.trace("getContrastClass received:", hex);

    if (typeof hex !== "string" || !hex.startsWith("#") || hex.length < 7) {
        console.warn("⚠️ Invalid hex value in getContrastClass:", hex);
        return "text-black"; // or choose a safe default
    }

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "text-black" : "text-white";
};

// Single function to handle all furniture layer drawing with consistent scaling
async function drawFurnitureLayer(ctx, imagePath, options = {}) {
    const {
        tintColor = null,
        isMask = false,
        opacity = 1.0,
        blendMode = "source-over",
        invertAlpha = false
    } = options;
    
    console.log("🎨 drawFurnitureLayer (CONSERVATIVE):");
    console.log("  Path:", imagePath);
    console.log("  TintColor:", tintColor);
    
    const width = 600;
    const height = 450;
    const { scale, offsetX, offsetY } = furnitureViewSettings;
    
    try {
        const img = await loadImage(imagePath);
        if (!img) {
            console.error("❌ Failed to load image:", imagePath);
            return;
        }
        
        console.log(`✅ Image loaded: ${img.naturalWidth}x${img.naturalHeight}`);
        
        // OPTION 1: Simple uniform scaling (safe - keeps everything visible)
        const scaledWidth = img.naturalWidth * scale;
        const scaledHeight = img.naturalHeight * scale;
        
        // Center the scaled image
        const sx = (scaledWidth - width) / 2 + offsetX;
        const sy = (scaledHeight - height) / 2 + offsetY;
        
        console.log(`📏 Conservative scaling:`);
        console.log(`  Original: ${img.naturalWidth}x${img.naturalHeight}`);
        console.log(`  Scaled: ${scaledWidth.toFixed(0)}x${scaledHeight.toFixed(0)}`);
        console.log(`  Offset: (${sx.toFixed(0)}, ${sy.toFixed(0)})`);
        console.log(`  Scale factor: ${scale}`);
        
        // Create working canvas
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext("2d");
        
        if (isMask && tintColor) {
            console.log("🎭 Processing as mask");
            
            // Fill with tint color
            tempCtx.fillStyle = tintColor;
            tempCtx.fillRect(0, 0, width, height);
            
            // Create scaled mask
            const maskCanvas = document.createElement("canvas");
            maskCanvas.width = scaledWidth;
            maskCanvas.height = scaledHeight;
            const maskCtx = maskCanvas.getContext("2d");
            maskCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
            
            // Apply mask
            tempCtx.globalCompositeOperation = "destination-in";
            tempCtx.drawImage(maskCanvas, sx, sy, width, height, 0, 0, width, height);
            
        } else if (tintColor) {
            console.log("🎨 Processing with tint");
            
            // Create scaled image
            const scaledCanvas = document.createElement("canvas");
            scaledCanvas.width = scaledWidth;
            scaledCanvas.height = scaledHeight;
            const scaledCtx = scaledCanvas.getContext("2d");
            scaledCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
            
            // Create tint overlay
            const tintCanvas = document.createElement("canvas");
            tintCanvas.width = width;
            tintCanvas.height = height;
            const tintCtx = tintCanvas.getContext("2d");
            
            // Fill with tint color
            tintCtx.fillStyle = tintColor;
            tintCtx.fillRect(0, 0, width, height);
            
            // Use image as mask
            tintCtx.globalCompositeOperation = "destination-in";
            tintCtx.drawImage(scaledCanvas, sx, sy, width, height, 0, 0, width, height);
            
            // Draw tinted result
            tempCtx.drawImage(tintCanvas, 0, 0);
            
        } else {
            console.log("🖼️ Processing direct image");
            
            // Just draw scaled image directly
            tempCtx.drawImage(img, sx, sy, width, height, 0, 0, width, height);
        }
        
        // Draw to main canvas
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = blendMode;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
        
        console.log(`✅ Conservative layer drawn: ${imagePath.split('/').pop()}`);
        
    } catch (error) {
        console.error("❌ Error in drawFurnitureLayer:", error);
    }
}
function testFurnitureScale(newScale, offsetX = 0, offsetY = 0) {
    console.log(`🧪 Testing furniture scale: ${newScale}`);
    furnitureViewSettings.scale = newScale;
    furnitureViewSettings.offsetX = offsetX;
    furnitureViewSettings.offsetY = offsetY;
    
    // Re-render furniture preview
    updateFurniturePreview();
}



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

        const isFurniturePattern = appState.currentPattern?.isFurniture || false;

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
        appState.lastSelectedLayer = {
            input,
            circle: colorCircle,
            label,
            isBackground
        };
        highlightActiveLayer(colorCircle);
        console.log(`Clicked ${label} color circle`);
    });


    return {
        container,
        input,
        circle: colorCircle,
        label,
        isBackground
    };

};

// Populate curated colors in header
function populateCuratedColors(colors) {
  console.log("🎨 populateCuratedColors received:", colors);

  if (!dom.curatedColorsContainer) {
    console.error("curatedColorsContainer not found in DOM");
    return;
  }

  if (!colors || !colors.length) {
    console.warn("No curated colors provided yet, waiting...");
    return;
  }

  dom.curatedColorsContainer.innerHTML = "";

  // 🎟️ Run The Ticket Button
  const ticketCircle = document.createElement("div");
  ticketCircle.id = "runTheTicketCircle";
  ticketCircle.className = "w-20 h-20 rounded-full cursor-pointer relative flex items-center justify-center border-2";
  ticketCircle.style.backgroundColor = "black";

  const ticketLabel = document.createElement("span");
  ticketLabel.className = "text-xs font-bold text-white text-center whitespace-pre-line font-special-elite";
  ticketLabel.textContent = appState.activeTicketNumber
    ? `TICKET\n${appState.activeTicketNumber}`
    : "RUN\nTHE\nTICKET";

  ticketCircle.appendChild(ticketLabel);
  ticketCircle.addEventListener("click", () => {
    const ticketNumber = prompt("🎟️ Enter the Sherwin-Williams Ticket Number:");
    if (ticketNumber) runStaticTicket(ticketNumber.trim());
  });
  dom.curatedColorsContainer.appendChild(ticketCircle);

  // 🎨 Add curated color swatches
  colors.forEach(label => {
    if (!Array.isArray(appState.colorsData)) {
  console.error("❌ appState.colorsData is not available or not an array");
  return;
}

const found = appState.colorsData.find(c =>

      label.toLowerCase().includes(c.sw_number?.toLowerCase()) ||
      label.toLowerCase().includes(c.color_name?.toLowerCase())
    );

    if (!found || !found.hex) {
      console.warn("⚠️ Missing hex for curated color:", label);
      return;
    }

    const hex = `#${found.hex}`;
    const circle = document.createElement("div");
    circle.className = "w-20 h-20 rounded-full cursor-pointer relative flex items-center justify-center";
    circle.style.backgroundColor = hex;

    const text = document.createElement("span");
    text.className = `text-xs font-bold text-center ${getContrastClass(hex)} whitespace-pre-line`;
    text.textContent = `${found.sw_number?.toUpperCase()}\n${toInitialCaps(found.color_name)}`;

    circle.appendChild(text);
    circle.addEventListener("click", () => {
      const selectedLayer = appState.lastSelectedLayer;
      if (!selectedLayer) return alert("Please select a layer first.");

      selectedLayer.input.value = toInitialCaps(found.color_name);
      selectedLayer.circle.style.backgroundColor = hex;

      const i = appState.currentLayers.findIndex(l => l.label === selectedLayer.label);
      if (i !== -1) appState.currentLayers[i].color = found.color_name;

      const j = appState.layerInputs.findIndex(li => li.label === selectedLayer.label);
      if (j !== -1) {
        appState.layerInputs[j].input.value = toInitialCaps(found.color_name);
        appState.layerInputs[j].circle.style.backgroundColor = hex;
      }

      appState.lastSelectedColor = { name: found.color_name, hex };
      updateDisplays();
    });

    dom.curatedColorsContainer.appendChild(circle);
  });

  console.log("✅ Curated colors populated:", colors.length);
}

function getLayerMappingForPreview(isFurnitureCollection) {
    if (isFurnitureCollection) {
        return {
            type: 'furniture',
            patternStartIndex: 2,      // Pattern layers start at index 2  
            backgroundIndex: 1,        // Sofa base = pattern background (index 1)
            wallIndex: 0               // Wall color (index 0)
        };
    } else {
        return {
            type: 'standard',
            patternStartIndex: 1,      // Pattern layers start at index 1
            backgroundIndex: 0,        // True background
            wallIndex: null            // No wall color
        };
    }
}

function validateLayerMapping() {
    const isFurnitureCollection = appState.selectedCollection?.wallMask != null;
    const mapping = getLayerMappingForPreview(isFurnitureCollection);
    
    console.log("🔍 LAYER MAPPING VALIDATION (WITH WALL COLOR):");
    console.log("  Collection type:", isFurnitureCollection ? "furniture" : "standard");
    console.log("  Total inputs:", appState.currentLayers.length);
    console.log("  Pattern start index:", mapping.patternStartIndex);
    console.log("  Background/Sofa base index:", mapping.backgroundIndex);
    console.log("  Wall index:", mapping.wallIndex);
    
    console.log("  Layer assignments:");
    appState.currentLayers.forEach((layer, index) => {
        let usage = "unused";
        if (index === mapping.wallIndex) {
            usage = "wall color (via mask)";
        } else if (index === mapping.backgroundIndex) {
            if (isFurnitureCollection) {
                usage = "sofa base + pattern background";
            } else {
                usage = "pattern background";
            }
        } else if (index >= mapping.patternStartIndex) {
            usage = `pattern layer ${index - mapping.patternStartIndex}`;
        }
        
        console.log(`    ${index}: ${layer.label} = "${layer.color}" (${usage})`);
    });

    // Show the mapping clearly
    if (isFurnitureCollection) {
        console.log("🔄 FURNITURE COLLECTION MAPPING (WITH WALL MASK):");
        console.log("  Pattern Preview:");
        console.log(`    Background ← Input ${mapping.backgroundIndex} (${appState.currentLayers[mapping.backgroundIndex]?.label})`);
        for (let i = 0; i < (appState.currentLayers.length - mapping.patternStartIndex); i++) {
            const inputIndex = mapping.patternStartIndex + i;
            if (appState.currentLayers[inputIndex]) {
                console.log(`    Pattern Layer ${i} ← Input ${inputIndex} (${appState.currentLayers[inputIndex].label})`);
            }
        }
        console.log("  Furniture Mockup:");
        console.log("    Room Scene ← sofa-capitol.png");
        console.log(`    Wall Areas ← Input ${mapping.wallIndex} (${appState.currentLayers[mapping.wallIndex]?.label}) via wall mask`);
        console.log(`    Sofa Base ← Input ${mapping.backgroundIndex} (${appState.currentLayers[mapping.backgroundIndex]?.label})`);
        for (let i = 0; i < (appState.currentLayers.length - mapping.patternStartIndex); i++) {
            const inputIndex = mapping.patternStartIndex + i;
            if (appState.currentLayers[inputIndex]) {
                console.log(`    Pattern Layer ${i} ← Input ${inputIndex} (${appState.currentLayers[inputIndex].label})`);
            }
        }
    }
}


function insertTicketIndicator(ticketNumber) {
    const existing = document.getElementById("ticketIndicator");
    if (existing) {
        existing.innerHTML = `TICKET<br>${ticketNumber}`;
        return;
    }

    const indicator = document.createElement("div");
    indicator.id = "ticketIndicator";
    indicator.className = "w-20 h-20 rounded-full flex items-center justify-center text-center text-xs font-bold text-gray-800";
    indicator.style.backgroundColor = "#e5e7eb"; // Tailwind gray-200
    indicator.style.marginRight = "8px";
    indicator.innerHTML = `TICKET<br>${ticketNumber}`;

    dom.curatedColorsContainer.prepend(indicator);
}

function promptTicketNumber() {
    const input = prompt("Enter Sherwin-Williams ticket number (e.g., 280):");
    const ticketNum = parseInt(input?.trim());
    if (isNaN(ticketNum)) {
        alert("Please enter a valid numeric ticket number.");
        return;
    }
    runStaticTicket(ticketNum);
}

function runTheTicket(baseColor) {
    console.log("ðŸŽŸï¸ Running the Ticket for:", baseColor);

    if (!isAppReady) {
        console.warn("⚠️ App is not ready yet. Ignoring runTheTicket call.");
        alert("Please wait while the app finishes loading.");
        return;
    }

    if (!baseColor || !baseColor.hex) {
        console.warn("âŒ No base color provided to runTheTicket.");
        return;
    }

    if (!Array.isArray(appState.colorsData) || appState.colorsData.length === 0) {
        console.warn("X¸ Sherwin-Williams colors not loaded yet.");
        alert("Color data is still loading. Please try again shortly.");
        return;
    }

    const baseHSL = hexToHSL(baseColor.hex);
    if (!baseHSL) {
        console.error("X Failed to convert base HEX to HSL.");
        return;
    }

    console.log("+ Base color HSL:", baseHSL);

    const swColors = appState.colorsData
        .filter(c => c.hex && c.name)
        .map(c => ({
            name: c.name,
            hex: c.hex,
            hsl: hexToHSL(c.hex)
        }));

    console.log("** Total SW Colors to search:", swColors.length);

    const scored = swColors
        .map(c => {
            const hueDiff = Math.abs(baseHSL.h - c.hsl.h);
            const satDiff = Math.abs(baseHSL.s - c.hsl.s);
            const lightDiff = Math.abs(baseHSL.l - c.hsl.l);
            return {
                ...c,
                score: hueDiff + satDiff * 0.5 + lightDiff * 0.8
            };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, appState.currentLayers.length);

    console.log("ðŸŽ¯ Top Ticket matches:", scored);

    if (!Array.isArray(appState.layerInputs) || appState.layerInputs.length === 0) {
        console.warn("âŒ No layer inputs available. Cannot apply ticket.");
        return;
    }

    scored.forEach((ticketColor, idx) => {
        const inputSet = appState.layerInputs[idx];
        if (!inputSet || !inputSet.input || !inputSet.circle) {
            console.warn(`âŒ Missing input or circle at index ${idx}`);
            return;
        }

        const formatted = toInitialCaps(ticketColor.name);
        inputSet.input.value = formatted;
        inputSet.circle.style.backgroundColor = ticketColor.hex;
        appState.currentLayers[idx].color = formatted;

        console.log(`ðŸŽ¯ Layer ${idx + 1} set to ${formatted} (${ticketColor.hex})`);
    });

    insertTicketIndicator(ticketNumber);

    updateDisplays();
    console.log("✅ Ticket run complete.");
}

function runStaticTicket(ticketNumber) {
    console.log(`ðŸŽ« Static Ticket Requested: ${ticketNumber}`);

    if (!Array.isArray(appState.colorsData) || appState.colorsData.length === 0) {
        alert("Color data not loaded yet.");
        return;
    }

    const ticketColors = [];
    for (let i = 1; i <= 7; i++) {
        const locatorId = `${ticketNumber}-C${i}`;
        const color = appState.colorsData.find(c => c.locator_id?.toUpperCase() === locatorId.toUpperCase());
        if (color) {
            const displayName = `${color.sw_number?.toUpperCase() || ""} ${toInitialCaps(color.color_name)}`;
            ticketColors.push(displayName.trim());
        }
    }

    if (ticketColors.length === 0) {
        alert(`No colors found for ticket ${ticketNumber}`);
        return;
    }

    appState.curatedColors = ticketColors;
    appState.activeTicketNumber = ticketNumber; // ðŸ†• Track it for label update
    populateCuratedColors(ticketColors);

    console.log(`ðŸŽ¯ Loaded ticket ${ticketNumber} with ${ticketColors.length} colors`);
}


async function initializeApp() {
    console.log("🚀 Starting app...");
    
    // ✅ Step 1: Load Sherwin-Williams Colors
    await loadColors();
    console.log("✅ Colors loaded:", appState.colorsData.length);

    try {
        // ✅ Step 2: Load Collections
        const response = await fetch("./data/local-collections.json", { cache: "no-store" });
        if (!response.ok) throw new Error(`Failed to fetch collections: ${response.status}`);
        const data = await response.json();

                // ADD THIS DEBUG:
console.log("🔍 Raw JSON collections loaded:", data.collections.length);
const farmhouseCollection = data.collections.find(c => c.name === "farmhouse");
console.log("🔍 Raw farmhouse collection:", farmhouseCollection);
console.log("🔍 Raw farmhouse elements:", farmhouseCollection?.elements);


        if (!data.collections?.length) {
            console.error("X No collections found in local-collections.json");
            dom.collectionHeader.textContent = "No Collections Available";
            dom.preview.innerHTML = "<p>No collections available. Please run the data import script.</p>";
            return;
        }

        // ✅ Step 3: Save collections once
        if (!appState.collections.length) {
            appState.collections = data.collections;
            console.log("✅ Collections loaded:", appState.collections.length);
        }

        // ✅ Step 4: Select collection via URL param or fallback
        const urlParams = new URLSearchParams(window.location.search);
        const collectionName = urlParams.get("collection")?.trim();
        let selectedCollection = appState.collections.find(
            c => c.name.trim().toLowerCase() === collectionName?.toLowerCase()
        ) || appState.collections[0];

        if (!selectedCollection) {
            console.error("X No valid collection found.");
            return;
        }

        // ✅ Step 5: Set collection in appState
        appState.selectedCollection = selectedCollection;
        appState.lockedCollection = true;
        appState.curatedColors = selectedCollection.curatedColors || [];
        console.log("@ Selected Collection:", selectedCollection.name);
        console.log("@ Curated colors:", appState.curatedColors.length);

        // ✅ Step 6: Update UI header
        if (dom.collectionHeader) {
            dom.collectionHeader.textContent = toInitialCaps(selectedCollection.name);
        }

        // ✅ Step 7: Show curated color circles + ticket button
        populateCuratedColors(appState.curatedColors);

        // ✅ Step 8: Load first pattern
        const initialPatternId = selectedCollection.patterns[0]?.id;
        if (initialPatternId) {
            loadPatternData(selectedCollection, initialPatternId);  // ✅ Fixed: pass collection
        } else {
            console.warn("âš ï¸ No patterns found for", selectedCollection.name);
        }

        // ✅ Step 9: Load thumbnails + setup print
        populatePatternThumbnails(selectedCollection.patterns);
        setupPrintListener();

        isAppReady = true;
        console.log("✅ App is now fully ready.");


    } catch (error) {
        console.error("X Error loading collections:", error);
        dom.collectionHeader.textContent = "Error Loading Collection";
        dom.preview.innerHTML = "<p>Error loading data. Please try refreshing.</p>";
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
                img.onerror = () => {
                    console.warn(`Failed to load fallback for ${pattern.displayName}`);
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
                };
            } else {
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
    
    const coordinates = appState.selectedCollection?.coordinates || [];
    console.log("Collection coordinates data:", coordinates);

    if (!coordinates.length) {
        console.log("No matching coordinates available for collection:", appState.selectedCollection?.name);
        return;
    }

    const numCoordinates = coordinates.length;
    const xStep = 80;
    const yStep = 60;
    
    // Get actual container dimensions
    const containerWidth = dom.coordinatesContainer.offsetWidth || 600;
    const containerHeight = dom.coordinatesContainer.offsetHeight || 300;
    
    // Calculate total span and center the layout
    const totalXSpan = (numCoordinates - 1) * xStep;
    const totalYSpan = numCoordinates > 1 ? yStep : 0;
    
    const xStart = (containerWidth / 2) - (totalXSpan / 2);
    const yStart = (containerHeight / 2) - (totalYSpan / 2);

    coordinates.forEach((coord, index) => {
        const div = document.createElement("div");
        div.className = "coordinate-item";
        
        const xOffset = xStart + (index * xStep);
        const yOffset = yStart + (index % 2 === 0 ? 0 : yStep);
        
        div.style.setProperty("--x-offset", `${xOffset}px`);
        div.style.setProperty("--y-offset", `${yOffset}px`);

        const img = document.createElement("img");
        img.src = coord.path;
        img.alt = coord.pattern || `Coordinate ${index + 1}`;
        img.className = "coordinate-image";
        img.dataset.filename = coord.path;
        
        img.onerror = () => {
            console.warn(`Failed to load coordinate image: ${img.src}`);
            const placeholder = document.createElement("div");
            placeholder.className = "coordinate-placeholder";
            placeholder.textContent = coord.pattern || "Coordinate Unavailable";
            div.replaceChild(placeholder, img);
        };

        div.appendChild(img);
        dom.coordinatesContainer.appendChild(div);
    });
        console.log("Coordinates populated:", coordinates.length);
        setupCoordinateImageHandlers();

};

// Populate the layer inputs UI
function populateLayerInputs(pattern = appState.currentPattern) {
  try {
    if (!pattern) {
      console.error("❌ No pattern provided or set in appState.");
      return;
    }

    handlePatternSelection(pattern.name);
    appState.layerInputs = [];
    appState.currentLayers = [];

    if (!dom.layerInputsContainer) {
      console.error("❌ layerInputsContainer not found");
      return;
    }

    const designerColors = pattern.designer_colors || [];

    // Get all layers (including shadows)
    const allLayers = buildLayerModel(
      pattern,
      designerColors,
      {
        isWallPanel: appState.selectedCollection?.name === "wall-panels",
        tintWhite: appState.tintWhite || false
      }
    );

    // Store all layers in currentLayers
    appState.currentLayers = allLayers;
    dom.layerInputsContainer.innerHTML = "";

    // Create inputs ONLY for non-shadow layers
    const inputLayers = allLayers.filter(layer => !layer.isShadow);
    
    // Add inputs directly to container (no row wrappers)
    inputLayers.forEach(layer => {
      const layerData = createColorInput(
        layer.label,
        layer.inputId,
        layer.color,
        layer.isBackground
      );

      appState.layerInputs.push({
        input: layerData.input,
        circle: layerData.circle,
        label: layerData.label,
        isBackground: layerData.isBackground,
        color: layer.color,
        hex: lookupColor(layer.color) || "#FFFFFF"
      });

      // Add directly to container - no row grouping needed!
      dom.layerInputsContainer.appendChild(layerData.container);
    });

    console.log("✅ Populated layerInputs:", appState.layerInputs.map(l => ({
      label: l.label,
      value: l.input.value
    })));
    
    console.log("✅ All layers (including shadows):", appState.currentLayers.map(l => ({
      label: l.label,
      isShadow: l.isShadow,
      path: l.path
    })));
    
    } catch (e) {
        console.error("❌ Error in populateLayerInputs:", e);
    }
}

if (USE_GUARD && DEBUG_TRACE) {
  populateLayerInputs = guard(traceWrapper(populateLayerInputs, "populateLayerInputs"));
} else if (USE_GUARD) {
  populateLayerInputs = guard(populateLayerInputs, "populateLayerInputs");
}

if (USE_GUARD && DEBUG_TRACE) {
  populateLayerInputs = guard(traceWrapper(populateLayerInputs, "populateLayerInputs"));
} else if (USE_GUARD) {
  populateLayerInputs = guard(populateLayerInputs, "populateLayerInputs");
}




function handlePatternSelection(patternName, preserveColors = false) {
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

    // Save current color values if preserving
    const savedColors = preserveColors ? 
        appState.currentLayers.map(layer => layer.color) : [];

    appState.currentLayers = [];
    let colorIndex = 0; // ✅ Make sure this is only declared once

    const patternType = getPatternType(pattern, appState.selectedCollection);
    console.log(`🔍 Pattern type detected: ${patternType} for pattern: ${pattern.name} in collection: ${appState.selectedCollection?.name}`);
    const isWallPanel = patternType === "wall-panel";
    const isWall = pattern.isWall || isWallPanel;

    if (isWall) {
        const wallColor = colorSource[colorIndex] || "#FFFFFF";
        appState.currentLayers.push({ 
            imageUrl: null, 
            color: wallColor, 
            label: "Wall Color",
            isShadow: false
        });
        colorIndex++;
    }

    const backgroundColor = colorSource[colorIndex] || "#FFFFFF";
    appState.currentLayers.push({ 
        imageUrl: null, 
        color: backgroundColor, 
        label: "Background",
        isShadow: false
    });
    colorIndex++;

    if (!appState.currentPattern.tintWhite) {
        const overlayLayers = pattern.layers || [];
        console.log(`Processing ${overlayLayers.length} overlay layers`);
        overlayLayers.forEach((layer, index) => {
            const layerPath = layer.path || "";
            const label = pattern.layerLabels[index] || `Layer ${index + 1}`;
            const isShadow = layer.isShadow === true;
            if (!isShadow) {
                const layerColor = colorSource[colorIndex] || "#000000";
                appState.currentLayers.push({
                    imageUrl: layerPath,
                    color: layerColor,
                    label: label,
                    isShadow: false
                });
                console.log(`Assigned color to ${label}: ${layerColor}`);
                colorIndex++;
            }
        });
        console.log("Final appState.currentLayers:", JSON.stringify(appState.currentLayers, null, 2));
    }

    // Restore saved colors if preserving
    if (preserveColors && savedColors.length > 0) {
        appState.currentLayers.forEach((layer, index) => {
            if (savedColors[index] && layer.color) {
                layer.color = savedColors[index];
            }
        });
        console.log("🔄 Colors preserved from previous selection");
    }
}


function applyColorsToLayerInputs(colors, curatedColors = []) {
    console.log("Applying colors to layer inputs:", colors, 
                "Curated colors:", curatedColors,
                "Layer inputs length:", appState.layerInputs.length,
                "Current layers length:", appState.currentLayers.length);
    appState.layerInputs.forEach((layer, index) => {
        if (index >= appState.currentLayers.length) {
            console.warn(`Skipping input ${layer.label} at index ${index}: no corresponding currentLayer`);
            return;
        }
        const color = colors[index] || curatedColors[index] || (layer.isBackground ? "#FFFFFF" : "Snowbound");
        const cleanColor = color.replace(/^(SW|SC)\d+\s*/i, "").trim();
        const hex = lookupColor(color) || "#FFFFFF";
        layer.input.value = toInitialCaps(cleanColor);
        layer.circle.style.backgroundColor = hex;
        console.log(`Applied ${cleanColor} (${hex}) to ${layer.label} input (index ${index})`);
        
        appState.currentLayers[index].color = cleanColor;
    });
    console.log("Inputs after apply:", 
                appState.layerInputs.map(l => ({ id: l.input.id, label: l.label, value: l.input.value })));
    updateDisplays();
}

// Highlight active layer
const highlightActiveLayer = (circle) => {
    document.querySelectorAll(".circle-input").forEach((c) => (c.style.outline = "none"));
    circle.style.outline = "6px solid rgb(244, 255, 219)";
};


// Fixed processImage function with corrected normalization logic
let processImage = (url, callback, layerColor = '#7f817e', gamma = 2.2, isShadow = false, isWallPanel = false, isWall = false) => {
    console.log("🔍 processImage called from:", new Error().stack.split('\n')[2]);
    console.log(`Processing image ${url} with color ${layerColor}, Normalization: ${USE_NORMALIZATION}, IsShadow: ${isShadow}, IsWallPanel: ${isWallPanel}, IsWall: ${isWall}`);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = `${url}?t=${new Date().getTime()}`;

    img.onload = () => {
        console.log(`✅ Processed image: ${img.src} (${img.naturalWidth}x${img.naturalHeight})`);
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
            callback(canvas);
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
            // Wall panel processing
            const isDesignLayer = url.toLowerCase().includes("design");
            const isBackLayer = url.toLowerCase().includes("back");
            const layerType = isDesignLayer ? "Design" : isBackLayer ? "Back" : "Other";
            let designPixelCount = 0;
            let transparentPixelCount = 0;

            console.log(`🔍 Wall panel debug - Layer type: ${layerType}`);
            console.log(`🔍 Data array length: ${data.length}`);
            console.log(`🔍 Image dimensions: ${canvas.width}x${canvas.height}`);
            console.log(`🔍 Expected pixels: ${canvas.width * canvas.height}`);
            console.log(`🔍 First 3 pixels:`, 
                `(${data[0]},${data[1]},${data[2]},${data[3]})`,
                `(${data[4]},${data[5]},${data[6]},${data[7]})`, 
                `(${data[8]},${data[9]},${data[10]},${data[11]})`);

            applyNormalizationProcessing(data, rLayer, gLayer, bLayer);
            
            console.log(`Processed ${layerType} layer: Design pixels=${designPixelCount}, Transparent pixels=${transparentPixelCount}`);
        } else if (isShadow) {
            // Shadow processing
                console.log("🔍 Processing shadow layer");

            for (let i = 0; i < data.length; i += 4) {
                const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const alpha = 1 - (luminance / 255);
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = Math.round(alpha * 255);
            }
        } else if (layerColor && USE_NORMALIZATION) {
            // Standard pattern normalization
            applyNormalizationProcessing(data, rLayer, gLayer, bLayer);
        } else if (layerColor) {
            // Standard brightness-based masking (when normalization is off)
            let recoloredPixels = 0;
            let maskedPixels = 0;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                const brightness = (r + g + b) / 3;

                if (brightness < 200 && a > 0) {
                    data[i] = rLayer;
                    data[i + 1] = gLayer;
                    data[i + 2] = bLayer;
                    data[i + 3] = 255;
                    recoloredPixels++;
                } else {
                    data[i + 3] = 0;
                    maskedPixels++;
                }
            }

            console.log(`Recolored pixels: ${recoloredPixels}, Transparent (masked): ${maskedPixels}`);
        }

        console.log("Processed Sample (R,G,B,A):", data[0], data[1], data[2], data[3]);
        ctx.putImageData(imageData, 0, 0);
        callback(canvas);
    };

    img.onerror = () => console.error(`Canvas image load failed: ${url}`);
};
   // GUARD / TRACE WRAPPER
    if (USE_GUARD && DEBUG_TRACE) {
    processImage = guard(traceWrapper(processImage, "processImage")); // Wrapped for debugging
    } else if (USE_GUARD) {
        processImage = guard(processImage, "processImage"); // Wrapped for debugging
    }


    // Load pattern data from JSON
function loadPatternData(collection, patternId) {
    console.log(`loadPatternData: patternId=${patternId}`);
    
    const pattern = appState.collections
        .flatMap(c => c.patterns)
        .find(p => p.id === patternId);
        
    if (pattern) {
        console.log("Found pattern:", pattern);
        appState.currentPattern = pattern;

        // ===== INSERT DEBUG LOGS HERE =====
        console.log("🔍 SOURCE DATA DEBUG:");
        console.log("  Current pattern:", appState.currentPattern?.name);
        console.log("  Designer colors:", appState.currentPattern?.designer_colors);
        console.log("  Layer labels:", appState.currentPattern?.layerLabels);
        console.log("  Layers array:", appState.currentPattern?.layers?.map((l, i) => `${i}: ${l.path?.split('/').pop()}`));

        // Check if this is a furniture collection
        const isFurnitureCollection = appState.selectedCollection?.wallMask != null || 
                                        appState.selectedCollection?.furnitureType != null;
        
        if (isFurnitureCollection) {
            appState.furnitureMode = true;
        }

        // ✅ Build layer + input models once pattern is set
        populateLayerInputs(pattern);

        // ===== DEBUG AFTER populateLayerInputs =====
        console.log("🎛️ UI POPULATION DEBUG:");
        console.log("  currentLayers count:", appState.currentLayers?.length);
        console.log("  currentLayers content:");
        appState.currentLayers?.forEach((layer, index) => {
            console.log(`    ${index}: "${layer.label}" = "${layer.color}"`);
        });

        // ===== DEBUG ACTUAL DOM INPUTS =====
        setTimeout(() => {
            console.log("🔍 ACTUAL UI INPUTS:");
            const inputs = document.querySelectorAll('.layer-input');
            inputs.forEach((input, index) => {
                const container = input.closest('.layer-input-container');
                const label = container?.querySelector('.layer-label')?.textContent;
                console.log(`    UI Input ${index}: "${label}" = "${input.value}"`);
            });
        }, 100); // Small delay to ensure DOM is updated

        console.log(">>> Updated appState.currentPattern:", JSON.stringify(pattern, null, 2));
        appState.curatedColors = appState.selectedCollection.curatedColors || [];
        console.log(">>> Updated appState.curatedColors:", appState.curatedColors);
        
        if (!Array.isArray(appState.colorsData) || appState.colorsData.length === 0) {
            console.warn("🛑 Sherwin-Williams colors not loaded yet. Delaying populateCuratedColors.");
            return;
        }

        // ✅ Only call curated color population when everything is ready
        if (appState.colorsData.length && collection.curatedColors?.length) {
            appState.curatedColors = collection.curatedColors;
            populateCuratedColors(appState.curatedColors);
        } else {
            console.warn("X Not populating curated colors - missing data");
        }

        const isFurniturePattern = appState.currentPattern?.isFurniture || false;
        
        updatePreview();
        updateRoomMockup();
        populatePatternThumbnails(appState.selectedCollection.patterns);
        populateCoordinates();

    } else {
        console.error(">>> Pattern not found:", patternId);
    }
}
    // GUARD / TRACE WRAPPER
    if (USE_GUARD && DEBUG_TRACE) {
    loadPatternData = guard(traceWrapper(loadPatternData, "loadPatternData")); // Wrapped for debugging
    } else if (USE_GUARD) {
        loadPatternData = guard(loadPatternData, "loadPatternData"); // Wrapped for debugging
    }

    // Pattern scaling
    window.setPatternScale = function(multiplier) {
        appState.scaleMultiplier = multiplier;
        console.log(`>>> Scale multiplier set to: ${appState.scaleMultiplier}`);

        // Highlight active button
        document.querySelectorAll('#scaleControls button').forEach(btn => {
            const btnMultiplier = parseFloat(btn.dataset.multiplier);
            if (btnMultiplier === multiplier) {
                btn.classList.add('!bg-blue-500', 'text-white', 'active-scale');
                btn.classList.remove('!bg-gray-200');
            } else {
                btn.classList.add('!bg-gray-200');
                btn.classList.remove('!bg-blue-500', 'text-white', 'active-scale');
            }
        });

        updateRoomMockup();

        const isFurniturePattern = appState.currentPattern?.isFurniture || false;

        updatePreview();
        
    };
    // GUARD / TRACE WRAPPER
    if (USE_GUARD && DEBUG_TRACE) {
    setPatternScale = guard(traceWrapper(setPatternScale, "setPatternScale")); // Wrapped for debugging
    } else if (USE_GUARD) {
        setPatternScale = guard(setPatternScale, "setPatternScale"); // Wrapped for debugging
    }
    
    // Initialize scale on page load
    document.addEventListener('DOMContentLoaded', () => {
        appState.scaleMultiplier = 1; // Default to Normal
        setPatternScale(1);
        console.log('setPatternScale called with multiplier:', appState.scaleMultiplier);
    });


    // Ensure updatePreview is defined before updateDisplays uses it
// ============================================================================
// CORE ISSUES AND FIXES
// ============================================================================

// 1. Fix buildLayerModel to return a flat array consistently
function buildLayerModel(pattern, designerColors = [], options = {}) {
    const { isWallPanel = false, tintWhite = false } = options;
    const patternLayers = pattern.layers || [];
    const layerLabels = pattern.layerLabels || [];

    console.log("🏗️ buildLayerModel LABEL FIX DEBUG:");
    console.log("  Pattern layers:", patternLayers.length);
    console.log("  Layer labels:", layerLabels);
    console.log("  Designer colors available:", designerColors.length);

    let colorIndex = 0;
    let inputIndex = 0;
    const allLayers = [];

    // Check if this is a furniture collection
    const isFurnitureCollection = appState.selectedCollection?.wallMask != null;

    if (isFurnitureCollection) {
        // FURNITURE COLLECTION STRUCTURE:
        
        // Add wall color layer
        allLayers.push({
            label: "Wall Color",
            color: designerColors[colorIndex++] || "Snowbound",
            path: null,
            isBackground: false,
            isShadow: false,
            isWallPanel: false,
            inputId: `layer-${inputIndex++}`
        });
        console.log(`  ✅ Added Wall Color (designer color ${colorIndex - 1})`);

        // Add sofa base layer with descriptive name
        allLayers.push({
            label: "BG/Sofa Base",
            color: designerColors[colorIndex++] || "Snowbound", 
            path: null,
            isBackground: true,
            isShadow: false,
            isWallPanel: false,
            inputId: `layer-${inputIndex++}`
        });
        console.log(`  ✅ Added BG/Sofa Base (designer color ${colorIndex - 1})`);

    } else if (isWallPanel) {
        // WALL PANEL STRUCTURE:
        allLayers.push({
            label: "Wall",
            color: designerColors[colorIndex++] || "Snowbound",
            path: null,
            isBackground: false,
            isShadow: false,
            isWallPanel: true,
            inputId: `layer-${inputIndex++}`
        });

        allLayers.push({
            label: "Background",
            color: designerColors[colorIndex++] || "Snowbound", 
            path: null,
            isBackground: true,
            isShadow: false,
            isWallPanel: false,
            inputId: `layer-${inputIndex++}`
        });

    } else {
        // STANDARD COLLECTION STRUCTURE:
        allLayers.push({
            label: "Background",
            color: designerColors[colorIndex++] || "Snowbound", 
            path: null,
            isBackground: true,
            isShadow: false,
            isWallPanel: false,
            inputId: `layer-${inputIndex++}`
        });
    }

    // Add pattern layers - FIXED to use labels exactly as provided
    console.log("  🎨 Processing pattern layers:");
    let patternLabelIndex = 0;
    
    for (let i = 0; i < patternLayers.length; i++) {
        const layer = patternLayers[i];
        const isTrueShadow = layer.isShadow === true;

        if (!isTrueShadow) {
            // FIXED: Use the label exactly as provided - NO RENAMING
            const originalLabel = layerLabels[patternLabelIndex] || `Pattern Layer ${patternLabelIndex + 1}`;
            
            // ❌ REMOVED the problematic renaming logic that was causing issues
            // ❌ OLD: const finalLabel = (patternLabel === "Sofa Base" || patternLabel === "BG/Sofa Base") ? `${patternLabel} Pattern` : patternLabel;
            // ✅ NEW: Use original label directly
            const finalLabel = originalLabel;
            
            const layerObj = {
                label: finalLabel,  // ← Use original label without modification
                color: designerColors[colorIndex++] || "Snowbound",
                path: layer.path || "",
                isBackground: false,
                isShadow: false,
                isWallPanel: false,
                tintWhite,
                inputId: `layer-${inputIndex++}`,
                patternLayerIndex: i
            };

            allLayers.push(layerObj);
            console.log(`    ✅ Added pattern layer: "${finalLabel}" (designer color ${colorIndex - 1})`);
            patternLabelIndex++;
        } else {
            // Shadow layers (no input needed)
            const layerObj = {
                label: `Shadow ${i + 1}`,
                color: null,
                path: layer.path || "",
                isBackground: false,
                isShadow: true,
                isWallPanel: false,
                tintWhite,
                inputId: null,
                patternLayerIndex: i
            };

            allLayers.push(layerObj);
            console.log(`    ✅ Added shadow layer: "Shadow ${i + 1}" (no color index used)`);
        }
    }

    console.log(`🏗️ Final layer model (used ${colorIndex} designer colors):`);
    allLayers.forEach((layer, index) => {
        const type = layer.isBackground ? 'bg' : layer.isShadow ? 'shadow' : 'layer';
        console.log(`  ${index}: ${layer.label} (${type}) = ${layer.color || 'no color'}`);
    });

    // VALIDATION: Check counts
    const inputLayers = allLayers.filter(l => !l.isShadow);
    console.log(`✅ Created ${inputLayers.length} input layers, used ${colorIndex} designer colors`);
    
    if (designerColors.length < colorIndex) {
        console.warn(`⚠️ Not enough designer colors: need ${colorIndex}, have ${designerColors.length}`);
    }

    return allLayers;
}



// ✅ Wrap in an IIFE to avoid illegal top-level return
if (appState.currentPattern) {
(() => {
  try {
    const pattern = appState.currentPattern;

    if (!pattern || !Array.isArray(pattern.layers)) {
      console.error("❌ Invalid pattern or missing layers:", pattern);
      return;
    }

    const designerColors = pattern.designer_colors || [];

    appState.currentLayers = buildLayerModel(
      pattern,
      designerColors,
      {
        isWallPanel: appState.selectedCollection?.name === "wall-panels",
        tintWhite: appState.tintWhite || false
      }
    );

    appState.layerInputs = appState.currentLayers.map(layer => {
      const layerData = createColorInput(
        layer.label,
        layer.inputId,
        layer.color,
        layer.isBackground
      );
      return {
        ...layerData,
        color: layer.color,
        hex: lookupColor(layer.color) || "#FFFFFF"
      };
    });

  } catch (e) {
    console.error("❌ Error populating layer inputs:", e);
  }
})();
}


// 2. updatePreview
let updatePreview = async () => {
    try {
        if (!dom.preview) return console.error("preview not found in DOM");
        if (!appState.currentPattern) return console.error("No current pattern selected");

        console.log("🔍 updatePreview START");

        // Get responsive canvas size from CSS custom properties
        const computedStyle = getComputedStyle(document.documentElement);
        const canvasSize = parseInt(computedStyle.getPropertyValue('--preview-size').replace('px', '')) || 700;
        console.log("📱 Canvas size from CSS:", canvasSize);

        const previewCanvas = document.createElement("canvas");
        const previewCtx = previewCanvas.getContext("2d", { willReadFrequently: true });
        previewCanvas.width = canvasSize;
        previewCanvas.height = canvasSize;

        // Check if this is a furniture collection
        const isFurnitureCollection = appState.selectedCollection?.wallMask != null;
        const layerMapping = getLayerMappingForPreview(isFurnitureCollection);
        console.log("🔍 SOFA BASE DEBUG:");
        console.log("  Layer mapping:", layerMapping);
        console.log("  backgroundIndex:", layerMapping.backgroundIndex);
        console.log("  Current layers length:", appState.currentLayers.length);

        


        
        console.log("🔍 Layer mapping:", layerMapping);
        console.log("🔍 Current layers:", appState.currentLayers.map((l, i) => `${i}: ${l.label} = ${l.color}`));

        let patternToRender = appState.currentPattern;
        let usesBotanicalLayers = false;

        // For furniture collections, try to find the botanical pattern
        if (isFurnitureCollection && appState.currentPattern.patternPreviewName) {
            console.log("🛋️ Furniture collection - looking for botanical pattern:", appState.currentPattern.patternPreviewName);
            
            const botanicalCollection = appState.collections.find(c => c.name === "botanicals");
            const botanicalPattern = botanicalCollection?.patterns.find(p => 
                p.name.toLowerCase() === appState.currentPattern.patternPreviewName.toLowerCase()
            );
            
            if (botanicalPattern) {
                console.log("✅ Found botanical pattern:", botanicalPattern.name);
                console.log("  Botanical layers:", botanicalPattern.layers?.map(l => l.path.split('/').pop()));
                
                patternToRender = botanicalPattern;
                usesBotanicalLayers = true;
            } else {
                console.warn("⚠️ Botanical pattern not found, using furniture pattern");
            }
        }

        // Get background color based on collection type
        const backgroundLayerIndex = layerMapping.backgroundIndex;
        const backgroundLayer = appState.currentLayers[backgroundLayerIndex];
        const backgroundColor = lookupColor(backgroundLayer?.color || "Snowbound");
        
        console.log(`🎨 Background color from input ${backgroundLayerIndex}: ${backgroundColor}`);

        // Clear canvas to transparent
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // Handle tint white patterns
        if (patternToRender.tintWhite && patternToRender.baseComposite) {
            console.log("🎨 Rendering tint white pattern");
            
            const baseImage = new Image();
            baseImage.crossOrigin = "Anonymous";
            baseImage.src = patternToRender.baseComposite;
            
            await new Promise((resolve, reject) => {
                baseImage.onload = () => {
                    const scaleMultiplier = appState.scaleMultiplier || 1;
                    const imgAspect = baseImage.width / baseImage.height;
                    const maxSize = canvasSize * scaleMultiplier;
                    
                    let drawWidth, drawHeight, offsetX, offsetY;
                    if (imgAspect > 1) {
                        drawWidth = Math.min(maxSize, canvasSize);
                        drawHeight = drawWidth / imgAspect;
                    } else {
                        drawHeight = Math.min(maxSize, canvasSize);
                        drawWidth = drawHeight * imgAspect;
                    }
                    
                    offsetX = (canvasSize - drawWidth) / 2;
                    offsetY = (canvasSize - drawHeight) / 2;
                    
                    previewCtx.fillStyle = backgroundColor;
                    previewCtx.fillRect(offsetX, offsetY, drawWidth, drawHeight);
                    previewCtx.drawImage(baseImage, offsetX, offsetY, drawWidth, drawHeight);
                    
                    // Apply tint to white areas
                    const imageData = previewCtx.getImageData(offsetX, offsetY, drawWidth, drawHeight);
                    const data = imageData.data;
                    const wallColor = lookupColor(appState.currentLayers[0]?.color || "Snowbound");
                    const hex = wallColor.replace("#", "");
                    const rTint = parseInt(hex.substring(0, 2), 16);
                    const gTint = parseInt(hex.substring(2, 4), 16);
                    const bTint = parseInt(hex.substring(4, 6), 16);
                    
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i], g = data[i + 1], b = data[i + 2];
                        if (r > 240 && g > 240 && b > 240) {
                            data[i] = rTint;
                            data[i + 1] = gTint;
                            data[i + 2] = bTint;
                        }
                    }
                    
                    previewCtx.putImageData(imageData, offsetX, offsetY);
                    resolve();
                };
                baseImage.onerror = reject;
            });
            
        } else if (patternToRender.layers?.length) {
            console.log("🎨 Rendering layered pattern");
            console.log("  Uses botanical layers:", usesBotanicalLayers);
            
            const firstLayer = patternToRender.layers.find(l => !l.isShadow);
            if (firstLayer) {
                const tempImg = new Image();
                tempImg.crossOrigin = "Anonymous";
                tempImg.src = firstLayer.path;
                
                await new Promise((resolve) => {
                    tempImg.onload = () => {
                        const patternAspect = tempImg.width / tempImg.height;
                        const scaleMultiplier = appState.scaleMultiplier || 1;
                        
                        let patternDisplayWidth, patternDisplayHeight;
                        const baseSize = canvasSize;
                        
                        if (patternAspect > 1) {
                            patternDisplayWidth = Math.min(baseSize, canvasSize);
                            patternDisplayHeight = patternDisplayWidth / patternAspect;
                        } else {
                            patternDisplayHeight = Math.min(baseSize, canvasSize);
                            patternDisplayWidth = patternDisplayHeight * patternAspect;
                        }
                        
                        const offsetX = (canvasSize - patternDisplayWidth) / 2;
                        const offsetY = (canvasSize - patternDisplayHeight) / 2;
                        
                        previewCtx.fillStyle = backgroundColor;
                        previewCtx.fillRect(offsetX, offsetY, patternDisplayWidth, patternDisplayHeight);
                        
                        console.log(`🎨 Pattern area: ${patternDisplayWidth.toFixed(0)}x${patternDisplayHeight.toFixed(0)}`);
                        
                        resolve({ offsetX, offsetY, patternDisplayWidth, patternDisplayHeight, scaleMultiplier });
                    };
                    tempImg.onerror = () => resolve(null);
                }).then(async (patternBounds) => {
                    if (!patternBounds) return;
                    
                    // Render each layer with correct color mapping
                    for (let layerIndex = 0; layerIndex < patternToRender.layers.length; layerIndex++) {
                        const layer = patternToRender.layers[layerIndex];
                        const isShadow = layer.isShadow === true;
                        
                        let layerColor = null;
                        if (!isShadow) {
                            if (usesBotanicalLayers) {
                                // Map botanical layer to furniture input
                                const furnitureInputIndex = layerMapping.patternStartIndex + layerIndex;
                                layerColor = lookupColor(appState.currentLayers[furnitureInputIndex]?.color || "Snowbound");
                                console.log(`🌿 Botanical layer ${layerIndex} → furniture input ${furnitureInputIndex} → ${layerColor}`);
                            } else {
                                // Standard mapping
                                const inputIndex = layerMapping.patternStartIndex + layerIndex;
                                layerColor = lookupColor(appState.currentLayers[inputIndex]?.color || "Snowbound");
                                console.log(`🏠 Standard layer ${layerIndex} → input ${inputIndex} → ${layerColor}`);
                            }
                        }

                        await new Promise((resolve) => {
                            processImage(layer.path, (processedCanvas) => {
                                if (!(processedCanvas instanceof HTMLCanvasElement)) {
                                    return resolve();
                                }

                                const patternSize = Math.max(processedCanvas.width, processedCanvas.height);
                                const baseScale = patternBounds.patternDisplayWidth / patternSize;
                                const finalScale = baseScale * patternBounds.scaleMultiplier;
                                const tileWidth = processedCanvas.width * finalScale;
                                const tileHeight = processedCanvas.height * finalScale;

                                const tilingType = patternToRender.tilingType || "";
                                const isHalfDrop = tilingType === "half-drop";

                                previewCtx.save();
                                previewCtx.beginPath();
                                previewCtx.rect(
                                    patternBounds.offsetX, 
                                    patternBounds.offsetY, 
                                    patternBounds.patternDisplayWidth, 
                                    patternBounds.patternDisplayHeight
                                );
                                previewCtx.clip();

                                previewCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
                                previewCtx.globalAlpha = isShadow ? 0.3 : 1.0;
                                
                                const startX = patternBounds.offsetX;
                                const startY = patternBounds.offsetY;
                                const endX = patternBounds.offsetX + patternBounds.patternDisplayWidth + tileWidth;
                                const endY = patternBounds.offsetY + patternBounds.patternDisplayHeight + tileHeight;
                                
                                for (let x = startX; x < endX; x += tileWidth) {
                                    const isOddColumn = Math.floor((x - startX) / tileWidth) % 2 !== 0;
                                    const yOffset = isHalfDrop && isOddColumn ? tileHeight / 2 : 0;
                                    
                                    for (let y = startY - tileHeight + yOffset; y < endY; y += tileHeight) {
                                        previewCtx.drawImage(processedCanvas, x, y, tileWidth, tileHeight);
                                    }
                                }
                                
                                previewCtx.restore();
                                console.log(`✅ Rendered layer ${layerIndex} with color ${layerColor}`);
                                resolve();
                            }, layerColor, 2.2, isShadow, false, false);
                        });
                    }
                });
            }
        }

        // Update DOM
        dom.preview.innerHTML = "";
        dom.preview.appendChild(previewCanvas);
        dom.preview.style.width = `${canvasSize}px`;
        dom.preview.style.height = `${canvasSize}px`;
        dom.preview.style.backgroundColor = "rgba(17, 24, 39, 1)";

        if (patternToRender.name) {
            dom.patternName.textContent = toInitialCaps(appState.currentPattern.name); // Keep original name
        }
        
        console.log("✅ Pattern preview rendered");
        
    } catch (err) {
        console.error("updatePreview error:", err);
    }
};



// Utility: Promisified image loader
function loadImage(src) {
    return new Promise((resolve, reject) => {
        if (!src) {
            console.error("❌ loadImage: No src provided");
            reject(new Error("No image source provided"));
            return;
        }
        
        console.log(`📥 Loading image: ${src}`);
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            console.log(`✅ Image loaded successfully: ${src} (${img.naturalWidth}x${img.naturalHeight})`);
            resolve(img);
        };
        
        img.onerror = (error) => {
            console.error(`❌ Failed to load image: ${src}`);
            console.error("❌ Error details:", error);
            reject(new Error(`Failed to load image: ${src}`));
        };
        
        img.src = src;
    });
}

    
//  room mockup
let updateRoomMockup = () => {
    try {
        if (!dom.roomMockup) {
            console.error("roomMockup element not found in DOM");
            return;
        }

        if (!appState.selectedCollection || !appState.currentPattern) {
            console.log("🔍 Skipping updateRoomMockup - no collection/pattern selected");
            return;
        }

        // Check if this is a furniture collection
        const isFurnitureCollection = appState.selectedCollection.wallMask != null;
        
        if (isFurnitureCollection) {
        console.log("🪑 Rendering furniture preview");
        updateFurniturePreview();
        return;
        }



        const isWallPanel = appState.selectedCollection?.name === "wall-panels";

        // 🔍 ADD THIS DEBUG HERE:
        console.log("🔍 CURRENT LAYERS MAPPING (Room Mockup):");
        appState.currentLayers.forEach((layer, index) => {
            console.log(`  ${index}: ${layer.label} = ${layer.color} (isShadow: ${layer.isShadow})`);
        });


        // 🔍 DEBUG: Check what path we're taking
        console.log("🔍 DEBUG START updateRoomMockup");
        console.log("🔍 isWallPanel:", isWallPanel);
        console.log("🔍 selectedCollection name:", appState.selectedCollection?.name);
        console.log("🔍 currentPattern.isWallPanel:", appState.currentPattern?.isWallPanel);
        console.log("🔍 currentPattern has layers:", !!appState.currentPattern?.layers?.length);
        console.log("🔍 currentPattern has tintWhite:", !!appState.currentPattern?.tintWhite);

        
        // Get colors from correct layer indices
        const wallColor = isWallPanel ? 
            lookupColor(appState.currentLayers[0]?.color || "Snowbound") : 
            lookupColor(appState.currentLayers[0]?.color || "Snowbound");
        const backgroundColor = isWallPanel ? 
            lookupColor(appState.currentLayers[1]?.color || "Snowbound") :
            lookupColor(appState.currentLayers[0]?.color || "Snowbound");
        
        console.log(">>> Wall color:", wallColor, "Background color:", backgroundColor);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 600;
        canvas.height = 450;

        const processOverlay = async () => {
            // Fill wall color
            ctx.fillStyle = wallColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (isWallPanel && appState.currentPattern?.layers?.length) {
                    console.log("🔍 TAKING PATH: Wall panel processing");

                // Handle wall panel rendering
                const panelWidthInches = appState.currentPattern.size[0] || 24;
                const panelHeightInches = appState.currentPattern.size[1] || 36;
                const scale = Math.min(canvas.width / 100, canvas.height / 80) * (appState.scaleMultiplier || 1);
                
                const panelWidth = panelWidthInches * scale;
                const panelHeight = panelHeightInches * scale;
                
                const layout = appState.currentPattern.layout || "3,20";
                const [numPanelsStr, spacingStr] = layout.split(",");
                const numPanels = parseInt(numPanelsStr, 10) || 3;
                const spacing = parseInt(spacingStr, 10) || 20;
                
                const totalWidth = (numPanels * panelWidth) + ((numPanels - 1) * spacing);
                const startX = (canvas.width - totalWidth) / 2;
                const startY = (canvas.height - panelHeight) / 2 - (appState.currentPattern?.verticalOffset || 50);

                // Create panel canvas
                const panelCanvas = document.createElement("canvas");
                panelCanvas.width = panelWidth;
                panelCanvas.height = panelHeight;
                const panelCtx = panelCanvas.getContext("2d");

                // Process panel layers - find input layers only
                let currentLayerIndex = 0; // Start from first design layer

                for (let i = 0; i < appState.currentPattern.layers.length; i++) {
                    const layer = appState.currentPattern.layers[i];
                    const isShadow = layer.isShadow === true;
                    
                        console.log(`🔍 LAYER DEBUG ${i}:`, {
                        path: layer.path,
                        isShadow: isShadow,
                        currentLayerIndex: currentLayerIndex,
                        expectedColorIndex: currentLayerIndex + 2
                    });

                    let layerColor = null;
                    if (!isShadow) {
                        // Wall panels: [0: Wall, 1: Background, 2+: Design layers]
                        const colorLayerIndex = currentLayerIndex + 2; // Skip wall (0) and background (1)
                        layerColor = lookupColor(appState.currentLayers[colorLayerIndex]?.color || "Snowbound");
                        console.log(`🎨 Regular layer ${i}: using color from currentLayers[${colorLayerIndex}] = ${layerColor}`);
                        currentLayerIndex++;
                    }
                    
                    await new Promise((resolve) => {
                        console.log(`🔍 About to call processImage with: isShadow=${isShadow}, isWallPanel=true, isWall=false`);

                        processImage(layer.path, (processedCanvas) => {
                            if (processedCanvas instanceof HTMLCanvasElement) {
                                panelCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
                                panelCtx.globalAlpha = isShadow ? 0.3 : 1.0;
                                panelCtx.drawImage(processedCanvas, 0, 0, panelWidth, panelHeight);
                            }
                            resolve();
                        }, layerColor, 2.2, isShadow, true, false);
                    });
                }
                    

                // Draw panels
                for (let i = 0; i < numPanels; i++) {
                    const x = startX + (i * (panelWidth + spacing));
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(x, startY, panelWidth, panelHeight);
                    ctx.drawImage(panelCanvas, x, startY, panelWidth, panelHeight);
                }
            } else {
                    console.log("🔍 TAKING PATH: Regular pattern processing");

                // Handle regular pattern rendering
                const patternCanvas = document.createElement("canvas");
                patternCanvas.width = canvas.width;
                patternCanvas.height = canvas.height;
                const patternCtx = patternCanvas.getContext("2d");
                
                if (appState.currentPattern?.tintWhite && appState.currentPattern?.baseComposite) {
                            console.log("🔍 TAKING SUBPATH: Tint white");

                    // Handle tint white in room mockup
                    const baseImage = new Image();
                    baseImage.src = appState.currentPattern.baseComposite;
                    
                    await new Promise((resolve) => {
                        baseImage.onload = () => {
                            const scale = (appState.currentScale / 100 || 1) * (appState.scaleMultiplier || 1);
                            const tileWidth = baseImage.width * scale;
                            const tileHeight = baseImage.height * scale;
                            
                            // Tile pattern
                            for (let x = -tileWidth; x < canvas.width + tileWidth; x += tileWidth) {
                                for (let y = -tileHeight; y < canvas.height + tileHeight; y += tileHeight) {
                                    patternCtx.drawImage(baseImage, x, y, tileWidth, tileHeight);
                                }
                            }
                            
                            // Apply tint
                            const imageData = patternCtx.getImageData(0, 0, canvas.width, canvas.height);
                            const data = imageData.data;
                            const hex = wallColor.replace("#", "");
                            const rTint = parseInt(hex.substring(0, 2), 16);
                            const gTint = parseInt(hex.substring(2, 4), 16);
                            const bTint = parseInt(hex.substring(4, 6), 16);
                            
                            for (let i = 0; i < data.length; i += 4) {
                                const r = data[i], g = data[i + 1], b = data[i + 2];
                                if (r > 240 && g > 240 && b > 240) {
                                    data[i] = rTint;
                                    data[i + 1] = gTint;
                                    data[i + 2] = bTint;
                                }
                            }
                            
                            patternCtx.putImageData(imageData, 0, 0);
                            ctx.drawImage(patternCanvas, 0, 0);
                            resolve();
                        };
                        baseImage.onerror = resolve;
                    });
                    } else if (appState.currentPattern?.layers?.length && !isWallPanel) {
                                console.log("🔍 TAKING SUBPATH: Regular layers");

                    // Handle regular layered patterns - FIXED indexing
                    let currentLayerIndex = 0; // Start from first non-shadow layer
                    
                    const inputLayers = appState.currentLayers.filter(layer => !layer.isShadow);
                    let inputLayerIndex = 0;

                    for (let i = 0; i < appState.currentPattern.layers.length; i++) {
                        const layer = appState.currentPattern.layers[i];
                        const isShadow = layer.isShadow === true;
                        
                        let layerColor = null;
                        if (!isShadow) {
                            const inputLayer = inputLayers[inputLayerIndex + 1]; // Skip background
                            layerColor = lookupColor(inputLayer?.color || "Snowbound");
                            inputLayerIndex++; // Increment here
                        }

                    // Check for half-drop tiling (declare once, outside)
                    const tilingType = appState.currentPattern.tilingType || "";
                    const isHalfDrop = tilingType === "half-drop";
                    console.log(`🔄 ROOM MOCKUP Tiling type: ${tilingType}, Half-drop: ${isHalfDrop}`);

                    await new Promise((resolve) => {
                        processImage(layer.path, (processedCanvas) => {
                            if (processedCanvas instanceof HTMLCanvasElement) {
                                const scale = (appState.currentScale / 100 || 1) * (appState.scaleMultiplier || 1);
                                const tileWidth = processedCanvas.width * scale;
                                const tileHeight = processedCanvas.height * scale;
                                
                                patternCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
                                patternCtx.globalAlpha = isShadow ? 0.3 : 1.0;
                                
                                for (let x = -tileWidth; x < canvas.width + tileWidth; x += tileWidth) {
                                    const isOddColumn = Math.floor((x + tileWidth) / tileWidth) % 2 !== 0;
                                    const yOffset = isHalfDrop && isOddColumn ? tileHeight / 2 : 0;
                                    console.log(`🔄 Column at x=${x}, isOdd=${isOddColumn}, yOffset=${yOffset}`);
                                    
                                    for (let y = -tileHeight + yOffset; y < canvas.height + tileHeight; y += tileHeight) {
                                        patternCtx.drawImage(processedCanvas, x, y, tileWidth, tileHeight);
                                    }
                                }
                                console.log(`✅ Regular layer ${i} rendered with color ${layerColor}`);
                            }
                            resolve();
                        }, layerColor, 2.2, isShadow, false, false);
                    });
                        
                    }
                    
                    ctx.drawImage(patternCanvas, 0, 0);
                }
            }

            console.log("🔍 Full selectedCollection:", Object.keys(appState.selectedCollection));
            console.log("🔍 selectedCollection object:", appState.selectedCollection);


            // Apply mockup overlay if exists
            if (appState.selectedCollection?.mockup) {
                const mockupImage = new Image();
                mockupImage.src = appState.selectedCollection.mockup;
                
                await new Promise((resolve) => {
                    mockupImage.onload = () => {
                        const fit = scaleToFit(mockupImage, canvas.width, canvas.height);
                        ctx.drawImage(mockupImage, fit.x, fit.y, fit.width, fit.height);
                        
                        console.log("🔍 selectedCollection:", appState.selectedCollection?.name);
                        console.log("🔍 selectedCollection.elements:", appState.selectedCollection?.elements);

                        // Apply collection elements (doors, molding, etc.) if they exist
                        if (appState.selectedCollection?.elements?.length) {
                            console.log("🏗️ Processing collection elements:", appState.selectedCollection.elements);
                            
                            let elementsProcessed = 0;
                            const totalElements = appState.selectedCollection.elements.length;
                            
                            const checkComplete = () => {
                                elementsProcessed++;
                                if (elementsProcessed === totalElements) {
                                    resolve();
                                }
                            };
                            
                            for (const element of appState.selectedCollection.elements) {
                                console.log(`🏗️ Applying ${element.type} mask: ${element.mask}`);
                                const elementMask = new Image();
                                elementMask.src = element.mask;
                                
                                elementMask.onload = () => {
                                    console.log(`🏗️ ${element.type} mask loaded: ${elementMask.naturalWidth}x${elementMask.naturalHeight}`);

                                    // Get the color based on colorSource
                                    let elementColor;
                                    switch (element.colorSource) {
                                        case "background":
                                            elementColor = backgroundColor;
                                            break;
                                        case "wall":
                                            elementColor = wallColor;
                                            break;
                                        default:
                                            elementColor = backgroundColor;
                                    }

                                    // Create a temporary canvas to apply the mask
                                    const tempCanvas = document.createElement("canvas");
                                    tempCanvas.width = canvas.width;
                                    tempCanvas.height = canvas.height;
                                    const tempCtx = tempCanvas.getContext("2d");

                                    // Draw the element color
                                    tempCtx.fillStyle = elementColor;
                                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                                    // Apply the mask using destination-in to keep only the element area
                                    tempCtx.globalCompositeOperation = "destination-in";
                                    const maskFit = scaleToFit(elementMask, 600, 450);
                                    tempCtx.drawImage(elementMask, maskFit.x, maskFit.y, maskFit.width, maskFit.height);

                                    // Blend the colored element onto the main canvas
                                    const blendMode = element.blendMode || "multiply";
                                    ctx.globalCompositeOperation = blendMode;
                                    ctx.drawImage(tempCanvas, 0, 0);
                                    ctx.globalCompositeOperation = "source-over";

                                    console.log(`🏗️ ${element.type} colored with:`, elementColor);
                                    checkComplete();
                                };
                                elementMask.onerror = () => {
                                    console.error(`🏗️ Failed to load ${element.type} mask:`, elementMask.src);
                                    checkComplete();
                                };
                            }
                        } else {
                            console.log("🏗️ No collection elements to process");
                            resolve();
                        }
                    };
                    mockupImage.onerror = resolve;
                });
            }


            // Apply shadow overlay if exists
            if (appState.selectedCollection?.mockupShadow) {
                const shadowOverlay = new Image();
                shadowOverlay.src = appState.selectedCollection.mockupShadow;
                
                await new Promise((resolve) => {
                    shadowOverlay.onload = () => {
                        ctx.globalCompositeOperation = "multiply";
                        const fit = scaleToFit(shadowOverlay, 600, 450);
                        ctx.drawImage(shadowOverlay, fit.x, fit.y, fit.width, fit.height);
                        ctx.globalCompositeOperation = "source-over";
                        resolve();
                    };
                    shadowOverlay.onerror = resolve;
                });
            }

            // Render final canvas
            const dataUrl = canvas.toDataURL("image/png");
            const img = document.createElement("img");
            img.src = dataUrl;
            img.style.cssText = "width: 100%; height: 100%; object-fit: contain;";
            
            dom.roomMockup.innerHTML = "";
            dom.roomMockup.appendChild(img);
            dom.roomMockup.style.cssText = "width: 600px; height: 450px; position: relative;";
        };

        processOverlay().catch(error => {
            console.error("Error processing room mockup:", error);
        });

    } catch (e) {
        console.error('Error in updateRoomMockup:', e);
    }
};
// GUARD / TRACE WRAPPER
if (USE_GUARD && DEBUG_TRACE) {
updateRoomMockup = guard(traceWrapper(updateRoomMockup, "updateRoomMockup")); // Wrapped for debugging
} else if (USE_GUARD) {
    updateRoomMockup = guard(updateRoomMockup, "updateRoomMockup"); // Wrapped for debugging
}

const updateFurniturePreview = async () => {
    try {
        console.log("🛋️ =========================");
        console.log("🛋️ Starting furniture preview");
        console.log("🛋️ =========================");

        // Basic validation
        if (!dom.roomMockup) {
            console.error("❌ roomMockup element not found in DOM");
            return;
        }

        if (!appState.currentPattern) {
            console.error("❌ No current pattern selected");
            return;
        }

        // Ensure furniture config is loaded
        if (!furnitureConfig) {
            console.log("🔄 Loading furniture config...");
            await loadFurnitureConfig();
        }

        if (!furnitureConfig) {
            console.error("❌ furnitureConfig still not loaded after attempt");
            return;
        }

        // Setup canvas
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 450;
        const ctx = canvas.getContext("2d");

        // Get collection and pattern data
        const collection = appState.selectedCollection;
        const pattern = appState.currentPattern;
        const furnitureType = collection?.furnitureType || 'sofa-capitol';
        const furniture = furnitureConfig?.[furnitureType];

        // Debug furniture config
        console.log("🔍 FURNITURE CONFIG DEBUG:");
        console.log("  Collection name:", collection?.name);
        console.log("  Furniture type:", furnitureType);
        console.log("  Available furniture configs:", Object.keys(furnitureConfig || {}));
        console.log("  Selected furniture config exists:", !!furniture);

        if (!furniture) {
            console.error("❌ No furniture config found for:", furnitureType);
            console.log("Available configs:", Object.keys(furnitureConfig));
            return;
        }

        // Debug furniture paths
        console.log("🔍 FURNITURE PATHS DEBUG:");
        console.log("  Mockup path:", furniture.mockup);
        console.log("  Wall mask path:", furniture.wallMask);
        console.log("  Base path:", furniture.base);
        console.log("  Extras path:", furniture.extras);

        // Test if files exist
        const testPaths = [
            { name: "mockup", path: furniture.mockup },
            { name: "wallMask", path: furniture.wallMask },
            { name: "base", path: furniture.base },
            { name: "extras", path: furniture.extras }
        ];

        console.log("🔍 TESTING FILE EXISTENCE:");
        testPaths.forEach(({ name, path }) => {
            if (path) {
                const testImg = new Image();
                testImg.onload = () => console.log(`✅ ${name} file exists: ${path}`);
                testImg.onerror = () => console.log(`❌ ${name} file MISSING: ${path}`);
                testImg.src = path;
            } else {
                console.log(`⚠️ ${name} path not defined in config`);
            }
        });

        // Get layer mapping for furniture collection
        const layerMapping = getLayerMappingForPreview(true); // Always true for furniture
        console.log("🔍 LAYER MAPPING DEBUG:");
        console.log("  Layer mapping:", layerMapping);
        console.log("  Total current layers:", appState.currentLayers.length);

        // Debug current layer assignments
        console.log("🔍 CURRENT LAYER ASSIGNMENTS:");
        appState.currentLayers.forEach((layer, index) => {
            let usage = "unused";
            if (index === layerMapping.wallIndex) usage = "wall color";
            else if (index === layerMapping.backgroundIndex) usage = "sofa base color";
            else if (index >= layerMapping.patternStartIndex) usage = `pattern layer ${index - layerMapping.patternStartIndex}`;
            
            console.log(`  ${index}: ${layer.label} = "${layer.color}" (${usage})`);
        });

        // Clear canvas with white background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 600, 450);
        console.log("🧹 Canvas cleared with white background");

        // Update view settings from appState
        furnitureViewSettings.scale = appState.furnitureScale || 1.0;
        furnitureViewSettings.offsetX = appState.furnitureOffsetX || 0;
        furnitureViewSettings.offsetY = appState.furnitureOffsetY || 0;
        
        console.log("🔍 FURNITURE VIEW SETTINGS:");
        console.log("  Scale:", furnitureViewSettings.scale);
        console.log("  Offset X:", furnitureViewSettings.offsetX);
        console.log("  Offset Y:", furnitureViewSettings.offsetY);

        try {
        console.log("🏗️ =========================");
        console.log("🏗️ FURNITURE RENDERING SEQUENCE (WITH WALL MASK)");
        console.log("🏗️ =========================");
        
        // ===== STEP 1: Draw room mockup base =====
        console.log("1️⃣ Drawing mockup base (room scene)");
        const mockupPath = furniture.mockup;
        if (mockupPath) {
            console.log("  Mockup path:", mockupPath);
            await drawFurnitureLayer(ctx, mockupPath).catch(err => {
                console.error("❌ Failed to load mockup:", err);
                ctx.fillStyle = "#E5E7EB";
                ctx.fillRect(0, 0, 600, 450);
                console.log("🔄 Drew fallback background due to mockup failure");
            });
            console.log("✅ Room mockup base drawn");
        } else {
            console.error("❌ No mockup path in furniture config");
            ctx.fillStyle = "#E5E7EB";
            ctx.fillRect(0, 0, 600, 450);
        }
        
        // ===== STEP 2: Draw wall color using wall mask =====
        console.log("2️⃣ Drawing wall color via mask");
        const wallColor = resolveColor(appState.currentLayers[layerMapping.wallIndex]?.color || "Snowbound");
        console.log(`  Wall color from input ${layerMapping.wallIndex}: ${wallColor}`);
        
        if (furniture.wallMask) {
            console.log("  Wall mask path:", furniture.wallMask);
            await drawFurnitureLayer(ctx, furniture.wallMask, {
                tintColor: wallColor,
                isMask: true
            });
            console.log("✅ Wall color applied via mask");
        } else {
            console.error("❌ No wallMask path in furniture config");
            console.log("  Available furniture config keys:", Object.keys(furniture));
        }

            // TEST: Try to load the wall mask image manually
            console.log("🧪 TESTING WALL MASK IMAGE LOAD:");
            try {
                const testMaskImg = new Image();
                testMaskImg.onload = () => {
                    console.log(`✅ Wall mask loaded successfully: ${furniture.wallMask}`);
                    console.log(`  Dimensions: ${testMaskImg.naturalWidth}x${testMaskImg.naturalHeight}`);
                    console.log(`  Image appears valid for masking`);
                };
                testMaskImg.onerror = (err) => {
                    console.log(`❌ Wall mask failed to load: ${furniture.wallMask}`);
                    console.log(`  Error:`, err);
                    console.log(`  This is why wall color fills entire canvas!`);
                };
                testMaskImg.src = furniture.wallMask;
            } catch (e) {
                console.log(`❌ Error testing wall mask: ${e.message}`);
            }

        
// ===== STEP 3: Draw sofa base =====
console.log("3️⃣ Drawing sofa base - ENHANCED DEBUG");
const baseColor = resolveColor(appState.currentLayers[layerMapping.backgroundIndex]?.color || "#FAFAFA");
console.log(`  Sofa base color from input ${layerMapping.backgroundIndex}: ${baseColor}`);

if (furniture.base) {
    console.log("  🛋️ Sofa base path exists:", furniture.base);
    console.log("  🛋️ Calling drawFurnitureLayer for sofa base...");
    
    await drawFurnitureLayer(ctx, furniture.base, {  // ← CORRECT: furniture.base
        tintColor: baseColor                         // ← CORRECT: baseColor
        // isMask: false is default                  // ← CORRECT: not a mask
    });
    console.log("  ✅ Sofa base step completed");
} else {
    console.error("❌ No base path in furniture config");
}        
        // ===== STEP 4: Draw pattern layers =====
        console.log("4️⃣ Drawing pattern layers");
        console.log(`  Total pattern layers to process: ${pattern.layers.length}`);
        
        for (let i = 0; i < pattern.layers.length; i++) {
            const layer = pattern.layers[i];
            const furnitureInputIndex = layerMapping.patternStartIndex + i;
            const layerColor = resolveColor(appState.currentLayers[furnitureInputIndex]?.color);
            
            console.log(`  📐 Pattern layer ${i}:`);
            console.log(`    Path: ${layer.path}`);
            console.log(`    Input index: ${furnitureInputIndex}`);
            console.log(`    Color: ${layerColor}`);
            console.log(`    Input exists: ${!!appState.currentLayers[furnitureInputIndex]}`);
            
            if (layerColor && layer.path) {
                try {
                    await drawFurnitureLayer(ctx, layer.path, {
                        tintColor: layerColor
                    });
                    console.log(`    ✅ Pattern layer ${i} drawn successfully`);
                } catch (error) {
                    console.error(`    ❌ Failed to draw pattern layer ${i}:`, error);
                }
            } else {
                console.warn(`    ⚠️ Skipping pattern layer ${i}:`);
                console.warn(`      Missing color: ${!layerColor}`);
                console.warn(`      Missing path: ${!layer.path}`);
            }
        }
        console.log("✅ Pattern layers step completed");
        
        // ===== STEP 5: Draw extras on top =====
        console.log("5️⃣ Drawing extras");
        if (furniture.extras) {
            console.log("  Extras path:", furniture.extras);
            console.log("  Drawing extras without tint (natural colors)");
            
            try {
                await drawFurnitureLayer(ctx, furniture.extras, {
                    tintColor: null,
                    opacity: 1.0,
                    blendMode: "source-over"
                });
                console.log("✅ Extras step completed");
            } catch (error) {
                console.error("❌ Failed to draw extras:", error);
            }
        } else {
            console.warn("⚠️ No extras defined in furniture config");
        }
        
        console.log("🎉 =========================");
        console.log("🎉 FURNITURE RENDERING COMPLETE (WITH WALL MASK)");
        console.log("🎉 =========================");

            
            // ===== STEP 6: Display result =====
            console.log("6️⃣ Displaying result");
            const dataUrl = canvas.toDataURL("image/png");
            const img = document.createElement("img");
            img.src = dataUrl;
            img.style.cssText = "width: 100%; height: 100%; object-fit: contain;";
            
            // Clear and append to DOM
            dom.roomMockup.innerHTML = "";
            dom.roomMockup.appendChild(img);
            dom.roomMockup.style.cssText = "width: 600px; height: 450px; position: relative;";
            
            console.log("✅ Furniture preview displayed in DOM");
            console.log("📊 Final canvas dimensions:", canvas.width, "x", canvas.height);
            console.log("📊 DataURL length:", dataUrl.length);
            
        } catch (renderError) {
            console.error("❌ Error in furniture rendering sequence:", renderError);
            console.error("❌ Error stack:", renderError.stack);
            
            // Fallback: show error message in mockup area
            dom.roomMockup.innerHTML = `
                <div style="
                    width: 100%; 
                    height: 100%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    background: #f3f4f6; 
                    color: #dc2626;
                    font-family: monospace;
                    text-align: center;
                    padding: 20px;
                ">
                    <div>
                        <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                        <div>Furniture Preview Error</div>
                        <div style="font-size: 12px; margin-top: 10px;">Check console for details</div>
                    </div>
                </div>
            `;
        }

    } catch (mainError) {
        console.error("🔥 Critical error in updateFurniturePreview:", mainError);
        console.error("🔥 Error stack:", mainError.stack);
        
        // Ultimate fallback
        if (dom.roomMockup) {
            dom.roomMockup.innerHTML = `
                <div style="
                    width: 100%; 
                    height: 100%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    background: #fef2f2; 
                    color: #dc2626;
                    font-family: monospace;
                ">
                    Critical furniture preview error - check console
                </div>
            `;
        }
    }
};
        
    function parseCoordinateFilename(filename) {

        console.log('Before click - Scroll Y:', window.scrollY);


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
        console.log(`Parsed filename: ${filename} â†’ collection: ${collectionName}, pattern: ${normalizedPatternName}`);
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
        coordinateImages.forEach(image => {
            image.removeEventListener("click", handleCoordinateClick);
            image.addEventListener("click", handleCoordinateClick);
        });
    
        function handleCoordinateClick() {
            const image = this;
            console.log('>>> handleCoordinateClick START <<<');
        
            // Only store original state if not already stored
            if (!appState.originalPattern) {
                appState.originalPattern = { ...appState.currentPattern };
                appState.originalCoordinates = appState.selectedCollection?.coordinates ? [...appState.selectedCollection.coordinates] : [];
                appState.originalLayerInputs = appState.layerInputs.map((layer, index) => ({
                    id: `layer-${index}`,
                    label: layer.label,
                    inputValue: layer.input.value,
                    hex: layer.circle.style.backgroundColor,
                    isBackground: layer.isBackground
                }));
                appState.originalCurrentLayers = appState.currentLayers.map(layer => ({ ...layer }));
                console.log("Stored original state:", {
                    pattern: appState.originalPattern.name,
                    coordinates: appState.originalCoordinates,
                    layerInputs: appState.originalLayerInputs,
                    currentLayers: appState.originalCurrentLayers
                });
            }
        
            // Highlight selected image
            document.querySelectorAll(".coordinate-image").forEach(img => img.classList.remove("selected"));
            image.classList.add("selected");
        
            const filename = image.dataset.filename;
            console.log(`Coordinate image clicked: ${filename}`);
        
            // Find the coordinate
            const coordinate = appState.selectedCollection?.coordinates?.find(coord => coord.path === filename);
            if (!coordinate) {
                console.error(`Coordinate not found for filename: ${filename}`);
                if (dom.coordinatesContainer) {
                    dom.coordinatesContainer.innerHTML += "<p style='color: red;'>Error: Coordinate not found.</p>";
                }
                return;
            }
            console.log(`Found coordinate:`, coordinate);
        
            // Find the primary pattern layer index (non-background, non-shadow)
            const primaryLayerIndex = appState.currentLayers.findIndex(layer => 
                layer.label !== "Background" &&  
                !layer.imageUrl?.toUpperCase().includes("ISSHADOW")
            );
            if (primaryLayerIndex === -1) {
                console.error("No primary pattern layer found in appState.currentLayers:", appState.currentLayers);
                return;
            }
            console.log(`Primary layer index: ${primaryLayerIndex}`);
        
            // Determine layers to use (handle both layerPath and layerPaths)
            const layerPaths = coordinate.layerPaths || (coordinate.layerPath ? [coordinate.layerPath] : []);
            if (layerPaths.length === 0) {
                console.error(`No layers found for coordinate: ${filename}`);
                return;
            }
        
            // Load the first coordinate image to get its dimensions
            const coordImage = new Image();
            coordImage.src = layerPaths[0];
            coordImage.onload = () => {
                const imageWidth = coordImage.naturalWidth;
                const imageHeight = coordImage.naturalHeight;
        
                // Create layers and labels for all coordinate layers
                const layers = layerPaths.map(path => ({ path }));
                const layerLabels = layerPaths.map((_, index) => index === 0 ? "Flowers" : `Layer ${index + 1}`);
        
                // Update currentPattern with coordinate data
                appState.currentPattern = {
                    ...appState.currentPattern,
                    name: coordinate.filename.replace(/\.jpg$/, ''),
                    thumbnail: coordinate.path,
                    size: [imageWidth / 100, imageHeight / 100], // Convert pixels to inches (assuming 100 DPI)
                    layers: layers, // All coordinate layers
                    layerLabels: layerLabels,
                    tintWhite: false
                };
                console.log(`Updated appState.currentPattern:`, appState.currentPattern);
        
                // Update the primary pattern layer's imageUrl in currentLayers
                appState.currentLayers = appState.currentLayers.map((layer, index) => {
                    if (index === primaryLayerIndex) {
                        console.log(`Updating layer at index ${index} with layerPath: ${layerPaths[0]}`);
                        return {
                            ...layer,
                            imageUrl: layerPaths[0] // Update primary layer
                        };
                    }
                    return layer;
                });
        
                // Preserve the original layer structure and colors
                const currentColors = appState.layerInputs.map(layer => layer.input.value);
                console.log("Preserving colors:", currentColors);
        
                // Restore layer inputs with preserved colors
                appState.layerInputs = [];
                if (dom.layerInputsContainer) dom.layerInputsContainer.innerHTML = "";
                appState.currentLayers.forEach((layer, index) => {
                const id = `layer-${index}`;
                const isBackground = layer.label === "Background";
                const initialColor = currentColors[index] || (isBackground ? "#FFFFFF" : "Snowbound");
                const layerData = createColorInput(layer.label, id, initialColor, isBackground);
                layerData.input.value = toInitialCaps(initialColor.replace(/^(SW|SC)\d+\s*/i, "").trim());
                layerData.circle.style.backgroundColor = lookupColor(initialColor) || "#FFFFFF";
                
                // ✅ ADD THIS LINE - append to DOM
                dom.layerInputsContainer.appendChild(layerData.container);
                
                appState.layerInputs[index] = layerData;
                console.log(`Set ${layer.label} input to ${layerData.input.value}, circle to ${layerData.circle.style.backgroundColor}, id=${id}`);
            });

        
                // Update UI
                // updatePreview();
                // const isFurniturePattern = appState.currentPattern?.isFurniture || false;

                
                updatePreview()
                updateRoomMockup();
        
                // Add "Back to Pattern" link
                const coordinatesSection = document.getElementById("coordinatesSection");
                let backLink = document.getElementById("backToPatternLink");
                if (backLink) backLink.remove();
                backLink = document.createElement("a");
                backLink.id = "backToPatternLink";
                backLink.className = "font-island-moments text-[#f0e6d2] hover:text-[#beac9f] cursor-pointer mt-2 text-lg";
                backLink.textContent = "Back to Pattern";
                coordinatesSection.appendChild(backLink);
                backLink.addEventListener("click", restoreOriginalPattern);
            };
            coordImage.onerror = () => {
                console.error(`Failed to load coordinate image: ${layerPaths[0] || coordinate.layerPath}`);
            };
        }
    }

    function restoreOriginalPattern() {
    try {
        console.log('>>> restoreOriginalPattern START <<<');

        if (!appState.originalPattern || !appState.originalCurrentLayers || !appState.originalLayerInputs) {
            console.warn("No original state to restore", {
                originalPattern: appState.originalPattern,
                originalCurrentLayers: appState.originalCurrentLayers,
                originalLayerInputs: appState.originalLayerInputs
            });
            return;
        }
        console.log("Restoring original pattern:", appState.originalPattern.name, 
                    "Original state:", {
                        layerInputs: appState.originalLayerInputs,
                        currentLayers: appState.originalCurrentLayers
                    });

        // Restore appState to the original pattern
        appState.currentPattern = { ...appState.originalPattern };
        appState.currentLayers = appState.originalCurrentLayers.map(layer => ({ ...layer }));
        console.log("Restored appState: collection=", appState.selectedCollection.name, 
                    "pattern=", appState.currentPattern.name);

        // Restore layer inputs

        appState.originalLayerInputs.forEach((layer, index) => {
            const id = layer.id || `layer-${index}`;
            const layerData = createColorInput(layer.label, id, layer.inputValue, layer.isBackground);
            layerData.input.value = toInitialCaps(layer.inputValue.replace(/^(SW|SC)\d+\s*/i, "").trim());
            layerData.circle.style.backgroundColor = layer.hex;
            appState.layerInputs[index] = layerData;
            console.log(`Restored ${layer.label} input to ${layer.inputValue}, circle to ${layer.hex}, id=${id}`);
        });

        console.log("After restore, layerInputs:", 
                    appState.layerInputs.map(l => ({ id: l.input.id, label: l.label, value: l.input.value })));

        // Update UI       
        updatePreview();
        updateRoomMockup();
        populateCoordinates();

        // Remove Back to Pattern link and clean up
        const coordinatesSection = document.getElementById("coordinatesSection");
        const backLink = document.getElementById("backToPatternLink");
        if (backLink) {
            backLink.remove();
            console.log("Removed Back to Pattern link");
        }
        const errorMessages = coordinatesSection.querySelectorAll("p[style*='color: red']");
        errorMessages.forEach(msg => msg.remove());
        console.log("Cleared error messages:", errorMessages.length);

        console.log('>>> restoreOriginalPattern END <<<');
    } catch (e) {
        console.error("Error restoring original pattern:", e);
    }
}

// Update displays with layer compositing
function updateDisplays() {
    try {
        console.log('updateDisplays called');
        console.log('appState.currentLayers:', JSON.stringify(appState.currentLayers, null, 2));
        console.log('appState.layerInputs:', appState.layerInputs.map(li => ({
            label: li.label,
            value: li.input.value
        })));

        validateLayerMapping();


        updatePreview();
        updateRoomMockup();
        populateCoordinates();
    } catch (e) {
        console.error('Error in updateDisplays:', e);
    }
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

        if (isTintWhite && appState.currentPattern?.baseComposite) {        } else if (appState.currentPattern?.layers?.length) {
            layerLabels = appState.currentPattern.layers.map((l, i) => ({
                label: appState.currentPattern.layerLabels?.[i] || `Layer ${i + 1}`,
                color: appState.layerInputs[i + (isWall ? 2 : 1)]?.input?.value || "Snowbound"
            }));

            const shadowLayers = [];
            const nonShadowLayers = [];
            appState.currentPattern.layers.forEach((layer, index) => {
                const label = layerLabels[index].label;
                const isShadow = layer.isShadow === true;
                (isShadow ? shadowLayers : nonShadowLayers).push({ layer, index, label });
            });

            let nonShadowInputIndex = isWall ? 2 : 1;

            for (const { layer, index, label } of shadowLayers) {
                const layerPath = layer.path || "";
                await new Promise((resolve) => {
                    processImage(
                        layerPath,
                        (processedUrl) => {
                            const img = new Image();
                            console.log("🧪 processedUrl type:", typeof processedUrl, processedUrl);
                            if (processedUrl instanceof HTMLCanvasElement) {
                                img.src = processedUrl.toDataURL("image/png");
                            } else {
                                img.src = processedUrl;
                            }
                            img.onload = () => {
                                printCtx.globalCompositeOperation = "multiply";
                                printCtx.globalAlpha = 0.3;
                                printCtx.drawImage(img, 0, 0, printWidth, printHeight);
                                resolve();
                            };
                            img.onerror = () => resolve();
                        },
                        null,
                        2.2,
                        true,
                        isWall
                    );
                });
            }

            for (const { layer, index, label } of nonShadowLayers) {
                const layerPath = layer.path || "";
                const layerInput = appState.layerInputs[nonShadowInputIndex];
                const layerColor = lookupColor(layerInput?.input?.value || "Snowbound");
                await new Promise((resolve) => {
                    processImage(
                        layerPath,
                        (processedUrl) => {
                            const img = new Image();
                            console.log("🧪 processedUrl type:", typeof processedUrl, processedUrl);
                            if (processedUrl instanceof HTMLCanvasElement) {
                                img.src = processedUrl.toDataURL("image/png");
                            } else {
                                img.src = processedUrl;
                            }
                            img.onload = () => {
                                printCtx.globalCompositeOperation = "source-over";
                                printCtx.globalAlpha = 1.0;
                                printCtx.drawImage(img, 0, 0, printWidth, printHeight);
                                nonShadowInputIndex++;
                                resolve();
                            };
                            img.onerror = () => resolve();
                        },
                        layerColor,
                        2.2,
                        false,
                        isWall
                    );
                });
            }
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
async function startApp() {
    await initializeApp();
    // Call this when app starts
    await loadFurnitureConfig();

    isAppReady = true;

    console.log("✅ App fully initialized and ready.");
}

// Run immediately if DOM is already ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
} else {
    startApp();
}

// === PATTERN TYPE HELPERS ===

function getPatternType(pattern, collection) {
    if (collection?.name === "wall-panels") return "wall-panel";
    if (pattern?.tintWhite) return "tint-white"; 
    if (collection?.elements?.length) return "element-coloring";
    return "standard";
}

function getColorMapping(patternType, currentLayers, layerIndex) {
    switch (patternType) {
        case "wall-panel":
            return currentLayers[layerIndex + 2]; // Skip wall + background
        case "standard":
            const inputLayers = currentLayers.filter(layer => !layer.isShadow);
            return inputLayers[layerIndex + 1]; // Skip background
        case "element-coloring":
            // Future: element-specific color mapping
            const inputLayersElement = currentLayers.filter(layer => !layer.isShadow);
            return inputLayersElement[layerIndex + 1];
        default:
            return currentLayers[layerIndex + 1];
    }
}