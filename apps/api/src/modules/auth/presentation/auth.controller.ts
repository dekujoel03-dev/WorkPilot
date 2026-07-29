import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  Headers,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Request as ExpressRequest, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../application/auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SupabaseRegisterDto } from './dto/supabase-register.dto';
import { SupabaseSessionDto } from './dto/supabase-session.dto';
import { extractBearerToken } from './extract-bearer-token';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  REFRESH_COOKIE,
  parseCookieHeader,
  setAuthCookies,
  clearAuthCookies,
} from '../../../common/auth/auth-cookies';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private applyAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    setAuthCookies(res, this.config, tokens);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Créer un compte et un workspace' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.applyAuthCookies(res, result.data.tokens);
    return result;
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Connexion (legacy — préférer Supabase Auth)' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.applyAuthCookies(res, result.data.tokens);
    return result;
  }

  @Post('supabase/session')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Échanger une session Supabase contre des tokens applicatifs' })
  @ApiBearerAuth()
  async supabaseSession(
    @Headers('authorization') authHeader: string,
    @Body() dto: SupabaseSessionDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.createSessionFromSupabase(
      extractBearerToken(authHeader),
      dto.workspaceId,
    );
    this.applyAuthCookies(res, result.data.tokens);
    return result;
  }

  @Post('supabase/register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Finaliser l'inscription après signUp Supabase" })
  @ApiBearerAuth()
  async supabaseRegister(
    @Headers('authorization') authHeader: string,
    @Body() dto: SupabaseRegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerWithSupabase(
      extractBearerToken(authHeader),
      dto,
    );
    this.applyAuthCookies(res, result.data.tokens);
    return result;
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Renouveler les tokens' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      dto.refreshToken ?? parseCookieHeader(req.headers.cookie, REFRESH_COOKIE);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }
    const result = await this.authService.refresh(refreshToken, dto.workspaceId);
    this.applyAuthCookies(res, result.data.tokens);
    return result;
  }

  @Post('logout')
  @SkipThrottle()
  @ApiOperation({ summary: 'Déconnexion — révoque le refresh token' })
  async logout(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = parseCookieHeader(req.headers.cookie, REFRESH_COOKIE);
    await this.authService.logout(refreshToken);
    clearAuthCookies(res, this.config);
    return { data: { success: true } };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion de toutes les sessions' })
  async logoutAll(
    @Request() req: { user: { id: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(undefined, req.user.id);
    clearAuthCookies(res, this.config);
    return { data: { success: true } };
  }

  @Get('me')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil utilisateur courant' })
  me(@Request() req: { user: { id: string } }) {
    return this.authService.getMe(req.user.id);
  }

  @Post('switch-workspace/:workspaceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Changer de workspace actif' })
  async switchWorkspace(
    @Request() req: { user: { id: string } },
    @Param('workspaceId') workspaceId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.switchWorkspace(req.user.id, workspaceId);
    this.applyAuthCookies(res, result.data.tokens);
    return result;
  }
}
