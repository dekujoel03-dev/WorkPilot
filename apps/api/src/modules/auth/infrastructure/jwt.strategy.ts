import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { JwtPayload } from '@work-pilot/shared';
import { ACCESS_COOKIE, parseCookieHeader } from '../../../common/auth/auth-cookies';

function extractAccessToken(req: Request): string | null {
  const bearer = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (bearer) return bearer;
  return parseCookieHeader(req.headers.cookie, ACCESS_COOKIE) ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractAccessToken,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      workspaceId: payload.workspaceId,
      role: payload.role,
    };
  }
}
