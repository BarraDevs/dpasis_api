import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { NfseAlertRowDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-alert-row.dto';
import type { INfseDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-dao.interface';
import type { INfseRepository } from 'src/app/tax-invoice/nfse/application/persistence/repository/nfse-repository.interface';
import type { INfseQueueMonitor } from 'src/app/tax-invoice/nfse/application/queue/nfse-queue-monitor.interface';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { TOKENS } from 'src/core/di/token';
import type { IAlertGateway } from 'src/infra/alert/alert.gateway';
import { AlertType } from 'src/infra/alert/enums/alert-type.enum';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { ALERT_WINDOW_IN_SECONDS, buildAlertWindowKey } from 'src/infra/alert/alert-window';
import { CheckCertificates } from '../check-certificates/check-certificates.service';
import { CertificateHealthStatus } from '../check-certificates/dtos/check-certificates.dto';
import { SweepNfseAlerts } from './sweep-nfse-alerts.service';

function makeRow(overrides: Partial<NfseAlertRowDto> = {}): NfseAlertRowDto {
  return {
    id: 1,
    status: NfseStatus.SUBMITTED,
    nfseNumber: null,
    errorMessage: null,
    issuedAt: null,
    updatedAt: new Date('2026-09-01T10:00:00-03:00'),
    ...overrides,
  };
}

describe('SweepNfseAlerts - Unit tests', () => {
  let sut: SweepNfseAlerts;
  let nfseDao: INfseDao;
  let nfseRepository: INfseRepository;
  let alertGateway: IAlertGateway;
  let cacheGateway: ICacheGateway;
  let checkCertificates: CheckCertificates;
  let queueMonitor: INfseQueueMonitor;
  let logger: ILoggerGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        SweepNfseAlerts,
        { provide: TOKENS.NfseDao, useValue: createMock<INfseDao>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: TOKENS.AlertGateway, useValue: createMock<IAlertGateway>() },
        { provide: TOKENS.CacheGateway, useValue: createMock<ICacheGateway>() },
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: CheckCertificates, useValue: createMock<CheckCertificates>() },
        { provide: TOKENS.NfseQueueMonitor, useValue: createMock<INfseQueueMonitor>() },
      ],
    }).compile();

    sut = module.get(SweepNfseAlerts);
    nfseDao = module.get(TOKENS.NfseDao);
    nfseRepository = module.get(TOKENS.NfseRepository);
    alertGateway = module.get(TOKENS.AlertGateway);
    cacheGateway = module.get(TOKENS.CacheGateway);
    logger = module.get(TOKENS.LoggerGateway);
    checkCertificates = module.get(CheckCertificates);
    queueMonitor = module.get(TOKENS.NfseQueueMonitor);
    jest.spyOn(queueMonitor, 'getDepth').mockResolvedValue([]);

    // Por padrão a janela está livre e o canal entrega; os casos específicos sobrescrevem.
    jest.spyOn(cacheGateway, 'setIfAbsent').mockResolvedValue(true);
    jest.spyOn(alertGateway, 'send').mockResolvedValue(true);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('sweepStuck', () => {
    it('should send a single alert listing every stuck nfse', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findStuck').mockResolvedValue([
        makeRow({ id: 10 }),
        makeRow({ id: 11, errorMessage: 'timeout' }),
      ]);

      // Act
      await sut.sweepStuck();

      // Assert — um e-mail com as duas notas, não um por nota.
      expect(alertGateway.send).toHaveBeenCalledTimes(1);
      expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({
        type: AlertType.NfseStuck,
        lines: [
          expect.stringContaining('nfseId=10'),
          expect.stringContaining('nfseId=11'),
        ],
      }));
    });

    it('should query with the 2h threshold', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findStuck').mockResolvedValue([]);

      // Act
      await sut.sweepStuck();

      // Assert
      expect(nfseDao.findStuck).toHaveBeenCalledWith(120);
    });

    it('should stay silent when nothing is stuck', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findStuck').mockResolvedValue([]);

      // Act
      await sut.sweepStuck();

      // Assert
      expect(alertGateway.send).not.toHaveBeenCalled();
      expect(cacheGateway.setIfAbsent).not.toHaveBeenCalled();
    });

    it('should not send when the digest window is already claimed', async() => {
      // Arrange — é o que impede duas instâncias de mandarem o mesmo e-mail.
      jest.spyOn(nfseDao, 'findStuck').mockResolvedValue([makeRow()]);
      jest.spyOn(cacheGateway, 'setIfAbsent').mockResolvedValue(false);

      // Act
      await sut.sweepStuck();

      // Assert
      expect(alertGateway.send).not.toHaveBeenCalled();
    });

    it('should claim the digest window with the stuck key and 15min TTL before sending', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findStuck').mockResolvedValue([makeRow()]);

      // Act
      await sut.sweepStuck();

      // Assert
      expect(cacheGateway.setIfAbsent).toHaveBeenCalledWith(
        buildAlertWindowKey(AlertType.NfseStuck),
        expect.any(String),
        ALERT_WINDOW_IN_SECONDS[AlertType.NfseStuck],
      );
    });

    it('should include nfse number and reason in the formatted row', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findStuck').mockResolvedValue([
        makeRow({
          id: 42,
          nfseNumber: '1000',
          errorMessage: 'timeout Giss',
          updatedAt: new Date('2026-09-01T10:00:00-03:00'),
        }),
      ]);

      // Act
      await sut.sweepStuck();

      // Assert
      const alert = jest.mocked(alertGateway.send).mock.calls[0][0];
      expect(alert.lines[0]).toContain('nfseId=42');
      expect(alert.lines[0]).toContain('nfse=1000');
      expect(alert.lines[0]).toContain('motivo="timeout Giss"');
      expect(alert.lines[0]).toContain('atualizada=01/09/2026 10:00');
    });
  });

  describe('sweepIssuedWithoutBankPayment', () => {
    it('should alert with the 1h threshold', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findIssuedWithoutBankPayment').mockResolvedValue([makeRow({ status: NfseStatus.ISSUED })]);

      // Act
      await sut.sweepIssuedWithoutBankPayment();

      // Assert
      expect(nfseDao.findIssuedWithoutBankPayment).toHaveBeenCalledWith(60);
      expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({
        type: AlertType.NfseIssuedWithoutBankPayment,
      }));
    });

    it('should stay silent when every issued note already has a bank payment', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findIssuedWithoutBankPayment').mockResolvedValue([]);

      // Act
      await sut.sweepIssuedWithoutBankPayment();

      // Assert
      expect(alertGateway.send).not.toHaveBeenCalled();
      expect(cacheGateway.setIfAbsent).not.toHaveBeenCalled();
    });
  });

  describe('sweepAwaitingProvider', () => {
    it('should warn against blind reissue', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findAwaitingProvider').mockResolvedValue([
        makeRow({ status: NfseStatus.AWAITING_PROVIDER, errorMessage: 'Provedor já conhece este RPS.' }),
      ]);

      // Act
      await sut.sweepAwaitingProvider();

      // Assert — reemitir às cegas é o único erro irreversível deste fluxo.
      const alert = jest.mocked(alertGateway.send).mock.calls[0][0];
      expect(alert.type).toBe(AlertType.NfseAwaitingProvider);
      expect(alert.lines.join('\n')).toContain('antes de reemitir');
    });

    it('should stay silent when nothing is awaiting the provider', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findAwaitingProvider').mockResolvedValue([]);

      // Act
      await sut.sweepAwaitingProvider();

      // Assert
      expect(alertGateway.send).not.toHaveBeenCalled();
      expect(cacheGateway.setIfAbsent).not.toHaveBeenCalled();
    });
  });

  describe('sweepDailyClosing', () => {
    it('should alert when issued and charged counts diverge', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'countIssuedByDay').mockResolvedValue({ issued: 10, withBankPayment: 7 });

      // Act
      await sut.sweepDailyClosing(new Date('2026-09-02T08:00:00-03:00'));

      // Assert
      expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({
        type: AlertType.NfseDailyClosing,
        lines: ['Emitidas: 10', 'Com boleto: 7', 'Sem boleto: 3'],
      }));
    });

    it('should stay silent when the counts match', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'countIssuedByDay').mockResolvedValue({ issued: 10, withBankPayment: 10 });

      // Act
      await sut.sweepDailyClosing(new Date('2026-09-02T08:00:00-03:00'));

      // Assert
      expect(alertGateway.send).not.toHaveBeenCalled();
    });

    it('should count the previous day in São Paulo time', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'countIssuedByDay').mockResolvedValue({ issued: 0, withBankPayment: 0 });

      // Act — roda às 08:00 de 02/09, então o dia conferido é 01/09.
      await sut.sweepDailyClosing(new Date('2026-09-02T08:00:00-03:00'));

      // Assert
      const [dayStart, dayEnd] = jest.mocked(nfseDao.countIssuedByDay).mock.calls[0];
      expect(dayStart.toISOString()).toBe('2026-09-01T03:00:00.000Z');
      expect(dayEnd.toISOString()).toBe('2026-09-02T03:00:00.000Z');
    });

    it('should not send when the daily closing window is already claimed', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'countIssuedByDay').mockResolvedValue({ issued: 5, withBankPayment: 2 });
      jest.spyOn(cacheGateway, 'setIfAbsent').mockResolvedValue(false);

      // Act
      await sut.sweepDailyClosing(new Date('2026-09-02T08:00:00-03:00'));

      // Assert
      expect(cacheGateway.setIfAbsent).toHaveBeenCalledWith(
        buildAlertWindowKey(AlertType.NfseDailyClosing),
        expect.any(String),
        ALERT_WINDOW_IN_SECONDS[AlertType.NfseDailyClosing],
      );
      expect(alertGateway.send).not.toHaveBeenCalled();
    });
  });
  describe('sweepBankPaymentFailed', () => {
    it('should alert with the failed charges and point to the repair route of each case', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findBankPaymentFailed').mockResolvedValue([
        makeRow({ id: 77, status: NfseStatus.ISSUED, errorMessage: null }),
      ]);

      // Act
      await sut.sweepBankPaymentFailed();

      // Assert
      expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({
        type: AlertType.NfseBankPaymentFailed,
        subject: '[NFS-e] 1 cobrança(s) com falha registrada',
      }));
      const [alert] = jest.mocked(alertGateway.send).mock.calls[0];
      expect(alert.lines).toEqual(expect.arrayContaining([
        expect.stringContaining('FALHA_EMISSAO: reemitir por POST /admin/bank-payment/nfm/:id/reissue'),
        expect.stringContaining('Sem cobrança vinculada: conferir o motivo e emitir por POST /admin/bank-payment/nfm/:id.'),
      ]));
    });

    it('should stay silent when no charge failed', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findBankPaymentFailed').mockResolvedValue([]);

      // Act
      await sut.sweepBankPaymentFailed();

      // Assert
      expect(alertGateway.send).not.toHaveBeenCalled();
    });
  });

  describe('resiliência do canal (P2-12)', () => {
    it('should send anyway when claiming the digest window throws', async() => {
      // Arrange — Redis fora do ar não pode ser lido como "outra réplica já avisou": um e-mail
      // duplicado custa incômodo, um e-mail que não sai custa o incidente.
      const error = new Error('redis down');
      jest.spyOn(nfseDao, 'findStuck').mockResolvedValue([makeRow()]);
      jest.spyOn(cacheGateway, 'setIfAbsent').mockRejectedValue(error);

      // Act
      await sut.sweepStuck();

      // Assert
      expect(alertGateway.send).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(LogContext.CACHE, expect.objectContaining({
        action: 'setIfAbsent',
        key: buildAlertWindowKey(AlertType.NfseStuck),
        error,
      }));
    });

    it('should release the digest window when delivery fails', async() => {
      // Arrange — sem devolver a chave, um SMTP recusado custaria a janela inteira de silêncio.
      jest.spyOn(nfseDao, 'findStuck').mockResolvedValue([makeRow()]);
      jest.spyOn(alertGateway, 'send').mockResolvedValue(false);

      // Act
      await sut.sweepStuck();

      // Assert
      expect(cacheGateway.delete).toHaveBeenCalledWith(buildAlertWindowKey(AlertType.NfseStuck));
    });

    it('should keep the digest window when delivery succeeds', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findStuck').mockResolvedValue([makeRow()]);

      // Act
      await sut.sweepStuck();

      // Assert
      expect(cacheGateway.delete).not.toHaveBeenCalled();
    });
  });

  describe('sweepProviderAlerts', () => {
    const rowsWithAlerts = [
      makeRow({ id: 30, status: NfseStatus.ISSUED, nfseNumber: '56037', providerAlerts: 'A10: Inscrição municipal paralisada' }),
      makeRow({ id: 31, status: NfseStatus.ISSUED, nfseNumber: '56038', providerAlerts: 'A13: Prazo para conversão do RPS vencido' }),
    ];

    it('should alert about notes issued with a tax authority warning', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findIssuedWithProviderAlerts').mockResolvedValue(rowsWithAlerts);

      // Act
      await sut.sweepProviderAlerts();

      // Assert
      expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({
        type: AlertType.NfseIssuedWithProviderAlert,
        lines: expect.arrayContaining([expect.stringContaining('A10: Inscrição municipal paralisada')]),
      }));
    });

    it('should mark the notes as notified so the same warning does not repeat every window', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findIssuedWithProviderAlerts').mockResolvedValue(rowsWithAlerts);

      // Act
      await sut.sweepProviderAlerts();

      // Assert
      expect(nfseRepository.markProviderAlertsNotified).toHaveBeenCalledWith([30, 31], expect.any(Date));
    });

    it('should not mark anything as notified when the alert was not delivered', async() => {
      // Arrange — sem isso, um SMTP fora do ar apagaria a ressalva para sempre.
      jest.spyOn(nfseDao, 'findIssuedWithProviderAlerts').mockResolvedValue(rowsWithAlerts);
      jest.spyOn(alertGateway, 'send').mockResolvedValue(false);

      // Act
      await sut.sweepProviderAlerts();

      // Assert
      expect(nfseRepository.markProviderAlertsNotified).not.toHaveBeenCalled();
    });

    it('should not mark anything as notified when another replica owns the window', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findIssuedWithProviderAlerts').mockResolvedValue(rowsWithAlerts);
      jest.spyOn(cacheGateway, 'setIfAbsent').mockResolvedValue(false);

      // Act
      await sut.sweepProviderAlerts();

      // Assert — quem enviou marca; marcar aqui apagaria a ressalva sem ninguém ter sido avisado.
      expect(nfseRepository.markProviderAlertsNotified).not.toHaveBeenCalled();
    });

    it('should stay quiet when no note has warnings', async() => {
      // Arrange
      jest.spyOn(nfseDao, 'findIssuedWithProviderAlerts').mockResolvedValue([]);

      // Act
      await sut.sweepProviderAlerts();

      // Assert
      expect(alertGateway.send).not.toHaveBeenCalled();
      expect(nfseRepository.markProviderAlertsNotified).not.toHaveBeenCalled();
    });
  });

  describe('sweepCertificates', () => {
    it('should alert about a certificate close to expiry', async() => {
      // Arrange
      jest.spyOn(checkCertificates, 'execute').mockResolvedValue({
        status: CertificateHealthStatus.Expiring,
        certificates: [
          {
            provider: 'INTER',
            owner: 'mTLS da API de cobrança',
            path: '/certs/inter.crt',
            notAfter: '2026-09-25T00:00:00.000Z',
            daysToExpire: 21,
            status: CertificateHealthStatus.Expiring,
            message: null,
          },
        ],
      });

      // Act
      await sut.sweepCertificates();

      // Assert
      expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({
        type: AlertType.CertificateExpiring,
        lines: expect.arrayContaining([expect.stringContaining('dias=21')]),
      }));
    });

    it('should alert when a certificate cannot even be read', async() => {
      // Arrange
      jest.spyOn(checkCertificates, 'execute').mockResolvedValue({
        status: CertificateHealthStatus.Error,
        certificates: [
          {
            provider: 'GISS',
            owner: 'companyId=1 · IM 16895',
            path: '/certs/missing.pfx',
            notAfter: null,
            daysToExpire: null,
            status: CertificateHealthStatus.Error,
            message: 'Certificado digital não encontrado em "/certs/missing.pfx"',
          },
        ],
      });

      // Act
      await sut.sweepCertificates();

      // Assert
      expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({
        lines: expect.arrayContaining([expect.stringContaining('não encontrado')]),
      }));
    });

    it('should stay quiet while every certificate is healthy', async() => {
      // Arrange
      jest.spyOn(checkCertificates, 'execute').mockResolvedValue({
        status: CertificateHealthStatus.Ok,
        certificates: [
          {
            provider: 'GISS',
            owner: 'companyId=1',
            path: '/certs/a1.pfx',
            notAfter: '2027-06-30T00:00:00.000Z',
            daysToExpire: 299,
            status: CertificateHealthStatus.Ok,
            message: null,
          },
        ],
      });

      // Act
      await sut.sweepCertificates();

      // Assert
      expect(alertGateway.send).not.toHaveBeenCalled();
    });
  });

  describe('sweepQueues', () => {
    function depth(overrides: Partial<{ queue: string; waiting: number; active: number; delayed: number; failed: number }> = {}) {
      return { queue: 'nfse-issue', waiting: 0, active: 0, delayed: 0, failed: 0, ...overrides };
    }

    it('should alert when a queue turns into a dam', async() => {
      // Arrange
      jest.spyOn(queueMonitor, 'getDepth').mockResolvedValue([depth({ waiting: 180, delayed: 40 })]);

      // Act
      await sut.sweepQueues();

      // Assert
      expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({
        type: AlertType.QueueBacklog,
        lines: expect.arrayContaining([expect.stringContaining('aguardando=180')]),
      }));
    });

    it('should alert about jobs that gave up, which today only show in the Bull Board', async() => {
      // Arrange
      jest.spyOn(queueMonitor, 'getDepth').mockResolvedValue([depth({ queue: 'nfse-bank-payment', failed: 3 })]);

      // Act
      await sut.sweepQueues();

      // Assert
      expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({
        type: AlertType.QueueFailed,
        subject: expect.stringContaining('3 job(s)'),
      }));
    });

    it('should stay quiet while the queues are healthy', async() => {
      // Arrange
      jest.spyOn(queueMonitor, 'getDepth').mockResolvedValue([depth({ waiting: 12, active: 2 })]);

      // Act
      await sut.sweepQueues();

      // Assert
      expect(alertGateway.send).not.toHaveBeenCalled();
    });
  });
});
