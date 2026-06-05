import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';
import { AuthenticatedUserResponseDto } from './dto/authenticated-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser, LoginResponse } from './auth.types';
import { RateLimit } from '../shared/guards/rate-limit.guard';

const REFRESH_COOKIE_NAME = 'pm_refresh';
const DEFAULT_REFRESH_COOKIE_DAYS = 7;

function getRefreshCookieMaxAgeMs() {
  const raw = process.env.REFRESH_SESSION_EXPIRY_DAYS;
  const parsed = raw ? Number(raw) : NaN;
  const days = Number.isInteger(parsed) ? parsed : DEFAULT_REFRESH_COOKIE_DAYS;
  return days * 24 * 60 * 60 * 1000;
}

function getCookieValue(req: Request, name: string) {
  const raw = req.headers.cookie;
  if (!raw) return null;

  const parts = raw.split(';').map((part) => part.trim());
  for (const part of parts) {
    if (!part) continue;
    const eqIndex = part.indexOf('=');
    if (eqIndex === -1) continue;
    const key = part.slice(0, eqIndex).trim();
    if (key !== name) continue;
    const value = part.slice(eqIndex + 1);
    return decodeURIComponent(value);
  }

  return null;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @RateLimit({ windowMs: 60_000, max: 6, keyPrefix: 'auth:register' })
  @ApiOperation({ summary: 'Register a new account' })
  @ApiCreatedResponse({
    description: 'Account created successfully',
    type: AuthenticatedUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid registration payload' })
  @ApiUnauthorizedResponse({ description: 'Request is not authenticated' })
  @ApiForbiddenResponse({ description: 'Not allowed to create this account' })
  @ApiNotFoundResponse({ description: 'Related resource was not found' })
  register(@Body() registerDto: RegisterDto): Promise<AuthenticatedUser> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @RateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'auth:login' })
  @ApiOperation({ summary: 'Sign in and receive access tokens' })
  @ApiOkResponse({
    description: 'Signed in successfully',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid sign-in payload' })
  @ApiUnauthorizedResponse({ description: 'Email or password is incorrect' })
  @ApiForbiddenResponse({ description: 'Account is blocked or suspended' })
  @ApiNotFoundResponse({ description: 'Account was not found' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const session = await this.authService.login(loginDto, {
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.ip ?? null,
    });

    // Store refresh token in an httpOnly cookie so the frontend does not need localStorage.
    res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth',
      maxAge: getRefreshCookieMaxAgeMs(),
    });

    return session;
  }

  @Post('refresh')
  @RateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'auth:refresh' })
  @ApiOperation({ summary: 'Refresh an authenticated session' })
  @ApiOkResponse({
    description: 'Session refreshed successfully',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid refresh token payload' })
  @ApiUnauthorizedResponse({ description: 'Refresh token is invalid or expired' })
  @ApiForbiddenResponse({ description: 'Not allowed to refresh this session' })
  @ApiNotFoundResponse({ description: 'Refresh token user was not found' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const tokenFromCookie = getCookieValue(req, REFRESH_COOKIE_NAME);
    const refreshToken = dto.refreshToken ?? tokenFromCookie;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token.');
    }

    const session = await this.authService.refreshSession(refreshToken, {
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: req.ip ?? null,
    });

    res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth',
      maxAge: getRefreshCookieMaxAgeMs(),
    });

    return session;
  }

  @Post('logout')
  @RateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'auth:logout' })
  @ApiOperation({ summary: 'Revoke the current refresh session' })
  @ApiOkResponse({
    description: 'Session revoked',
    schema: {
      example: { success: true },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid logout payload' })
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokenFromCookie = getCookieValue(req, REFRESH_COOKIE_NAME);
    const refreshToken = dto.refreshToken ?? tokenFromCookie;

    if (refreshToken) {
      await this.authService.revokeRefreshSession(refreshToken);
    }

    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth' });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiOkResponse({
    description: 'Current signed-in account details',
    type: AuthenticatedUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Not allowed to access this profile' })
  @ApiNotFoundResponse({ description: 'Current user was not found' })
  getProfile(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update the current authenticated user profile' })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: AuthenticatedUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid profile update payload' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({ description: 'Not allowed to update this profile' })
  @ApiNotFoundResponse({ description: 'Current user was not found' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthenticatedUser> {
    return this.authService.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Change the current user password' })
  @ApiOkResponse({
    description: 'Password updated successfully',
    type: ChangePasswordResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid new password payload' })
  @ApiUnauthorizedResponse({
    description: 'Current password is wrong or token is missing',
  })
  @ApiForbiddenResponse({ description: 'Not allowed to change this password' })
  @ApiNotFoundResponse({ description: 'Current user was not found' })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get all active sessions for the authenticated user' })
  @ApiOkResponse({
    description: 'Active sessions retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  getActiveSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getActiveSessions(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/other/revoke')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Revoke all other active sessions for the authenticated user' })
  @ApiOkResponse({
    description: 'Other sessions revoked successfully',
    schema: { example: { success: true } },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async revokeOtherSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    const tokenFromCookie = getCookieValue(req, REFRESH_COOKIE_NAME);
    const refreshToken = dto.refreshToken ?? tokenFromCookie;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing current refresh token.');
    }

    await this.authService.revokeOtherSessions(user.id, refreshToken);
    return { success: true };
  }
}
