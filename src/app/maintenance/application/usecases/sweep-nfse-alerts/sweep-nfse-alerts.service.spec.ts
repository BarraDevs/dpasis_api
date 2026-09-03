import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { NfseAlertRowDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse-alert-row.dto';
import type { INfseDao } from 'src/app/tax-invoice/nfse/application/persistence/dao/nfse-dao.interface';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { TOKENS } from 'src/core/di/token';
import type { IAlertGateway } from 'src/infra/alert/alert.gateway';
import { AlertType } from 'src/infra/alert/enums/alert-type.enum';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import { ALERT_WINDOW_IN_SECONDS, buildAlertWindowKey } from '../../alert-window';
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
  let alertGateway: IAlertGateway;
  let cacheGateway: ICacheGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        SweepNfseAlerts,
        { provide: TOKENS.NfseDao, useValue: createMock<INfseDao>() },
        { provide: TOKENS.AlertGateway, useValue: createMock<IAlertGateway>() },
        { provide: TOKENS.CacheGateway, useValue: createMock<ICacheGateway>() },
      ],
    }).compile();

    sut = module.get(SweepNfseAlerts);
    nfseDao = module.get(TOKENS.NfseDao);
    alertGateway = module.get(TOKENS.AlertGateway);
    cacheGateway = module.get(TOKENS.CacheGateway);

    // Por padrão a janela está livre; os casos que testam a trava sobrescrevem.
    jest.spyOn(cacheGateway, 'setIfAbsent').mockResolvedValue(true);
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
});
