import { AlertType } from 'src/infra/alert/enums/alert-type.enum';
import { ALERT_WINDOW_IN_SECONDS, buildAlertWindowKey } from './alert-window';

describe('alert-window - Unit tests', () => {
  it('should be defined', () => {
    expect(ALERT_WINDOW_IN_SECONDS).toBeDefined();
    expect(buildAlertWindowKey).toBeDefined();
  });

  describe('buildAlertWindowKey', () => {
    it.each(Object.values(AlertType))('should prefix alert-window: for type %s', (type) => {
      // Act
      const key = buildAlertWindowKey(type);

      // Assert
      expect(key).toBe(`alert-window:${type}`);
    });
  });

  describe('ALERT_WINDOW_IN_SECONDS', () => {
    it('should use 15 minutes for stuck and issued-without-bank-payment', () => {
      expect(ALERT_WINDOW_IN_SECONDS[AlertType.NfseStuck]).toBe(900);
      expect(ALERT_WINDOW_IN_SECONDS[AlertType.NfseIssuedWithoutBankPayment]).toBe(900);
    });

    it('should use 12 hours for awaiting-provider', () => {
      expect(ALERT_WINDOW_IN_SECONDS[AlertType.NfseAwaitingProvider]).toBe(43_200);
    });

    it('should use 23 hours for daily closing', () => {
      expect(ALERT_WINDOW_IN_SECONDS[AlertType.NfseDailyClosing]).toBe(82_800);
    });
  });
});
