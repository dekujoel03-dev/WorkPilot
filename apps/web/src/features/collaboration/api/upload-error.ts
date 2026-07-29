export function parseUploadError(data: unknown, fallback = 'Upload échoué'): string {
  const payload = data as {
    message?: string | string[];
    error?: { message?: string | string[] };
  } | null;

  const raw = payload?.error?.message ?? payload?.message;
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'string' && raw.trim()) return raw;
  return fallback;
}
