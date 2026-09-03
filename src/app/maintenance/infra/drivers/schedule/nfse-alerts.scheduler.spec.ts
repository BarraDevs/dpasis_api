import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { SweepNfseAlerts } from '../../../application/usecases/sweep-nfse-alerts/sweep-nfse-alerts.service';
import { NfseAlertsScheduler } from './nfse-alerts.scheduler';

describe('NfseAlertsScheduler - Unit tests', () => {
  let sut: NfseAlertsScheduler;
  let sweepNfseAlerts: SweepNfseAlerts;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        NfseAlertsScheduler,
        { provide: SweepNfseAlerts, useValue: createMock<SweepNfseAlerts>() },
      ],
    }).compile();

    sut = module.get(NfseAlertsScheduler);
    sweepNfseAlerts = module.get(SweepNfseAlerts);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('runFrequentSweeps', () => {
    it('should call the three frequent sweeps', async() => {
      // Arrange
      jest.spyOn(sweepNfseAlerts, 'sweepStuck').mockResolvedValue(undefined);
      jest.spyOn(sweepNfseAlerts, 'sweepIssuedWithoutBankPayment').mockResolvedValue(undefined);
      jest.spyOn(sweepNfseAlerts, 'sweepAwaitingProvider').mockResolvedValue(undefined);

      // Act
      await sut.runFrequentSweeps();

      // Assert
      expect(sweepNfseAlerts.sweepStuck).toHaveBeenCalledTimes(1);
      expect(sweepNfseAlerts.sweepIssuedWithoutBankPayment).toHaveBeenCalledTimes(1);
      expect(sweepNfseAlerts.sweepAwaitingProvider).toHaveBeenCalledTimes(1);
    });

    it('should keep running the other sweeps when one rejects', async() => {
      // Arrange
      jest.spyOn(sweepNfseAlerts, 'sweepStuck').mockRejectedValue(new Error('dao down'));
      jest.spyOn(sweepNfseAlerts, 'sweepIssuedWithoutBankPayment').mockResolvedValue(undefined);
      jest.spyOn(sweepNfseAlerts, 'sweepAwaitingProvider').mockResolvedValue(undefined);

      // Act
      await expect(sut.runFrequentSweeps()).resolves.toBeUndefined();

      // Assert
      expect(sweepNfseAlerts.sweepIssuedWithoutBankPayment).toHaveBeenCalledTimes(1);
      expect(sweepNfseAlerts.sweepAwaitingProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('runDailyClosing', () => {
    it('should delegate to sweepDailyClosing', async() => {
      // Arrange
      jest.spyOn(sweepNfseAlerts, 'sweepDailyClosing').mockResolvedValue(undefined);

      // Act
      await sut.runDailyClosing();

      // Assert
      expect(sweepNfseAlerts.sweepDailyClosing).toHaveBeenCalledTimes(1);
    });
  });
});
