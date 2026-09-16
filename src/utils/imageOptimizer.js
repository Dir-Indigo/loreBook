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
 * @param {number} targetSize - Max dimension for avatar output (e.g. 256 or 384)
 * @param {number} quality - Compression quality between 0.1 and 1.0 (default: 0.85)
 * @returns {Promise<Blob>} Optimized image Blob
 */
export async function cropAndOptimizeImage(image, crop, targetSize = 256, quality = 0.85) {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
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
    targetSize,
    targetSize
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
