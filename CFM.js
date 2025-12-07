/**
 * ============================================================================
 * CFM.JS - COLORFLEX MAIN APPLICATION
 * ============================================================================
 *
 * Version: Build 999 (November 2025)
 * Total Lines: ~13,170
 *
 * This file contains the complete ColorFlex pattern customization system
 * for the Saffron Cottage Shopify store.
 *
 * ============================================================================
 * QUICK NAVIGATION - TABLE OF CONTENTS
 * ============================================================================
 *
 * SECTION 1: Configuration & Debug Flags .................... Lines 60-230
 *   - Mode detection imports, debug flags, app state object
 *   - Fabric tuning parameters
 *
 * SECTION 2: Customer Save System ........................... Lines 240-2850
 *   - capturePatternThumbnail() - Thumbnail generation
 *   - generatePatternId() - Unique ID creation
 *   - savePattern() - LocalStorage save logic
 *   - saveToShopifyMetafields() - Shopify customer save
 *   - cleanupOldCartThumbnails() - Storage management
 *   - showSavedPatternsModal() - My Designs modal UI
 *   - exportPattern() / importPattern() - JSON export/import
 *   - showMaterialSelectionModal() - Material picker UI
 *
 * SECTION 3: Pattern Loading & Preview ...................... Lines 2850-4300
 *   - previewSavedPattern() - Load saved pattern to preview
 *   - loadSavedPatternToUI() - Restore pattern state
 *   - validateDOMElements() - DOM element validation
 *
 * SECTION 4: Furniture Mode System .......................... Lines 4300-5400
 *   - initializeTryFurnitureFeature() - Furniture mode init
 *   - selectFurniture() - Furniture selection
 *   - switchToFurnitureMode() - Mode switching
 *   - resolveFurniturePatternPaths() - Path resolution
 *   - renderFabricMockup() - Furniture canvas rendering
 *
 * SECTION 5: Color Management System ........................ Lines 5400-6700
 *   - getCleanColorName() / formatColorWithSW() - Color formatting
 *   - hexToHSL() / hslToHex() - Color conversion
 *   - findClosestSWColor() - Sherwin-Williams lookup
 *   - populateCuratedColors() - Curated color palettes
 *   - Ticket system functions - Color ticket management
 *
 * SECTION 6: App Initialization ............................. Lines 6700-7600
 *   - initializeApp() - Main app startup (406 lines)
 *   - Collection loading and filtering
 *   - URL parameter processing
 *   - Event listener setup
 *
 * SECTION 7: Pattern Selection & Layer Building ............. Lines 7600-8700
 *   - handlePatternSelection() - Pattern click handler
 *   - applyColorsToLayerInputs() - Color application
 *   - buildLayerModel() - Layer data structure building
 *
 * SECTION 8: Core Rendering System .......................... Lines 8700-10500
 *   - loadImage() - Image loading and caching (700+ lines)
 *   - updatePreview() - Main canvas preview
 *   - updateRoomMockup() - Room scene rendering
 *
 * SECTION 9: Color Lock & Thumbnails ........................ Lines 10500-11300
 *   - toggleColorLock() - Color persistence
 *   - handleThumbnailClick() - Thumbnail interactions
 *   - capturePatternThumbnailBuiltIn() - Built-in thumbnail capture
 *
 * SECTION 10: Pattern Helpers & Fabric Mode ................. Lines 11300-12300
 *   - getPatternType() / getColorMapping() - Pattern utilities
 *   - addFabricTuningControls() - Fabric tuning UI
 *   - addTryFabricButton() - Fabric mode toggle
 *
 * SECTION 11: Pattern Proof Generation ...................... Lines 12300-13000
 *   - downloadPatternProof() - High-quality proof export
 *   - generatePatternProofWithInfo() - Proof with metadata
 *   - Material pricing functions
 *   ⚠️ IMPORTANT: Uses proofPath layers, not preview layers
 *
 * SECTION 12: Utilities & Global Exports .................... Lines 13000-13170
 *   - showNotification() - Toast notifications
 *   - generateShareableUrl() / copyShareableUrl() - Sharing
 *   - Global window.* exports for external access
 *
 * ============================================================================
 * CHANGELOG
 * ============================================================================
 * - Nov 21, 2025: Added Master TOC and section organization
 * - Nov 20, 2025: Fixed thumbnail tiling, proof DPI metadata
 * - Nov 19, 2025: Furniture path fix, CLI deployment integration
 * - Nov 11, 2025: Multi-mode support (wallpaper/furniture/clothing)
 * - Sept 27, 2025: Modular function extraction to src/core/
 * - Sept 14, 2025: Half-drop tiling fix
 *
 * ============================================================================
 */

// *** CLAUDE HALF-DROP TEST BUILD 999 - SEPTEMBER 14, 2025 ***
// 🚨 DEBUG: Updated CFM.js with thumbnail capture - July 30, 2025 at 14:25
// 🎨 MULTI-MODE SUPPORT: Configuration-based system - November 11, 2025
// 🪑 FURNITURE PATH FIX: Strip .fur-X suffix for directory paths - November 19, 2025

// ============================================================================
// SECTION 1: CONFIGURATION & DEBUG FLAGS
// ============================================================================

// Import mode configuration
import { getCurrentConfig, detectMode, getMaterials, getScaleOptions, isFeatureEnabled } from './config/colorFlex-modes.js';

// Initialize configuration based on detected mode
const colorFlexConfig = getCurrentConfig();
const colorFlexMode = detectMode();

console.log(`🎨 ColorFlex Mode: ${colorFlexMode}`, colorFlexConfig);

// Make configuration available globally
if (typeof window !== 'undefined') {
  window.colorFlexConfig = colorFlexConfig;
  window.colorFlexMode = colorFlexMode;
}

// 🎛️ DEBUG CONTROL FLAGS - Set to false to disable console logs by category
const DEBUG_FLAGS = {
    ENABLED: false,           // Master switch - set to false to disable ALL debug logs
    COLORS: false,            // Color lookups and mapping (🎨 logs)
    PROOF: false,             // Proof generation and downloads (🔧 📥 logs)
    PRINT: false,             // Print pattern function (🎨 PRINT PATTERN logs)
    PATTERNS: false,          // Pattern loading and selection
    LAYERS: false,            // Layer processing and rendering
    CART: false,              // Cart operations (🛒 logs)
    SAVE: false,              // Save pattern operations (💾 logs)
    THUMBNAILS: false,        // Thumbnail generation and storage (🖼️ logs)
    GENERAL: false            // General app flow (✅ ⚠️ ❌ logs)
};

// Helper function for conditional logging
const debugLog = (category, ...args) => {
    if (DEBUG_FLAGS.ENABLED && DEBUG_FLAGS[category]) {
        console.log(...args);
    }
};

// Quick access helpers for common log types
const logColor = (...args) => debugLog('COLORS', ...args);
const logProof = (...args) => debugLog('PROOF', ...args);
const logPrint = (...args) => debugLog('PRINT', ...args);
const logPattern = (...args) => debugLog('PATTERNS', ...args);
const logLayer = (...args) => debugLog('LAYERS', ...args);
const logCart = (...args) => debugLog('CART', ...args);
const logSave = (...args) => debugLog('SAVE', ...args);
const logThumb = (...args) => debugLog('THUMBNAILS', ...args);
const logGeneral = (...args) => debugLog('GENERAL', ...args);

// Always log critical startup messages
console.log('🚨 DEBUG: ColorFlex CFM.js loaded - Version with thumbnail capture!');
console.log('*** CLAUDE HALF-DROP TEST BUILD 999 - CFM.JS LOADING ***');
console.log('🎛️ Debug flags configured:', DEBUG_FLAGS);

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

/**
 * Helper function to get scale label from config
 * Converts scale percentage to display label (e.g., 200 -> "2X")
 */
function getScaleLabel(scaleValue) {
  const config = window.colorFlexConfig || colorFlexConfig;
  if (!config || !config.scale || !config.scale.labels) {
    // Fallback to default wallpaper labels
    if (scaleValue === 50) return '0.5X';
    if (scaleValue === 100) return 'Normal';
    if (scaleValue === 200) return '2X';
    if (scaleValue === 300) return '3X';
    if (scaleValue === 400) return '4X';
    return `${scaleValue}%`;
  }

  return config.scale.labels[scaleValue] || `${scaleValue}%`;
}

/**
 * =============================================================================
 * IMAGE OPTIMIZATION SYSTEM
 * =============================================================================
 *
 * Performance optimization for image loading and caching.
 * Addresses UI slowdown from repeated network requests and simultaneous loads.
 *
 * FEATURES:
 * - Global image cache (Map-based, browser memory)
 * - Concurrent load limiting (max 6 simultaneous downloads)
 * - Lazy loading for thumbnails (Intersection Observer)
 * - Performance timing and metrics
 * - Preloading for adjacent patterns
 *
 * USAGE:
 * - Replace direct new Image() calls with loadImage(src)
 * - Thumbnails auto-lazy-load via Intersection Observer
 * - Cache persists for session (cleared on page reload)
 */

// Global image cache - stores loaded Image objects by URL
const imageCache = new Map();
const imageCacheStats = {
  hits: 0,
  misses: 0,
  totalLoadTime: 0,
  itemsLoaded: 0
};

// Concurrent load limiting to prevent network congestion
const pendingImageLoads = new Set();
const MAX_CONCURRENT_LOADS = 6;

/**
 * Queue for managing concurrent image loads
 * Prevents too many simultaneous network requests
 */
const imageLoadQueue = [];

/**
 * Process next image in load queue
 */
function processImageQueue() {
  if (pendingImageLoads.size >= MAX_CONCURRENT_LOADS) {
    return; // Already at max capacity
  }

  if (imageLoadQueue.length === 0) {
    return; // No items in queue
  }

  const nextLoad = imageLoadQueue.shift();
  if (nextLoad) {
    nextLoad(); // Execute the load function
  }
}

/**
 * Get cache statistics for debugging
 */
function getImageCacheStats() {
  const hitRate = imageCacheStats.itemsLoaded > 0
    ? (imageCacheStats.hits / imageCacheStats.itemsLoaded * 100).toFixed(1)
    : 0;

  const avgLoadTime = imageCacheStats.itemsLoaded > 0
    ? (imageCacheStats.totalLoadTime / imageCacheStats.itemsLoaded).toFixed(0)
    : 0;

  return {
    cacheSize: imageCache.size,
    hits: imageCacheStats.hits,
    misses: imageCacheStats.misses,
    hitRate: `${hitRate}%`,
    averageLoadTime: `${avgLoadTime}ms`,
    pendingLoads: pendingImageLoads.size,
    queuedLoads: imageLoadQueue.length
  };
}

// Expose cache stats globally for debugging
window.getImageCacheStats = getImageCacheStats;

/**
 * Clear image cache (useful for debugging or memory management)
 */
function clearImageCache() {
  const size = imageCache.size;
  imageCache.clear();
  imageCacheStats.hits = 0;
  imageCacheStats.misses = 0;
  imageCacheStats.totalLoadTime = 0;
  imageCacheStats.itemsLoaded = 0;
  console.log(`🧹 Image cache cleared (${size} items removed)`);
}

window.clearImageCache = clearImageCache;

/**
 * Preload images for better UX
 * Call with array of image URLs to load in background
 */
function preloadImages(urls) {
  if (!Array.isArray(urls)) return;

  console.log(`🔄 Preloading ${urls.length} images...`);
  urls.forEach(url => {
    if (!imageCache.has(url)) {
      // Use low-priority load (add to end of queue)
      imageLoadQueue.push(() => loadImageInternal(url, false));
      processImageQueue();
    }
  });
}

window.preloadImages = preloadImages;

/**
 * Log cache performance stats periodically
 * Helps monitor image loading efficiency
 */
function logCachePerformance() {
    const stats = getImageCacheStats();
    console.log(`
╔════════════════════════════════════════════════════════════════
║ 📊 IMAGE CACHE PERFORMANCE STATS
╠════════════════════════════════════════════════════════════════
║ Cache Size:        ${stats.cacheSize} images
║ Cache Hits:        ${stats.hits} (${stats.hitRate} hit rate)
║ Cache Misses:      ${stats.misses}
║ Avg Load Time:     ${stats.averageLoadTime}
║ Pending Loads:     ${stats.pendingLoads}/${MAX_CONCURRENT_LOADS}
║ Queued Loads:      ${stats.queuedLoads}
╚════════════════════════════════════════════════════════════════
    `);
}

// Log cache stats every 30 seconds for monitoring
setInterval(logCachePerformance, 30000);

// Log once after initial load (after 10 seconds)
setTimeout(logCachePerformance, 10000);


/**
 * =============================================================================
 * COLORFLEX MAIN APPLICATION (CFM.js)
 * =============================================================================
 * 
 * This is the core application file for the ColorFlex pattern customization system.
 * It handles pattern rendering, customer save functionality, and UI interactions.
 * 
 * KEY FEATURES:
 * - Advanced fabric rendering with multiple blend modes
 * - Real-time pattern color customization
 * - Customer pattern saving with Shopify integration
 * - Resolution-independent image processing
 * - Interactive UI components and modals
 * 
 * MAIN FUNCTION GROUPS:
 * 1. Configuration & Setup (lines ~60-120)
 * 2. Customer Save System (lines ~120-650) 
 * 3. Fabric Rendering Engine (lines ~650-1200)
 * 4. Pattern Processing (lines ~1200-2000)
 * 5. UI Components & Events (lines ~2000-end)
 * =============================================================================
 */

// ---- Debug Logging Setup ----
const DEBUG_TRACE = false; // set to false to disable tracing
const USE_GUARD = false;

// Optional: Remove later by commenting out or deleting these lines// Toggle flag for normalization (set to false for binary threshold, true for normalization)
const USE_NORMALIZATION = true; // Change to true to enable normalization

/**
 * =============================================================================
 * SECTION 1: CONFIGURATION & SETUP
 * =============================================================================
 */

/**
 * Fabric composite tuning parameters
 * These control the visual appearance of fabric rendering
 * 
 * @type {Object}
 * @property {number} alphaStrength - Controls pattern opacity (0.0 - 2.0)
 * @property {number} baseTintStrength - Controls background color influence (0.0 - 2.0)
 * @property {number} patternContrast - Controls pattern contrast (0.0 - 3.0)
 * @property {number} shadowMultiplier - Controls shadow strength (0.0 - 2.0)  
 * @property {number} colorVibrance - Controls color saturation (0.0 - 2.0)
 * @property {string} blendMode - Blend mode selection: 'multiply', 'overlay', 'soft-light', 'auto'
 * @property {number} glossyStrength - Controls glossy layer opacity (0.0 - 2.0)
 */
const fabricTuning = {
    alphaStrength: 1.0,     // Controls pattern opacity (0.0 - 2.0)
    baseTintStrength: 1.0,  // Controls how much background color affects fabric base (0.0 - 2.0)
    patternContrast: 1.0,   // Controls pattern contrast (0.0 - 3.0)
    shadowMultiplier: 1.0,  // Controls shadow interaction strength (0.0 - 2.0)
    colorVibrance: 1.2,     // Controls color saturation (0.0 - 2.0)
    blendMode: 'auto',      // Blend mode: 'multiply', 'overlay', 'soft-light', 'auto'
    glossyStrength: 1.0     // Controls glossy layer opacity (0.0 - 2.0)
};

// Control visibility of fabric tuning controls
const SHOW_FABRIC_CONTROLS = false; // Set to true to show controls, false to hide


// Debounce function for tuning controls
let fabricRenderTimeout;
function debouncedFabricRender() {
    clearTimeout(fabricRenderTimeout);
    fabricRenderTimeout = setTimeout(() => {
        if (appState.isInFabricMode) {
            renderFabricMockup();
        }
    }, 100); // 100ms debounce
}

// App state - Made global for save functionality
window.appState = {
    collections: [],
    colorsData: [],
    currentPattern: null,
    currentLayers: [],
    curatedColors: [],
    layerInputs: [],
    selectedCollection: null,
    cachedLayerPaths: [],
    lastSelectedLayer: null,
    currentScale: 100,
    scaleMultiplier: 1,  // Initialize scale multiplier (1 = Normal/100%)
    designer_colors: [],
    originalPattern: null,
    originalCoordinates: null,
    originalLayerInputs: null,
    originalCurrentLayers: null,
    lastSelectedColor: null,
    selectedFurniture: null,
    isInFabricMode: false,
    isInFurnitureMode: false,  // Furniture upholstery mode
    furnitureConfig: null,      // Loaded from furniture-config.json
    selectedFurnitureType: null, // e.g., 'sofa-capitol', 'sofa-kite'
    colorsLocked: false  // When true, preserves colors when switching patterns
};

const BACKGROUND_INDEX = 0;
const FURNITURE_BASE_INDEX = 1;
const PATTERN_BASE_INDEX = 2;
let isAppReady = false; // Flag to track if the app is fully initialized

/**
 * =============================================================================
 * SECTION 2: CUSTOMER SAVE SYSTEM  
 * =============================================================================
 * 
 * This section handles saving customer patterns to Shopify metafields or localStorage.
 * It includes validation, API calls, notifications, and UI components.
 */

/**
 * Main save function - saves current pattern to customer's list
 * 
 * FLOW:
 * 1. Validate pattern data (pattern, collection, layers)
 * 2. Try saving to Shopify customer metafields (if authenticated)
 * 3. Fall back to localStorage if Shopify unavailable
 * 4. Show user notification with result
 * 
 * @global
 * @function saveToMyList
 * @throws {Error} If pattern data is incomplete or save operation fails
 */

/**
 * Captures the current pattern preview as a thumbnail image
 *
 * Creates a high-quality JPEG thumbnail (800x800px) of the currently
 * displayed pattern for use in the "My Designs" saved patterns list.
 * Automatically handles tiling based on the current scale setting to
 * accurately represent how the pattern will repeat when printed.
 *
 * Element Detection Strategy:
 * - Searches through 9 common selector patterns to find preview element
 * - Handles containers (divs) by searching for canvas/SVG children
 * - Falls back to background-image detection for div elements
 *
 * Tiling Algorithm (for scaled patterns):
 * - 1X (Normal): 1 tile fills thumbnail
 * - 2X: 4 tiles in 2×2 grid (smaller repeat)
 * - 3X: 9 tiles in 3×3 grid (smaller repeat)
 * - 4X: 16 tiles in 4×4 grid (smallest repeat)
 *
 * Tile calculation: tileSize = 800px / scale
 * - 2X: 800/2 = 400px tiles → 2×2 grid = 4 tiles
 * - 3X: 800/3 = 267px tiles → 3×3 grid = 9 tiles
 *
 * @returns {string|null} Base64-encoded JPEG data URL (quality: 0.7) or null if capture fails
 *
 * @example
 * // Capture current pattern at 1X scale
 * const thumbnail = capturePatternThumbnail();
 * // Returns: "data:image/jpeg;base64,/9j/4AAQSkZJRg..." (~50-100KB)
 *
 * @example
 * // Capture at 2X scale (shows 2×2 tiled grid)
 * appState.scaleMultiplier = 0.5; // 2X scale
 * const thumbnail = capturePatternThumbnail();
 * // Thumbnail shows 4 tiles in grid
 *
 * @throws {Error} Logs error to console but returns null instead of throwing
 *
 * ⚠️ IMPORTANT: Requires preview canvas to exist in DOM before calling
 *
 * 🔧 PERFORMANCE: High-quality JPEG with 0.7 compression balances
 * quality vs localStorage space (typically 50-100KB per thumbnail)
 *
 * 💾 STORAGE: Each thumbnail consumes ~50-100KB of localStorage quota
 *
 * @see savePattern - Uses this thumbnail in saved pattern data
 * @see appState.scaleMultiplier - Determines tiling density
 * @see appState.currentScale - Scale percentage for display (100, 200, 300, 400)
 */
function capturePatternThumbnail() {
    try {
        // Try to find the pattern preview element - check common selectors
        const selectors = [
            '#preview', // Main ColorFlex preview container
            '#pattern-preview',
            '.pattern-preview',
            '#colorflex-preview',
            '.colorflex-preview',
            '#pattern-display',
            '.pattern-display',
            '[id*="preview"]',
            '[class*="preview"]'
        ];
        
        let previewElement = null;
        console.log('🔍 Searching for pattern preview elements...');
        for (const selector of selectors) {
            previewElement = document.querySelector(selector);
            if (previewElement) {
                console.log('📸 Found pattern preview element:', selector, previewElement);
                break;
            } else {
                console.log('❌ Not found:', selector);
            }
        }
        
        if (!previewElement) {
            console.warn('⚠️ No pattern preview element found for thumbnail capture');
            // List all available elements for debugging
            console.log('🔍 Available elements with "pattern" in ID/class:');
            document.querySelectorAll('[id*="pattern"], [class*="pattern"]').forEach(el => {
                console.log('  -', el.tagName, el.id || el.className);
            });
            console.log('🔍 Available SVG elements:', document.querySelectorAll('svg').length);
            console.log('🔍 Available Canvas elements:', document.querySelectorAll('canvas').length);
            return null;
        }
        
        // If we found a container, look for the actual pattern inside it
        let actualPatternElement = null;
        if (previewElement.tagName === 'DIV') {
            // Look for canvas or SVG inside the container
            actualPatternElement = previewElement.querySelector('canvas') || 
                                 previewElement.querySelector('svg') ||
                                 previewElement.querySelector('[data-pattern]');
            
            if (actualPatternElement) {
                console.log('📸 Found actual pattern element inside container:', actualPatternElement.tagName);
                previewElement = actualPatternElement;
            } else {
                console.log('📸 No canvas/SVG found inside container, will use DIV with background');
                console.log('📸 Background image:', getComputedStyle(previewElement).backgroundImage);
                console.log('📸 Background size:', getComputedStyle(previewElement).backgroundSize);
            }
        }
        
        // Create a canvas to capture the element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set thumbnail size (optimized high resolution - 800x800 with JPEG compression)
        canvas.width = 800;
        canvas.height = 800;
        
        // If it's already a canvas, render it with tiling based on current scale
        if (previewElement.tagName === 'CANVAS') {
            // Check if we have scale information to show proper tiling
            const scale = appState.scaleMultiplier || 1.0;
            const currentScale = appState.currentScale || 100;

            console.log(`📸 Thumbnail capture - scaleMultiplier: ${scale}, currentScale: ${currentScale}`);

            if (scale !== 1.0 && appState.currentPattern) {
                // Generate tiled thumbnail to show scale
                console.log(`📸 Generating tiled thumbnail at ${scale}x scale`);

                // Fill background color first
                const bgColor = appState.currentLayers && appState.currentLayers[0]
                    ? appState.currentLayers[0].color
                    : '#ffffff';
                console.log(`📸 Background color: ${bgColor}`);

                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, 800, 800);

                // Calculate tile size (scale affects how many tiles fit)
                // scale = 2.0 means pattern appears smaller (tiles are half size)
                const tileWidth = 800 / scale;
                const tileHeight = 800 / scale;

                console.log(`📸 Tile size: ${tileWidth}x${tileHeight}, creating ${Math.ceil(800/tileWidth)}x${Math.ceil(800/tileHeight)} grid`);

                // Tile the pattern across the thumbnail
                let tileCount = 0;
                for (let x = 0; x < 800; x += tileWidth) {
                    for (let y = 0; y < 800; y += tileHeight) {
                        ctx.drawImage(previewElement, x, y, tileWidth, tileHeight);
                        tileCount++;
                    }
                }
                console.log(`📸 Drew ${tileCount} tiles on thumbnail`);
            } else {
                // No scaling, just copy the canvas directly
                console.log(`📸 Scale is 1.0, copying canvas directly`);
                ctx.drawImage(previewElement, 0, 0, 800, 800);
            }
        }
        // If it's an SVG, we'll need a different approach due to async nature
        else if (previewElement.tagName === 'SVG') {
            // For now, create a placeholder - SVG capture requires async handling
            ctx.fillStyle = '#e8f4fd';
            ctx.fillRect(0, 0, 800, 800);
            ctx.fillStyle = '#2c5aa0';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SVG Pattern', 100, 90);
            ctx.fillText('Preview', 100, 110);
        }
        // For other elements, create a simple representation
        else {
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 800, 800);
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Custom Pattern', 100, 90);
            ctx.fillText('Preview', 100, 110);
        }
        
        // Convert to base64 data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        console.log('📸 Captured pattern thumbnail (length:', dataUrl.length, ')');
        return dataUrl;
        
    } catch (error) {
        console.error('❌ Failed to capture pattern thumbnail:', error);
        return null;
    }
}

// 🎯 NORMALIZE COLOR TO SW FORMAT
// Converts color names to consistent "SW#### COLORNAME" format for cart display
/**
 * Normalizes color names to standardized Sherwin-Williams format
 *
 * Converts various color name formats into the canonical "SW####  NAME"
 * format used throughout the application. Handles edge cases like double
 * prefixes, missing SW numbers, and inconsistent capitalization.
 *
 * Format Standardization:
 * - Input: "sw7006 eider white" → Output: "SW7006 EIDER WHITE"
 * - Input: "eider white" → Output: "SW7006 EIDER WHITE" (via lookup)
 * - Input: "SC0001 Cottage Linen" → Output: "SC0001 COTTAGE LINEN"
 *
 * Algorithm:
 * 1. Strip double prefixes (defensive against bugs)
 * 2. If already in SW/SC format, normalize casing
 * 3. Otherwise, reverse lookup in colorsData by name
 * 4. Fallback to uppercase original name if no match
 *
 * @param {string} colorName - Color name in any format
 * @returns {string} Normalized color in "SW#### NAME" format
 *
 * @example
 * // Already in SW format
 * normalizeColorToSwFormat('sw7006 eider white')
 * // Returns: "SW7006 EIDER WHITE"
 *
 * @example
 * // Color name only (reverse lookup)
 * normalizeColorToSwFormat('eider white')
 * // Returns: "SW7006 EIDER WHITE"
 *
 * @example
 * // SC (Saffron Cottage) colors
 * normalizeColorToSwFormat('sc0001 cottage linen')
 * // Returns: "SC0001 COTTAGE LINEN"
 *
 * @see appState.colorsData - Source for reverse lookups
 * @see generatePatternId - Uses normalized colors for IDs
 */
function normalizeColorToSwFormat(colorName) {
    if (!colorName || typeof colorName !== 'string') {
        return 'Unknown Color';
    }

    // 🔧 DEFENSIVE: Strip any double SW/SC prefixes first
    colorName = colorName.replace(/^(SW|SC)(sw|sc)(\d+)/i, '$1$3');

    // If already in SW format, return as-is
    const swMatch = colorName.match(/\b(SW|SC)\s*(\d+)\s+(.+)/i);
    if (swMatch) {
        const prefix = swMatch[1].toUpperCase();
        const number = swMatch[2];
        const name = swMatch[3].toUpperCase();
        return `${prefix}${number} ${name}`;
    }

    // Try to find SW number by reverse lookup
    if (appState && appState.colorsData) {
        const cleanedColorName = colorName.toLowerCase().trim();
        const colorEntry = appState.colorsData.find(c =>
            c && typeof c.color_name === 'string' &&
            c.color_name.toLowerCase() === cleanedColorName
        );

        if (colorEntry && colorEntry.sw_number) {
            const formattedName = colorName.toUpperCase();
            return `SW${colorEntry.sw_number} ${formattedName}`;
        }
    }

    // Return original name if no SW number found
    return colorName.toUpperCase();
}

// Generate meaningful pattern ID based on pattern name and colors (matches ProductConfigurationFlow.js format)
// ✅ NOW INCLUDES SCALE: Returns format like "agnes-7069-0055-2x" or "agnes-7069-0055" (if normal scale)
/**
 * Generates a unique pattern ID from pattern name, colors, and scale
 *
 * Creates a URL-safe, human-readable ID that uniquely identifies a
 * pattern customization. The ID is used for localStorage keys, URL
 * parameters, and cart item tracking.
 *
 * ID Format: "{pattern-name}-{color1}-{color2}-{scale}"
 * - Pattern name: Sanitized, lowercase (e.g., "tudor-rose")
 * - Colors: SW/SC numbers only, duplicates removed (e.g., "7006-6258")
 * - Scale: Appended only if not 100% (e.g., "-2x" for 200%)
 *
 * Algorithm:
 * 1. Sanitize pattern name (lowercase, remove special chars)
 * 2. Extract SW/SC numbers from layer colors
 * 3. Remove duplicate color numbers
 * 4. Truncate if > 60 chars (prevents localStorage key overflow)
 * 5. Append scale suffix if not 100%
 *
 * @param {string} patternName - Pattern name from collections.json
 * @param {Array<Object>} layers - Array of layer objects with color property
 * @param {number} [currentScale=100] - Scale percentage (50, 100, 200, 300, 400)
 * @returns {string} Unique pattern ID
 *
 * @example
 * // Basic pattern with two colors at normal scale
 * generatePatternId('Tudor Rose', [
 *   { label: 'Background', color: 'SW7006 Eider White' },
 *   { label: 'Pattern', color: 'SW6258 Tricorn Black' }
 * ], 100)
 * // Returns: "tudorrose-7006-6258"
 *
 * @example
 * // Pattern at 2X scale
 * generatePatternId('Chippendale', [
 *   { label: 'Layer1', color: 'SW7069 Iron Ore' }
 * ], 200)
 * // Returns: "chippendale-7069-2x"
 *
 * @example
 * // Duplicate colors removed
 * generatePatternId('Cambridge', [
 *   { label: 'Layer1', color: 'SW7006' },
 *   { label: 'Layer2', color: 'SW7006' },  // Duplicate
 *   { label: 'Layer3', color: 'SW6258' }
 * ], 100)
 * // Returns: "cambridge-7006-6258" (not "cambridge-7006-7006-6258")
 *
 * @see savePattern - Uses this ID as localStorage key
 * @see generateShareableUrl - Includes ID in URL parameters
 */
function generatePatternId(patternName, layers, currentScale) {
    console.log('🔍 CFM generatePatternId called with:', {
        patternName,
        layers: layers.map(l => ({ label: l.label, color: l.color })),
        currentScale
    });
    console.log('🗃️ Available colorsData entries:', appState?.colorsData?.length || 'none');

    // Start with pattern name (not collection name)
    let id = patternName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Extract SW numbers from colors
    const swNumbers = [];
    layers.forEach((layer, index) => {
        console.log(`🎨 Processing layer ${index}: "${layer.color}"`);

        if (layer.color) {
            // Look for SW/SC numbers in the color name
            const swMatch = layer.color.match(/\b(SW|SC)\s*(\d+)\b/i);
            if (swMatch) {
                const prefix = swMatch[1].toUpperCase();
                const number = swMatch[2];
                console.log(`✅ Found SW/SC number in color name: ${prefix}${number}`);

                // ✅ FIX: Treat SC and SW the same - just use the number
                swNumbers.push(number);
            } else {
                console.log(`❌ No SW number found in "${layer.color}", trying reverse lookup...`);
                // If no SW/SC found, try to reverse-lookup from colorsData
                if (appState && appState.colorsData) {
                    const cleanedColorName = layer.color.toLowerCase().trim();
                    console.log(`🔍 Looking up "${cleanedColorName}" in ${appState.colorsData.length} colors`);

                    const colorEntry = appState.colorsData.find(c =>
                        c && typeof c.color_name === 'string' &&
                        c.color_name.toLowerCase() === cleanedColorName
                    );

                    console.log(`🔍 Lookup result:`, colorEntry ? {
                        color_name: colorEntry.color_name,
                        sw_number: colorEntry.sw_number
                    } : 'not found');

                    if (colorEntry && colorEntry.sw_number) {
                        const swNumber = colorEntry.sw_number;
                        const number = swNumber.substring(2); // Remove SW or SC prefix

                        // ✅ FIX: Treat SC and SW the same - just use the number
                        swNumbers.push(number);
                    }
                }
            }
        }
    });

    console.log('📋 Extracted SW numbers:', swNumbers);

    // ✅ FIX: Remove duplicate color numbers to keep IDs shorter
    const uniqueSwNumbers = [...new Set(swNumbers)];
    console.log('📋 Unique SW numbers (duplicates removed):', uniqueSwNumbers);

    // Combine pattern name + unique sw numbers
    if (uniqueSwNumbers.length > 0) {
        id += '-' + uniqueSwNumbers.join('-');
    }

    // ✅ FIX: Truncate BEFORE adding scale to preserve scale suffix
    // Check if base ID (pattern name + colors) is too long
    // Increased limit to 60 to accommodate longer pattern names with multiple colors
    if (id.length > 60) {
        console.log(`⚠️ ID too long (${id.length} chars), truncating to preserve scale...`);
        // Keep pattern name + partial color list
        const patternNamePart = patternName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const timestamp = Date.now().toString().slice(-6);
        id = patternNamePart.substring(0, 20) + '-' + timestamp;
        console.log(`✂️ Truncated ID: ${id}`);
    }

    // ✅ APPEND SCALE if not 100% (Normal) - AFTER truncation so it's preserved
    const scale = currentScale || appState?.currentScale || 100;
    if (scale !== 100) {
        if (scale === 50) id += '-0.5x';
        else if (scale === 200) id += '-2x';
        else if (scale === 300) id += '-3x';
        else if (scale === 400) id += '-4x';
        else id += `-${scale}pct`; // Fallback for custom percentages
        console.log(`📏 Appended scale to ID: ${scale}% → ${id}`);
    }

    console.log('✅ CFM Final pattern ID with scale:', id);
    return id; // Return format like: agnes-7069-0055-2x or agnes-7069-0055 (normal scale)
}

window.saveToMyList = function() {
    console.log('🎯 saveToMyList() function called!');
    try {
        // Use global appState reference
        const state = window.appState;
        
        // Validate that we have the required data
        if (!state.currentPattern || !state.currentPattern.name) {
            showSaveNotification('❌ No pattern selected to save');
            return;
        }
        
        if (!state.selectedCollection || !state.selectedCollection?.name) {
            showSaveNotification('❌ No collection selected');
            return;
        }
        
        if (!state.currentLayers || state.currentLayers.length === 0) {
            showSaveNotification('❌ No layers to save');
            return;
        }
        
        console.log('🔄 Starting pattern save process...');
        
        // Capture pattern thumbnail before saving
        console.log('📸 About to capture thumbnail...');
        const thumbnailDataUrl = capturePatternThumbnail();
        console.log('📸 Thumbnail capture result:', thumbnailDataUrl ? 'Success' : 'Failed');
        
        // Capture current pattern state - match Liquid template structure
        const currentState = {
            collectionName: state.selectedCollection?.name || 'Unknown',
            patternName: state.currentPattern.name,
            colors: state.currentLayers.map(layer => ({
                label: layer.label,
                color: layer.color,
                // Store original SW-formatted color for pattern ID generation
                swColor: layer.originalSwColor || layer.color
            })),
            thumbnail: thumbnailDataUrl, // Store the captured thumbnail
            timestamp: new Date().toISOString(),
            // ✅ Pass currentScale to generatePatternId so scale is included in the ID
            id: generatePatternId(appState.currentPattern.name, appState.currentLayers, state.currentScale || 100),

            // 🆕 SAVE SCALING: Include current scale and multiplier for restoration
            currentScale: state.currentScale || 100,
            scaleMultiplier: state.scaleMultiplier || 1.0,

            // Also save pattern size if available (for standard patterns)
            patternSize: state.currentPattern.size || null
        };

        console.log('💾💾💾 SAVING PATTERN TO LIST 💾💾💾');
        console.log('  Pattern name:', currentState.patternName);
        console.log('  Pattern ID:', currentState.id);
        console.log('  Current scale:', currentState.currentScale);
        console.log('  Scale in appState:', state.currentScale);
        console.log('  Full state:', currentState);

        // Try to save to Shopify customer metafields (if available)
        const customerId = getCustomerId();
        const customerAccessToken = getCustomerAccessToken();

        if (customerId && customerAccessToken) {
            saveToShopifyMetafields(currentState).then(function() {
                console.log('✅ Saved to Shopify customer metafields');
            }).catch(function(error) {
                console.log('🔄 Shopify save failed, using localStorage fallback');
                saveToLocalStorageNoDuplicateCheck(currentState); // Use version without duplicate check
            });
        } else {
            // Fall back to localStorage for development/testing
            console.log('📱 Customer not authenticated, saving to localStorage');
            saveToLocalStorageNoDuplicateCheck(currentState); // Use version without duplicate check
        }

        // Show success message
        showSaveNotification('✅ Pattern saved to your list!');
        
    } catch (error) {
        console.error('❌ Failed to save pattern:', error);
        showSaveNotification('❌ Failed to save pattern');
    }
};

/**
 * Saves pattern customization to Shopify customer metafields (cloud storage)
 *
 * Attempts to save pattern data to the customer's Shopify account via the
 * ColorFlex API endpoint. If the customer is authenticated, patterns are
 * stored in customer metafields, making them accessible across devices.
 * Falls back to localStorage if save fails.
 *
 * API Endpoint: POST /api/colorFlex/save-pattern
 * Authentication: X-Shopify-Customer-Access-Token header
 * Timeout: Browser default (typically 30-60 seconds)
 *
 * Data Flow:
 * 1. Validate customer authentication (ID + access token)
 * 2. POST pattern data to ColorFlex API endpoint
 * 3. On success: Resolve with API response
 * 4. On failure: Fallback to localStorage, reject with error
 *
 * Metafield Structure (Shopify):
 * - Namespace: "color_flex"
 * - Key: pattern.id (unique identifier)
 * - Value: JSON-stringified patternData object
 * - Type: json
 *
 * @async
 * @param {Object} patternData - Pattern customization data to save
 * @param {string} patternData.id - Unique pattern identifier
 * @param {string} patternData.patternName - Pattern name from collections.json
 * @param {string} patternData.collectionName - Collection name
 * @param {Array<Object>} patternData.colors - Layer colors with labels
 * @param {string} patternData.thumbnail - Base64 JPEG thumbnail data URL
 * @param {string} patternData.timestamp - ISO 8601 save timestamp
 * @param {number} [patternData.currentScale=100] - Scale percentage (50, 100, 200, 300, 400)
 * @param {number} [patternData.scaleMultiplier=1.0] - Scale multiplier (0.5, 1.0, 2.0, 3.0, 4.0)
 * @returns {Promise<Object>} Resolves with API response containing save confirmation
 *
 * @example
 * // Save authenticated customer's pattern to Shopify
 * const patternData = {
 *   id: 'tudor-rose-7006-6258-2x',
 *   patternName: 'Tudor Rose',
 *   collectionName: 'English Cottage',
 *   colors: [{label: 'Background', color: 'SW7006 Eider White'}],
 *   thumbnail: 'data:image/jpeg;base64,...',
 *   timestamp: '2025-11-30T12:00:00.000Z',
 *   currentScale: 200,
 *   scaleMultiplier: 0.5
 * };
 *
 * saveToShopifyMetafields(patternData)
 *   .then(result => console.log('Saved to cloud:', result))
 *   .catch(error => console.log('Fallback to localStorage'));
 *
 * @throws {Error} 'Customer not authenticated' if customerId or accessToken missing
 * @throws {Error} API error message if Shopify save fails
 *
 * ⚠️ IMPORTANT: Requires customer to be logged in to Shopify store
 *
 * 🔧 FALLBACK: Automatically saves to localStorage if Shopify save fails
 *
 * 🌐 CLOUD SYNC: Saved patterns accessible across devices when logged in
 *
 * @see saveToLocalStorageNoDuplicateCheck - Fallback storage method
 * @see getCustomerId - Retrieves customer ID from Shopify
 * @see getCustomerAccessToken - Retrieves authentication token
 */
function saveToShopifyMetafields(patternData) {
    return new Promise(function(resolve, reject) {
        try {
            var customerId = getCustomerId();
            var customerAccessToken = getCustomerAccessToken();
            
            if (!customerId || !customerAccessToken) {
                reject(new Error('Customer not authenticated'));
                return;
            }

            console.log('🔄 Saving to Shopify customer metafields...');
            
            fetch('/api/colorFlex/save-pattern', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Customer-Access-Token': customerAccessToken
                },
                body: JSON.stringify({
                    customerId: customerId,
                    patternData: patternData
                })
            }).then(function(response) {
                if (!response.ok) {
                    response.json().then(function(errorData) {
                        reject(new Error(errorData.message || 'Failed to save to Shopify'));
                    }).catch(function() {
                        reject(new Error('Failed to save to Shopify'));
                    });
                    return;
                }

                response.json().then(function(result) {
                    console.log('✅ Pattern saved to Shopify metafields:', result);
                    resolve(result);
                }).catch(function(error) {
                    reject(error);
                });
                
            }).catch(function(error) {
                console.error('❌ Shopify save failed:', error);
                // Fallback to localStorage
                console.log('🔄 Falling back to localStorage...');
                saveToLocalStorageNoDuplicateCheck(patternData);
                reject(error);
            });

        } catch (error) {
            console.error('❌ Shopify save failed:', error);
            // Fallback to localStorage
            console.log('🔄 Falling back to localStorage...');
            saveToLocalStorageNoDuplicateCheck(patternData);
            reject(error);
        }
    });
}

// Clean up old cart thumbnails to prevent localStorage bloat
function cleanupOldCartThumbnails() {
    try {
        console.log('🧹 Starting cart thumbnail cleanup...');

        const cartThumbnails = [];
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const maxCount = 10; // Keep only 10 most recent

        // Find all cart thumbnail keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cart_thumbnail_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    cartThumbnails.push({
                        key: key,
                        timestamp: data.timestamp || 0,
                        age: now - (data.timestamp || 0),
                        size: localStorage.getItem(key).length
                    });
                } catch (e) {
                    // Invalid data, mark for deletion
                    cartThumbnails.push({
                        key: key,
                        timestamp: 0,
                        age: Infinity,
                        size: 0
                    });
                }
            }
        }

        console.log(`🔍 Found ${cartThumbnails.length} cart thumbnails`);

        // Sort by timestamp (newest first)
        cartThumbnails.sort((a, b) => b.timestamp - a.timestamp);

        let removedCount = 0;
        let freedSpace = 0;

        cartThumbnails.forEach((thumb, index) => {
            // Remove if older than 24 hours OR if beyond max count
            if (thumb.age > maxAge || index >= maxCount) {
                localStorage.removeItem(thumb.key);
                removedCount++;
                freedSpace += thumb.size;
                console.log(`🗑️ Removed old cart thumbnail: ${thumb.key} (${Math.round(thumb.age / 3600000)}h old)`);
            }
        });

        if (removedCount > 0) {
            console.log(`✅ Cleaned up ${removedCount} cart thumbnails, freed ~${Math.round(freedSpace / 1024)}KB`);
        } else {
            console.log('✅ No cart thumbnails needed cleanup');
        }

    } catch (error) {
        console.error('❌ Error during cart thumbnail cleanup:', error);
    }
}

// Save to localStorage as fallback (duplicate check already done in saveToMyList)
/**
 * Saves pattern to localStorage with multi-stage fallback for quota handling
 *
 * Implements sophisticated localStorage quota management with progressive
 * fallback strategies. Automatically compresses thumbnails, limits pattern
 * count, and gracefully degrades data quality to ensure save succeeds even
 * in low-storage scenarios.
 *
 * Multi-Stage Fallback Strategy:
 * 1. Standard save: 15 patterns with compressed thumbnails (~750KB-1.5MB)
 * 2. Emergency cleanup: 10 patterns with all thumbnails (~500KB-1MB)
 * 3. Selective compression: 10 patterns, thumbnails only for 4 most recent
 * 4. No thumbnails: 10 patterns without any thumbnails (~50-100KB)
 * 5. Aggressive cleanup: Remove all non-essential localStorage data
 * 6. Minimal save: Single pattern with essential data only (~5-10KB)
 *
 * Storage Optimization:
 * - Thumbnail compression: 800x800 JPEG at quality 0.7 (~50-100KB each)
 * - Pattern limit: 15 patterns maximum (auto-removes oldest)
 * - Cart cleanup: Removes cart thumbnails >24hrs old before save
 * - Emergency limit: Reduces to 10 patterns if quota exceeded
 *
 * @param {Object} patternData - Pattern data to save
 * @param {string} patternData.id - Unique pattern identifier
 * @param {string} patternData.patternName - Pattern name
 * @param {string} patternData.collectionName - Collection name
 * @param {Array<Object>} patternData.colors - Layer colors with labels
 * @param {string} [patternData.thumbnail] - Base64 JPEG thumbnail (optional but recommended)
 * @param {string} patternData.timestamp - ISO 8601 save timestamp
 * @param {number} [patternData.currentScale=100] - Scale percentage
 * @param {number} [patternData.scaleMultiplier=1.0] - Scale multiplier
 * @returns {void} No return value (throws on fatal error)
 *
 * @example
 * // Standard save with thumbnail
 * const patternData = {
 *   id: 'tudor-rose-7006-6258',
 *   patternName: 'Tudor Rose',
 *   collectionName: 'English Cottage',
 *   colors: [{label: 'Background', color: 'SW7006 Eider White'}],
 *   thumbnail: 'data:image/jpeg;base64,...', // ~100KB
 *   timestamp: '2025-11-30T12:00:00.000Z',
 *   currentScale: 100,
 *   scaleMultiplier: 1.0
 * };
 *
 * saveToLocalStorageNoDuplicateCheck(patternData);
 * // Saves successfully with compressed thumbnail
 *
 * @example
 * // Emergency save (quota exceeded)
 * // If localStorage quota exceeded, function automatically:
 * // 1. Reduces to 10 patterns
 * // 2. Removes old thumbnails
 * // 3. Saves essential data only
 * // Result: Pattern saved without thumbnail
 *
 * @throws {Error} 'Unable to save pattern due to localStorage constraints' if all fallback strategies fail
 *
 * ⚠️ IMPORTANT: Never removes current pattern's thumbnail in early fallback stages
 *
 * 🔧 PERFORMANCE: Calls cleanupOldCartThumbnails() before save to free space
 *
 * 💾 STORAGE LIMITS:
 * - localStorage quota: ~5-10MB per origin (browser-dependent)
 * - Target usage: ~1.5MB for 15 patterns with thumbnails
 * - Emergency mode: ~500KB for 10 patterns with selective thumbnails
 * - Minimal mode: ~50KB for 10 patterns without thumbnails
 *
 * @see cleanupOldCartThumbnails - Frees space before save
 * @see createCompressedThumbnail - Compresses thumbnails to ~50-100KB
 * @see aggressiveLocalStorageCleanup - Emergency cleanup strategy
 * @see updateSavedPatternsMenuIcon - Updates UI after save
 */
function saveToLocalStorageNoDuplicateCheck(patternData) {
    try {
        // 🧹 Clean up old cart thumbnails FIRST to free up space
        cleanupOldCartThumbnails();

        // 🎯 FIX: Compress thumbnail before saving to prevent quota errors
        if (patternData.thumbnail) {
            const compressedThumbnail = createCompressedThumbnail(patternData.thumbnail);
            if (compressedThumbnail) {
                console.log('🗜️ Using compressed thumbnail to save space');
                patternData.thumbnail = compressedThumbnail;
            } else {
                console.warn('⚠️ Thumbnail compression failed, keeping original thumbnail');
                // Keep the original thumbnail instead of deleting it
                // Only delete if it's too large (>500KB)
                if (patternData.thumbnail.length > 500000) {
                    console.warn('⚠️ Original thumbnail too large (>500KB), removing it');
                    delete patternData.thumbnail;
                }
            }
        }

        const existingPatterns = JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');
        existingPatterns.push(patternData);

        // 🎯 FIX: More aggressive pattern limit and cleanup
        const limitedPatterns = existingPatterns.slice(-15); // Reduced from 20 to 15

        try {
            localStorage.setItem('colorflexSavedPatterns', JSON.stringify(limitedPatterns));
            console.log('✅ Pattern saved to localStorage successfully');
        } catch (quotaError) {
            console.warn('⚠️ localStorage quota exceeded, cleaning up and retrying...');

            // Emergency cleanup strategy: try to preserve thumbnails for most recent patterns
            // Step 1: Try removing only old patterns and keep thumbnails for recent 10
            let emergencyPatterns = existingPatterns.slice(-10);

            // Add current pattern to emergency list
            emergencyPatterns.push(patternData);

            try {
                localStorage.setItem('colorflexSavedPatterns', JSON.stringify(emergencyPatterns));
                console.log('✅ Pattern saved with emergency cleanup (thumbnails preserved)');
                return;
            } catch (stillTooLarge) {
                console.warn('⚠️ Still too large, removing thumbnails from older patterns...');

                // Step 2: Remove thumbnails only from older patterns, keep current pattern thumbnail
                emergencyPatterns = emergencyPatterns.slice(0, -1).map((pattern, index) => {
                    // Keep thumbnails for the 3 most recent patterns
                    if (index >= emergencyPatterns.length - 4) {
                        return pattern;
                    } else {
                        const { thumbnail, ...patternWithoutThumbnail } = pattern;
                        return patternWithoutThumbnail;
                    }
                });

                // Add current pattern with thumbnail preserved
                emergencyPatterns.push(patternData);

                try {
                    localStorage.setItem('colorflexSavedPatterns', JSON.stringify(emergencyPatterns));
                    console.log('✅ Pattern saved with selective thumbnail cleanup');
                } catch (finalFallback) {
                    console.warn('⚠️ Final fallback: removing current pattern thumbnail too');

                    // Final fallback: Remove thumbnail from current pattern as well
                    const { thumbnail, ...currentPatternNoThumb } = patternData;
                    emergencyPatterns[emergencyPatterns.length - 1] = currentPatternNoThumb;

                    try {
                        localStorage.setItem('colorflexSavedPatterns', JSON.stringify(emergencyPatterns));
                        console.log('🔧 Emergency save successful (without thumbnails)');
                    } catch (stillFailing) {
                        console.error('❌ Emergency save failed, trying aggressive localStorage cleanup...');

                        // Super aggressive cleanup - remove everything except essential data
                        aggressiveLocalStorageCleanup();

                        // Try one more time with just essential pattern data (no thumbnail)
                        try {
                            const essentialPattern = {
                                id: patternData.id,
                                patternName: patternData.patternName,
                                collectionName: patternData.collectionName,
                                colors: patternData.colors,
                                currentScale: patternData.currentScale,
                                scaleMultiplier: patternData.scaleMultiplier,
                                saveDate: patternData.saveDate
                            };

                            const essentialPatterns = [essentialPattern]; // Start fresh with just this pattern
                            localStorage.setItem('colorflexSavedPatterns', JSON.stringify(essentialPatterns));
                            console.log('✅ Pattern saved with minimal data after aggressive cleanup');
                        } catch (finalError) {
                            console.error('❌ All save attempts failed - localStorage severely limited');
                            throw new Error('Unable to save pattern due to localStorage constraints');
                        }
                    }
                }
            }
        }

        // Update menu icon - call both systems for comprehensive coverage
        updateSavedPatternsMenuIcon();

        // 🆕 CHAMELEON BUTTON: Also call global updateMenuIcon if available (from colorflex-menu-icon.js)
        if (typeof window.updateMenuIcon === 'function') {
            console.log('🦎 Updating global chameleon menu icon');
            window.updateMenuIcon();
        }

    } catch (error) {
        console.error('❌ Failed to save pattern to localStorage:', error);
        throw error; // Re-throw to be handled by calling function
    }
}

// Helper functions
function getShopifyMetafield(key) {
    // In a real Shopify app, this would fetch from customer metafields
    return JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');
}

function getCustomerId() {
    // Get from Shopify customer object or URL params
    if (window.ShopifyCustomer && window.ShopifyCustomer.id) {
        return window.ShopifyCustomer.id;
    }
    
    // Check for Liquid template customer ID
    if (typeof window.customer !== 'undefined' && window.customer.id) {
        return window.customer.id;
    }
    
    // Fallback to localStorage for development
    return localStorage.getItem('development_customer_id') || null;
}

function getCustomerAccessToken() {
    // Get from Shopify customer access token
    if (window.ShopifyCustomer && window.ShopifyCustomer.access_token) {
        return window.ShopifyCustomer.access_token;
    }
    
    // Check for global customer access token
    if (window.customerAccessToken) {
        return window.customerAccessToken;
    }
    
    // Fallback for development
    return localStorage.getItem('development_customer_token') || null;
}

function showSaveNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${message.includes('✅') ? '#48bb78' : '#f56565'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: 'Special Elite', monospace;
        font-size: 14px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

/**
 * =============================================================================
 * SECTION 3: UI COMPONENTS & INTERACTIONS
 * =============================================================================
 * 
 * This section handles UI elements, modals, notifications, and user interactions
 * for the pattern save system.
 */

/**
 * Adds save and view buttons to the pattern preview area
 * 
 * This function locates the existing save button in the DOM and adds a 
 * "View Saved Patterns" button next to it with matching styling.
 * 
 * FLOW:
 * 1. Check if view button already exists (prevent duplicates)
 * 2. Find existing save button in DOM
 * 3. Create new view button with matching styles
 * 4. Add to same container as existing button
 * 5. Wire up click event handlers
 * 
 * @function addSaveButton
 */
function addSaveButton() {
    console.log('🔍 addSaveButton() called');
    
    // Check if view button already exists
    if (document.getElementById('viewSavedBtn')) {
        console.log('✅ View button already exists');
        return;
    }
    
    // Find the existing save button
    const existingSaveButton = document.getElementById('saveToListButton');
    if (!existingSaveButton) {
        console.warn('❌ Existing save button not found');
        return;
    }
    
    console.log('✅ Existing save button found, adding view button next to it...');
    
    // Create standalone chameleon icon (matches floating chameleon style)
    const viewSavedButton = document.createElement('div');
    viewSavedButton.id = 'viewSavedBtn';
    viewSavedButton.setAttribute('aria-label', 'My Designs');
    viewSavedButton.setAttribute('title', 'Browse your saved ColorFlex Designs');

    // Get pattern count for badge
    const savedPatterns = JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');

    viewSavedButton.style.cssText = `
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 2px;
        border-radius: 50%;
        background: rgba(26, 32, 44, 0.9);
        border: 2px solid rgb(212, 175, 55);
        transition: all 0.3s ease;
        z-index: 150;
        pointer-events: auto;
        width: 48px;
        height: 48px;
        overflow: visible;
    `;

    viewSavedButton.innerHTML = `
        <img src="https://so-animation.com/colorflex/img/camelion-sm-black.jpg" style="width: 100%; height: 100%; border-radius: 50%;">
        <span style="
            background: #d4af37;
            color: #1a202c;
            font-size: 10px;
            border-radius: 10px;
            padding: 2px 4px;
            position: absolute;
            top: -8px;
            right: -8px;
            min-width: 24px;
            text-align: center;
            font-weight: bold;
            line-height: 1;
        ">${savedPatterns.length}</span>
    `;

    // Add hover effects
    viewSavedButton.addEventListener('mouseenter', function() {
        viewSavedButton.style.background = 'rgba(212, 175, 55, 0.2)';
        viewSavedButton.style.borderColor = 'rgba(212, 175, 55, 0.5)';
        viewSavedButton.style.transform = 'scale(1.05)';
    });

    viewSavedButton.addEventListener('mouseleave', function() {
        viewSavedButton.style.background = 'rgba(212, 175, 55, 0.1)';
        viewSavedButton.style.borderColor = 'rgba(212, 175, 55, 0.3)';
        viewSavedButton.style.transform = 'scale(1)';
    });
    
    // Add click handler for view saved patterns
    viewSavedButton.addEventListener('click', showSavedPatternsModal);
    
    // Add the view button to the same container with negative margin to bring it closer
    const buttonContainer = existingSaveButton.parentNode;
    if (buttonContainer) {
        // Reset any absolute positioning
        viewSavedButton.style.position = 'relative';
        viewSavedButton.style.marginLeft = '2px';
        viewSavedButton.style.alignSelf = 'center';
        viewSavedButton.style.flexShrink = '0';

        buttonContainer.appendChild(viewSavedButton);
        console.log('✅ View button added with negative margin for closer positioning');
    } else {
        console.warn('❌ Could not find button container');
    }
    
    console.log('🔍 Button IDs in DOM:', {
        existingSaveBtn: document.getElementById('saveToListButton') ? 'EXISTS' : 'NOT FOUND',
        newViewBtn: document.getElementById('viewSavedBtn') ? 'EXISTS' : 'NOT FOUND'
    });
    
    // IMPORTANT: Override the existing save button to use our thumbnail capture function
    console.log('🔧 Binding our saveToMyList function to existing save button...');
    
    // Remove any existing click handlers and add our own
    const newSaveButton = existingSaveButton.cloneNode(true);
    existingSaveButton.parentNode.replaceChild(newSaveButton, existingSaveButton);
    
    newSaveButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('💾 Save button clicked - calling our saveToMyList()');
        window.saveToMyList();
    });
}

/**
 * Displays the "My Designs" modal showing all saved patterns
 *
 * Shows a modal dialog containing all patterns saved to localStorage,
 * with options to preview, load, delete, or export each pattern.
 * Intelligently delegates to the unified modal system if available,
 * or falls back to the built-in CFM modal.
 *
 * Modal System Priority:
 * 1. Unified modal system (unified-pattern-modal.js) - preferred
 *    - Better styling and readability
 *    - Draggable, pinnable, with enhanced UI
 *    - Shared across ColorFlex app
 * 2. CFM fallback modal (createSavedPatternsModal) - fallback
 *    - Used if unified modal not loaded
 *    - Basic functionality with standard styling
 *
 * Modal Features (Unified System):
 * - Pattern cards with thumbnails
 * - Collection/pattern name display
 * - Color badges for each layer
 * - Scale indicator (1X, 2X, 3X, 4X)
 * - Save date timestamp
 * - Preview, Load, Delete, Export buttons
 * - Import pattern button in header
 * - Draggable positioning
 * - Pinnable (stays open during workflow)
 *
 * Data Source: localStorage key 'colorflexSavedPatterns'
 * Pattern Count: Displayed in modal title (e.g., "My Designs (12)")
 *
 * @returns {void} No return value (displays modal as side effect)
 *
 * @example
 * // Show saved patterns modal
 * showSavedPatternsModal();
 * // Modal appears with all saved patterns
 *
 * @example
 * // Typical user flow
 * // 1. User clicks "My Designs" button
 * // 2. showSavedPatternsModal() called
 * // 3. Modal displays with pattern cards
 * // 4. User clicks "Load" on a pattern
 * // 5. loadSavedPatternToUI() restores pattern to canvas
 *
 * @throws {Error} Logs error and shows notification if localStorage read fails
 *
 * ⚠️ IMPORTANT: Requires localStorage access (may fail in private browsing)
 *
 * 🎨 UI: Unified modal provides superior UX with drag, pin, and enhanced styling
 *
 * 💾 STORAGE: Reads from localStorage key 'colorflexSavedPatterns'
 *
 * @see window.UnifiedPatternModal - Preferred modal system
 * @see createSavedPatternsModal - Fallback modal creation
 * @see loadSavedPatternToUI - Loads selected pattern to canvas
 * @see deleteSavedPattern - Removes pattern from saved list
 */
function showSavedPatternsModal() {
    try {
        console.log('🔍 Loading saved patterns...');

        // FORCE use of unified modal system - it should be loaded
        if (window.UnifiedPatternModal && window.UnifiedPatternModal.showSavedPatternsModal) {
            console.log('🎨 Using unified modal system for better readability and styling');
            window.UnifiedPatternModal.showSavedPatternsModal();
            return;
        }

        console.log('⚠️ Unified modal not available, using CFM fallback modal - checking why...');
        console.log('UnifiedPatternModal exists:', !!window.UnifiedPatternModal);
        console.log('showSavedPatternsModal exists:', !!(window.UnifiedPatternModal && window.UnifiedPatternModal.showSavedPatternsModal));

        // Fallback to local CFM modal if unified system not available
        var savedPatterns = JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');
        console.log('📱 Loaded patterns from localStorage:', savedPatterns.length);
        
        createSavedPatternsModal(savedPatterns);
        
    } catch (error) {
        console.error('❌ Error loading saved patterns:', error);
        showSaveNotification('❌ Failed to load saved patterns');
    }
}

// Create saved patterns modal
function createSavedPatternsModal(patterns) {
    // Remove existing modal
    var existingModal = document.getElementById('savedPatternsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal overlay
    var modal = document.createElement('div');
    modal.id = 'savedPatternsModal';
    modal.isPinned = false; // Track pin state
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.4);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: background 0.3s ease;
    `;
    
    // Create modal content - draggable and positioned on right
    var modalContent = document.createElement('div');
    modalContent.id = 'cfmDraggableModal';
    modalContent.style.cssText = `
        background: #1a202c;
        color: white;
        padding: 0;
        border-radius: 10px;
        width: 400px;
        max-height: 80vh;
        font-family: 'Special Elite', monospace;
        position: absolute;
        right: 20px;
        top: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        border: 2px solid #4a5568;
    `;
    
    // Modal header - draggable area
    var header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 20px 10px 20px;
        border-bottom: 1px solid #d4af37;
        cursor: move;
        user-select: none;
        flex-shrink: 0;
    `;
    
    var title = document.createElement('h2');
    title.textContent = '📂 My Designs (' + patterns.length + ') - ColorFlex Enhanced';
    title.style.margin = '0';
    title.style.color = '#efeeeaff';
    title.style.fontFamily = "'Island Moments', italic";

    // Create button container for import, pin and close buttons
    var buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    // Import button
    var importBtn = document.createElement('button');
    importBtn.innerHTML = '📥 Import';
    importBtn.title = 'Import a pattern file';
    importBtn.style.cssText = `
        background: transparent;
        border: 1px solid #4299e1;
        color: #4299e1;
        font-size: 12px;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 4px;
        transition: all 0.3s ease;
        font-family: 'Special Elite', monospace;
        font-weight: bold;
    `;
    importBtn.addEventListener('mouseenter', function() {
        importBtn.style.background = '#4299e1';
        importBtn.style.color = 'white';
    });
    importBtn.addEventListener('mouseleave', function() {
        importBtn.style.background = 'transparent';
        importBtn.style.color = '#4299e1';
    });
    importBtn.addEventListener('click', function() {
        importPattern();
    });

    // Pin/Lock button
    var pinBtn = document.createElement('button');
    pinBtn.innerHTML = '📍'; // Pin icon
    pinBtn.title = 'Pin modal (stay open while working)';
    pinBtn.style.cssText = `
        background: transparent;
        border: 1px solid #d4af37;
        color: #d4af37;
        font-size: 16px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.3s ease;
    `;

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        background: transparent;
        border: 1px solid #4a5568;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #f56565;
    `;
    closeBtn.addEventListener('click', function() { modal.remove(); });

    // Pin button functionality
    function togglePin() {
        modal.isPinned = !modal.isPinned;
        if (modal.isPinned) {
            // Pinned state: very light background, allows all interactions
            pinBtn.innerHTML = '🔒'; // Lock icon when pinned
            pinBtn.title = 'Unpin modal (close when clicking outside)';
            pinBtn.style.color = '#f56565';
            pinBtn.style.borderColor = '#f56565';
            modal.style.background = 'rgba(0,0,0,0.1)'; // Very light background
            console.log('📍 CFM Modal pinned - background interactions enabled');
        } else {
            // Unpinned state: darker background, can close on backdrop click
            pinBtn.innerHTML = '📍'; // Pin icon when unpinned
            pinBtn.title = 'Pin modal (stay open while working)';
            pinBtn.style.color = '#d4af37';
            pinBtn.style.borderColor = '#d4af37';
            modal.style.background = 'rgba(0,0,0,0.4)'; // Darker background
            console.log('📌 CFM Modal unpinned - can close on backdrop click');
        }
    }

    pinBtn.addEventListener('click', togglePin);

    // Add buttons to container
    buttonContainer.appendChild(importBtn);
    buttonContainer.appendChild(pinBtn);
    buttonContainer.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(buttonContainer);
    modalContent.appendChild(header);

    // Create scrollable content area
    var scrollableContent = document.createElement('div');
    scrollableContent.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        max-height: calc(80vh - 100px);
    `;

    // Patterns list
    if (patterns.length === 0) {
        var emptyMessage = document.createElement('div');
        emptyMessage.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #a0aec0;">
                <div style="font-size: 48px; margin-bottom: 20px;">
                <img src="https://so-animation.com/colorflex/img/camelion-sm-black.jpg" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 20px;">
                <h3>No saved patterns yet</h3>
                <div style="font-size: 24px; margin-bottom: 20px;">
                <p>Start customizing patterns and save your favorites!</p>
                </div>
            </div>
        `;
        scrollableContent.appendChild(emptyMessage);
    } else {
        for (var i = 0; i < patterns.length; i++) {
            var patternDiv = createSavedPatternItem(patterns[i], i);
            scrollableContent.appendChild(patternDiv);
        }
    }

    // Add scrollable content to modal
    modalContent.appendChild(scrollableContent);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Make modal draggable by the header
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    header.addEventListener('mousedown', function(e) {
        if (e.target === pinBtn || e.target === closeBtn) return; // Don't drag when clicking buttons
        isDragging = true;
        const rect = modalContent.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        modalContent.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep modal within viewport bounds
        const maxX = window.innerWidth - modalContent.offsetWidth;
        const maxY = window.innerHeight - modalContent.offsetHeight;

        modalContent.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        modalContent.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
        modalContent.style.right = 'auto'; // Override right positioning when dragging
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            modalContent.style.cursor = 'move';
        }
    });

    // Close on overlay click - respect pin state
    modal.addEventListener('click', function(e) {
        if (e.target === modal && !modal.isPinned) {
            modal.remove();
        }
    });
}

// Create individual saved pattern item
function createSavedPatternItem(pattern, index) {
    var item = document.createElement('div');
    item.style.cssText = `
        border: 1px solid #4a5568;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 15px;
        background: #2d3748;
        transition: background 0.3s ease;
        position: relative;
        min-height: 400px;
    `;
    
    // Hover effect
    item.addEventListener('mouseenter', function() {
        item.style.background = '#374151';
    });
    item.addEventListener('mouseleave', function() {
        item.style.background = '#2d3748';
    });
    
    // ID Badge (centered line at top)
    var idBadge = document.createElement('div');
    idBadge.style.cssText = `
        text-align: center;
        color: #d4af37;
        font-size: 11px !important;
        font-family: 'Special Elite', monospace;
        font-weight: bold;
        margin-bottom: 16px;
        word-break: break-all;
        line-height: 1.3;
    `;

    // Add scale to ID if not 100%
    let idText = `ID: ${pattern.id}`;
    if (pattern.currentScale && pattern.currentScale !== 100) {
        const scaleLabel = getScaleLabel(pattern.currentScale);
        idText += ` - ${scaleLabel}`;
    }
    idBadge.textContent = idText;
    item.appendChild(idBadge);
    
    // Pattern Name (large, script font)
    var patternName = document.createElement('div');
    patternName.style.cssText = `
        font-family: 'Island Moments', cursive;
        font-size: 48px;
        color: white;
        margin-bottom: 8px;
        line-height: 1.1;
        text-align: center;
    `;
    patternName.textContent = pattern.patternName;
    
    // Collection info section
    var collectionInfo = document.createElement('div');
    collectionInfo.style.cssText = 'margin-bottom: 12px;';
    
    var collectionLabel = document.createElement('div');
    collectionLabel.style.cssText = `
        color: #a0aec0;
        font-size: 14px;
        font-family: 'Special Elite', monospace;
        margin-bottom: 4px;
        line-height: 1.3;
    `;
    collectionLabel.innerHTML = `
        <span style="color: #e2e8f0; font-weight: bold; font-size: 14px;">Collection:</span><br>
        ${pattern.collectionName ? pattern.collectionName.charAt(0).toUpperCase() + pattern.collectionName.slice(1) : 'Unknown'}
    `;
    
    // Metadata section (saved date, layers, scale) - Reduced to 75% size using absolute pixels
    var metadata = document.createElement('div');
    metadata.style.cssText = 'display: flex; gap: 10px; margin-bottom: 12px; font-size: 11px !important;';

    var savedInfo = document.createElement('div');
    savedInfo.style.cssText = 'display: flex; align-items: center; gap: 3px; font-size: 11px !important;';
    savedInfo.innerHTML = `
        <span style="font-size: 12px !important;">📅</span>
        <div style="color: #e2e8f0; font-family: 'Special Elite', monospace !important; font-size: 11px !important; line-height: 1.2;">
            <span style="font-size: 11px !important; font-weight: bold; line-height: 1.2;">Saved:</span><br>
            <span style="color: #a0aec0; font-size: 11px !important; line-height: 1.2;">${new Date(pattern.timestamp).toLocaleDateString()}</span>
        </div>
    `;

    var layersInfo = document.createElement('div');
    layersInfo.style.cssText = 'display: flex; align-items: center; gap: 3px; font-size: 11px !important;';
    layersInfo.innerHTML = `
        <span style="font-size: 12px !important;">🎯</span>
        <div style="color: #e2e8f0; font-family: 'Special Elite', monospace !important; font-size: 11px !important; line-height: 1.2;">
            <span style="font-size: 11px !important; font-weight: bold; line-height: 1.2;">Layers:</span><br>
            <span style="color: #a0aec0; font-size: 11px !important; line-height: 1.2;">${pattern.colors ? pattern.colors.length : 0}</span>
        </div>
    `;

    metadata.appendChild(savedInfo);
    metadata.appendChild(layersInfo);

    // Scale information
    if (pattern.currentScale && pattern.currentScale !== 100) {
        var scaleInfo = document.createElement('div');
        scaleInfo.style.cssText = 'display: flex; align-items: center; gap: 3px; font-size: 11px !important;';

        // Determine scale display text using config
        let scaleText = getScaleLabel(pattern.currentScale);
        if (scaleText === 'Normal') scaleText = 'NORMAL'; // Uppercase for display
        else if (!scaleText.endsWith('X') && !scaleText.endsWith('%')) {
            scaleText = `${scaleText} SCALE`;
        }

        scaleInfo.innerHTML = `
            <span style="font-size: 12px !important;">📏</span>
            <div style="color: #e2e8f0; font-family: 'Special Elite', monospace !important; font-size: 11px !important; line-height: 1.2;">
                <span style="font-size: 11px !important; font-weight: bold; line-height: 1.2;">Repeat:</span><br>
                <span style="color: #d4af37; font-weight: bold; font-size: 11px !important; line-height: 1.2;">${scaleText}</span>
            </div>
        `;
        metadata.appendChild(scaleInfo);
    }

    // Layer Details section (restored with clean color names)
    var layerDetails = document.createElement('div');
    layerDetails.style.cssText = 'margin-bottom: 16px;';

    var layerDetailsTitle = document.createElement('div');
    layerDetailsTitle.style.cssText = `
        color: #d4af37;
        font-size: 14px;
        font-family: 'Special Elite', monospace;
        font-weight: bold;
        margin-bottom: 8px;
    `;
    layerDetailsTitle.textContent = 'Layer Details:';

    var layerDetailsList = document.createElement('div');
    layerDetailsList.style.cssText = 'font-size: 12px; color: #a0aec0; line-height: 1.4;';

    if (pattern.colors && pattern.colors.length > 0) {
        pattern.colors.forEach(function(color) {
            // Clean the color name: remove SW/SC numbers and properly capitalize
            var cleanColorName = color.color.replace(/^(SW|SC)\d+\s*/i, '').trim();
            // Proper title case formatting
            cleanColorName = cleanColorName.split(' ').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');

            var layerItem = document.createElement('div');
            layerItem.style.cssText = 'margin-bottom: 2px;';
            layerItem.innerHTML = `• ${color.label}: ${cleanColorName}`;
            layerDetailsList.appendChild(layerItem);
        });
    }

    layerDetails.appendChild(layerDetailsTitle);
    layerDetails.appendChild(layerDetailsList);
    
    // Large Pattern Thumbnail
    var thumbnailContainer = document.createElement('div');
    thumbnailContainer.style.cssText = `
        width: 100%;
        height: 200px;
        margin-bottom: 16px;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid #d4af37;
    `;
    
    if (pattern.thumbnail) {
        var thumbnailImg = document.createElement('img');
        thumbnailImg.src = pattern.thumbnail;
        thumbnailImg.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;
        thumbnailImg.alt = pattern.patternName + ' thumbnail';
        
        // Handle thumbnail load error
        thumbnailImg.onerror = function() {
            // Create placeholder if image fails to load
            var placeholder = document.createElement('div');
            placeholder.style.cssText = `
                width: 100%;
                height: 100%;
                background: #2d3748;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #d4af37;
                font-family: 'Special Elite', monospace;
                font-size: 48px;
            `;
            placeholder.textContent = '🎨';
            thumbnailContainer.replaceChild(placeholder, thumbnailImg);
        };
        
        thumbnailContainer.appendChild(thumbnailImg);
    } else {
        // Create placeholder if no thumbnail
        var placeholder = document.createElement('div');
        placeholder.style.cssText = `
            width: 100%;
            height: 100%;
            background: #2d3748;
            background-image: url('https://so-animation.com/colorflex/img/camelion-sm-black.jpg');
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #d4af37;
            font-family: 'Special Elite', monospace;
            font-size: 48px;
        `;
        placeholder.textContent = "";
        thumbnailContainer.appendChild(placeholder);
    }
    
    // Assemble the top section
    var topSection = document.createElement('div');
    topSection.appendChild(patternName);
    topSection.appendChild(collectionInfo);
    topSection.appendChild(collectionLabel);
    topSection.appendChild(metadata);
    topSection.appendChild(layerDetails);
    
    // Assemble everything
    var mainContent = document.createElement('div');
    mainContent.appendChild(topSection);
    mainContent.appendChild(thumbnailContainer);
    
    // Three-button layout at bottom
    var buttons = document.createElement('div');
    buttons.style.cssText = 'display: flex; gap: 10px; margin-top: auto; padding-top: 16px;';
    
    // Load Pattern button (yellow border)
    var loadBtn = document.createElement('button');
    loadBtn.textContent = '🔄 Open in ColorFlex';
    loadBtn.style.cssText = `
        background: transparent;
        color: #d4af37;
        border: 2px solid #d4af37;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-family: 'Special Elite', monospace;
        transition: all 0.3s ease;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    `;
    loadBtn.addEventListener('mouseenter', function() {
        loadBtn.style.background = '#d4af37';
        loadBtn.style.color = '#1a202c';
    });
    loadBtn.addEventListener('mouseleave', function() {
        loadBtn.style.background = 'transparent';
        loadBtn.style.color = '#d4af37';
    });
    loadBtn.addEventListener('click', function() {
        loadSavedPatternToUI(pattern);
    });
    
    // Delete button (red border)
    var deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.style.cssText = `
        background: transparent;
        color: #f56565;
        border: 2px solid #f56565;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-family: 'Special Elite', monospace;
        transition: all 0.3s ease;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    `;
    deleteBtn.addEventListener('mouseenter', function() {
        deleteBtn.style.background = '#f56565';
        deleteBtn.style.color = 'white';
    });
    deleteBtn.addEventListener('mouseleave', function() {
        deleteBtn.style.background = 'transparent';
        deleteBtn.style.color = '#f56565';
    });
    deleteBtn.addEventListener('click', function() {
        if (confirm('🗑️ Delete "' + pattern.patternName + '"?\n\nThis action cannot be undone.')) {
            deleteSavedPattern(pattern.id);
            document.getElementById('savedPatternsModal').remove();
            showSavedPatternsModal(); // Refresh modal
        }
    });
    
    // Buy it! button (purple background)
    var addToCartBtn = document.createElement('button');
    addToCartBtn.textContent = 'Buy it!';
    addToCartBtn.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 30px;
        font-family: 'Island Moments', cursive;
        transition: all 0.3s ease;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex: 1;
    `;
    addToCartBtn.addEventListener('mouseenter', function() {
        addToCartBtn.style.transform = 'translateY(-2px)';
        addToCartBtn.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.3)';
    });
    addToCartBtn.addEventListener('mouseleave', function() {
        addToCartBtn.style.transform = 'translateY(0)';
        addToCartBtn.style.boxShadow = 'none';
    });
    addToCartBtn.addEventListener('click', function() {
        showMaterialSelectionModal(pattern);
    });

    // Export button (blue border)
    var exportBtn = document.createElement('button');
    exportBtn.textContent = '💾 Export';
    exportBtn.title = 'Download this pattern as a file';
    exportBtn.style.cssText = `
        background: transparent;
        color: #4299e1;
        border: 2px solid #4299e1;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-family: 'Special Elite', monospace;
        transition: all 0.3s ease;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    `;
    exportBtn.addEventListener('mouseenter', function() {
        exportBtn.style.background = '#4299e1';
        exportBtn.style.color = 'white';
    });
    exportBtn.addEventListener('mouseleave', function() {
        exportBtn.style.background = 'transparent';
        exportBtn.style.color = '#4299e1';
    });
    exportBtn.addEventListener('click', function() {
        exportPattern(pattern);
    });

    buttons.appendChild(loadBtn);
    buttons.appendChild(exportBtn);
    buttons.appendChild(deleteBtn);

    // Create separate container for Buy it! button at bottom
    var downloadButtonContainer = document.createElement('div');
    downloadButtonContainer.style.cssText = 'margin-top: 16px; padding-top: 16px; border-top: 1px solid #4a5568;';
    downloadButtonContainer.appendChild(addToCartBtn);
    
    item.appendChild(mainContent);
    item.appendChild(buttons);
    item.appendChild(downloadButtonContainer);
    
    return item;
}

// Download proof for a saved pattern
function downloadSavedPatternProof(pattern) {
    try {
        console.log('🔧 Download proof requested for saved pattern:', pattern.patternName);

        if (!pattern.colors || pattern.colors.length === 0) {
            alert('No colors found in saved pattern');
            return;
        }

        // Extract color strings from saved pattern color objects
        const colorArray = pattern.colors.map(colorObj => colorObj.color);

        // Get scale from saved pattern (default to 100 if not present)
        const patternScale = pattern.currentScale || 100;

        console.log('🎨 Generating proof for:', pattern.patternName, 'from collection:', pattern.collectionName, 'with colors:', colorArray, 'scale:', patternScale);

        // Use the same proof generation as product pages
        // Pass scale to show correct tiling/repetition on 24" wide proof
        window.generatePatternProof(
            pattern.patternName,
            pattern.collectionName,
            colorArray,
            patternScale  // Scale affects tiling, not canvas size
        ).then(async proofCanvas => {
            console.log('✅ Pattern proof generation complete, adding info strip...');

            // Create a new canvas with extra height for info strip
            const infoStripHeight = 200;
            const finalCanvas = document.createElement('canvas');
            const finalCtx = finalCanvas.getContext('2d');

            finalCanvas.width = proofCanvas.width;
            finalCanvas.height = proofCanvas.height + infoStripHeight;

            // Draw the pattern proof
            finalCtx.drawImage(proofCanvas, 0, 0);

            // Draw info strip background
            finalCtx.fillStyle = '#ffffff';
            finalCtx.fillRect(0, proofCanvas.height, finalCanvas.width, infoStripHeight);

            // Add border line
            finalCtx.strokeStyle = '#d4af37';
            finalCtx.lineWidth = 2;
            finalCtx.beginPath();
            finalCtx.moveTo(0, proofCanvas.height);
            finalCtx.lineTo(finalCanvas.width, proofCanvas.height);
            finalCtx.stroke();

            // Calculate font sizes based on canvas width
            const baseFontSize = Math.max(24, finalCanvas.width / 80);
            const smallFontSize = Math.max(18, finalCanvas.width / 100);

            // Add text info
            finalCtx.fillStyle = '#1a202c';
            finalCtx.font = `bold ${baseFontSize}px Arial`;
            finalCtx.textAlign = 'left';

            const leftMargin = 30;
            let yPosition = proofCanvas.height + 30;

            // Pattern name
            finalCtx.fillText(`Pattern: ${pattern.patternName}`, leftMargin, yPosition);
            yPosition += baseFontSize + 8;

            // Collection name
            finalCtx.font = `${smallFontSize}px Arial`;
            finalCtx.fillText(`Collection: ${pattern.collectionName}`, leftMargin, yPosition);
            yPosition += smallFontSize + 8;

            // Scale information
            if (patternScale !== 100) {
                const scaleDisplay = patternScale === 50 ? '0.5X' :
                                   patternScale === 200 ? '2X' :
                                   patternScale === 300 ? '3X' :
                                   patternScale === 400 ? '4X' :
                                   `${patternScale}%`;
                finalCtx.fillText(`Scale: ${scaleDisplay}`, leftMargin, yPosition);
                yPosition += smallFontSize + 8;
            }

            // Color information - display layer by layer
            finalCtx.fillText(`Colors:`, leftMargin, yPosition);
            yPosition += smallFontSize + 6;

            pattern.colors.forEach(colorObj => {
                finalCtx.fillText(`  ${colorObj.label}: ${colorObj.color}`, leftMargin + 20, yPosition);
                yPosition += smallFontSize + 4;
            });

            // Build filename with scale suffix if not 100%
            let filename = `${pattern.patternName}_${pattern.collectionName}`;
            if (patternScale !== 100) {
                if (patternScale === 50) filename += '_0.5x';
                else if (patternScale === 200) filename += '_2x';
                else if (patternScale === 300) filename += '_3x';
                else if (patternScale === 400) filename += '_4x';
                else filename += `_${patternScale}pct`;
            }
            filename += '_proof.jpg';

            window.downloadPatternProof(finalCanvas, filename);
        }).catch(error => {
            console.error('❌ Error generating saved pattern proof:', error);
            alert('Error generating proof. Check console for details.');
        });

    } catch (error) {
        console.error('❌ Error in downloadSavedPatternProof:', error);
        alert('Error downloading proof. Please try again.');
    }
}

// Delete a saved pattern
/**
 * Deletes a saved pattern from localStorage by pattern ID
 *
 * Removes a pattern from the user's saved patterns list and updates
 * the UI to reflect the change. Automatically updates menu icons to
 * show the new pattern count.
 *
 * Delete Process:
 * 1. Load all saved patterns from localStorage
 * 2. Filter out the pattern matching patternId
 * 3. Save updated array back to localStorage
 * 4. Update UI menu icons
 * 5. Show success notification
 *
 * @param {string} patternId - Unique pattern identifier to delete
 *
 * @example
 * // Delete a specific pattern
 * deleteSavedPattern('tudor-rose-7006-6258-2x');
 * // Pattern removed from localStorage
 * // UI updated to show new pattern count
 *
 * @example
 * // Typical flow from modal
 * // 1. User clicks delete button on pattern card
 * // 2. deleteSavedPattern(pattern.id) called
 * // 3. Pattern removed from list
 * // 4. Modal refreshed to show remaining patterns
 *
 * @throws {Error} Logs error and shows notification if delete fails
 *
 * ⚠️ IMPORTANT: Deletion is permanent - no undo functionality
 *
 * 🔄 UI UPDATE: Automatically calls updateSavedPatternsMenuIcon()
 * and window.updateMenuIcon() if available
 *
 * 💾 STORAGE: Modifies localStorage key 'colorflexSavedPatterns'
 *
 * @see showSavedPatternsModal - Displays patterns list
 * @see updateSavedPatternsMenuIcon - Updates menu icon badge
 */
function deleteSavedPattern(patternId) {
    try {
        // Delete from localStorage
        var patterns = JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');
        var updatedPatterns = patterns.filter(function(p) { return p.id !== patternId; });
        localStorage.setItem('colorflexSavedPatterns', JSON.stringify(updatedPatterns));

        console.log('✅ Pattern deleted from localStorage');

        // Update menu icon - call both systems for comprehensive coverage
        updateSavedPatternsMenuIcon();

        // 🆕 CHAMELEON BUTTON: Also call global updateMenuIcon if available (from colorflex-menu-icon.js)
        if (typeof window.updateMenuIcon === 'function') {
            console.log('🦎 Updating global chameleon menu icon after deletion');
            window.updateMenuIcon();
        }
        showSaveNotification('✅ Pattern deleted successfully!');

    } catch (error) {
        console.error('❌ Error deleting pattern:', error);
        showSaveNotification('❌ Failed to delete pattern');
    }
}

/**
 * Exports a saved pattern as a downloadable JSON file (.cfx.json)
 *
 * Creates a formatted JSON file containing all pattern data including
 * colors, collection, scale settings, and thumbnail image. The file can
 * be shared with others or imported back into ColorFlex to restore the
 * exact pattern customization.
 *
 * Export Process:
 * 1. Serialize pattern object to pretty-printed JSON (2-space indent)
 * 2. Create Blob with application/json MIME type
 * 3. Generate object URL for download
 * 4. Create temporary <a> element with download attribute
 * 5. Programmatically click link to trigger download
 * 6. Clean up object URL and DOM element
 *
 * File Naming Convention:
 * Format: "{pattern-name}_{collection-name}.cfx.json"
 * - Lowercase conversion
 * - Special characters replaced with hyphens
 * - Example: "tudor-rose_english-cottage.cfx.json"
 *
 * File Contents:
 * - Pattern ID (unique identifier)
 * - Pattern name and collection name
 * - Layer colors with labels
 * - Thumbnail (base64 JPEG, ~50-100KB)
 * - Scale settings (currentScale, scaleMultiplier)
 * - Save timestamp
 *
 * @param {Object} pattern - Complete pattern object to export
 * @param {string} pattern.id - Unique pattern identifier
 * @param {string} pattern.patternName - Pattern name
 * @param {string} pattern.collectionName - Collection name
 * @param {Array<Object>} pattern.colors - Layer colors with labels
 * @param {string} [pattern.thumbnail] - Base64 JPEG thumbnail
 * @param {number} [pattern.currentScale=100] - Scale percentage
 * @param {number} [pattern.scaleMultiplier=1.0] - Scale multiplier
 * @param {string} pattern.timestamp - ISO 8601 save timestamp
 * @returns {void} No return value (triggers file download as side effect)
 *
 * @example
 * // Export a saved pattern
 * const pattern = {
 *   id: 'tudor-rose-7006-6258-2x',
 *   patternName: 'Tudor Rose',
 *   collectionName: 'English Cottage',
 *   colors: [{label: 'Background', color: 'SW7006 Eider White'}],
 *   thumbnail: 'data:image/jpeg;base64,...',
 *   currentScale: 200,
 *   scaleMultiplier: 0.5,
 *   timestamp: '2025-11-30T12:00:00.000Z'
 * };
 *
 * exportPattern(pattern);
 * // Downloads: tudor-rose_english-cottage.cfx.json
 * // File size: ~100-150KB (with thumbnail)
 *
 * @example
 * // Typical user flow
 * // 1. User opens "My Designs" modal
 * // 2. Clicks "Export" button on a pattern card
 * // 3. exportPattern(pattern) called
 * // 4. Browser downloads .cfx.json file
 * // 5. User can share file or import it later
 *
 * @throws {Error} Logs error and shows notification if export fails
 *
 * 💾 FILE FORMAT: JSON with .cfx.json extension (ColorFlex export format)
 *
 * 🔄 IMPORT: Use importPattern() to restore exported patterns
 *
 * 📦 SHARING: Files can be shared via email, cloud storage, or chat
 *
 * @see importPattern - Imports .cfx.json files back into ColorFlex
 * @see showSavedPatternsModal - Modal with export buttons
 */
function exportPattern(pattern) {
    try {
        console.log('💾 Exporting pattern:', pattern.patternName);

        // Create JSON string with nice formatting
        // Include thumbnail - it's used when importing to display in My Designs
        const jsonString = JSON.stringify(pattern, null, 2);

        // Create a Blob from the JSON string
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Generate filename: pattern-name_collection-name.cfx.json
        const fileName = `${pattern.patternName}_${pattern.collectionName}.cfx.json`
            .toLowerCase()
            .replace(/[^a-z0-9_\-\.]/g, '-');
        link.download = fileName;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL object
        URL.revokeObjectURL(url);

        console.log('✅ Pattern exported successfully:', fileName);
        showSaveNotification('💾 Pattern exported: ' + fileName);

    } catch (error) {
        console.error('❌ Error exporting pattern:', error);
        showSaveNotification('❌ Failed to export pattern');
    }
}

/**
 * Imports a pattern from a .cfx.json or .json file via file picker
 *
 * Opens a file picker dialog allowing users to select a previously
 * exported pattern file. Validates the file contents, handles duplicate
 * IDs intelligently, and adds the pattern to the saved patterns list.
 *
 * Import Process:
 * 1. Create hidden file input element with .json/.cfx.json accept filter
 * 2. Open browser file picker dialog
 * 3. Read selected file using FileReader
 * 4. Parse JSON and validate required fields
 * 5. Check for duplicate pattern IDs
 * 6. Handle duplicates: replace existing or create new with unique ID
 * 7. Save to localStorage
 * 8. Refresh "My Designs" modal to show imported pattern
 *
 * Duplicate Handling:
 * - If pattern ID exists: Prompt user to replace or keep both
 * - Replace: Overwrites existing pattern with imported data
 * - Keep both: Appends "-imported-{timestamp}" to ID
 *
 * Validation Rules:
 * - File must be valid JSON
 * - Must contain: patternName, collectionName, colors
 * - If missing timestamp, adds current timestamp
 *
 * Accepted File Formats:
 * - .cfx.json (ColorFlex export format - preferred)
 * - .json (generic JSON format)
 *
 * @returns {void} No return value (triggers file picker as side effect)
 *
 * @example
 * // User clicks "Import" button in My Designs modal
 * importPattern();
 * // 1. File picker opens
 * // 2. User selects "tudor-rose_english-cottage.cfx.json"
 * // 3. Pattern validates and loads
 * // 4. Modal refreshes showing imported pattern
 *
 * @example
 * // Duplicate ID handling
 * // User imports pattern with ID "tudor-rose-7006-6258"
 * // ID already exists in saved patterns
 * // Prompt: "Replace existing?"
 * //   → Yes: Replaces with imported data
 * //   → No: Saves as "tudor-rose-7006-6258-imported-1638284400000"
 *
 * @throws {Error} 'Invalid pattern file: missing required fields' if validation fails
 * @throws {Error} Logs error and shows notification if file read or parse fails
 *
 * ⚠️ IMPORTANT: File must contain patternName, collectionName, and colors
 *
 * 🔄 DUPLICATES: Intelligently handles conflicts with user choice
 *
 * 💾 STORAGE: Adds to localStorage key 'colorflexSavedPatterns'
 *
 * 🎨 UI UPDATE: Automatically refreshes modal to show imported pattern
 *
 * @see exportPattern - Exports patterns to .cfx.json files
 * @see showSavedPatternsModal - Modal with import button
 * @see updateSavedPatternsMenuIcon - Updates menu icon badge
 */
function importPattern() {
    try {
        console.log('📥 Opening file picker for pattern import...');

        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.cfx.json';
        fileInput.style.display = 'none';

        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) {
                console.log('No file selected');
                return;
            }

            console.log('📂 Selected file:', file.name);

            // Read the file
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const patternData = JSON.parse(e.target.result);
                    console.log('📥 Parsed pattern data:', patternData);

                    // Validate the pattern data has required fields
                    if (!patternData.patternName || !patternData.collectionName || !patternData.colors) {
                        throw new Error('Invalid pattern file: missing required fields');
                    }

                    // Add timestamp if not present
                    if (!patternData.timestamp) {
                        patternData.timestamp = new Date().toISOString();
                    }

                    // Load existing patterns
                    const existingPatterns = JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');

                    // Check if pattern with same ID already exists
                    const existingIndex = existingPatterns.findIndex(p => p.id === patternData.id);

                    if (existingIndex >= 0) {
                        // Ask user if they want to replace
                        if (confirm(`A pattern with ID "${patternData.id}" already exists.\n\nReplace it with the imported pattern?`)) {
                            existingPatterns[existingIndex] = patternData;
                            console.log('🔄 Replaced existing pattern');
                        } else {
                            // Generate new ID for imported pattern
                            patternData.id = patternData.id + '-imported-' + Date.now();
                            patternData.timestamp = new Date().toISOString();
                            existingPatterns.push(patternData);
                            console.log('➕ Added as new pattern with ID:', patternData.id);
                        }
                    } else {
                        // Add new pattern
                        existingPatterns.push(patternData);
                        console.log('➕ Added new pattern');
                    }

                    // Save back to localStorage
                    localStorage.setItem('colorflexSavedPatterns', JSON.stringify(existingPatterns));

                    // Update menu icon
                    updateSavedPatternsMenuIcon();
                    if (typeof window.updateMenuIcon === 'function') {
                        window.updateMenuIcon();
                    }

                    // Show success message
                    showSaveNotification('✅ Pattern imported: ' + patternData.patternName);
                    console.log('✅ Pattern imported successfully');

                    // Refresh the modal to show the new pattern
                    document.getElementById('savedPatternsModal')?.remove();
                    showSavedPatternsModal();

                } catch (parseError) {
                    console.error('❌ Error parsing pattern file:', parseError);
                    showSaveNotification('❌ Invalid pattern file');
                }
            };

            reader.onerror = function() {
                console.error('❌ Error reading file');
                showSaveNotification('❌ Failed to read file');
            };

            reader.readAsText(file);
        });

        // Trigger file picker
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);

    } catch (error) {
        console.error('❌ Error importing pattern:', error);
        showSaveNotification('❌ Failed to import pattern');
    }
}

// Expose functions to window for external access
window.exportPattern = exportPattern;
window.importPattern = importPattern;

// Expose collection switching for collections modal
window.switchCollection = function(collectionName) {
    console.log(`🔄 Switching to collection: ${collectionName}`);

    // Find the collection in appState
    const targetCollection = appState.collections?.find(c => c.name === collectionName);

    if (!targetCollection) {
        console.error(`Collection not found: ${collectionName}`);
        return;
    }

    if (!targetCollection.patterns || targetCollection.patterns.length === 0) {
        console.warn(`Collection "${collectionName}" has no patterns`);
        return;
    }

    // Set the collection
    appState.selectedCollection = targetCollection;

    // Set data attribute for collection-specific styling
    document.body.setAttribute('data-current-collection', targetCollection.name);

    // Update collection header
    const collectionHeader = document.getElementById('collectionHeader');
    if (collectionHeader) {
        if (targetCollection.name.includes('.clo-')) {
            const collectionBaseName = targetCollection.name.split('.')[0];
            collectionHeader.textContent = collectionBaseName.toUpperCase();
        } else {
            collectionHeader.textContent = targetCollection.name.toUpperCase();
        }
    }

    // Populate thumbnails for new collection
    populatePatternThumbnails(targetCollection.patterns);

    // Load the first pattern in the collection
    const firstPattern = targetCollection.patterns[0];
    if (firstPattern) {
        loadPatternData(targetCollection, firstPattern.id || firstPattern.name);
    }

    console.log(`✅ Switched to collection: ${collectionName}`);
};

// Fabric Specifications Database (from Airtable data)
const FABRIC_SPECIFICATIONS = {
    'SOFT VELVET': {
        pricePerYard: 29.00,
        width: '58"',
        minimumYards: 5,
        description: 'Luxurious soft velvet with rich texture',
        material: 'fabric'
    },
    'DECORATOR LINEN': {
        pricePerYard: 29.00,
        width: '56"',
        minimumYards: 5,
        description: 'Premium decorator linen for upholstery',
        material: 'fabric'
    },
    'DRAPERY SHEER': {
        pricePerYard: 24.00,
        width: '56"',
        minimumYards: 5,
        description: 'Lightweight sheer fabric for window treatments',
        material: 'fabric'
    },
    'LIGHTWEIGHT LINEN': {
        pricePerYard: 26.00,
        width: '62"',
        minimumYards: 5,
        description: 'Versatile lightweight linen fabric',
        material: 'fabric'
    },
    'FAUX SUEDE': {
        pricePerYard: 36.00,
        width: '58"',
        minimumYards: 5,
        description: 'Premium faux suede with authentic texture',
        material: 'fabric'
    },
    'DRAPERY LIGHT BLOCK': {
        pricePerYard: 31.00,
        width: '56"',
        minimumYards: 5,
        description: 'Light-blocking drapery fabric',
        material: 'fabric'
    },
    'WALLPAPER': {
        pricePerRoll: 89.99,
        coverage: '56 sq ft',
        minimumRolls: 1,
        description: 'Professional-grade removable wallpaper',
        material: 'wallpaper'
    }
};

/**
 * Displays material selection modal for pattern cart configuration
 *
 * Shows an interactive modal dialog allowing users to choose between
 * wallpaper and fabric materials before proceeding to the product
 * configuration page. Features accordion-style material categories,
 * detailed pricing, and material specifications with guided links.
 *
 * Modal Features:
 * - Accordion sections: Wallpaper (4 options) and Fabric (6 options)
 * - Material details: Price, dimensions, minimums, descriptions
 * - Link to full material specifications page
 * - Smart cart handling: Standard add vs cart item update
 * - Responsive design with hover effects
 * - Default selection: Prepasted Wallpaper
 *
 * Wallpaper Options (24" wide):
 * - Prepasted Wallpaper: $180/roll, 30' long, 2-week turnaround
 * - Peel & Stick: $320/roll, 27' long, removable
 * - Unpasted: $180/roll, 30' long, professional grade
 * - Grasscloth: Contact pricing, 27' long, natural material
 *
 * Fabric Options (5-yard minimum):
 * - Soft Velvet: $29/yard, 58" wide, luxurious texture
 * - Decorator Linen: $29/yard, 56" wide, upholstery grade
 * - Drapery Sheer: $24/yard, 56" wide, lightweight
 * - Lightweight Linen: $26/yard, 62" wide, versatile
 * - Faux Suede: $36/yard, 58" wide, premium texture
 * - Drapery Light Block: $31/yard, 56" wide, light blocking
 *
 * User Flow:
 * 1. User saves/creates pattern in ColorFlex
 * 2. Clicks "Proceed to Cart" button
 * 3. Modal displays with material options
 * 4. User selects material (wallpaper or fabric)
 * 5. Clicks "Proceed to Cart"
 * 6. Redirected to product page with pattern data
 *
 * Cart Update Flow (from cart edit):
 * 1. User clicks "Edit" on cart item
 * 2. ColorFlex loads with pattern
 * 3. User modifies colors/scale
 * 4. Modal shows "Update Cart Item" button
 * 5. Clicking updates existing cart item
 *
 * @param {Object} pattern - Pattern object to configure
 * @param {string} pattern.patternName - Pattern name
 * @param {string} pattern.collectionName - Collection name
 * @param {Array<Object>} pattern.colors - Layer colors
 * @param {number} [pattern.currentScale=100] - Scale percentage
 * @param {number} [pattern.scaleMultiplier=1.0] - Scale multiplier
 * @returns {void} No return value (displays modal as side effect)
 *
 * @example
 * // Show modal for new pattern
 * const pattern = {
 *   patternName: 'Tudor Rose',
 *   collectionName: 'English Cottage',
 *   colors: [{label: 'Background', color: 'SW7006 Eider White'}],
 *   currentScale: 100,
 *   scaleMultiplier: 1.0
 * };
 *
 * showMaterialSelectionModal(pattern);
 * // Modal displays with wallpaper/fabric options
 * // User selects material and proceeds to cart
 *
 * @example
 * // Cart update workflow
 * // URL: ?source=cart_edit
 * showMaterialSelectionModal(pattern);
 * // Modal button shows "Update Cart Item"
 * // Clicking updates existing cart item instead of adding new
 *
 * ⚠️ IMPORTANT: Material selection required before cart/product page
 *
 * 🎨 UI: Accordion design with collapse/expand for wallpaper and fabric
 *
 * 🔗 GUIDE: Links to /pages/materials-specifications for detailed info
 *
 * 💰 PRICING: All prices displayed, Contact pricing for grasscloth
 *
 * 🛒 CART MODES: Standard add vs cart item update based on URL source
 *
 * @see redirectToProductConfiguration - Handles redirect after selection
 * @see updateCartItemViaAPI - Updates existing cart items
 * @see getMaterialDisplayName - Gets user-friendly material names
 */
function showMaterialSelectionModal(pattern) {
    // Remove existing modal if present
    var existingModal = document.getElementById('materialSelectionModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal overlay
    var modal = document.createElement('div');
    modal.id = 'materialSelectionModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Special Elite', monospace;
    `;

    // Create modal content
    var modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #1a202c;
        color: #e2e8f0;
        padding: 30px;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        border: 2px solid #4a5568;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

    // Modal header
    var header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 20px; text-align: center;';
    header.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #d4af37; font-size: 18px;">🛒 Proceed to Cart</h3>
        <p style="margin: 0; color: #a0aec0; font-size: 14px;">
            Choose material and configure options for: <strong style="color: #e2e8f0;">${pattern.patternName}</strong><br>
            <span style="font-size: 12px; color: #718096;">You'll be able to select quantity, dimensions, and other options on the product page.</span>
        </p>
    `;

    // Material selection section with accordion
    var materialSection = document.createElement('div');
    materialSection.style.cssText = 'margin-bottom: 25px;';

    var materialLabel = document.createElement('label');
    materialLabel.style.cssText = 'display: block; margin-bottom: 8px; color: #d4af37; font-weight: bold;';
    materialLabel.textContent = 'Select Material:';

    // Add helpful pointer to full material information
    var materialGuide = document.createElement('div');
    materialGuide.style.cssText = 'margin-bottom: 15px; padding: 8px 12px; background: #2d3748; border-left: 3px solid #d4af37; border-radius: 4px;';
    materialGuide.innerHTML = `
        <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.4;">
            Need help choosing? <a href="/pages/materials-specifications" target="_blank" rel="noopener noreferrer" style="color: #d4af37; text-decoration: underline;">View full material specifications & installation guides</a>
        </p>
    `;

    // ✅ FIX: Prevent link click from bubbling up and closing modal
    setTimeout(() => {
        const materialsLink = materialGuide.querySelector('a');
        if (materialsLink) {
            materialsLink.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent modal backdrop click handler from firing
                console.log('🔗 Opening materials page in new tab (modal will stay open)');
            });
        }
    }, 100);

    // Group materials by category
    var wallpaperOptions = [
        {
            value: 'wallpaper-prepasted',
            label: 'Prepasted Wallpaper',
            price: '$180/roll',
            description: 'Finest quality paper 24" wide x 30\' long • Custom-printed • 2-week turnaround'
        },
        {
            value: 'wallpaper-peel-stick',
            label: 'Peel & Stick Wallpaper',
            price: '$320/roll',
            description: '24" wide x 27\' long • Easily removable • Perfect for apartments'
        },
        {
            value: 'wallpaper-unpasted',
            label: 'Unpasted Wallpaper',
            price: '$180/roll',
            description: 'Highest quality • 24" wide x 30\' long • NO ADHESIVE • Preferred by professionals'
        },
        {
            value: 'wallpaper-grasscloth',
            label: 'Grasscloth Wallpaper',
            price: 'Contact for pricing',
            description: 'Natural Grass Cloth • 24" wide x 27\' long • Quietly elevates any space'
        }
    ];

    var fabricOptions = [
        {
            value: 'fabric-soft-velvet',
            label: 'Soft Velvet',
            price: '$29/yard',
            description: 'Luxurious soft velvet with rich texture • 58" width • 5-yard minimum'
        },
        {
            value: 'fabric-decorator-linen',
            label: 'Decorator Linen',
            price: '$29/yard',
            description: 'Premium decorator linen for upholstery • 56" width • 5-yard minimum'
        },
        {
            value: 'fabric-drapery-sheer',
            label: 'Drapery Sheer',
            price: '$24/yard',
            description: 'Lightweight sheer fabric for window treatments • 56" width • 5-yard minimum'
        },
        {
            value: 'fabric-lightweight-linen',
            label: 'Lightweight Linen',
            price: '$26/yard',
            description: 'Versatile lightweight linen fabric • 62" width • 5-yard minimum'
        },
        {
            value: 'fabric-faux-suede',
            label: 'Faux Suede',
            price: '$36/yard',
            description: 'Premium faux suede with authentic texture • 58" width • 5-yard minimum'
        },
        {
            value: 'fabric-drapery-light-block',
            label: 'Drapery Light Block',
            price: '$31/yard',
            description: 'Light-blocking drapery fabric • 56" width • 5-yard minimum'
        }
    ];

    // Create accordion container
    var accordionContainer = document.createElement('div');
    accordionContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    // Helper function to create accordion section
    function createAccordionSection(title, icon, options, isOpen) {
        var section = document.createElement('div');
        section.style.cssText = 'border: 2px solid #4a5568; border-radius: 8px; overflow: hidden;';

        // Accordion header
        var header = document.createElement('div');
        header.style.cssText = `
            background: #2d3748;
            padding: 15px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.3s ease;
        `;

        var headerText = document.createElement('span');
        headerText.style.cssText = 'color: #d4af37; font-weight: bold; font-size: 16px;';
        headerText.textContent = icon + ' ' + title;

        var arrow = document.createElement('span');
        arrow.style.cssText = 'color: #d4af37; transition: transform 0.3s ease;';
        arrow.textContent = isOpen ? '▼' : '▶';

        header.appendChild(headerText);
        header.appendChild(arrow);

        // Accordion content
        var content = document.createElement('div');
        content.style.cssText = `
            max-height: ${isOpen ? '1000px' : '0'};
            overflow: hidden;
            transition: max-height 0.3s ease;
            background: #1a202c;
        `;

        var optionsContainer = document.createElement('div');
        optionsContainer.style.cssText = 'padding: 10px; display: flex; flex-direction: column; gap: 8px;';

        // Add options
        options.forEach(function(option, index) {
            var optionDiv = document.createElement('div');
            optionDiv.style.cssText = `
                border: 1px solid #4a5568;
                border-radius: 6px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #2d3748;
            `;

            var radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'material';
            radio.value = option.value;
            radio.id = 'material_' + option.value;
            radio.style.cssText = 'margin-right: 10px;';

            // Default to first wallpaper option
            if (title === 'Wallpaper' && index === 0) {
                radio.checked = true;
            }

            var label = document.createElement('label');
            label.htmlFor = 'material_' + option.value;
            label.style.cssText = 'cursor: pointer; display: flex; justify-content: space-between; align-items: center; width: 100%;';
            label.innerHTML = `
                <span style="font-weight: bold; color: #e2e8f0;">${option.label}</span>
                <span style="color: #d4af37; font-size: 14px;">${option.price}</span>
            `;

            optionDiv.appendChild(radio);
            optionDiv.appendChild(label);

            // Hover effects
            optionDiv.addEventListener('mouseenter', function() {
                optionDiv.style.borderColor = '#d4af37';
                optionDiv.style.background = '#374151';
            });

            optionDiv.addEventListener('mouseleave', function() {
                if (!radio.checked) {
                    optionDiv.style.borderColor = '#4a5568';
                    optionDiv.style.background = '#2d3748';
                }
            });

            // Click to select
            optionDiv.addEventListener('click', function(e) {
                if (e.target !== radio) {
                    radio.checked = true;
                }
                // Update all option styles
                accordionContainer.querySelectorAll('input[type="radio"]').forEach(function(r) {
                    var container = r.closest('div[style*="border: 1px"]');
                    if (container) {
                        if (r.checked) {
                            container.style.borderColor = '#d4af37';
                            container.style.background = '#374151';
                        } else {
                            container.style.borderColor = '#4a5568';
                            container.style.background = '#2d3748';
                        }
                    }
                });
            });

            optionsContainer.appendChild(optionDiv);
        });

        content.appendChild(optionsContainer);

        // Toggle accordion
        header.addEventListener('click', function() {
            var isCurrentlyOpen = content.style.maxHeight !== '0px';
            if (isCurrentlyOpen) {
                content.style.maxHeight = '0';
                arrow.textContent = '▶';
            } else {
                content.style.maxHeight = '1000px';
                arrow.textContent = '▼';
            }
        });

        header.addEventListener('mouseenter', function() {
            header.style.background = '#374151';
        });

        header.addEventListener('mouseleave', function() {
            header.style.background = '#2d3748';
        });

        section.appendChild(header);
        section.appendChild(content);
        return section;
    }

    // Create wallpaper and fabric sections (both collapsed by default)
    var wallpaperSection = createAccordionSection('Wallpaper', '🗂️', wallpaperOptions, false);
    var fabricSection = createAccordionSection('Fabric', '🧵', fabricOptions, false);

    accordionContainer.appendChild(wallpaperSection);
    accordionContainer.appendChild(fabricSection);

    materialSection.appendChild(materialLabel);
    materialSection.appendChild(materialGuide);
    materialSection.appendChild(accordionContainer);

    // Button section
    var buttonSection = document.createElement('div');
    buttonSection.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 25px;';

    // Cancel button
    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = '❌ Cancel';
    cancelBtn.style.cssText = `
        background: transparent;
        color: #f56565;
        border: 2px solid #f56565;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Special Elite', monospace;
        font-weight: bold;
        transition: all 0.3s ease;
    `;
    cancelBtn.addEventListener('mouseenter', function() {
        cancelBtn.style.background = '#f56565';
        cancelBtn.style.color = 'white';
    });
    cancelBtn.addEventListener('mouseleave', function() {
        cancelBtn.style.background = 'transparent';
        cancelBtn.style.color = '#f56565';
    });
    cancelBtn.addEventListener('click', function() {
        modal.remove();
    });

    // Check if we came from cart editing
    const urlParams = new URLSearchParams(window.location.search);
    const isFromCartEdit = urlParams.get('source') === 'cart_edit' || urlParams.get('source') === 'cart_restore';

    // Proceed to Cart button (replaces direct cart add)
    var configureBtn = document.createElement('button');
    configureBtn.textContent = isFromCartEdit ? '🔄 Update Cart Item' : '🛒 Proceed to Cart';
    configureBtn.style.cssText = `
        background: linear-gradient(135deg, ${isFromCartEdit ? '#d4af37 0%, #b8941f 100%' : '#667eea 0%, #764ba2 100%'});
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Special Elite', monospace;
        font-weight: bold;
        transition: all 0.3s ease;
    `;
    configureBtn.addEventListener('mouseenter', function() {
        configureBtn.style.transform = 'translateY(-2px)';
        configureBtn.style.boxShadow = `0 4px 12px rgba(${isFromCartEdit ? '212, 175, 55' : '102, 126, 234'}, 0.4)`;
    });
    configureBtn.addEventListener('mouseleave', function() {
        configureBtn.style.transform = 'translateY(0)';
        configureBtn.style.boxShadow = 'none';
    });
    configureBtn.addEventListener('click', async function() {
        var selectedMaterial = accordionContainer.querySelector('input[name="material"]:checked').value;

        if (isFromCartEdit) {
            // Handle cart item update
            console.log('🔄 Updating cart item with new pattern configuration...');

            try {
                // Show loading state
                configureBtn.disabled = true;
                configureBtn.textContent = '🔄 Updating...';

                // Get cart item data from localStorage (stored by cart restoration)
                const cartPatternKey = `cart_saved_${pattern.patternName}_${pattern.collectionName}`;
                const cartSavedPattern = localStorage.getItem(cartPatternKey);

                if (!cartSavedPattern) {
                    throw new Error('Could not find original cart item data');
                }

                // Build updated item data
                const updatedItemData = {
                    pattern: pattern.patternName,
                    collectionName: pattern.collectionName,
                    colors: pattern.colors || [],
                    productType: selectedMaterial,
                    productTypeName: getMaterialDisplayName(selectedMaterial),
                    productPrice: getMaterialPrice(selectedMaterial),
                    currentScale: pattern.currentScale || window.appState?.currentScale || 100,
                    scaleMultiplier: pattern.scaleMultiplier || window.appState?.scaleMultiplier || 1.0
                };

                // Update via Shopify cart API (simplified version)
                const cartUpdateResult = await updateCartItemViaAPI(updatedItemData);

                if (cartUpdateResult.success) {
                    // Update localStorage with new pattern
                    const updatedPattern = {
                        ...pattern,
                        source: 'cart_update',
                        timestamp: new Date().toISOString(),
                        productType: selectedMaterial,
                        currentScale: updatedItemData.currentScale,
                        scaleMultiplier: updatedItemData.scaleMultiplier
                    };

                    // Store updated pattern
                    localStorage.setItem(cartPatternKey, JSON.stringify(updatedPattern));

                    // Store thumbnail for cart display
                    if (pattern.thumbnail) {
                        const thumbnailKey = `cart_thumbnail_${pattern.patternName}_${pattern.collectionName}`;
                        const thumbnailInfo = {
                            thumbnail: pattern.thumbnail,
                            colors: pattern.colors,
                            timestamp: new Date().toISOString(),
                            source: 'cart_update'
                        };
                        localStorage.setItem(thumbnailKey, JSON.stringify(thumbnailInfo));
                    }

                    // Show success message and redirect to cart
                    modal.remove();
                    showSuccessNotification('✅ Cart item updated successfully! Redirecting to cart...');

                    setTimeout(() => {
                        window.location.href = '/cart';
                    }, 1500);

                } else {
                    throw new Error(cartUpdateResult.error || 'Cart update failed');
                }

            } catch (error) {
                console.error('❌ Error updating cart item:', error);
                showErrorNotification('❌ Failed to update cart item. Please try again.');

                // Reset button
                configureBtn.disabled = false;
                configureBtn.textContent = '🔄 Update Cart Item';
            }

        } else {
            // Handle normal "Proceed to Cart" flow

            // Store thumbnail in localStorage for the product page to use
            if (pattern.thumbnail) {
                try {
                    // Clean up old saved patterns to free up space
                    cleanupLocalStorage();

                    // Try to store the thumbnail
                    localStorage.setItem('colorflexCurrentThumbnail', pattern.thumbnail);
                    console.log('🖼️ Stored thumbnail in localStorage for product page');
                } catch (quotaError) {
                    console.warn('⚠️ localStorage quota exceeded, trying with smaller thumbnail...');

                    // Create a smaller, more compressed thumbnail as fallback
                    const smallerThumbnail = createCompressedThumbnail(pattern.thumbnail);
                    if (smallerThumbnail) {
                        try {
                            localStorage.setItem('colorflexCurrentThumbnail', smallerThumbnail);
                            console.log('🖼️ Stored compressed thumbnail in localStorage');
                        } catch (stillTooLarge) {
                            console.error('❌ Even compressed thumbnail too large for localStorage');
                            // Continue without thumbnail
                        }
                    }
                }
            }

            redirectToProductConfiguration(pattern, selectedMaterial);
            modal.remove();
        }
    });

    buttonSection.appendChild(cancelBtn);
    buttonSection.appendChild(configureBtn);

    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(materialSection);
    modalContent.appendChild(buttonSection);
    modal.appendChild(modalContent);

    // Close modal when clicking overlay
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Add to page
    document.body.appendChild(modal);

    // Add escape key listener
    function handleEscape(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    }
    document.addEventListener('keydown', handleEscape);
}

/**
 * Clean up localStorage to free up space for thumbnails
 */
function cleanupLocalStorage() {
    try {
        // Clean up old saved patterns (keep only last 10)
        // DON'T remove colorflexCurrentThumbnail or cart_thumbnail_* as they're needed for cart/product pages
        const savedPatterns = JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');
        if (savedPatterns.length > 10) {
            // Sort by timestamp and keep only the most recent 10
            savedPatterns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const recentPatterns = savedPatterns.slice(0, 10);
            localStorage.setItem('colorflexSavedPatterns', JSON.stringify(recentPatterns));
            console.log(`🧹 Cleaned up localStorage: kept ${recentPatterns.length} most recent patterns`);
        }

        // Also clean up very old cart thumbnails (older than 30 days) to prevent infinite growth
        const cartThumbnailKeys = Object.keys(localStorage).filter(key => key.startsWith('cart_thumbnail_'));
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        cartThumbnailKeys.forEach(key => {
            try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                const timestamp = new Date(data.timestamp || 0).getTime();

                if (timestamp < thirtyDaysAgo) {
                    localStorage.removeItem(key);
                    console.log(`🧹 Removed old cart thumbnail: ${key}`);
                }
            } catch (error) {
                // If we can't parse the thumbnail data, remove it
                localStorage.removeItem(key);
                console.log(`🧹 Removed malformed cart thumbnail: ${key}`);
            }
        });

    } catch (error) {
        console.warn('⚠️ Error during localStorage cleanup:', error);
    }
}

/**
 * Aggressive localStorage cleanup - removes non-essential data
 */
function aggressiveLocalStorageCleanup() {
    try {
        console.log('🚨 Starting aggressive localStorage cleanup...');

        // Get storage usage before cleanup
        const beforeSize = JSON.stringify(localStorage).length;

        // Keep essential items including cart thumbnails for long-term preservation
        const essentialKeys = ['colorflexSavedPatterns'];
        const essentialPrefixes = ['cart_thumbnail_', 'colorflexCurrent']; // Protect cart thumbnails
        const toRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !essentialKeys.includes(key)) {
                // Check if key starts with any essential prefix
                const isEssentialPrefix = essentialPrefixes.some(prefix => key.startsWith(prefix));
                if (!isEssentialPrefix) {
                    toRemove.push(key);
                }
            }
        }

        // Remove non-essential items
        toRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed localStorage item: ${key}`);
        });

        // Also clear saved patterns to start fresh (keep only thumbnails)
        localStorage.removeItem('colorflexSavedPatterns');

        const afterSize = JSON.stringify(localStorage).length;
        console.log(`🧹 Aggressive cleanup complete: ${beforeSize} → ${afterSize} bytes (${Math.round((1 - afterSize/beforeSize) * 100)}% reduction)`);

    } catch (error) {
        console.error('❌ Error during aggressive cleanup:', error);
    }
}

/**
 * Create a smaller, more compressed thumbnail for localStorage
 * @param {string} originalThumbnail - Base64 data URL of original thumbnail
 * @returns {string|null} Compressed thumbnail or null if failed
 */
function createCompressedThumbnail(originalThumbnail) {
    try {
        if (!originalThumbnail || !originalThumbnail.startsWith('data:image/')) {
            console.log('🗜️ Invalid thumbnail format, skipping compression');
            return null;
        }

        // Create image and canvas for compression
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set image source - for data URLs this loads synchronously
        img.src = originalThumbnail;

        // Small delay to ensure image is fully loaded (even for data URLs)
        // This is necessary for some browsers that don't load data URLs immediately
        const maxWait = 250; // 250ms max wait (increased from 50ms to prevent compression failures)
        const startTime = Date.now();

        while (!img.complete && Date.now() - startTime < maxWait) {
            // Wait for image to load
        }

        // Check if image loaded successfully
        if (!img.complete && img.naturalWidth === 0) {
            console.warn('🗜️ Image did not load in time, skipping compression');
            return null;
        }

        // Super aggressive compression - very small size and minimal quality
        canvas.width = 100;  // Much smaller
        canvas.height = 100; // Much smaller

        ctx.drawImage(img, 0, 0, 100, 100);

        // Maximum compression (10% quality)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.1);
        console.log('🗜️ Original size:', originalThumbnail.length, 'Compressed size:', compressedDataUrl.length);

        // Return even if compression is modest - any reduction helps
        if (compressedDataUrl.length < originalThumbnail.length * 0.9) {
            return compressedDataUrl;
        }

        console.log('🗜️ Compression did not reduce size significantly, returning null');
        return null; // Compression failed or not enough savings

    } catch (error) {
        console.error('❌ Failed to create compressed thumbnail:', error);
        return null;
    }
}

/**
 * Redirects to product configuration page with pattern and material data
 *
 * Initiates the ProductConfigurationFlow system to guide users through
 * the cart addition process. This function serves as the bridge between
 * the ColorFlex pattern customization interface and the Shopify cart
 * system, handling all necessary data transformation and storage.
 *
 * Flow Sequence:
 * 1. Validates ProductConfigurationFlow availability
 * 2. Retrieves material specifications (price, units, coverage)
 * 3. Builds cartItem object from pattern and material data
 * 4. Stores thumbnail in localStorage for product page display
 * 5. Initializes ProductConfigurationFlow if needed
 * 6. Calls interceptAddToCart() to start multi-step configuration
 * 7. Falls back to direct redirect if flow unavailable
 *
 * CartItem Structure Created:
 * - pattern: Complete pattern data (name, colors, scale, thumbnail)
 * - category: Material category ('wallpaper' or 'fabric')
 * - preferredMaterial: Selected material ID
 * - materialInfo: Specifications (price, unit, minimum, width, coverage)
 *
 * Material Data Retrieval:
 * - getFabricSpecByMaterialId(): Returns material specifications object
 * - getMaterialDisplayName(): Returns user-friendly material name
 * - getMaterialPrice(): Returns price per unit (roll or yard)
 *
 * LocalStorage Usage:
 * - Key: 'colorflexCurrentThumbnail'
 * - Value: Base64 JPEG thumbnail (800x800px, ~50-100KB)
 * - Purpose: Display pattern preview on product configuration page
 * - Cleanup: Should be removed after product page loads thumbnail
 *
 * Fallback Behavior:
 * - Triggers when ProductConfigurationFlow undefined or errors occur
 * - Uses fallbackDirectRedirect() for direct navigation to product page
 * - Redirects to /products/custom-wallpaper or /products/custom-fabric
 * - Passes pattern data via URL parameters
 * - Less robust than ProductConfigurationFlow but maintains functionality
 *
 * @param {Object} pattern - Saved pattern object from appState or localStorage
 * @param {string} pattern.name - Pattern name (e.g., "Tudor Rose")
 * @param {string} pattern.patternName - Alternative pattern name field
 * @param {string} pattern.collection - Collection name (e.g., "English Cottage")
 * @param {string} pattern.collectionName - Alternative collection field
 * @param {string} pattern.id - Pattern ID with SW numbers (e.g., "SW7006-SW6258-tudor-rose")
 * @param {Array<Object>} pattern.colors - Layer color assignments
 * @param {string} pattern.colors[].label - Layer label (e.g., "Background")
 * @param {string} pattern.colors[].color - SW color name (e.g., "SW7006 Eider White")
 * @param {string} pattern.thumbnail - Base64 JPEG thumbnail data
 * @param {number} [pattern.currentScale=100] - Scale percentage (50, 100, 200, 300, 400)
 * @param {number} [pattern.scaleMultiplier=1.0] - Scale multiplier (0.5, 1.0, 2.0, 3.0, 4.0)
 * @param {string} [pattern.patternSize] - Pattern size in inches (e.g., "24x24")
 * @param {string} [pattern.tilingType] - Tiling type (e.g., "half-drop", "standard")
 * @param {string} [pattern.timestamp] - Save timestamp ISO string
 * @param {string} material - Material ID (e.g., "wallpaper-prepasted", "fabric-decorator-linen")
 * @returns {void} No return value (redirects to product page or shows error notification)
 *
 * @example
 * // Normal flow with ProductConfigurationFlow
 * const pattern = {
 *   name: 'Tudor Rose',
 *   collection: 'English Cottage',
 *   id: 'SW7006-SW6258-tudor-rose',
 *   colors: [
 *     {label: 'Background', color: 'SW7006 Eider White'},
 *     {label: 'Accent', color: 'SW6258 Tricorn Black'}
 *   ],
 *   thumbnail: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
 *   currentScale: 200,
 *   scaleMultiplier: 2.0
 * };
 *
 * redirectToProductConfiguration(pattern, 'wallpaper-prepasted');
 * // Console: ⚙️ Starting ProductConfigurationFlow...
 * // Console: 🎯 Using ProductConfigurationFlow.interceptAddToCart()
 * // Result: ProductConfigurationFlow modal displays with pattern preview
 *
 * @example
 * // Fallback flow when ProductConfigurationFlow unavailable
 * window.ProductConfigurationFlow = undefined; // Simulate unavailable
 * redirectToProductConfiguration(pattern, 'fabric-decorator-linen');
 * // Console: ❌ ProductConfigurationFlow not found - falling back to direct redirect
 * // Console: 🔄 Using fallback direct redirect to Custom Wallpaper/Custom Fabric
 * // Result: Redirects to /products/custom-fabric?pattern_name=Tudor+Rose&...
 *
 * @example
 * // Error handling
 * const invalidPattern = {name: 'Test'}; // Missing required fields
 * redirectToProductConfiguration(invalidPattern, 'wallpaper-prepasted');
 * // Console: ❌ Error starting ProductConfigurationFlow: [error details]
 * // Notification: ❌ Error starting configuration
 * // Result: Falls back to direct redirect with available data
 *
 * ⚠️ IMPORTANT: Requires ProductConfigurationFlow.js loaded on page
 *
 * 🔧 FALLBACK: Uses direct redirect if ProductConfigurationFlow unavailable
 *
 * 💾 STORAGE: Stores thumbnail in localStorage for product page display
 *
 * 🎯 FLOW: ProductConfigurationFlow provides multi-step cart configuration
 *
 * 📦 CART ITEM: Preserves all pattern data for cart line item properties
 *
 * 🛒 MATERIALS: Supports all wallpaper and fabric material IDs
 *
 * @see showMaterialSelectionModal - Displays material selection before calling this
 * @see fallbackDirectRedirect - Fallback function for direct product redirect
 * @see getFabricSpecByMaterialId - Retrieves material specifications
 * @see getMaterialDisplayName - Gets user-friendly material names
 * @see getMaterialPrice - Gets material pricing information
 * @see window.ProductConfigurationFlow - External configuration flow system
 */
function redirectToProductConfiguration(pattern, material) {
    try {
        console.log('⚙️ Starting ProductConfigurationFlow for:', pattern.patternName, 'Material:', material);
        
        // Show loading notification
        showSaveNotification('🔄 Starting configuration flow...');
        
        // Check if ProductConfigurationFlow is available
        if (typeof window.ProductConfigurationFlow === 'undefined') {
            console.error('❌ ProductConfigurationFlow not found - falling back to direct redirect');
            return fallbackDirectRedirect(pattern, material);
        }
        
        // Use ProductConfigurationFlow for proper multi-step flow
        console.log('🎯 Using ProductConfigurationFlow.interceptAddToCart()');
        
        // Get material specifications for pricing
        const materialSpec = getFabricSpecByMaterialId(material);
        const materialDisplayName = getMaterialDisplayName(material);
        const materialPrice = getMaterialPrice(material);

        // Use the exact saved pattern data structure (no reconstruction needed)
        const cartItem = {
            pattern: {
                // Use saved pattern field names exactly
                name: pattern.name || pattern.patternName, // Saved patterns use 'name'
                patternName: pattern.name || pattern.patternName, // Fallback for compatibility
                collection: pattern.collection || pattern.collectionName || '', // Saved patterns use 'collection'
                id: pattern.id, // Already correct format with SW numbers
                colors: pattern.colors || [], // Already correct array format
                thumbnail: pattern.thumbnail, // Already base64 image data
                saveDate: pattern.timestamp || pattern.saveDate || new Date().toISOString(),
                patternSize: pattern.patternSize || '',
                tilingType: pattern.tilingType || '',
                // Include scaling data if available
                currentScale: pattern.currentScale || 100,
                scaleMultiplier: pattern.scaleMultiplier || 1.0
            },
            category: material, // 'wallpaper' or 'fabric'
            preferredMaterial: material,
            materialInfo: {
                materialId: material,
                displayName: materialDisplayName,
                price: materialPrice,
                unit: materialSpec?.material === 'fabric' ? 'yards' : 'rolls',
                minimum: materialSpec?.material === 'fabric' ? materialSpec.minimumYards : materialSpec?.minimumRolls || 1,
                pricePerUnit: materialSpec?.pricePerYard || materialSpec?.pricePerRoll || 89.99,
                width: materialSpec?.width || '',
                coverage: materialSpec?.coverage || '',
                description: materialSpec?.description || ''
            }
        };
        
        // Store thumbnail in localStorage for product page display
        if (pattern.thumbnail) {
            try {
                console.log('🖼️ Storing pattern thumbnail for product page display');
                localStorage.setItem('colorflexCurrentThumbnail', pattern.thumbnail);
            } catch (error) {
                console.warn('⚠️ Failed to store thumbnail in localStorage:', error);
            }
        }
        
        // Initialize ProductConfigurationFlow if needed
        if (!window.configFlow) {
            console.log('🔧 Initializing ProductConfigurationFlow...');
            window.configFlow = new window.ProductConfigurationFlow();
        }
        
        // Start the configuration flow
        console.log('🚀 Starting configuration flow with data:', cartItem);
        window.configFlow.interceptAddToCart(cartItem);
        
    } catch (error) {
        console.error('❌ Error starting ProductConfigurationFlow:', error);
        showSaveNotification('❌ Error starting configuration');
        
        // Fallback: direct redirect to Custom Wallpaper/Custom Fabric
        fallbackDirectRedirect(pattern, material);
    }
}

/**
 * Fallback function for direct redirect when ProductConfigurationFlow fails
 */
function fallbackDirectRedirect(pattern, material) {
    console.log('🔄 Using fallback direct redirect to Custom Wallpaper/Custom Fabric');
    
    // Store thumbnail in localStorage for product page display
    if (pattern.thumbnail) {
        try {
            console.log('🖼️ Storing pattern thumbnail for product page display (fallback)');
            localStorage.setItem('colorflexCurrentThumbnail', pattern.thumbnail);
        } catch (error) {
            console.warn('⚠️ Failed to store thumbnail in localStorage:', error);
        }
    }
    
    // Determine product handle based on material (check if material starts with 'wallpaper-' or 'fabric-')
    const productHandle = material.startsWith('wallpaper-') ? 'custom-wallpaper' : 'custom-fabric';
    
    // Build URL parameters using saved pattern structure
    const params = new URLSearchParams({
        'pattern_name': pattern.name || pattern.patternName, // Saved patterns use 'name'
        'collection': pattern.collection || pattern.collectionName || '', // Saved patterns use 'collection'
        'pattern_id': pattern.id, // Already correct format with SW numbers
        'custom_colors': pattern.colors ? pattern.colors.map(c => normalizeColorToSwFormat(c.color)).join(',') : '',
        'scale': pattern.currentScale || 100, // Include scale information
        'source': 'colorflex_saved_patterns',
        'preferred_material': material,
        'save_date': pattern.timestamp || pattern.saveDate || new Date().toISOString()
    });
    
    const productUrl = `/products/${productHandle}?${params.toString()}`;
    console.log('🎯 Redirecting to:', productUrl);
    
    showSaveNotification('🔄 Redirecting to product page...');
    window.location.href = productUrl;
}

/**
 * Try multiple product handles until one works
 * @param {Array} handles - Array of handles to try
 * @param {string} urlParams - URL parameters string
 * @param {Object} pattern - Pattern data
 * @param {string} material - Material type
 * @param {number} index - Current handle index
 */
function tryProductHandles(handles, urlParams, pattern, material, index) {
    if (index >= handles.length) {
        console.warn('❌ No valid product page found for any handle');
        showSaveNotification('❌ Product page not found');
        showProductSearchInstructions(pattern, material);
        return;
    }
    
    var handle = handles[index];
    var testUrl = '/products/' + handle + '.js'; // Use .js endpoint to test if product exists
    
    console.log(`🔍 Testing handle ${index + 1}/${handles.length}: ${handle}`);
    
    fetch(testUrl)
        .then(function(response) {
            if (response.ok) {
                // Product exists! Redirect to it
                var fullUrl = '/products/' + handle + '?' + urlParams;
                console.log('✅ Found product! Redirecting to:', fullUrl);
                showSaveNotification('✅ Product found! Opening...');
                window.location.href = fullUrl;
            } else {
                // Try next handle
                console.log('❌ Handle not found:', handle);
                tryProductHandles(handles, urlParams, pattern, material, index + 1);
            }
        })
        .catch(function(error) {
            console.log('❌ Error testing handle:', handle, error);
            // Try next handle
            tryProductHandles(handles, urlParams, pattern, material, index + 1);
        });
}

/**
 * Show manual product search instructions as fallback
 * @param {Object} pattern - Pattern data
 * @param {string} material - Material type
 */
function showProductSearchInstructions(pattern, material) {
    var productHandle = generateProductHandle(pattern, material);
    var searchTerm = pattern.patternName;
    
    var instructions = `
🔍 To find this product manually:

1. Search for: "${searchTerm}"
2. Or try the direct link: /products/${productHandle}
3. Select material: ${material === 'wallpaper' ? 'Wallpaper' : 'Fabric'}
4. Configure your options:
   • Quantity/Square footage
   • Dimensions (if applicable)
   • Special requests
5. Add custom colors in notes:
   ${pattern.colors ? pattern.colors.map(c => c.color.replace(/^(SW|SC)\d+\s*/i, '').trim()).join(', ') : 'Use ColorFlex custom colors'}

Pattern Details:
• Collection: ${pattern.collectionName || 'N/A'}
• Saved: ${pattern.saveDate || 'Recently'}
• ColorFlex Design: Yes
    `.trim();
    
    // Create a better modal for instructions
    showProductInstructionsModal(instructions, productHandle, pattern);
}

/**
 * Show product instructions in a modal format
 * @param {string} instructions - Instructions text
 * @param {string} productHandle - Product handle
 * @param {Object} pattern - Pattern data
 */
function showProductInstructionsModal(instructions, productHandle, pattern) {
    // Remove existing modal if present
    var existingModal = document.getElementById('productInstructionsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal
    var modal = document.createElement('div');
    modal.id = 'productInstructionsModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Special Elite', monospace;
    `;

    var modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #1a202c;
        color: #e2e8f0;
        padding: 30px;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        border: 2px solid #f56565;
    `;

    modalContent.innerHTML = `
        <h3 style="color: #f56565; margin-bottom: 20px;">📝 Product Search Instructions</h3>
        <pre style="white-space: pre-wrap; font-family: 'Special Elite', monospace; font-size: 12px; line-height: 1.4; color: #e2e8f0;">${instructions}</pre>
        <div style="margin-top: 25px; display: flex; gap: 12px; justify-content: flex-end;">
            <button onclick="this.closest('#productInstructionsModal').remove()" style="
                background: transparent;
                color: #f56565;
                border: 2px solid #f56565;
                padding: 10px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Special Elite', monospace;
                font-weight: bold;
            ">Close</button>
            <button onclick="navigator.clipboard.writeText('${productHandle}'); this.style.background='#48bb78'; this.textContent='✅ Copied!'" style="
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Special Elite', monospace;
                font-weight: bold;
            ">📋 Copy Handle</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Adds custom pattern to Shopify cart with selected material specifications
 *
 * Creates a complete cart item with pattern customization data and adds it
 * to the Shopify cart using the AJAX Cart API. This function handles the
 * entire cart addition workflow including product handle generation, data
 * formatting, API communication, and user feedback notifications.
 *
 * Workflow:
 * 1. Generates Shopify product handle from pattern and material
 * 2. Formats scale value for user-friendly display (100 → "1X", 200 → "2X")
 * 3. Builds cart item with properties (pattern name, colors, material, scale)
 * 4. Shows loading notification during API call
 * 5. Adds item to cart via addToShopifyCart() AJAX API
 * 6. Updates cart badge count on success
 * 7. Shows success/error notifications
 * 8. Falls back to manual instructions if API fails
 *
 * Cart Item Properties Created:
 * - Pattern Name: Pattern name from collections.json
 * - Collection: Collection name (e.g., "English Cottage")
 * - Material: "Wallpaper" or "Fabric" (user-friendly display)
 * - Custom Colors: Color names without SW numbers (e.g., "Eider White, Tricorn Black")
 * - ColorFlex Design: "Yes" (identifies custom ColorFlex items)
 * - Save Date: Pattern save date or current date
 * - Pattern ID: Unique pattern ID with SW numbers
 * - Pattern Scale: Formatted scale (0.5X, 1X, 2X, 3X, 4X)
 *
 * Scale Formatting:
 * - 50% → "0.5X" (half size)
 * - 100% → "1X" (normal size)
 * - 200% → "2X" (double size)
 * - 300% → "3X" (triple size)
 * - 400% → "4X" (quadruple size)
 * - Other → "N%" (percentage display)
 *
 * Product Handle Generation:
 * Uses generateProductHandle() to create Shopify product handle from:
 * - Pattern name (kebab-case)
 * - Material type (wallpaper/fabric)
 * - Collection name
 *
 * Cart Badge Update:
 * Automatically updates cart icon badge count after successful addition
 * using updateCartBadge() function.
 *
 * Error Handling:
 * - API errors: Shows error notification and fallback instructions
 * - Missing data: Provides defaults (e.g., "Default" for colors)
 * - Network failures: Triggers manual cart instructions modal
 *
 * @param {Object} pattern - Saved pattern object with customization data
 * @param {string} pattern.patternName - Pattern name (e.g., "Tudor Rose")
 * @param {string} pattern.collectionName - Collection name (e.g., "English Cottage")
 * @param {string} pattern.id - Pattern ID with SW numbers (e.g., "SW7006-SW6258-tudor-rose")
 * @param {Array<Object>} pattern.colors - Layer color assignments
 * @param {string} pattern.colors[].color - SW color name (e.g., "SW7006 Eider White")
 * @param {string} [pattern.saveDate] - Save date (defaults to current date)
 * @param {string} material - Material ID (e.g., "wallpaper-prepasted", "fabric-decorator-linen")
 * @returns {void} No return value (async operation with callbacks)
 *
 * @example
 * // Add wallpaper pattern to cart
 * const pattern = {
 *   patternName: 'Tudor Rose',
 *   collectionName: 'English Cottage',
 *   id: 'SW7006-SW6258-tudor-rose',
 *   colors: [
 *     {label: 'Background', color: 'SW7006 Eider White'},
 *     {label: 'Accent', color: 'SW6258 Tricorn Black'}
 *   ],
 *   saveDate: '11/30/2025'
 * };
 *
 * addPatternToCart(pattern, 'wallpaper-prepasted');
 * // Console: 🛒 Adding pattern to cart: Tudor Rose Material: wallpaper-prepasted
 * // Notification: 🔄 Adding to cart...
 * // Console: ✅ Successfully added to cart: [response data]
 * // Notification: ✅ Tudor Rose (wallpaper-prepasted) added to cart!
 * // Result: Cart badge updates with new count
 *
 * @example
 * // Add fabric pattern with scale
 * appState.currentScale = 200; // 2X scale
 * const fabricPattern = {
 *   patternName: 'Chippendale',
 *   collectionName: 'English Cottage',
 *   id: 'SW7006-SC0001-chippendale-2X',
 *   colors: [
 *     {color: 'SW7006 Eider White'},
 *     {color: 'SC0001 Cottage Linen'}
 *   ]
 * };
 *
 * addPatternToCart(fabricPattern, 'fabric-decorator-linen');
 * // Cart item includes: Pattern Scale: "2X"
 *
 * @example
 * // Error handling - API failure
 * addPatternToCart(pattern, 'invalid-material');
 * // Console: ❌ Failed to add to cart: [error details]
 * // Notification: ❌ Failed to add to cart. Please try again.
 * // Result: Shows manual cart instructions modal
 *
 * ⚠️ IMPORTANT: Requires Shopify AJAX Cart API enabled on theme
 *
 * 🛒 CART: Uses Shopify /cart/add.js endpoint for item addition
 *
 * 🎨 FORMAT: Removes SW/SC prefixes from colors in cart display
 *
 * 📊 BADGE: Auto-updates cart badge count after successful addition
 *
 * 🔧 FALLBACK: Shows manual instructions if API fails
 *
 * 💾 PROPERTIES: All customization data stored as line item properties
 *
 * @see addToShopifyCart - Handles actual AJAX API call to Shopify
 * @see generateProductHandle - Creates Shopify product handle from pattern
 * @see updateCartBadge - Updates cart icon badge count
 * @see showSaveNotification - Displays status notifications to user
 * @see showManualCartInstructions - Fallback instructions modal
 */
function addPatternToCart(pattern, material) {
    try {
        console.log('🛒 Adding pattern to cart:', pattern.patternName, 'Material:', material);

        // Generate Shopify product handle from pattern data
        var productHandle = generateProductHandle(pattern, material);

        // Format scale for user-friendly display
        function formatScaleForCart(scaleValue) {
            const scale = parseInt(scaleValue) || 100;
            switch (scale) {
                case 50: return '0.5X';
                case 100: return '1X';
                case 200: return '2X';
                case 300: return '3X';
                case 400: return '4X';
                default: return `${scale}%`;
            }
        }

        // Create cart item data
        var cartItem = {
            id: productHandle, // This will need to be the actual Shopify variant ID
            quantity: 1,
            properties: {
                'Pattern Name': pattern.patternName,
                'Collection': pattern.collectionName,
                'Material': material === 'wallpaper' ? 'Wallpaper' : 'Fabric',
                'Custom Colors': pattern.colors ? pattern.colors.map(c => c.color.replace(/^(SW|SC)\d+\s*/i, '').trim()).join(', ') : 'Default',
                'ColorFlex Design': 'Yes',
                'Save Date': pattern.saveDate || new Date().toLocaleDateString(),
                'Pattern ID': pattern.id,
                'Pattern Scale': formatScaleForCart(appState.currentScale || 100)
            }
        };

        // Show loading state
        showSaveNotification('🔄 Adding to cart...');

        // Add to Shopify cart using AJAX API
        addToShopifyCart(cartItem, material)
            .then(function(response) {
                console.log('✅ Successfully added to cart:', response);
                showSaveNotification(`✅ ${pattern.patternName} (${material}) added to cart!`);
                
                // Optional: Update cart UI elements if they exist
                updateCartBadge();
            })
            .catch(function(error) {
                console.error('❌ Failed to add to cart:', error);
                showSaveNotification('❌ Failed to add to cart. Please try again.');
                
                // Fallback: Show manual instructions
                showManualCartInstructions(pattern, material);
            });

    } catch (error) {
        console.error('❌ Error in addPatternToCart:', error);
        showSaveNotification('❌ Error adding to cart');
    }
}

/**
 * Generate multiple possible Shopify product handles from pattern data
 * @param {Object} pattern - Pattern data
 * @param {string} material - Material type
 * @returns {Array} Array of possible product handles to try
 */
function generateProductHandles(pattern, material) {
    // Convert pattern name to handle format
    var patternHandle = pattern.patternName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Remove duplicate hyphens
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    var collectionHandle = '';
    if (pattern.collectionName) {
        collectionHandle = pattern.collectionName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // Generate multiple possible handles to try
    var possibleHandles = [];
    
    if (collectionHandle && patternHandle) {
        // Try base handle first (this matches your CSV format)
        possibleHandles.push(collectionHandle + '-' + patternHandle);
        possibleHandles.push(patternHandle);
        
        // Then try with material suffixes
        possibleHandles.push(collectionHandle + '-' + patternHandle + '-' + material);
        possibleHandles.push(patternHandle + '-' + material);
        possibleHandles.push(collectionHandle + '-' + patternHandle + '-wallpaper');
        possibleHandles.push(collectionHandle + '-' + patternHandle + '-fabric');
        
        // Try with different separators
        possibleHandles.push(patternHandle + '-from-' + collectionHandle);
        possibleHandles.push(patternHandle + '-' + collectionHandle);
    } else if (patternHandle) {
        possibleHandles.push(patternHandle);
        possibleHandles.push(patternHandle + '-' + material);
        possibleHandles.push(patternHandle + '-wallpaper');
        possibleHandles.push(patternHandle + '-fabric');
    }
    
    // Remove duplicates
    return [...new Set(possibleHandles)];
}

/**
 * Legacy function for backward compatibility
 */
function generateProductHandle(pattern, material) {
    var handles = generateProductHandles(pattern, material);
    return handles[0] || 'unknown-pattern';
}

/**
 * Add item to Shopify cart using AJAX API
 * @param {Object} cartItem - Cart item data
 * @param {string} material - Material type for error handling
 * @returns {Promise} Cart API response
 */
function addToShopifyCart(cartItem, material) {
    return new Promise(function(resolve, reject) {
        // First, try to find the product by handle
        var productHandle = cartItem.id;
        
        // In a real implementation, you'd need to:
        // 1. Look up the product by handle using Storefront API
        // 2. Get the variant ID for the specific material
        // 3. Add the variant ID to cart using AJAX API
        
        // For now, we'll simulate the cart addition
        // This would be replaced with actual Shopify AJAX cart calls
        
        // Simulate network delay
        setTimeout(function() {
            // Check if we're in a Shopify environment
            if (typeof window.Shopify !== 'undefined' && window.Shopify.routes) {
                // Real Shopify environment - attempt actual cart add
                tryRealShopifyCartAdd(cartItem, resolve, reject);
            } else {
                // Development/preview environment - simulate success
                console.log('📝 Simulated cart addition (development mode)');
                resolve({
                    product_handle: productHandle,
                    material: material,
                    message: 'Cart addition simulated successfully'
                });
            }
        }, 500);
    });
}

/**
 * Attempt real Shopify cart addition
 * @param {Object} cartItem - Cart item data
 * @param {Function} resolve - Promise resolve
 * @param {Function} reject - Promise reject
 */
function tryRealShopifyCartAdd(cartItem, resolve, reject) {
    try {
        console.log('🔍 Looking up product for cart addition:', cartItem.id);
        
        // First, look up the product by handle to get the variant ID
        lookupProductByHandle(cartItem.id)
            .then(function(productData) {
                if (!productData || !productData.variants || productData.variants.length === 0) {
                    throw new Error('Product not found or has no variants');
                }
                
                // Find the best matching variant based on material type
                var variant = findBestVariantForMaterial(productData.variants, cartItem.properties.Material);
                
                console.log('✅ Found variant:', variant.id, variant.title);
                
                // Add to cart using Shopify AJAX Cart API
                return fetch('/cart/add.js', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        items: [{
                            id: variant.id,
                            quantity: cartItem.quantity,
                            properties: cartItem.properties
                        }]
                    })
                });
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Cart add failed: ' + response.status + ' ' + response.statusText);
                }
                return response.json();
            })
            .then(function(data) {
                console.log('✅ Successfully added to Shopify cart:', data);
                resolve({
                    success: true,
                    cartData: data,
                    message: 'Successfully added to cart'
                });
            })
            .catch(function(error) {
                console.error('❌ Cart addition failed:', error);
                reject(error);
            });
            
    } catch (error) {
        console.error('❌ Error in tryRealShopifyCartAdd:', error);
        reject(error);
    }
}

/**
 * Find the best matching variant for the selected material
 * @param {Array} variants - Product variants
 * @param {string} materialType - 'Wallpaper' or 'Fabric'
 * @returns {Object} Best matching variant
 */
function findBestVariantForMaterial(variants, materialType) {
    console.log('🔍 Finding variant for material:', materialType, 'from', variants.length, 'variants');
    
    if (!variants || variants.length === 0) {
        throw new Error('No variants available');
    }
    
    // If only one variant, return it
    if (variants.length === 1) {
        return variants[0];
    }
    
    // Try to find variant that matches the material type
    var materialKeywords = materialType.toLowerCase() === 'wallpaper' 
        ? ['wallpaper', 'wall paper', 'peel', 'stick', 'removable']
        : ['fabric', 'cotton', 'textile', 'yard', 'material'];
    
    // First, try to find exact material match
    var exactMatch = variants.find(function(variant) {
        var title = (variant.title || '').toLowerCase();
        var option1 = (variant.option1 || '').toLowerCase();
        var option2 = (variant.option2 || '').toLowerCase();
        
        return materialKeywords.some(function(keyword) {
            return title.includes(keyword) || option1.includes(keyword) || option2.includes(keyword);
        });
    });
    
    if (exactMatch && exactMatch.available) {
        console.log('✅ Found exact material match:', exactMatch.title);
        return exactMatch;
    }
    
    // If no exact match, try available variants first
    var availableVariant = variants.find(function(variant) {
        return variant.available;
    });
    
    if (availableVariant) {
        console.log('✅ Using available variant:', availableVariant.title);
        return availableVariant;
    }
    
    // Last resort: return first variant
    console.log('⚠️ Using first variant as fallback:', variants[0].title);
    return variants[0];
}

/**
 * Look up product by handle using Shopify's product JSON endpoint
 * @param {string} productHandle - Product handle
 * @returns {Promise} Product data
 */
function lookupProductByHandle(productHandle) {
    return new Promise(function(resolve, reject) {
        console.log('🔍 Looking up product by handle:', productHandle);
        
        // Try to fetch product data from Shopify's product JSON endpoint
        var productUrl = '/products/' + productHandle + '.js';
        
        fetch(productUrl)
            .then(function(response) {
                if (!response.ok) {
                    // If exact handle doesn't work, try some variations
                    if (response.status === 404) {
                        console.log('📝 Product not found, trying handle variations...');
                        return tryProductHandleVariations(productHandle);
                    }
                    throw new Error('Product lookup failed: ' + response.status);
                }
                return response.json();
            })
            .then(function(product) {
                console.log('✅ Product found:', product.title, 'Variants:', product.variants.length);
                resolve(product);
            })
            .catch(function(error) {
                console.error('❌ Product lookup failed:', error);
                reject(error);
            });
    });
}

/**
 * Try different variations of the product handle
 * @param {string} baseHandle - Original handle
 * @returns {Promise} Product data or rejection
 */
function tryProductHandleVariations(baseHandle) {
    return new Promise(function(resolve, reject) {
        // Common handle variations to try
        var variations = [
            baseHandle.replace('-wallpaper', '').replace('-fabric', ''), // Remove material suffix
            baseHandle.replace(/^[^-]+-/, ''), // Remove collection prefix
            baseHandle.split('-').slice(0, -1).join('-'), // Remove last segment
            baseHandle.replace(/-/g, '_'), // Replace hyphens with underscores
            baseHandle.toLowerCase().replace(/[^a-z0-9-]/g, '') // Clean special characters
        ];
        
        console.log('🔄 Trying handle variations:', variations);
        
        // Try each variation
        var tryNext = function(index) {
            if (index >= variations.length) {
                reject(new Error('No product found for any handle variation'));
                return;
            }
            
            var handle = variations[index];
            if (!handle || handle === baseHandle) {
                tryNext(index + 1);
                return;
            }
            
            console.log('🔍 Trying variation:', handle);
            
            fetch('/products/' + handle + '.js')
                .then(function(response) {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Not found');
                })
                .then(function(product) {
                    console.log('✅ Found product with variation:', handle, product.title);
                    resolve(product);
                })
                .catch(function() {
                    tryNext(index + 1);
                });
        };
        
        tryNext(0);
    });
}

/**
 * Show manual cart instructions as fallback
 * @param {Object} pattern - Pattern data
 * @param {string} material - Material type
 */
function showManualCartInstructions(pattern, material) {
    var instructions = `
        To manually add this pattern to your cart:
        
        1. Search for: "${pattern.patternName}"
        2. Select material: ${material === 'wallpaper' ? 'Wallpaper' : 'Fabric'}
        3. Add your custom colors in the notes: ${pattern.colors ? pattern.colors.map(c => c.color.replace(/^(SW|SC)\d+\s*/i, '').trim()).join(', ') : 'Default colors'}
    `;
    
    alert('Manual Cart Instructions:\n' + instructions);
}

/**
 * Update cart badge/counter if it exists
 */
function updateCartBadge() {
    // Fetch current cart data to get accurate count
    fetch('/cart.js')
        .then(function(response) {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Cart fetch failed');
        })
        .then(function(cart) {
            var itemCount = cart.item_count;
            console.log('🛒 Updated cart count:', itemCount);
            
            // Look for common cart badge selectors
            var cartBadges = [
                '#cart-count',
                '.cart-count', 
                '.cart-counter',
                '[data-cart-count]',
                '.header-cart-count',
                '[data-cart-item-count]',
                '.cart-item-count'
            ];
            
            cartBadges.forEach(function(selector) {
                var badge = document.querySelector(selector);
                if (badge) {
                    console.log('📊 Updating cart badge:', selector, itemCount);
                    
                    // Update the count
                    if (badge.hasAttribute('data-cart-count') || badge.hasAttribute('data-cart-item-count')) {
                        badge.setAttribute('data-cart-count', itemCount);
                        badge.setAttribute('data-cart-item-count', itemCount);
                    }
                    
                    // Update text content
                    badge.textContent = itemCount;
                    
                    // Add visual feedback animation
                    badge.style.animation = 'pulse 0.5s ease-in-out';
                    badge.style.transform = 'scale(1.2)';
                    
                    setTimeout(function() {
                        badge.style.animation = '';
                        badge.style.transform = 'scale(1)';
                    }, 500);
                    
                    // Show/hide badge based on count
                    if (itemCount > 0) {
                        badge.style.display = '';
                        if (badge.classList) {
                            badge.classList.remove('hidden');
                            badge.classList.add('visible');
                        }
                    } else {
                        if (badge.classList && badge.classList.contains('hide-when-empty')) {
                            badge.style.display = 'none';
                        }
                    }
                }
            });
            
            // Trigger custom cart update event for theme compatibility
            var cartUpdateEvent = new CustomEvent('cart:updated', {
                detail: { cart: cart, itemCount: itemCount }
            });
            document.dispatchEvent(cartUpdateEvent);
            
            // Also try updating via Shopify's theme events if available
            if (window.theme && window.theme.cartCounter) {
                window.theme.cartCounter.update(itemCount);
            }
            
        })
        .catch(function(error) {
            console.error('❌ Failed to update cart badge:', error);
            
            // Fallback: just add visual feedback without count update
            var cartBadges = ['#cart-count', '.cart-count', '.cart-counter'];
            cartBadges.forEach(function(selector) {
                var badge = document.querySelector(selector);
                if (badge) {
                    badge.style.animation = 'pulse 0.5s ease-in-out';
                    setTimeout(function() {
                        badge.style.animation = '';
                    }, 500);
                }
            });
        });
}

// ============================================================================
// SECTION 3: PATTERN LOADING & PREVIEW
// ============================================================================
// Functions for loading saved patterns, previewing them, and restoring UI state.
// ============================================================================

// Preview a saved pattern by loading it into the main interface
function previewSavedPattern(pattern) {
    try {
        console.log('👁️ Previewing saved pattern:', pattern.patternName);
        
        // 🆕 PERSISTENT MODAL: Only close modal if not in persistent mode
        // Check if we have a persistent modal source (from unified modal or theme.liquid)
        const modal = document.getElementById('savedPatternsModal');
        const unifiedModal = document.getElementById('unifiedSavedPatternsModal');
        const isPersistentContext = unifiedModal || (modal && modal.dataset && modal.dataset.persistent);
        
        if (modal && !isPersistentContext) {
            console.log('🔄 Closing non-persistent modal');
            modal.remove();
        } else if (modal && isPersistentContext) {
            console.log('🔒 Keeping persistent modal open for continued browsing');
        }
        
        // Find the collection and pattern
        const targetCollection = appState.collections.find(
            c => c && typeof c.name === 'string' && c.name.toLowerCase() === pattern.collectionName.toLowerCase()
        );
        
        if (!targetCollection) {
            showSaveNotification('❌ Collection "' + pattern.collectionName + '" not found');
            return;
        }
        
        const targetPattern = targetCollection.patterns.find(
            p => p && typeof p.name === 'string' && p.name.toLowerCase() === pattern.patternName.toLowerCase()
        );
        
        if (!targetPattern) {
            showSaveNotification('❌ Pattern "' + pattern.patternName + '" not found');
            return;
        }

        // Set the collection and pattern
        appState.selectedCollection = targetCollection;
        appState.currentPattern = targetPattern;

        // Set data attribute for collection-specific styling
        document.body.setAttribute('data-current-collection', targetCollection.name);

        // Update collection header
        const collectionHeader = document.getElementById('collectionHeader');
        if (collectionHeader) {
            // Check if this is a clothing collection
            if (targetCollection.name.includes('.clo-')) {
                const collectionBaseName = targetCollection.name.split('.')[0];
                collectionHeader.innerHTML = `${collectionBaseName.toUpperCase()}<br>CLOTHING`;
            } else {
                collectionHeader.textContent = targetCollection.name.toUpperCase();
            }
        }

        // Populate layer inputs with saved colors
        populateLayerInputs(targetPattern);
        
        // Apply saved colors to layers if they exist
        if (pattern.colors && pattern.colors.length > 0) {
            // Wait for layer inputs to be created, then apply colors
            setTimeout(function() {
                pattern.colors.forEach(function(savedColor, index) {
                    if (appState.currentLayers[index]) {
                        appState.currentLayers[index].color = savedColor.color;
                        
                        // Update the visual input elements
                        const input = document.getElementById('layer-' + index);
                        const circle = document.querySelector('#layer-' + index + ' ~ .layer-circle');
                        
                        if (input) {
                            // Use clean color name without SW codes for input display
                            input.value = getCleanColorName(savedColor.color);
                        }
                        if (circle) {
                            console.log(`🎨 Looking up color for circle: "${savedColor.color}"`);
                            const colorHex = lookupColor(savedColor.color);
                            console.log(`🎨 Color result: "${savedColor.color}" -> "${colorHex}"`);
                            circle.style.backgroundColor = colorHex;
                        }
                    }
                });
                
                // Update previews
                updatePreview();
                updateRoomMockup();
                populateCoordinates();
                
            }, 300);
        }
        
        // Update pattern thumbnails for the new collection
        populatePatternThumbnails(targetCollection.patterns);
        
        // Show success message
        showSaveNotification('✅ Pattern "' + pattern.patternName + '" loaded successfully!');
        
    } catch (error) {
        console.error('❌ Error previewing pattern:', error);
        showSaveNotification('❌ Failed to load pattern preview');
    }
}

// Load a saved pattern into the main UI with full functionality
/**
 * Loads a saved pattern into the ColorFlex UI with full state restoration
 *
 * Restores a previously saved pattern customization to the canvas by
 * switching collections, selecting the pattern, applying saved colors,
 * restoring scale settings, and updating all UI elements. This is the
 * primary function for loading patterns from the "My Designs" modal.
 *
 * Restoration Process (14 steps):
 * 1. Find target collection by name (case-insensitive)
 * 2. Find target pattern within collection (case-insensitive)
 * 3. Set appState.selectedCollection and appState.currentPattern
 * 4. Update collection header (handles clothing collections specially)
 * 5. Update pattern name display
 * 6. Populate layer inputs for the pattern
 * 7. Apply saved colors to each layer (300ms delay for DOM ready)
 * 8. Update layer input values and color circles
 * 9. Restore saved scale settings (currentScale, scaleMultiplier)
 * 10. Update scale UI (slider, display, highlight buttons)
 * 11. Update pattern preview and room mockup
 * 12. Populate pattern thumbnails for collection
 * 13. Update curated colors for new collection
 * 14. Highlight selected pattern thumbnail
 *
 * Modal Behavior:
 * - Persistent mode: Keeps modal open for browsing (dataset.persistent)
 * - Normal mode: Closes modal after loading pattern
 *
 * Clothing Collection Handling:
 * - Detects `.clo-` suffix in collection name
 * - Displays as "BOMBAY<br>CLOTHING" format
 *
 * @param {Object} pattern - Saved pattern object to load
 * @param {string} pattern.patternName - Pattern name from collections.json
 * @param {string} pattern.collectionName - Collection name
 * @param {Array<Object>} pattern.colors - Saved layer colors
 * @param {string} pattern.colors[].color - Color in SW format (e.g., "SW7006 Eider White")
 * @param {number} [pattern.currentScale=100] - Scale percentage (50, 100, 200, 300, 400)
 * @param {number} [pattern.scaleMultiplier=1.0] - Scale multiplier (0.5, 1.0, 2.0, 3.0, 4.0)
 * @param {string} [pattern.source] - Source of pattern (for logging)
 * @returns {void} No return value (modifies UI as side effect)
 *
 * @example
 * // Load a saved pattern from My Designs modal
 * const savedPattern = {
 *   patternName: 'Tudor Rose',
 *   collectionName: 'English Cottage',
 *   colors: [
 *     {label: 'Background', color: 'SW7006 Eider White'},
 *     {label: 'Pattern', color: 'SW6258 Tricorn Black'}
 *   ],
 *   currentScale: 200,
 *   scaleMultiplier: 0.5
 * };
 *
 * loadSavedPatternToUI(savedPattern);
 * // UI updates: collection switches, pattern loads, colors apply, scale restores
 *
 * @example
 * // User workflow
 * // 1. User opens "My Designs" modal
 * // 2. Clicks "Load" button on pattern card
 * // 3. loadSavedPatternToUI(pattern) called
 * // 4. UI switches to pattern's collection
 * // 5. Pattern loads with saved colors and scale
 * // 6. Modal closes (or stays open if persistent)
 *
 * @throws {Error} Shows notification if collection or pattern not found
 * @throws {Error} Logs error and shows notification if load fails
 *
 * ⚠️ IMPORTANT: Pattern and collection must exist in collections.json
 *
 * 🔄 UI UPDATE: Comprehensive - switches collections, updates all displays
 *
 * 🎨 CURATED COLORS: Updates curated color circles for new collection
 *
 * 📏 SCALE RESTORATION: Fully restores scale settings with button highlighting
 *
 * ⏱️ TIMING: Uses setTimeout delays (100ms, 300ms, 500ms) for DOM readiness
 *
 * @see showSavedPatternsModal - Modal with load buttons
 * @see updatePreview - Updates pattern preview
 * @see updateRoomMockup - Updates room mockup
 * @see populateCuratedColors - Updates curated color circles
 */
function loadSavedPatternToUI(pattern) {
    try {
        console.log('🔄 Loading saved pattern into UI:', pattern.patternName);
        console.log('🔍 Pattern data received:', pattern);
        console.log('🎨 Source:', pattern.source || 'unknown');

        // 🆕 PERSISTENT MODAL: Only close modal if not in persistent mode
        // Check if we have a persistent modal source (from unified modal or theme.liquid)
        const modal = document.getElementById('savedPatternsModal');
        const unifiedModal = document.getElementById('unifiedSavedPatternsModal');
        const isPersistentContext = unifiedModal || (modal && modal.dataset && modal.dataset.persistent);
        
        if (modal && !isPersistentContext) {
            console.log('🔄 Closing non-persistent modal');
            modal.remove();
        } else if (modal && isPersistentContext) {
            console.log('🔒 Keeping persistent modal open for continued browsing');
        }
        
        // Find the collection and pattern
        const targetCollection = appState.collections.find(
            c => c && typeof c.name === 'string' && c.name.toLowerCase() === pattern.collectionName.toLowerCase()
        );
        
        if (!targetCollection) {
            showSaveNotification('❌ Collection "' + pattern.collectionName + '" not found');
            return;
        }
        
        const targetPattern = targetCollection.patterns.find(
            p => p && typeof p.name === 'string' && p.name.toLowerCase() === pattern.patternName.toLowerCase()
        );
        
        if (!targetPattern) {
            showSaveNotification('❌ Pattern "' + pattern.patternName + '" not found');
            return;
        }

        // Set the collection and pattern
        appState.selectedCollection = targetCollection;
        appState.currentPattern = targetPattern;

        // Set data attribute for collection-specific styling
        document.body.setAttribute('data-current-collection', targetCollection.name);

        // Update collection header
        const collectionHeader = document.getElementById('collectionHeader');
        if (collectionHeader) {
            // Check if this is a clothing collection
            if (targetCollection.name.includes('.clo-')) {
                const collectionBaseName = targetCollection.name.split('.')[0];
                collectionHeader.innerHTML = `${collectionBaseName.toUpperCase()}<br>CLOTHING`;
            } else {
                collectionHeader.textContent = targetCollection.name.toUpperCase();
            }
        }

        // Update pattern name display
        const patternNameElement = document.getElementById('patternName');
        if (patternNameElement) {
            patternNameElement.innerHTML = targetPattern.name + formatPatternInfo(targetPattern);
        }
        
        // Populate layer inputs with saved colors
        populateLayerInputs(targetPattern);
        
        // Apply saved colors to layers if they exist (support both formats)
        const colorsToApply = pattern.colors || (pattern.customColors ? pattern.customColors.map(c => ({color: c})) : []);
        if (colorsToApply && colorsToApply.length > 0) {
            // Wait for layer inputs to be created, then apply colors
            setTimeout(function() {
                colorsToApply.forEach(function(savedColor, index) {
                    if (appState.currentLayers[index]) {
                        // Handle both formats: {color: "SW1234"} or just "SW1234"
                        const colorValue = savedColor.color || savedColor;
                        appState.currentLayers[index].color = colorValue;
                        const colorHex = lookupColor(colorValue);
                        
                        // Update via appState.layerInputs (primary method)
                        if (appState.layerInputs[index]) {
                            const layerInput = appState.layerInputs[index];
                            if (layerInput.input) {
                                layerInput.input.value = getCleanColorName(colorValue);
                            }
                            if (layerInput.circle) {
                                layerInput.circle.style.backgroundColor = colorHex;
                            }
                        }

                        // Fallback to DOM selector approach
                        const input = document.getElementById('layer-' + index);
                        if (input) {
                            input.value = getCleanColorName(colorValue);
                        }
                        
                        // Try multiple circle selector approaches as fallback
                        const circleSelectors = [
                            `#layer-${index} ~ .layer-circle`,
                            `[data-layer-id="layer-${index}"] .layer-circle`,
                            `.layer-circle[data-layer="${index}"]`
                        ];
                        
                        for (const selector of circleSelectors) {
                            const circle = document.querySelector(selector);
                            if (circle) {
                                circle.style.backgroundColor = colorHex;
                                break;
                            }
                        }
                    }
                });
                
                // 🆕 RESTORE SCALING: Apply saved scale settings if available
                console.log('🔍 Scale restoration debug - pattern object:', {
                    currentScale: pattern.currentScale,
                    scaleMultiplier: pattern.scaleMultiplier,
                    hasCurrentScale: pattern.currentScale !== undefined,
                    hasScaleMultiplier: pattern.scaleMultiplier !== undefined
                });

                if (pattern.currentScale !== undefined) {
                    console.log('🔧 Restoring saved scale:', pattern.currentScale, 'with multiplier:', pattern.scaleMultiplier);
                    appState.currentScale = pattern.currentScale;
                    
                    // Update scale UI display if it exists
                    const scaleDisplay = document.getElementById('scaleDisplay');
                    if (scaleDisplay) {
                        scaleDisplay.textContent = pattern.currentScale + '%';
                    }
                    
                    // Update scale slider if it exists
                    const scaleSlider = document.getElementById('scaleSlider');
                    if (scaleSlider) {
                        scaleSlider.value = pattern.currentScale;
                    }
                }
                
                if (pattern.scaleMultiplier !== undefined) {
                    appState.scaleMultiplier = pattern.scaleMultiplier;
                    console.log('✅ Scale multiplier restored:', pattern.scaleMultiplier);

                    // 🎯 BUTTON HIGHLIGHTING: Call setPatternScale to highlight the correct button
                    // Add delay to ensure scale buttons are available in DOM
                    setTimeout(() => {
                        if (typeof window.setPatternScale === 'function') {
                            console.log('🎯 Highlighting scale button for multiplier:', pattern.scaleMultiplier);
                            window.setPatternScale(pattern.scaleMultiplier);
                        } else {
                            console.warn('⚠️ setPatternScale function not available');
                        }
                    }, 500);
                }
                
                // Update all previews and UI elements
                updatePreview();
                updateRoomMockup();
                populateCoordinates();
                
                // Force a complete UI refresh
                setTimeout(function() {
                    updatePreview();
                }, 100);
                
            }, 300);
        }

        // Update pattern thumbnails for the new collection
        populatePatternThumbnails(targetCollection.patterns);

        // 🎨 CRITICAL FIX: Update curated colors for the new collection
        // When loading a saved pattern from a different collection, we need to update
        // the curated color circles to match the new collection's colors
        const newCuratedColors = targetCollection.curatedColors || [];
        if (newCuratedColors.length > 0) {
            console.log('🎨 Updating curated colors for collection:', targetCollection.name, 'with', newCuratedColors.length, 'colors');
            appState.curatedColors = newCuratedColors;
            populateCuratedColors(newCuratedColors);
        } else {
            console.log('📭 No curated colors found for collection:', targetCollection.name);
        }

        // Update the selected thumbnail to highlight the loaded pattern
        setTimeout(function() {
            const thumbnails = document.querySelectorAll('.pattern-thumbnail');
            thumbnails.forEach(function(thumb) {
                thumb.classList.remove('selected');
                if (thumb.dataset.patternName === targetPattern.name) {
                    thumb.classList.add('selected');
                }
            });
        }, 500);
        
        // Show success message with enhanced feedback
        showSaveNotification('✅ Pattern "' + pattern.patternName + '" loaded successfully!');
        console.log('✅ Pattern loaded - Collection:', targetCollection.name, 'Pattern:', targetPattern.name);
        
    } catch (error) {
        console.error('❌ Error loading pattern to UI:', error);
        showSaveNotification('❌ Failed to load pattern into UI');
    }
}

// Path normalization function to fix ./data/ vs data/ inconsistencies
function normalizePath(path) {
    if (!path || typeof path !== 'string') return path;
    
    // If it's already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    
    // Convert "./data/" to "data/" for consistency
    if (path.startsWith('./data/')) {
        path = path.substring(2); // Remove the "./"
    }
    
    // For any other relative paths, ensure they don't start with "./"
    if (path.startsWith('./')) {
        path = path.substring(2);
    }
    
    // If it's a data/ path, convert to absolute URL
    if (path.startsWith('data/')) {
        return `https://so-animation.com/colorflex/${path}`;
    }
    
    return path;
}

// Store furniture view settings globally for consistency
const furnitureViewSettings = {
    scale: 0.7,
    offsetX: 0,
    offsetY: -120,
    // Zoom states
    isZoomed: false,
    zoomScale: 2,  // 220% zoom when clicked
    zoomX: 0,        // Where we're zoomed to
    zoomY: 0         // Where we're zoomed to

};
const DEFAULT_FURNITURE_SETTINGS = {
    scale: 0.7,
    offsetX: 0,
    offsetY: -120
};


function addInteractiveZoom() {
    console.log("🔍 Adding interactive zoom to furniture preview");
    
    const roomMockup = document.getElementById('roomMockup');
    if (!roomMockup) {
        console.error("❌ Room mockup container not found");
        return;
    }
    
    // ✅ Add debouncing to prevent rapid clicks
    let isZoomInProgress = false;
    let lastClickTime = 0;
    const MIN_CLICK_INTERVAL = 500; // Minimum 500ms between clicks
    
    roomMockup.style.cursor = 'pointer';
    roomMockup.onclick = null;
    
    roomMockup.addEventListener('click', function(e) {
        const currentTime = Date.now();
        
        // ✅ Debounce rapid clicks
        if (currentTime - lastClickTime < MIN_CLICK_INTERVAL) {
            console.log("🚫 Click ignored - too rapid");
            return;
        }
        
        // ✅ Prevent overlapping zoom operations
        if (isZoomInProgress) {
            console.log("🚫 Click ignored - zoom in progress");
            return;
        }
        
        lastClickTime = currentTime;
        isZoomInProgress = true;
        
        console.log("🖱️ Room mockup clicked (debounced)");
        
        const isFurnitureCollection = false; // Removed furniture logic
        if (!isFurnitureCollection) {
            console.log("Not a furniture collection, ignoring click");
            isZoomInProgress = false;
            return;
        }
        
        // Get click position
        const rect = roomMockup.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const clickX = (x / rect.width) * 600;
        const clickY = (y / rect.height) * 450;
        
        console.log(`🎯 Click at canvas coordinates: (${clickX.toFixed(0)}, ${clickY.toFixed(0)})`);
        
        // ✅ More robust state detection
        const currentScale = furnitureViewSettings.scale;
        const isCurrentlyZoomed = currentScale > 1.0; // Any scale > 1.0 is considered "zoomed"
        
        console.log(`🔍 Current state - scale: ${currentScale}, considered zoomed: ${isCurrentlyZoomed}`);
        
        if (isCurrentlyZoomed) {
            // Zoom out to default
            console.log(`🔍 Zooming out to default scale (${DEFAULT_FURNITURE_SETTINGS.scale})`);
            furnitureViewSettings.isZoomed = false;
            furnitureViewSettings.scale = DEFAULT_FURNITURE_SETTINGS.scale;
            furnitureViewSettings.offsetX = DEFAULT_FURNITURE_SETTINGS.offsetX;
            furnitureViewSettings.offsetY = DEFAULT_FURNITURE_SETTINGS.offsetY;
            roomMockup.style.cursor = 'zoom-in';
        } else {
            // Zoom in to click point
            console.log(`🔍 Zooming in to click point`);
            furnitureViewSettings.isZoomed = true;
            furnitureViewSettings.scale = furnitureViewSettings.zoomScale; // 2.2
            
            // Proper offset calculation accounting for default offset
            const canvasWidth = 600;
            const canvasHeight = 450;
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            
            // Calculate how much to offset to center the clicked point
            const defaultScale = 0.7;  // Your default scale
            const defaultOffsetX = 0;  // Your default offsetX  
            const defaultOffsetY = -120; // Your default offsetY
            
            const scaleFactor = furnitureViewSettings.zoomScale / defaultScale; // 2.2 / 0.7 = 3.14
            
            // Calculate offset relative to the default position
            furnitureViewSettings.offsetX = defaultOffsetX + (centerX - clickX) * (scaleFactor - 1);
            furnitureViewSettings.offsetY = defaultOffsetY + (centerY - clickY) * (scaleFactor - 1);
            
            console.log(`   Scale factor: ${scaleFactor}`);
            console.log(`   Default offset: (${defaultOffsetX}, ${defaultOffsetY})`);
            console.log(`   New offset: (${furnitureViewSettings.offsetX.toFixed(0)}, ${furnitureViewSettings.offsetY.toFixed(0)})`);
            
            roomMockup.style.cursor = 'zoom-out';
        }
        
        console.log("🔄 Calling updateFurniturePreview with new zoom state");
        console.log("🔄 Final settings:", JSON.stringify({
            scale: furnitureViewSettings.scale,
            offsetX: furnitureViewSettings.offsetX,
            offsetY: furnitureViewSettings.offsetY,
            isZoomed: furnitureViewSettings.isZoomed
        }, null, 2));
        
        // ✅ Call update and reset progress flag when done
        if (typeof updateFurniturePreview === 'function') {
            updateFurniturePreview().then(() => {
                isZoomInProgress = false;
                console.log("✅ Zoom operation completed");
            }).catch(error => {
                console.error("❌ Zoom operation failed:", error);
                isZoomInProgress = false;
            });
        } else {
            console.error("❌ updateFurniturePreview function not found!");
            updateDisplays();
            isZoomInProgress = false;
        }
    });
    
    // Set initial cursor
    const isFurnitureCollection = window.appState.selectedCollection && window.appState.selectedCollection.wallMask != null;
    if (isFurnitureCollection) {
        const currentScale = furnitureViewSettings.scale;
        const isCurrentlyZoomed = currentScale > 1.0;
        roomMockup.style.cursor = isCurrentlyZoomed ? 'zoom-out' : 'zoom-in';
        console.log("✅ Set cursor for furniture collection");
    } else {
        roomMockup.style.cursor = 'default';
        console.log("✅ Set default cursor for non-furniture collection");
    }
    
    console.log("✅ Interactive zoom added to room mockup");
}

// Also add this debug function to test zoom manually:
function testZoom() {
    console.log("🧪 Testing zoom functionality");
    console.log("Current furnitureViewSettings:", furnitureViewSettings);
    
    // Test zoom in
    furnitureViewSettings.isZoomed = true;
    furnitureViewSettings.scale = 2.2;
    furnitureViewSettings.offsetX = -100;
    furnitureViewSettings.offsetY = -50;
    
    console.log("Updated furnitureViewSettings:", furnitureViewSettings);
    
    // Trigger re-render
    if (typeof updateFurniturePreview === 'function') {
        console.log("Calling updateFurniturePreview...");
        updateFurniturePreview();
    } else {
        console.error("updateFurniturePreview function not found!");
    }
}



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

// Chameleon loader removed - December 3, 2025

// Validate DOM elements and report missing ones
function validateDOMElements() {
    console.log("🔍 DOM Validation:");
    Object.entries(dom).forEach(([key, element]) => {
        if (element) {
            console.log(`  ✅ ${key}: found`);
        } else {
            console.error(`  ❌ ${key}: NOT FOUND - missing element with id "${key}"`);
        }
    });
}

// Watch changes to patternName
const patternNameElement = document.getElementById("patternName");
Object.defineProperty(dom, 'patternName', {
    get() {
        return patternNameElement;
    },
    set(value) {
        console.log("Setting #patternName to:", value, "Caller:", new Error().stack.split('\n')[2].trim());
        patternNameElement.innerHTML = value;
    },
    configurable: true
});

// Debug function to check what's happening with collection names
window.debugCollectionName = function() {
    console.log(`🔍 COLLECTION NAME DEBUG:`);
    console.log(`========================`);
    console.log(`Current collection name: "${appState.selectedCollection?.name}"`);
    console.log(`Current pattern name: "${appState.currentPattern?.name}"`);
    console.log(`Furniture mode: ${appState.furnitureMode}`);
    
    if (appState.furnitureMode) {
        console.log(`Original collection: "${appState.originalCollection?.name}"`);
        console.log(`Original collection exists: ${!!appState.originalCollection?.fullCollection}`);
        
        // Check if we can get the original collection name from the furniture collection
        const originalFromFurniture = appState.selectedCollection?.originalCollectionName;
        console.log(`Original collection from furniture collection: "${originalFromFurniture}"`);
    }
    
    // Test what the path should be
    if (appState.selectedCollection && appState.currentPattern) {
        let collectionNameForPaths;
        
        if (appState.furnitureMode) {
            // Try multiple ways to get the original collection name
            collectionNameForPaths = appState.originalCollection?.name 
                || appState.selectedCollection?.originalCollectionName
                || "UNKNOWN";
        } else {
            collectionNameForPaths = appState.selectedCollection.name;
        }
        
        const patternName = appState.currentPattern.name;
        const slug = createPatternSlug(patternName);
        
        console.log(`Expected path structure:`);
        console.log(`  Collection for paths: "${collectionNameForPaths}"`);
        console.log(`  Pattern: "${patternName}"`);
        console.log(`  Slug: "${slug}"`);
        console.log(`  Should be: data/furniture/sofa-capitol/patterns/${collectionNameForPaths}/${slug}/`);
        
        if (collectionNameForPaths === "UNKNOWN") {
            console.error(`❌ Cannot determine original collection name!`);
            console.error(`   This is why paths are broken.`);
        }
    }
    
    return {
        selectedCollection: appState.selectedCollection?.name,
        currentPattern: appState.currentPattern?.name,
        furnitureMode: appState.furnitureMode,
        originalCollection: appState.originalCollection?.name
    };
};
window.getAppState = function() {
    return {
        selectedCollection: appState.selectedCollection?.name,
        currentPattern: appState.currentPattern?.name,
        furnitureMode: appState.furnitureMode,
        originalCollection: appState.originalCollection?.name,
        collections: appState.collections?.map(c => c.name),
        furnitureConfigLoaded: !!furnitureConfig
    };
};
window.fixOriginalCollection = function(originalCollectionName) {
    console.log(`🔧 QUICK FIX: Setting original collection to "${originalCollectionName}"`);
    
    if (!appState.originalCollection) {
        appState.originalCollection = {};
    }
    
    appState.originalCollection.name = originalCollectionName;
    
    // Also store it in the furniture collection for future reference
    if (appState.selectedCollection) {
        appState.selectedCollection.originalCollectionName = originalCollectionName;
    }
    
    console.log(`✅ Fixed! Original collection name is now: "${appState.originalCollection.name}"`);
    console.log(`Run debugCollectionName() to verify the fix.`);
    
    return {
        originalCollection: appState.originalCollection.name,
        furnitureCollection: appState.selectedCollection?.originalCollectionName
    };
};

// Status check accessible from console
window.checkStatus = function() {
    console.log(`🔍 FURNITURE IMPLEMENTATION STATUS CHECK:`);
    console.log(`======================================`);
    
    // Check if furniture config is loaded
    if (!furnitureConfig) {
        console.log(`❌ furnitureConfig not loaded`);
        return { error: "furnitureConfig not loaded" };
    }
    console.log(`✅ furnitureConfig loaded: ${Object.keys(furnitureConfig).length} furniture pieces`);
    
    // Check collections
    if (!appState.collections || appState.collections.length === 0) {
        console.log(`❌ Collections not loaded`);
        return { error: "Collections not loaded" };
    }
    console.log(`✅ Collections loaded: ${appState.collections.length} collections`);
    
    // Check current state
    const currentCollection = appState.selectedCollection?.name;
    if (!currentCollection) {
        console.log(`❌ No collection currently selected`);
        return { error: "No collection selected" };
    }
    console.log(`✅ Current collection: ${currentCollection}`);
    
    // Check compatibility
    const compatible = getCompatibleFurniture(currentCollection);
    console.log(`✅ Compatible furniture: ${compatible.length} pieces`);
    compatible.forEach(f => console.log(`   - ${f.name}`));
    
    // Check if Try Furniture button should be visible
    const tryButton = document.getElementById('tryFurnitureBtn');
    const backButton = document.getElementById('backToPatternsBtn');
    
    if (appState.furnitureMode) {
        console.log(`🪑 Currently in FURNITURE MODE`);
        console.log(`   Back button present: ${!!backButton}`);
    } else {
        console.log(`🎨 Currently in PATTERN MODE`);
        console.log(`   Try Furniture button present: ${!!tryButton}`);
        if (!tryButton && compatible.length > 0) {
            console.log(`⚠️  Try Furniture button should be visible but isn't!`);
        }
    }
    
    return {
        furnitureConfigLoaded: !!furnitureConfig,
        collectionsLoaded: appState.collections?.length > 0,
        currentCollection: currentCollection,
        compatibleFurniture: compatible.length,
        furnitureMode: appState.furnitureMode,
        tryButtonPresent: !!tryButton,
        backButtonPresent: !!backButton,
        originalCollection: appState.originalCollection?.name
    };
};

function ensureButtonsAfterUpdate() {
    // Small delay to ensure DOM update is complete
    setTimeout(() => {
        if (!appState.furnitureMode && !document.getElementById('tryFurnitureBtn')) {
            if (window.COLORFLEX_DEBUG) {
                console.log("🔄 Re-adding Try Fabric button after room mockup update");
            }
            addTryFurnitureButton();
        }
        
        if (appState.furnitureMode && !document.getElementById('backToPatternsBtn')) {
            if (window.COLORFLEX_DEBUG) {
                console.log("🔄 Re-adding Back to Patterns button after room mockup update");
            }
            addBackToPatternsButton();
        }
    }, 50);
}

// Test pattern slug generation
window.testSlug = function(patternName) {
    const slug = createPatternSlug(patternName);
    console.log(`Pattern: "${patternName}" → Slug: "${slug}"`);
    return slug;
};

// Simple state viewer
window.viewState = function() {
    const state = {
        selectedCollection: appState.selectedCollection?.name,
        currentPattern: appState.currentPattern?.name,
        furnitureMode: appState.furnitureMode,
        originalCollection: appState.originalCollection?.name,
        patterns: appState.selectedCollection?.patterns?.length,
        furnitureConfig: Object.keys(furnitureConfig || {})
    };
    
    console.table(state);
    return state;
};

// Debug functions available in development mode only
if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
    console.log(`
🔧 DEBUG FUNCTIONS LOADED!
=========================

Available console commands:
• debugCollectionName() - Debug collection name issues
• fixOriginalCollection("botanicals") - Quick fix for collection name
• checkStatus() - Check implementation status  
• viewState() - View current app state
• testSlug("Pattern Name") - Test slug conversion
• getAppState() - Get simplified app state

Try running: debugCollectionName()
`);
}

// Create pattern slug from pattern name
function createPatternSlug(patternName) {
    if (!patternName || typeof patternName !== 'string') {
        return '';
    }
    return patternName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .replace(/-+/g, '-')          // Remove multiple consecutive hyphens
        .replace(/^-|-$/g, '')        // Remove leading/trailing hyphens
        .trim();
}

window.simpleDebug = function() {
    console.log(`🔍 SIMPLE DEBUG:`);
    console.log(`================`);
    
    if (appState.furnitureMode) {
        console.log(`In furniture mode: YES`);
        console.log(`Current collection: "${appState.selectedCollection?.name}"`);
        console.log(`Stored original collection: "${appState.selectedCollection?.originalCollectionName}"`);
        console.log(`Current pattern: "${appState.currentPattern?.name}"`);
        
        if (appState.selectedCollection?.originalCollectionName) {
            const slug = createPatternSlug(appState.currentPattern?.name || "test");
            console.log(`✅ Path should be: data/furniture/sofa-capitol/patterns/${appState.selectedCollection.originalCollectionName}/${slug}/`);
        } else {
            console.log(`❌ No original collection name stored!`);
        }
    } else {
        console.log(`In furniture mode: NO`);
        console.log(`Current collection: "${appState.selectedCollection?.name}"`);
    }
};

// Quick fix function:
window.quickFix = function() {
    if (appState.furnitureMode && !appState.selectedCollection?.originalCollectionName) {
        // Try to guess the original collection from the furniture collection name
        const furnitureCollectionName = appState.selectedCollection?.name;
        if (furnitureCollectionName && furnitureCollectionName.includes("BOTANICAL")) {
            appState.selectedCollection.originalCollectionName = "botanicals";
            console.log(`🔧 Quick fix: Set original collection to "botanicals"`);
            return true;
        }
    }
    return false;
};

window.fixPatternPaths = function() {
    if (appState.furnitureMode && appState.currentPattern) {
        const originalCollectionName = appState.selectedCollection.originalCollectionName;
        const furnitureConfig = appState.selectedCollection.furnitureConfig;
        
        console.log(`🔧 Regenerating pattern paths:`);
        console.log(`   Collection: ${originalCollectionName}`);
        console.log(`   Pattern: ${appState.currentPattern.name}`);
        
        // Re-create the furniture pattern with correct paths
        const correctedPattern = createFurniturePattern(
            appState.currentPattern.originalPattern || appState.currentPattern,
            furnitureConfig,
            originalCollectionName
        );
        
        // Update the current pattern
        appState.currentPattern = correctedPattern;
        
        // Update in the collection too
        const patternIndex = appState.selectedCollection.patterns.findIndex(p => p.id === correctedPattern.id);
        if (patternIndex !== -1) {
            appState.selectedCollection.patterns[patternIndex] = correctedPattern;
        }
        
        console.log(`✅ Pattern paths regenerated`);
        return correctedPattern;
    }
};


// Cache for furniture compatibility checks to improve performance
let furnitureCompatibilityCache = new Map();
let addFurnitureButtonDebounce = null;

// ============================================================================
// SECTION 4: FURNITURE MODE SYSTEM
// ============================================================================
// Furniture mockup system: furniture selection, path resolution, rendering.
// Handles .fur-X collection variants and furniture-specific canvas rendering.
// ============================================================================

function getCompatibleFurniture(collectionName) {
    // Check cache first to avoid repeated computations
    if (furnitureCompatibilityCache.has(collectionName)) {
        return furnitureCompatibilityCache.get(collectionName);
    }
    
    // Reduced logging for performance
    if (window.COLORFLEX_DEBUG) {
        console.log(`🪑 Checking furniture compatibility for collection: ${collectionName}`);
    }
    
    if (!furnitureConfig) {
        // Don't spam the console - only warn once per collection
        if (!furnitureCompatibilityCache.has(collectionName + '_warned')) {
            console.warn("Furniture config not loaded yet");
            furnitureCompatibilityCache.set(collectionName + '_warned', true);
        }
        return [];
    }
    
    const compatible = Object.entries(furnitureConfig)
        .filter(([furnitureId, config]) => {
            const isCompatible = config.compatibleCollections && 
                               config.compatibleCollections.includes(collectionName);
            return isCompatible;
        })
        .map(([furnitureId, config]) => ({
            id: furnitureId,
            name: config.name,
            thumbnail: config.thumbnail,
            description: config.description || '',
            config: config
        }));
    
    // Cache the result for future use
    furnitureCompatibilityCache.set(collectionName, compatible);
    
    if (window.COLORFLEX_DEBUG) {
        console.log(`Found ${compatible.length} compatible furniture pieces`);
    }
    return compatible;
}

function addTryFurnitureButtonDebounced() {
    // Debounce to prevent excessive calls
    if (addFurnitureButtonDebounce) {
        clearTimeout(addFurnitureButtonDebounce);
    }
    
    addFurnitureButtonDebounce = setTimeout(() => {
        addTryFurnitureButtonInternal();
    }, 100); // 100ms delay
}

// Legacy function name for backward compatibility
function addTryFurnitureButton() {
    addTryFurnitureButtonDebounced();
}

function addTryFurnitureButtonInternal() {
    // Performance optimization - avoid excessive logging unless in debug mode
    if (window.COLORFLEX_DEBUG) {
        console.log("🪑 Adding Try Fabric button");
    }
    
    // Remove existing button if present
    const existingButton = document.getElementById('tryFurnitureBtn');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Check compatibility
    const currentCollection = appState.selectedCollection?.name;
    if (!currentCollection) {
        if (window.COLORFLEX_DEBUG) {
            console.log("No current collection, skipping furniture button");
        }
        return;
    }

    // Skip for clothing collections - they auto-show mockup without button
    if (currentCollection.includes('.clo-')) {
        if (window.COLORFLEX_DEBUG) {
            console.log("Clothing collection - skipping Try Furniture button");
        }
        return;
    }

    const compatibleFurniture = getCompatibleFurniture(currentCollection);
    if (compatibleFurniture.length === 0) {
        if (window.COLORFLEX_DEBUG) {
            console.log("No compatible furniture found for", currentCollection);
        }
        return;
    }
    
    // Create button
    const button = document.createElement('button');
    button.id = 'tryFurnitureBtn';
    button.className = 'try-furniture-btn';
    button.innerHTML = `
        <span class="furniture-icon">🪑</span>
        <span class="button-text">Try Fabric (${compatibleFurniture.length})</span>
    `;
    
    // Add styles
    button.style.cssText = `
        position: absolute;
        bottom: 10px;
        right: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 18px;
        border-radius: 25px;
        font-family: 'Special Elite', monospace;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 100;
    `;
    
    // Add hover effects
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    });
    
    // Add click handler
    button.addEventListener('click', () => {
        showFurnitureModal(compatibleFurniture);
    });
    
    // Find the room mockup container and add button
    const roomMockup = document.getElementById('roomMockup');
    if (roomMockup) {
        // Make sure the container is positioned relatively
        if (getComputedStyle(roomMockup).position === 'static') {
            roomMockup.style.position = 'relative';
        }
        roomMockup.appendChild(button);
        console.log("✅ Try Furniture button added to room mockup");
    } else {
        console.error("❌ Could not find room mockup container");
    }
}

// 3. showFurnitureModal function (also referenced but missing)
function showFurnitureModal(compatibleFurniture) {
    console.log("🪑 Showing furniture modal with", compatibleFurniture.length, "options");
    
    // Remove existing modal
    const existingModal = document.getElementById('furnitureModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'furnitureModal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        max-height: 80%;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
    `;
    
    // Modal header
    const header = document.createElement('div');
    header.innerHTML = `
        <h2 style="margin: 0 0 20px 0; font-family: 'Special Elite', monospace; color: #333; text-align: center;">
            Choose Furniture for ${toInitialCaps(appState.selectedCollection.name)}
        </h2>
    `;
    
    // Furniture grid
    const furnitureGrid = document.createElement('div');
    furnitureGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    `;
    
    // Add furniture options
    compatibleFurniture.forEach(furniture => {
        const furnitureCard = document.createElement('div');
        furnitureCard.style.cssText = `
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: white;
        `;
        
        furnitureCard.innerHTML = `
            <img src="${normalizePath(furniture.thumbnail)}" alt="${furniture.name}" 
                 style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;"
                 onerror="this.style.background='#f0f0f0'; this.style.display='flex'; this.style.alignItems='center'; this.style.justifyContent='center'; this.innerHTML='🪑';">
            <h3 style="margin: 10px 0 5px 0; font-family: 'Special Elite', monospace; font-size: 16px;">${furniture.name}</h3>
            <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.4;">${furniture.description}</p>
        `;
        
        // Hover effects
        furnitureCard.addEventListener('mouseenter', () => {
            furnitureCard.style.borderColor = '#667eea';
            furnitureCard.style.transform = 'translateY(-2px)';
            furnitureCard.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
        });
        
        furnitureCard.addEventListener('mouseleave', () => {
            furnitureCard.style.borderColor = '#e0e0e0';
            furnitureCard.style.transform = 'translateY(0)';
            furnitureCard.style.boxShadow = 'none';
        });
        
        // Click handler
        furnitureCard.addEventListener('click', () => {
            selectFurniture(furniture);
            modalOverlay.remove();
        });
        
        furnitureGrid.appendChild(furnitureCard);
    });
    
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
        background: #ccc;
        color: #333;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-family: 'Special Elite', monospace;
        display: block;
        margin: 0 auto;
    `;
    
    cancelButton.addEventListener('click', () => {
        modalOverlay.remove();
    });
    
    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(furnitureGrid);
    modalContent.appendChild(cancelButton);
    modalOverlay.appendChild(modalContent);
    
    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(modalOverlay);
}

// 4. selectFurniture function
function selectFurniture(selectedFurniture) {
    console.log("🪑 Selected furniture:", selectedFurniture.name);
    console.log("🧵 Full furniture object:", selectedFurniture);
    
    // Store selected furniture in appState
    appState.selectedFurniture = selectedFurniture;
    appState.isInFabricMode = selectedFurniture.name === "Fabric";
    
    // Direct check for fabric name
    if (selectedFurniture.name === "Fabric") {
        console.log("🧵 ================================");
        console.log("🧵 FABRIC NAME DETECTED - CALLING FABRIC MOCKUP");
        console.log("🧵 ================================");
        renderFabricMockup();
        return;
    }
    
    // Switch to furniture mode for actual furniture
    console.log("🪑 Regular furniture selected, switching to furniture mode");
    switchToFurnitureMode(selectedFurniture);
}

// 5. addBackToPatternsButton function
function addBackToPatternsButton() {
    console.log("🔙 addBackToPatternsButton() called");
    
    const existingButton = document.getElementById('backToPatternsBtn');
    if (existingButton) {
        console.log("🗑️ Removing existing back button");
        existingButton.remove();
    }
    
    const button = document.createElement('button');
    button.id = 'backToPatternsBtn';
    button.innerHTML = `
        <span>← Back to Patterns</span>
    `;
    
    button.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 10px;
        background: linear-gradient(135deg, #ff7b7b 0%, #667eea 100%);
        color: white;
        border: none;
        padding: 12px 18px;
        border-radius: 25px;
        font-family: 'Special Elite', monospace;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        z-index: 100;
    `;
    
    console.log("🔗 Adding click event listener to back button");
    button.addEventListener('click', (event) => {
        console.log("🔙 Back button clicked!");
        event.stopPropagation(); // Prevent zoom handler from receiving this event
        event.preventDefault();  // Prevent any default behavior
        
        // Check if we're in fabric mode or furniture mode
        if (appState.isInFabricMode) {
            console.log("🧵 Returning from fabric mode to patterns");
            returnToPatternsModeFromFabric();
        } else {
            console.log("🪑 Returning from furniture mode to patterns");
            returnToPatternsMode();
        }
    });
    
    const roomMockup = document.getElementById('roomMockup');
    if (roomMockup) {
        roomMockup.appendChild(button);
        console.log("✅ Back button added to DOM");
        
        // Test if button is actually clickable
        console.log("🧪 Button in DOM:", document.getElementById('backToPatternsBtn'));
        console.log("🧪 Button parent:", document.getElementById('backToPatternsBtn')?.parentElement);
    } else {
        console.error("❌ roomMockup not found!");
    }
}

// Function to return from fabric mode to patterns mode
function returnToPatternsModeFromFabric() {
    console.log("🧵 Returning from fabric mode to patterns");
    
    // Clear fabric mode state
    appState.selectedFurniture = null;
    appState.isInFabricMode = false;
    
    // Remove back button
    const backButton = document.getElementById('backToPatternsBtn');
    if (backButton) {
        backButton.remove();
    }
    
    // Remove fabric tuning controls
    removeFabricTuningControls();
    
    // Re-add try furniture button
    addTryFurnitureButton();
    
    // Trigger room mockup update to show regular pattern view
    if (appState.currentPattern) {
        updateRoomMockup();
    }
    
    console.log("✅ Returned from fabric mode to patterns mode");
}

// 6. initializeTryFurnitureFeature function
function initializeTryFurnitureFeature() {
    console.log("🪑 Initializing Try Furniture feature");
    
    // Add the button when a collection is loaded
    if (appState.selectedCollection && !appState.furnitureMode) {
        addTryFurnitureButton();
    }
}

// Resolve furniture pattern paths using collection-based structure
function resolveFurniturePatternPaths(furnitureConfig, collectionName, patternName, originalPatternLayers) {
    console.log(`🔍 Resolving furniture pattern paths:`);
    console.log(`   Collection: "${collectionName}"`);
    console.log(`   Pattern: "${patternName}"`);
    
    // ✅ VALIDATION: Make sure we have a valid collection name
    if (!collectionName || collectionName === "UNKNOWN" || collectionName === patternName) {
        console.error(`❌ Invalid collection name: "${collectionName}"`);
        console.error(`   Pattern name: "${patternName}"`);
        console.error(`   These should be different!`);
        
        // Try to get it from the current furniture collection
        const fallbackCollectionName = appState.selectedCollection?.originalCollectionName;
        if (fallbackCollectionName) {
            console.log(`🔧 Using fallback collection name: "${fallbackCollectionName}"`);
            collectionName = fallbackCollectionName;
        } else {
            console.error(`❌ No fallback collection name available!`);
            return [];
        }
    }
    
    const patternSlug = createPatternSlug(patternName);

    // Strip .fur-1 suffix from collection name for furniture directory paths
    // Directory structure uses base names (e.g., 'botanicals'), not suffixed names (e.g., 'botanicals.fur-1')
    const baseCollectionName = collectionName.replace(/\.fur-\d+$/, '');
    console.log(`   Base collection name for path: "${baseCollectionName}"`);

    // Replace template variables
    const patternFolder = furnitureConfig.patternPathTemplate
        .replace('{collection}', baseCollectionName)
        .replace('{patternSlug}', patternSlug);
    
    console.log(`   Pattern slug: "${patternSlug}"`);
    console.log(`   ✅ Final folder: "${patternFolder}"`);
    
    // Map layers to furniture paths
    const furniturePatternLayers = originalPatternLayers.map((layer, index) => {
        // Handle both path and file properties (different collection formats)
        const layerPath = layer.path || layer.file;

        if (!layerPath) {
            console.error(`❌ Layer ${index} has no path or file property:`, layer);
            return null;
        }

        const originalFileName = layerPath.split('/').pop();
        const layerName = originalFileName.replace(/\.[^/.]+$/, '');
        const cleanLayerName = layerName.replace(/^[^_]*_/, ''); // Remove everything before first underscore
        const furnitureFileName = `${patternSlug}_${cleanLayerName}.png`;
        const furniturePath = `${patternFolder}${furnitureFileName}`;

        return {
            ...layer,
            path: furniturePath,
            originalPath: layerPath,
            furnitureFileName: furnitureFileName
        };
    }).filter(layer => layer !== null);
    
    return furniturePatternLayers;
}


function createFurniturePattern(originalPattern, furnitureConfig, collectionName) {
    console.log(`🔄 Creating furniture pattern:`);
    console.log(`   Pattern: ${originalPattern.name}`);
    console.log(`   Collection: ${collectionName}`);
    console.log(`   Furniture: ${furnitureConfig.name}`);
    
    // ✅ VERIFY: Make sure collectionName is correct
    if (!collectionName || collectionName === originalPattern.name) {
        console.error(`❌ COLLECTION NAME ERROR!`);
        console.error(`   Expected collection name like "botanicals"`);
        console.error(`   Got: "${collectionName}"`);
        console.error(`   Pattern name: "${originalPattern.name}"`);
        console.error(`   These should be different!`);
    }
    
    const furniturePatternLayers = resolveFurniturePatternPaths(
        furnitureConfig, 
        collectionName,           // ← This should be "botanicals"
        originalPattern.name,     // ← This should be "Key Largo"
        originalPattern.layers || []
    );
    
    const furniturePattern = {
        ...originalPattern,
        layers: furniturePatternLayers,
        isFurniture: true,
        furnitureConfig: furnitureConfig,
        originalPattern: originalPattern,
        collectionName: collectionName // Store collection name for reference
    };
    
    console.log(`✅ Created furniture pattern with ${furniturePatternLayers.length} layers`);
    console.log(`   Expected path pattern: data/furniture/.../patterns/${collectionName}/${createPatternSlug(originalPattern.name)}/`);
    
    return furniturePattern;
}


// Updated switchToFurnitureMode function
function switchToFurnitureMode(furniture) {
    console.log("🔄 Switching to furniture mode for:", furniture.name);
    
    // ✅ SIMPLE: Just grab the current collection name RIGHT NOW
    const originalCollectionName = appState.selectedCollection.name;
    console.log(`📝 Original collection name: "${originalCollectionName}"`);
    
    // Store the ENTIRE original collection
    appState.originalCollection = { ...appState.selectedCollection };
    
    // Convert all patterns to furniture patterns using the CURRENT collection name
    const furniturePatterns = appState.selectedCollection.patterns.map(pattern => {
        return createFurniturePattern(pattern, furniture.config, originalCollectionName);
    });
    
    // Create virtual furniture collection
    const furnitureCollection = {
        name: `${originalCollectionName.toUpperCase()} ${furniture.name.toUpperCase()}`,
        patterns: furniturePatterns,
        curatedColors: appState.selectedCollection.curatedColors,
        coordinates: [],
        mockup: null,
        furnitureType: furniture.id,
wallMask: furniture.config.wallMask || "default-wall-mask.png",  // ← Ensure it's not null
        // ✅ SIMPLE: Store the original collection name directly
        originalCollectionName: originalCollectionName,
        furnitureConfig: furniture.config
    };
    
    // Update app state
    appState.selectedCollection = furnitureCollection;
    appState.furnitureMode = true;
    
    console.log(`✅ Switched to furniture mode. Paths will use: "${originalCollectionName}"`);
    
    // Update UI
    if (dom.collectionHeader) {
        dom.collectionHeader.textContent = furnitureCollection.name;
    }
    
    // Remove try furniture button and add back button
    const tryButton = document.getElementById('tryFurnitureBtn');
    if (tryButton) tryButton.remove();
    addBackToPatternsButton();
    
    // Trigger re-render
    if (appState.currentPattern) {
        const furniturePattern = furniturePatterns.find(p => p.id === appState.currentPattern.id);
        if (furniturePattern) {
            loadPatternData(appState.selectedCollection, furniturePattern.id);
        }
    }
}

function returnToPatternsMode() {
    console.log("🔄 Returning to patterns mode");
    
    // Restore original collection
    if (appState.originalCollection) {
        console.log("🔄 Restoring original collection:", appState.originalCollection.name);
        
        appState.selectedCollection = appState.originalCollection; // Remove .fullCollection
        appState.furnitureMode = false;
        appState.originalCollection = null;
        
        // Clear fabric mode state
        appState.selectedFurniture = null;
        appState.isInFabricMode = false;
        
        // Update UI
        if (dom.collectionHeader) {
            dom.collectionHeader.textContent = toInitialCaps(appState.selectedCollection.name);
        }
        
        // Remove back button
        const backButton = document.getElementById('backToPatternsBtn');
        if (backButton) {
            backButton.remove();
        }
        
        // Re-add try furniture button
        addTryFurnitureButton();
        
        // Trigger re-render in patterns mode
        if (appState.currentPattern) {
            // Find the original pattern (not the furniture version)
            const originalPattern = appState.selectedCollection.patterns.find(p => p.id === appState.currentPattern.id);
            if (originalPattern) {
                loadPatternData(appState.selectedCollection, originalPattern.id);
            }
        }
        
        console.log("✅ Returned to patterns mode");
    } else {
        console.error("❌ Cannot return to patterns mode - original collection not found");
    }
}


// Development helper: Generate expected folder structure
function generateFolderStructure(collectionName, furnitureId) {
    const collection = appState.collections?.find(c => c.name === collectionName);
    const furniture = furnitureConfig?.[furnitureId];
    
    if (!collection || !furniture) {
        console.error("❌ Collection or furniture not found");
        return;
    }
    
    console.log(`📁 FOLDER STRUCTURE for ${furniture.name} + ${collectionName}:`);
    console.log(`📁 Base path: data/furniture/${furnitureId}/patterns/${collectionName}/`);
    console.log(`📁 Folders needed:`);
    
    const folders = [];
    collection.patterns.forEach(pattern => {
        const slug = createPatternSlug(pattern.name);
        const folder = `data/furniture/${furnitureId}/patterns/${collectionName}/${slug}/`;
        folders.push({
            pattern: pattern.name,
            slug: slug,
            folder: folder
        });
        console.log(`   ${folder}`);
    });
    
    console.log(`📊 Total folders needed: ${folders.length}`);
    return folders;
}

// Development helper: Check what files are expected for a pattern
function getExpectedFiles(collectionName, patternName, furnitureId) {
    const collection = appState.collections?.find(c => c.name === collectionName);
    const pattern = collection?.patterns.find(p => p.name === patternName);
    const furniture = furnitureConfig?.[furnitureId];
    
    if (!pattern || !furniture) {
        console.error("❌ Pattern or furniture not found");
        return;
    }
    
    const slug = createPatternSlug(patternName);
    const folder = `https://so-animation.com/colorflex/data/furniture/${furnitureId}/patterns/${collectionName}/${slug}/`;
    
    console.log(`📋 EXPECTED FILES for ${patternName} on ${furniture.name}:`);
    console.log(`📁 Folder: ${folder}`);
    console.log(`📄 Files needed:`);
    
    const expectedFiles = [];
    if (pattern.layers) {
        pattern.layers.forEach((layer, index) => {
            const originalFileName = layer.path.split('/').pop();
            const layerName = originalFileName.replace(/\.[^/.]+$/, '');
            const furnitureFileName = `${slug}-${layerName}.png`;
            expectedFiles.push({
                original: originalFileName,
                furniture: furnitureFileName,
                fullPath: `${folder}${furnitureFileName}`
            });
            console.log(`   ${furnitureFileName}`);
        });
    }
    
    return {
        folder: folder,
        files: expectedFiles
    };
}
// 1. Console commands for planning your work
window.workflowHelpers = {
    
    // See all expected folders for a furniture + collection combo
    showFolders: function(furnitureId, collectionName) {
        console.log(`📁 FOLDER STRUCTURE: ${furnitureId} + ${collectionName}`);
        return generateFolderStructure(collectionName, furnitureId);
    },
    
    // See expected files for a specific pattern
    showFiles: function(collectionName, patternName, furnitureId) {
        console.log(`📄 EXPECTED FILES: ${patternName} on ${furnitureId}`);
        return getExpectedFiles(collectionName, patternName, furnitureId);
    },
    
    // Get overview of all work needed
    showPlan: function() {
        console.log(`🎨 COMPLETE RENDERING PLAN`);
        return generateRenderingPlan();
    },
    
    // Test pattern slug generation
    testSlug: function(patternName) {
        const slug = createPatternSlug(patternName);
        console.log(`Pattern: "${patternName}" → Slug: "${slug}"`);
        return slug;
    },
    
    // Check what's compatible
    showCompatibility: function() {
        console.log(`🔗 FURNITURE COMPATIBILITY:`);
        Object.entries(furnitureConfig || {}).forEach(([furnitureId, furniture]) => {
            console.log(`${furniture.name}: ${furniture.compatibleCollections.join(', ')}`);
        });
    },
    
    // Generate folder creation script
    generateFolderScript: function(furnitureId) {
        const furniture = furnitureConfig?.[furnitureId];
        if (!furniture) {
            console.error(`❌ Furniture ${furnitureId} not found`);
            return;
        }
        
        console.log(`📜 FOLDER CREATION SCRIPT for ${furniture.name}:`);
        console.log(`# Copy and paste these commands to create folders:\n`);
        
        let script = `# Furniture: ${furniture.name}\n`;
        script += `mkdir -p data/furniture/${furnitureId}/patterns\n\n`;
        
        furniture.compatibleCollections.forEach(collectionName => {
            const collection = appState.collections?.find(c => c.name === collectionName);
            if (!collection) return;
            
            script += `# Collection: ${collectionName}\n`;
            script += `mkdir -p data/furniture/${furnitureId}/patterns/${collectionName}\n`;
            
            collection.patterns.forEach(pattern => {
                const slug = createPatternSlug(pattern.name);
                script += `mkdir -p data/furniture/${furnitureId}/patterns/${collectionName}/${slug}\n`;
            });
            script += `\n`;
        });
        
        console.log(script);
        return script;
    }
};

// 2. Development status checker
function checkFurnitureImplementationStatus() {
    console.log(`🔍 FURNITURE IMPLEMENTATION STATUS CHECK:`);
    console.log(`======================================`);
    
    // Check if furniture config is loaded
    if (!furnitureConfig) {
        console.log(`❌ furnitureConfig not loaded`);
        return;
    }
    console.log(`✅ furnitureConfig loaded: ${Object.keys(furnitureConfig).length} furniture pieces`);
    
    // Check collections
    if (!appState.collections || appState.collections.length === 0) {
        console.log(`❌ Collections not loaded`);
        return;
    }
    console.log(`✅ Collections loaded: ${appState.collections.length} collections`);
    
    // Check current state
    const currentCollection = appState.selectedCollection?.name;
    if (!currentCollection) {
        console.log(`❌ No collection currently selected`);
        return;
    }
    console.log(`✅ Current collection: ${currentCollection}`);
    
    // Check compatibility
    const compatible = getCompatibleFurniture(currentCollection);
    console.log(`✅ Compatible furniture: ${compatible.length} pieces`);
    compatible.forEach(f => console.log(`   - ${f.name}`));
    
    // Check if Try Furniture button should be visible
    const tryButton = document.getElementById('tryFurnitureBtn');
    const backButton = document.getElementById('backToPatternsBtn');
    
    if (appState.furnitureMode) {
        console.log(`🪑 Currently in FURNITURE MODE`);
        console.log(`   Back button present: ${!!backButton}`);
    } else {
        console.log(`🎨 Currently in PATTERN MODE`);
        console.log(`   Try Furniture button present: ${!!tryButton}`);
        if (!tryButton && compatible.length > 0) {
            console.log(`⚠️  Try Furniture button should be visible but isn't!`);
        }
    }
    
    return {
        furnitureConfigLoaded: !!furnitureConfig,
        collectionsLoaded: appState.collections?.length > 0,
        currentCollection: currentCollection,
        compatibleFurniture: compatible.length,
        furnitureMode: appState.furnitureMode,
        tryButtonPresent: !!tryButton,
        backButtonPresent: !!backButton
    };
}

// 3. Easy console commands
window.checkStatus = checkFurnitureImplementationStatus;

// 4. Example usage guide
// Workflow helpers available in development mode only
if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
    console.log(`
🪑 FURNITURE WORKFLOW HELPERS LOADED!
=====================================

Console Commands:
• workflowHelpers.showPlan() - See complete rendering plan
• workflowHelpers.showFolders('sofa-capitol', 'botanicals') - See folder structure
• workflowHelpers.showFiles('botanicals', 'Key Largo', 'sofa-capitol') - See expected files
• workflowHelpers.testSlug('Pattern Name Here') - Test slug conversion
• workflowHelpers.showCompatibility() - See what's compatible with what
• workflowHelpers.generateFolderScript('sofa-capitol') - Generate mkdir commands
• checkStatus() - Check implementation status

Example Workflow:
1. workflowHelpers.showPlan() - See total work needed
2. workflowHelpers.generateFolderScript('sofa-capitol') - Create folders
3. Render patterns and save to generated folders
4. Test with Try Furniture button!
`);
}

// 5. Integration check
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for everything to load
    setTimeout(() => {
        console.log(`🔍 Running furniture integration check...`);
        checkFurnitureImplementationStatus();
    }, 2000);
});

// Load furniture config on app init
let furnitureConfig = null;

async function loadFurnitureConfig() {
    try {
        console.log("🪑 Loading furniture configuration...");
        let response;
        const furnitureConfigUrl = window.ColorFlexAssets?.furnitureConfigUrl ||
                       '/assets/furniture-config.json';
        response = await fetch(furnitureConfigUrl, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            furnitureConfig = await response.json();
            // Defensive merge: if remote/embedded config is missing clothing keys,
            // try to fetch the local asset and merge missing entries so clothing still works.
            try {
                const missingKeys = [];
                if (!furnitureConfig.clothing || !furnitureConfig['clothing-pants']) {
                    const localResp = await fetch('/assets/furniture-config.json', { method: 'GET', cache: 'no-cache' });
                    if (localResp.ok) {
                        const localConfig = await localResp.json();
                        Object.keys(localConfig).forEach(key => {
                            if (!furnitureConfig[key]) {
                                furnitureConfig[key] = localConfig[key];
                                missingKeys.push(key);
                            }
                        });
                        if (missingKeys.length > 0) {
                            console.log('🔁 Merged missing furnitureConfig keys from local asset:', missingKeys);
                        }
                    }
                }
            } catch (mergeErr) {
                console.warn('⚠️ Failed to merge local furniture-config.json:', mergeErr);
            }
            appState.furnitureConfig = furnitureConfig;
            console.log('✅ Furniture config loaded with', Object.keys(furnitureConfig).length, 'types:', Object.keys(furnitureConfig));

            // Default to first furniture type if none selected
            if (!appState.selectedFurnitureType && Object.keys(furnitureConfig).length > 0) {
                appState.selectedFurnitureType = Object.keys(furnitureConfig)[0];
                console.log(`🪑 Default furniture type: ${appState.selectedFurnitureType}`);
            }

            return furnitureConfig;
        } else {
            if (response.status === 0 || response.status === 403) {
                throw new Error('CORS Error: Cross-origin request blocked');
            }
            console.error("❌ Furniture config response not ok:", response.status);
        }
    } catch (e) {
        if (e.name === 'TypeError' && e.message.includes('fetch')) {
            console.error('❌ Network/CORS Error loading furniture config:', e);
        } else {
            console.error("❌ Error loading furniture config:", e);
        }
        console.warn("⚠️ Furniture mode will be unavailable");
        return null;
    }
}

// Switch furniture type (for furniture mode UI)
async function switchFurniture(furnitureType) {
    console.log('🪑 Switching furniture to:', furnitureType);

    if (!appState.isInFurnitureMode) {
        console.warn('⚠️ Not in furniture mode');
        return;
    }

    if (!appState.furnitureConfig || !appState.furnitureConfig[furnitureType]) {
        console.error('❌ Furniture type not found:', furnitureType);
        console.log('Available furniture:', Object.keys(appState.furnitureConfig || {}));
        return;
    }

    // Update selected furniture type
    appState.selectedFurnitureType = furnitureType;
    console.log('✅ Furniture type updated to:', furnitureType);

    // Trigger re-render
    if (appState.currentPattern) {
        console.log('🔄 Re-rendering with new furniture...');
        await updatePreview();
    }
}

// Expose switchFurniture globally for furniture selector UI
window.switchFurniture = switchFurniture;


dom._patternName = document.getElementById("patternName"); // Initial assignment

// Fetch colors from colors.json
async function loadColors() {
    try {
        // Check if colors are embedded (Shopify mode)
        if (window.ColorFlexData && window.ColorFlexData.colors) {
            console.log("🎯 Using embedded Sherwin-Williams colors");
            appState.colorsData = window.ColorFlexData.colors;
            console.log("✅ Colors loaded:", appState.colorsData.length);
            return;
        }
        
        // Load directly from Shopify assets
        console.log("📁 Loading colors from Shopify assets");
        const colorsUrl = window.ColorFlexAssets?.colorsUrl || "/assets/colors.json";
        const response = await fetch(colorsUrl, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            if (response.status === 0 || response.status === 403) {
                throw new Error('CORS Error: Cross-origin request blocked');
            }
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Colors data is empty or invalid");
        }

        appState.colorsData = data;
        console.log("✅ Colors loaded:", appState.colorsData.length);
    } catch (err) {
        console.error("âŒ Error loading colors:", err);
        alert("Failed to load Sherwin-Williams colors.");
    }
}

// ============================================================================
// SECTION 5: COLOR MANAGEMENT SYSTEM
// ============================================================================
// Color utilities: formatting, conversion, Sherwin-Williams lookup,
// curated palettes, and ticket system integration.
// ============================================================================

// Helper function to get clean color name without SW/SC codes for display
function getCleanColorName(colorName) {
    if (!colorName || typeof colorName !== "string") {
        return colorName;
    }
    const cleaned = colorName.replace(/^(SW|SC)\d+\s*/i, "").trim();
    return toInitialCaps(cleaned);
}

// Helper function to format colors consistently with SW numbers for display
function formatColorWithSW(colorName) {
    if (!colorName || typeof colorName !== 'string') {
        return 'Unknown Color';
    }

    // If it already has SW format, normalize it
    const swMatch = colorName.match(/^(SW|SC)\s*(\d+)\s*(.+)$/i);
    if (swMatch) {
        const prefix = swMatch[1].toUpperCase();
        const number = swMatch[2];
        const name = swMatch[3].trim();
        return `${prefix}${number} ${toInitialCaps(name)}`;
    }

    // If no SW number, try to look it up in colorsData
    if (appState && appState.colorsData) {
        const cleanName = colorName.toLowerCase().trim();
        const colorEntry = appState.colorsData.find(c =>
            (c.color_name && c.color_name.toLowerCase().trim() === cleanName) ||
            (c.name && c.name.toLowerCase().trim() === cleanName)
        );

        if (colorEntry && colorEntry.sw_number) {
            return `${colorEntry.sw_number.toUpperCase()} ${toInitialCaps(colorEntry.color_name || colorEntry.name)}`;
        }
    }

    // Fallback: just format the name consistently
    return toInitialCaps(colorName);
}

// Lookup color from colors.json data
let lookupColor = (colorName) => {
    console.log(`🔍 lookupColor called with: "${colorName}" (type: ${typeof colorName})`);
    if (!colorName || typeof colorName !== "string") {
        console.warn(`❌ Invalid colorName: ${colorName}, defaulting to #FFFFFF`);
        return "#FFFFFF";
    }

    // Check if input is a hex color
    if (/^#[0-9A-F]{6}$/i.test(colorName.trim())) {
        console.log(`🎨 Hex color detected: ${colorName}`);
        return colorName.trim();
    }

    // Check if input is an SW/SC number (e.g., "SW0049" or "sw0049")
    const swMatch = colorName.match(/^(SW|SC)(\d+)$/i);
    if (swMatch) {
        const swNumber = `sw${swMatch[2]}`.toLowerCase(); // Normalize to "sw0049"
        console.log(`🔢 SW number detected: "${colorName}" -> normalized: "${swNumber}"`);
        const colorEntry = appState.colorsData.find(c => c && c.sw_number && c.sw_number.toLowerCase() === swNumber);
        if (colorEntry) {
            console.log(`✅ Found by SW number: "${colorName}" -> #${colorEntry.hex}`);
            return `#${colorEntry.hex}`;
        }
        console.warn(`❌ SW number '${colorName}' not found in colorsData`);
        return "#FFFFFF";
    }

    // Otherwise, treat as color name
    const cleanedColorName = colorName.replace(/^(SW|SC|SWs|SCs|Sw|Sc|swsw|SWsw|SCsc|SCcs|Swsc|swsc)\d+\s*/i, "").toLowerCase().trim();
    console.log(`🧹 Cleaned color name: "${colorName}" -> "${cleanedColorName}"`);

    console.log(`🔍 Searching in ${appState.colorsData.length} colors for: "${cleanedColorName}"`);
    const colorEntry = appState.colorsData.find(c => c && typeof c.color_name === 'string' && c.color_name.toLowerCase() === cleanedColorName);
    if (!colorEntry) {
        console.warn(`❌ Color '${cleanedColorName}' not found in colorsData, available colors sample:`, appState.colorsData.slice(0, 5).map(c => c.color_name));
        return "#FFFFFF";
    }
    console.log(`✅ Found by name: "${colorName}" -> "${cleanedColorName}" -> #${colorEntry.hex}`);
    return `#${colorEntry.hex}`;
};
if (USE_GUARD && DEBUG_TRACE) {
    lookupColor = guard(traceWrapper(lookupColor, "lookupColor")); // Wrapped for debugging
} else if (USE_GUARD) {
    lookupColor = guard(lookupColor, "lookupColor"); // Wrapped for debugging
}

// Add saved patterns indicator to main navigation
function addSavedPatternsMenuIcon() {
    // 🆕 SHOW EVERYWHERE: Remove restriction that excluded ColorFlex page
    // Now chameleon button will appear on all pages including ColorFlex page for standard patterns
    console.log('🦎 Adding chameleon menu icon on page:', window.location.pathname);
    
    const patterns = JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');
    const existingIcon = document.getElementById('colorflexMenuIcon');
    
    if (patterns.length > 0 && !existingIcon) {
        // Find the main navigation or header to add our icon to
        const nav = document.querySelector('nav, header, .header, .navigation, .main-header, .site-header');
        if (nav) {
            const menuIcon = document.createElement('div');
            menuIcon.id = 'colorflexMenuIcon';
            menuIcon.style.cssText = `
                position: relative;
                display: inline-flex;
                align-items: center;
                cursor: pointer;
                margin: 0 10px;
                padding: 8px;
                border-radius: 50%;
                background: rgba(212, 175, 55, 0.1);
                border: 2px solid rgba(212, 175, 55, 0.6);
                transition: all 0.3s ease;
                z-index: 1000;
            `;
            
            menuIcon.innerHTML = `
                <img src="https://so-animation.com/colorflex/img/camelion-sm-black.jpg" 
                     style="width: 24px; height: 24px; border-radius: 50%;" 
                     alt="My ColorFlex Patterns">
                <span style="
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #d4af37;
                    color: white;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    font-size: 10px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">${patterns.length}</span>
            `;
            
            menuIcon.addEventListener('click', () => {
                console.log('🎨 Opening saved patterns from menu icon');
                showSavedPatternsModal();
            });
            
            menuIcon.addEventListener('mouseenter', () => {
                menuIcon.style.background = 'rgba(212, 175, 55, 0.2)';
                menuIcon.style.transform = 'scale(1.1)';
            });
            
            menuIcon.addEventListener('mouseleave', () => {
                menuIcon.style.background = 'rgba(212, 175, 55, 0.1)';
                menuIcon.style.transform = 'scale(1)';
            });
            
            // Try to place it near existing user/account icons
            const userIcon = nav.querySelector('[href*="account"], [href*="login"], .user-icon, .account-icon');
            if (userIcon && userIcon.parentNode) {
                userIcon.parentNode.insertBefore(menuIcon, userIcon);
            } else {
                // Fallback: add to the end of navigation
                nav.appendChild(menuIcon);
            }
            
            console.log('✅ Added ColorFlex menu icon with', patterns.length, 'saved patterns');
        }
    } else if (patterns.length === 0 && existingIcon) {
        // Remove icon if no patterns saved
        existingIcon.remove();
        console.log('🗑️ Removed ColorFlex menu icon (no saved patterns)');
    } else if (existingIcon) {
        // Update count if icon exists
        const countSpan = existingIcon.querySelector('span');
        if (countSpan) {
            countSpan.textContent = patterns.length;
        }
    }
}

// Update menu icon whenever patterns are saved/deleted
function updateSavedPatternsMenuIcon() {
    // First, update the chameleon icon next to the save button (on ColorFlex page)
    const viewSavedBtn = document.getElementById('viewSavedBtn');
    if (viewSavedBtn) {
        const savedPatterns = JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');
        const badge = viewSavedBtn.querySelector('span');
        if (badge) {
            badge.textContent = savedPatterns.length;
            console.log('✅ Updated chameleon badge count to:', savedPatterns.length);
        }
    }

    // Then, update/add the menu icon in navigation (other pages)
    setTimeout(addSavedPatternsMenuIcon, 100); // Small delay to ensure DOM is ready
}

// Initialize menu icon on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add saved patterns menu icon if patterns exist
    updateSavedPatternsMenuIcon();

    // Hamburger menu functionality
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

    // Buy It Now button functionality
    const buyItNowBtn = document.getElementById('buyItNowButton');
    if (buyItNowBtn) {
        buyItNowBtn.addEventListener('click', async function() {
            console.log('🛒 Buy It Now clicked - starting auto-save and purchase flow...');

            try {
                const state = window.appState;

                // Validate we have a pattern loaded
                if (!state.currentPattern || !state.currentPattern.name) {
                    showSaveNotification('❌ No pattern selected');
                    return;
                }

                console.log('🎨 Current pattern:', state.currentPattern.name);
                console.log('🔄 Step 1: Ensuring pattern is fully rendered...');

                // Force a canvas update to ensure we're capturing the current pattern
                // Look for the render/update function
                if (window.render && typeof window.render === 'function') {
                    console.log('🔄 Calling render() to update canvas...');
                    await window.render();
                } else if (window.updateCanvas && typeof window.updateCanvas === 'function') {
                    console.log('🔄 Calling updateCanvas() to update canvas...');
                    await window.updateCanvas();
                } else if (window.drawPattern && typeof window.drawPattern === 'function') {
                    console.log('🔄 Calling drawPattern() to update canvas...');
                    await window.drawPattern();
                }

                // Wait for canvas to fully render
                await new Promise(resolve => setTimeout(resolve, 800));

                // First, save the pattern to My List (this captures the thumbnail)
                console.log('💾 Step 2: Saving pattern with thumbnail...');
                await window.saveToMyList();

                // Small delay to ensure save completes
                await new Promise(resolve => setTimeout(resolve, 300));

                // Get the JUST SAVED pattern from localStorage (includes fresh thumbnail)
                const allSavedPatterns = JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');
                const justSavedPattern = allSavedPatterns[allSavedPatterns.length - 1]; // Get the last saved pattern

                if (!justSavedPattern) {
                    console.error('❌ Failed to retrieve just-saved pattern');
                    showSaveNotification('❌ Failed to load saved pattern');
                    return;
                }

                console.log('📸 Retrieved just-saved pattern with thumbnail:', {
                    name: justSavedPattern.patternName,
                    hasThumbnail: !!justSavedPattern.thumbnail,
                    thumbnailLength: justSavedPattern.thumbnail ? justSavedPattern.thumbnail.length : 0
                });

                // Use the just-saved pattern data (includes fresh thumbnail)
                const savedPattern = {
                    ...justSavedPattern,
                    triggerPurchase: true
                };

                console.log('🛒 Step 3: Triggering material selection modal with fresh thumbnail...');

                // Trigger the material selection modal
                if (window.showMaterialSelectionModal && typeof window.showMaterialSelectionModal === 'function') {
                    window.showMaterialSelectionModal(savedPattern);
                } else {
                    console.error('❌ Material selection modal not available');
                    showSaveNotification('❌ Unable to start purchase flow');
                }
            } catch (error) {
                console.error('❌ Error in Buy It Now flow:', error);
                showSaveNotification('❌ Failed to process purchase');
            }
        });
        console.log('✅ Buy It Now button initialized');
    }
});

// Check if a specific pattern has furniture renders
async function checkFurnitureAvailability(patternName) {
  if (!patternName || typeof patternName !== 'string') {
    console.warn('checkFurnitureAvailability: Invalid patternName provided');
    return { available: false };
  }
  const patternSlug = patternName.toLowerCase().replace(/ /g, '-');
  const manifestUrl = `data/furniture/sofa-capitol/patterns/${patternSlug}/manifest.json`;
  
  try {
    const response = await fetch(manifestUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      }
    });
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



/**
 * =============================================================================
 * SECTION 4: FABRIC RENDERING ENGINE
 * =============================================================================
 * 
 * This section contains the core fabric and pattern rendering system including:
 * - Advanced fabric compositing with multiple blend modes
 * - Resolution-independent image scaling and processing  
 * - Furniture layer drawing and mockup generation
 * - Masked layer processing with alpha channels
 * - Real-time fabric parameter tuning and effects
 */

// Utility Functions

/**
 * Helper function for scaling images while preserving aspect ratio
 * Calculates dimensions to fit an image within target bounds
 * 
 * @param {HTMLImageElement} img - Source image to scale
 * @param {number} targetWidth - Maximum width
 * @param {number} targetHeight - Maximum height
 * @returns {Object} Scaled dimensions and positioning {width, height, x, y}
 */
// ✅ Helper function to get correct aspect ratio, accounting for rotated thumbnails
function getCorrectAspectRatio(img, pattern) {
    const imageAspectRatio = img.width / img.height;
    
    if (!pattern || !pattern.size) {
        console.log("🔍 No pattern size data, using image aspect ratio:", imageAspectRatio.toFixed(3));
        return imageAspectRatio;
    }
    
    const patternSize = pattern.size;
    const declaredAspectRatio = patternSize[0] / patternSize[1];
    const aspectRatioDifference = Math.abs(imageAspectRatio - declaredAspectRatio);
    const isRotated = aspectRatioDifference > 0.1; // More than 10% difference suggests rotation
    
    console.log("🔍 ASPECT RATIO CORRECTION:");
    console.log("  Pattern:", pattern.name);
    console.log("  📏 Image aspect ratio:", imageAspectRatio.toFixed(3));
    console.log("  📋 Declared aspect ratio:", declaredAspectRatio.toFixed(3));
    console.log("  🔄 Appears rotated:", isRotated ? "❌ YES" : "✅ NO");
    
    const correctAspectRatio = isRotated ? declaredAspectRatio : imageAspectRatio;
    console.log("  🎯 Using aspect ratio:", correctAspectRatio.toFixed(3));
    
    return correctAspectRatio;
}

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

// ✅ Enhanced scaleToFit that uses correct aspect ratio for patterns
function scaleToFitWithCorrectAspectRatio(img, targetWidth, targetHeight, pattern) {
    const correctAspectRatio = getCorrectAspectRatio(img, pattern);
    let drawWidth = targetWidth;
    let drawHeight = targetHeight;
    
    if (correctAspectRatio > targetWidth / targetHeight) {
        drawHeight = drawWidth / correctAspectRatio;
    } else {
        drawWidth = drawHeight * correctAspectRatio;
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
    let imageData;
    try {
        imageData = offCtx.getImageData(0, 0, 1080, 1080);
    } catch (e) {
        console.warn("⚠️ Canvas tainted, skipping masked layer processing:", e.message);
        return;
    }
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

/**
 * Find color in ticket by position offset
 *
 * @param {string} currentColorName - Current color name
 * @param {number} positionOffset - +1 for next in ticket, -1 for previous
 * @returns {Object|null} Color object or null if not found
 */
function findColorInTicket(currentColorName, positionOffset) {
    if (!appState.colorsData) return null;

    // Find current color in colors data
    const cleanName = currentColorName.replace(/^(SW|SC)\d+\s*/i, "").trim().toLowerCase();
    const currentColor = appState.colorsData.find(c =>
        c.color_name?.toLowerCase() === cleanName
    );

    if (!currentColor || !currentColor.locator_id) {
        console.log(`  ⚠️ Color "${currentColorName}" not in a ticket`);
        return null;
    }

    // Parse locator_id: "178-C3" → ticket: 178, position: 3
    const match = currentColor.locator_id.match(/^(\d+)-C(\d+)$/i);
    if (!match) {
        console.log(`  ⚠️ Invalid locator_id format: ${currentColor.locator_id}`);
        return null;
    }

    const ticketNumber = match[1];
    const currentPosition = parseInt(match[2]);
    const newPosition = currentPosition + positionOffset;

    // Tickets have positions C1-C7
    if (newPosition < 1 || newPosition > 7) {
        console.log(`  ⚠️ Position ${newPosition} out of range (1-7)`);
        return null;
    }

    // Find color at new position
    const newLocatorId = `${ticketNumber}-C${newPosition}`;
    const newColor = appState.colorsData.find(c =>
        c.locator_id?.toUpperCase() === newLocatorId.toUpperCase()
    );

    if (newColor) {
        console.log(`  🎟️ Found in ticket ${ticketNumber}: Position ${currentPosition} → ${newPosition}`);
        console.log(`     ${currentColor.color_name} → ${newColor.color_name}`);
    }

    return newColor;
}

/**
 * Find nearest lighter or darker Sherwin-Williams color
 * Uses ticket-based navigation if available, falls back to HSL-based
 *
 * @param {string} currentColorName - Current color name (e.g., "Snowbound" or "SW7006")
 * @param {string} direction - "lighter" or "darker"
 * @returns {Object|null} Matching SW color object with {color_name, hex, sw_number} or null if not found
 *
 * @example
 * const darkerColor = findLighterDarkerSWColor("Snowbound", "darker");
 * // Returns: {color_name: "Silverpointe", hex: "c9cac8", sw_number: "SW7653"}
 */
function findLighterDarkerSWColor(currentColorName, direction) {
    console.log(`🎨 Finding ${direction} color for: ${currentColorName}`);

    // TRY TICKET-BASED NAVIGATION FIRST
    const positionOffset = direction === "darker" ? +1 : -1;  // C1=lightest, C7=darkest
    const ticketColor = findColorInTicket(currentColorName, positionOffset);

    if (ticketColor) {
        console.log(`  ✅ Using ticket-based navigation`);
        return ticketColor;
    }

    // FALLBACK TO HSL-BASED NAVIGATION
    console.log(`  🔄 Falling back to HSL-based navigation`);

    // Lookup current color to get hex value
    const currentHex = lookupColor(currentColorName);
    if (!currentHex || currentHex === "#FFFFFF") {
        console.error("❌ Invalid current color:", currentColorName);
        return null;
    }

    // Convert to HSL
    const currentHSL = hexToHSL(currentHex);
    if (!currentHSL) {
        console.error("❌ Could not convert to HSL:", currentHex);
        return null;
    }

    console.log(`  Current HSL: h=${currentHSL.h}, s=${currentHSL.s}, l=${currentHSL.l}`);

    // Define lightness adjustment step (10% increments)
    const lightnessStep = 10;
    const targetLightness = direction === "lighter"
        ? Math.min(100, currentHSL.l + lightnessStep)
        : Math.max(0, currentHSL.l - lightnessStep);

    console.log(`  Target lightness: ${targetLightness} (${direction} by ${lightnessStep})`);

    // Generate target hex with adjusted lightness
    const targetHex = hslToHex(currentHSL.h, currentHSL.s, targetLightness);
    console.log(`  Target hex: ${targetHex}`);

    // Find closest SW color to target
    // Ensure colorsData is available
    const colorsDataArray = appState.colorsData;
    if (!colorsDataArray || !Array.isArray(colorsDataArray)) {
        console.error("❌ appState.colorsData not available");
        return null;
    }

    // Filter SW colors by similar hue (within 15 degrees) and appropriate lightness direction
    let candidateColors = colorsDataArray.filter(color => {
        const colorHex = `#${color.hex}`;
        const colorHSL = hexToHSL(colorHex);
        if (!colorHSL) return false;

        // Check hue similarity (allow wrap-around at 0/360)
        const hueDiff = Math.abs(colorHSL.h - currentHSL.h);
        const hueDistance = Math.min(hueDiff, 360 - hueDiff);
        const hueMatch = hueDistance < 30; // Within 30 degrees of hue

        // Check lightness direction
        const lightnessMatch = direction === "lighter"
            ? colorHSL.l > currentHSL.l
            : colorHSL.l < currentHSL.l;

        return hueMatch && lightnessMatch;
    });

    console.log(`  Found ${candidateColors.length} candidate colors with similar hue`);

    // If no candidates with similar hue, fall back to all colors
    if (candidateColors.length === 0) {
        console.log("  ⚠️ No candidates with similar hue, using all colors");
        candidateColors = colorsDataArray;
    }

    // Find closest color among candidates
    let bestMatch = null;
    let bestDistance = Infinity;

    for (const color of candidateColors) {
        const dist = colorDistance(`#${color.hex}`, targetHex);
        if (dist < bestDistance) {
            bestDistance = dist;
            bestMatch = color;
        }
    }

    if (bestMatch) {
        console.log(`  ✅ Found ${direction} color: ${bestMatch.color_name} (${bestMatch.sw_number})`);
        console.log(`     Distance: ${bestDistance.toFixed(2)}`);
    } else {
        console.log(`  ❌ No ${direction} color found`);
    }

    return bestMatch;
}

// Reusable listener setup
const setupPrintListener = () => {
    // Only set up print listeners on ColorFlex app pages
    if (!isColorFlexAppPage()) {
        console.log('🔧 Skipping print listener setup - not on ColorFlex app page');
        return;
    }
    
    const tryAttachListener = (attempt = 1, maxAttempts = 10) => {
        const printButton = document.getElementById("printButton");

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
            console.log("✅ Print listener attached");
        } else if (attempt < maxAttempts) {
            // Silently retry - only log if debug mode
            setTimeout(() => tryAttachListener(attempt + 1, maxAttempts), 500);
        } else {
            // Only log once at the end if print button never found
            console.log("ℹ️ Print button not found - feature not available on this page");
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


    const toInitialCaps = (str) => {
        if (!str || typeof str !== 'string') {
            return '';
        }
        return str
            .toLowerCase()
            .replace(/\.\w+$/, '') // Remove file extensions like .jpg, .png, etc.
            .replace(/-\d+x\d+$|-variant$/i, '') // Remove suffixes like -24x24, -variant
            .replace(/_/g, ' ') // Replace underscores with spaces
            .split(/[\s-]+/) // Split on spaces and hyphens
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const toTitleCase = (str) => {
        if (!str || typeof str !== 'string') {
            return '';
        }
        return str.toLowerCase().split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

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


async function drawFurnitureLayer(ctx, imagePath, options = {}) {
    console.log("🔍 drawFurnitureLayer ENTRY:");
    console.log("  imagePath received:", imagePath);
    console.log("  Is sofa base?", imagePath?.includes('sofa-capitol-base'));
    console.log("  Is ferns pattern?", imagePath?.includes('ferns'));

    const {
        tintColor = null,
        isMask = false,
        opacity = 1.0,
        blendMode = "source-over",
        zoomState = null,
        highRes = false
    } = options;
    
    const width = 600;
    const height = 450;

    // ✅ Scale up for high resolution pattern rendering
    const renderScale = highRes ? 2 : 1;
    const renderWidth = width * renderScale;
    const renderHeight = height * renderScale;

    
    // ✅ Use passed zoom state if provided, otherwise fall back to global
    const activeZoomState = zoomState || {
        scale: furnitureViewSettings.scale,
        offsetX: furnitureViewSettings.offsetX,
        offsetY: furnitureViewSettings.offsetY,
        isZoomed: furnitureViewSettings.isZoomed
    };
    
    const { scale, offsetX, offsetY } = activeZoomState;
    
    console.log(`🔍 drawFurnitureLayer DEBUG for: ${imagePath.split('/').pop()}`);
    console.log(`   📊 ZOOM STATE: scale=${scale}, offset=(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
    console.log(`   🔒 Using ${zoomState ? 'PASSED' : 'GLOBAL'} zoom state`);
    console.log(`   Canvas size: ${width}x${height}`);
    
    try {
        const img = await loadImage(imagePath);
        if (!img) {
            console.error("❌ Failed to load image:", imagePath);
            return;
        }
        
        console.log(`   Original image: ${img.naturalWidth}x${img.naturalHeight}`);
        if (highRes) console.log(`   🔍 High-res rendering: ${renderWidth}x${renderHeight}`);
        
        const scaledWidth = img.naturalWidth * scale;  // Keep original logic
        const scaledHeight = img.naturalHeight * scale; // Keep original logic

        let drawX = (renderWidth / 2) - (scaledWidth / 2) + (offsetX * renderScale);
        let drawY = (renderHeight / 2) - (scaledHeight / 2) + (offsetY * renderScale);
        
        
        console.log(`   Draw position: (${drawX.toFixed(1)}, ${drawY.toFixed(1)})`);
        
        // Create working canvas at render resolution
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = renderWidth;
        tempCanvas.height = renderHeight;
        const tempCtx = tempCanvas.getContext("2d");
        
        if (isMask && tintColor) {
            // ✅ CORRECTED WALL MASK LOGIC
            console.log(`   🎭 Processing wall mask with color ${tintColor}`);
            
            // First, draw the mask image to get its alpha values
            const maskCanvas = document.createElement("canvas");
            maskCanvas.width = width;
            maskCanvas.height = height;
            const maskCtx = maskCanvas.getContext("2d");
            
            // Draw the scaled mask image
            maskCtx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);
            
            // Get the mask pixel data
            let maskImageData;
            try {
                maskImageData = maskCtx.getImageData(0, 0, width, height);
            } catch (e) {
                console.warn("⚠️ Canvas tainted, falling back to simple draw for mask processing:", e.message);
                tempCtx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);
                ctx.drawImage(tempCanvas, 0, 0);
                return;
            }
            const maskData = maskImageData.data;
            
            // Create output canvas with the tint color
            const outputImageData = tempCtx.createImageData(width, height);
            const outputData = outputImageData.data;

            console.log("🎨 TINTING DEBUG:");
            console.log("  Image being tinted:", imagePath?.split('/').pop());
            console.log("  tintColor parameter:", tintColor);
            console.log("  Is sofa base:", imagePath?.includes('sofa-capitol-base'));

            
            // Parse tint color
            const hex = tintColor.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            console.log("  Parsed RGB:", r, g, b);
            console.log("  Should be Cottage Linen RGB: 240, 240, 233");

            console.log(`   🎨 Tint color RGB: (${r}, ${g}, ${b})`);
            
            // Apply mask: white areas in mask = wall color, black areas = transparent
            for (let i = 0; i < maskData.length; i += 4) {
                const maskR = maskData[i];
                const maskG = maskData[i + 1];
                const maskB = maskData[i + 2];
                
                // Calculate mask intensity (how white the pixel is)
                const maskIntensity = (maskR + maskG + maskB) / 3;
                
                if (maskIntensity > 128) {
                    // White area in mask = apply wall color
                    outputData[i] = r;
                    outputData[i + 1] = g;
                    outputData[i + 2] = b;
                    outputData[i + 3] = 249; // ✅ ADJUST THIS: 0 = invisible, 128 = 50%, 255 = full intensity
                } else {
                    // Black area in mask = transparent (let room background show through)
                    outputData[i] = 0;
                    outputData[i + 1] = 0;
                    outputData[i + 2] = 0;
                    outputData[i + 3] = 0; // Fully transparent
                }
            }
            
            // Put the processed image data to the temp canvas
            tempCtx.putImageData(outputImageData, 0, 0);
            
            console.log(`   ✅ Wall mask applied: white areas colored, black areas transparent`);
            
            } else if (tintColor) {
            // ✅ FIX: Use luminance-based logic for furniture bases and pattern layers
            // Use EXTRAS logic only for tintable extras (pillows/throw) - NOT for fixed extras
            const isExtrasLayer = imagePath?.includes('extras-tintable');  // Only match tintable extras
            const useLuminanceLogic = !isExtrasLayer && (imagePath?.includes('sofa-capitol-base') || imagePath?.includes('/furniture/') || imagePath?.includes('patterns/'));

            if (useLuminanceLogic) {
                console.log("🎨 Using LUMINANCE-based logic for:", imagePath?.split('/').pop());
                
                // Draw the image first
                tempCtx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);
                
                // Get image data
                let imageData;
                try {
                    imageData = tempCtx.getImageData(0, 0, renderWidth, renderHeight);
                } catch (e) {
                    console.warn("⚠️ Canvas tainted, falling back to simple tinting for luminance processing:", e.message);
                    // Fall back to simple tinting
                    tempCtx.fillStyle = tintColor;
                    tempCtx.fillRect(0, 0, renderWidth, renderHeight);
                    tempCtx.globalCompositeOperation = "destination-in";
                    tempCtx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);
                    tempCtx.globalCompositeOperation = "source-over";
                    ctx.drawImage(tempCanvas, 0, 0);
                    return;
                }
                const data = imageData.data;
                
                // Parse tint color
                const hex = tintColor.replace("#", "");
                const rLayer = parseInt(hex.substring(0, 2), 16);
                const gLayer = parseInt(hex.substring(2, 4), 16);
                const bLayer = parseInt(hex.substring(4, 6), 16);
                
                // ✅ USE LUMINANCE for both sofa base AND patterns
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const brightness = (r + g + b) / 3;
                    
                    if (brightness <= 5) {  // Pure black - transparent
                        data[i + 3] = 0;
                    } else {  // Non-black pixels - tint based on brightness
                        const alpha = brightness / 255;
                        
                        data[i] = rLayer;
                        data[i + 1] = gLayer; 
                        data[i + 2] = bLayer;
                        data[i + 3] = Math.round(alpha * 255);
                    }
                }
                
                tempCtx.putImageData(imageData, 0, 0);
                
            } else if (isExtrasLayer) {
                // ✅ EXTRAS LAYER: Tint ONLY within existing alpha channel
                // Respects the PNG transparency - only colorizes visible pixels
                console.log("🛋️ Using EXTRAS tinting logic for:", imagePath?.split('/').pop());

                tempCtx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);

                let imageData;
                try {
                    imageData = tempCtx.getImageData(0, 0, renderWidth, renderHeight);
                } catch (e) {
                    console.warn("⚠️ Canvas tainted for extras, falling back to simple draw:", e.message);
                    ctx.drawImage(tempCanvas, 0, 0);
                    return;
                }
                const data = imageData.data;

                // Parse tint color
                const hex = tintColor.replace("#", "");
                const rTint = parseInt(hex.substring(0, 2), 16);
                const gTint = parseInt(hex.substring(2, 4), 16);
                const bTint = parseInt(hex.substring(4, 6), 16);

                // Process each pixel - ONLY modify pixels that have alpha (are visible)
                // Preserve original alpha channel completely
                const tintIntensity = 0.8;  // ✅ ADJUST THIS: 0.0 = no tint, 1.0 = full tint

                for (let i = 0; i < data.length; i += 4) {
                    const originalAlpha = data[i + 3];

                    // Skip fully transparent pixels
                    if (originalAlpha === 0) continue;

                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Calculate luminance/brightness of original pixel
                    const brightness = (r + g + b) / 3;

                    // Apply tint while preserving shading (darker areas stay darker)
                    // Use brightness as a factor to maintain shadows and highlights
                    const shadeFactor = brightness / 255;

                    // Blend between original color and tinted color based on intensity
                    data[i] = Math.round(r * (1 - tintIntensity) + rTint * shadeFactor * tintIntensity);
                    data[i + 1] = Math.round(g * (1 - tintIntensity) + gTint * shadeFactor * tintIntensity);
                    data[i + 2] = Math.round(b * (1 - tintIntensity) + bTint * shadeFactor * tintIntensity);
                    // PRESERVE original alpha - don't modify data[i + 3]
                }

                tempCtx.putImageData(imageData, 0, 0);
                console.log("✅ Extras tinting applied (alpha-preserved) with color:", tintColor);

            } else {
                // Keep original alpha-based logic for other elements (if any)
                tempCtx.fillStyle = tintColor;
                tempCtx.fillRect(0, 0, width, height);

                tempCtx.globalCompositeOperation = "destination-in";
                tempCtx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);
                tempCtx.globalCompositeOperation = "source-over";
            }
        }

        else {
            // Direct images - draw at calculated position and size
            tempCtx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);
            console.log(`   ✅ Direct image drawn at (${drawX.toFixed(1)}, ${drawY.toFixed(1)})`);
        }
        
        // Draw to main canvas
        ctx.save();
        ctx.globalAlpha = opacity;
        console.log("   🎨 Using NORMAL blend for", imagePath?.split('/').pop());
        ctx.globalCompositeOperation = blendMode; // Normal for everything else

        if (highRes) {
            // Scale down from high-res to normal resolution
            ctx.drawImage(tempCanvas, 0, 0, renderWidth, renderHeight, 0, 0, width, height);
            console.log(`   ✅ High-res layer scaled down and composited`);
        } else {
            ctx.drawImage(tempCanvas, 0, 0);
        }
        ctx.restore();        
        console.log(`   ✅ Layer composited to main canvas`);
        
    } catch (error) {
        console.error("❌ Error in drawFurnitureLayer:", error);
    }
}

// Create a color input UI element
const createColorInput = (label, id, initialColor, isBackground = false) => {
    console.log(`Creating ${label} input, ID: ${id}, initialColor: ${initialColor}`);
    
    const container = document.createElement("div");
    container.className = "layer-input-container";

    const labelEl = document.createElement("div");
    labelEl.className = "layer-label";
    labelEl.textContent = label || "Unknown Layer";

    // Create wrapper for color circle with +/- buttons
    const colorControlsWrapper = document.createElement("div");
    colorControlsWrapper.style.cssText = `
        position: relative;
        display: inline-block;
    `;

    // Create darker button (left side, minus)
    const darkerButton = document.createElement("button");
    darkerButton.className = "lightness-adjust-btn";
    darkerButton.textContent = "−";
    darkerButton.title = "Find darker color";
    darkerButton.style.cssText = `
        position: absolute;
        left: -16px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
        z-index: 10;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s ease;
    `;

    // Create lighter button (right side, plus)
    const lighterButton = document.createElement("button");
    lighterButton.className = "lightness-adjust-btn";
    lighterButton.textContent = "+";
    lighterButton.title = "Find lighter color";
    lighterButton.style.cssText = `
        position: absolute;
        right: -8px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        color: black;
        border: 1px solid rgba(0, 0, 0, 0.3);
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
        z-index: 10;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s ease;
    `;

    const colorCircle = document.createElement("div");
    colorCircle.className = "circle-input";
    colorCircle.id = `${id}Circle`;
    const cleanInitialColor = (initialColor || "Snowbound").replace(/^(SW|SC)\d+\s*/i, "").trim();
    const colorValue = lookupColor(cleanInitialColor);
    console.log(`Setting ${label} circle background to: ${colorValue}`);
    colorCircle.style.backgroundColor = colorValue;

    // Assemble color controls (darker button + circle + lighter button)
    colorControlsWrapper.appendChild(darkerButton);
    colorControlsWrapper.appendChild(colorCircle);
    colorControlsWrapper.appendChild(lighterButton);

    // Show/hide buttons on hover
    colorControlsWrapper.addEventListener("mouseenter", () => {
        darkerButton.style.opacity = "1";
        darkerButton.style.pointerEvents = "auto";
        lighterButton.style.opacity = "1";
        lighterButton.style.pointerEvents = "auto";
    });

    colorControlsWrapper.addEventListener("mouseleave", () => {
        darkerButton.style.opacity = "0";
        darkerButton.style.pointerEvents = "none";
        lighterButton.style.opacity = "0";
        lighterButton.style.pointerEvents = "none";
    });

    const input = document.createElement("input");
    input.type = "text";
    input.className = "layer-input";
    input.id = id;
    input.placeholder = `Enter ${label ? label.toLowerCase() : 'layer'} color`;
    input.value = getCleanColorName(cleanInitialColor);
    input.title = "Enter color name (e.g., Snowbound) or SW number (e.g., SW7006)";
    console.log(`Setting ${label} input value to: ${input.value}`);

    container.append(labelEl, colorControlsWrapper, input);
   


    const updateColor = () => {
        console.log(`updateColor called for ${label}, input value: ${input.value}`);
        const userInput = input.value.trim();

        // Try to lookup the color (lookupColor handles SW/SC prefixes internally)
        const hex = lookupColor(userInput);

        if (!userInput || hex === "#FFFFFF") {
            // Invalid input - restore to initial color
            input.value = getCleanColorName(cleanInitialColor);
            colorCircle.style.backgroundColor = colorValue;
            console.log(`${label} input restored to initial color: ${colorValue}`);
        } else {
            // Valid color - keep user's input format (with or without SW prefix)
            input.value = userInput;
            colorCircle.style.backgroundColor = hex;
            console.log(`${label} input updated to: ${hex} (kept user format: ${userInput})`);
        }

        const layerIndex = appState.currentLayers.findIndex(layer => layer.label === label);
        if (layerIndex !== -1) {
            appState.currentLayers[layerIndex].color = input.value;

            console.log("🎯 COLOR UPDATE DEBUG:");
            console.log(`  Changed input: ${label} (index ${layerIndex})`);
            console.log(`  New value: ${input.value}`);
            console.log("  Current layer structure after update:");
            appState.currentLayers.forEach((layer, i) => {
                console.log(`    ${i}: ${layer.label} = "${layer.color}"`);
            });


            console.log(`Updated appState.currentLayers[${layerIndex}].color to: ${input.value}`);
        }

        const isFurniturePattern = appState.currentPattern?.isFurniture || false;

        // Check if we're in fabric mode - render both fabric mockup and pattern preview
        if (appState.isInFabricMode) {
            console.log("🧵 Color changed in fabric mode - calling both renderFabricMockup() and updatePreview()");
            renderFabricMockup();
            updatePreview(); // Also update the pattern preview on the left
        } else {
            // Regular furniture or pattern mode
            updatePreview();
            updateRoomMockup();
        }
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
        // Check if we're in coordinate mode (back button exists) - exit coordinate mode
        const coordinateBackButton = document.getElementById('backToPatternLink');
        
        if (coordinateBackButton) {
            console.log(`🔄 Color circle clicked in coordinate mode - triggering back to pattern then selecting layer`);
            coordinateBackButton.click(); // Trigger the coordinate back button
            // Pass through the click after returning to pattern mode
            setTimeout(() => {
                appState.lastSelectedLayer = {
                    input,
                    circle: colorCircle,
                    label,
                    isBackground
                };
                highlightActiveLayer(colorCircle);
                console.log(`✅ Layer selected after returning from coordinate mode: ${label}`);
            }, 50);
            return;
        }
        
        // In furniture mode, allow normal color changes - do NOT exit furniture mode
        const furnitureBackButton = document.getElementById('backToPatternsBtn');
        if (furnitureBackButton) {
            console.log(`🎨 Color circle clicked in furniture mode - changing color while staying in furniture mode: ${label}`);
            // Continue with normal color selection behavior below
        }
        
        // Normal color circle behavior
        appState.lastSelectedLayer = {
            input,
            circle: colorCircle,
            label,
            isBackground
        };
        highlightActiveLayer(colorCircle);
        console.log(`Clicked ${label} color circle`);
    });

    // Add hover effects for lightness adjustment buttons
    const addButtonHoverEffects = (button) => {
        button.addEventListener("mouseenter", () => {
            button.style.transform = "translateY(-50%) scale(1.1)";
            button.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
        });
        button.addEventListener("mouseleave", () => {
            button.style.transform = "translateY(-50%) scale(1)";
            button.style.boxShadow = "none";
        });
    };

    addButtonHoverEffects(darkerButton);
    addButtonHoverEffects(lighterButton);

    // Darker button click handler
    darkerButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering color circle click
        console.log(`🔽 Darker button clicked for ${label}`);

        const currentColorName = input.value.trim();
        const newColor = findLighterDarkerSWColor(currentColorName, "darker");

        if (newColor) {
            // Update input and color circle
            input.value = newColor.color_name;
            const newHex = `#${newColor.hex}`;
            colorCircle.style.backgroundColor = newHex;

            // Update appState
            const layerIndex = appState.currentLayers.findIndex(layer => layer.label === label);
            if (layerIndex !== -1) {
                appState.currentLayers[layerIndex].color = newColor.color_name;
                console.log(`✅ Updated ${label} to darker color: ${newColor.color_name}`);
            }

            // Re-render previews
            if (appState.isInFabricMode) {
                renderFabricMockup();
                updatePreview();
            } else {
                updatePreview();
                updateRoomMockup();
            }
            populateCoordinates();
        } else {
            console.log(`⚠️ No darker color found for ${currentColorName}`);
        }
    });

    // Lighter button click handler
    lighterButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering color circle click
        console.log(`🔼 Lighter button clicked for ${label}`);

        const currentColorName = input.value.trim();
        const newColor = findLighterDarkerSWColor(currentColorName, "lighter");

        if (newColor) {
            // Update input and color circle
            input.value = newColor.color_name;
            const newHex = `#${newColor.hex}`;
            colorCircle.style.backgroundColor = newHex;

            // Update appState
            const layerIndex = appState.currentLayers.findIndex(layer => layer.label === label);
            if (layerIndex !== -1) {
                appState.currentLayers[layerIndex].color = newColor.color_name;
                console.log(`✅ Updated ${label} to lighter color: ${newColor.color_name}`);
            }

            // Re-render previews
            if (appState.isInFabricMode) {
                renderFabricMockup();
                updatePreview();
            } else {
                updatePreview();
                updateRoomMockup();
            }
            populateCoordinates();
        } else {
            console.log(`⚠️ No lighter color found for ${currentColorName}`);
        }
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
  console.log("🎨 populateCuratedColors called with colors:", colors?.length);
  console.log("🔍 curatedColorsContainer element:", dom.curatedColorsContainer);

  if (!dom.curatedColorsContainer) {
    console.error("❌ curatedColorsContainer not found in DOM");
    console.log("🔍 Available DOM elements:", Object.keys(dom));
    return;
  }

  if (!colors || !colors.length) {
    console.warn("⚠️ No curated colors provided, colors array:", colors);
    return;
  }
  
  console.log("✅ About to populate", colors.length, "curated colors");

  dom.curatedColorsContainer.innerHTML = "";

  // 🎟️ Run The Ticket Button - Only show for ColorFlex patterns, not standard patterns
  const isStandardPattern = !appState.currentPattern?.layers || appState.currentPattern.layers.length === 0;
  if (!isStandardPattern) {
    const ticketCircle = document.createElement("div");
    ticketCircle.id = "runTheTicketCircle";
    ticketCircle.className = "curated-color-circle cursor-pointer border-2";
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
  }

  // 🎨 Add curated color swatches
  colors.forEach(label => {
    if (!Array.isArray(appState.colorsData)) {
      console.error("❌ appState.colorsData is not available or not an array");
      return;
    }

    console.log(`🔍 Finding curated color for label: "${label}"`);

    // Parse label to extract SW number and color name
    // Expected format: "SW6248 Cherries Jubilee" or "SC0001 Cottage Linen"
    const swMatch = label.match(/\b(SW|SC)(\d+)\b/i);
    const swNumber = swMatch ? `${swMatch[1].toUpperCase()}${swMatch[2]}` : null;

    // Extract color name (everything after SW/SC number)
    const colorNamePart = swNumber ? label.replace(/\b(SW|SC)\d+\s*/i, '').trim().toLowerCase() : label.toLowerCase().trim();

    console.log(`📋 Parsed: SW=${swNumber}, ColorName="${colorNamePart}"`);

    // Find by SW number first (most reliable), then by exact color name match
    const found = appState.colorsData.find(c => {
      if (!c) return false;

      // Match by SW number if available
      if (swNumber && c.sw_number?.toUpperCase() === swNumber) {
        return true;
      }

      // Match by exact color name (case-insensitive)
      if (c.color_name && c.color_name.toLowerCase() === colorNamePart) {
        return true;
      }

      return false;
    });

    if (!found) {
      console.error(`❌ No color found for curated label: "${label}"`);
      return;
    }

    if (!found.hex) {
      console.error(`❌ Missing hex for found color:`, found);
      return;
    }

    const hex = `#${found.hex}`;
    console.log(`✅ Curated color found: "${label}" -> ${found.sw_number} ${found.color_name} -> ${hex}`);

    const circle = document.createElement("div");
    circle.className = "curated-color-circle cursor-pointer";
    circle.style.backgroundColor = hex;
    circle.style.setProperty('background-color', hex, 'important');

    const text = document.createElement("span");
    text.className = `text-xs font-bold text-center ${getContrastClass(hex)}`;
    text.style.cssText = 'white-space: pre-line; display: block;';
    text.innerHTML = `${found.sw_number?.toUpperCase()}<br>${toInitialCaps(found.color_name)}`;

    circle.appendChild(text);
    circle.addEventListener("click", () => {
      const selectedLayer = appState.lastSelectedLayer;
      if (!selectedLayer) return alert("Please select a layer first.");

      selectedLayer.input.value = getCleanColorName(found.color_name);
      selectedLayer.circle.style.backgroundColor = hex;

      const i = appState.currentLayers.findIndex(l => l.label === selectedLayer.label);
      if (i !== -1) appState.currentLayers[i].color = found.color_name;

      const j = appState.layerInputs.findIndex(li => li.label === selectedLayer.label);
      if (j !== -1) {
        appState.layerInputs[j].input.value = getCleanColorName(found.color_name);
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
    const isFurnitureCollection = false; // Removed furniture logic
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

// ============================================================================
// SECTION 6: APP INITIALIZATION
// ============================================================================
// Main initialization flow: DOM validation, data loading, collection setup,
// URL parameter processing, event listeners, and auto-load pattern restoration.
// This is the entry point when the ColorFlex page loads.
// ============================================================================

async function initializeApp() {
    const initTimestamp = Date.now();
    console.log("🚀 Starting app...", initTimestamp);
    console.log("🔍 SessionStorage at app start:", sessionStorage.getItem('pendingDirectPatternLoad') ? 'EXISTS' : 'NULL');

    // 🧹 Clean up old cart thumbnails on app startup to prevent localStorage bloat
    cleanupOldCartThumbnails();

    // Validate DOM elements first
    validateDOMElements();
    
    // ✅ Step 1: Load Sherwin-Williams Colors
    await loadColors();
    console.log("✅ Colors loaded:", appState.colorsData.length);

    try {
        // ✅ Step 2: Load Collections
        // Check if data is embedded in window object (Shopify mode)
        let data;
        if (window.ColorFlexData && window.ColorFlexData.collections) {
            console.log("🎯 Using embedded ColorFlex data");
            data = { collections: window.ColorFlexData.collections };
        } else {
            console.log("📁 Loading collections from Shopify assets");
            const collectionsUrl = window.ColorFlexAssets?.collectionsUrl || "/assets/collections.json";
            const response = await fetch(collectionsUrl, { 
                method: 'GET',
                cache: "no-store",
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) throw new Error(`Failed to fetch collections: ${response.status}`);
            data = await response.json();
        }

        // ADD THIS DEBUG:
        console.log("🔍 Raw JSON collections loaded:", data.collections.length);
        const farmhouseCollection = data.collections.find(c => c && typeof c.name === 'string' && c.name === "farmhouse");
        console.log("🔍 Raw farmhouse collection:", farmhouseCollection);
        console.log("🔍 Raw farmhouse elements:", farmhouseCollection?.elements);


        if (!data.collections?.length) {
            console.error("X No collections found in collections.json");
            dom.collectionHeader.textContent = "No Collections Available";
            dom.preview.innerHTML = "<p>No collections available. Please run the data import script.</p>";
            return;
        }

        // Check if a specific collection is being requested via URL (e.g., from product page)
        // Declare these BEFORE the collections loading block so they're available throughout
        const urlParams = new URLSearchParams(window.location.search);
        const urlCollectionName = urlParams.get("collection")?.trim();
        const isDirectCollectionAccess = urlCollectionName && urlCollectionName.includes('.clo-');

        // ✅ Step 3: Save collections once
        if (!appState.collections.length) {
            // Filter out any invalid collections that might cause toLowerCase errors
            appState.collections = data.collections.filter(c =>
                c && typeof c === 'object' && typeof c.name === 'string'
            ).map(collection => {
                // Also filter out invalid patterns within each collection
                if (collection.patterns && Array.isArray(collection.patterns)) {
                    collection.patterns = collection.patterns.filter(p =>
                        p && typeof p === 'object' && (typeof p.name === 'string' || typeof p.id === 'string')
                    );
                }
                return collection;
            });

            // Count collections before filtering
            const totalCollections = appState.collections.length;

            // Filter collections based on mode
            const isClothingMode = window.COLORFLEX_MODE === 'CLOTHING';
            const isFurnitureMode = window.COLORFLEX_MODE === 'FURNITURE';

            if (isClothingMode) {
                // CLOTHING MODE: Show ONLY clothing collections
                appState.collections = appState.collections.filter(c => c.name.includes('.clo-'));
                console.log(`👕 CLOTHING MODE: Loaded ${appState.collections.length} clothing collections`);
            } else if (isFurnitureMode) {
                // FURNITURE MODE: Show only .fur- collections
                appState.collections = appState.collections.filter(c => c.name.includes('.fur-'));
                console.log(`🪑 FURNITURE MODE: Loaded ${appState.collections.length} furniture collections`);

                // Enable furniture mode flag
                appState.isInFurnitureMode = true;
                appState.selectedFurnitureType = 'furniture'; // Set default furniture type
                console.log(`🪑 FURNITURE MODE: Enabled (isInFurnitureMode = true, selectedFurnitureType = 'furniture')`);

                // Load furniture config
                await loadFurnitureConfig();
            } else {
                // WALLPAPER MODE (default): Filter out clothing/furniture collections
                if (!isDirectCollectionAccess) {
                    appState.collections = appState.collections.filter(c => !c.name.includes('.clo-') && !c.name.includes('.fur-'));
                    const specialCollections = totalCollections - appState.collections.length;
                    console.log(`✅ Collections loaded: ${appState.collections.length} public collections`);
                    if (specialCollections > 0) {
                        console.log(`🔒 Filtered out ${specialCollections} clothing/furniture collections (accessible via product pages only)`);
                    }
                } else {
                    console.log(`✅ Collections loaded: ${appState.collections.length} collections (including special collections via direct URL access)`);
                    console.log(`🎯 Direct collection access: ${urlCollectionName}`);
                }
            }
            console.log("🔍 First collection structure:", appState.collections[0]);

            // Expose collections data to window for collections modal
            window.collectionsData = appState.collections;
            console.log(`📤 Exposed ${appState.collections.length} collections to window.collectionsData`);
        }

        // ✅ Step 4: Select collection via Shopify integration, URL param, sessionStorage, or fallback
        // Note: urlCollectionName is already declared above for clothing filter logic

        // Check for auto-load pattern data using localStorage (more reliable than sessionStorage)
        let autoLoadCollectionName = null;
        let autoLoadPatternData = null;
        
        // Always check for auto-load pattern data in localStorage (more reliable)
        const autoLoadJson = localStorage.getItem('colorflexAutoLoad');
        console.log("🔍 DEBUG: Checking localStorage for colorflexAutoLoad");
        console.log("  Raw localStorage data:", autoLoadJson ? "EXISTS" : "NULL");
        console.log("  All localStorage keys:", Object.keys(localStorage));
        console.log("  Looking for any colorflex keys...");
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.toLowerCase().includes('colorflex')) {
                console.log(`    Found: ${key} = ${localStorage.getItem(key)?.substring(0, 100)}...`);
            }
        }
        
        if (autoLoadJson) {
            console.log("🎯 Auto-load pattern data found in localStorage");
            try {
                const data = JSON.parse(autoLoadJson);
                const pattern = data.pattern;
                const timestamp = data.timestamp;
                
                // Check if data is recent (within 5 minutes)
                const age = Date.now() - timestamp;
                if (age < 5 * 60 * 1000) {
                    autoLoadCollectionName = pattern.collectionName;
                    autoLoadPatternData = data;
                    console.log("🎯 Found valid auto-load pattern from localStorage:", pattern.patternName);
                    console.log("  Collection:", autoLoadCollectionName);
                    console.log("  Data age:", Math.round(age / 1000), "seconds");
                } else {
                    console.log("⏰ Auto-load data too old, ignoring");
                    localStorage.removeItem('colorflexAutoLoad');
                }
            } catch (error) {
                console.error("❌ Error parsing localStorage auto-load data:", error);
                localStorage.removeItem('colorflexAutoLoad');
            }
        } else {
            console.log("🔍 No auto-load pattern data found in localStorage");
        }

        // 🛒 Check for pending purchase pattern (from "Buy It" on non-ColorFlex pages)
        const pendingPurchaseJson = localStorage.getItem('pendingPurchasePattern');
        if (pendingPurchaseJson) {
            console.log("🛒 Pending purchase pattern found");
            try {
                const purchaseData = JSON.parse(pendingPurchaseJson);
                const timestamp = purchaseData.timestamp;
                const age = Date.now() - timestamp;

                // Check if data is recent (within 2 minutes)
                if (age < 2 * 60 * 1000) {
                    console.log("🛒 Processing pending purchase for:", purchaseData.patternName);
                    autoLoadCollectionName = purchaseData.collectionName;
                    autoLoadPatternData = {
                        pattern: purchaseData,
                        timestamp: timestamp
                    };
                    // Clear the pending purchase flag
                    localStorage.removeItem('pendingPurchasePattern');
                } else {
                    console.log("⏰ Pending purchase data too old, ignoring");
                    localStorage.removeItem('pendingPurchasePattern');
                }
            } catch (error) {
                console.error("❌ Error parsing pending purchase data:", error);
                localStorage.removeItem('pendingPurchasePattern');
            }
        }

        console.log("🔍 COLLECTION SELECTION DEBUG:");
        console.log("  URL collection param:", urlCollectionName);
        console.log("  Auto-load collection:", autoLoadCollectionName);
        console.log("  Shopify target collection:", window.appState?.selectedCollection);
        console.log("  Shopify target pattern:", window.appState?.targetPattern?.name);
        console.log("  Available collections:", appState.collections.map(c => c.name));
        console.log("  Total collections loaded:", appState.collections.length);
        
        // Priority 1: Use Shopify-detected collection (from product page integration)
        // Priority 2: Use URL collection parameter
        // Priority 3: Use auto-load collection (for saved pattern loading)
        // Priority 4: Use mode-specific default (clothing or furniture page)
        let modeDefaultCollection = null;
        if (window.COLORFLEX_MODE === 'CLOTHING') {
            modeDefaultCollection = window.CLOTHING_DEFAULT_COLLECTION || 'bombay.clo-1';
        } else if (window.COLORFLEX_MODE === 'FURNITURE') {
            modeDefaultCollection = window.FURNITURE_DEFAULT_COLLECTION || 'botanicals.fur-1';
        }

        let collectionName = window.appState?.selectedCollection?.name ||
                             urlCollectionName ||
                             autoLoadCollectionName ||
                             modeDefaultCollection;
        
        console.log("🔍 COLLECTION MATCHING DEBUG:");
        console.log("  Requested collection name:", collectionName);
        console.log("  Available collection names:", appState.collections.map(c => c.name));
        
        let selectedCollection = appState.collections.find(
            c => c && typeof c.name === 'string' && collectionName && typeof collectionName === 'string' && 
            c.name.trim().toLowerCase() === collectionName.toLowerCase()
        );
        
        if (!selectedCollection && collectionName) {
            console.error("❌ COLLECTION LOOKUP FAILED!");
            console.error("  Requested:", collectionName);
            console.error("  Available:", appState.collections.map(c => c.name));
            console.error("  First collection fallback:", appState.collections[0]?.name);
            
            // 🚨 CRITICAL FIX: Don't default to first collection if URL specified a collection
            // Only use fallback if no collection was requested
            if (!urlCollectionName) {
                selectedCollection = appState.collections[0];
                console.log("  Using first collection as fallback (no collection specified)");
            } else {
                console.error("  REFUSING to use fallback - user specified:", urlCollectionName);
                // Try a more flexible match
                selectedCollection = appState.collections.find(c => 
                    c && c.name && c.name.toLowerCase().includes(collectionName.toLowerCase())
                );
                if (selectedCollection) {
                    console.log("  Found partial match:", selectedCollection.name);
                } else {
                    console.error("  No matches found - using first collection as last resort");
                    selectedCollection = appState.collections[0];
                }
            }
        }
        
        console.log("  Selected collection source:", window.appState?.selectedCollection ? "Shopify" : "URL");
        console.log("  Final collection:", selectedCollection?.name);
        console.log("  Is fallback collection:", selectedCollection === appState.collections[0] ? "YES" : "NO");

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
            // Check if this is a clothing collection (has .clo- suffix)
            if (selectedCollection.name.includes('.clo-')) {
                // Extract collection name before the period (e.g., "botanicals" from "botanicals.clo-1")
                const collectionBaseName = selectedCollection.name.split('.')[0];
                // Format as: "BOTANICALS\nCLOTHING" (two lines)
                dom.collectionHeader.innerHTML = `${collectionBaseName.toUpperCase()}<br>CLOTHING`;
            } else {
                dom.collectionHeader.textContent = toInitialCaps(selectedCollection.name);
            }
        }

        // ✅ Step 7: Show curated color circles + ticket button
        populateCuratedColors(appState.curatedColors);

        // ✅ Step 8: Load target pattern or first pattern
        // Priority 1: Check URL pattern parameter
        // Priority 2: Check sessionStorage pattern (for saved pattern loading)
        let initialPattern = null;
        const urlPatternName = urlParams.get("pattern")?.trim();
        
        // Check for auto-load pattern (reuse the same data we parsed earlier)  
        let autoLoadPatternName = null;
        if (autoLoadPatternData) {
            autoLoadPatternName = autoLoadPatternData.pattern.patternName;
            console.log("🎯 Found pattern from auto-load data:", autoLoadPatternName);
        }
        
        // Use URL pattern name or auto-load pattern name
        const targetPatternName = urlPatternName || autoLoadPatternName;
        
        if (targetPatternName) {
            console.log("🎯 Looking for target pattern:", targetPatternName, urlPatternName ? "(from URL)" : "(from auto-load)");
            
            // First try to find pattern in selected collection (with normalization)
            const normalizedTargetPattern = targetPatternName.toLowerCase().replace(/[\s-]+/g, '-');
            initialPattern = selectedCollection.patterns.find(p => 
                p && typeof p === 'object' && typeof p.name === 'string' && (
                    p.name.toLowerCase().replace(/[\s-]+/g, '-') === normalizedTargetPattern ||
                    p.id === targetPatternName ||
                    p.name.toLowerCase() === targetPatternName.toLowerCase()
                )
            ) || selectedCollection.patterns.find(p => 
                p && typeof p === 'object' && typeof p.name === 'string' && (
                    p.name.toLowerCase().includes(targetPatternName.toLowerCase()) ||
                    targetPatternName.toLowerCase().includes(p.name.toLowerCase())
                )
            );
            
            // If pattern not found in selected collection, search all collections (DYNAMIC)
            if (!initialPattern) {
                console.log("🔍 Pattern not found in selected collection, searching all collections dynamically...");
                console.log(`🔍 Searching for pattern: "${targetPatternName}" across ${appState.collections.length} collections`);
                
                for (const collection of appState.collections) {
                    console.log(`  🔍 Checking collection: "${collection.name}" (${collection.patterns?.length || 0} patterns)`);
                    const foundPattern = collection.patterns?.find(p => {
                        if (!p || typeof p !== 'object') return false;
                        const patternName = (typeof p.name === 'string' ? p.name.toLowerCase().replace(/[\s-]+/g, '-') : '') || '';
                        const patternId = (typeof p.id === 'string' ? p.id.toLowerCase().replace(/[\s-]+/g, '-') : '') || '';
                        const searchName = targetPatternName.toLowerCase().replace(/[\s-]+/g, '-');
                        
                        console.log(`    🔍 Checking pattern: "${p.name}" -> normalized: "${patternName}" vs search: "${searchName}"`);
                        
                        // Exact matches first (normalized)
                        if (patternName === searchName || patternId === searchName) {
                            console.log(`    ✅ EXACT MATCH FOUND: "${p.name}" in collection "${collection.name}"`);
                            return true;
                        }
                        
                        // Partial matches
                        if (patternName.includes(searchName) || searchName.includes(patternName)) return true;
                        
                        // Handle special cases for known patterns
                        if (searchName === 'constantinople' && patternName.includes('constantinople')) return true;
                        if (searchName === 'istanbul' && patternName.includes('istanbul')) return true;
                        
                        return false;
                    });
                    
                    if (foundPattern) {
                        console.log(`🎯 FOUND: Pattern "${targetPatternName}" → "${foundPattern.name}" in collection "${collection.name}"`);
                        console.log(`🔄 Switching from collection "${selectedCollection.name}" to "${collection.name}"`);
                        
                        selectedCollection = collection;
                        appState.selectedCollection = selectedCollection;
                        appState.curatedColors = selectedCollection.curatedColors || [];
                        initialPattern = foundPattern;
                        
                        // Update UI to reflect correct collection
                        if (dom.collectionHeader) {
                            // Check if this is a clothing collection
                            if (selectedCollection.name.includes('.clo-')) {
                                const collectionBaseName = selectedCollection.name.split('.')[0];
                                dom.collectionHeader.innerHTML = `${collectionBaseName.toUpperCase()}<br>CLOTHING`;
                            } else {
                                dom.collectionHeader.textContent = toInitialCaps(selectedCollection.name);
                            }
                        }
                        populateCuratedColors(appState.curatedColors);
                        break;
                    }
                }
                
                if (!initialPattern) {
                    console.warn(`❌ Pattern "${urlPatternName}" not found in any collection`);
                }
            }
            console.log("🎯 Using URL pattern parameter:", urlPatternName, "→", initialPattern?.name, "in collection:", selectedCollection?.name);
        }
        
        // Priority 2: Use Shopify-detected target pattern
        if (!initialPattern && window.appState?.targetPattern) {
            initialPattern = selectedCollection.patterns.find(p =>
                p && typeof p === 'object' && (
                    p.slug === window.appState.targetPattern.slug ||
                    p.id === window.appState.targetPattern.id ||
                    p.name === window.appState.targetPattern.name
                )
            );
            console.log("🎯 Using Shopify target pattern:", initialPattern?.name);
        }
        
        // Priority 3: Use first pattern as fallback
        if (!initialPattern) {
            initialPattern = selectedCollection.patterns[0];
            console.log("📍 Using first pattern as fallback:", initialPattern?.name);
        }

        // Use slug for clothing patterns, id for regular patterns
        const initialPatternId = initialPattern?.slug || initialPattern?.id;
        if (initialPatternId) {
            // Check if auto-load has already completed to prevent override
            if (window.autoLoadPatternCompleted) {
                console.log('🔒 Skipping initial pattern load - auto-load already completed for:', window.autoLoadedPatternName);
            } else {
                loadPatternData(selectedCollection, initialPatternId);  // ✅ Fixed: pass collection

                // Apply URL parameters for colors and scale after pattern loading
                setTimeout(() => {
                    applyURLParameters(urlParams);
                }, 500);

                // Don't clear localStorage here - let auto-load handle it
                // The auto-load logic will clear localStorage after successful loading
                if (autoLoadPatternName) {
                    console.log('🔄 Initial pattern loaded from auto-load data, auto-load will complete the process');
                }
            }
        } else {
            console.warn("âš ï¸ No patterns found for", selectedCollection.name);
        }

        // ✅ Step 9: Load thumbnails + setup print
        populatePatternThumbnails(selectedCollection.patterns);
        setupPrintListener();

        isAppReady = true;
        console.log("✅ App is now fully ready.");
        
        // Check for auto-load pattern from saved patterns modal
        if (autoLoadPatternData) {
            console.log('🔍 Found pattern for auto-loading from saved patterns modal');
            try {
                const pattern = autoLoadPatternData.pattern;
                console.log('🎨 Auto-loading saved pattern using loadSavedPatternToUI:', pattern.patternName);
                
                // Wait for app to be fully ready before auto-loading
                function waitForAppAndAutoLoad() {
                    console.log('⏳ Checking if app is ready for auto-loading...');
                    console.log('  layerInputs length:', appState.layerInputs?.length);
                    console.log('  currentLayers length:', appState.currentLayers?.length);
                    console.log('  currentPattern loaded:', !!appState.currentPattern);
                    console.log('  loadSavedPatternToUI available:', !!window.loadSavedPatternToUI);
                    
                    // More robust readiness check - ensure we have UI and the function available
                    if (appState.layerInputs && appState.layerInputs.length > 0 && 
                        appState.currentLayers && appState.currentLayers.length > 0 &&
                        appState.currentPattern && 
                        window.loadSavedPatternToUI) {
                        console.log('✅ App fully ready - auto-loading saved pattern');
                        
                        // Use the same method that works perfectly in ColorFlex page
                        loadSavedPatternToUI(pattern);

                        // Set flag to prevent other initialization from overriding this pattern
                        window.autoLoadPatternCompleted = true;
                        window.autoLoadedPatternName = pattern.patternName;

                        // 🛒 If this pattern came from "Buy It" button, auto-trigger material modal
                        if (pattern.triggerPurchase) {
                            console.log('🛒 Auto-triggering material selection modal for purchase');
                            setTimeout(() => {
                                if (window.showMaterialSelectionModal) {
                                    showMaterialSelectionModal(pattern);
                                } else {
                                    console.error('❌ Material selection modal not available');
                                }
                            }, 500); // Small delay to ensure pattern is fully loaded
                        }

                        // Clean up after successful loading
                        localStorage.removeItem('colorflexAutoLoad');
                        console.log('🧹 Cleaned up auto-load data from localStorage');
                        console.log('🔒 Set protection flag to prevent pattern override');
                    } else {
                        console.log('⏳ App not ready yet, waiting...');
                        setTimeout(waitForAppAndAutoLoad, 300);
                    }
                }
                
                // Start checking after app initialization is complete
                // Use longer delay to ensure all other initialization completes first
                setTimeout(waitForAppAndAutoLoad, 2000); // Longer delay to prevent race conditions
            } catch (error) {
                console.error('❌ Error auto-loading pattern:', error);
                localStorage.removeItem('colorflexAutoLoad');
            }
        }

        function initializeInteractiveZoom() {
            // Set up interactive zoom when app is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', addInteractiveZoom);
            } else {
                addInteractiveZoom();
            }
        }
        // Call this when collections are loaded
        initializeInteractiveZoom();  // ← Add this line right here
        initializeTryFurnitureFeature();

        console.log("Current state during app init:");
console.log("  furnitureConfig loaded:", !!furnitureConfig);
console.log("  appState.selectedCollection:", !!appState.selectedCollection);
console.log("  appState.collections:", !!appState.collections?.length);
console.log("  DOM ready:", document.readyState);



    } catch (error) {
        console.error("X Error loading collections:", error);
        dom.collectionHeader.textContent = "Error Loading Collection";
        dom.preview.innerHTML = "<p>Error loading data. Please try refreshing.</p>";
    }
}

// Apply URL parameters for colors and scale
function applyURLParameters(urlParams) {
    console.log('🔗 Applying URL parameters...');

    // Apply custom colors from URL
    const urlColors = urlParams.get('colors');
    if (urlColors) {
        console.log('🎨 Applying colors from URL:', urlColors);
        try {
            const decodedColors = decodeURIComponent(urlColors);
            const colorList = decodedColors.split(',').map(color => color.trim());

            // Apply colors to current layers
            if (appState.currentLayers && colorList.length > 0) {
                colorList.forEach((colorName, index) => {
                    if (appState.currentLayers[index]) {
                        appState.currentLayers[index].color = colorName;
                        console.log(`🎨 Applied color ${index + 1}: ${colorName}`);
                    }
                });

                // Update UI and preview
                populateLayerInputs(appState.currentPattern);
                updatePreview();
                updateRoomMockup();
            }
        } catch (error) {
            console.error('❌ Error applying URL colors:', error);
        }
    }

    // Apply pattern scale from URL
    const urlScale = urlParams.get('scale');
    if (urlScale) {
        console.log('📏 Applying scale from URL:', urlScale);
        try {
            const scaleValue = parseInt(urlScale);
            if (scaleValue && scaleValue > 0 && scaleValue <= 400) {
                appState.currentScale = scaleValue;

                // Update scale UI if it exists
                const scaleButtons = document.querySelectorAll('[data-multiplier]');
                scaleButtons.forEach(button => {
                    const multiplier = parseFloat(button.dataset.multiplier);
                    const calculatedScale = Math.round(100 * multiplier);
                    if (calculatedScale === scaleValue) {
                        // Remove active class from all buttons
                        scaleButtons.forEach(btn => btn.classList.remove('scale-button-active'));
                        // Add active class to matching button
                        button.classList.add('scale-button-active');
                    }
                });

                // Update preview with new scale
                updatePreview();
                updateRoomMockup();
                console.log(`📏 Applied scale: ${scaleValue}%`);
            }
        } catch (error) {
            console.error('❌ Error applying URL scale:', error);
        }
    }

    // Apply scaleMultiplier from URL
    const urlScaleMultiplier = urlParams.get('scaleMultiplier');
    if (urlScaleMultiplier) {
        console.log('📏 Applying scaleMultiplier from URL:', urlScaleMultiplier);
        try {
            const multiplierValue = parseFloat(urlScaleMultiplier);
            if (multiplierValue && multiplierValue > 0) {
                appState.scaleMultiplier = multiplierValue;

                // Use setPatternScale to highlight the correct button
                if (typeof window.setPatternScale === 'function') {
                    console.log('🎯 Highlighting scale button for URL multiplier:', multiplierValue);
                    window.setPatternScale(multiplierValue);
                } else {
                    console.warn('⚠️ setPatternScale function not available for URL parameter');
                }

                console.log(`📏 Applied scaleMultiplier: ${multiplierValue}`);
            }
        } catch (error) {
            console.error('❌ Error applying URL scaleMultiplier:', error);
        }
    }

    // 🛒 Cart color restoration - handle saved patterns from cart links
    const sourceParam = urlParams.get("source");
    const savedLayersParam = urlParams.get("saved_layers");
    const savedPatternId = urlParams.get("saved_pattern_id");

    if ((savedLayersParam || urlColors) && sourceParam === 'cart_saved_pattern') {
        console.log('🎨 Restoring saved colors from cart URL parameters...');
        console.log('  Source:', sourceParam);
        console.log('  Saved pattern ID:', savedPatternId);

        // Delay color restoration to ensure UI is ready
        setTimeout(() => {
            restoreCartColors(savedLayersParam, urlColors);
        }, 1000);
    }

    console.log('✅ URL parameters applied');
}

/**
 * Restore colors from cart link navigation
 */
function restoreCartColors(savedLayersParam, urlColors) {
    console.log('🎨 restoreCartColors called with:');
    console.log('  savedLayersParam:', savedLayersParam);
    console.log('  urlColors:', urlColors);

    try {
        let colorsToApply = [];

        // Try to parse saved layers first (more complete data)
        if (savedLayersParam) {
            const savedLayers = JSON.parse(savedLayersParam);
            console.log('  Parsed saved layers:', savedLayers);

            colorsToApply = savedLayers.map(layer => ({
                color: layer.color,
                label: layer.label || `Layer ${layer.index + 1}`
            }));
        } else if (urlColors) {
            // Fallback to URL colors
            const colorArray = urlColors.split(',').map(c => c.trim());
            colorsToApply = colorArray.map((color, index) => ({
                color: color,
                label: `Layer ${index + 1}`
            }));
        }

        if (colorsToApply.length === 0) {
            console.log('⚠️ No colors to restore');
            return;
        }

        console.log(`🎨 Applying ${colorsToApply.length} colors from cart:`, colorsToApply);

        // Wait for layer inputs to be available
        const checkForInputs = () => {
            const layerInputs = document.querySelectorAll('.layer-input-container input[type="text"]');
            console.log(`🔍 Found ${layerInputs.length} layer inputs`);

            if (layerInputs.length === 0) {
                console.log('⏳ Layer inputs not ready, retrying...');
                setTimeout(checkForInputs, 500);
                return;
            }

            // Apply colors to layer inputs
            layerInputs.forEach((input, index) => {
                if (index < colorsToApply.length) {
                    const colorToApply = colorsToApply[index];
                    console.log(`🎨 Setting layer ${index + 1} to:`, colorToApply.color);

                    input.value = colorToApply.color;

                    // Trigger change event to update color processing
                    const changeEvent = new Event('change', { bubbles: true });
                    input.dispatchEvent(changeEvent);

                    // Also trigger input event for real-time updates
                    const inputEvent = new Event('input', { bubbles: true });
                    input.dispatchEvent(inputEvent);
                }
            });

            // Update previews after a short delay
            setTimeout(() => {
                console.log('🎨 Updating previews after cart color restoration');
                updatePreview();
                updateRoomMockup();
            }, 500);

            console.log('✅ Cart color restoration completed');
        };

        checkForInputs();

    } catch (error) {
        console.error('❌ Error restoring cart colors:', error);
    }
}

// Ensure appState has a default
appState._selectedCollection = null;

// Check if we're on the ColorFlex app page
function isColorFlexAppPage() {
    return document.getElementById('colorflex-app') || window.location.pathname.includes('/colorflex');
}

// Run on initial load and refresh
window.addEventListener('load', () => {
    initializeApp().catch(error => console.error("Initialization failed:", error));
});

window.addEventListener('popstate', () => {
    initializeApp().catch(error => console.error("Refresh initialization failed:", error));
});

// Lazy loading observer for thumbnails
let thumbnailObserver = null;

/**
 * Initialize Intersection Observer for lazy loading thumbnails
 */
function initThumbnailLazyLoading() {
    if (thumbnailObserver) return; // Already initialized

    thumbnailObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const dataSrc = img.dataset.src;

                if (dataSrc && !img.src.includes(dataSrc)) {
                    console.log(`👁️ Lazy loading thumbnail: ${dataSrc.split('/').pop()}`);
                    img.src = dataSrc;
                    img.removeAttribute('data-src');
                    thumbnailObserver.unobserve(img);
                }
            }
        });
    }, {
        root: null, // Use viewport as root
        rootMargin: '100px', // Start loading 100px before image enters viewport
        threshold: 0.01
    });

    console.log('👁️ Thumbnail lazy loading initialized');
}

// Populate pattern thumbnails in sidebar with lazy loading
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
        if (!str || typeof str !== 'string') {
            return '';
        }
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

    // Initialize lazy loading observer
    initThumbnailLazyLoading();

    dom.collectionThumbnails.innerHTML = "";
    console.log("Cleared existing thumbnails");

    validPatterns.forEach((pattern, index) => {
        console.log("Processing pattern:", pattern);
        pattern.displayName = cleanPatternName(pattern.name);
        const thumb = document.createElement("div");
        thumb.className = "thumbnail cursor-pointer border-1 border-transparent";
        // Prioritize slug for clothing collections, fall back to id, then name-based ID
        thumb.dataset.patternId = pattern.slug || pattern.id || (typeof pattern.name === 'string' ? pattern.name.toLowerCase().replace(/\s+/g, '-') : 'unknown-pattern');
        thumb.style.width = "120px";
        thumb.style.boxSizing = "border-box";

        const img = document.createElement("img");

        // Lazy loading: Load first 3 thumbnails immediately, rest on scroll
        const thumbnailUrl = normalizePath(pattern.thumbnail) || "https://so-animation.com/colorflex/data/collections/fallback.jpg";

        if (index < 3) {
            // Load first 3 immediately for instant display
            img.src = thumbnailUrl;
            console.log(`⚡ Eager loading thumbnail ${index + 1}: ${thumbnailUrl.split('/').pop()}`);
        } else {
            // Lazy load the rest
            img.dataset.src = thumbnailUrl;
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"%3E%3Crect fill="%23e0e0e0" width="120" height="120"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="12" fill="%23999"%3ELoading...%3C/text%3E%3C/svg%3E';
            thumbnailObserver.observe(img);
        }

        img.alt = pattern.displayName;
        img.className = "w-full h-auto";
        img.onerror = () => {
            console.warn(`Failed to load thumbnail for ${pattern.displayName}: ${img.src}`);
            if (img.src !== "https://so-animation.com/colorflex/data/collections/fallback.jpg") {
                img.src = "https://so-animation.com/colorflex/data/collections/fallback.jpg";
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
        const collectionName = appState.selectedCollection?.name || "Unknown";
        // Check if this is a clothing collection
        if (collectionName.includes('.clo-')) {
            const collectionBaseName = collectionName.split('.')[0];
            dom.collectionHeader.innerHTML = `${collectionBaseName.toUpperCase()}<br>CLOTHING`;
            console.log("Updated collectionHeader (clothing):", collectionBaseName.toUpperCase(), "CLOTHING");
        } else {
            dom.collectionHeader.textContent = toInitialCaps(collectionName);
            console.log("Updated collectionHeader:", dom.collectionHeader.textContent);
        }
    }
}

// Populate coordinates thumbnails in #coordinatesContainer
const populateCoordinates = () => {
    // Skip coordinates entirely in clothing mode
    if (appState.isInFabricMode) {
        return;
    }

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
        const normalizedPath = normalizePath(coord.path);
        console.log(`🔍 Coordinate path: "${coord.path}" → normalized: "${normalizedPath}"`);
        img.src = normalizedPath || "https://so-animation.com/colorflex/data/collections/default-coordinate.jpg";
        img.alt = coord.pattern || `Coordinate ${index + 1}`;
        img.className = "coordinate-image";
        img.dataset.filename = coord.path || "fallback";
        
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

    // ⚡ PERFORMANCE: Early exit for standard patterns (no layers)
    const isStandardPattern = !pattern.layers || pattern.layers.length === 0;
    if (isStandardPattern) {
      // Clear and hide layer controls
      if (dom.layerInputsContainer) {
        dom.layerInputsContainer.innerHTML = "";
        dom.layerInputsContainer.style.display = 'block';
      }

      // Hide the "Color Layers" heading
      const colorLayersHeading = document.getElementById('colorLayersHeading');
      if (colorLayersHeading) {
        colorLayersHeading.style.display = 'none';
      }

      // Check if display-only collection (optional future logic placeholder)
      const displayOnlyCollections = ['abundance', 'galleria', 'dished-up', 'pages', 'ancient-tiles'];
      const isDisplayOnly = displayOnlyCollections.includes(appState.selectedCollection?.name);

      if (!isDisplayOnly) {
        // Future: could add UI elements for non-display-only standard patterns here
        
        // if (dom.layerInputsContainer) {
        //   dom.layerInputsContainer.innerHTML = `
        //     <div style="
        //       display: flex;
        //       gap: 20px;
        //       margin: 20px 0;
        //     ">
        //       <div style="
        //         flex: 1;
        //         text-align: center; 
        //         padding: 20px; 
        //         color: #718096; 
        //         font-style: italic;
        //         background: rgba(255,255,255,0.05);
        //         border-radius: 8px;
        //       ">
        //         No layers for this pattern - this is a full color design.
        //       </div>
        //       <div style="
        //         flex: 1;
        //         text-align: center; 
        //         padding: 20px; 
        //         color: #718096; 
        //         font-style: italic;
        //         background: rgba(255,255,255,0.05);
        //         border-radius: 8px;
        //       ">
        //         You can customize the scaling by clicking on the buttons below the room mockup.
        //       </div>
        //     </div>
        //   `;
        //   dom.layerInputsContainer.style.display = 'block';
        // }
      }

      // Set up minimal state (but DON'T render yet - let loadPatternData render after scale restoration)
      handlePatternSelection(pattern.name, appState.colorsLocked);
      // REMOVED: updatePreview() and updateRoomMockup() calls here
      // These will be called by loadPatternData() after scale restoration
      console.log('⏭️  Standard pattern: Skipping preview render (will render after scale restoration)');
      return; // Skip complex UI creation for ColorFlex patterns
    }
    
    // Show layer inputs container and heading for patterns with layers
    if (dom.layerInputsContainer) {
      dom.layerInputsContainer.style.display = '';
    }
    
    // Show "Color Layers" heading only for ColorFlex patterns (not standard patterns)
    const colorLayersHeading = document.getElementById('colorLayersHeading');
    if (colorLayersHeading) {
      const isStandardPattern = !pattern.layers || pattern.layers.length === 0;
      colorLayersHeading.style.display = isStandardPattern ? 'none' : '';
      console.log(`📋 Color Layers heading: ${isStandardPattern ? 'hidden' : 'shown'} for pattern type`);
    }

    // Pass true for preserveColors if color lock is enabled
    handlePatternSelection(pattern.name, appState.colorsLocked);
    appState.layerInputs = [];
    appState.currentLayers = [];

    if (!dom.layerInputsContainer) {
      console.error("❌ layerInputsContainer not found in DOM");
      console.log("🔍 Available DOM elements:", Object.keys(dom));
      return;
    }
    
    console.log("✅ layerInputsContainer found:", dom.layerInputsContainer);

    const designerColors = pattern.designer_colors || [];
    const curatedColors = appState.selectedCollection?.curatedColors || [];
    
    // Use curated colors as fallback if no designer colors
    const effectiveColors = designerColors.length > 0 ? designerColors : curatedColors;
    console.log("🎨 COLOR FALLBACK DEBUG:");
    console.log("  - designerColors:", designerColors.length, designerColors);
    console.log("  - curatedColors:", curatedColors.length, curatedColors);
    console.log("  - effectiveColors:", effectiveColors.length, effectiveColors);

    // Get all layers (including shadows)
    const allLayers = buildLayerModel(
      pattern,
      effectiveColors,
      {
        isWallPanel: appState.selectedCollection?.name === "wall-panels",
        tintWhite: appState.tintWhite || false
      }
    );

    // Store all layers in currentLayers
    appState.currentLayers = allLayers;
    dom.layerInputsContainer.innerHTML = "";

    if (isStandardPattern) {
      // For standard patterns, hide the color controls container and don't create inputs
      if (dom.layerInputsContainer) {
        dom.layerInputsContainer.style.display = 'none';
      }
      appState.layerInputs = [];
      console.log("📋 Color controls hidden for standard pattern:", pattern.name);
    } else {
      // For ColorFlex patterns, show the color controls container and create inputs
      if (dom.layerInputsContainer) {
        dom.layerInputsContainer.style.display = '';
      }
      
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
    
    } // End of ColorFlex pattern handling
    
    // Add save button after pattern layers are populated
    addSaveButton();
    
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

// ============================================================================
// SECTION 7: PATTERN SELECTION & LAYER BUILDING
// ============================================================================
// Pattern click handling, layer model construction, color application.
// Includes scale persistence and color lock integration.
// ============================================================================

function handlePatternSelection(patternName, preserveColors = false) {
    // Check if colors are locked - if so, force preserveColors to true
    if (appState.colorsLocked) {
        preserveColors = true;
        console.log('🔒 Color lock enabled - preserving current color selections');
    }

    console.log(`handlePatternSelection: pattern=${patternName}, lockedCollection=${appState.lockedCollection}, currentCollection=${appState.selectedCollection?.name}`);
    const pattern = appState.selectedCollection.patterns.find(
        p => p.name.toUpperCase() === patternName.toUpperCase()
    ) || appState.selectedCollection.patterns[0];
    if (!pattern) {
        console.error(`Pattern ${patternName} not found in selected collection`);
        return;
    }
    appState.currentPattern = pattern;

    // ⚡ PERFORMANCE: Early exit for standard patterns - skip all color/layer setup
    const isStandardPattern = !pattern.layers || pattern.layers.length === 0;
    if (isStandardPattern) {
        // Standard patterns don't need layer management, just set minimal state
        appState.currentLayers = [{
            imageUrl: null,
            color: "#FFFFFF",
            label: "Background",
            isShadow: false
        }];
        return; // Exit early - no color/layer processing needed
    }

    const designerColors = appState.currentPattern.designer_colors || [];
    const curatedColors = appState.selectedCollection.curatedColors || [];
    const colorSource = designerColors.length > 0 ? designerColors : curatedColors;

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
    console.log("DEBUG: currentLayers[0]?.color =", appState.currentLayers[0]?.color);
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

    // ⚡ PERFORMANCE: Preload adjacent patterns for instant switching
    preloadAdjacentPatterns(pattern);
}

/**
 * Preload images for adjacent patterns (prev/next in collection)
 * Makes pattern switching feel instant
 *
 * @param {object} currentPattern - Currently selected pattern
 */
function preloadAdjacentPatterns(currentPattern) {
    if (!appState.selectedCollection || !appState.selectedCollection.patterns) {
        return;
    }

    const patterns = appState.selectedCollection.patterns;
    const currentIndex = patterns.findIndex(p => p.name === currentPattern.name);

    if (currentIndex === -1) return;

    const urlsToPreload = [];

    // Get previous pattern (or wrap to end)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : patterns.length - 1;
    const prevPattern = patterns[prevIndex];

    // Get next pattern (or wrap to start)
    const nextIndex = currentIndex < patterns.length - 1 ? currentIndex + 1 : 0;
    const nextPattern = patterns[nextIndex];

    // Collect all image URLs from adjacent patterns
    [prevPattern, nextPattern].forEach(pattern => {
        if (!pattern) return;

        // Add thumbnail
        if (pattern.thumbnail) {
            urlsToPreload.push(pattern.thumbnail);
        }

        // Add layer images (for ColorFlex patterns)
        if (pattern.layers && Array.isArray(pattern.layers)) {
            pattern.layers.forEach(layer => {
                const layerPath = typeof layer === 'string' ? layer : layer.path;
                if (layerPath) {
                    urlsToPreload.push(layerPath);
                }
            });
        }
    });

    if (urlsToPreload.length > 0) {
        console.log(`🔄 Preloading ${urlsToPreload.length} images from adjacent patterns (${prevPattern.name}, ${nextPattern.name})`);
        preloadImages(urlsToPreload);
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
        layer.input.value = getCleanColorName(color);
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
    console.log("🎯 highlightActiveLayer called for circle:", circle.id);
    document.querySelectorAll(".circle-input").forEach((c) => {
        c.style.outline = "none";
        c.style.setProperty('outline', 'none', 'important');
    });
    circle.style.outline = "6px solid rgb(244, 255, 219)";
    circle.style.setProperty('outline', '6px solid rgb(244, 255, 219)', 'important');
    console.log("✅ Active layer highlighted:", circle.id, "outline:", circle.style.outline);
};


/**
 * =============================================================================
 * SECTION 5: PATTERN PROCESSING ENGINE
 * =============================================================================
 * 
 * This section handles the core image processing functionality including:
 * - Pattern layer color application and tinting
 * - Image normalization and gamma correction
 * - Shadow and transparency processing  
 * - Canvas-based pixel manipulation
 * - Real-time pattern rendering and updates
 */

/**
 * Main image processing function - applies colors and effects to pattern layers
 * 
 * This is the core function that takes a pattern image and applies color tinting,
 * shadow effects, and other transformations to create the final rendered pattern.
 * 
 * PROCESSING PIPELINE:
 * 1. Normalize and load the image URL
 * 2. Apply color tinting based on layerColor parameter
 * 3. Handle special cases (shadows, walls, panels)
 * 4. Process pixels with normalization or binary thresholding
 * 5. Apply gamma correction and output to callback
 * 
 * @param {string} url - Image URL to process
 * @param {Function} callback - Callback function receiving processed canvas
 * @param {string} layerColor - Hex color to apply to the pattern (#7f817e default)
 * @param {number} gamma - Gamma correction value (2.2 default)
 * @param {boolean} isShadow - Whether this layer represents a shadow
 * @param {boolean} isWallPanel - Whether this is a wall panel layer  
 * @param {boolean} isWall - Whether this is a solid wall color
 */
let processImage = (
  url,
  callback,
  layerColor = '#7f817e',
  gamma = 2.2,
  isShadow = false,
  isWallPanel = false,
  isWall = false
) => {
  const normalizedUrl = normalizePath(url);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  // ⚠️ CRITICAL FIX: Removed ?t=${Date.now()} timestamp to allow browser caching
  // The timestamp was causing duplicate downloads of the same image (4x downloads!)
  // Browser cache + imageCache system will handle cache management properly
  img.src = normalizedUrl;

  img.onload = () => {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    const canvas = document.createElement("canvas");
    canvas.width = w;            // tile-sized; no DPR scaling here
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Solid wall fast-path unchanged (keeps your behavior)
    if (isWall && (!url || url === "")) {
      ctx.clearRect(0, 0, w, h);
      callback(canvas);
      return;
    }

    ctx.drawImage(img, 0, 0, w, h);

    if (isShadow) {
      // Shadow from luminance (gamma-correct-ish)
      let id;
      try { id = ctx.getImageData(0, 0, w, h); }
      catch (e) { callback(canvas); return; }
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const sr=d[i]/255, sg=d[i+1]/255, sb=d[i+2]/255;
        const lr = sr<=0.04045 ? sr/12.92 : Math.pow((sr+0.055)/1.055,2.4);
        const lg = sg<=0.04045 ? sg/12.92 : Math.pow((sg+0.055)/1.055,2.4);
        const lb = sb<=0.04045 ? sb/12.92 : Math.pow((sb+0.055)/1.055,2.4);
        const Y = 0.2126*lr + 0.7152*lg + 0.0722*lb;
        d[i]=0; d[i+1]=0; d[i+2]=0; d[i+3]=Math.round((1 - Math.min(1, Y))*255);
      }
      ctx.putImageData(id, 0, 0);
      callback(canvas);
      return;
    }

    if (!layerColor) { callback(canvas); return; }

    // --- White->transparent soft mask, then recolor ---
    // (This preserves anti-aliased edges and makes the tile repeat cleanly.)
    let id;
    try { id = ctx.getImageData(0, 0, w, h); }
    catch (e) { callback(canvas); return; }
    const d = id.data;

    // thresholds in linear space: t0 ~ start fading whites; t1 ~ full ink
    const t0 = 0.80; // near-white
    const t1 = 0.30; // darker = fully opaque
    const smoothstep = (x) => (x<=0?0 : x>=1?1 : x*x*(3-2*x));

    for (let i = 0; i < d.length; i += 4) {
      const sr=d[i]/255, sg=d[i+1]/255, sb=d[i+2]/255;
      const lr = sr<=0.04045 ? sr/12.92 : Math.pow((sr+0.055)/1.055,2.4);
      const lg = sg<=0.04045 ? sg/12.92 : Math.pow((sg+0.055)/1.055,2.4);
      const lb = sb<=0.04045 ? sb/12.92 : Math.pow((sb+0.055)/1.055,2.4);
      const L = 0.2126*lr + 0.7152*lg + 0.0722*lb;

      // mask: 0 at white (>=t0), 1 at ink (<=t1), smooth in-between
      const x = (t0 - L) / (t0 - t1);
      const m = smoothstep(Math.max(0, Math.min(1, x)));
      d[i+3] = Math.round(255 * m);   // keep RGB; alpha becomes the mask
    }
    ctx.putImageData(id, 0, 0);

    // Recolor using compositing over the new soft mask
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = layerColor;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";

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
async function loadPatternData(collection, patternId) {
    console.log(`loadPatternData: patternId=${patternId}`);

    // Check both slug and id for backwards compatibility
    const pattern = collection.patterns.find(p => p.slug === patternId || p.id === patternId);
        
    if (pattern) {
        console.log(`✅ Found pattern "${pattern.name}" (ID: ${pattern.id}) in collection "${collection.name}"`);
        appState.currentPattern = pattern;

        // ===== INSERT DEBUG LOGS HERE =====
        console.log("🔍 SOURCE DATA DEBUG:");
        console.log("  Current pattern:", appState.currentPattern?.name);
        console.log("  Designer colors:", appState.currentPattern?.designer_colors);
        console.log("  Layer labels:", appState.currentPattern?.layerLabels);
        console.log("  Layers array:", appState.currentPattern?.layers?.map((l, i) => `${i}: ${l.path?.split('/').pop()}`));

        // Check if this is a clothing collection (needs fabric mode)
        const isClothingCollection = appState.selectedCollection?.name?.includes('.clo-');

        if (isClothingCollection) {
            appState.isInFabricMode = true;
            console.log(`✅ Auto-enabled fabric mode for clothing collection: ${appState.selectedCollection?.name}`);

            // Modify UI for clothing collections
            console.log(`👗 Applying clothing collection UI modifications...`);

            // Hide scale controls
            const scaleControls = document.getElementById('scaleControls');
            if (scaleControls) {
                scaleControls.style.display = 'none';
                console.log('✅ Hidden scale controls');
            }

            // Hide scale description text
            const scaleDescription = scaleControls?.nextElementSibling;
            if (scaleDescription && scaleDescription.tagName === 'P') {
                scaleDescription.style.display = 'none';
                console.log('✅ Hidden scale description');
            }

            // Hide coordinates section - check ALL h3 elements
            const allHeadings = document.querySelectorAll('h3');
            allHeadings.forEach(heading => {
                if (heading.textContent.includes('Matching Coordinates')) {
                    heading.style.display = 'none';
                    console.log('✅ Hidden coordinates heading');
                }
            });

            const coordinatesContainer = document.getElementById('coordinatesContainer');
            if (coordinatesContainer) {
                coordinatesContainer.style.display = 'none';
                // Also hide the parent div that contains both heading and container
                if (coordinatesContainer.parentElement) {
                    coordinatesContainer.parentElement.style.display = 'none';
                }
                console.log('✅ Hidden coordinates container and parent');
            }

            // No scaling for clothing - just set canvas size
            // Removed clothingRenderScale - all layers drawn at canvas size for simplicity

            // Change heading from "Room Mockup Preview" to "Clothing Mockup Preview"
            const allH3s = document.querySelectorAll('h3');
            allH3s.forEach(heading => {
                if (heading.textContent.includes('Room Mockup')) {
                    heading.textContent = 'Clothing Mockup Preview';
                    console.log('✅ Changed heading to "Clothing Mockup Preview"');
                }
            });

            // Create viewport window: canvas renders at full 4K, div crops to 600×700
            // This lets user see full-quality render without scaling, just cropped
            // Use setProperty with !important to override inline styles from Liquid template
            const roomMockupDiv = document.getElementById('roomMockup');
            if (roomMockupDiv) {
                roomMockupDiv.style.setProperty('width', '600px', 'important');
                roomMockupDiv.style.setProperty('height', '700px', 'important');
                roomMockupDiv.style.setProperty('overflow', 'hidden', 'important');  // Crop, don't scale
                roomMockupDiv.style.setProperty('position', 'relative', 'important');
                roomMockupDiv.style.setProperty('background-color', 'white', 'important');  // White background for zoomed out view
                roomMockupDiv.style.setProperty('display', 'flex', 'important');  // Center canvas when zoomed
                roomMockupDiv.style.setProperty('align-items', 'center', 'important');
                roomMockupDiv.style.setProperty('justify-content', 'center', 'important');
                console.log('✅ Set viewport window: 600×700 with overflow:hidden (crops 4K canvas)');
            }

            // Ensure canvas itself has NO size constraints - renders at native 4K
            const canvasElement = roomMockupDiv?.querySelector('canvas');
            if (canvasElement) {
                canvasElement.style.setProperty('width', 'auto', 'important');
                canvasElement.style.setProperty('height', 'auto', 'important');
                canvasElement.style.setProperty('max-width', 'none', 'important');
                canvasElement.style.setProperty('max-height', 'none', 'important');
                console.log('✅ Canvas will render at full 4K resolution (not scaled)');
            }

            // Add zoom controls for clothing mockup
            if (roomMockupDiv && !document.getElementById('clothingZoomControls')) {
                const zoomControls = document.createElement('div');
                zoomControls.id = 'clothingZoomControls';
                zoomControls.style.cssText = `
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    display: flex;
                    gap: 8px;
                    z-index: 1000;
                `;

                // Utility for zoom control
                const createZoomButton = (label, title, direction) => {
                    const button = document.createElement('button');
                    button.innerHTML = label;
                    button.title = title;
                    button.style.cssText = `
                        background: rgba(110, 110, 110, 0.9);
                        color: #000000ff;
                        border: 2px solid #d4af37;
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        transition: all 0.3s ease;
                    `;

                    let intervalId;

                    const updateZoom = () => {
                        const canvas = roomMockupDiv.querySelector('canvas');
                        if (canvas) {
                            let currentScale = parseFloat(canvas.dataset.zoomScale || '1.0');
                            const step = 0.01;
                            const minScale = 0.25;
                            const maxScale = 2.0;

                            if (direction === 'in') {
                                currentScale = Math.min(maxScale, currentScale + step);
                            } else {
                                currentScale = Math.max(minScale, currentScale - step);
                            }

                            canvas.dataset.zoomScale = currentScale.toFixed(2);
                            appState.savedZoomScale = currentScale; // Save to appState for persistence
                            canvas.style.setProperty('transform', `scale(${currentScale})`, 'important');
                            canvas.style.setProperty('transform-origin', 'center', 'important');
                            console.log(`🔍 Zoom ${direction}: ${currentScale * 100}%`);
                        }
                    };

                    // Hold-to-zoom behavior
                    button.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                        updateZoom();
                        intervalId = setInterval(updateZoom, 50); // Smooth update every 50ms
                    });

                    ['mouseup', 'mouseleave'].forEach(event =>
                        button.addEventListener(event, () => clearInterval(intervalId))
                    );

                    // Hover effect
                    button.addEventListener('mouseenter', () => {
                        button.style.background = 'rgba(220, 220, 220, 1)';
                        button.style.transform = 'scale(1.05)';
                    });
                    button.addEventListener('mouseleave', () => {
                        button.style.background = 'rgba(110, 110, 110, 0.9)';
                        button.style.transform = 'scale(1)';
                    });

                    return button;
                };

                const zoomOutBtn = createZoomButton('🔍-', 'Zoom Out (hold to scale down)', 'out');
                const zoomInBtn = createZoomButton('🔍+', 'Zoom In (hold to scale up)', 'in');

                // Create reset button
                const resetBtn = document.createElement('button');
                resetBtn.innerHTML = '⟲';
                resetBtn.title = 'Reset zoom and pan';
                resetBtn.style.cssText = `
                    background: rgba(110, 110, 110, 0.9);
                    color: #000000ff;
                    border: 2px solid #d4af37;
                    padding: 8px 10px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s ease;
                `;
                resetBtn.addEventListener('mouseenter', () => {
                    resetBtn.style.background = 'rgba(220, 220, 220, 1)';
                    resetBtn.style.transform = 'scale(1.05)';
                });
                resetBtn.addEventListener('mouseleave', () => {
                    resetBtn.style.background = 'rgba(110, 110, 110, 0.9)';
                    resetBtn.style.transform = 'scale(1)';
                });
                resetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const canvas = roomMockupDiv.querySelector('canvas');
                    if (canvas) {
                        canvas.dataset.zoomScale = '1.0';
                        canvas.dataset.panX = '0';
                        canvas.dataset.panY = '0';
                        appState.savedZoomScale = 1.0;
                        appState.savedPanX = 0;
                        appState.savedPanY = 0;
                        canvas.style.setProperty('transform', 'scale(1) translate(0px, 0px)', 'important');
                        console.log('🔄 Reset zoom and pan to defaults');
                    }
                });

                zoomControls.appendChild(zoomOutBtn);
                zoomControls.appendChild(resetBtn);
                zoomControls.appendChild(zoomInBtn);

                // Add pan functionality to canvas
                let isPanning = false;
                let startX = 0;
                let startY = 0;
                let currentPanX = 0;
                let currentPanY = 0;

                roomMockupDiv.addEventListener('mousedown', (e) => {
                    const canvas = roomMockupDiv.querySelector('canvas');
                    if (canvas && e.target === canvas) {
                        isPanning = true;
                        startX = e.clientX;
                        startY = e.clientY;
                        currentPanX = parseFloat(canvas.dataset.panX || '0');
                        currentPanY = parseFloat(canvas.dataset.panY || '0');
                        canvas.style.cursor = 'grabbing';
                        e.preventDefault();
                    }
                });

                document.addEventListener('mousemove', (e) => {
                    if (isPanning) {
                        const canvas = roomMockupDiv.querySelector('canvas');
                        if (canvas) {
                            const deltaX = e.clientX - startX;
                            const deltaY = e.clientY - startY;
                            const newPanX = currentPanX + deltaX;
                            const newPanY = currentPanY + deltaY;

                            canvas.dataset.panX = newPanX.toString();
                            canvas.dataset.panY = newPanY.toString();
                            appState.savedPanX = newPanX;
                            appState.savedPanY = newPanY;

                            const scale = parseFloat(canvas.dataset.zoomScale || '1.0');
                            canvas.style.setProperty('transform', `scale(${scale}) translate(${newPanX}px, ${newPanY}px)`, 'important');
                        }
                    }
                });

                document.addEventListener('mouseup', () => {
                    if (isPanning) {
                        const canvas = roomMockupDiv.querySelector('canvas');
                        if (canvas) {
                            canvas.style.cursor = 'grab';
                        }
                        isPanning = false;
                    }
                });

                // Set cursor to grab when hovering over canvas
                roomMockupDiv.addEventListener('mouseover', (e) => {
                    const canvas = roomMockupDiv.querySelector('canvas');
                    if (canvas && e.target === canvas && !isPanning) {
                        canvas.style.cursor = 'grab';
                    }
                });

                roomMockupDiv.appendChild(zoomControls);
                console.log('✅ Added zoom controls, pan functionality, and reset button for clothing mockup');
            }

            // Remove "Back to Pattern" button for clothing mode
            const backButton = document.getElementById('backToPatternsBtn');
            if (backButton) {
                backButton.remove();
                console.log('✅ Removed "Back to Pattern" button for clothing mode');
            }

            console.log('👗 Clothing collection UI modifications complete');
        }

        // ✅ Save current zoom level for clothing mockup (BEFORE pattern switch)
        let savedZoomScale = 1.0;
        const existingCanvas = document.querySelector('#roomMockup canvas');
        console.log(`🔍 Zoom persistence: Looking for existing canvas...`, existingCanvas ? 'FOUND' : 'NOT FOUND');
        if (existingCanvas) {
            console.log(`🔍 Zoom persistence: Canvas zoomScale dataset:`, existingCanvas.dataset.zoomScale);
        }
        if (existingCanvas && existingCanvas.dataset.zoomScale) {
            savedZoomScale = parseFloat(existingCanvas.dataset.zoomScale);
            console.log(`🔍 Zoom persistence: ✅ Saved zoom level: ${savedZoomScale * 100}%`);
        } else {
            console.log(`🔍 Zoom persistence: Using default zoom (100%)`);
        }

        // ✅ Save current scale (BEFORE populateLayerInputs rebuilds everything)
        const savedScaleMultiplier = appState.scaleMultiplier || 1;
        console.log(`🔍 Scale persistence: Saved current scale multiplier: ${savedScaleMultiplier}`);
        console.log(`🔍 Scale persistence: Current pattern being switched FROM: ${appState.currentPattern?.name || 'none'}`);

        // ✅ Save current colors if lock is enabled (BEFORE populateLayerInputs rebuilds everything)
        let savedColorBuffer = null;
        if (appState.colorsLocked && appState.layerInputs && appState.layerInputs.length > 0) {
            savedColorBuffer = appState.layerInputs.map(layer => layer.input.value);
            console.log('🔒 Color lock: Saved color buffer:', savedColorBuffer);
        }

        // ✅ Build layer + input models once pattern is set
        populateLayerInputs(pattern);

        // ✅ Restore saved colors if lock is enabled (AFTER populateLayerInputs builds new UI)
        if (appState.colorsLocked && savedColorBuffer && savedColorBuffer.length > 0) {
            console.log('🔒 Color lock: Restoring colors from buffer to', appState.layerInputs.length, 'layers');
            appState.layerInputs.forEach((layer, index) => {
                // Cycle through saved colors if new pattern has more layers
                const colorIndex = index % savedColorBuffer.length;
                const savedColor = savedColorBuffer[colorIndex];

                // Update the input field
                layer.input.value = savedColor;

                // Update the color circle
                const hex = lookupColor(savedColor) || "#FFFFFF";
                layer.circle.style.backgroundColor = hex;

                // Update the currentLayers data
                if (appState.currentLayers[index]) {
                    appState.currentLayers[index].color = savedColor;
                }

                console.log(`  Restored layer ${index} (${layer.label}): ${savedColor} (cycling from buffer[${colorIndex}])`);
            });

            // Trigger preview update with new colors
            updatePreview();
            updateRoomMockup();
        }

        // ✅ Restore saved scale (BEFORE final preview updates)
        // This ensures the scale is set correctly before the main preview updates at the end
        console.log(`🔍 Scale persistence: Restoring scale multiplier to ${savedScaleMultiplier}`);
        appState.scaleMultiplier = savedScaleMultiplier;

        // Update currentScale for display consistency
        if (savedScaleMultiplier === 1) {
            appState.currentScale = 100;
        } else if (savedScaleMultiplier === 0.5) {
            appState.currentScale = 200;
        } else if (savedScaleMultiplier === 0.33) {
            appState.currentScale = 300;
        } else if (savedScaleMultiplier === 0.25) {
            appState.currentScale = 400;
        }

        // Update scale button highlighting using setTimeout to ensure buttons exist
        setTimeout(() => {
            const buttons = document.querySelectorAll("#scaleControls button");
            if (buttons.length === 0) {
                console.log('⚠️  Scale buttons not found yet - may be in clothing mode or hidden');
                return;
            }

            // Reset all buttons to inactive state
            buttons.forEach(btn => {
                btn.style.setProperty('background-color', '#e2e8f0', 'important');
                btn.style.setProperty('color', '#1a202c', 'important');
                btn.style.setProperty('font-weight', 'normal', 'important');
            });

            // Highlight the active scale button
            let activeButtonIndex = -1;
            if (savedScaleMultiplier === 1) activeButtonIndex = 0;      // Normal
            else if (savedScaleMultiplier === 0.5) activeButtonIndex = 1;  // 2X
            else if (savedScaleMultiplier === 0.33) activeButtonIndex = 2; // 3X
            else if (savedScaleMultiplier === 0.25) activeButtonIndex = 3; // 4X

            if (activeButtonIndex >= 0 && buttons[activeButtonIndex]) {
                buttons[activeButtonIndex].style.setProperty('background-color', '#d4af37', 'important');
                buttons[activeButtonIndex].style.setProperty('color', '#1a202c', 'important');
                buttons[activeButtonIndex].style.setProperty('font-weight', 'bold', 'important');
                console.log(`🔍 Scale persistence: Highlighted button ${activeButtonIndex} for scale ${savedScaleMultiplier}`);
            }
        }, 50); // Small delay to ensure DOM is ready


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

        // Store savedZoomScale in appState so renderFabricMockup can access it
        appState.savedZoomScale = savedZoomScale;

        console.log(`🔍 Scale persistence: About to render with scale: ${appState.scaleMultiplier}`);
        updatePreview();

        // Check if we're in fabric mode - if so, only render fabric mockup
        if (appState.isInFabricMode) {
            console.log("🧵 loadPatternData in fabric mode - calling renderFabricMockup()");
            await renderFabricMockup();
        } else {
            console.log(`🔍 Scale persistence: Calling updateRoomMockup() with scale: ${appState.scaleMultiplier}`);
            updateRoomMockup();
        }

        // Note: populatePatternThumbnails() removed - thumbnails are populated once on collection load
        // and don't need to be regenerated on every pattern click (performance optimization)
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
    window.setPatternScale = async function(multiplier) {
        console.log(`🔍 setPatternScale called with multiplier: ${multiplier}`);
        console.log(`🔍 Previous scale multiplier: ${appState.scaleMultiplier}`);
        appState.scaleMultiplier = multiplier;

        // 🎯 FIX: Update currentScale to reflect actual scale percentage
        // Convert scaleMultiplier to percentage for consistent scale display
        if (multiplier === 1) {
            appState.currentScale = 100;        // Normal = 100%
        } else if (multiplier === 0.5) {
            appState.currentScale = 200;        // 2X = 200%
        } else if (multiplier === 0.33) {
            appState.currentScale = 300;        // 3X = 300%
        } else if (multiplier === 0.25) {
            appState.currentScale = 400;        // 4X = 400%
        } else if (multiplier === 2) {
            appState.currentScale = 50;         // 0.5X = 50%
        } else {
            // For any other values, calculate percentage
            appState.currentScale = Math.round(100 / multiplier);
        }

        console.log(`>>> Scale updated - multiplier: ${appState.scaleMultiplier}, currentScale: ${appState.currentScale}%`);

        // Highlight active button with setProperty to override inline !important styles
        document.querySelectorAll('button[data-multiplier]').forEach(btn => {
            const btnMultiplier = parseFloat(btn.dataset.multiplier);
            if (btnMultiplier === multiplier) {
                // Active state - gold highlighting
                btn.style.setProperty('background-color', '#d4af37', 'important');
                btn.style.setProperty('color', '#1a202c', 'important');
                btn.style.setProperty('font-weight', 'bold', 'important');
                console.log('🎯 Highlighted scale button:', btn.textContent, 'with multiplier:', btnMultiplier);
            } else {
                // Inactive state - default styling
                btn.style.setProperty('background-color', '#e2e8f0', 'important');
                btn.style.setProperty('color', '#1a202c', 'important');
                btn.style.setProperty('font-weight', 'normal', 'important');
            }
        });

        // Check if we're in fabric mode - if so, only render fabric mockup
        if (appState.isInFabricMode) {
            console.log("🧵 setPatternScale in fabric mode - calling renderFabricMockup()");
            await renderFabricMockup();
        } else {
            // Update both pattern preview and room mockup for scale changes
            updatePreview();
            updateRoomMockup();
        }

        const isFurniturePattern = appState.currentPattern?.isFurniture || false;
        
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
// SECTION 8: CORE RENDERING SYSTEM
// ============================================================================
// Layer model building, image loading, canvas rendering (updatePreview,
// updateRoomMockup). This section handles all pattern visualization.
// ============================================================================

// buildLayerModel - Returns a flat array of layer objects for rendering
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
console.log("🔍 FURNITURE DETECTION DEBUG:");
console.log("  appState.isInFurnitureMode:", appState.isInFurnitureMode);
console.log("  selectedFurnitureType:", appState.selectedFurnitureType);
console.log("  furnitureConfig available:", appState.furnitureConfig ? Object.keys(appState.furnitureConfig) : 'null');

const isFurnitureCollection = appState.isInFurnitureMode && appState.furnitureConfig && appState.selectedFurnitureType;
console.log("  isFurnitureCollection result:", isFurnitureCollection);
    

    if (isFurnitureCollection) {
        // Add wall color layer
        const furnitureConfig = appState.selectedCollection?.furnitureConfig;
        const defaultWallColor = furnitureConfig?.defaultWallColor || "SW7006 Extra White";
        
        allLayers.push({
            label: "Wall Color",
            color: defaultWallColor,
            path: null,
            isBackground: false,
            isShadow: false,
            isWallPanel: false,
            inputId: `layer-${inputIndex++}`
        });
        console.log(`  ✅ Added Wall Color (default): ${defaultWallColor}`);

        // Add sofa base layer  
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

    } else {
        // Standard collection - just background
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

    // ✅ PATTERN LAYERS (shared by both furniture and standard)
    console.log("  🎨 Processing pattern layers:");
    let patternLabelIndex = 0;

    for (let i = 0; i < patternLayers.length; i++) {
        const layer = patternLayers[i];
        const isTrueShadow = layer.isShadow === true;

        if (!isTrueShadow) {
            const originalLabel = layerLabels[patternLabelIndex] || `Pattern Layer ${patternLabelIndex + 1}`;
            
            const layerObj = {
                label: originalLabel,
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
            console.log(`    ✅ Added pattern layer: "${originalLabel}" (designer color ${colorIndex - 1})`);
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

    // ✅ ADD EXTRAS/PILLOWS INPUT AT THE END (furniture collections only)
    if (isFurnitureCollection) {
        allLayers.push({
            label: "Extras/Pillows",
            color: designerColors[colorIndex++] || "SW7006 Extra White",  // Default to extra white
            path: null,
            isBackground: false,
            isShadow: false,
            isWallPanel: false,
            isExtras: true,  // Flag to identify this layer
            inputId: `layer-${inputIndex++}`
        });
        console.log(`  ✅ Added Extras/Pillows layer (designer color ${colorIndex - 1})`);
    }

    console.log(`🏗️ Final layer model (used ${colorIndex} designer colors):`);
    allLayers.forEach((layer, index) => {
        const type = layer.isBackground ? 'bg' : layer.isShadow ? 'shadow' : layer.isExtras ? 'extras' : 'layer';
        console.log(`  ${index}: ${layer.label} (${type}) = ${layer.color || 'no color'}`);
    });

    // VALIDATION: Check counts
    const inputLayers = allLayers.filter(l => !l.isShadow);
    console.log(`✅ Created ${inputLayers.length} input layers, used ${colorIndex} designer colors`);
    
    if (designerColors.length < colorIndex) {
        console.warn(`⚠️ Not enough designer colors: need ${colorIndex}, have ${designerColors.length}`);
    }

    // Add this at the very end of buildLayerModel(), just before the return statement
console.log(`🏗️ FINAL LAYER MODEL DEBUG:`);
console.log(`  Total layers created: ${allLayers.length}`);
console.log(`  isFurnitureCollection was: ${isFurnitureCollection}`);
console.log(`  Used ${colorIndex} designer colors`);
console.log(`  Final layer structure:`);
allLayers.forEach((layer, index) => {
    const type = layer.isBackground ? 'bg' : layer.isShadow ? 'shadow' : 'input';
    console.log(`    ${index}: "${layer.label}" (${type}) = "${layer.color}" | inputId: ${layer.inputId}`);
});


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
    const curatedColors = appState.selectedCollection?.curatedColors || [];
    
    // Use curated colors as fallback if no designer colors
    const effectiveColors = designerColors.length > 0 ? designerColors : curatedColors;
    console.log("🎨 PATTERN LOAD COLOR FALLBACK:");
    console.log("  - Pattern:", pattern.name);
    console.log("  - designerColors:", designerColors.length, designerColors);
    console.log("  - curatedColors:", curatedColors.length, curatedColors);
    console.log("  - Using effectiveColors:", effectiveColors.length, effectiveColors);

    appState.currentLayers = buildLayerModel(
      pattern,
      effectiveColors,
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

            console.log("🔍 updatePreview PATTERN DEBUG:");
        console.log("  currentPattern name:", appState.currentPattern?.name);
        console.log("  currentPattern layers:", appState.currentPattern?.layers?.map(l => {
            const path = typeof l === 'string' ? l : l?.path;
            return path?.split('/').pop();
        }));
        console.log("  isFurnitureMode:", appState.furnitureMode);
        console.log("  selectedCollection name:", appState.selectedCollection?.name);
        
        if (!dom.preview) return console.error("preview not found in DOM");


    try {
        if (!dom.preview) return console.error("preview not found in DOM");
        if (!appState.currentPattern) {
            console.log("⏳ No current pattern selected yet, skipping updatePreview");
            return;
        }

        // Loading indicator removed

        // Get responsive canvas size from CSS custom properties (MOVED UP)
        const computedStyle = getComputedStyle(document.documentElement);
        const previewSizeValue = computedStyle.getPropertyValue('--preview-size');
        const canvasSize = parseInt((previewSizeValue && typeof previewSizeValue === 'string') ? previewSizeValue.replace('px', '') : '700') || 700;

        // ⚠️ CRITICAL: Define patternToRender FIRST before using it
        let patternToRender = appState.currentPattern;

        // ✅ CRITICAL FIX FOR CLO-2: Detect clothing collections
        // CLO-2 patterns need special handling - they have layers but need to be TILED in preview
        const isClothingCollection = appState.selectedCollection?.name?.includes('.clo-');
        if (isClothingCollection && patternToRender.layers?.length > 0) {
            console.log(`👕 CLOTHING COLLECTION DETECTED: Pattern will use layers with custom colors (tiled in preview)`);
            console.log(`   Collection: ${appState.selectedCollection.name}`);
            console.log(`   Pattern has ${patternToRender.layers.length} layers for color customization`);
        }

        // ✅ FIXED: Handle standard patterns by displaying thumbnail directly
        // Standard patterns have NO layers or colorFlex is explicitly false
        const isStandardPattern = !patternToRender.layers || patternToRender.layers.length === 0;
        if (isStandardPattern) {
            console.log("📋 Rendering standard pattern with thumbnail:", appState.currentPattern.name);
            
            if (appState.currentPattern.thumbnail) {
                // Use same canvas setup as regular ColorFlex patterns
                const previewCanvas = document.createElement("canvas");
                const previewCtx = previewCanvas.getContext("2d", { willReadFrequently: true });
                previewCanvas.width = canvasSize;
                previewCanvas.height = canvasSize;
                
                // Load thumbnail as pattern image
                const patternImg = new Image();
                patternImg.crossOrigin = "Anonymous";
                patternImg.src = normalizePath(appState.currentPattern.thumbnail);
                
                await new Promise((resolve) => {
                    patternImg.onload = () => {
                        console.log("🔍 STANDARD PATTERN SIZING DEBUG:");
                        console.log("  Pattern image:", patternImg.width + "x" + patternImg.height);
                        console.log("  Canvas size:", canvasSize + "x" + canvasSize);
                        console.log("  Scale factors:", appState.currentScale, appState.scaleMultiplier);
                        
                        // Clear canvas with dark background
                        previewCtx.fillStyle = "#434341";
                        previewCtx.fillRect(0, 0, canvasSize, canvasSize);
                        
                        // Scale pattern to fit canvas, then apply user scaling
                        // Fix: Use only scaleMultiplier since currentScale and scaleMultiplier are inverses
                        const scale = (appState.scaleMultiplier ||1);
                        console.log("  Final scale multiplier:", scale);
                        
                        // Fit pattern to canvas (like CSS object-fit: contain)
                        const imgAspect = patternImg.width / patternImg.height;
                        const canvasAspect = 1; // Square canvas
                        
                        let fitWidth, fitHeight;
                        if (imgAspect > canvasAspect) {
                            // Image is wider than canvas - fit to width
                            fitWidth = canvasSize;
                            fitHeight = canvasSize / imgAspect;
                        } else {
                            // Image is taller than canvas - fit to height  
                            fitHeight = canvasSize;
                            fitWidth = canvasSize * imgAspect;
                        }
                        
                        console.log("  Fit size (before scale):", fitWidth + "x" + fitHeight);
                        
                        // For standard patterns, scale the single pattern based on scale buttons
                        console.log("  🎯 Scale debugging - currentScale:", appState.currentScale, "scaleMultiplier:", appState.scaleMultiplier);
                        const previewScale = (appState.scaleMultiplier || 1);
                        console.log("  🎯 Calculated previewScale:", previewScale);
                        const scaledWidth = fitWidth * previewScale;
                        const scaledHeight = fitHeight * previewScale;
                        
                        console.log("  Final size (after scale):", scaledWidth + "x" + scaledHeight);
                        
                        console.log("*** CLAUDE BUILD TEST 123 - STANDARD PATTERN TILING ***");
                        console.log(`  📐 Canvas: ${previewCanvas.width}x${previewCanvas.height}, Tile: ${scaledWidth}x${scaledHeight}`);
                        console.log(`  🎯 Scale check - previewScale: ${previewScale}, isNormal: ${previewScale === 1}`);
                        
                        if (Math.abs(previewScale - 1) < 0.01) {
                            // Normal scale: show single centered pattern
                            console.log("  📍 Normal scale - showing single centered pattern");
                            const x = (previewCanvas.width - scaledWidth) / 2;
                            const y = (previewCanvas.height - scaledHeight) / 2;
                            previewCtx.drawImage(patternImg, x, y, scaledWidth, scaledHeight);
                        } else {
                            // Scaled: tile the pattern using ColorFlex logic with half-drop support
                            console.log("  🔄 Scaled mode - tiling pattern across canvas");
                            
                            // Check for half-drop tiling
                            const tilingType = appState.currentPattern.tilingType || "";
                            const isHalfDrop = tilingType === "half-drop" || appState.currentPattern.name.toLowerCase().includes("hd");
                            console.log(`  🔄 Half-drop check: tilingType="${tilingType}", name contains HD: ${appState.currentPattern.name.toLowerCase().includes("hd")}, isHalfDrop: ${isHalfDrop}`);
                            
                            for (let x = -scaledWidth; x < previewCanvas.width + scaledWidth; x += scaledWidth) {
                                const isOddColumn = Math.floor((x + scaledWidth) / scaledWidth) % 2 !== 0;
                                const yOffset = isHalfDrop && isOddColumn ? scaledHeight / 2 : 0;
                                if (isHalfDrop) {
                                    console.log(`  🔄 Column at x=${x}, isOdd=${isOddColumn}, yOffset=${yOffset}`);
                                }
                                for (let y = -scaledHeight + yOffset; y < previewCanvas.height + scaledHeight; y += scaledHeight) {
                                    previewCtx.drawImage(patternImg, x, y, scaledWidth, scaledHeight);
                                }
                            }
                        }
                        console.log("✅ Standard pattern rendered");
                        resolve();
                    };
                    patternImg.onerror = () => {
                        console.error("❌ Failed to load standard pattern thumbnail");
                        resolve();
                    };
                });
                
                // Use same display setup as regular ColorFlex patterns
                dom.preview.innerHTML = '';
                dom.preview.appendChild(previewCanvas);
                dom.preview.style.width = `${canvasSize}px`;
                dom.preview.style.height = `${canvasSize}px`;
                dom.preview.style.backgroundColor = "rgba(17, 24, 39, 1)";
                
                if (appState.currentPattern.name && dom.patternName) {
                    dom.patternName.innerHTML = appState.currentPattern.name + formatPatternInfo(appState.currentPattern);
                }
                
                return;
            } else {
                console.warn("⚠️ Standard pattern has no thumbnail:", appState.currentPattern.name);
            }
        }

        // Canvas size already defined above

        const previewCanvas = document.createElement("canvas");
        const previewCtx = previewCanvas.getContext("2d", { willReadFrequently: true });
        previewCanvas.width = canvasSize;
        previewCanvas.height = canvasSize;

        // Check if this is a furniture collection
        const isFurnitureCollection = appState.isInFurnitureMode && appState.furnitureConfig && appState.selectedFurnitureType;
        const layerMapping = getLayerMappingForPreview(isFurnitureCollection);

        


        
        console.log("🔍 Layer mapping:", layerMapping);
        console.log("🔍 Current layers:", appState.currentLayers ? appState.currentLayers.map((l, i) => l ? `${i}: ${l.label} = ${l.color}` : `${i}: undefined`) : 'No layers');

        let usesBotanicalLayers = false;

        // Removed furniture collection logic - use current pattern directly

        // Get background color based on collection type
        let backgroundLayerIndex = layerMapping.backgroundIndex;
        let backgroundColor;

        if (isFurnitureCollection && usesBotanicalLayers) {
            // ✅ FIX: For furniture mode pattern preview, use the BG/Sofa Base color (index 1)
            // but this should be the same as the original background color
            backgroundColor = lookupColor(appState.currentLayers[1]?.color || "Snowbound");
            console.log(`🌿 Furniture mode pattern preview - using BG/Sofa Base color from input 1: ${backgroundColor}`);
        } else {
            // Standard mode or furniture room mockup
            const backgroundLayer = appState.currentLayers[backgroundLayerIndex];

            // Skip color lookup for standard patterns - use fixed dark background
            // Check for both colorFlex flag and presence of layers (botanicals have layers but no colorFlex flag)
            const hasLayers = appState.currentPattern.layers && appState.currentPattern.layers.length > 0;
            const isStandardPattern = !appState.currentPattern.colorFlex && !hasLayers;
            if (isStandardPattern) {
                backgroundColor = "#434341"; // Dark background for standard patterns
                console.log(`📋 Standard pattern using fixed dark background (no color lookup)`);
            } else {
                backgroundColor = lookupColor(backgroundLayer?.color || "Snowbound");
                console.log(`🎨 ColorFlex pattern background color from input ${backgroundLayerIndex}: ${backgroundColor}`);
            }
        }        
        console.log(`🎨 Background color from input ${backgroundLayerIndex}: ${backgroundColor}`);

        // Clear canvas to transparent
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // Handle tint white patterns
        if (patternToRender.tintWhite && patternToRender.baseComposite) {
            console.log("🎨 Rendering tint white pattern");
            
            const baseImage = new Image();
            baseImage.crossOrigin = "Anonymous";
            baseImage.src = normalizePath(patternToRender.baseComposite);
            
            await new Promise((resolve, reject) => {
                baseImage.onload = () => {
                    const scaleMultiplier = appState.scaleMultiplier || .5;
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
                    let imageData;
                    try {
                        imageData = previewCtx.getImageData(offsetX, offsetY, drawWidth, drawHeight);
                    } catch (e) {
                        console.warn("⚠️ Canvas tainted, skipping preview tinting:", e.message);
                        resolve();
                        return;
                    }
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
            const firstLayer = patternToRender.layers.find(l => !l.isShadow);
            if (firstLayer) {
                const tempImg = new Image();
                tempImg.crossOrigin = "Anonymous";
                // Handle both string layers (botanicals) and object layers (other patterns)
                const firstLayerPath = typeof firstLayer === 'string' ? firstLayer : (firstLayer.path || firstLayer);
                tempImg.src = normalizePath(firstLayerPath);
                
                await new Promise((resolve) => {
                    tempImg.onload = () => {
                        // ✅ FIX: Use declared pattern size for aspect ratio, not image dimensions
                        const patternAspect = getCorrectAspectRatio(tempImg, patternToRender);
                        const scaleMultiplier = appState.scaleMultiplier || 1;

                        let patternDisplayWidth, patternDisplayHeight, offsetX, offsetY;
                        const baseSize = canvasSize;

                        // ✅ CRITICAL FIX FOR CLO-2: Tile across entire canvas for clothing collections
                        if (isClothingCollection) {
                            // Fill entire canvas - no centered rectangle
                            patternDisplayWidth = canvasSize;
                            patternDisplayHeight = canvasSize;
                            offsetX = 0;
                            offsetY = 0;
                            console.log(`👕 CLO-2 tiling mode: Full canvas ${canvasSize}x${canvasSize}`);
                        } else {
                            // Original behavior for regular patterns - centered rectangle
                            if (patternAspect > 1) {
                                patternDisplayWidth = Math.min(baseSize, canvasSize);
                                patternDisplayHeight = patternDisplayWidth / patternAspect;
                            } else {
                                patternDisplayHeight = Math.min(baseSize, canvasSize);
                                patternDisplayWidth = patternDisplayHeight * patternAspect;
                            }
                            offsetX = (canvasSize - patternDisplayWidth) / 2;
                            offsetY = (canvasSize - patternDisplayHeight) / 2;
                        }

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
                        // Handle both string layers and object layers
                        const isShadow = typeof layer === 'object' && layer.isShadow === true;
                        
                        let layerColor = null;
                        if (!isShadow) {
                            if (usesBotanicalLayers) {
    // ✅ FIX: Map botanical layer to furniture input correctly
    const furnitureInputIndex = layerMapping.patternStartIndex + layerIndex;
    layerColor = lookupColor(appState.currentLayers[furnitureInputIndex]?.color || "Snowbound");
    
    // ✅ DEBUG: Show the mapping
    const inputLayer = appState.currentLayers[furnitureInputIndex];
    console.log(`🌿 Botanical layer ${layerIndex} → furniture input ${furnitureInputIndex} (${inputLayer?.label}) → ${layerColor}`);

                            } else {
                                // Standard mapping
                                const inputIndex = layerMapping.patternStartIndex + layerIndex;
                                layerColor = lookupColor(appState.currentLayers[inputIndex]?.color || "Snowbound");
                                console.log(`🏠 Standard layer ${layerIndex} → input ${inputIndex} → ${layerColor}`);
                            }
                        }

                        await new Promise((resolve) => {
                            // Handle both string layers and object layers
                            const layerPath = typeof layer === 'string' ? layer : layer.path;
                            processImage(layerPath, (processedCanvas) => {
                                if (!(processedCanvas instanceof HTMLCanvasElement)) {
                                    return resolve();
                                }

                                // Fix for non-square patterns: calculate scale based on aspect ratio
                                const patternAspect = processedCanvas.width / processedCanvas.height;
                                const displayAspect = patternBounds.patternDisplayWidth / patternBounds.patternDisplayHeight;
                                
                                let baseScale;
                                if (patternAspect > displayAspect) {
                                    // Pattern is wider than display area - scale to fit width
                                    baseScale = patternBounds.patternDisplayWidth / processedCanvas.width;
                                } else {
                                    // Pattern is taller than display area - scale to fit height  
                                    baseScale = patternBounds.patternDisplayHeight / processedCanvas.height;
                                }
                                
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
        // Allow container to size naturally based on canvas content
        dom.preview.style.backgroundColor = "rgba(17, 24, 39, 1)";

        if (patternToRender.name) {
            dom.patternName.innerHTML = toInitialCaps(appState.currentPattern.name) + formatPatternInfo(appState.currentPattern);
        }

        console.log("✅ Pattern preview rendered");

        // Loading indicator removed

    } catch (err) {
        console.error("updatePreview error:", err);
        // Loading indicator removed
    }
};



// Helper: Format pattern size and tiling info as HTML
function formatPatternInfo(pattern) {
    if (!pattern) return '';

    // Build the pattern repeat string: "24x24HD" or "24x24S"
    let repeatStr = '';

    if (pattern.size && Array.isArray(pattern.size) && pattern.size.length >= 2) {
        const width = pattern.size[0];
        const height = pattern.size[1];
        repeatStr = `${width}x${height}`;

        // Add tiling suffix
        if (pattern.tilingType === 'half-drop') {
            repeatStr += 'HD';
        } else if (pattern.tilingType === 'straight') {
            repeatStr += 'S';
        }
    }

    if (repeatStr) {
        return `<br><span style="font-size: 0.85em; color: rgba(255, 255, 255, 0.6); font-weight: normal;">Pattern Repeat: ${repeatStr}</span>`;
    }

    return '';
}

/**
 * Internal image loader with caching and queue management
 * @param {string} src - Image source URL
 * @param {boolean} highPriority - If true, adds to front of queue
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageInternal(src, highPriority = true) {
    return new Promise((resolve, reject) => {
        if (!src) {
            console.error("❌ loadImage: No src provided");
            reject(new Error("No image source provided"));
            return;
        }

        // Normalize the path to fix ./data/ vs data/ inconsistencies
        const normalizedSrc = normalizePath(src);

        // Check cache first
        if (imageCache.has(normalizedSrc)) {
            imageCacheStats.hits++;
            imageCacheStats.itemsLoaded++;
            console.log(`✨ Cache HIT: ${normalizedSrc.split('/').pop()} (${imageCacheStats.hits} total hits)`);

            // Clone the cached image to prevent reference issues
            const cachedImg = imageCache.get(normalizedSrc);
            resolve(cachedImg);
            return;
        }

        // Cache miss - need to load from network
        imageCacheStats.misses++;
        imageCacheStats.itemsLoaded++;
        const startTime = performance.now();

        console.log(`📥 Cache MISS: Loading ${normalizedSrc.split('/').pop()} (Queue: ${imageLoadQueue.length}, Pending: ${pendingImageLoads.size}/${MAX_CONCURRENT_LOADS})`);

        const img = new Image();
        img.crossOrigin = "Anonymous";

        // Track this load
        pendingImageLoads.add(normalizedSrc);

        img.onload = () => {
            const loadTime = performance.now() - startTime;
            imageCacheStats.totalLoadTime += loadTime;

            console.log(`✅ Loaded: ${normalizedSrc.split('/').pop()} in ${loadTime.toFixed(0)}ms (${img.naturalWidth}x${img.naturalHeight})`);

            // Store in cache
            imageCache.set(normalizedSrc, img);

            // Remove from pending and process next in queue
            pendingImageLoads.delete(normalizedSrc);
            processImageQueue();

            resolve(img);
        };

        img.onerror = (error) => {
            console.error(`❌ Failed to load image: ${normalizedSrc}`);
            console.error("❌ Error details:", error);

            // Remove from pending and process next
            pendingImageLoads.delete(normalizedSrc);
            processImageQueue();

            reject(new Error(`Failed to load image: ${normalizedSrc}`));
        };

        img.src = normalizedSrc;
    });
}

/**
 * Public loadImage function with queue management
 * Automatically handles caching and concurrent load limiting
 *
 * @param {string} src - Image source URL
 * @param {boolean} highPriority - If true, loads immediately (default: true)
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src, highPriority = true) {
    return new Promise((resolve, reject) => {
        if (!src) {
            reject(new Error("No image source provided"));
            return;
        }

        const normalizedSrc = normalizePath(src);

        // Check cache first - instant return
        if (imageCache.has(normalizedSrc)) {
            imageCacheStats.hits++;
            imageCacheStats.itemsLoaded++;
            resolve(imageCache.get(normalizedSrc));
            return;
        }

        // Not in cache - check if we can load immediately
        if (pendingImageLoads.size < MAX_CONCURRENT_LOADS) {
            // Can load immediately
            loadImageInternal(normalizedSrc, highPriority)
                .then(resolve)
                .catch(reject);
        } else {
            // Queue is full - add to queue
            const loadFn = () => {
                loadImageInternal(normalizedSrc, highPriority)
                    .then(resolve)
                    .catch(reject);
            };

            if (highPriority) {
                // High priority - add to front of queue
                imageLoadQueue.unshift(loadFn);
            } else {
                // Low priority - add to end of queue
                imageLoadQueue.push(loadFn);
            }
        }
    });
}

    
//  room mockup
let updateRoomMockup = async () => {
  try {
    if (!dom.roomMockup) return console.error("roomMockup element not found in DOM");
    if (!appState.selectedCollection || !appState.currentPattern) {
      console.log("🔍 Skipping updateRoomMockup - no collection/pattern selected");
      return;
    }

    // Loading indicator removed

    // --- Canvas setup (CSS px -> DPR backing) ---
    const cssW = 600, cssH = 450;
    const dpr = window.devicePixelRatio || 1;
    const snap = v => Math.round(v * dpr) / dpr;           // align to device grid
    const mod  = (a,b)=>((a%b)+b)%b;

    // Calculate px per inch based on actual mockup dimensions from collection
    // If mockup is 90 inches wide and canvas is 600px → 600/90 = 6.67 px/inch
    // If mockup is 60 inches wide and canvas is 600px → 600/60 = 10 px/inch
    const mockupWidthInches = appState.selectedCollection.mockupWidthInches || 90;  // fallback to 90
    const mockupHeightInches = appState.selectedCollection.mockupHeightInches || 60; // fallback to 60
    const pxPerInRoom = cssW / mockupWidthInches;

    console.log(`📐 Room mockup dimensions: ${mockupWidthInches}x${mockupHeightInches} inches`);
    console.log(`📐 Canvas size: ${cssW}x${cssH} px`);
    console.log(`📐 Calculated px per inch: ${pxPerInRoom.toFixed(2)} px/in`);

    // Compute tile size (in CSS px) from declared pattern inches + user scale
    function computeTileSizeFromInches(pattern, userScale = 1) {
    const [wIn, hIn] = pattern.size || [24, 24]; // fallback if size missing
    return {
        tileW: snap(wIn * pxPerInRoom * userScale),
        tileH: snap(hIn * pxPerInRoom * userScale),
    };
    }


    const canvas = document.createElement("canvas");
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width  = cssW + "px";
    canvas.style.height = cssH + "px";

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS px

    const isStandardPattern =
      !appState.currentPattern.layers || appState.currentPattern.layers.length === 0;

    // Furniture mode uses separate rendering - check if we're in furniture mode
    const isFurnitureMode = appState.isInFurnitureMode && appState.furnitureConfig && appState.selectedFurnitureType;
    if (isFurnitureMode) {
      console.log("🪑 Rendering furniture preview (furniture mode active)");
      updateFurniturePreview();
      return;
    }

    const isWallPanel = appState.selectedCollection?.name === "wall-panels";
    const wallColor = lookupColor(appState.currentLayers[0]?.color || "Snowbound");
    const backgroundColor = isWallPanel
      ? lookupColor(appState.currentLayers[1]?.color || "Snowbound")
      : wallColor;

    // ---------- STANDARD (thumbnail-only) ----------
    if (isStandardPattern) {
      // Check if collection has a mockup - if not, skip standard rendering
      if (!appState.selectedCollection?.mockup) {
        console.log("⏭️  Skipping standard pattern rendering (no mockup defined for collection)");
        return;
      }

      const roomImg = new Image();
      roomImg.crossOrigin = "Anonymous";
      roomImg.src = normalizePath(appState.selectedCollection.mockup);

      roomImg.onload = () => {
        // bg
        ctx.fillStyle = "#434341";
        ctx.fillRect(0, 0, cssW, cssH);

        const patternImg = new Image();
        patternImg.crossOrigin = "Anonymous";
        patternImg.src = normalizePath(appState.currentPattern.thumbnail);

        patternImg.onload = () => {
        const { tileW, tileH } = computeTileSizeFromInches(appState.currentPattern, appState.scaleMultiplier || 0.5);

          const isHalfDrop =
            (appState.currentPattern.tilingType || "") === "half-drop" ||
            /hd/i.test(appState.currentPattern.name);

          const startX = 0 - mod(0, tileW) - tileW;
          const endX   = cssW + tileW;
          const startY = 0 - tileH;
          const endY   = cssH + tileH;

          let col = 0;
          for (let X = startX; X < endX; X += tileW, col++) {
            const yOff = isHalfDrop && (col & 1) ? tileH / 2 : 0;
            for (let Y = startY + yOff; Y < endY; Y += tileH) {
              ctx.drawImage(patternImg, X, Y, tileW, tileH);
            }
          }

          const fit = scaleToFit(roomImg, cssW, cssH); // expects CSS px
          ctx.drawImage(roomImg, fit.x, fit.y, fit.width, fit.height);

          dom.roomMockup.innerHTML = "";
          dom.roomMockup.appendChild(canvas);
        };
      };
      return;
    }

    // ---------- REGULAR / PANELS ----------
    const processOverlay = async () => {
      // Paint wall base (CSS px)
      ctx.fillStyle = wallColor;
      ctx.fillRect(0, 0, cssW, cssH);

      // ----- WALL PANELS -----
      if (isWallPanel && appState.currentPattern?.layers?.length) {
        const panelWidthInches  = appState.currentPattern.size?.[0] || 24;
        const panelHeightInches = appState.currentPattern.size?.[1] || 36;

        // scale panels in CSS px space
        const baseScale = Math.min(cssW / 100, cssH / 80);
        const panelWidth  = panelWidthInches  * baseScale * (appState.scaleMultiplier || 1);
        const panelHeight = panelHeightInches * baseScale * (appState.scaleMultiplier || 1);

        const layout = appState.currentPattern.layout || "3,20";
        const [numPanelsStr, spacingStr] = layout.split(",");
        const numPanels = parseInt(numPanelsStr, 10) || 3;
        const spacing   = parseInt(spacingStr,   10) || 20;

        const totalWidth = (numPanels * panelWidth) + ((numPanels - 1) * spacing);
        const startX = (cssW - totalWidth) / 2;
        const startY = (cssH - panelHeight) / 2 - (appState.currentPattern?.verticalOffset || 50);

        // panel offscreen (DPR-aware)
        const panelCanvas = document.createElement("canvas");
        panelCanvas.width  = Math.round(panelWidth  * dpr);
        panelCanvas.height = Math.round(panelHeight * dpr);
        const panelCtx = panelCanvas.getContext("2d", { willReadFrequently: true });
        panelCtx.imageSmoothingEnabled = true;
        panelCtx.imageSmoothingQuality = "high";
        panelCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Build input color mapping (skip background)
        const inputLayers = appState.currentLayers.filter(l => !l.isShadow);
        let inputIdx = 0;

        for (let i = 0; i < appState.currentPattern.layers.length; i++) {
          const layer = appState.currentPattern.layers[i];
          const isShadow = !!layer.isShadow;

          let layerColor = null;
          if (!isShadow) {
            const input = inputLayers[inputIdx + 1]; // skip bg
            layerColor = lookupColor(input?.color || "Snowbound");
            inputIdx++;
          }

          const tilingType = appState.currentPattern.tilingType || "";
          const isHalfDrop = tilingType === "half-drop";

          await new Promise((resolve) => {
            processImage(layer.path, (processedCanvas) => {
              if (!(processedCanvas instanceof HTMLCanvasElement)) return resolve();

              const scale = (appState.scaleMultiplier || .5) * 0.1;
              const tileW = snap(processedCanvas.width  * scale);
              const tileH = snap(processedCanvas.height * scale);

              panelCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
              panelCtx.globalAlpha = isShadow ? 0.3 : 1.0;

              const rect = { x: 0, y: 0, w: panelWidth, h: panelHeight };
              const sx = rect.x - mod(rect.x, tileW) - tileW;
              const ex = rect.x + rect.w + tileW;
              const sy = rect.y - tileH;
              const ey = rect.y + rect.h + tileH;

              let col = 0;
              for (let X = sx; X < ex; X += tileW, col++) {
                const yOff = isHalfDrop && (col & 1) ? tileH / 2 : 0;
                for (let Y = sy + yOff; Y < ey; Y += tileH) {
                  panelCtx.drawImage(processedCanvas, X, Y, tileW, tileH);
                }
              }
              resolve();
            }, layerColor, 2.2, isShadow, /*isWallPanel*/ false, /*isWall*/ false);
          });
        }

        // draw panels to main canvas
        for (let p = 0; p < numPanels; p++) {
          const px = startX + (p * (panelWidth + spacing));
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(px, startY, panelWidth, panelHeight);
          ctx.drawImage(panelCanvas, px, startY, panelWidth, panelHeight);
        }
      }

      // ----- TINT-WHITE (non-panel) -----
      else if (appState.currentPattern?.tintWhite && appState.currentPattern?.baseComposite) {
        const patternCanvas = document.createElement("canvas");
        patternCanvas.width  = Math.round(cssW * dpr);
        patternCanvas.height = Math.round(cssH * dpr);
        const patternCtx = patternCanvas.getContext("2d", { willReadFrequently: true });
        patternCtx.imageSmoothingEnabled = true;
        patternCtx.imageSmoothingQuality = "high";
        patternCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const baseImage = new Image();
        baseImage.crossOrigin = "Anonymous";
        baseImage.src = normalizePath(appState.currentPattern.baseComposite);

        await new Promise((resolve) => {
          baseImage.onload = () => {
            const { tileW, tileH } = computeTileSizeFromInches(appState.currentPattern, appState.scaleMultiplier || 1);

            const isHalfDrop = (appState.currentPattern.tilingType || "") === "half-drop";
            const sx = 0 - mod(0, tileW) - tileW, ex = cssW + tileW;
            const sy = 0 - tileH,                ey = cssH + tileH;

            for (let col = 0, X = sx; X < ex; X += tileW, col++) {
              const yOff = isHalfDrop && (col & 1) ? tileH / 2 : 0;
              for (let Y = sy + yOff; Y < ey; Y += tileH) {
                patternCtx.drawImage(baseImage, X, Y, tileW, tileH);
              }
            }

            // tint whites
            let imageData;
            try {
              imageData = patternCtx.getImageData(0, 0, patternCanvas.width, patternCanvas.height);
            } catch (e) {
              console.warn("⚠️ Canvas tainted, skipping tint white:", e.message);
              ctx.drawImage(patternCanvas, 0, 0);
              return resolve();
            }
            const d = imageData.data;
            const hex = wallColor.replace("#", "");
            const rT = parseInt(hex.slice(0,2),16);
            const gT = parseInt(hex.slice(2,4),16);
            const bT = parseInt(hex.slice(4,6),16);
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i], g = d[i+1], b = d[i+2];
              if (r > 240 && g > 240 && b > 240) { d[i]=rT; d[i+1]=gT; d[i+2]=bT; }
            }
            patternCtx.putImageData(imageData, 0, 0);

            ctx.drawImage(patternCanvas, 0, 0);
            resolve();
          };
          baseImage.onerror = resolve;
        });
      }

      // ----- REGULAR LAYERED (non-panel) -----
      else if (appState.currentPattern?.layers?.length) {
        const patternCanvas = document.createElement("canvas");
        patternCanvas.width  = Math.round(cssW * dpr);
        patternCanvas.height = Math.round(cssH * dpr);
        const patternCtx = patternCanvas.getContext("2d", { willReadFrequently: true });
        patternCtx.imageSmoothingEnabled = true;
        patternCtx.imageSmoothingQuality = "high";
        patternCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // map user colors (skip bg in input list)
        const inputLayers = appState.currentLayers.filter(l => !l.isShadow);
        let inputIdx = 0;

        for (let i = 0; i < appState.currentPattern.layers.length; i++) {
          const layer = appState.currentPattern.layers[i];
          const isShadow = !!layer.isShadow;

          let layerColor = null;
          if (!isShadow) {
            const input = inputLayers[inputIdx + 1]; // skip bg
            layerColor = lookupColor(input?.color || "Snowbound");
            inputIdx++;
          }

          const isHalfDrop = (appState.currentPattern.tilingType || "") === "half-drop";

          await new Promise((resolve) => {
            processImage(layer.path, (processedCanvas) => {
              if (!(processedCanvas instanceof HTMLCanvasElement)) return resolve();

              const { tileW, tileH } = computeTileSizeFromInches(appState.currentPattern, appState.scaleMultiplier || 1);

              patternCtx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
              patternCtx.globalAlpha = isShadow ? 0.3 : 1.0;

              const sx = 0 - mod(0, tileW) - tileW, ex = cssW + tileW;
              const sy = 0 - tileH,                ey = cssH + tileH;

              let col = 0;
              for (let X = sx; X < ex; X += tileW, col++) {
                const yOff = isHalfDrop && (col & 1) ? tileH / 2 : 0;
                for (let Y = sy + yOff; Y < ey; Y += tileH) {
                  patternCtx.drawImage(processedCanvas, X, Y, tileW, tileH);
                }
              }
              resolve();
            }, layerColor, 2.2, isShadow, /*isWallPanel*/ false, /*isWall*/ false);
          });
        }

        ctx.drawImage(patternCanvas, 0, 0);
      }

      // ----- Collection mockup overlay -----
      if (appState.selectedCollection?.mockup) {
        const mockupImage = new Image();
        mockupImage.crossOrigin = "Anonymous";
        mockupImage.src = normalizePath(appState.selectedCollection.mockup);
        await new Promise((resolve) => {
          mockupImage.onload = () => {
            const fit = scaleToFit(mockupImage, cssW, cssH);
            ctx.drawImage(mockupImage, fit.x, fit.y, fit.width, fit.height);
            resolve();
          };
          mockupImage.onerror = resolve;
        });
      }

      // ----- Shadow overlay -----
      if (appState.selectedCollection?.mockupShadow) {
        const shadowOverlay = new Image();
        shadowOverlay.crossOrigin = "Anonymous";
        shadowOverlay.src = normalizePath(appState.selectedCollection.mockupShadow);
        await new Promise((resolve) => {
          shadowOverlay.onload = () => {
            ctx.globalCompositeOperation = "multiply";
            const fit = scaleToFit(shadowOverlay, cssW, cssH);
            ctx.drawImage(shadowOverlay, fit.x, fit.y, fit.width, fit.height);
            ctx.globalCompositeOperation = "source-over";
            resolve();
          };
          shadowOverlay.onerror = resolve;
        });
      }

      // Render
      let dataUrl;
      try {
        dataUrl = canvas.toDataURL("image/png");
      } catch (e) {
        if (e.name === "SecurityError") {
          dom.roomMockup.innerHTML = "";
          canvas.style.cssText = "width: 100%; height: 100%; object-fit: contain; border: 1px solid #333;";
          dom.roomMockup.appendChild(canvas);
          dom.roomMockup.style.cssText = "width: 600px; height: 450px; position: relative; background-color: #434341;";
          ensureButtonsAfterUpdate();
          return;
        }
        throw e;
      }

      const img = document.createElement("img");
      img.src = dataUrl;
      img.style.cssText = "width: 100%; height: 100%; object-fit: contain; border: 1px solid #333;";
      dom.roomMockup.innerHTML = "";
      dom.roomMockup.appendChild(img);
      dom.roomMockup.style.cssText = "width: 600px; height: 450px; position: relative; background: #434341;";
      ensureButtonsAfterUpdate();
    };

    await processOverlay().catch(err => console.error("Error processing room mockup:", err));

    // Loading indicator removed

  } catch (e) {
    console.error("Error in updateRoomMockup:", e);
    // Loading indicator removed
  }
};

// GUARD / TRACE WRAPPER
if (USE_GUARD && DEBUG_TRACE) {
  updateRoomMockup = guard(traceWrapper(updateRoomMockup, "updateRoomMockup"));
} else if (USE_GUARD) {
  updateRoomMockup = guard(updateRoomMockup, "updateRoomMockup");
}


const updateFurniturePreview = async () => {
// Add this at the start of updateFurniturePreview()
const layerMapping = getLayerMappingForPreview(true);
console.log("🔍 LAYER MAPPING DEBUG IN FURNITURE PREVIEW:");
console.log("  wallIndex:", layerMapping.wallIndex);
console.log("  backgroundIndex:", layerMapping.backgroundIndex);  
console.log("  patternStartIndex:", layerMapping.patternStartIndex);
console.log("  Expected: wallIndex=0, backgroundIndex=1, patternStartIndex=2");

    try {
        console.log("🛋️ =========================");
        console.log("🛋️ Starting furniture preview");
        console.log("🛋️ =========================");

            const frozenZoomState = {
            scale: furnitureViewSettings.scale,
            offsetX: furnitureViewSettings.offsetX,
            offsetY: furnitureViewSettings.offsetY,
            isZoomed: furnitureViewSettings.isZoomed,
            timestamp: Date.now()
        };
        
        console.log("🔒 FROZEN zoom state for all layers:", frozenZoomState);

        
        // 🔍 ADD THIS DEBUG LINE:
        console.log("🔍 ENTRY POINT - Current furnitureViewSettings:", JSON.stringify(furnitureViewSettings, null, 2));
        
        // ✅ PRESERVE ZOOM SETTINGS ONCE AT THE START
        const preservedSettings = {
            scale: furnitureViewSettings.scale,
            offsetX: furnitureViewSettings.offsetX,
            offsetY: furnitureViewSettings.offsetY,
            isZoomed: furnitureViewSettings.isZoomed
        };

        
        console.log("🔒 Preserved zoom settings:", preservedSettings);

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
        const furnitureType = appState.selectedFurnitureType || 'sofa-capitol';
        const furniture = appState.furnitureConfig?.[furnitureType];

        // Debug furniture config
        console.log("🔍 FURNITURE CONFIG DEBUG:");
        console.log("  Collection name:", collection?.name);
        console.log("  Furniture type:", furnitureType);
        console.log("  Available furniture configs:", Object.keys(appState.furnitureConfig || {}));
        console.log("  Selected furniture config exists:", !!furniture);

        if (!furniture) {
            console.error("❌ No furniture config found for:", furnitureType);
            console.log("Available configs:", Object.keys(appState.furnitureConfig || {}));
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
                testImg.src = normalizePath(path);
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
        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, 600, 450);
        console.log("🧹 Canvas cleared with white background");
        ctx.clearRect(0, 0, 600, 450);
        ctx.fillStyle = "#F5F5F5";
        ctx.fillRect(0, 0, 600, 450);



        // ❌ REMOVED: The problematic settings update that was resetting zoom
        // NO LONGER UPDATING furnitureViewSettings here - using preserved settings

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
                zoomState: frozenZoomState
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
                isMask: true,
                zoomState: frozenZoomState
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
            testMaskImg.src = normalizePath(furniture.wallMask);
        } catch (e) {
            console.log(`❌ Error testing wall mask: ${e.message}`);
        }

        // ===== STEP 3: Draw sofa base =====
        console.log("3️⃣ Drawing sofa base - USING MAPPING");

        // ✅ Use the layer mapping to get the correct background index
        const backgroundIndex = layerMapping.backgroundIndex;

        
        const backgroundLayer = appState.currentLayers[backgroundIndex];
        const sofaBaseColor = resolveColor(backgroundLayer?.color || "#FAFAFA");

        // ✅ ENHANCED DEBUG - Let's catch the bug red-handed
        console.log("🔍 SOFA BASE COLOR RESOLUTION DEBUG:");
        console.log("  backgroundIndex:", backgroundIndex);
        console.log("  backgroundLayer:", backgroundLayer);
        console.log("  backgroundLayer.label:", backgroundLayer?.label);
        console.log("  backgroundLayer.color:", backgroundLayer?.color);
        console.log("  sofaBaseColor resolved to:", sofaBaseColor);

        // ✅ ALSO CHECK: What does resolveColor actually return?
        console.log("  resolveColor direct test:", resolveColor(backgroundLayer?.color));
        console.log("  lookupColor direct test:", lookupColor(backgroundLayer?.color));


        console.log(`  Sofa base color from input ${backgroundIndex} (${appState.currentLayers[backgroundIndex]?.label}): ${sofaBaseColor}`);

        if (furniture.base) {
            console.log("  🛋️ Sofa base path exists:", furniture.base);
            console.log("  🛋️ Calling drawFurnitureLayer for sofa base...");
            
            // ✅ ENSURE SOFA BASE COMPLETES BEFORE PATTERNS
            console.log("🐛 ABOUT TO DRAW SOFA BASE:");
        console.log("  furniture.base path:", furniture.base);
        console.log("  Should be: data/furniture/sofa-capitol/sofa-capitol-base.png");
        console.log("  Tint color:", sofaBaseColor);

            try {
                await drawFurnitureLayer(ctx, furniture.base, {
                    tintColor: sofaBaseColor,
                    zoomState: frozenZoomState
                });
                console.log("  ✅ Sofa base step completed - CONFIRMED");
            } catch (error) {
                console.error("  ❌ Sofa base failed:", error);
            }

                // ✅ Then: Add shadow layer with multiply blend (no UI input needed)
                const shadowPath = furniture.baseShadow || furniture.base.replace(/base.*\.png/, 'base-shadow.png');
                console.log("  🌚 Adding sofa base shadow...");
                
                await drawFurnitureLayer(ctx, shadowPath, {
                    tintColor: null,  // No tinting for shadow
                    zoomState: frozenZoomState,
                    blendMode: "multiply",  // Multiply blend for shadow
                    opacity: 0.7  // Adjust shadow intensity
                });
                console.log("  ✅ Sofa base shadow completed");

        } else {
            console.error("❌ No base path in furniture config");
        }

        // ✅ ADD DELAY TO ENSURE SOFA BASE IS FULLY RENDERED
        console.log("⏳ Waiting for sofa base to complete before patterns...");
        await new Promise(resolve => setTimeout(resolve, 50));
    

            // ===== STEP 4: Draw pattern layers =====
            console.log("4️⃣ Drawing pattern layers - ENHANCED DEBUG");

            // 🪑 FURNITURE MODE: Use mockupLayers instead of layers
            const layersToRender = pattern.mockupLayers || pattern.layers;
            console.log(`  Total pattern layers to process: ${layersToRender.length}`);
            console.log(`  Using layer array: ${pattern.mockupLayers ? 'mockupLayers (furniture)' : 'layers (wallpaper)'}`);
            console.log(`  Pattern layer start index: ${layerMapping.patternStartIndex}`);
            console.log(`  Available inputs: ${appState.currentLayers.length}`);

            // Show all current inputs
            console.log("  📋 ALL CURRENT INPUTS:");
            appState.currentLayers.forEach((layer, idx) => {
                console.log(`    Input ${idx}: ${layer.label} = "${layer.color}"`);
            });

            console.log("  🎨 PATTERN LAYER MAPPING:");
            for (let i = 0; i < layersToRender.length; i++) {

                const layer = typeof layersToRender[i] === 'string' ? { path: layersToRender[i] } : layersToRender[i];
                const furnitureInputIndex = layerMapping.patternStartIndex + i;
                const inputLayer = appState.currentLayers[furnitureInputIndex];
                const layerColor = resolveColor(inputLayer?.color || "Snowbound");
                
                console.log(`  📐 Pattern layer ${i}:`);
                console.log(`    Layer path: ${layer.path?.split('/').pop()}`);
                console.log(`    Maps to input ${furnitureInputIndex}: ${inputLayer?.label} = "${inputLayer?.color}"`);
                console.log(`    Resolved color: ${layerColor}`);
                console.log(`    Input exists: ${!!inputLayer}`);
                
                if (layerColor && layer.path) {
                    try {
                        console.log(`    🎨 Using processImage for pattern layer ${i} with color ${layerColor}`);
                        
                if (layerColor && layer.path) {
                    try {
                        await drawFurnitureLayer(ctx, layer.path, {
                            tintColor: layerColor,
                            zoomState: frozenZoomState,
                            highRes: true  // ✅ Enable high-res for patterns

                        });
                        console.log(`    ✅ Pattern layer ${i} rendered in high resolution`);
                    } catch (error) {
                        console.error(`    ❌ Failed to render pattern layer ${i}:`, error);
                    }
                }        
                    } catch (error) {
                        console.error(`    ❌ Failed to render pattern layer ${i}:`, error);
                    }
                } else {
                    console.warn(`    ⚠️ Skipping pattern layer ${i}: missing color or path`);
                }
            }        
            console.log("✅ Pattern layers step completed");

            // ✅ NEW STEP 4.5: Add sofa base shadow AFTER patterns
            console.log("4️⃣.5 Adding sofa base shadow on top of patterns");

            const shadowPath = furniture.baseShadow || furniture.base.replace(/base.*\.png/, 'base-shadow.png');
            if (shadowPath && furniture.base) {
                console.log("  🌚 Drawing shadow on top of patterns...");
                
                try {
                    await drawFurnitureLayer(ctx, shadowPath, {
                        tintColor: null,  // No tinting for shadow
                        zoomState: frozenZoomState,
                        blendMode: "multiply",  // Multiply blend for shadow effect
                        opacity: 0.7  // Adjust shadow intensity as needed
                    });
                    console.log("  ✅ Shadow applied on top of patterns");
                } catch (error) {
                    console.log("  ⚠️ Shadow file not found, skipping:", shadowPath);
                }
            } else {
                console.log("  ⚠️ No shadow path defined, skipping shadow");
            }

            
            // ===== STEP 5: Draw extras on top (split into tintable + fixed) =====
            console.log("5️⃣ Drawing extras (pillows/throw + table)");

            // ✅ Find the Extras/Pillows color from currentLayers
            const extrasLayer = appState.currentLayers.find(l => l.isExtras === true);
            const extrasColor = extrasLayer ? resolveColor(extrasLayer.color || "SW7006 Extra White") : null;
            console.log("  Extras color:", extrasColor);

            // ✅ STEP 5a: Draw TINTABLE extras (pillows/throw) with user color
            // Use explicit path - the tintable layer contains ONLY pillows/throw on transparent
            const tintableExtrasPath = 'data/furniture/sofa-capitol/sofa-capitol-extras-tintable.png';
            console.log("  Tintable extras path:", tintableExtrasPath);

            try {
                await drawFurnitureLayer(ctx, tintableExtrasPath, {
                    tintColor: extrasColor,
                    zoomState: frozenZoomState,
                    opacity: 1.0,
                    blendMode: "source-over",
                    isTintableExtras: true  // Flag to ensure correct processing
                });
                console.log("  ✅ Tintable extras (pillows/throw) drawn with color:", extrasColor);
            } catch (error) {
                console.log("  ⚠️ Tintable extras not found, skipping:", error.message);
            }

            // ✅ STEP 5b: Draw FIXED extras (table/candles) without tinting
            // Use explicit path - the fixed layer contains table/candles on transparent
            const fixedExtrasPath = 'data/furniture/sofa-capitol/sofa-capitol-extras-fixed.png';
            console.log("  Fixed extras path:", fixedExtrasPath);

            try {
                await drawFurnitureLayer(ctx, fixedExtrasPath, {
                    tintColor: null,  // ✅ EXPLICITLY null - no tinting for fixed elements
                    zoomState: frozenZoomState,
                    opacity: 1.0,
                    blendMode: "source-over"
                });
                console.log("  ✅ Fixed extras (table/candles) drawn without tinting");
            } catch (error) {
                console.log("  ⚠️ Fixed extras not found, skipping:", error.message);
            }

            console.log("✅ Extras step completed");
            
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
            // Reset all styling including background from fabric mode
            dom.roomMockup.style.cssText = "width: 600px; height: 450px; position: relative; background-image: none; background-color: var(--color-bg-medium);";
            ensureButtonsAfterUpdate();

            
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

        // ✅ RESTORE PRESERVED SETTINGS AT THE END
        Object.assign(furnitureViewSettings, preservedSettings);
        console.log("✅ Zoom settings restored after rendering:", furnitureViewSettings);

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
                c => c && typeof c.name === 'string' && c.name.toLowerCase() === "coordinates"
            );
            if (!collection) {
                console.error("Coordinates collection not found in appState.collections");
                return null;
            }
            const pattern = collection.patterns.find(
                p => p && typeof p.name === 'string' && patternName && typeof patternName === 'string' && 
                p.name.toLowerCase() === patternName.toLowerCase()
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

    // ✅ FIX: Define handleCoordinateClick outside setupCoordinateImageHandlers
    // This ensures stable function reference for removeEventListener to work correctly
    async function handleCoordinateClick() {
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
            const normalizedCoordPath = normalizePath(layerPaths[0]);
            console.log(`🔍 Coordinate click path: "${layerPaths[0]}" → normalized: "${normalizedCoordPath}"`);
            coordImage.src = normalizedCoordPath;
            coordImage.onload = async () => {
                // Limit coordinate image dimensions to prevent oversized canvases
                const maxDimension = 400;
                const naturalWidth = coordImage.naturalWidth;
                const naturalHeight = coordImage.naturalHeight;
                const scale = Math.min(maxDimension / naturalWidth, maxDimension / naturalHeight, 1);
                const imageWidth = Math.floor(naturalWidth * scale);
                const imageHeight = Math.floor(naturalHeight * scale);
                
                console.log(`📐 Coordinate image sizing: natural(${naturalWidth}x${naturalHeight}) → scaled(${imageWidth}x${imageHeight})`);    
        
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
                layerData.input.value = getCleanColorName(initialColor);
                layerData.circle.style.backgroundColor = lookupColor(initialColor) || "#FFFFFF";
                
                // ✅ ADD THIS LINE - append to DOM
                dom.layerInputsContainer.appendChild(layerData.container);
                
                appState.layerInputs[index] = layerData;
                console.log(`Set ${layer.label} input to ${layerData.input.value}, circle to ${layerData.circle.style.backgroundColor}, id=${id}`);
            });

        
                // Update UI
                // updatePreview();
                // const isFurniturePattern = appState.currentPattern?.isFurniture || false;

                
                updatePreview();
                
                // Check if we're in fabric mode - if so, only render fabric mockup
                if (appState.isInFabricMode) {
                    console.log("🧵 handleCoordinateClick in fabric mode - calling renderFabricMockup()");
                    await renderFabricMockup();
                } else {
                    updateRoomMockup();
                }
        
                // Add "Back to Pattern" link
                console.log("🔍 Adding Back to Pattern button...");
                const coordinatesContainer = document.getElementById("coordinatesContainer");
                console.log("🔍 coordinatesContainer found:", !!coordinatesContainer);
                if (coordinatesContainer) {
                    let backLink = document.getElementById("backToPatternLink");
                    if (backLink) {
                        console.log("🔍 Removing existing back link");
                        backLink.remove();
                    }
                    backLink = document.createElement("div");
                    backLink.id = "backToPatternLink";
                    backLink.style.cssText = `
                        color: #f0e6d2 !important;
                        font-family: 'Island Moments', cursive !important;
                        font-size: 1.8rem !important;
                        text-align: center !important;
                        cursor: pointer !important;
                        margin-top: 6rem !important;
                        padding: 0.5rem !important;
                        transition: color 0.2s !important;
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        z-index: 1000 !important;
                        position: relative !important;
                    `;
                    backLink.textContent = "  ← Back to Pattern ";
                    backLink.addEventListener("mouseover", () => {
                        backLink.style.color = "#beac9f";
                    });
                    backLink.addEventListener("mouseout", () => {
                        backLink.style.color = "#f0e6d2";
                    });
                    coordinatesContainer.appendChild(backLink);
                    backLink.addEventListener("click", restoreOriginalPattern);
                    console.log("✅ Back to Pattern button added successfully");
                } else {
                    console.error("❌ coordinatesContainer not found - cannot add back link");
                }
            };
            coordImage.onerror = () => {
                console.error(`Failed to load coordinate image: ${layerPaths[0] || coordinate.layerPath}`);
            };
    }

    // ✅ FIX: setupCoordinateImageHandlers now references stable handleCoordinateClick function
    function setupCoordinateImageHandlers() {
        const coordinateImages = document.querySelectorAll(".coordinate-image");
        console.log(`🔍 Found ${coordinateImages.length} coordinate images to set up handlers`);
        coordinateImages.forEach(image => {
            image.removeEventListener("click", handleCoordinateClick);
            image.addEventListener("click", handleCoordinateClick);
            console.log(`✅ Attached click handler to coordinate: ${image.dataset.filename}`);
        });
    }

    async function restoreOriginalPattern() {
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
            layerData.input.value = getCleanColorName(layer.inputValue);
            layerData.circle.style.backgroundColor = layer.hex;
            appState.layerInputs[index] = layerData;
            console.log(`Restored ${layer.label} input to ${layer.inputValue}, circle to ${layer.hex}, id=${id}`);
        });

        console.log("After restore, layerInputs:", 
                    appState.layerInputs.map(l => ({ id: l.input.id, label: l.label, value: l.input.value })));

        // Update UI
        updatePreview();

        // Check if we're in fabric mode - if so, only render fabric mockup
        if (appState.isInFabricMode) {
            console.log("🧵 restoreOriginalPattern in fabric mode - calling renderFabricMockup()");
            await renderFabricMockup();
        } else {
            updateRoomMockup();
        }
        
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
async function updateDisplays() {
    try {
        console.log('updateDisplays called');
        
        // ✅ Always update pattern preview
        updatePreview();
        
        // Check if we're in fabric mode - if so, only render fabric mockup
        if (appState.isInFabricMode) {
            console.log("🧵 updateDisplays in fabric mode - calling renderFabricMockup()");
            await renderFabricMockup();
        } else {
            updateRoomMockup();
        }
        populateCoordinates();
    } catch (e) {
        console.error('Error in updateDisplays:', e);
    }
}

// ============================================================================
// SECTION 9: COLOR LOCK & THUMBNAILS
// ============================================================================
// Color lock toggle, thumbnail click handling, pattern thumbnail capture.
// Enables scale persistence and color preservation across pattern changes.
// ============================================================================

/**
 * Toggle color lock - when locked, pattern thumbnail clicks preserve current colors
 */
function toggleColorLock() {
    appState.colorsLocked = !appState.colorsLocked;

    const btn = document.getElementById('colorLockBtn');
    const icon = document.getElementById('colorLockIcon');
    const text = document.getElementById('colorLockText');

    if (!btn || !icon || !text) {
        console.warn('Color lock button elements not found');
        return;
    }

    if (appState.colorsLocked) {
        // Locked state
        icon.textContent = '🔒';
        text.textContent = 'Locked';
        btn.style.background = 'rgba(212, 175, 55, 0.3)';
        btn.style.borderColor = '#ffd700';
        console.log('🔒 Color lock enabled - colors will be preserved when changing patterns');
    } else {
        // Unlocked state
        icon.textContent = '🔓';
        text.textContent = 'Unlocked';
        btn.style.background = 'rgba(110, 110, 110, 0.2)';
        btn.style.borderColor = '#d4af37';
        console.log('🔓 Color lock disabled - patterns will load with default colors');
    }
}

// Expose to window for button onclick
window.toggleColorLock = toggleColorLock;

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

    // We'll set canvas size after loading first layer to match actual image dimensions
    const printCanvas = document.createElement("canvas");
    const printCtx = printCanvas.getContext("2d", { willReadFrequently: true });

    const collectionName = toInitialCaps(appState.selectedCollection?.name || "Unknown");
    const patternName = toInitialCaps(appState.currentPattern.name || "Pattern");
    let layerLabels = [];

    const processPrintPreview = async () => {
        const isTintWhite = appState.currentPattern?.tintWhite || false;
        console.log(`Print preview - tintWhite flag: ${isTintWhite}`);

        // Determine canvas size from first layer image (maximum resolution)
        let canvasInitialized = false;

        if (isTintWhite && appState.currentPattern?.baseComposite) {        } else if (appState.currentPattern?.layers?.length) {
            layerLabels = appState.currentPattern.layers.map((l, i) => ({
                label: appState.currentPattern.layerLabels?.[i] || `Layer ${i + 1}`,
                color: appState.layerInputs[i + (isWall ? 2 : 1)]?.input?.value || "Snowbound"
            }));
            
            // Add background color to the beginning of the color list
            layerLabels.unshift({
                label: "Background",
                color: backgroundInput.value || "Snowbound"
            });

            // 🔍 COLOR MAPPING DEBUG - Log background color
            console.log(`🎨 PRINT PATTERN - Background:`);
            console.log(`  - Color name: "${backgroundInput.value}"`);
            console.log(`  - Color RGB:`, backgroundColor);

            const shadowLayers = [];
            const nonShadowLayers = [];
            appState.currentPattern.layers.forEach((layer, index) => {
                // ⚠️ CRITICAL: Account for background at layerLabels[0]
                // layerLabels = ["Background", "Layer 1", "Layer 2", ...]
                // currentPattern.layers[0] should map to layerLabels[1], not [0]
                const label = layerLabels[index + 1].label;
                const isShadow = layer.isShadow === true;
                (isShadow ? shadowLayers : nonShadowLayers).push({ layer, index, label });
            });

            // 🔍 COLOR MAPPING DEBUG - Summary of layer structure
            console.log(`🎨 PRINT PATTERN - Layer Structure:`);
            console.log(`  - Total layers: ${appState.currentPattern.layers.length}`);
            console.log(`  - Shadow layers: ${shadowLayers.length}`, shadowLayers.map(l => `${l.index}:${l.label}`));
            console.log(`  - Non-shadow layers: ${nonShadowLayers.length}`, nonShadowLayers.map(l => `${l.index}:${l.label}`));
            console.log(`  - layerLabels length: ${layerLabels.length} (includes background at [0])`);
            console.log(`  - appState.layerInputs length: ${appState.layerInputs.length}`);

            let nonShadowInputIndex = isWall ? 2 : 1;

            for (const { layer, index, label } of shadowLayers) {
                // ⚠️ CRITICAL: Use proofPath (high-res ~3600px) NOT path (preview ~1400px)
                // proofPath: ./data/collections/{collection}/proof-layers/*.jpg (3600px)
                // path: ./data/collections/{collection}/layers/*.jpg (1400px)
                const layerPath = layer.proofPath || layer.path || "";
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
                                // Initialize canvas from first image if not yet done
                                if (!canvasInitialized) {
                                    const canvasWidth = img.naturalWidth || img.width;
                                    const canvasHeight = img.naturalHeight || img.height;
                                    printCanvas.width = canvasWidth;
                                    printCanvas.height = canvasHeight;
                                    console.log(`🔧 Print canvas at FULL resolution: ${canvasWidth}x${canvasHeight}`);

                                    // Fill background
                                    printCtx.fillStyle = backgroundColor;
                                    printCtx.fillRect(0, 0, canvasWidth, canvasHeight);
                                    canvasInitialized = true;
                                }

                                printCtx.globalCompositeOperation = "multiply";
                                printCtx.globalAlpha = 0.3;
                                printCtx.drawImage(img, 0, 0, printCanvas.width, printCanvas.height);
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
                // ⚠️ CRITICAL: Use proofPath (high-res ~3600px) NOT path (preview ~1400px)
                // proofPath: ./data/collections/{collection}/proof-layers/*.jpg (3600px)
                // path: ./data/collections/{collection}/layers/*.jpg (1400px)
                const layerPath = layer.proofPath || layer.path || "";
                const layerInput = appState.layerInputs[nonShadowInputIndex];
                const layerColor = lookupColor(layerInput?.input?.value || "Snowbound");

                // 🔍 COLOR MAPPING DEBUG - Investigating color mismatch issue
                console.log(`🎨 PRINT PATTERN - Non-shadow layer ${index}:`);
                console.log(`  - Label: "${label}"`);
                console.log(`  - Input index: ${nonShadowInputIndex}`);
                console.log(`  - layerInput exists:`, !!layerInput);
                console.log(`  - Color name from input: "${layerInput?.input?.value}"`);
                console.log(`  - Color RGB lookup:`, layerColor);
                console.log(`  - Layer path:`, layer.proofPath ? 'PROOF PATH (high-res)' : 'preview path (fallback)');
                console.log(`  - Expected from layerLabels[${index + 1}]:`, layerLabels[index + 1]?.color);

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
                                // Initialize canvas from first image if not yet done
                                if (!canvasInitialized) {
                                    const canvasWidth = img.naturalWidth || img.width;
                                    const canvasHeight = img.naturalHeight || img.height;
                                    printCanvas.width = canvasWidth;
                                    printCanvas.height = canvasHeight;
                                    console.log(`🔧 Print canvas at FULL resolution: ${canvasWidth}x${canvasHeight}`);

                                    // Fill background
                                    printCtx.fillStyle = backgroundColor;
                                    printCtx.fillRect(0, 0, canvasWidth, canvasHeight);
                                    canvasInitialized = true;
                                }

                                printCtx.globalCompositeOperation = "source-over";
                                printCtx.globalAlpha = 1.0;
                                printCtx.drawImage(img, 0, 0, printCanvas.width, printCanvas.height);
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

        // Apply tiling based on scale setting (same logic as proof downloads)
        if (appState.currentScale && appState.currentScale !== 100) {
            console.log(`🔧 Print preview: Applying scale ${appState.currentScale}% (tiling pattern)`);

            // Save the single-tile pattern
            const singleTileCanvas = document.createElement('canvas');
            singleTileCanvas.width = printCanvas.width;
            singleTileCanvas.height = printCanvas.height;
            const singleTileCtx = singleTileCanvas.getContext('2d');
            singleTileCtx.drawImage(printCanvas, 0, 0);

            // Calculate effective scale (inverted: 2X = pattern appears smaller)
            const effectiveScale = appState.currentScale / 100; // 200% = 2.0
            const scaledWidth = singleTileCanvas.width / effectiveScale;
            const scaledHeight = singleTileCanvas.height / effectiveScale;

            console.log(`  Single tile: ${singleTileCanvas.width}x${singleTileCanvas.height}`);
            console.log(`  Scaled tile: ${scaledWidth}x${scaledHeight}`);
            console.log(`  Tiles to fit: ~${Math.ceil(printCanvas.width / scaledWidth)}x${Math.ceil(printCanvas.height / scaledHeight)}`);

            // Clear the main canvas and redraw with tiling
            printCtx.clearRect(0, 0, printCanvas.width, printCanvas.height);

            // Fill background color first
            printCtx.fillStyle = backgroundColor;
            printCtx.fillRect(0, 0, printCanvas.width, printCanvas.height);

            // Tile the pattern across the canvas at scaled size
            for (let y = 0; y < printCanvas.height; y += scaledHeight) {
                for (let x = 0; x < printCanvas.width; x += scaledWidth) {
                    printCtx.drawImage(singleTileCanvas, x, y, scaledWidth, scaledHeight);
                }
            }

            console.log(`✅ Print preview: Pattern tiled at ${appState.currentScale}% scale`);
        } else {
            console.log(`🔧 Print preview: No scaling (100% - single tile)`);
        }

        const dataUrl = printCanvas.toDataURL("image/png");
        console.log(`Print preview - Generated data URL, length: ${dataUrl.length}`);

        // Generate HTML content
        // Determine tiling method and scale display
        const tilingMethod = appState.currentPattern?.tilingType === 'half-drop' ? 'Half-Drop' :
                           appState.currentPattern?.tilingType === 'brick' ? 'Brick' :
                           'Normal';
        const scaleDisplay = appState.currentScale === 50 ? '0.5X' :
                           appState.currentScale === 200 ? '2X' :
                           appState.currentScale === 300 ? '3X' :
                           appState.currentScale === 400 ? '4X' :
                           '1X';

        let textContent = `
            <img src="https://so-animation.com/colorflex/img/SC-header-mage.jpg" alt="SC Logo" class="sc-logo">
            <h2>${collectionName}</h2>
            <h3>${patternName}</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Tiling: ${tilingMethod} | Repeat: ${scaleDisplay}</strong></p>
            <ul style="list-style: none; padding: 0;">
        `;
        layerLabels.forEach(({ label, color }, index) => {
            // Use the actual user-selected color, not curated colors
            textContent += `
                <li>${toInitialCaps(label)} | ${color}</li>
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
                            width: 400px !important;
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

    // Add chameleon icon next to save button
    setTimeout(() => {
        addSaveButton(); // This function adds the chameleon icon
    }, 1000); // Wait for DOM to be ready
}

// Expose startApp to window so Shopify template can access it
window.startApp = startApp;

// THUMBNAIL CAPTURE SYSTEM
console.log('🎯 Thumbnail Capture System initializing...');
console.log('🔍 Current DOM ready state:', document.readyState);
console.log('🔍 Current timestamp:', Date.now());

// Function to capture pattern thumbnail using the same method as print function
function capturePatternThumbnailBuiltIn() {
    console.log('📸📸📸 THUMBNAIL CAPTURE START 📸📸📸');
    console.log('📸 Current pattern:', appState.currentPattern?.name);
    console.log('📸 Current pattern ID from layers:', generatePatternId(
        appState.currentPattern?.name,
        appState.currentLayers,
        appState.currentScale
    ));

    return new Promise(async (resolve) => {
        if (!appState.currentPattern) {
            console.warn('⚠️ No current pattern selected for thumbnail');
            resolve(null);
            return;
        }

        try {
            const isWall = appState.currentPattern?.isWall || appState.selectedCollection?.name === "wall-panels";
            const backgroundIndex = isWall ? 1 : 0;
            const backgroundInput = appState.layerInputs[backgroundIndex]?.input;

            if (!backgroundInput) {
                console.warn('⚠️ Background input not found for thumbnail');
                console.log('⚠️ Available layerInputs:', appState.layerInputs);
                resolve(null);
                return;
            }

            const backgroundColor = lookupColor(backgroundInput.value);
            console.log('📸 Thumbnail - Background color:', backgroundColor);
            console.log('📸 Thumbnail - Background input value:', backgroundInput.value);

            // Debug all layer inputs - THIS IS CRITICAL
            console.log('📸 Thumbnail - All layer inputs at capture time:');
            appState.layerInputs.forEach((layerInput, index) => {
                if (layerInput && layerInput.input) {
                    const colorValue = layerInput.input.value;
                    const resolvedColor = lookupColor(colorValue);
                    console.log(`  Layer ${index}: "${colorValue}" -> ${resolvedColor}`);
                }
            });

            // Also log currentLayers for comparison
            console.log('📸 Thumbnail - currentLayers at capture time:');
            appState.currentLayers?.forEach((layer, index) => {
                console.log(`  Layer ${index}:`, layer);
            });

            // 🎨 ASPECT RATIO FIX: Create canvas with pattern's actual proportions
            const thumbCanvas = document.createElement('canvas');
            const thumbCtx = thumbCanvas.getContext('2d', { willReadFrequently: true });

            // Get pattern dimensions to preserve aspect ratio
            const patternSize = appState.currentPattern.size || [24, 24]; // Default to square if no size
            const patternWidthInches = patternSize[0];
            const patternHeightInches = patternSize[1];
            const aspectRatio = patternWidthInches / patternHeightInches;

            // Set canvas size to maintain aspect ratio (max 800px on longest side)
            const maxSize = 800;
            let canvasWidth, canvasHeight;

            if (aspectRatio >= 1) {
                // Wider or square - constrain width to maxSize
                canvasWidth = maxSize;
                canvasHeight = Math.round(maxSize / aspectRatio);
            } else {
                // Taller - constrain height to maxSize
                canvasHeight = maxSize;
                canvasWidth = Math.round(maxSize * aspectRatio);
            }

            thumbCanvas.width = canvasWidth;
            thumbCanvas.height = canvasHeight;

            console.log(`📸 Pattern dimensions: ${patternWidthInches}"x${patternHeightInches}" (${aspectRatio.toFixed(2)}:1)`);
            console.log(`📸 Canvas size: ${canvasWidth}x${canvasHeight}px (preserves aspect ratio)`);

            // Get scale for tiling - convert currentScale (100, 200, 300) to actual multiplier (1, 2, 3)
            const currentScalePercent = appState.currentScale || 100;
            const scale = currentScalePercent / 100; // 200 → 2.0, 300 → 3.0, 100 → 1.0
            console.log(`📸 Scale for tiling: ${scale}x (from currentScale: ${currentScalePercent}%)`);

            // Fill background
            thumbCtx.fillStyle = backgroundColor;
            thumbCtx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Process layers like the print function does
            if (appState.currentPattern?.layers?.length) {
                const shadowLayers = [];
                const nonShadowLayers = [];
                
                appState.currentPattern.layers.forEach((layer, index) => {
                    const isShadow = layer.isShadow === true;
                    (isShadow ? shadowLayers : nonShadowLayers).push({ layer, index });
                });

                // Process shadow layers first
                for (const { layer, index } of shadowLayers) {
                    await new Promise((layerResolve) => {
                        processImage(
                            layer.path || "",
                            (processedUrl) => {
                                const img = new Image();
                                if (processedUrl instanceof HTMLCanvasElement) {
                                    img.src = processedUrl.toDataURL("image/png");
                                } else {
                                    img.src = processedUrl;
                                }
                                img.onload = () => {
                                    thumbCtx.globalCompositeOperation = "multiply";
                                    thumbCtx.globalAlpha = 0.3;

                                    // Apply tiling based on scale (divide to make tiles smaller = more tiles)
                                    if (scale !== 1.0) {
                                        const tileWidth = canvasWidth / scale;
                                        const tileHeight = canvasHeight / scale;
                                        for (let x = 0; x < canvasWidth; x += tileWidth) {
                                            for (let y = 0; y < canvasHeight; y += tileHeight) {
                                                thumbCtx.drawImage(img, x, y, tileWidth, tileHeight);
                                            }
                                        }
                                    } else {
                                        thumbCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                                    }

                                    thumbCtx.globalCompositeOperation = "source-over";
                                    thumbCtx.globalAlpha = 1.0;
                                    layerResolve();
                                };
                                img.onerror = () => layerResolve();
                            },
                            null,
                            2.2,
                            true,
                            isWall
                        );
                    });
                }

                // Process non-shadow layers
                let nonShadowInputIndex = isWall ? 2 : 1;
                for (const { layer, index } of nonShadowLayers) {
                    const layerInput = appState.layerInputs[nonShadowInputIndex]?.input;
                    const layerColor = layerInput ? lookupColor(layerInput.value) : "#ffffff";
                    
                    await new Promise((layerResolve) => {
                        processImage(
                            layer.path || "",
                            (processedUrl) => {
                                const img = new Image();
                                if (processedUrl instanceof HTMLCanvasElement) {
                                    img.src = processedUrl.toDataURL("image/png");
                                } else {
                                    img.src = processedUrl;
                                }
                                img.onload = () => {
                                    // Apply tiling based on scale (divide to make tiles smaller = more tiles)
                                    if (scale !== 1.0) {
                                        const tileWidth = canvasWidth / scale;
                                        const tileHeight = canvasHeight / scale;
                                        for (let x = 0; x < canvasWidth; x += tileWidth) {
                                            for (let y = 0; y < canvasHeight; y += tileHeight) {
                                                thumbCtx.drawImage(img, x, y, tileWidth, tileHeight);
                                            }
                                        }
                                    } else {
                                        thumbCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                                    }
                                    layerResolve();
                                };
                                img.onerror = () => layerResolve();
                            },
                            layerColor,
                            2.2,
                            false,
                            isWall
                        );
                    });
                    nonShadowInputIndex++;
                }
            }

            const dataUrl = thumbCanvas.toDataURL('image/jpeg', 0.9);
            console.log('✅ Thumbnail captured successfully using print method');
            resolve(dataUrl);

        } catch (error) {
            console.error('❌ Failed to capture thumbnail:', error);
            resolve(null);
        }
    });
}

// Initialize thumbnail capture system by overriding the saveToMyList function
function initializeThumbnailCapture() {
    console.log('🎯 Initializing thumbnail capture by overriding saveToMyList function...');
    
    // Wait for the original saveToMyList function to be defined
    const waitForSaveFunction = () => {
        if (window.saveToMyList && typeof window.saveToMyList === 'function') {
            console.log('✅ Found original saveToMyList function, overriding with thumbnail capture...');
            
            // Store reference to original function
            const originalSaveToMyList = window.saveToMyList;
            
            // Override with our thumbnail-capturing version
            window.saveToMyList = async function() {
                console.log('🎯 THUMBNAIL CAPTURE: saveToMyList called!');

                // 🔄 CHECK FOR EXACT DUPLICATE (same ID)
                const currentPatternName = window.appState?.currentPattern?.name;
                const currentScale = window.appState?.currentScale || 100;
                let replaceExistingIndex = -1; // Index to replace if exact duplicate found

                console.log('🔍🔍🔍 SAVE DUPLICATE CHECK START 🔍🔍🔍');
                console.log('Current pattern name:', currentPatternName);
                console.log('Current scale:', currentScale);
                console.log('Current layers:', window.appState.currentLayers);

                if (currentPatternName) {
                    const existingPatterns = JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');
                    console.log('📋 Existing patterns count:', existingPatterns.length);
                    existingPatterns.forEach((p, idx) => {
                        console.log(`  [${idx}] ${p.patternName} - ID: ${p.id} - Scale: ${p.currentScale}`);
                    });

                    // ✅ FIX: Generate current pattern ID WITH scale to get accurate comparison
                    const currentPatternId = generatePatternId(currentPatternName, window.appState.currentLayers, currentScale);
                    console.log('🆔 Current pattern FULL ID (with scale):', currentPatternId);

                    // Find patterns with the same FULL ID (name + colors + scale)
                    const exactMatchIndex = existingPatterns.findIndex(p => p.id === currentPatternId);

                    // ✅ SIMPLIFIED LOGIC:
                    // - If exact ID match exists (same name + colors + scale), silently replace to update
                    // - If different colors/scale, IDs are different so save as new variant
                    // - NO DIALOG - identical designs auto-update, variants auto-save

                    console.log('🔍 Exact ID match index:', exactMatchIndex);

                    if (exactMatchIndex !== -1) {
                        // Exact match found - silently replace to update thumbnail
                        replaceExistingIndex = exactMatchIndex;
                        console.log('✅ Exact duplicate found - will silently replace to update');
                        console.log('   Existing pattern:', existingPatterns[exactMatchIndex]);
                    } else {
                        // No exact match - this is a new pattern or variant
                        console.log('✅ No exact ID match - saving as new pattern/variant');
                    }
                }

                // If user wants to replace, delete the old version first
                if (replaceExistingIndex !== -1) {
                    const existingPatterns = JSON.parse(localStorage.getItem('colorflexSavedPatterns') || '[]');
                    const deletedPattern = existingPatterns[replaceExistingIndex];
                    console.log('🗑️ Deleting old version before saving new one:', deletedPattern.id);
                    existingPatterns.splice(replaceExistingIndex, 1);
                    localStorage.setItem('colorflexSavedPatterns', JSON.stringify(existingPatterns));
                }

                try {
                    // Force preview update to ensure we capture current colors
                    console.log('🔄 Forcing preview refresh before thumbnail capture...');
                    console.log('Current pattern name at save time:', window.appState?.currentPattern?.name);
                    console.log('Current layer values:', window.appState.layerInputs?.map(l => ({
                        label: l.label,
                        value: l.input?.value
                    })));

                    if (typeof updatePreview === 'function') {
                        await updatePreview();
                        console.log('✅ Preview refreshed with current colors');
                    }

                    // Longer delay to ensure pattern is fully loaded and rendered
                    console.log('⏳ Waiting 800ms for pattern to fully render...');
                    await new Promise(resolve => setTimeout(resolve, 800));

                    // Capture thumbnail with current state
                    console.log('📸 Starting thumbnail capture with CURRENT colors...');
                    console.log('Pattern layers at capture time:', window.appState.currentLayers);
                    const thumbnail = await capturePatternThumbnailBuiltIn();
                    console.log('📸 Thumbnail size:', thumbnail?.length, 'bytes');

                    if (thumbnail) {
                        console.log('✅ Thumbnail captured successfully, adding to save...');

                        // Override localStorage temporarily
                        const originalSetItem = localStorage.setItem;
                        let localStorageCallCount = 0;

                        localStorage.setItem = function(key, value) {
                            if (key === 'colorflexSavedPatterns') {
                                localStorageCallCount++;
                                console.log(`🎯 localStorage save call #${localStorageCallCount} - adding thumbnail...`);
                                try {
                                    const patterns = JSON.parse(value);

                                    // Find the last pattern (the one being saved)
                                    const lastPattern = patterns[patterns.length - 1];

                                    if (lastPattern) {
                                        // Add thumbnail to pattern
                                        lastPattern.thumbnail = thumbnail;
                                        console.log('✅ Thumbnail added to pattern:', lastPattern.patternName, 'ID:', lastPattern.id);
                                    }

                                    value = JSON.stringify(patterns);
                                } catch (error) {
                                    console.error('❌ Error adding thumbnail:', error);
                                }
                            }
                            return originalSetItem.call(this, key, value);
                        };

                        // Call the original save function
                        console.log('📝 Calling original saveToMyList function...');
                        originalSaveToMyList.call(this);

                        // Restore localStorage after delay
                        setTimeout(() => {
                            localStorage.setItem = originalSetItem;
                            console.log('🔄 localStorage setItem restored');
                        }, 2000);

                    } else {
                        console.warn('⚠️ Thumbnail capture failed, saving without thumbnail');
                        originalSaveToMyList.call(this);
                    }
                } catch (error) {
                    console.error('❌ Error in thumbnail capture:', error);
                    originalSaveToMyList.call(this);
                }
            };
            
            console.log('✅ Thumbnail capture system fully initialized by overriding saveToMyList!');
        } else {
            console.log('⏳ saveToMyList function not found yet, retrying...');
            setTimeout(waitForSaveFunction, 1000);
        }
    };
    
    // Start waiting for the save function
    waitForSaveFunction();
}

// Run immediately if DOM is already ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        startApp();
        initializeThumbnailCapture();
    });
} else {
    startApp();
    initializeThumbnailCapture();
}

// ============================================================================
// SECTION 10: PATTERN HELPERS & FABRIC MODE
// ============================================================================
// Pattern type detection, color mapping, fabric tuning controls,
// fabric mode toggle, and fabric-specific rendering functions.
// ============================================================================

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



// Add fabric tuning controls
function addFabricTuningControls() {
    // Check if controls should be shown
    if (!SHOW_FABRIC_CONTROLS) {
        return; // Exit early if controls are disabled
    }
    
    // Remove existing controls
    const existingControls = document.getElementById('fabricTuningControls');
    if (existingControls) {
        existingControls.remove();
    }
    
    // Create control panel
    const controlPanel = document.createElement('div');
    controlPanel.id = 'fabricTuningControls';
    controlPanel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #d4af37;
        z-index: 1000;
        font-family: monospace;
        font-size: 12px;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    `;
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = '🧵 Fabric Tuning';
    title.style.cssText = 'margin: 0 0 10px 0; color: #d4af37; font-size: 14px;';
    controlPanel.appendChild(title);
    
    // Create sliders for each parameter
    const params = [
        { key: 'alphaStrength', label: 'Pattern Opacity', min: 0, max: 2, step: 0.1 },
        { key: 'baseTintStrength', label: 'Base Color Tint', min: 0, max: 2, step: 0.1 },
        { key: 'patternContrast', label: 'Pattern Contrast', min: 0.1, max: 3, step: 0.1 },
        { key: 'shadowMultiplier', label: 'Shadow Interaction', min: 0, max: 2, step: 0.1 },
        { key: 'colorVibrance', label: 'Color Vibrance', min: 0, max: 2, step: 0.1 },
        { key: 'glossyStrength', label: 'Glossy Finish', min: 0, max: 2, step: 0.1 }
    ];
    
    // Add blend mode selector
    const blendModeContainer = document.createElement('div');
    blendModeContainer.style.cssText = 'margin-bottom: 10px;';
    
    const blendModeLabel = document.createElement('label');
    blendModeLabel.textContent = 'Blend Mode';
    blendModeLabel.style.cssText = 'display: block; margin-bottom: 3px; font-weight: bold;';
    
    const blendModeSelect = document.createElement('select');
    blendModeSelect.style.cssText = 'width: 100%; padding: 2px; background: #333; color: white; border: 1px solid #555;';
    
    const blendModes = [
        { value: 'auto', label: 'Auto (Smart)' },
        { value: 'multiply', label: 'Multiply' },
        { value: 'overlay', label: 'Overlay' },
        { value: 'soft-light', label: 'Soft Light' },
        { value: 'hard-light', label: 'Hard Light' },
        { value: 'screen', label: 'Screen' }
    ];
    
    blendModes.forEach(mode => {
        const option = document.createElement('option');
        option.value = mode.value;
        option.textContent = mode.label;
        if (mode.value === fabricTuning.blendMode) {
            option.selected = true;
        }
        blendModeSelect.appendChild(option);
    });
    
    blendModeSelect.addEventListener('change', (e) => {
        fabricTuning.blendMode = e.target.value;
        debouncedFabricRender();
    });
    
    blendModeContainer.appendChild(blendModeLabel);
    blendModeContainer.appendChild(blendModeSelect);
    controlPanel.appendChild(blendModeContainer);
    
    params.forEach(param => {
        const container = document.createElement('div');
        container.style.cssText = 'margin-bottom: 10px;';
        
        const label = document.createElement('label');
        label.textContent = param.label;
        label.style.cssText = 'display: block; margin-bottom: 3px; font-weight: bold;';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = param.min;
        slider.max = param.max;
        slider.step = param.step;
        slider.value = fabricTuning[param.key];
        slider.style.cssText = 'width: 100%; margin-bottom: 2px;';
        
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = fabricTuning[param.key].toFixed(1);
        valueDisplay.style.cssText = 'color: #d4af37; font-weight: bold;';
        
        // Update function
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            fabricTuning[param.key] = value;
            valueDisplay.textContent = value.toFixed(1);
            
            // Re-render fabric in real-time with debounce
            debouncedFabricRender();
        });
        
        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        controlPanel.appendChild(container);
    });
    
    // Add reset button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset to Defaults';
    resetBtn.style.cssText = `
        background: #d4af37;
        color: black;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: bold;
        margin-top: 10px;
        width: 100%;
    `;
    
    resetBtn.addEventListener('click', () => {
        fabricTuning.alphaStrength = 1.0;
        fabricTuning.baseTintStrength = 1.0;
        fabricTuning.patternContrast = 1.0;
        fabricTuning.shadowMultiplier = 1.0;
        fabricTuning.colorVibrance = 1.2;
        fabricTuning.blendMode = 'auto';
        fabricTuning.glossyStrength = 1.0;
        
        // Update slider values
        controlPanel.querySelectorAll('input[type="range"]').forEach((slider, index) => {
            slider.value = Object.values(fabricTuning)[index];
        });
        controlPanel.querySelectorAll('span').forEach((span, index) => {
            if (index < 5) { // Only update value displays
                span.textContent = Object.values(fabricTuning)[index].toFixed(1);
            }
        });
        
        // Update blend mode selector
        const blendModeSelect = controlPanel.querySelector('select');
        if (blendModeSelect) {
            blendModeSelect.value = fabricTuning.blendMode;
        }
        
        // Re-render with debounce
        debouncedFabricRender();
    });
    
    controlPanel.appendChild(resetBtn);
    
    // Add copy values button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy Values to Console';
    copyBtn.style.cssText = `
        background: #4a5568;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: bold;
        margin-top: 5px;
        width: 100%;
    `;
    
    copyBtn.addEventListener('click', () => {
        console.log('🧵 Current fabric tuning values:');
        console.log('fabricTuning = {');
        Object.entries(fabricTuning).forEach(([key, value]) => {
            console.log(`    ${key}: ${value},`);
        });
        console.log('};');
    });
    
    controlPanel.appendChild(copyBtn);
    
    // Add to document
    document.body.appendChild(controlPanel);
}

// Function to remove fabric tuning controls
function removeFabricTuningControls() {
    const existingControls = document.getElementById('fabricTuningControls');
    if (existingControls) {
        existingControls.remove();
    }
}

// Simple fabric mockup function
async function renderFabricMockup() {
    console.log("🧵 ================================");
    console.log("🧵 FABRIC MOCKUP STARTING");
    console.log("🧵 ================================");

    // ✅ CRITICAL: Wait for furniture config to load if not ready yet
    if (!furnitureConfig) {
        console.log("⏳ Waiting for furniture config to load...");
        await loadFurnitureConfig();
        console.log("✅ Furniture config loaded, proceeding with mockup render");
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Will be dynamically sized based on first loaded image
    let canvasWidth = 600;  // Default fallback
    let canvasHeight = 450; // Default fallback

    // Get fabric config with error handling
    console.log("🔍 Global furnitureConfig:", furnitureConfig);
    console.log("🔍 AppState furnitureConfig:", appState.furnitureConfig);
    console.log("🔍 Collection furnitureConfig:", appState.selectedCollection?.furnitureConfig);

    // Try to get furniture config from collection first, then appState, then global
    let actualFurnitureConfig = appState.selectedCollection?.furnitureConfig || appState.furnitureConfig || furnitureConfig;
    console.log("🔍 Using furnitureConfig:", actualFurnitureConfig);

    // Check if this is a clothing or furniture collection
    const isClothingCollection = appState.selectedCollection?.name?.includes('.clo-');
    const isFurnitureCollection = appState.selectedCollection?.name?.includes('.fur-');

    // Configure image smoothing for sharper rendering (especially important for clothing with fine details)
    // Disable smoothing for clothing to preserve fine lines and prevent muddiness
    if (isClothingCollection || isFurnitureCollection) {
        ctx.imageSmoothingEnabled = false; // Sharper, no anti-aliasing blur
        console.log('🔧 Image smoothing DISABLED for clothing/furniture (sharper rendering)');
    } else {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "medium"; // Reduced from "high" to prevent muddiness
        console.log('🔧 Image smoothing enabled (medium quality) for fabric');
    }

    // Determine which config to use based on mode
    let configKey = 'fabric';
    if (isClothingCollection) {
        // CLOTHING MODE: Check if CLO-2 (pants-suit) or CLO-1 (dress)
        if (appState.selectedCollection?.name?.includes('.clo-2')) {
            configKey = 'clothing-pants';
        } else {
            configKey = 'clothing';
        }
    } else if (isFurnitureCollection) {
        // FURNITURE MODE
        configKey = 'furniture';
        console.log(`🪑 FURNITURE MODE: Using furniture config: ${configKey}`);
    } else {
        console.log(`🧵 FABRIC MODE: Using fabric config: ${configKey}`);
    }
    console.log(`🔍 Collection type: ${configKey} (${appState.selectedCollection?.name})`);

    const fabricConfig = actualFurnitureConfig?.[configKey];

    if (!fabricConfig) {
        console.error(`❌ ${configKey} config not found in furnitureConfig!`);
        console.log("🔍 Available furniture config keys:", Object.keys(actualFurnitureConfig || {}));
        return;
    }

    console.log(`🔍 ${configKey} config:`, fabricConfig);
    
    // Get background color (first layer is Background)
    console.log("🔍 Current layers:", appState.currentLayers);
    console.log("🔍 First layer:", appState.currentLayers[0]);
    const backgroundColor = lookupColor(appState.currentLayers[0]?.color || "Snowbound");
    console.log("🎨 Background color:", backgroundColor);
    console.log("🔍 Base tint strength:", fabricTuning.baseTintStrength);
    
    try {
        // 1. Load and draw room mockup background
        const mockupBg = new Image();
        mockupBg.crossOrigin = "anonymous";
        
        await new Promise((resolve, reject) => {
            mockupBg.onload = resolve;
            mockupBg.onerror = reject;
            mockupBg.src = `https://so-animation.com/colorflex/${fabricConfig.mockup}`;
        });
        
        // Set canvas size to NATIVE 4K image dimensions for full-resolution compositing
        // Use naturalWidth/naturalHeight to get actual file dimensions, not display size
        const isClothingMode = appState.selectedCollection?.name?.includes('.clo-');
        canvasWidth = mockupBg.naturalWidth || mockupBg.width;
        canvasHeight = mockupBg.naturalHeight || mockupBg.height;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        console.log(`📐 Canvas using NATIVE image dimensions: ${canvasWidth}x${canvasHeight} (4K resolution)`);
        
        // Draw room background at full resolution
        ctx.drawImage(mockupBg, 0, 0);

        // 2. Load fabric base for later use (includes dress-base for clothing)
        let fabricBase = null;
        let tintedDressBase = null; // Separate variable for tinted dress-base in clothing mode

        if (fabricConfig.base) {
            fabricBase = new Image();
            fabricBase.crossOrigin = "anonymous";

            await new Promise((resolve, reject) => {
                fabricBase.onload = resolve;
                fabricBase.onerror = reject;
                fabricBase.src = `https://so-animation.com/colorflex/${fabricConfig.base}`;
            });

            const fabricBaseWidth = fabricBase.naturalWidth || fabricBase.width;
            const fabricBaseHeight = fabricBase.naturalHeight || fabricBase.height;
            console.log(`📐 Fabric base loaded at NATIVE resolution: ${fabricBaseWidth}x${fabricBaseHeight}`);

            // For clothing mode: Create tinted dress-base canvas at NATIVE 4K resolution
            const isClothingMode = appState.selectedCollection?.name?.includes('.clo-');
            if (isClothingMode) {
                tintedDressBase = document.createElement("canvas");
                const tintCtx = tintedDressBase.getContext("2d");
                tintedDressBase.width = fabricBaseWidth;
                tintedDressBase.height = fabricBaseHeight;

                // Configure image smoothing for tinted dress-base (sharper for clothing)
                tintCtx.imageSmoothingEnabled = false; // Sharp rendering for dress-base

                // Draw dress-base at its native 4K size
                tintCtx.drawImage(fabricBase, 0, 0, fabricBaseWidth, fabricBaseHeight);

                // Extract alpha channel and apply background color tint
                const baseImageData = tintCtx.getImageData(0, 0, fabricBaseWidth, fabricBaseHeight);
                const baseData = baseImageData.data;

                // Parse background color
                const bgColorMatch = backgroundColor.match(/^#([0-9a-f]{6})$/i);
                if (bgColorMatch) {
                    const bgR = parseInt(bgColorMatch[1].substr(0, 2), 16);
                    const bgG = parseInt(bgColorMatch[1].substr(2, 2), 16);
                    const bgB = parseInt(bgColorMatch[1].substr(4, 2), 16);

                    for (let j = 0; j < baseData.length; j += 4) {
                        const alpha = baseData[j + 3];
                        if (alpha > 0) {
                            const tintStrength = fabricTuning.baseTintStrength;
                            const r = baseData[j];
                            const g = baseData[j + 1];
                            const b = baseData[j + 2];

                            // Apply background color tint
                            baseData[j] = Math.floor(bgR * tintStrength + r * (1 - tintStrength));
                            baseData[j + 1] = Math.floor(bgG * tintStrength + g * (1 - tintStrength));
                            baseData[j + 2] = Math.floor(bgB * tintStrength + b * (1 - tintStrength));
                        }
                    }

                    tintCtx.putImageData(baseImageData, 0, 0);
                }

                console.log("✅ Created tinted dress-base for clothing mode");
            }
        } else {
            console.log("⏭️  No base layer configured");
        }

        // 3. Create base canvas for pattern layers or tinted fabric base
        let baseCanvas = null;
        let baseCtx = null;

        if (fabricBase && !tintedDressBase) {
            // Fabric mode: Create tinted base using alpha channel
            baseCanvas = document.createElement("canvas");
            baseCtx = baseCanvas.getContext("2d");
            baseCanvas.width = canvasWidth;
            baseCanvas.height = canvasHeight;

            // Draw fabric base to get alpha channel at full resolution
            baseCtx.drawImage(fabricBase, 0, 0, canvasWidth, canvasHeight);

            // Extract alpha channel and apply background color tint
            const baseImageData = baseCtx.getImageData(0, 0, canvasWidth, canvasHeight);
            const baseData = baseImageData.data;

            // Parse background color
            const bgColorMatch = backgroundColor.match(/^#([0-9a-f]{6})$/i);
            if (bgColorMatch) {
                const bgR = parseInt(bgColorMatch[1].substr(0, 2), 16);
                const bgG = parseInt(bgColorMatch[1].substr(2, 2), 16);
                const bgB = parseInt(bgColorMatch[1].substr(4, 2), 16);

                for (let j = 0; j < baseData.length; j += 4) {
                    const r = baseData[j];
                    const g = baseData[j + 1];
                    const b = baseData[j + 2];
                    const alpha = baseData[j + 3];

                    if (alpha > 0) {
                        const tintStrength = fabricTuning.baseTintStrength;

                        // Apply background color tint
                        baseData[j] = Math.floor(bgR * tintStrength + r * (1 - tintStrength));
                        baseData[j + 1] = Math.floor(bgG * tintStrength + g * (1 - tintStrength));
                        baseData[j + 2] = Math.floor(bgB * tintStrength + b * (1 - tintStrength));
                        // Keep original alpha channel
                    }
                }

                baseCtx.putImageData(baseImageData, 0, 0);
            }

            console.log("✅ Created tinted base layer for fabric mode");
        } else {
            // Clothing mode: create pattern canvas to composite pattern layers
            baseCanvas = document.createElement("canvas");
            baseCtx = baseCanvas.getContext("2d");
            baseCanvas.width = canvasWidth;
            baseCanvas.height = canvasHeight;

            // Configure image smoothing for pattern canvas in clothing mode
            baseCtx.imageSmoothingEnabled = false; // Sharper rendering for clothing
            console.log("⏭️  Created pattern canvas for clothing mode (smoothing disabled)");
        }
        
        // Load pattern layers using the fabric config from furniture-config.json
        const patternSlug = createPatternSlug(appState.currentPattern.name);
        const pattern = appState.currentPattern;
        
        // Use mockupLayers for clothing (pre-rendered PNGs), fall back to layers for regular patterns
        const layersToUse = pattern.mockupLayers || pattern.layers;
        console.log(`🔍 Pattern layers available:`, layersToUse);
        console.log(`🔍 Using ${pattern.mockupLayers ? 'mockupLayers' : 'layers'} for rendering`);
        console.log(`🔍 Fabric config patternPathTemplate:`, fabricConfig.patternPathTemplate);

        // Process pattern layers (skip Background layer at index 0)
        for (let i = 0; i < layersToUse.length; i++) {
            const layer = layersToUse[i];
            console.log(`🔍 Pattern layer ${i} object:`, layer);

            // Use layer path directly from collections.json (no transformation needed)
            let layerPath;
            if (typeof layer === 'string') {
                layerPath = normalizePath(layer);
            } else if (layer.path) {
                layerPath = normalizePath(layer.path);
            } else if (layer.imageUrl) {
                layerPath = normalizePath(layer.imageUrl);
            } else {
                console.warn(`⚠️ Pattern layer ${i} has no valid path`);
                continue;
            }

            console.log(`🔍 Loading pattern layer ${i}: ${layerPath}`);
            
            try {
                const layerImg = new Image();
                layerImg.crossOrigin = "anonymous";
                
                await new Promise((resolve, reject) => {
                    layerImg.onload = resolve;
                    layerImg.onerror = reject;
                    layerImg.src = layerPath;
                });

                const layerNativeWidth = layerImg.naturalWidth || layerImg.width;
                const layerNativeHeight = layerImg.naturalHeight || layerImg.height;
                console.log(`📐 Pattern layer ${i} loaded at NATIVE resolution: ${layerNativeWidth}x${layerNativeHeight}`);

                // Apply pattern to pattern composite (like pattern preview)
                const tempCanvas = document.createElement("canvas");
                const tempCtx = tempCanvas.getContext("2d");
                tempCanvas.width = canvasWidth;
                tempCanvas.height = canvasHeight;

                // Configure image smoothing for temp canvas (sharper for clothing)
                if (isClothingMode) {
                    tempCtx.imageSmoothingEnabled = false; // Sharper pattern rendering for clothing
                } else {
                    tempCtx.imageSmoothingEnabled = true;
                    tempCtx.imageSmoothingQuality = "medium";
                }

                // Draw the pattern image at canvas size (which is now 4K native resolution)
                tempCtx.drawImage(layerImg, 0, 0, canvasWidth, canvasHeight);
                console.log(`✅ Pattern layer ${i} drawn at native 4K canvas size`);
                
                // Get the layer's color from appState (pattern layers start at index 1 after Background)
                const colorIndex = i + 1; // Skip Background layer at index 0
                const layerColor = lookupColor(appState.currentLayers[colorIndex]?.color || "#FFFFFF");
                console.log(`🎨 Using color ${layerColor} for pattern layer ${i} (color index ${colorIndex})`);
                
                // Parse pattern color (hex to RGB)
                const colorMatch = layerColor.match(/^#([0-9a-f]{6})$/i);
                if (!colorMatch) {
                    console.warn(`⚠️ Invalid color format for layer ${i}: ${layerColor}`);
                    continue;
                }
                
                const colorR = parseInt(colorMatch[1].substr(0, 2), 16);
                const colorG = parseInt(colorMatch[1].substr(2, 2), 16);
                const colorB = parseInt(colorMatch[1].substr(4, 2), 16);
                
                // Apply color vibrance adjustment
                const vibrance = fabricTuning.colorVibrance;
                const vibranceR = Math.floor(127 + (colorR - 127) * vibrance);
                const vibranceG = Math.floor(127 + (colorG - 127) * vibrance);
                const vibranceB = Math.floor(127 + (colorB - 127) * vibrance);
                
                console.log(`🎨 Pattern layer ${i} RGB: ${vibranceR}, ${vibranceG}, ${vibranceB}`);
                
                // Extract pattern luminance and apply color (like pattern preview)
                const imageData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
                const data = imageData.data;
                
                let nonTransparentPixels = 0;
                let averageLuminance = 0;
                
                // Apply pattern processing (similar to pattern preview)
                for (let j = 0; j < data.length; j += 4) {
                    const r = data[j];
                    const g = data[j + 1];
                    const b = data[j + 2];
                    const alpha = data[j + 3];
                    
                    if (alpha > 0) {
                        nonTransparentPixels++;
                        
                        // Calculate pattern luminance
                        let patternLuminance = 0.299 * r + 0.587 * g + 0.114 * b;
                        
                        // Apply pattern contrast adjustment
                        patternLuminance = Math.pow(patternLuminance / 255, 1 / fabricTuning.patternContrast) * 255;
                        averageLuminance += patternLuminance;
                        
                        // Create colored pattern with luminance-based opacity
                        const opacity = (patternLuminance / 255) * fabricTuning.alphaStrength;
                        
                        data[j] = vibranceR;
                        data[j + 1] = vibranceG;
                        data[j + 2] = vibranceB;
                        data[j + 3] = Math.min(255, opacity * 255);
                    } else {
                        data[j + 3] = 0;
                    }
                }
                
                if (nonTransparentPixels > 0) {
                    averageLuminance /= nonTransparentPixels;
                    console.log(`🔍 Pattern layer ${i}: ${nonTransparentPixels} pixels, avg luminance: ${averageLuminance.toFixed(2)}`);
                } else {
                    console.warn(`⚠️ Pattern layer ${i}: No non-transparent pixels found`);
                }
                
                // Put the processed pattern back
                tempCtx.putImageData(imageData, 0, 0);
                
                // Apply to base canvas using normal blending
                baseCtx.globalCompositeOperation = "source-over";
                baseCtx.drawImage(tempCanvas, 0, 0);

                console.log(`🔍 Applied pattern layer ${i} to base canvas`);

                console.log(`✅ Pattern layer ${i} applied`);

            } catch (error) {
                console.warn(`⚠️ Pattern layer ${i} failed:`, error);
            }
        }

        // 4. Final compositing in correct order (isClothingMode already declared above)
        console.log(`🧵 Final compositing: ${isClothingMode ? 'clothing' : 'fabric'} mode`);

        // SIMPLIFIED APPROACH: Draw all layers at canvas size (canvas is now 2x for clothing)
        // Canvas is already sized correctly: 1100x1400 for clothing, 550x700 for fabric

        // Layer 1: Mockup (dress mannequin or room background)
        ctx.drawImage(mockupBg, 0, 0, canvasWidth, canvasHeight);
        console.log(`✅ Mockup drawn at canvas size (${canvasWidth}x${canvasHeight})`);

        // Layer 2: Tinted base (clothing) or pattern layers (fabric without base)
        if (tintedDressBase && isClothingMode) {
            // Clothing mode: Draw tinted dress-base BEFORE patterns
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(tintedDressBase, 0, 0, canvasWidth, canvasHeight);
            console.log(`✅ Tinted dress-base drawn at canvas size (${canvasWidth}x${canvasHeight})`);
        }

        // Layer 3: Pattern layers (always drawn at canvas size)
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(baseCanvas, 0, 0, canvasWidth, canvasHeight);
        console.log(`✅ Pattern layers composited at canvas size (${canvasWidth}x${canvasHeight})`);

        // Layer 3.5: For clothing mode, add shadow overlay constrained to dress-base alpha
        if (isClothingMode && tintedDressBase) {
            // Create temporary canvas for shadow layer
            const shadowCanvas = document.createElement("canvas");
            const shadowCtx = shadowCanvas.getContext("2d");
            shadowCanvas.width = canvasWidth;
            shadowCanvas.height = canvasHeight;

            // Configure image smoothing for shadow canvas (sharper for clothing)
            shadowCtx.imageSmoothingEnabled = false; // No anti-aliasing blur for sharp shadows

            // Draw mockup base (which has shadows)
            shadowCtx.drawImage(mockupBg, 0, 0, canvasWidth, canvasHeight);

            // Use destination-in to clip shadow to dress-base alpha channel
            shadowCtx.globalCompositeOperation = "destination-in";
            shadowCtx.drawImage(tintedDressBase, 0, 0, canvasWidth, canvasHeight);

            // Composite the masked shadow onto main canvas with multiply blend
            ctx.globalCompositeOperation = "multiply";
            ctx.drawImage(shadowCanvas, 0, 0, canvasWidth, canvasHeight);
            ctx.globalCompositeOperation = "source-over"; // Reset

            console.log(`✅ Shadow overlay applied (masked to dress-base alpha, multiply blend)`);
        }

        // Layer 4 & 5: Fabric-specific shadows and glossy (only for non-clothing fabric mode)
        if (fabricBase && !isClothingMode) {
            // Fabric mode only: Multiply base for shadows
            ctx.globalCompositeOperation = "multiply";
            ctx.drawImage(fabricBase, 0, 0, canvasWidth, canvasHeight);

            // Layer 4: Glossy finish (screen blend for shine effect)
            if (fabricTuning.glossyStrength > 0) {
                try {
                    const fabricGlossy = new Image();
                    fabricGlossy.crossOrigin = "anonymous";

                    await new Promise((resolve, reject) => {
                        fabricGlossy.onload = resolve;
                        fabricGlossy.onerror = reject;
                        // Use fabric-glossy.png from the same directory as fabric-base.png
                        const glossyPath = fabricConfig.base.replace('fabric-base.png', 'fabric-glossy.png');
                        fabricGlossy.src = `https://so-animation.com/colorflex/${glossyPath}`;
                    });

                    console.log(`📐 Fabric glossy: ${fabricGlossy.width}x${fabricGlossy.height}`);

                    // Apply glossy layer with screen blend mode and tunable opacity
                    ctx.globalCompositeOperation = "screen";
                    ctx.globalAlpha = fabricTuning.glossyStrength;
                    ctx.drawImage(fabricGlossy, 0, 0, canvasWidth, canvasHeight);

                    // Reset alpha and composite operation
                    ctx.globalAlpha = 1.0;
                    ctx.globalCompositeOperation = "source-over";

                    console.log("✅ Glossy layer applied with screen blend");

                } catch (error) {
                    console.warn("⚠️ Glossy layer failed to load:", error);
                    // Continue without glossy layer if it fails
                }
            }

            // Reset composite operation
            ctx.globalCompositeOperation = "source-over";

            console.log("✅ All layers composited in correct order (fabric mode)");
        } else if (isClothingMode) {
            console.log("✅ Clothing mode compositing complete (mockup + dress-base + patterns)");
        } else {
            console.log("✅ Fabric mode compositing complete (mockup + patterns only)");
        }
        
        // Update display - try both possible element references
        let roomMockup = document.getElementById('roomMockup');
        if (!roomMockup && dom?.roomMockup) {
            roomMockup = dom.roomMockup;
        }
        
        console.log("🔍 roomMockup element found:", !!roomMockup);
        console.log("🔍 dom.roomMockup available:", !!dom?.roomMockup);
        
        if (roomMockup) {
            const dataURL = canvas.toDataURL();
            console.log("🔍 Canvas dataURL length:", dataURL.length);
            console.log("🔍 roomMockup element type:", roomMockup.tagName);
            
            // Check if it's an img or div element
            if (roomMockup.tagName === 'IMG') {
                roomMockup.src = dataURL;
                console.log("✅ Set fabric mockup as img src");
            } else if (isClothingMode) {
                // CLOTHING MODE: Append actual canvas element (no background-image!)
                // This preserves native 4K resolution with viewport cropping
                console.log("👗 Clothing mode: appending canvas element directly");

                // Save zoom controls if they exist (we'll re-append after canvas)
                const existingZoomControls = roomMockup.querySelector('#clothingZoomControls');

                // Clear div content (but NOT the inline styles - we need those!)
                roomMockup.innerHTML = '';

                // Append the actual canvas element (not as background!)
                canvas.style.display = 'block';
                roomMockup.appendChild(canvas);

                // ✅ Restore saved zoom level if it exists
                console.log(`🔍 Zoom persistence: RESTORE - Checking appState.savedZoomScale:`, appState.savedZoomScale);
                if (appState.savedZoomScale && appState.savedZoomScale !== 1.0) {
                    canvas.dataset.zoomScale = appState.savedZoomScale.toFixed(2);
                    canvas.style.setProperty('transform', `scale(${appState.savedZoomScale})`, 'important');
                    canvas.style.setProperty('transform-origin', 'center', 'important');
                    console.log(`🔍 Zoom persistence: ✅ RESTORED zoom level to ${appState.savedZoomScale * 100}%`);
                } else {
                    // Initialize zoom scale to 1.0 if not set
                    canvas.dataset.zoomScale = '1.0';
                    console.log(`🔍 Zoom persistence: Initialized zoom to 100% (default)`);
                }

                // ✅ Restore saved pan position if it exists
                if (appState.savedPanX || appState.savedPanY) {
                    const panX = appState.savedPanX || 0;
                    const panY = appState.savedPanY || 0;
                    canvas.dataset.panX = panX.toString();
                    canvas.dataset.panY = panY.toString();
                    const scale = appState.savedZoomScale || 1.0;
                    canvas.style.setProperty('transform', `scale(${scale}) translate(${panX}px, ${panY}px)`, 'important');
                    canvas.style.setProperty('transform-origin', 'center', 'important');
                    console.log(`🔍 Pan persistence: ✅ RESTORED pan position to (${panX}, ${panY})`);
                } else {
                    // Initialize pan position to 0,0 if not set
                    canvas.dataset.panX = '0';
                    canvas.dataset.panY = '0';
                    console.log(`🔍 Pan persistence: Initialized pan to (0, 0) (default)`);
                }

                // Re-append zoom controls AFTER canvas so they appear on top
                if (existingZoomControls) {
                    roomMockup.appendChild(existingZoomControls);
                    console.log("✅ Re-appended zoom controls after canvas");
                }

                console.log("✅ Canvas appended to div - native 4K resolution preserved");
            } else {
                // FABRIC MODE: Use background-image approach
                // It's a div - preserve back button but clear other content
                console.log("🔍 Div innerHTML before:", roomMockup.innerHTML.substring(0, 100));

                // Save existing back button if it exists
                const existingButton = roomMockup.querySelector('#backToPatternsBtn');

                // Clear the div content
                roomMockup.innerHTML = '';

                // Clear the CSS background color to make background image visible
                roomMockup.style.backgroundColor = 'transparent';

                // Set background image
                roomMockup.style.backgroundImage = `url(${dataURL})`;
                roomMockup.style.backgroundSize = 'contain';
                roomMockup.style.backgroundRepeat = 'no-repeat';
                roomMockup.style.backgroundPosition = 'center';

                // Restore the back button if it existed
                if (existingButton) {
                    roomMockup.appendChild(existingButton);
                    console.log("✅ Restored back button after clearing div");
                }

                console.log("✅ Set fabric mockup as div background and cleared other content");
            }
            
            console.log("✅ Fabric mockup displayed to element:", roomMockup.id);
        } else {
            console.error("❌ No roomMockup element found!");
        }

        // Add back button for fabric mode ONLY (not for clothing mode)
        if (!isClothingMode && !document.getElementById('backToPatternsBtn')) {
            addBackToPatternsButton();
            console.log('✅ Added back button for fabric mode');
        } else if (isClothingMode) {
            console.log('👗 Skipping back button for clothing mode');
        }
        
        // Add fabric tuning controls
        addFabricTuningControls();
        
    } catch (error) {
        console.error("❌ Fabric mockup error:", error);
    }
}

// Add Try Fabric button functionality
function addTryFabricButton() {
    console.log("🧵 addTryFabricButton called");
    console.log("🧵 selectedCollection:", appState.selectedCollection?.name);
    
    // Check if we're in a compatible collection for fabric
    if (!appState.selectedCollection || appState.selectedCollection.name !== "botanicals") {
        console.log("🧵 Not botanicals collection, skipping fabric button");
        return;
    }
    
    console.log("🧵 Creating Try Fabric button");
    
    const existingButton = document.getElementById('tryFabricBtn');
    if (existingButton) {
        existingButton.remove();
    }
    
    const button = document.createElement('button');
    button.id = 'tryFabricBtn';
    button.textContent = 'Try Fabric';
    button.className = 'btn btn-primary';
    button.style.cssText = `
        margin-top: 10px;
        padding: 8px 16px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;
    
    button.addEventListener('click', () => {
        console.log("🧵 ================================");
        console.log("🧵 TRY FABRIC BUTTON CLICKED");
        console.log("🧵 ================================");
        renderFabricMockup();
    });
    
    // Add button to the appropriate location
    const tryFurnitureBtn = document.getElementById('tryFurnitureBtn');
    if (tryFurnitureBtn) {
        tryFurnitureBtn.parentNode.insertBefore(button, tryFurnitureBtn.nextSibling);
    } else {
        const controlsContainer = document.querySelector('.controls-container') || document.body;
        controlsContainer.appendChild(button);
    }
}

// Add this line at the bottom of your CFM.js file to expose the function globally:
window.addTryFurnitureButton = addTryFurnitureButton;
window.getCompatibleFurniture = getCompatibleFurniture;
window.showFurnitureModal = showFurnitureModal;
window.selectFurniture = selectFurniture;
window.renderFabricMockup = renderFabricMockup;
window.addTryFabricButton = addTryFabricButton;

// Debug function to manually test fabric
window.testFabric = function() {
    console.log("🧵 Manual fabric test called");
    renderFabricMockup();
};

// Simple red canvas test
window.testRedCanvas = function() {
    console.log("🔴 Testing red canvas display");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 600;
    canvas.height = 450;
    
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 600, 450);
    
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.fillText("FABRIC TEST", 150, 250);
    
    const roomMockup = document.getElementById('roomMockup') || dom?.roomMockup;
    if (roomMockup) {
        roomMockup.src = canvas.toDataURL();
        console.log("🔴 Red canvas set to roomMockup");
    } else {
        console.error("❌ No roomMockup element found");
    }
};

// Simple fabric function that just fits a 3840x2160 image into 600x450
window.simpleFabricTest = function() {
    console.log("🧵 SIMPLE FABRIC TEST");
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 600;
    canvas.height = 450;
    
    // Fill with a color first
    ctx.fillStyle = "#F0F0E9";
    ctx.fillRect(0, 0, 600, 450);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function() {
        console.log(`Image loaded: ${img.width}x${img.height}`);
        
        // Calculate scale to fit 3840x2160 into 600x450
        const scaleX = 600 / img.width;
        const scaleY = 450 / img.height;
        const scale = Math.min(scaleX, scaleY);
        
        console.log(`Scale: ${scale} (${scaleX}, ${scaleY})`);
        
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (600 - w) / 2;
        const y = (450 - h) / 2;
        
        console.log(`Drawing at: ${x}, ${y}, ${w}x${h}`);
        
        ctx.drawImage(img, x, y, w, h);
        
        // Update display
        const roomMockup = document.getElementById('roomMockup');
        if (roomMockup) {
            roomMockup.src = canvas.toDataURL();
            console.log("✅ Simple fabric test complete");
        }
    };
    
    img.src = "https://so-animation.com/colorflex/data/fabric/fabric-base.png";
};
// Enhanced color parsing function for proof generation
async function parseColorEnhanced(colorStr) {
    if (!colorStr) return null;
    
    console.log('🔍 Parsing color:', `"${colorStr}"`);
    
    // Handle hex colors
    if (colorStr.startsWith('#')) {
        const hex = colorStr.substring(1);
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16)
            };
        } else if (hex.length === 6) {
            return {
                r: parseInt(hex.substring(0, 2), 16),
                g: parseInt(hex.substring(2, 4), 16),
                b: parseInt(hex.substring(4, 6), 16)
            };
        }
    }
    
    // Handle rgb() format
    const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3])
        };
    }
    
    // Handle named colors with SW/SC codes
    const cleanColor = colorStr.toLowerCase().trim();
    
    // Load colors if not already loaded
    if (!window.colorFlexColors) {
        console.log('🔄 Loading colors from colors.json...');
        try {
            const response = await fetch('/assets/colors.json');
            const colorsData = await response.json();
            
            window.colorFlexColors = {};
            colorsData.forEach(color => {
                const baseName = color.color_name.toLowerCase().trim();
                const rgb = { r: color.red, g: color.green, b: color.blue };
                
                // Add multiple variations for flexible matching
                window.colorFlexColors[baseName] = rgb;
                if (color.sw_number) {
                    window.colorFlexColors[color.sw_number.toLowerCase() + ' ' + baseName] = rgb;
                    window.colorFlexColors[color.sw_number.toLowerCase()] = rgb;
                }
            });
            console.log('✅ Loaded', Object.keys(window.colorFlexColors).length, 'color variations');
        } catch (error) {
            console.error('❌ Failed to load colors.json:', error);
            return null;
        }
    }
    
    // Try direct match first
    if (window.colorFlexColors[cleanColor]) {
        return window.colorFlexColors[cleanColor];
    }
    
    // Try partial matches
    for (const [key, value] of Object.entries(window.colorFlexColors)) {
        if (key.includes(cleanColor) || cleanColor.includes(key)) {
            console.log(`✅ Found partial match: "${cleanColor}" matched "${key}"`);
            return value;
        }
    }
    
    console.warn(`❌ Could not parse color: "${colorStr}"`);
    return null;
}

// ============================================================================
// PATTERN PROOF GENERATION - CRITICAL DUAL-LAYER SYSTEM
// ============================================================================
//
// ⚠️ IMPORTANT: Patterns use TWO separate image sets with different resolutions:
//
// 1. PREVIEW LAYERS (for fast UI responsiveness):
//    - Path: layers[].path
//    - Location: ./data/collections/{collection}/layers/*.jpg
//    - Resolution: ~1400x1400px (optimized for display)
//    - Used by: updatePreview() function for canvas preview
//
// 2. PROOF LAYERS (for high-quality downloads):
//    - Path: layers[].proofPath
//    - Location: ./data/collections/{collection}/proof-layers/*.jpg
//    - Resolution: ~3600x3600px (full resolution for printing)
//    - Used by: generatePatternProof() function (THIS FUNCTION)
//
// ⚠️ CRITICAL: This function MUST use layer.proofPath for all image loading
// If you use layer.path, proofs will be blurry/pixelated upscaled images!
//
// ⚠️ COLOR MATCHING: The colorArray parameter MUST contain the exact colors
// that were selected by the user. The proof should match what's shown in preview.
//
// ============================================================================

// Pattern proof generation functions for product pages
async function generatePatternProof(patternName, collectionName, colorArray, userScale = null) {
    console.log('🔧 generatePatternProof called with:', patternName, collectionName, colorArray, 'scale:', userScale);
    
    try {
        // Access collections from appState
        const collectionsData = appState.collections;
        if (!collectionsData) {
            throw new Error('Collections data not loaded');
        }
        
        const targetCollection = collectionsData.find(c => c.name === collectionName);
        if (!targetCollection) {
            throw new Error(`Collection "${collectionName}" not found`);
        }
        
        const targetPattern = targetCollection.patterns.find(p => 
            p.name.toLowerCase().trim() === patternName.toLowerCase().trim()
        );
        
        if (!targetPattern) {
            throw new Error(`Pattern "${patternName}" not found in collection "${collectionName}"`);
        }
        
        console.log('🔧 Found pattern:', targetPattern.name, 'with', targetPattern.layers?.length || 0, 'layers');
        
        // Create canvas and context - size will be determined by pattern dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Handle patterns exactly like updatePreview does
        if (targetPattern.tintWhite && targetPattern.baseComposite) {
            console.log("🎨 Rendering tint white pattern for proof");
            
            const baseImage = new Image();
            baseImage.crossOrigin = "Anonymous";
            baseImage.src = normalizePath(targetPattern.baseComposite);
            
            await new Promise((resolve, reject) => {
                baseImage.onload = () => {
                    // Use NATURAL dimensions (actual file size, not display size)
                    const canvasWidth = baseImage.naturalWidth || baseImage.width;
                    const canvasHeight = baseImage.naturalHeight || baseImage.height;

                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;

                    console.log(`🔧 Proof canvas at FULL resolution: ${canvas.width}x${canvas.height} (natural: ${baseImage.naturalWidth}x${baseImage.naturalHeight})`);

                    // Use first color as background
                    const backgroundColor = lookupColor(colorArray[0] || "Snowbound");
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

                    resolve();
                };
                baseImage.onerror = reject;
            });
            
        } else if (targetPattern.layers?.length) {
            console.log("🎨 Rendering layered pattern for proof");
            
            const firstLayer = targetPattern.layers.find(l => !l.isShadow);
            if (firstLayer) {
                const tempImg = new Image();
                tempImg.crossOrigin = "Anonymous";

                // ⚠️ CRITICAL: Use proofPath (high-res ~3600px) NOT path (preview ~1400px)
                // proofPath: ./data/collections/{collection}/proof-layers/*.jpg
                // path: ./data/collections/{collection}/layers/*.jpg
                tempImg.src = normalizePath(firstLayer.proofPath || firstLayer.path);
                
                const patternBounds = await new Promise((resolve) => {
                    tempImg.onload = () => {
                        // ⚠️ CRITICAL: Canvas size represents 24" wide proof, NOT the layer image size
                        // The proof layer image (e.g., 3600px) represents ONE pattern repeat (typically 24" × 24")
                        // The canvas should ALWAYS be the same size as one pattern repeat
                        // Scale affects TILE SIZE within the canvas, not the canvas dimensions

                        const effectiveScale = userScale ? (userScale / 100) : 1.0;
                        const patternRepeatWidth = tempImg.naturalWidth || tempImg.width;
                        const patternRepeatHeight = tempImg.naturalHeight || tempImg.height;

                        // Canvas size = one pattern repeat size (always represents 24" × 24")
                        canvas.width = patternRepeatWidth;
                        canvas.height = patternRepeatHeight;

                        console.log(`🔧 Proof canvas: ${canvas.width}x${canvas.height}px (represents 24"x24" at ${Math.round(canvas.width/24)} DPI)`);
                        console.log(`🔧 Scale multiplier: ${effectiveScale}x (${effectiveScale === 1 ? '1 tile' : Math.pow(effectiveScale, 2).toFixed(1) + ' tiles'} on canvas)`);

                        // Set background color (use first color as background)
                        const backgroundColor = lookupColor(colorArray[0] || "Snowbound");
                        ctx.fillStyle = backgroundColor;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // Pattern tiles at scaled size within fixed canvas
                        resolve({
                            offsetX: 0,
                            offsetY: 0,
                            patternDisplayWidth: canvas.width,
                            patternDisplayHeight: canvas.height,
                            scaleMultiplier: effectiveScale
                        });
                    };
                    tempImg.onerror = () => resolve(null);
                });
                
                if (patternBounds) {
                    // Render each layer using the exact same logic as updatePreview
                    for (let layerIndex = 0; layerIndex < targetPattern.layers.length; layerIndex++) {
                        const layer = targetPattern.layers[layerIndex];
                        const isShadow = layer.isShadow === true;
                        
                        // Use colors from colorArray in order (skip first color since it's background)
                        const layerColor = !isShadow ? lookupColor(colorArray[layerIndex + 1] || colorArray[layerIndex] || "Snowbound") : null;

                        console.log(`🔧 Proof layer ${layerIndex} with color:`, layerColor, 'using', layer.proofPath ? 'PROOF PATH (high-res)' : 'preview path (fallback)');
                        
                        await new Promise((resolve) => {
                            // Simplified proof generation - just composite the layers at full size

                            // ⚠️ CRITICAL: Use proofPath (high-res ~3600px) NOT path (preview ~1400px)
                            // This is the SECOND critical place where we load layer images for proofs
                            const layerImagePath = layer.proofPath || layer.path;

                            processImage(layerImagePath, (processedCanvas) => {
                                if (!(processedCanvas instanceof HTMLCanvasElement)) {
                                    return resolve();
                                }

                                // Apply scaling to show correct pattern size
                                ctx.globalCompositeOperation = isShadow ? "multiply" : "source-over";
                                ctx.globalAlpha = isShadow ? 0.3 : 1.0;

                                // Calculate scaled tile size based on user's scale setting
                                // userScale: 100 = 1x (normal), 200 = 2x (pattern appears smaller/more tiles), 50 = 0.5x (pattern appears larger/fewer tiles)
                                // INVERT the scale: 2x scale means pattern is HALF size (divide by 2)
                                const effectiveScale = patternBounds.scaleMultiplier || 1.0;
                                const scaledWidth = processedCanvas.width / effectiveScale;
                                const scaledHeight = processedCanvas.height / effectiveScale;

                                // Check for half-drop tiling
                                const tilingType = targetPattern.tilingType || "";
                                const isHalfDrop = tilingType === "half-drop";
                                console.log(`🔧 Proof tiling: ${isHalfDrop ? 'HALF-DROP' : 'NORMAL'} (tilingType: "${tilingType}")`);

                                // Tile the pattern across the canvas at the scaled size
                                let colIndex = 0;
                                for (let x = 0; x < canvas.width; x += scaledWidth, colIndex++) {
                                    // Apply half-drop offset for odd columns
                                    const yOffset = isHalfDrop && (colIndex % 2 === 1) ? scaledHeight / 2 : 0;

                                    // Start from -scaledHeight to cover edges, then add yOffset for half-drop
                                    for (let y = -scaledHeight + yOffset; y < canvas.height + scaledHeight; y += scaledHeight) {
                                        ctx.drawImage(processedCanvas, x, y, scaledWidth, scaledHeight);
                                    }
                                }

                                ctx.globalAlpha = 1.0; // Reset alpha
                                console.log(`✅ Rendered proof layer ${layerIndex} with color ${layerColor} at scale ${effectiveScale}x (${scaledWidth}x${scaledHeight})`);
                                resolve();
                            }, layerColor, 2.2, isShadow, false, false);
                        });
                    }
                }
            }
        }
        
        console.log('✅ Pattern proof generation complete');
        return canvas;
        
    } catch (error) {
        console.error('❌ Error in generatePatternProof:', error);
        throw error;
    }
}

function downloadPatternProof(canvas, filename) {
    console.log('📥 Downloading pattern proof:', filename);

    // Calculate DPI to ensure 24 inches wide at actual pixel dimensions
    const targetWidthInches = 24;
    const calculatedDPI = Math.round(canvas.width / targetWidthInches);

    console.log(`📐 Setting DPI metadata: ${canvas.width}px ÷ ${targetWidthInches}" = ${calculatedDPI} DPI`);

    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.95);

    // Insert DPI metadata into JPEG
    const base64Data = dataURL.split(',')[1];
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
    }

    // Find JFIF header (FF E0) and modify DPI values
    // JFIF structure: FF E0 [length] "JFIF" 0 [version] [units] [Xdensity] [Ydensity]
    let modified = false;
    for (let i = 0; i < bytes.length - 20; i++) {
        if (bytes[i] === 0xFF && bytes[i + 1] === 0xE0) {
            // Check if this is JFIF marker
            if (bytes[i + 4] === 0x4A && bytes[i + 5] === 0x46 && bytes[i + 6] === 0x49 && bytes[i + 7] === 0x46) {
                // Found JFIF header
                // Set density unit to 1 (dots per inch)
                bytes[i + 11] = 0x01;
                // Set X density (DPI) - 2 bytes, big-endian
                bytes[i + 12] = (calculatedDPI >> 8) & 0xFF;
                bytes[i + 13] = calculatedDPI & 0xFF;
                // Set Y density (DPI) - 2 bytes, big-endian
                bytes[i + 14] = (calculatedDPI >> 8) & 0xFF;
                bytes[i + 15] = calculatedDPI & 0xFF;

                console.log(`✅ DPI metadata set to ${calculatedDPI} DPI (ensures 24" width in image editors)`);
                modified = true;
                break;
            }
        }
    }

    if (!modified) {
        console.warn('⚠️ Could not find JFIF header to set DPI metadata');
    }

    // Create blob from modified bytes
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    // Download the file
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('✅ Proof downloaded:', filename);
}

// Expose proof generation functions globally
window.generatePatternProof = generatePatternProof;
window.downloadPatternProof = downloadPatternProof;

/**
 * Generate pattern proof with customer info strip
 */
async function generatePatternProofWithInfo(patternName, collectionName, colorArray, customerName, dimensions, tiling) {
    console.log('🔧 generatePatternProofWithInfo called:', {patternName, collectionName, colorArray, customerName, dimensions, tiling});

    try {
        // First generate the standard proof canvas
        // Pass current scale to show correct tiling/repetition on 24" wide proof
        const proofCanvas = await generatePatternProof(patternName, collectionName, colorArray, appState.currentScale);

        // Create a new canvas with extra height for info strip
        // Calculate required height based on actual content:
        // - Top margin: 30px
        // - Customer name: ~40px (font + spacing)
        // - Pattern name: ~30px
        // - Collection name: ~30px
        // - "Colors:" header: ~30px
        // - Each color line: ~28px (font + 4px spacing)
        // - Bottom margin: ~20px
        const baseFontSize = Math.max(24, proofCanvas.width / 80);
        const smallFontSize = Math.max(18, proofCanvas.width / 100);
        const topMargin = 50;  // Increased from 30 for more breathing room
        const bottomMargin = 30;  // Also increased for visual balance
        const customerLineHeight = baseFontSize + 8;
        const textLineHeight = smallFontSize + 6;
        const colorLineHeight = smallFontSize + 4;

        // Base height for header info (customer, pattern, collection, "Colors:")
        // Add one extra line for scale if not 100%
        const scaleLineCount = (appState.currentScale && appState.currentScale !== 100) ? 1 : 0;
        const baseHeight = topMargin + customerLineHeight + (textLineHeight * (3 + scaleLineCount)) + bottomMargin;
        // Add height for each color line
        const infoStripHeight = baseHeight + (colorArray.length * colorLineHeight);
        const finalCanvas = document.createElement('canvas');
        const finalCtx = finalCanvas.getContext('2d');

        finalCanvas.width = proofCanvas.width;
        finalCanvas.height = proofCanvas.height + infoStripHeight;

        // Draw the pattern proof
        finalCtx.drawImage(proofCanvas, 0, 0);

        // Draw info strip background
        finalCtx.fillStyle = '#ffffff';
        finalCtx.fillRect(0, proofCanvas.height, finalCanvas.width, infoStripHeight);

        // Add border line
        finalCtx.strokeStyle = '#d4af37';
        finalCtx.lineWidth = 2;
        finalCtx.beginPath();
        finalCtx.moveTo(0, proofCanvas.height);
        finalCtx.lineTo(finalCanvas.width, proofCanvas.height);
        finalCtx.stroke();

        // Font sizes already calculated above for height calculation
        // const baseFontSize = Math.max(24, finalCanvas.width / 80);
        // const smallFontSize = Math.max(18, finalCanvas.width / 100);

        // Add text info
        finalCtx.fillStyle = '#1a202c';
        finalCtx.font = `bold ${baseFontSize}px Arial`;
        finalCtx.textAlign = 'left';

        const leftMargin = 30;
        let yPosition = proofCanvas.height + topMargin;  // Use the topMargin we calculated

        // Customer name
        finalCtx.fillText(`Customer: ${customerName}`, leftMargin, yPosition);
        yPosition += baseFontSize + 8;

        // Pattern info
        finalCtx.font = `${smallFontSize}px Arial`;
        finalCtx.fillText(`Pattern: ${patternName}`, leftMargin, yPosition);
        yPosition += smallFontSize + 6;

        finalCtx.fillText(`Collection: ${collectionName}`, leftMargin, yPosition);
        yPosition += smallFontSize + 6;

        // Scale information (if not 100%)
        if (appState.currentScale && appState.currentScale !== 100) {
            const scaleDisplay = appState.currentScale === 50 ? '0.5X' :
                               appState.currentScale === 200 ? '2X' :
                               appState.currentScale === 300 ? '3X' :
                               appState.currentScale === 400 ? '4X' :
                               `${appState.currentScale}%`;
            finalCtx.fillText(`Scale: ${scaleDisplay}`, leftMargin, yPosition);
            yPosition += smallFontSize + 6;
        }

        // Get pattern data for labels and tiling info (needed by multiple sections below)
        console.log('🔍 Looking up pattern:', {collectionName, patternName});
        const targetCollection = appState.collections?.find(c => c.name === collectionName);
        console.log('🔍 Found collection:', targetCollection ? targetCollection.name : 'NOT FOUND');
        const targetPattern = targetCollection?.patterns?.find(p =>
            p.name.toLowerCase().trim() === patternName.toLowerCase().trim()
        );
        console.log('🔍 Found pattern:', targetPattern ? targetPattern.name : 'NOT FOUND', 'layers:', targetPattern?.layers?.length);

        // Color information - detailed breakdown with layer labels
        if (colorArray && colorArray.length > 0) {
            finalCtx.fillText(`Colors:`, leftMargin, yPosition);
            yPosition += smallFontSize + 6;

            // Build layer labels array matching the pattern structure
            const layerLabels = [];

            if (targetPattern) {
                // Add background label
                layerLabels.push({ label: 'Background', color: colorArray[0] || 'N/A' });

                // Add layer labels from pattern definition
                if (targetPattern.layers && targetPattern.layers.length > 0) {
                    targetPattern.layers.forEach((layer, index) => {
                        if (!layer.isShadow) {
                            const label = targetPattern.layerLabels?.[index] || `Layer ${index + 1}`;
                            const color = colorArray[layerLabels.length] || 'N/A';
                            layerLabels.push({ label, color });
                        }
                    });
                }
            } else {
                // Fallback if pattern not found - use generic labels
                colorArray.forEach((color, index) => {
                    const label = index === 0 ? 'Background' : `Layer ${index}`;
                    layerLabels.push({ label, color });
                });
            }

            // Display each color with its layer label
            console.log('🎨 Displaying layer labels on proof:', layerLabels);
            console.log('🎨 Starting yPosition:', yPosition, 'smallFontSize:', smallFontSize);
            console.log('🎨 Canvas height:', finalCanvas.height, 'Info strip height:', infoStripHeight);
            layerLabels.forEach(({ label, color }) => {
                console.log(`  Drawing: "${label}: ${color}" at y=${yPosition}`);
                finalCtx.fillText(`  ${label}: ${color}`, leftMargin + 20, yPosition);
                yPosition += smallFontSize + 4;
            });
        }

        // Right side info - show dimensions and tiling type
        if (dimensions) {
            finalCtx.textAlign = 'right';
            const rightMargin = finalCanvas.width - 30;
            yPosition = proofCanvas.height + topMargin;
            finalCtx.font = `${smallFontSize}px Arial`;
            finalCtx.fillText(`Dimensions: ${dimensions}`, rightMargin, yPosition);
            yPosition += smallFontSize + 6;

            // Add tiling type if half-drop
            const tilingType = targetPattern?.tilingType || '';
            if (tilingType === 'half-drop') {
                finalCtx.fillText(`Tiling: Half-Drop`, rightMargin, yPosition);
                yPosition += smallFontSize + 6;
            }
        }

        console.log('✅ Pattern proof with info generated');
        return finalCanvas;

    } catch (error) {
        console.error('❌ Error in generatePatternProofWithInfo:', error);
        throw error;
    }
}

// Export to window
window.generatePatternProofWithInfo = generatePatternProofWithInfo;

/**
 * Download current pattern proof (standard - no customer info)
 * Called from ColorFlex page "Download Standard Proof" button
 */
function downloadCurrentPatternProof() {
    try {
        console.log('🔧 Standard download proof requested from ColorFlex app');

        if (!appState.currentPattern) {
            alert('Please select a pattern first');
            return;
        }

        if (!appState.selectedCollection) {
            alert('Collection not loaded');
            return;
        }

        // Get current colors from layer inputs (need color NAMES, not just values)
        const colorArray = [];

        // Build color array from layerInputs which have the actual color names
        appState.layerInputs.forEach((layerInput, index) => {
            if (layerInput && layerInput.input && layerInput.input.value) {
                colorArray.push(layerInput.input.value);
            }
        });

        if (colorArray.length === 0) {
            alert('No colors selected');
            return;
        }

        console.log('🎨 Generating standard proof for:', appState.currentPattern.name, 'with colors:', colorArray, 'scale:', appState.currentScale);

        // Use the same proof generation as product pages
        // Pass scale to show correct tiling/repetition on 24" wide proof
        generatePatternProof(
            appState.currentPattern.name,
            appState.selectedCollection.name,
            colorArray,
            appState.currentScale  // Scale affects tiling, not canvas size
        ).then(canvas => {
            console.log('✅ Pattern proof generation complete, downloading...');
            const filename = `${appState.currentPattern.name}_${appState.selectedCollection.name}_proof.jpg`;
            downloadPatternProof(canvas, filename);
        }).catch(error => {
            console.error('❌ Error generating proof:', error);
            alert('Error generating proof. Check console for details.');
        });

    } catch (error) {
        console.error('❌ Error in downloadCurrentPatternProof:', error);
        alert('Error downloading proof. Please try again.');
    }
}

/**
 * Download current pattern proof with customer info
 * Called from ColorFlex page "Download Proof with Customer Info" button
 */
function downloadCurrentPatternProofWithInfo() {
    try {
        console.log('🔧 Info strip download proof requested from ColorFlex app');

        if (!appState.currentPattern) {
            alert('Please select a pattern first');
            return;
        }

        if (!appState.selectedCollection) {
            alert('Collection not loaded');
            return;
        }

        // Get current colors from layer inputs (need color NAMES, not just values)
        const colorArray = [];

        // Build color array from layerInputs which have the actual color names
        appState.layerInputs.forEach((layerInput, index) => {
            if (layerInput && layerInput.input && layerInput.input.value) {
                colorArray.push(layerInput.input.value);
            }
        });

        if (colorArray.length === 0) {
            alert('No colors selected');
            return;
        }

        console.log('🎨 Generating proof with info for:', appState.currentPattern.name, 'with colors:', colorArray);

        // Get customer info
        const customerName = window.ShopifyCustomer ?
            `${window.ShopifyCustomer.first_name} ${window.ShopifyCustomer.last_name}` :
            'Guest Customer';

        // Get pattern dimensions and tiling from collections.json if available
        let dimensions = '';
        let tiling = '';

        // Check for size array [width, height] (standard format in collections.json)
        if (appState.currentPattern.size && Array.isArray(appState.currentPattern.size) && appState.currentPattern.size.length >= 2) {
            dimensions = `${appState.currentPattern.size[0]}" × ${appState.currentPattern.size[1]}"`;
        } else if (appState.currentPattern.width && appState.currentPattern.height) {
            dimensions = `${appState.currentPattern.width}" × ${appState.currentPattern.height}"`;
        } else if (appState.currentPattern.dimensions) {
            dimensions = appState.currentPattern.dimensions;
        }

        if (appState.currentPattern.tiling) {
            tiling = appState.currentPattern.tiling;
        } else if (appState.currentPattern.repeat) {
            tiling = appState.currentPattern.repeat;
        }

        // Use the enhanced proof generation function
        generatePatternProofWithInfo(
            appState.currentPattern.name,
            appState.selectedCollection.name,
            colorArray,
            customerName,
            dimensions,
            tiling
        ).then(canvas => {
            console.log('✅ Pattern proof with info generation complete, downloading...');
            const filename = `${appState.currentPattern.name}_${appState.selectedCollection.name}_with_info.jpg`;
            downloadPatternProof(canvas, filename);
        }).catch(error => {
            console.error('❌ Error generating proof with info:', error);
            alert('Error generating proof with info. Check console for details.');
        });

    } catch (error) {
        console.error('❌ Error in downloadCurrentPatternProofWithInfo:', error);
        alert('Error downloading proof with info. Please try again.');
    }
}

// Export proof download functions to window so Liquid template can call them
window.downloadCurrentPatternProof = downloadCurrentPatternProof;
window.downloadCurrentPatternProofWithInfo = downloadCurrentPatternProofWithInfo;

/**
 * Helper functions for cart item updates
 */

// Fabric pricing utility functions
function getFabricSpecByMaterialId(materialId) {
    // Convert material ID to fabric spec key
    if (materialId === 'wallpaper') {
        return FABRIC_SPECIFICATIONS['WALLPAPER'];
    }

    const fabricMap = {
        'fabric-soft-velvet': 'SOFT VELVET',
        'fabric-decorator-linen': 'DECORATOR LINEN',
        'fabric-drapery-sheer': 'DRAPERY SHEER',
        'fabric-lightweight-linen': 'LIGHTWEIGHT LINEN',
        'fabric-faux-suede': 'FAUX SUEDE',
        'fabric-drapery-light-block': 'DRAPERY LIGHT BLOCK'
    };

    const fabricKey = fabricMap[materialId];
    return fabricKey ? FABRIC_SPECIFICATIONS[fabricKey] : null;
}

function calculateMaterialPrice(materialId, quantity) {
    const spec = getFabricSpecByMaterialId(materialId);
    if (!spec) {
        return { error: 'Unknown material type', total: 0 };
    }

    if (spec.material === 'fabric') {
        const actualYards = Math.max(quantity, spec.minimumYards);
        return {
            materialType: 'fabric',
            unit: 'yards',
            requestedQuantity: quantity,
            actualQuantity: actualYards,
            pricePerUnit: spec.pricePerYard,
            minimumMet: quantity >= spec.minimumYards,
            total: actualYards * spec.pricePerYard,
            width: spec.width,
            description: spec.description
        };
    } else {
        // Wallpaper
        const actualRolls = Math.max(quantity, spec.minimumRolls);
        return {
            materialType: 'wallpaper',
            unit: 'rolls',
            requestedQuantity: quantity,
            actualQuantity: actualRolls,
            pricePerUnit: spec.pricePerRoll,
            minimumMet: quantity >= spec.minimumRolls,
            total: actualRolls * spec.pricePerRoll,
            coverage: spec.coverage,
            description: spec.description
        };
    }
}

// Get display name for material types
function getMaterialDisplayName(materialId) {
    const spec = getFabricSpecByMaterialId(materialId);
    if (spec) {
        return materialId.includes('fabric-') ?
            materialId.replace('fabric-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Fabric' :
            'Wallpaper';
    }

    // Legacy fallback
    const materials = {
        'wallpaper-peel-stick': 'Peel & Stick Wallpaper',
        'wallpaper-traditional': 'Traditional Wallpaper',
        'wallpaper-textured': 'Textured Wallpaper',
        'fabric-cotton': 'Cotton Fabric',
        'fabric-linen': 'Linen Fabric'
    };
    return materials[materialId] || materialId;
}

// Get pricing for material types
function getMaterialPrice(materialId) {
    const spec = getFabricSpecByMaterialId(materialId);
    if (spec) {
        return spec.material === 'fabric' ?
            `$${spec.pricePerYard.toFixed(2)}/yard` :
            `$${spec.pricePerRoll.toFixed(2)}/roll`;
    }

    // Legacy fallback
    const prices = {
        'wallpaper-peel-stick': '$89.99',
        'wallpaper-traditional': '$79.99',
        'wallpaper-textured': '$99.99',
        'fabric-cotton': '$69.99',
        'fabric-linen': '$79.99'
    };
    return prices[materialId] || '$89.99';
}

// Update cart item via Shopify API
async function updateCartItemViaAPI(itemData) {
    try {
        console.log('🛒 Attempting cart update via API:', itemData);

        // Get current cart to find the item to update
        const cartResponse = await fetch('/cart.js');
        if (!cartResponse.ok) {
            throw new Error('Failed to fetch current cart');
        }

        const cartData = await cartResponse.json();
        console.log('📦 Current cart data:', cartData);

        // Find the ColorFlex item to update (by properties)
        const itemToUpdate = cartData.items.find(item =>
            item.properties && (
                item.properties['Custom Pattern'] === itemData.pattern ||
                item.properties['ColorFlex Source'] ||
                item.title.toLowerCase().includes('custom wallpaper')
            )
        );

        if (!itemToUpdate) {
            throw new Error('Could not find ColorFlex item in cart to update');
        }

        console.log('🎯 Found item to update:', itemToUpdate);

        // Get scale display text
        function getScaleDisplayText(currentScale) {
            if (currentScale === 50) return '0.5X';
            if (currentScale === 100) return '1X';
            if (currentScale === 200) return '2X';
            if (currentScale === 300) return '3X';
            if (currentScale === 400) return '4X';
            return 'Normal';
        }

        // Build update payload
        const updatePayload = {
            id: itemToUpdate.key,
            quantity: itemToUpdate.quantity,
            properties: {
                'Custom Pattern': itemData.pattern,
                'Pattern Collection': toTitleCase(itemData.collectionName),
                'Custom Colors': itemData.colors.map(c => normalizeColorToSwFormat(c.color || c.name)).join(', '),
                'ColorFlex Source': 'Cart Update - ColorFlex Page',
                'Product Type': itemData.productTypeName,
                'Pattern Scale': getScaleDisplayText(itemData.currentScale),
                'Thumbnail Key': `cart_thumbnail_${itemData.pattern}_${itemData.collectionName}`
            }
        };

        // Update the cart item
        const updateResponse = await fetch('/cart/change.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(updatePayload)
        });

        if (!updateResponse.ok) {
            throw new Error(`Cart update failed: ${updateResponse.status}`);
        }

        const result = await updateResponse.json();
        console.log('✅ Cart update successful:', result);

        return { success: true, result };

    } catch (error) {
        console.error('❌ Cart update failed:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// SECTION 12: UTILITIES & GLOBAL EXPORTS
// ============================================================================
// Notification functions, shareable URLs, and window.* global exports
// for external access from unified-pattern-modal.js and theme.liquid.
// ============================================================================

// Show success notification
function showSuccessNotification(message) {
    showNotification(message, 'success');
}

// Show error notification
function showErrorNotification(message) {
    showNotification(message, 'error');
}

// Generic notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#22543d' : (type === 'error' ? '#742a2a' : '#2d3748');
    const textColor = type === 'success' ? '#68d391' : (type === 'error' ? '#feb2b2' : '#e2e8f0');
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: ${textColor};
        padding: 15px 20px;
        border-radius: 8px;
        border: 2px solid ${textColor};
        font-family: 'Special Elite', monospace;
        font-weight: bold;
        z-index: 10002;
        max-width: 400px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px;">${icon}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: transparent;
                border: none;
                color: ${textColor};
                font-size: 18px;
                cursor: pointer;
                margin-left: auto;
            ">×</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds for non-success messages
    if (type !== 'success') {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Generate shareable URL from pattern data
function generateShareableUrl(pattern) {
    const baseUrl = window.location.origin + '/pages/colorflex';
    const params = new URLSearchParams({
        collection: pattern.collectionName,
        pattern: pattern.patternName,
        colors: pattern.colors.map(c => c.swColor || c.color).join(','),
        scale: pattern.currentScale || 100,
        source: 'shared_link'
    });

    const shareUrl = `${baseUrl}?${params.toString()}`;
    console.log('🔗 Generated shareable URL:', shareUrl);
    return shareUrl;
}

// Copy shareable URL to clipboard
function copyShareableUrl(pattern) {
    const url = generateShareableUrl(pattern);
    navigator.clipboard.writeText(url).then(() => {
        console.log('✅ URL copied to clipboard');
        showSaveNotification('🔗 Share link copied to clipboard!');
    }).catch(err => {
        console.error('❌ Failed to copy URL:', err);
        showSaveNotification('❌ Failed to copy link');
    });
}

// Expose saved pattern functions globally for unified modal system
window.loadSavedPatternToUI = loadSavedPatternToUI;
window.showMaterialSelectionModal = showMaterialSelectionModal;
window.lookupColor = lookupColor;
window.generateShareableUrl = generateShareableUrl;
window.copyShareableUrl = copyShareableUrl;

window.addBackToPatternsButton = addBackToPatternsButton;
window.initializeTryFurnitureFeature = initializeTryFurnitureFeature;