import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { hashWebhookToken } from '../../helpers/bank-integration-secret.helper';
import type { BankIntegrationRecord, IBankDao } from '../../persistence/dao/bank-dao.interface';
import { FindBankByWebhookToken } from './find-bank-by-webhook-token.service';

describe('FindBankByWebhookToken - Unit tests', () => {
  let sut: FindBankByWebhookToken;
  let dao: IBankDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindBankByWebhookToken,
        { provide: TOKENS.BankDao, useValue: createMock<IBankDao>() },
      ],
    }).compile();

    sut = module.get(FindBankByWebhookToken);
    dao = module.get(TOKENS.BankDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return null for blank tokens without hitting the database', async() => {
    await expect(sut.execute('   ')).resolves.toBeNull();
    expect(dao.findByWebhookTokenHash).not.toHaveBeenCalled();
  });

  it('should return null when hash is unknown', async() => {
    jest.spyOn(dao, 'findByWebhookTokenHash').mockResolvedValue(null);

    await expect(sut.execute('a-valid-webhook-token')).resolves.toBeNull();
  });

  it('should return the bank when stored hash matches', async() => {
    // Arrange
    const token = 'a-valid-webhook-token';
    const record = createMock<BankIntegrationRecord>({
      id: 8,
      webhookTokenHash: hashWebhookToken(token),
    });
    jest.spyOn(dao, 'findByWebhookTokenHash').mockResolvedValue(record);

    // Act
    const result = await sut.execute(token);

    // Assert
    expect(dao.findByWebhookTokenHash).toHaveBeenCalledWith(hashWebhookToken(token));
    expect(result?.id).toBe(8);
  });
});
