// imageLoader.js
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(`❌ Failed to load image: ${src}`);
        img.src = src;
    });
}