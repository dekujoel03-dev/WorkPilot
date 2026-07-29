const SIGNATURES: Array<{ mime: string; check: (b: Buffer) => boolean }> = [
  { mime: 'application/pdf', check: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
  { mime: 'image/png', check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/jpeg', check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/gif', check: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  {
    mime: 'image/webp',
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45,
  },
  {
    mime: 'application/zip',
    check: (b) => b[0] === 0x50 && b[1] === 0x4b,
  },
];

const ZIP_BASED_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

export function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  for (const sig of SIGNATURES) {
    if (sig.check(buffer)) return sig.mime;
  }
  return null;
}

export function assertBufferMatchesMime(buffer: Buffer, expectedMime: string): void {
  const detected = detectMimeFromBuffer(buffer);

  if (expectedMime === 'text/plain') {
    if (buffer.includes(0)) {
      throw new Error('Fichier texte invalide');
    }
    return;
  }

  if (expectedMime === 'application/msword') {
    if (buffer[0] === 0xd0 && buffer[1] === 0xcf) return;
    throw new Error('Type de fichier non autorisé');
  }

  if (expectedMime === 'application/vnd.ms-powerpoint') {
    if (buffer[0] === 0xd0 && buffer[1] === 0xcf) return;
    throw new Error('Type de fichier non autorisé');
  }

  if (ZIP_BASED_MIMES.has(expectedMime)) {
    if (detected === 'application/zip') return;
    throw new Error('Type de fichier non autorisé');
  }

  if (!detected || detected !== expectedMime) {
    throw new Error('Type de fichier non autorisé');
  }
}
