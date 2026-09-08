import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { IAlertGateway } from 'src/infra/alert/alert.gateway';
import { AlertType } from 'src/infra/alert/enums/alert-type.enum';
import type { ICacheGateway } from 'src/infra/cache/cache.gateway';
import type { ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { SaveElegibleNfmsOutputDto } from '../save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { SaveElegibleNfms } from '../save-elegible-nfms/save-elegible-nfms.service';
import { RunDailyNfmIssuance } from './run-daily-nfm-issuance.service';

function makeResult(overrides: Partial<SaveElegibleNfmsOutputDto> = {}): SaveElegibleNfmsOutputDto {
  return { created: 3, skipped: 1, failed: 0, errors: [], ...overrides };
}

describe('RunDailyNfmIssuance', () => {
  let sut: RunDailyNfmIssuance;
  let saveElegibleNfms: SaveElegibleNfms;
  let cacheGateway: ICacheGateway;
  let alertGateway: IAlertGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        RunDailyNfmIssuance,
        { provide: SaveElegibleNfms, useValue: createMock<SaveElegibleNfms>() },
        { provide: TOKENS.CacheGateway, useValue: createMock<ICacheGateway>() },
        { provide: TOKENS.AlertGateway, useValue: createMock<IAlertGateway>() },
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
      ],
    }).compile();

    sut = module.get(RunDailyNfmIssuance);
    saveElegibleNfms = module.get(SaveElegibleNfms);
    cacheGateway = module.get(TOKENS.CacheGateway);
    alertGateway = module.get(TOKENS.AlertGateway);

    jest.spyOn(cacheGateway, 'setIfAbsent').mockResolvedValue(true);
    jest.spyOn(alertGateway, 'send').mockResolvedValue(true);
  });

  it('should claim the day and run the issuance', async() => {
    // Arrange
    const result = makeResult();
    jest.spyOn(saveElegibleNfms, 'execute').mockResolvedValue(result);

    // Act
    const output = await sut.execute();

    // Assert
    expect(output).toBe(result);
    expect(cacheGateway.setIfAbsent).toHaveBeenCalledWith(
      expect.stringMatching(/^cron:nfm-daily-issuance:\d{4}-\d{2}-\d{2}$/),
      expect.any(String),
      82_800,
    );
  });

  it('should not issue anything when another replica already claimed the day', async() => {
    // Arrange
    jest.spyOn(cacheGateway, 'setIfAbsent').mockResolvedValue(false);

    // Act
    const output = await sut.execute();

    // Assert
    expect(output).toBeNull();
    expect(saveElegibleNfms.execute).not.toHaveBeenCalled();
  });

  it('should refuse to issue when the lock cannot be verified, and say so', async() => {
    // Arrange — fail-closed: emitir duas vezes é irreversível, deixar de emitir não é.
    jest.spyOn(cacheGateway, 'setIfAbsent').mockRejectedValue(new Error('Redis indisponível'));

    // Act
    const output = await sut.execute();

    // Assert
    expect(output).toBeNull();
    expect(saveElegibleNfms.execute).not.toHaveBeenCalled();
    expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({ type: AlertType.NfmDailyIssuance }));
  });

  it('should stay quiet when every eligible client was billed', async() => {
    // Arrange
    jest.spyOn(saveElegibleNfms, 'execute').mockResolvedValue(makeResult());

    // Act
    await sut.execute();

    // Assert
    expect(alertGateway.send).not.toHaveBeenCalled();
  });

  it('should alert with the failing clients when the closing had failures', async() => {
    // Arrange
    jest.spyOn(saveElegibleNfms, 'execute').mockResolvedValue(makeResult({
      failed: 1,
      errors: [{ clientId: 10, cnaeNbsIndopId: 0, message: 'Cliente sem itens de serviço' }],
    }));

    // Act
    await sut.execute();

    // Assert
    expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({
      type: AlertType.NfmDailyIssuance,
      lines: expect.arrayContaining([expect.stringContaining('clientId=10')]),
    }));
  });

  it('should alert instead of crashing the scheduler when the issuance throws', async() => {
    // Arrange
    jest.spyOn(saveElegibleNfms, 'execute').mockRejectedValue(new Error('banco fora do ar'));

    // Act
    const output = await sut.execute();

    // Assert
    expect(output).toBeNull();
    expect(alertGateway.send).toHaveBeenCalledWith(expect.objectContaining({
      subject: expect.stringContaining('falhou'),
    }));
  });
});
