import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateCredentials(
      loginDto.email,
      loginDto.password,
    );

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user,
    };
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
