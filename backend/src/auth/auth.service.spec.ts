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
  } as unknown as PrismaService;
  const jwtService = {
    signAsync: jest.fn(),
  } as unknown as JwtService;
  const configService = {
    get: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
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
    jwtService.signAsync = jest.fn().mockResolvedValue('signed-token');

    const result = await service.login({
      email: 'linh.tran@projecthub.dev',
      password: 'DemoPass!123',
    });

    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        id: 7,
        email: 'linh.tran@projecthub.dev',
        name: 'Linh Tran',
        role: 'MANAGER',
        createdAt,
        updatedAt,
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      id: 7,
      email: 'linh.tran@projecthub.dev',
      role: 'MANAGER',
    });
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
});
