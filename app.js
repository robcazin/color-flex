document.addEventListener("DOMContentLoaded", () => {
    const curatedColorsContainer = document.getElementById("curatedColorsContainer");
    const patternDropdown = document.getElementById("patternDropdown");
    const preview = document.getElementById("preview");
    const roomMockup = document.getElementById("roomMockup");
    const bgColorInput = document.getElementById("bgColor");
    const designColorInput = document.getElementById("layer1Color");
    const bgColorCircle = document.getElementById("bgColorCircle");
    const designColorCircle = document.getElementById("designColorCircle");
    const patternNameElement = document.getElementById("patternName");
    const coordinatesContainer = document.getElementById("coordinatesContainer");
    const combinationsContainer = document.getElementById("combinationsContainer");
    const saveCombinationButton = document.getElementById("saveCombination");

    const collectionsPath = "./collections/collections.json";
    const colorsPath = "./colors.json";
    let colorMap = {};
    let selectedPattern = null;
    let collectionsData = [];
    let savedCombinations = [];
    let layerInputs = [];
    // Add these with your other declarations
    let selectedCollection = null;

        // Responsive resizing logic
        document.addEventListener("DOMContentLoaded", () => {
            const preview = document.getElementById("preview");
            const roomMockup = document.getElementById("roomMockup");
        
            function adjustLayout() {
                const roomMockup = document.getElementById("roomMockup");
                const preview = document.getElementById("preview");
                
                // Ensure 4:3 and 1:1 aspect ratios stay consistent
                preview.style.height = preview.offsetWidth + "px";
                roomMockup.style.height = (roomMockup.offsetWidth * 3) / 4 + "px";
            }
            window.addEventListener("resize", adjustLayout);
            adjustLayout();
            
            // Call on load and resize
            adjustLayout();
            window.addEventListener("resize", adjustLayout);
            
            // Adjust layout on page load and resize
            adjustLayout();
            window.addEventListener("resize", adjustLayout);
        });    

    // ** Populate Collections Sidebar **
    function populateCollectionsList(collections) {
        const collectionsList = document.getElementById("collectionsList");
        collectionsList.innerHTML = "";

        collections.forEach(collection => {
            const li = document.createElement("li");
            li.className = "text-white hover:underline cursor-pointer p-2 hover:bg-gray-700 rounded";
            li.textContent = collection.name;
            li.addEventListener("click", () => handleCollectionSelection(collection));
            collectionsList.appendChild(li);
        });
    }

    // ** Handle Collection Selection **
    function handleCollectionSelection(collection) {
        console.log("Handling collection:", collection);
        
        if (!collection?.patterns || !Array.isArray(collection.patterns)) {
            console.error("FATAL: Invalid collection structure", collection);
            return;
        }
        
        selectedCollection = collection;
        populatePatternDropdown(collection.patterns);
        populateCuratedColors(collection.curatedColors || []);
        
        if (collection.patterns.length > 0) {
            handlePatternSelection(collection.patterns[0].name);
        }
    }

    // ** Modified Pattern Dropdown Population **
    function populatePatternDropdown(patterns) {
        const patternDropdown = document.getElementById("patternDropdown");
        if (!patternDropdown) return;
    
        patternDropdown.innerHTML = "";
    
        // Ultimate validation
        if (!patterns || !Array.isArray(patterns) || patterns.some(p => !p?.name)) {
            console.error("Invalid patterns data:", patterns);
            patternDropdown.innerHTML = `<option>No patterns available</option>`;
            return;
        }
    
        // Safe iteration
        try {
            patterns.forEach(pattern => {
                const option = document.createElement("option");
                option.value = pattern.name;
                option.textContent = pattern.name.replace(/-/g, " ");
                patternDropdown.appendChild(option);
            });
        } catch (error) {
            console.error("Pattern population failed:", error);
            patternDropdown.innerHTML = `<option>Error loading patterns</option>`;
        }
    }

     // Call this to attach event listeners dynamically when new layers are created
    setupColorPalette();

    // Attach event listeners when layer circles are updated dynamically
    // Replace the setupColorPalette() function with this:
    function setupColorPalette() {
        document.addEventListener('click', (event) => {
            const circle = event.target.closest('.circle-input');
            if (!circle || !selectedCollection) return;
    
            // Use collection's curated colors
            const curatedColors = [...selectedCollection.curatedColors];
            showColorPalette(circle, curatedColors);
        });
    }

    // Remove any other duplicate event listener code
    
    function showColorPalette(targetCircle, curatedColors) {
        if (!curatedColors || curatedColors.length === 0) {
            console.error("Curated colors not available.");
            return;
        }
    
        // Clear existing palettes
        document.querySelectorAll(".color-palette").forEach((palette) => palette.remove());
    
        const paletteContainer = document.createElement("div");
        paletteContainer.className = "color-palette";
        paletteContainer.style.position = "absolute";
        paletteContainer.style.top = `${targetCircle.getBoundingClientRect().bottom + window.scrollY}px`;
        paletteContainer.style.left = `${targetCircle.getBoundingClientRect().left + window.scrollX}px`;
        paletteContainer.style.display = "grid";
        paletteContainer.style.gridTemplateColumns = "repeat(4, 1fr)";
        paletteContainer.style.gap = "5px";
        paletteContainer.style.padding = "10px";
        paletteContainer.style.background = "#333";
        paletteContainer.style.border = "1px solid white";
        paletteContainer.style.borderRadius = "8px";
        paletteContainer.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.3)";
    
        // Populate curated colors
        curatedColors.forEach((color) => {
            const colorOption = document.createElement("div");
            colorOption.className = "color-option";
            colorOption.style.width = "30px";
            colorOption.style.height = "30px";
            colorOption.style.borderRadius = "50%";
            colorOption.style.backgroundColor = getColorHex(color);
            colorOption.dataset.color = color;
            colorOption.style.cursor = "pointer";
            colorOption.style.border = "2px solid transparent";
    
            colorOption.addEventListener("click", () => {
                targetCircle.style.backgroundColor = getColorHex(color);
                const associatedInput = document.getElementById(targetCircle.id.replace("Circle", ""));
                if (associatedInput) {
                    associatedInput.value = color;
                }
                paletteContainer.remove();
                updatePreview();
            });
    
            colorOption.addEventListener("mouseover", () => {
                colorOption.style.border = "2px solid white";
            });
    
            colorOption.addEventListener("mouseout", () => {
                colorOption.style.border = "2px solid transparent";
            });
    
            paletteContainer.appendChild(colorOption);
        });
    
        document.body.appendChild(paletteContainer);
    
        document.addEventListener(
            "click",
            (event) => {
                if (!paletteContainer.contains(event.target) && event.target !== targetCircle) {
                    paletteContainer.remove();
                }
            },
            { once: true }
        );
    }


    // Attach view/delete globally
    window.viewCombination = viewCombination;
    window.deleteCombination = deleteCombination;

    // ** Load Colors JSON **
    function loadColors() {
        return fetch(colorsPath)
            .then((response) => response.json())
            .then((data) => {
                colorMap = data.reduce((map, color) => {
                    map[color.color_name.toLowerCase()] = `#${color.hex}`;
                    return map;
                }, {});
            })
            .catch((error) => console.error("Error loading colors.json:", error));
    }

    // ** Load Collections JSON **
    function loadCollections() {
        return fetch(collectionsPath)
            .then(response => {
                console.log("HTTP Response:", response); // ✅ Status code
                return response.json().catch(e => {
                    console.error("JSON Parse Error:", e);
                    throw new Error("Invalid JSON syntax");
                });
            })
            .then(data => {
                console.log("Raw JSON Data:", data); // ✅ Verify structure
                
                if (!data.collections) {
                    throw new Error("Root 'collections' property missing");
                }
                
                collectionsData = data.collections;
                console.log("All Collections:", collectionsData); // ✅
                
                const validCollections = collectionsData.filter(c => 
                    c.patterns && Array.isArray(c.patterns)
                );
                console.log("Valid Collections:", validCollections); // ✅
                
                populateCollectionsList(validCollections);
                selectDefaultCollection(validCollections);
            })
            .catch(error => {
                console.error("FULL ERROR TRACE:", error);
                document.getElementById("patternDropdown").innerHTML = 
                    '<option>Failed to load collections</option>';
            });
    }

    // Add this new function
    function selectDefaultCollection(collections) {
        if (!collections || collections.length === 0) {
            console.error("NO COLLECTIONS FOUND");
            document.getElementById("patternDropdown").innerHTML = 
                '<option>No collections available</option>';
            return;
        }
        
        const validCollection = collections.find(c => 
            c.patterns && Array.isArray(c.patterns) && c.patterns.length > 0
        );
        
        if (validCollection) {
            handleCollectionSelection(validCollection);
        } else {
            console.error("All collections are invalid");
            document.getElementById("patternDropdown").innerHTML = 
                '<option>No valid patterns found</option>';
        }
    }

    // ** Populate Pattern Dropdown **
    function populatePatternDropdown(patterns) {
        const patternDropdown = document.getElementById("patternDropdown");
        
        // Ultimate safeguard
        if (!Array.isArray(patterns)) {
            console.error("CRITICAL: patterns is not an array", patterns);
            patternDropdown.innerHTML = '<option>Pattern load failed</option>';
            return;
        }
    
        patternDropdown.innerHTML = "";
        
        try {
            patterns.forEach((pattern) => {
                if (!pattern?.name) {
                    console.warn("Skipping invalid pattern:", pattern);
                    return;
                }
                const option = document.createElement("option");
                option.value = pattern.name;
                option.textContent = pattern.name.replace(/-/g, " ");
                patternDropdown.appendChild(option);
            });
        } catch (error) {
            console.error("Pattern population crashed:", error);
            patternDropdown.innerHTML = '<option>Error loading patterns</option>';
        }
    }

    // ** Select Default Pattern **
    function selectDefaultPattern(collections) {
        const defaultPattern = collections[0]?.patterns[0];
        if (defaultPattern) {
            loadPattern(defaultPattern);
        }
    }

    // ** Load a Pattern **
    function loadPattern(pattern) {
        selectedPattern = pattern;
        initialize();
    }

    // ** Get Hex Color **
    function getColorHex(colorName) {
        if (!colorName || typeof colorName !== "string") {
            console.warn(`Invalid color name: "${colorName}". Defaulting to black.`);
            return "#000000"; // Default fallback color
        }
        const colorHex = colorMap[colorName.toLowerCase()] || null;
        if (!colorHex) {
            console.warn(`Color "${colorName}" not found in color map.`);
        }
        return colorHex || "#000000"; // Default to black if not found
    }


    // Attach event listeners to user color circles
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll(".circle-input").forEach(circle => {
            const inputField = document.getElementById(circle.id.replace("Circle", ""));
            circle.addEventListener("click", () => showColorPalette(circle, inputField));
        });
    });



    // ** Update Preview **
    function updatePreview() {
        const bgColor = getColorHex(bgColorInput.value.trim()) || "#FFFFFF";
        preview.style.backgroundColor = bgColor;
        preview.innerHTML = "";
    
        selectedPattern.layers.forEach((layer, index) => {
            const layerDiv = document.createElement("div");
            layerDiv.className = "blend-layer";
            layerDiv.style.maskImage = `url(./collections/bombay/${layer})`;
            layerDiv.style.webkitMaskImage = `url(./collections/bombay/${layer})`;
            layerDiv.style.maskRepeat = "no-repeat";
            layerDiv.style.webkitMaskRepeat = "no-repeat";
            layerDiv.style.maskSize = "contain";
            layerDiv.style.webkitMaskSize = "contain";
    
            // Handle missing or undefined layer inputs
            const layerInput = layerInputs[index]?.input;
            if (!layerInput) {
                console.warn(`Layer ${index + 1} input is missing.`);
                return; // Skip this layer if the input is missing
            }
    
            const layerColor = getColorHex(layerInput.value.trim()) || "#000000";
            layerDiv.style.backgroundColor = layerColor;
    
            preview.appendChild(layerDiv);
        });
    
        // Extract user-specified colors for coordinates
        const userBgColor = bgColor;
        const layerColors = layerInputs.map(({ input }) => getColorHex(input.value) || "#000000");
    
        console.log("Preview update: bgColor resolved as", userBgColor);
        layerColors.forEach((color, index) =>
            console.log(`Layer ${index + 1} input: resolved color`, color)
        );
    
        // Update room mockup and coordinates with user-specified colors
        updateRoomMockup(userBgColor, selectedPattern.layers);
        populateCoordinates(selectedPattern.coordinates, userBgColor, layerColors);
    }

    // ** Update Room Mockup **
    // ** Update Room Mockup **
    function updateRoomMockup(bgColor, layers) {
        roomMockup.innerHTML = ""; // Clear existing layers
    
        // Mockup Background
        const mockupBackground = document.createElement("div");
        mockupBackground.style.backgroundColor = bgColor;
        mockupBackground.style.position = "absolute";
        mockupBackground.style.width = "100%";
        mockupBackground.style.height = "100%";
        roomMockup.appendChild(mockupBackground);
    
        // Mockup Layers
        layers.forEach((layer, index) => {
            const layerDiv = document.createElement("div");
            layerDiv.className = "blend-layer";
            layerDiv.style.maskImage = `url(./collections/bombay/${layer})`;
            layerDiv.style.webkitMaskImage = `url(./collections/bombay/${layer})`;
            layerDiv.style.maskRepeat = "repeat";
            layerDiv.style.webkitMaskRepeat = "repeat";
            layerDiv.style.maskSize = "50%";
            layerDiv.style.webkitMaskSize = "50%";
    
            // Get the color for this layer
            const layerInput = document.getElementById(`layer${index + 1}Color`);
            const layerColor = getColorHex(layerInput?.value.trim()) || "#000000";
            layerDiv.style.backgroundColor = layerColor;
    
            roomMockup.appendChild(layerDiv);
        });
    
        // Mockup Overlay
        const overlay = document.createElement("div");
        overlay.style.backgroundImage = "url(./mockups/English-Countryside-Bedroom-3a.png)";
        overlay.style.backgroundSize = "contain";
        overlay.style.backgroundRepeat = "no-repeat";
        overlay.style.backgroundPosition = "center center";
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.zIndex = "10";
        roomMockup.appendChild(overlay);
    }

    // ** Populate Coordinates **
    function populateCoordinates(coordinates, mainPatternBgColor, mainPatternLayerColors) {
        const coordinatesContainer = document.getElementById("coordinatesContainer");
        coordinatesContainer.innerHTML = ""; // Clear previous coordinates
    
        if (!coordinates || coordinates.length === 0) {
            console.warn("No coordinates available for this pattern.");
            return;
        }
    
        console.log("Populating coordinates with main pattern bgColor:", mainPatternBgColor);
    
            coordinates.forEach((coordinatePatternName, index) => { // ✅ Declare `index`
            console.log(`Looking up coordinate pattern: ${coordinatePatternName}`);
    
            // Fetch the coordinate's pattern data
            const coordinatePattern = getPatternByName(coordinatePatternName, collectionsData);
            if (!coordinatePattern) {
                console.error(`Pattern "${coordinatePatternName}" not found.`);
                return;
            }
    
            // Use collection colors instead of pattern colors
            const collectionColors = selectedCollection?.curatedColors || [];
            
            const coordinateBgColor = mainPatternBgColor || getColorHex(collectionColors[0]);
            const coordinateLayerColors = mainPatternLayerColors.length > 0
                ? mainPatternLayerColors
                : collectionColors.slice(1).map(getColorHex);
    
            console.log(`Coordinate "${coordinatePatternName}" -> bgColor: ${coordinateBgColor}, layers:`, coordinateLayerColors);
    
            // Create coordinate box
            const coordinateBox = document.createElement("div");
            coordinateBox.className = "coordinate-box";
            coordinateBox.style.width = "100px";
            coordinateBox.style.height = "100px";
            coordinateBox.style.position = "relative";
            coordinateBox.style.margin = "0px";
            coordinateBox.style.border = "1px solid white";
            coordinateBox.style.left = `${index * -25}px`; // Increase overlap
            // coordinateBox.style.transform = "none";
            coordinateBox.style.zIndex = `${coordinates.length - index}`; // ✅ Now `index` is defined
            coordinateBox.style.backgroundColor = coordinateBgColor; // Apply main background color
    
            // Add layers dynamically
            coordinatePattern.layers.forEach((layer, layerIndex) => {
                const layerPath = `./collections/bombay/${layer}`;
                console.log(`Applying coordinate layer: ${layerPath}`);
    
                const layerDiv = document.createElement("div");
                layerDiv.className = "blend-layer";
    
                layerDiv.style.maskImage = `url(${layerPath})`;
                layerDiv.style.webkitMaskImage = `url(${layerPath})`;
                layerDiv.style.maskRepeat = "no-repeat";
                layerDiv.style.webkitMaskRepeat = "no-repeat";
                layerDiv.style.maskSize = "contain";
                layerDiv.style.webkitMaskSize = "contain";
    
                // Apply user-specified or curated layer colors
                layerDiv.style.backgroundColor = coordinateLayerColors[layerIndex] || coordinateBgColor;
    
                coordinateBox.appendChild(layerDiv);
            });
    
            coordinatesContainer.appendChild(coordinateBox);
        });
    
        console.log("Coordinates updated successfully.");
    }

    // Populate curated colors
