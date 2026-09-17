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

/**
 * Extracts the dominant color from an image source (URL, Blob, File, or HTMLImageElement)
 * Returns a hex color string (e.g. '#3a7bd5') or null if extraction fails.
 * @param {HTMLImageElement|Blob|File|string} source - Image source
 * @returns {Promise<string|null>} Dominant color in hex format
 */
export async function extractDominantColor(source) {
  if (!source) return null;
  try {
    let img;
    let cleanupBlobUrl = null;

    if (typeof window === 'undefined') return null;

    if (source instanceof HTMLImageElement) {
      img = source;
    } else if (source instanceof Blob || source instanceof File) {
      cleanupBlobUrl = URL.createObjectURL(source);
      img = await loadImage(cleanupBlobUrl);
    } else if (typeof source === 'string') {
      img = await loadImage(source);
    } else {
      return null;
    }

    const canvas = document.createElement('canvas');
    const size = 48; // Scaled down for high performance & noise reduction
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);

    if (cleanupBlobUrl) {
      URL.revokeObjectURL(cleanupBlobUrl);
    }

    const imgData = ctx.getImageData(0, 0, size, size).data;
    const colorCounts = new Map();

    let fallbackR = 0, fallbackG = 0, fallbackB = 0, fallbackCount = 0;

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];

      if (a < 128) continue; // Ignore transparent pixels

      fallbackR += r;
      fallbackG += g;
      fallbackB += b;
      fallbackCount++;

      // Skip near-pure white and near-pure black to avoid empty background borders dominating
      if (r > 240 && g > 240 && b > 240) continue;
      if (r < 15 && g < 15 && b < 15) continue;

      // Calculate saturation / chroma
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;

      // Quantize RGB values to buckets of 24
      const qr = Math.round(r / 24) * 24;
      const qg = Math.round(g / 24) * 24;
      const qb = Math.round(b / 24) * 24;
      const key = `${qr},${qg},${qb}`;

      const existing = colorCounts.get(key) || { count: 0, rSum: 0, gSum: 0, bSum: 0, chroma };
      existing.count += 1;
      existing.rSum += r;
      existing.gSum += g;
      existing.bSum += b;
      colorCounts.set(key, existing);
    }

    if (colorCounts.size === 0) {
      if (fallbackCount === 0) return null;
      const avgR = Math.round(fallbackR / fallbackCount);
      const avgG = Math.round(fallbackG / fallbackCount);
      const avgB = Math.round(fallbackB / fallbackCount);
      return rgbToHex(avgR, avgG, avgB);
    }

    let bestBucket = null;
    let maxScore = -1;

    for (const bucket of colorCounts.values()) {
      // Score = pixel frequency count weighted slightly by saturation for lively character tones
      const saturationBonus = 1 + (bucket.chroma / 255) * 1.5;
      const score = bucket.count * saturationBonus;
      if (score > maxScore) {
        maxScore = score;
        bestBucket = bucket;
      }
    }

    if (!bestBucket || bestBucket.count === 0) return null;

    const finalR = Math.round(bestBucket.rSum / bestBucket.count);
    const finalG = Math.round(bestBucket.gSum / bestBucket.count);
    const finalB = Math.round(bestBucket.bSum / bestBucket.count);

    return rgbToHex(finalR, finalG, finalB);
  } catch (err) {
    console.warn('Dominant color extraction skipped:', err);
    return null;
  }
}

function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.min(255, Math.max(0, c)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


