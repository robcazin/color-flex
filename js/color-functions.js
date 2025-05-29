// color-functions.js
// Utilities for color matching, tinting, conversion and SW color lookup
import { appState } from './state.js';

export async function drawMaskedLayer(imgPath, tintColor, label, ctx, processImage, loadImage) {
  const originalUrl = await new Promise(resolve => processImage(imgPath, resolve, null, 2.2));
  const img = await loadImage(originalUrl);

  const offscreen = document.createElement("canvas");
  offscreen.width = 1080;
  offscreen.height = 1080;
  const offCtx = offscreen.getContext("2d");
  drawCenteredImage(offCtx, img, 1080, 1080);

  const imageData = offCtx.getImageData(0, 0, 1080, 1080);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i + 3] = 255 - luminance;
  }
  offCtx.putImageData(imageData, 0, 0);

  const tintLayer = document.createElement("canvas");
  tintLayer.width = 1080;
  tintLayer.height = 1080;
  const tintCtx = tintLayer.getContext("2d");
  tintCtx.fillStyle = tintColor;
  tintCtx.fillRect(0, 0, 1080, 1080);
  tintCtx.globalCompositeOperation = "destination-in";
  tintCtx.drawImage(offscreen, 0, 0);

  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(tintLayer, 0, 0);

  console.log(`✅ [${label}] tint-mask drawn.`);
}

export function drawCenteredImage(ctx, img, canvasWidth, canvasHeight) {
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

export function hexToHSL(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  if (hex.length !== 6) return null;

  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

  return `#${[f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function hexToRGB(hex) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const bigint = parseInt(hex, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: (bigint & 255) };
}

export function colorDistance(hex1, hex2) {
  const rgb1 = hexToRGB(hex1);
  const rgb2 = hexToRGB(hex2);
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

export function findClosestSWColor(targetHex, colorsData) {
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

export function resolveColor(raw, lookupColor) {
  const color = (!raw || typeof raw !== "string") ? "Snowbound" : raw.trim().toUpperCase();
  const resolved = lookupColor(color);
  if (!resolved) console.warn(`⚠️ [resolveColor] Could not resolve color: '${color}', using Snowbound`);
  return resolved || lookupColor("Snowbound") || "#DDDDDD";
}

export function lookupColor(colorName, colorsData = appState.colorsData) {
  if (!colorName || typeof colorName !== "string") return "#FFFFFF";

  const hexColorRegex = /^#[0-9A-F]{6}$/i;
  if (hexColorRegex.test(colorName)) return colorName;

  const cleanedName = colorName.replace(/^(SW|SC)?\d+\s*/i, "").trim().toLowerCase();

  const match = colorsData.find(c =>
    c.color_name.toLowerCase() === cleanedName ||
    (`${c.sw_number} ${c.color_name}`.toLowerCase().trim() === colorName.toLowerCase().trim())
  );

  return match ? `#${match.hex}` : "#FFFFFF";
}