// Populate curated colors
function populateCuratedColors(colors) {
    curatedColorsContainer.innerHTML = ""; // Clear existing
    colors.forEach((colorName) => {
        const colorCircle = document.createElement("div");
        colorCircle.className = "circle";
        colorCircle.style.backgroundColor = getColorHex(colorName);
        colorCircle.title = colorName;
        colorCircle.addEventListener("click", () => {
            console.log(`Curated color clicked: ${colorName}`);
            bgColorInput.value = colorName;
            bgColorCircle.style.backgroundColor = getColorHex(colorName);
            updatePreview();
        });
        curatedColorsContainer.appendChild(colorCircle);
    });
}





// ** Initialize Input Fields **
    function setupInputField(input, circle, placeholder) {
        // Initialize the input with placeholder if empty
        if (!input.value.trim()) {
            input.value = placeholder;
            circle.style.backgroundColor = "#000000"; // Default to black
        }
    
        // Focus: Always clear the field on focus, regardless of its content
        input.addEventListener("focus", () => {
            if (input.value === placeholder || input.value.trim() === "") {
                input.value = ""; // Clear the field
                circle.style.backgroundColor = "#000000"; // Reset color to black
            }
        });
    
        // Blur: Restore the placeholder if the field is empty
        input.addEventListener("blur", () => {
            if (!input.value.trim()) {
                input.value = placeholder; // Restore placeholder
                circle.style.backgroundColor = "#000000"; // Reset color to black
            } else {
                // Validate and set color from input
                const color = getColorHex(input.value.trim()) || "#FFFFFF";
                circle.style.backgroundColor = color; // Update circle color
            }
        });
    
        // Input: Update the circle color and preview dynamically as the user types
        input.addEventListener("input", () => {
            const color = getColorHex(input.value.trim()) || "#FFFFFF";
            circle.style.backgroundColor = color; // Update circle color
            updatePreview(); // Trigger preview update
        });
    }

    // ** Save Combination **
    saveCombinationButton.addEventListener("click", () => {
        if (savedCombinations.length >= 5) {
            alert("You can save up to 5 combinations only.");
            return;
        }
    
        const newCombination = {
            bgColor: bgColorInput.value.trim(), // ✅ Ensure user-input color is saved
            layers: selectedPattern.layers.map((layer, index) => {
                const layerInput = document.getElementById(`layer${index + 1}Color`);
                return layerInput?.value.trim() || "Unknown";
            }),
            patternName: selectedPattern?.name || "Unknown Pattern",
        };
    
        // Check for duplicates correctly
        const isDuplicate = savedCombinations.some(
            (combo) =>
                combo.bgColor === newCombination.bgColor &&
                JSON.stringify(combo.layers) === JSON.stringify(newCombination.layers) &&
                combo.patternName === newCombination.patternName
        );
    
        if (isDuplicate) {
            alert("This combination is already saved.");
            return;
        }
    
        savedCombinations.push(newCombination);
        displaySavedCombinations(); // Re-render saved combinations in the UI
        console.log("Saved Combinations:", savedCombinations);
    });

