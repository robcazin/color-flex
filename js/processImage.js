// processImage.js

export const processImage = (
  url,
  callback,
  layerColor = '#7f817e',
  gamma = 2.2,
  isShadow = false,
  isWallPanel = false,
  isWall = false,
  useNormalization = true // replaces USE_NORMALIZATION
) => {
  console.log(`Processing image ${url} with color ${layerColor}, Normalization: ${useNormalization}, IsShadow: ${isShadow}, IsWallPanel: ${isWallPanel}, IsWall: ${isWall}`);
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = `${url}?t=${new Date().getTime()}`;

  img.onload = () => {
    console.log(` Processed image: ${img.src} (${img.naturalWidth}x${img.naturalHeight})`);

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
      callback(canvas.toDataURL("image/png", 1.0));
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let rLayer, gLayer, bLayer;
    if (layerColor && !isShadow) {
      const hex = layerColor.replace("#", "");
      rLayer = parseInt(hex.substring(0, 2), 16);
      gLayer = parseInt(hex.substring(2, 4), 16);
      bLayer = parseInt(hex.substring(4, 6), 16);
    }

    if (isWallPanel && layerColor && !isShadow) {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if ((r > 0 || g > 0 || b > 0) && a > 0) {
          data[i] = rLayer;
          data[i + 1] = gLayer;
          data[i + 2] = bLayer;
          data[i + 3] = 255;
        } else {
          data[i + 3] = 0;
        }
      }
    } else if (isShadow) {
      for (let i = 0; i < data.length; i += 4) {
        const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const alpha = 1 - (luminance / 255);
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = Math.round(alpha * 255);
      }
    } else if (layerColor && useNormalization) {
      let minLuminance = 255, maxLuminance = 0;
      for (let i = 0; i < data.length; i += 4) {
        const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        minLuminance = Math.min(minLuminance, luminance);
        maxLuminance = Math.max(maxLuminance, luminance);
      }
      const range = maxLuminance - minLuminance || 1;
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
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        const brightness = (r + g + b) / 3;
        if (brightness > 200 && a > 0) {
          data[i] = rLayer;
          data[i + 1] = gLayer;
          data[i + 2] = bLayer;
          data[i + 3] = 255;
        } else {
          data[i + 3] = 0;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    callback(canvas.toDataURL("image/png", 1.0));
  };

  img.onerror = () => console.error(`Canvas image load failed: ${url}`);
};
