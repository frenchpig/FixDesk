// Responsabilidad: marcadores de adjunto simulado (sin storage ni bytes)
// Usado por: TicketForm, TicketAttachmentPreview
// NO hace: upload, lectura de archivos ni URLs de CDN
export const PHOTO_PLACEHOLDER_PREFIX = 'placeholder:';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_BYTES = 5 * 1024 * 1024;

export function toPlaceholderPhotoUrl(filename: string): string {
  return `${PHOTO_PLACEHOLDER_PREFIX}${encodeURIComponent(filename.trim())}`;
}

export function isPlaceholderPhotoUrl(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith(PHOTO_PLACEHOLDER_PREFIX));
}

export function getPlaceholderFilename(
  url: string | null | undefined,
): string | null {
  if (!url?.startsWith(PHOTO_PLACEHOLDER_PREFIX)) return null;
  try {
    return decodeURIComponent(url.slice(PHOTO_PLACEHOLDER_PREFIX.length));
  } catch {
    return url.slice(PHOTO_PLACEHOLDER_PREFIX.length);
  }
}

/**
 * Validación de UX del archivo elegido (no se sube ni se lee).
 * @returns mensaje de error o null si es válido
 */
export function validateSimulatedImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Solo se permiten JPG, PNG o WebP';
  }
  if (file.size > MAX_BYTES) {
    return 'El archivo no debe superar 5 MB';
  }
  return null;
}

/** Delay corto para simular “subida” sin tocar red/storage. */
export function simulateUploadDelay(ms = 450): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
