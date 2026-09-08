import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import type { INfseQueueMonitor } from '../../queue/nfse-queue-monitor.interface';
import { GetNfseMetrics } from './get-nfse-metrics.service';

describe('GetNfseMetrics - Unit tests', () => {
  let sut: GetNfseMetrics;
  let nfseDao: INfseDao;
  let queueMonitor: INfseQueueMonitor;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        GetNfseMetrics,
        { provide: TOKENS.NfseDao, useValue: createMock<INfseDao>() },
        { provide: TOKENS.NfseQueueMonitor, useValue: createMock<INfseQueueMonitor>() },
      ],
    }).compile();

    sut = module.get(GetNfseMetrics);
    nfseDao = module.get(TOKENS.NfseDao);
    queueMonitor = module.get(TOKENS.NfseQueueMonitor);

    jest.spyOn(nfseDao, 'countByStatus').mockResolvedValue([{ key: 'ISSUED', count: 128 }]);
    jest.spyOn(nfseDao, 'countByBankPaymentStatus').mockResolvedValue([{ key: 'EMITTED', count: 120 }]);
    jest.spyOn(nfseDao, 'countStuck').mockResolvedValue(2);
    jest.spyOn(nfseDao, 'countIssuedWithoutBankPayment').mockResolvedValue(1);
    jest.spyOn(nfseDao, 'findProviderCallStats').mockResolvedValue([
      { operation: 'GISS_CONSULTAR_LOTE', calls: 340, errors: 12, averageDurationMs: 812, maxDurationMs: 5300 },
    ]);
    jest.spyOn(queueMonitor, 'getDepth').mockResolvedValue([
      { queue: 'nfse-issue', waiting: 3, active: 1, delayed: 12, failed: 0 },
    ]);
  });

  it('should gather the numbers that today only exist as manual SQL', async() => {
    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toMatchObject({
      byStatus: [{ key: 'ISSUED', count: 128 }],
      stuck: 2,
      issuedWithoutBankPayment: 1,
      bankPaymentByStatus: [{ key: 'EMITTED', count: 120 }],
      providerCalls: [expect.objectContaining({ operation: 'GISS_CONSULTAR_LOTE' })],
      queues: [expect.objectContaining({ queue: 'nfse-issue' })],
    });
    expect(result.generatedAt).toEqual(expect.any(String));
  });

  it('should use the same thresholds as the alerts, so screen and e-mail never disagree', async() => {
    // Act
    await sut.execute();

    // Assert
    expect(nfseDao.countStuck).toHaveBeenCalledWith(120);
    expect(nfseDao.countIssuedWithoutBankPayment).toHaveBeenCalledWith(60);
    expect(nfseDao.findProviderCallStats).toHaveBeenCalledWith(1440);
  });
});
