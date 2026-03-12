export type ImagePreprocessOptions = {
  /**
   * Maximum width/height in pixels (long edge).
   * Typical sweet spot for vision models is 1024–2048.
   */
  maxDimension?: number;
  /**
   * Output mime type. JPEG is usually best for photos (smaller, good quality).
   */
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
  /**
   * Quality for JPEG/WebP (0–1). Ignored for PNG.
   */
  quality?: number;
  /**
   * If true, will skip processing when the image is already within bounds and
   * already matches outputType (when possible).
   */
  skipIfAlreadyOk?: boolean;
};

const DEFAULTS: Required<ImagePreprocessOptions> = {
  maxDimension: 1600,
  outputType: 'image/jpeg',
  quality: 0.85,
  skipIfAlreadyOk: true,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getOutputFileName(originalName: string, outputType: string) {
  const base = originalName.replace(/\.[^/.]+$/, '');
  const ext =
    outputType === 'image/png' ? 'png' : outputType === 'image/webp' ? 'webp' : 'jpg';
  return `${base}.${ext}`;
}

/**
 * Resize + recompress an image file in the browser using canvas.
 * This does NOT do heavy "enhancement" (sharpen/denoise) but it does:
 * - normalize huge images down to maxDimension
 * - recompress to consistent format/quality for cheaper, more consistent grading
 */
export async function preprocessImageFile(
  file: File,
  opts: ImagePreprocessOptions = {}
): Promise<File> {
  const options = { ...DEFAULTS, ...opts };

  // Only preprocess images.
  if (!file.type.startsWith('image/')) return file;

  // Load image
  const bitmap = await createImageBitmap(file);

  const w = bitmap.width;
  const h = bitmap.height;
  const longEdge = Math.max(w, h);

  const needsResize = longEdge > options.maxDimension;
  const wantsReencode = file.type !== options.outputType;

  if (options.skipIfAlreadyOk && !needsResize && !wantsReencode) {
    bitmap.close();
    return file;
  }

  const scale = needsResize ? options.maxDimension / longEdge : 1;
  const targetW = Math.max(1, Math.round(w * scale));
  const targetH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }

  // High quality downscale (supported in modern browsers)
  // @ts-ignore
  ctx.imageSmoothingEnabled = true;
  // @ts-ignore
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const quality = clamp(options.quality, 0.4, 0.95);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error('Failed to encode image'));
        else resolve(b);
      },
      options.outputType,
      options.outputType === 'image/png' ? undefined : quality
    );
  });

  const outName = getOutputFileName(file.name, options.outputType);

  return new File([blob], outName, {
    type: options.outputType,
    lastModified: Date.now(),
  });
}
