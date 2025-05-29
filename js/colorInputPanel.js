// curatedColorsUI.js
import { appState } from './state.js';
import { dom } from './ui.js';
import { toInitialCaps, getContrastClass, stripSWNumber } from './utils.js';
import { updateRoomMockup } from './updateRoomMockup.js';
import { runStaticTicket } from './ticketFeature.js';
import { populateCoordinates } from './populateCoordinates.js';
import { highlightActiveLayer } from './patternSelection.js';
import { lookupColor } from './color-functions.js';
import { updateDisplays } from './displayController.js';



export function createColorInput(label, id, initialColor, isBackground = false) {
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

    // const isFurniturePattern = appState.currentPattern?.isFurniture || false;
    // if (isFurniturePattern) {
    //   updateFurniturePreview();
    // } else {
    //   updatePreview();
    // }

    updateRoomMockup();
    populateCoordinates();
  };

  input.addEventListener("blur", updateColor);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") updateColor();
  });

  console.log(`Attaching click handler to ${label} color circle, ID: ${colorCircle.id}`);
  colorCircle.addEventListener("click", () => {
    appState.lastSelectedLayer = layerData;
    highlightActiveLayer(colorCircle);
    console.log(`Clicked ${label} color circle`);
  });

  return layerData;
}

export function populateCuratedColors(colors) {
  if (!dom.curatedColorsContainer) {
    console.error("curatedColorsContainer not found in DOM");
    return;
  }
  if (!colors || !colors.length) {
    console.warn("No curated colors provided yet, waiting...");
    return;
  }

  dom.curatedColorsContainer.innerHTML = "";

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
    const ticketNumber = prompt("🎯 Enter the Sherwin-Williams Ticket Number:");
    if (ticketNumber) {
      runStaticTicket(ticketNumber.trim());
    }
  });

  dom.curatedColorsContainer.appendChild(ticketCircle);

  colors.forEach(color => {
    const hex = lookupColor(color);
    const circle = document.createElement("div");
    circle.className = "w-20 h-20 rounded-full cursor-pointer relative flex items-center justify-center";
    circle.style.backgroundColor = hex;

    const text = document.createElement("span");
    text.className = `text-xs font-bold text-center ${getContrastClass(hex)} whitespace-pre-line`;

    const match = color.match(/^(SW|SC)\s*(\d+)\s+(.+)$/i);
    text.textContent = match
      ? `${match[1]}${match[2]}\n${toInitialCaps(match[3])}`
      : toInitialCaps(color);

    circle.appendChild(text);

    circle.addEventListener("click", () => {
      try {
        const strippedColor = stripSWNumber(color);
        const selectedLayer = appState.lastSelectedLayer;
        if (!selectedLayer) return alert("Please select a layer first.");

        selectedLayer.input.value = toInitialCaps(strippedColor);
        selectedLayer.circle.style.backgroundColor = hex;

        const layerIndex = appState.currentLayers.findIndex(layer => layer.label === selectedLayer.label);
        if (layerIndex !== -1) {
          appState.currentLayers[layerIndex].color = strippedColor;

          const inputIndex = appState.layerInputs.findIndex(li => li.label === selectedLayer.label);
          if (inputIndex !== -1) {
            appState.layerInputs[inputIndex].input.value = toInitialCaps(strippedColor);
            appState.layerInputs[inputIndex].circle.style.backgroundColor = hex;
          }
        }

        appState.lastSelectedColor = { name: strippedColor, hex };
        updateDisplays();
      } catch (e) {
        console.error("Error in curated color click:", e);
      }
    });

    dom.curatedColorsContainer.appendChild(circle);
  });

  console.log("✅ Curated colors populated:", colors.length);
}
