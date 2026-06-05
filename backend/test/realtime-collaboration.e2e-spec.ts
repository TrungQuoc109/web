import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { io, Socket } from 'socket.io-client';

describe('Realtime Collaboration Gateway (E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let port: number;

  const prismaMock = {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 5,
        email: 'test@example.com',
        name: 'Test User',
        role: 'MEMBER',
      }),
    },
    projectMember: {
      findUnique: jest.fn().mockResolvedValue({
        id: 1,
        userId: 5,
        projectId: 10,
        role: 'MEMBER',
        leftAt: null,
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    message: {
      create: jest.fn().mockImplementation(({ data }) => ({
        id: 100,
        content: data.content,
        senderId: data.senderId,
        projectId: data.projectId,
        isSystem: data.isSystem,
        isAnnouncement: data.isAnnouncement,
        metadata: data.metadata,
        createdAt: new Date(),
      })),
    },
    notification: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const redisMock = {
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    scard: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue(['5']),
    zremrangebyscore: jest.fn().mockResolvedValue(0),
    zadd: jest.fn().mockResolvedValue(1),
    zrem: jest.fn().mockResolvedValue(1),
    zrange: jest.fn().mockResolvedValue([]),
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(RedisService)
      .useValue(redisMock)
      .compile();

    app = moduleFixture.createNestApplication();
    jwtService = app.get(JwtService);

    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Real-time Messaging and Room Joins', () => {
    let clientSocket: Socket;

    beforeEach((done) => {
      const token = jwtService.sign({ id: 5 });
      clientSocket = io(`http://localhost:${port}/realtime`, {
        auth: {
          token: `Bearer ${token}`,
        },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        done();
      });
    });

    afterEach(() => {
      if (clientSocket.connected) {
        clientSocket.disconnect();
      }
    });

    it('should join project room and receive acknowledgement', (done) => {
      clientSocket.emit('project:join', { projectId: 10 }, (res: any) => {
        expect(res.success).toBe(true);
        expect(res.data.room).toBe('project:10');
        done();
      });
    });

    it('should broadcast message:created to the project room when new message is created', (done) => {
      clientSocket.emit('project:join', { projectId: 10 }, () => {
        clientSocket.emit(
          'message:create',
          { projectId: 10, content: 'Hello World!' },
          (res: any) => {
            expect(res.success).toBe(true);
            expect(res.data.content).toBe('Hello World!');
            done();
          },
        );
      });
    });
  });
});
