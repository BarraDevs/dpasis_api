import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { ProviderAttemptOperation } from '../../enums/provider-attempt-operation.enum';
import { ProviderAttemptPrismaAdapterGateway } from './provider-attempt-prisma.gateway';

describe('ProviderAttemptPrismaAdapterGateway - Integration tests', () => {
  let sut: ProviderAttemptPrismaAdapterGateway;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule, LoggerModule],
      providers: [ProviderAttemptPrismaAdapterGateway, PrismaService],
    }).compile();

    sut = module.get(ProviderAttemptPrismaAdapterGateway);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.nfseAttempt.deleteMany();
  });

  afterAll(async() => {
    await prisma.nfseAttempt.deleteMany();
    await prisma.$disconnect();
  });

  it('should persist the whole request and response bodies', async() => {
    // Act
    await sut.record({
      nfseId: 1,
      operation: ProviderAttemptOperation.GissRecepcionarLote,
      requestBody: '<envelope/>',
      responseBody: '<resposta/>',
      httpStatus: 200,
      durationMs: 42,
    });

    // Assert
    const rows = await prisma.nfseAttempt.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      nfseId: 1,
      operation: ProviderAttemptOperation.GissRecepcionarLote,
      requestBody: '<envelope/>',
      responseBody: '<resposta/>',
      httpStatus: 200,
      errorClass: null,
      durationMs: 42,
    });
  });

  it('should swallow its own failure so a broken trail never breaks an issuance', async() => {
    // Arrange — operation acima do limite de coluna não existe; força o erro com um nfseId inválido.
    const logger = { error: jest.fn(), debug: jest.fn() };
    const broken = new ProviderAttemptPrismaAdapterGateway(
      { nfseAttempt: { create: () => Promise.reject(new Error('db down')) } } as never,
      logger as never,
    );

    // Act & Assert
    await expect(broken.record({
      nfseId: 1,
      operation: ProviderAttemptOperation.InterIssue,
    })).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