// ** Display Saved Combinations **
function displaySavedCombinations() {
    const container = document.getElementById("combinationsContainer");
    if (!container) {
        console.error("Container element with id 'combinationsContainer' not found.");
        return;
    }

    container.innerHTML = ""; // Clear existing combinations

    savedCombinations.forEach((combination, index) => {
        const layerColors = Array.isArray(combination.layers) ? combination.layers : [];

        // Combination card container
        const combinationDiv = document.createElement("div");
        combinationDiv.className =
            "combination-box flex flex-col gap-2 p-3 border border-gray-700 rounded bg-black text-white";

        // Pattern name display
        const patternNameDiv = document.createElement("div");
        patternNameDiv.className = "text-sm font-bold text-white truncate";
        patternNameDiv.textContent = combination.patternName?.replace(/^\d+-/, "") || "Unknown Pattern";

        // Background color display
        const bgColorDiv = document.createElement("div");
        bgColorDiv.className = "flex items-center gap-1 text-sm";
        bgColorDiv.innerHTML = `
            <span class="font-bold">BG:</span>
            <div class="w-5 h-5 rounded-full" style="background-color: ${getColorHex(combination.bgColor)}"></div>
        `;

        // Layer colors display
        const layersDiv = document.createElement("div");
        layersDiv.className = "flex flex-wrap items-center gap-1 text-sm";
        layersDiv.innerHTML = `
            <span class="font-bold">Layers:</span>
            ${layerColors
                .map(
                    (color) =>
                        `<div class="w-5 h-5 rounded-full" style="background-color: ${getColorHex(
                            color
                        )}"></div>`
                )
                .join("")}
        `;

        // Buttons for each combination
        const buttonsDiv = document.createElement("div");
        buttonsDiv.className = "flex justify-between items-center gap-2 mt-2";

        // View button
        const viewButton = document.createElement("button");
        viewButton.className = "bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 py-1 rounded";
        viewButton.textContent = "View";
        viewButton.onclick = () => viewCombination(combination);

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.className = "bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1 rounded";
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => {
            savedCombinations.splice(index, 1); // Remove the combination
            displaySavedCombinations(); // Refresh the UI
        };

        buttonsDiv.appendChild(viewButton);
        buttonsDiv.appendChild(deleteButton);

        // Append all parts to the combination div
        combinationDiv.appendChild(patternNameDiv); // Add pattern name
        combinationDiv.appendChild(bgColorDiv);
        combinationDiv.appendChild(layersDiv);
        combinationDiv.appendChild(buttonsDiv);

        // Add the combination div to the container
        container.appendChild(combinationDiv);
    });
}

    // ** View Combination **
    function viewCombination(combination) {
        if (!combination?.patternName) {
            console.error("Invalid combination");
            return;
        }
    
        // Find pattern within selected collection
        const pattern = selectedCollection?.patterns?.find(p => p.name === combination.patternName);
        if (!pattern) {
            alert("Pattern not found in current collection");
            return;
        }
    
        selectedPattern = pattern;
        
        // Set colors from combination using collection colors as fallback
        const collectionColors = selectedCollection.curatedColors || [];
        
        bgColorInput.value = combination.bgColor || collectionColors[0];
        bgColorCircle.style.backgroundColor = getColorHex(combination.bgColor) || collectionColors[0];
    
    
        // ✅ Populate layer inputs with saved colors
        pattern.layers.forEach((layer, index) => {
            const layerInput = document.getElementById(`layer${index + 1}Color`);
            if (layerInput) {
                layerInput.value = combination.layers[index] || "";
                const layerCircle = document.getElementById(`layer${index + 1}ColorCircle`);
                if (layerCircle) {
                    layerCircle.style.backgroundColor =
                        getColorHex(combination.layers[index]) || "#000000";
                }
            }
        });
    
        // ✅ Trigger a full UI update
        updatePreview();
        console.log("Pattern and colors updated successfully.");
    }

    // ** Delete Combination **
    function deleteCombination(index) {
        if (!savedCombinations[index]) {
            console.error("Invalid combination index");
            return;
        }

        savedCombinations.splice(index, 1);
        displaySavedCombinations();
    }

    // ** Handle Pattern Selection **
    function handlePatternSelection(patternName) {
        if (!selectedCollection) {
            console.error("No collection selected");
            return;
        }
    
        // Find pattern within selected collection
        const pattern = selectedCollection.patterns.find(p => p.name === patternName);
        if (!pattern) return;
    
        // Use COLLECTION colors instead of pattern colors
        const collectionColors = selectedCollection.curatedColors || [];
        
        // Update selected pattern
        selectedPattern = pattern;
    
        // Set background color from collection
        const bgColor = collectionColors[0] || "Enter background color";
        bgColorInput.value = bgColor;
        bgColorCircle.style.backgroundColor = getColorHex(bgColor);
    
        // Set layer colors from collection
        pattern.layers.forEach((layer, index) => {
            const layerInput = document.getElementById(`layer${index + 1}Color`);
            if (layerInput) {
                const designColor = collectionColors[index + 1] || "Enter design color";
                layerInput.value = designColor;
                const designColorCircle = document.getElementById(`layer${index + 1}ColorCircle`);
                if (designColorCircle) {
                    designColorCircle.style.backgroundColor = getColorHex(designColor);
                }
            }
        });
    
        // Initialize with collection colors
        initialize();
        updatePreview();
    }

    // ** Get Pattern by Name **
    function getPatternByName(patternName, collectionsData) {
        console.log(`Searching for pattern: "${patternName}" in collectionsData`);
    
        // Search through all collections and their patterns
        for (const collection of collectionsData) {
            const matchingPattern = collection.patterns.find((pattern) => pattern.name === patternName);
            if (matchingPattern) {
                console.log(`Pattern found:`, matchingPattern);
                return matchingPattern;
            }
        }
    
        console.error(`Pattern "${patternName}" not found in any collection.`);
        return null;
    }

    // ** Initialize App **
    function initialize() {
        if (!selectedPattern || !selectedCollection) {
            console.error("Initialization failed: No pattern or collection selected");
            return;
        }
    
        // Get colors from collection
        const collectionColors = selectedCollection.curatedColors || [];
        
        // Clear existing layer inputs
        const layerInputsContainer = document.getElementById("layerInputsContainer");
        layerInputsContainer.innerHTML = "";
        layerInputs = [];
    
        // Set background color from collection
        const bgColor = collectionColors[0] || "#FFFFFF";
        bgColorInput.value = bgColor;
        bgColorCircle.style.backgroundColor = getColorHex(bgColor);
    
        // Create layer inputs with collection colors
        selectedPattern.layers.forEach((layer, index) => {
            const layerNumber = index + 1;
            const inputId = `layer${layerNumber}Color`;
            
            // Use collection colors with fallback
            const designColor = collectionColors[layerNumber] || "#000000";
            
            // Create input elements
            const layerInputDiv = document.createElement("div");
            layerInputDiv.className = "text-center";
    
            const label = document.createElement("label");
            label.className = "block text-light mb-2";
            label.textContent = `Layer ${layerNumber}`;
    
            const circle = document.createElement("div");
            circle.className = "circle-input";
            circle.id = `${inputId}Circle`;
            circle.style.backgroundColor = getColorHex(designColor);
    
            const input = document.createElement("input");
            input.type = "text";
            input.className = "text-input";
            input.id = inputId;
            input.placeholder = `Enter layer ${layerNumber} color`;
            input.value = designColor;
    
            // Attach input events
            setupInputField(input, circle, `Enter layer ${layerNumber} color`);
    
            layerInputDiv.appendChild(label);
            layerInputDiv.appendChild(circle);
            layerInputDiv.appendChild(input);
            layerInputsContainer.appendChild(layerInputDiv);
    
            layerInputs.push({ input, circle });
        });
    
        // Update pattern name display
        const patternNameElement = document.getElementById("patternName");
        if (patternNameElement) {
            patternNameElement.textContent = selectedPattern.name.replace(/^\d+-/, "");
        }
    
        updatePreview();
        console.log("Initialization complete");
    }

    // ** Attach Events **
    patternDropdown.addEventListener("change", (e) => {
        const patternName = e.target.value;
        handlePatternSelection(patternName);
    });

    // ** Load Data and Initialize **
    Promise.all([loadColors(), loadCollections()]).then(() => {
        console.log("App initialized successfully.");
    });
});