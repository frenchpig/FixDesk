import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: { $queryRaw: queryRaw },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    queryRaw.mockClear();
  });

  describe('health', () => {
    it('should confirm the API and database are available', async () => {
      const result = await appController.health();

      expect(result.status).toBe('ok');
      expect(result.db).toBe('connected');
      expect(typeof result.timestamp).toBe('string');
      expect(queryRaw).toHaveBeenCalledTimes(1);
    });
  });
});
