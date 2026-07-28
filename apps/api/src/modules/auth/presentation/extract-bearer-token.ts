import { UnauthorizedException } from '@nestjs/common';

export function extractBearerToken(authHeader?: string): string {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Token Bearer requis');
  }
  return authHeader.slice(7).trim();
}
