import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { authUserSelect } from './auth.constants';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  AuthenticatedUser,
  JwtPayload,
  LoginResponse,
} from './auth.types';

type SessionMetadata = {
  userAgent?: string | null;
  ipAddress?: string | null;
};

@Injectable()
export class AuthService {
  private readonly refreshSessionDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const parsedDays = Number(
      configService.get<string>('REFRESH_SESSION_EXPIRY_DAYS') ?? '7',
    );
    this.refreshSessionDays = Number.isInteger(parsedDays) ? parsedDays : 7;
  }

  async register(registerDto: RegisterDto): Promise<AuthenticatedUser> {
    const password = await this.hashPassword(registerDto.password);

    try {
      return await this.prisma.user.create({
        data: {
          email: registerDto.email.toLowerCase(),
          password,
          name: registerDto.name?.trim() || null,
        },
        select: authUserSelect,
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException('Email is already registered.');
      }

      throw error;
    }
  }

  async login(
    loginDto: LoginDto,
    metadata?: SessionMetadata,
  ): Promise<LoginResponse> {
    const user = await this.validateCredentials(
      loginDto.email,
      loginDto.password,
    );

    return this.buildLoginResponse(user, metadata);
  }

  async refreshSession(
    refreshToken: string,
    metadata?: SessionMetadata,
  ): Promise<LoginResponse> {
    const session = await this.findValidRefreshSession(refreshToken);
    const user = await this.findAuthenticatedUserById(session.userId);

    return this.rotateSession(session.id, user, metadata);
  }

  async findAuthenticatedUserById(userId: number): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: authUserSelect,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid authentication token.');
    }

    return user;
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<AuthenticatedUser> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() || null } : {}),
          ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
        },
        select: authUserSelect,
      });
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException('Email is already registered.');
      }

      throw error;
    }
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid authentication token.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: await this.hashPassword(dto.newPassword),
      },
    });

    return {
      message: 'Password updated successfully.',
    };
  }

  private async validateCredentials(
    email: string,
    plainPassword: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(plainPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.mapToAuthenticatedUser(user);
  }

  private async hashPassword(password: string): Promise<string> {
    const configuredSaltRounds = Number(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS') ?? '12',
    );
    const saltRounds = Number.isInteger(configuredSaltRounds)
      ? configuredSaltRounds
      : 12;

    return bcrypt.hash(password, saltRounds);
  }

  private async buildLoginResponse(
    user: AuthenticatedUser,
    metadata?: SessionMetadata,
  ): Promise<LoginResponse> {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.signAccessToken(payload);
    const refreshToken = await this.createRefreshSession(user.id, metadata);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  private async signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  private computeSessionExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshSessionDays);
    return expiresAt;
  }

  private generateOpaqueToken(): string {
    // 32 bytes ~ 256 bits entropy, URL-safe.
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createRefreshSession(
    userId: number,
    metadata?: SessionMetadata,
  ): Promise<string> {
    const refreshToken = this.generateOpaqueToken();
    const refreshTokenHash = this.hashToken(refreshToken);

    await this.prisma.authSession.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt: this.computeSessionExpiry(),
        userAgent: metadata?.userAgent ?? null,
        ipAddress: metadata?.ipAddress ?? null,
      },
      select: {
        id: true,
      },
    });

    return refreshToken;
  }

  private async findValidRefreshSession(refreshToken: string) {
    const session = await this.prisma.authSession.findUnique({
      where: {
        refreshTokenHash: this.hashToken(refreshToken),
      },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
        expiresAt: true,
      },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    return session;
  }

  private async rotateSession(
    sessionId: number,
    user: AuthenticatedUser,
    metadata?: SessionMetadata,
  ): Promise<LoginResponse> {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.signAccessToken(payload);

    const refreshToken = await this.prisma.$transaction(async (tx) => {
      const revoked = await tx.authSession.updateMany({
        where: {
          id: sessionId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      if (revoked.count !== 1) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      const nextToken = this.generateOpaqueToken();
      await tx.authSession.create({
        data: {
          userId: user.id,
          refreshTokenHash: this.hashToken(nextToken),
          expiresAt: this.computeSessionExpiry(),
          userAgent: metadata?.userAgent ?? null,
          ipAddress: metadata?.ipAddress ?? null,
        },
        select: {
          id: true,
        },
      });

      return nextToken;
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async revokeRefreshSession(refreshToken: string): Promise<void> {
    const result = await this.prisma.authSession.updateMany({
      where: {
        refreshTokenHash: this.hashToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (result.count === 0) {
      // Idempotent: do not leak whether the token existed.
      return;
    }
  }

  async getActiveSessions(userId: number) {
    return this.prisma.authSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async revokeOtherSessions(userId: number, currentRefreshToken: string): Promise<void> {
    const currentHash = this.hashToken(currentRefreshToken);
    await this.prisma.authSession.updateMany({
      where: {
        userId,
        refreshTokenHash: {
          not: currentHash,
        },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  @Cron('0 2 * * *') // Run daily at 2 AM
  async cleanupExpiredSessions(): Promise<void> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Delete sessions that expired or were revoked more than a month ago to keep DB clean
    const result = await this.prisma.authSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: oneMonthAgo } },
          { revokedAt: { lt: oneMonthAgo } },
        ],
      },
    });

    if (result.count > 0) {
      this.prisma.user.findFirst(); // dummy reference to avoid prisma unused warnings if any
    }
  }

  private mapToAuthenticatedUser(user: {
    id: number;
    email: string;
    name: string | null;
    role: AuthenticatedUser['role'];
    createdAt: Date;
    updatedAt: Date;
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object' || !('code' in error)) {
      return false;
    }

    return error.code === 'P2002';
  }
}
