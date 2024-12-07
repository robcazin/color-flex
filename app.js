document.addEventListener('DOMContentLoaded', () => {
    // Set default white colors for each layer
    applyColor('layer1', 'ffffff');
    applyColor('layer2', 'ffffff');
    applyColor('layer3', 'ffffff');
    applyColor('layer4', 'ffffff');
    // Set the background color to black
    document.getElementById('preview').style.backgroundColor = '#000000';
});

document.getElementById('bgColor').addEventListener('input', async () => {
    const colorName = document.getElementById('bgColor').value.trim();
    if (colorName) {
        const color = await fetchColor(colorName);
        if (color) {
            applyColor('preview', color.hex);
        }
    }
});

['layer1Color', 'layer2Color', 'layer3Color', 'layer4Color'].forEach(layerId => {
    document.getElementById(layerId).addEventListener('input', async (event) => {
        const colorName = event.target.value.trim();
        if (colorName) {
            const color = await fetchColor(colorName);
            if (color) {
                const layer = layerId.replace('Color', '');
                applyColor(layer, color.hex);
            }
        }
    });
});

// async function fetchColor(colorName) {
//     try {
//         const response = await fetch('colors.json');
//         const colors = await response.json();
//         return colors.find(color => color.color_name.toLowerCase() === colorName.toLowerCase());
//     } catch (error) {
//         console.error('Error fetching color data:', error);
//     }
// }
async function fetchColor(colorName) {
    try {
        const response = await fetch('colors.json');
        const colors = await response.json();
        return colors.find(color => color.color_name.toLowerCase() === colorName.toLowerCase()) || { hex: '000000' };
    } catch (error) {
        console.error('Error fetching color data:', error);
        return { hex: '000000' }; // Default fallback color
    }
}

// function applyColor(elementId, hex) {
//     const element = document.getElementById(elementId);
//     element.style.backgroundColor = `#${hex}`;
// }
function applyColor(elementId, hex) {
    console.log(`Applying color #${hex} to ${elementId}`);
    const element = document.getElementById(elementId);
    if (element) {
        element.style.backgroundColor = `#${hex}`;
    } else {
        console.error(`Element with ID ${elementId} not found.`);
    }
}

// Handle pattern selection
function selectPattern(pattern) {
    // Correct IDs to match HTML structure
    document.getElementById('layer1Thumbnail').src = `img/${pattern}_layer1_wb.png`;
    document.getElementById('layer2Thumbnail').src = `img/${pattern}_layer2_wb.png`;
    document.getElementById('layer3Thumbnail').src = `img/${pattern}_layer3_wb.png`;
    document.getElementById('layer4Thumbnail').src = `img/${pattern}_layer4_wb.png`;

    // Update the preview layers with the selected pattern
    document.getElementById('layer1').style.maskImage = `url(img/${pattern}_layer1.png)`;
    document.getElementById('layer2').style.maskImage = `url(img/${pattern}_layer2.png)`;
    document.getElementById('layer3').style.maskImage = `url(img/${pattern}_layer3.png)`;
    document.getElementById('layer4').style.maskImage = `url(img/${pattern}_layer4.png)`;
}

// Store combinations
let savedCombinations = [];

document.getElementById('saveCombination').addEventListener('click', () => {
    if (savedCombinations.length < 5) {
        const combination = {
            bgColor: document.getElementById('bgColor').value.trim(),
            layer1Color: document.getElementById('layer1Color').value.trim(),
            layer2Color: document.getElementById('layer2Color').value.trim(),
            layer3Color: document.getElementById('layer3Color').value.trim(),
            layer4Color: document.getElementById('layer4Color').value.trim(),
        };
        savedCombinations.push(combination);
        displaySavedCombinations();
    } else {
        alert('You can save up to 5 combinations only.');
    }
});

