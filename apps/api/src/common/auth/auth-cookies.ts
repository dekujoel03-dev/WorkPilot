import type { Response } from 'express';
import type { ConfigService } from '@nestjs/config';

export const ACCESS_COOKIE = 'wp_access';
export const REFRESH_COOKIE = 'wp_refresh';

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions(config: ConfigService, maxAge: number) {
  const isProd = config.get<string>('NODE_ENV') === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function setAuthCookies(
  res: Response,
  config: ConfigService,
  tokens: { accessToken: string; refreshToken: string },
) {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOptions(config, ACCESS_MAX_AGE_MS));
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(config, REFRESH_MAX_AGE_MS));
}

export function clearAuthCookies(res: Response, config: ConfigService) {
  const opts = { ...cookieOptions(config, 0), maxAge: 0 };
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
}

export function parseCookieHeader(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}
