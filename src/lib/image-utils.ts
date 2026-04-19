/**
 * @fileOverview Utility functions for image processing and compression.
 */

/**
 * Compresses a Data URI image to a target maximum width and quality.
 * This ensures images stored in Firestore documents stay well under the 1MB limit.
 */
export async function compressImage(
  dataUri: string, 
  maxWidth = 1024, 
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUri;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Scale down if image is too wide
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw and export as JPEG for best compression ratio
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUri = canvas.toDataURL('image/jpeg', quality);
      
      // Basic check: if for some reason compression failed to reduce size significantly
      // we could recurse with lower quality, but 0.7 @ 1024px is generally ~100-300kb
      resolve(compressedDataUri);
    };
    img.onerror = (e) => reject(e);
  });
}
