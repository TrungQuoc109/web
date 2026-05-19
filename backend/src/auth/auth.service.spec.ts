import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    authSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const jwtService = {
    signAsync: jest.fn(),
  } as unknown as JwtService;
  const configService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockImplementation((key: string) => {
      if (key === 'REFRESH_SESSION_EXPIRY_DAYS') {
        return '7';
      }

      return undefined;
    });
    configService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') {
        return 'access-secret';
      }

      throw new Error(`Missing config for ${key}`);
    });
    service = new AuthService(prisma, jwtService, configService as never);
  });

  it('logs in a user with valid credentials', async () => {
    const createdAt = new Date('2026-04-01T00:00:00.000Z');
    const updatedAt = new Date('2026-04-02T00:00:00.000Z');
    const hashedPassword = await bcrypt.hash('DemoPass!123', 1);

    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 7,
      email: 'linh.tran@projecthub.dev',
      password: hashedPassword,
      name: 'Linh Tran',
      role: 'MANAGER',
      createdAt,
      updatedAt,
    });
    prisma.authSession.create = jest.fn().mockResolvedValue({ id: 1 });
    jwtService.signAsync = jest.fn().mockResolvedValue('signed-token');

    const result = await service.login({
      email: 'linh.tran@projecthub.dev',
      password: 'DemoPass!123',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken.length).toBeGreaterThan(20);
    expect(result.user).toEqual({
      id: 7,
      email: 'linh.tran@projecthub.dev',
      name: 'Linh Tran',
      role: 'MANAGER',
      createdAt,
      updatedAt,
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      id: 7,
      email: 'linh.tran@projecthub.dev',
      role: 'MANAGER',
    });
    expect(prisma.authSession.create).toHaveBeenCalled();
  });

  it('rejects invalid credentials', async () => {
    const hashedPassword = await bcrypt.hash('DemoPass!123', 1);

    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 7,
      email: 'linh.tran@projecthub.dev',
      password: hashedPassword,
      name: 'Linh Tran',
      role: 'MANAGER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.login({
        email: 'linh.tran@projecthub.dev',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes a session with a valid refresh token', async () => {
    const createdAt = new Date('2026-04-01T00:00:00.000Z');
    const updatedAt = new Date('2026-04-02T00:00:00.000Z');

    prisma.user.findUnique = jest.fn().mockResolvedValue({
      id: 7,
      email: 'linh.tran@projecthub.dev',
      name: 'Linh Tran',
      role: 'MANAGER',
      createdAt,
      updatedAt,
    });
    prisma.authSession.findUnique = jest.fn().mockResolvedValue({
      id: 11,
      userId: 7,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const tx = {
      authSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id: 12 }),
      },
    };
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) =>
      callback(tx),
    );
    jwtService.signAsync = jest.fn().mockResolvedValue('refreshed-access-token');

    const result = await service.refreshSession('valid-refresh-token');

    expect(result.accessToken).toBe('refreshed-access-token');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken.length).toBeGreaterThan(20);
    expect(result.user).toEqual({
      id: 7,
      email: 'linh.tran@projecthub.dev',
      name: 'Linh Tran',
      role: 'MANAGER',
      createdAt,
      updatedAt,
    });
    expect(tx.authSession.updateMany).toHaveBeenCalledWith({
      where: { id: 11, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(tx.authSession.create).toHaveBeenCalled();
  });
});
