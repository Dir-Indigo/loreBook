/**
 * Image Optimizer Utility for LoreBook
 * Handles client-side cropping, resizing, and WebP compression
 * to keep Supabase storage lightweight (~20-40KB per avatar).
 */

/**
 * Loads an image from a URL or File object into an HTMLImageElement
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

/**
 * Crops and compresses an image to an optimized WebP (or JPEG fallback) Blob
 * @param {HTMLImageElement} image - Loaded image element
 * @param {Object} crop - { x, y, width, height } in image coordinates
 * @param {number} [targetWidth=256] - Output width (e.g., 280 for avatar, 1200 for cover)
 * @param {number} [targetHeightOrQuality=256] - Output height or quality if omitted
 * @param {number} [maybeQuality=0.85] - Compression quality between 0.1 and 1.0
 * @returns {Promise<Blob>} Optimized image Blob
 */
export async function cropAndOptimizeImage(
  image,
  crop,
  targetWidth = 256,
  targetHeightOrQuality = 256,
  maybeQuality = 0.85
) {
  let finalWidth = targetWidth;
  let finalHeight = targetWidth;
  let quality = 0.85;

  if (typeof targetHeightOrQuality === 'number' && targetHeightOrQuality <= 1) {
    // Called as (image, crop, targetSize, quality)
    finalHeight = targetWidth;
    quality = targetHeightOrQuality;
  } else if (typeof targetHeightOrQuality === 'number') {
    finalHeight = targetHeightOrQuality;
    quality = typeof maybeQuality === 'number' ? maybeQuality : 0.85;
  }

  const canvas = document.createElement('canvas');
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext('2d');

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the cropped portion scaled onto the canvas
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    finalWidth,
    finalHeight
  );

  return new Promise((resolve) => {
    // Try WebP first for optimal compression
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Fallback to JPEG if WebP is not supported
          canvas.toBlob((jpegBlob) => resolve(jpegBlob), 'image/jpeg', quality);
        }
      },
      'image/webp',
      quality
    );
  });
}

