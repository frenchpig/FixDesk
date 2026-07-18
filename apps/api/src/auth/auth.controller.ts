import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SWAGGER_BEARER } from '../swagger';
import {
  DEFAULT_AUTH_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_MS,
  resolvePositiveInteger,
} from '../config/throttling.config';
import type { RequestWithUser } from './types/request-with-user';

const AUTH_THROTTLE_OPTIONS = {
  default: {
    ttl: () =>
      resolvePositiveInteger(
        process.env.AUTH_THROTTLE_TTL_MS,
        DEFAULT_THROTTLE_TTL_MS,
        'AUTH_THROTTLE_TTL_MS',
      ),
    limit: () =>
      resolvePositiveInteger(
        process.env.AUTH_THROTTLE_LIMIT,
        DEFAULT_AUTH_THROTTLE_LIMIT,
        'AUTH_THROTTLE_LIMIT',
      ),
  },
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE_OPTIONS)
  @ApiOperation({ summary: 'Registrar usuario (rol USER)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE_OPTIONS)
  @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth(SWAGGER_BEARER)
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  me(@Req() req: RequestWithUser) {
    return this.authService.getProfile(req.user.sub);
  }
}
