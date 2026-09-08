import { createMock } from '@golevelup/ts-jest';
import { RunDailyNfmIssuance } from '../../../application/usecases/run-daily-nfm-issuance/run-daily-nfm-issuance.service';
import { NfmIssuanceScheduler } from './nfm-issuance.scheduler';

const SCHEDULE_CRON_OPTIONS = 'SCHEDULE_CRON_OPTIONS';

describe('NfmIssuanceScheduler', () => {
  it('should run the daily issuance at 06:00 Sao Paulo time', () => {
    // Act
    const options = Reflect.getMetadata(SCHEDULE_CRON_OPTIONS, NfmIssuanceScheduler.prototype.runDailyIssuance);

    // Assert
    expect(options).toMatchObject({ name: 'nfm-daily-issuance', timeZone: 'America/Sao_Paulo' });
  });

  it('should delegate to the use case', async() => {
    // Arrange
    const runDailyNfmIssuance = createMock<RunDailyNfmIssuance>();
    const sut = new NfmIssuanceScheduler(runDailyNfmIssuance);

    // Act
    await sut.runDailyIssuance();

    // Assert
    expect(runDailyNfmIssuance.execute).toHaveBeenCalledTimes(1);
  });
});
