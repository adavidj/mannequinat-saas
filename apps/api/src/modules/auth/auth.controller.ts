import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginSchema, refreshSchema, registerSchema, verifyEmailSchema } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema))
    body: {
      email: string;
      password: string;
      role: 'MODELE' | 'AGENCE' | 'FORMATEUR';
      birthDate?: string;
    },
    @Req() req: Request,
  ) {
    return this.auth.register({
      email: body.email,
      password: body.password,
      role: body.role,
      birthDate: body.birthDate,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Public()
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: { email: string; password: string },
    @Req() req: Request,
  ) {
    return this.auth.login({
      email: body.email,
      password: body.password,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailSchema)) body: { token: string },
    @Req() req: Request,
  ) {
    return this.auth.verifyEmail({
      token: body.token,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema)) body: { refreshToken: string },
    @Req() req: Request,
  ) {
    return this.auth.refresh({
      refreshToken: body.refreshToken,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: { id: string }, @Req() req: Request) {
    return this.auth.logout(user.id, {
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}
