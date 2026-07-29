import { BadRequestException } from '@nestjs/common';
import { lookup } from 'dns/promises';
import { isIP } from 'net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
]);

function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return true;
  }
  if (!isIP(ip)) return false;

  if (ip.startsWith('10.') || ip.startsWith('127.') || ip.startsWith('169.254.')) {
    return true;
  }
  if (ip.startsWith('192.168.')) return true;

  const parts = ip.split('.').map(Number);
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  return false;
}

export async function assertSafeWebhookUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BadRequestException('URL de webhook invalide');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new BadRequestException('Seuls les webhooks HTTP(S) sont autorisés');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local')) {
    throw new BadRequestException('Hôte de webhook non autorisé');
  }

  if (isPrivateIp(hostname)) {
    throw new BadRequestException('Hôte de webhook non autorisé');
  }

  const resolved = await lookup(hostname, { all: true });
  for (const entry of resolved) {
    if (isPrivateIp(entry.address)) {
      throw new BadRequestException('Hôte de webhook non autorisé');
    }
  }
}