function displaySavedCombinations() {
    const container = document.getElementById('combinationsContainer');
    container.innerHTML = '';
    savedCombinations.forEach((combination, index) => {
        const combinationDiv = document.createElement('div');
        combinationDiv.className = 'combination bg-dark text-light';
        combinationDiv.innerHTML = `
            <h3 class="text-xl font-semibold mb-2">Combination ${index + 1}</h3>
            <p><strong>Background:</strong> ${combination.bgColor}</p>
            <p><strong>Layer 1:</strong> ${combination.layer1Color}</p>
            <p><strong>Layer 2:</strong> ${combination.layer2Color}</p>
            <p><strong>Layer 3:</strong> ${combination.layer3Color}</p>
            <p><strong>Layer 4:</strong> ${combination.layer4Color}</p>
            <div class="button-container">
                <button class="view-combination bg-blue-300 text-white rounded p-2 mt-2" onclick="viewCombination(${index})">View</button>
                <button class="delete-combination bg-red-400 text-white rounded p-2 mt-2" onclick="deleteCombination(${index})">Delete</button>
            </div>
        `;
        container.appendChild(combinationDiv);
    });
}

function viewCombination(index) {
    const combination = savedCombinations[index];
    const bgColorInput = document.getElementById('bgColor');
    const layer1ColorInput = document.getElementById('layer1Color');
    const layer2ColorInput = document.getElementById('layer2Color');
    const layer3ColorInput = document.getElementById('layer3Color');
    const layer4ColorInput = document.getElementById('layer4Color');

    bgColorInput.value = combination.bgColor;
    layer1ColorInput.value = combination.layer1Color;
    layer2ColorInput.value = combination.layer2Color;
    layer3ColorInput.value = combination.layer3Color;
    layer4ColorInput.value = combination.layer4Color;

    // Trigger input events to update colors
    bgColorInput.dispatchEvent(new Event('input'));
    layer1ColorInput.dispatchEvent(new Event('input'));
    layer2ColorInput.dispatchEvent(new Event('input'));
    layer3ColorInput.dispatchEvent(new Event('input'));
    layer4ColorInput.dispatchEvent(new Event('input'));
}

function deleteCombination(index) {
    savedCombinations.splice(index, 1);
    displaySavedCombinations();
}

function updateTiledPreview() {
    const bgColor = document.getElementById('bgColor').value.trim();
    const layer1Color = document.getElementById('layer1Color').value.trim();
    const layer2Color = document.getElementById('layer2Color').value.trim();
    const layer3Color = document.getElementById('layer3Color').value.trim();
    const layer4Color = document.getElementById('layer4Color').value.trim();

    const tiledArea = document.getElementById('tiledArea');

    // Set background color
    tiledArea.style.backgroundColor = bgColor ? `#${bgColor}` : '#000';

    // Use first active layer to tile the preview
    const layerImages = [
        `url('img/layer1.png')`,
        `url('img/layer2.png')`,
        `url('img/layer3.png')`,
        `url('img/layer4.png')`,
    ];

    const tileImage = layerImages.find((url, index) => {
        const color = [layer1Color, layer2Color, layer3Color, layer4Color][index];
        return color && url;
    });

    if (tileImage) {
        tiledArea.style.backgroundImage = tileImage;
        tiledArea.style.backgroundRepeat = 'repeat';
        tiledArea.style.backgroundSize = 'contain';
    } else {
        tiledArea.style.backgroundImage = 'none'; // Clear if no layers are active
    }
}

['bgColor', 'layer1Color', 'layer2Color', 'layer3Color', 'layer4Color'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateTiledPreview);
});

function addPatternHoverEffect() {
    document.querySelectorAll('.thumbnail').forEach(thumbnail => {
        thumbnail.addEventListener('mouseover', event => {
            const pattern = event.target.getAttribute('data-pattern');
            if (pattern) {
                document.getElementById('preview').style.backgroundImage = `url('img/${pattern}.png')`;
            }
        });
        thumbnail.addEventListener('mouseout', () => {
            document.getElementById('preview').style.backgroundImage = 'none'; // Reset on hover out
        });
    });
}

function saveToLocalStorage() {
    localStorage.setItem('savedCombinations', JSON.stringify(savedCombinations));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('savedCombinations');
    if (data) {
        savedCombinations = JSON.parse(data);
        displaySavedCombinations();
    }
}

// Call this on page load
document.addEventListener('DOMContentLoaded', loadFromLocalStorage);
document.getElementById('exportImage').addEventListener('click', () => {
    html2canvas(document.getElementById('preview')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'custom_preview.png';
        link.href = canvas.toDataURL();
        link.click();
    });
});

document.addEventListener('DOMContentLoaded', addPatternHoverEffect);

// document.getElementById('tiledArea').style.backgroundImage = "url('img/pattern1.png')";