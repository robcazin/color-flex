# 🎨 ColorFlex: Custom Pattern Design App

ColorFlex is a browser-based tool for visualizing and customizing wallpaper and pattern-based surfaces using real Sherwin-Williams color codes. The app loads curated pattern collections and allows users to preview how designs look across mockups and coordinates, including walls and furniture.

---

## ✨ Features

- Load and preview high-resolution patterns by collection
- Customize color inputs (including real SW codes)
- Real-time rendering in a pattern preview window and room mockup
- Supports scaling patterns (1x, 2x, 3x, 4x)
- Coordinate selection and previewing (pillows, ottomans, etc.)
- "Return to Pattern" logic to go back to full design preview
- "Ticket" feature that helps users record or share choices

---

## 📁 Project Structure

- `index.html`: Main app entry point
- `data/collections`: JSON configs and layer assets
    Content Structure
        data/
        collections/
            <collection-name>/
            - config.json
            - layers/
            - thumbnails/
- `js/`: Modular ES6 JavaScript files
  - `updatePreview.js`: Handles rendering logic for the preview window
  - `renderStandardPattern.js`, `renderTintWhitePattern.js`: Pattern rendering strategies
  - `populateLayerInputs.js`, `colorInputPanel.js`: Dynamic UI based on pattern structure
  - `coordinatePatternManager.js`: Loads coordinate previews
  - `ticketFeature.js`: Logic to generate printable summary
  - `state.js`: Global application state
- `css/`: Styling, mainly Tailwind utility classes

---

## 🚧 Known Issues

- **Pattern Preview not rendering**: Currently, only a solid background appears in the preview. Likely due to incorrect `scaleFactor` application or asset masking issues.
- **Color input only affects room mockup**: Pattern canvas ignores selected user colors until scale changes.
- **Shadow logic bug**: Some patterns incorrectly add or misplace shadow layers.
- **Wall panels**: Patterns flagged as wall panels do not initialize exclusive wall inputs.
- **Pattern scaling**: Default view appears zoomed-in, and buttons apply scale but progressively degrade quality.
- **Asset offsets**: Some patterns align incorrectly depending on their tiling and `tintWhite` flags.

---

## 🧑‍💻 Developer Onboarding

### 1. Clone the repo

```bash
git clone https://github.com/robcazin/color-flex.git
cd color-flex

### 2. Install VS Code Live Server (for local development)
Open the project folder in VS Code.

Install the "Live Server" extension.

Right-click on index.html → "Open with Live Server"

Note: This is important for loading assets like images and JSON with relative paths.

