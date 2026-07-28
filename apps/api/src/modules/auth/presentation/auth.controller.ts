import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../application/auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SupabaseRegisterDto } from './dto/supabase-register.dto';
import { SupabaseSessionDto } from './dto/supabase-session.dto';
import { extractBearerToken } from './extract-bearer-token';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un compte et un workspace' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Connexion (legacy — préférer Supabase Auth)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('supabase/session')
  @ApiOperation({ summary: 'Échanger une session Supabase contre des tokens applicatifs' })
  @ApiBearerAuth()
  supabaseSession(
    @Headers('authorization') authHeader: string,
    @Body() dto: SupabaseSessionDto,
  ) {
    return this.authService.createSessionFromSupabase(
      extractBearerToken(authHeader),
      dto.workspaceId,
    );
  }

  @Post('supabase/register')
  @ApiOperation({ summary: 'Finaliser l\'inscription après signUp Supabase' })
  @ApiBearerAuth()
  supabaseRegister(
    @Headers('authorization') authHeader: string,
    @Body() dto: SupabaseRegisterDto,
  ) {
    return this.authService.registerWithSupabase(extractBearerToken(authHeader), dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renouveler les tokens' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken, dto.workspaceId);
  }

  @Get('me')
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
  switchWorkspace(
    @Request() req: { user: { id: string } },
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.authService.switchWorkspace(req.user.id, workspaceId);
  }
}
