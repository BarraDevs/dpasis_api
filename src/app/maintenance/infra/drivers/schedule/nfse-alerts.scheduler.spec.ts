import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ReconcileNfsePeriod } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse-period/reconcile-nfse-period.service';
import { SweepNfseAlerts } from '../../../application/usecases/sweep-nfse-alerts/sweep-nfse-alerts.service';
import { SweepNfseRecovery } from '../../../application/usecases/sweep-nfse-recovery/sweep-nfse-recovery.service';
import { NfseAlertsScheduler } from './nfse-alerts.scheduler';

describe('NfseAlertsScheduler - Unit tests', () => {
  let sut: NfseAlertsScheduler;
  let sweepNfseAlerts: SweepNfseAlerts;
  let sweepNfseRecovery: SweepNfseRecovery;
  let reconcileNfsePeriod: ReconcileNfsePeriod;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        NfseAlertsScheduler,
        { provide: SweepNfseAlerts, useValue: createMock<SweepNfseAlerts>() },
        { provide: SweepNfseRecovery, useValue: createMock<SweepNfseRecovery>() },
        { provide: ReconcileNfsePeriod, useValue: createMock<ReconcileNfsePeriod>() },
      ],
    }).compile();

    sut = module.get(NfseAlertsScheduler);
    sweepNfseAlerts = module.get(SweepNfseAlerts);
    sweepNfseRecovery = module.get(SweepNfseRecovery);
    reconcileNfsePeriod = module.get(ReconcileNfsePeriod);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('runFrequentSweeps', () => {
    it('should call the four frequent sweeps', async() => {
      // Arrange
      jest.spyOn(sweepNfseAlerts, 'sweepStuck').mockResolvedValue(undefined);
      jest.spyOn(sweepNfseAlerts, 'sweepIssuedWithoutBankPayment').mockResolvedValue(undefined);
      jest.spyOn(sweepNfseAlerts, 'sweepAwaitingProvider').mockResolvedValue(undefined);
      jest.spyOn(sweepNfseAlerts, 'sweepBankPaymentFailed').mockResolvedValue(undefined);

      // Act
      await sut.runFrequentSweeps();

      // Assert
      expect(sweepNfseAlerts.sweepStuck).toHaveBeenCalledTimes(1);
      expect(sweepNfseAlerts.sweepIssuedWithoutBankPayment).toHaveBeenCalledTimes(1);
      expect(sweepNfseAlerts.sweepAwaitingProvider).toHaveBeenCalledTimes(1);
      expect(sweepNfseAlerts.sweepBankPaymentFailed).toHaveBeenCalledTimes(1);
    });

    it('should keep running the other sweeps when one rejects', async() => {
      // Arrange
      jest.spyOn(sweepNfseAlerts, 'sweepStuck').mockRejectedValue(new Error('dao down'));
      jest.spyOn(sweepNfseAlerts, 'sweepIssuedWithoutBankPayment').mockResolvedValue(undefined);
      jest.spyOn(sweepNfseAlerts, 'sweepAwaitingProvider').mockResolvedValue(undefined);
      jest.spyOn(sweepNfseAlerts, 'sweepBankPaymentFailed').mockResolvedValue(undefined);

      // Act
      await expect(sut.runFrequentSweeps()).resolves.toBeUndefined();

      // Assert
      expect(sweepNfseAlerts.sweepIssuedWithoutBankPayment).toHaveBeenCalledTimes(1);
      expect(sweepNfseAlerts.sweepAwaitingProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('runRecoverySweeps', () => {
    it('should call the four recovery sweeps', async() => {
      // Arrange
      jest.spyOn(sweepNfseRecovery, 'sweepOutbox').mockResolvedValue(0);
      jest.spyOn(sweepNfseRecovery, 'sweepReconciliation').mockResolvedValue(0);
      jest.spyOn(sweepNfseRecovery, 'sweepMissingBankPayment').mockResolvedValue(0);
      jest.spyOn(sweepNfseRecovery, 'sweepBankPaymentConfirmation').mockResolvedValue(0);

      // Act
      await sut.runRecoverySweeps();

      // Assert
      expect(sweepNfseRecovery.sweepOutbox).toHaveBeenCalledTimes(1);
      expect(sweepNfseRecovery.sweepReconciliation).toHaveBeenCalledTimes(1);
      expect(sweepNfseRecovery.sweepMissingBankPayment).toHaveBeenCalledTimes(1);
      expect(sweepNfseRecovery.sweepBankPaymentConfirmation).toHaveBeenCalledTimes(1);
    });

    it('should keep running the other sweeps when one rejects', async() => {
      // Arrange
      jest.spyOn(sweepNfseRecovery, 'sweepOutbox').mockRejectedValue(new Error('db down'));
      jest.spyOn(sweepNfseRecovery, 'sweepReconciliation').mockResolvedValue(0);
      jest.spyOn(sweepNfseRecovery, 'sweepMissingBankPayment').mockResolvedValue(0);
      jest.spyOn(sweepNfseRecovery, 'sweepBankPaymentConfirmation').mockResolvedValue(0);

      // Act
      await expect(sut.runRecoverySweeps()).resolves.toBeUndefined();

      // Assert
      expect(sweepNfseRecovery.sweepReconciliation).toHaveBeenCalledTimes(1);
    });
  });

  describe('runDailyReconciliation', () => {
    it('should reconcile the previous São Paulo day, writing changes', async() => {
      // Arrange
      jest.useFakeTimers().setSystemTime(new Date('2026-09-04T07:30:00-03:00'));
      jest.spyOn(reconcileNfsePeriod, 'execute').mockResolvedValue({
        checked: 0, corrected: 0, pagesRead: 0, divergences: [], dryRun: false,
      });

      // Act
      await sut.runDailyReconciliation();

      // Assert
      expect(reconcileNfsePeriod.execute).toHaveBeenCalledWith({
        startDate: '2026-09-03',
        endDate: '2026-09-03',
        dryRun: false,
      });

      jest.useRealTimers();
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
