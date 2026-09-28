import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import { BankDto } from '../../dtos/bank.dto';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { RotateBankWebhookToken } from './rotate-bank-webhook-token.service';

describe('RotateBankWebhookToken - Unit tests', () => {
  let sut: RotateBankWebhookToken;
  let dao: IBankDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        RotateBankWebhookToken,
        { provide: TOKENS.BankDao, useValue: createMock<IBankDao>() },
      ],
    }).compile();

    sut = module.get(RotateBankWebhookToken);
    dao = module.get(TOKENS.BankDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw BankNotFoundError when bank does not exist', async() => {
    jest.spyOn(dao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1)).rejects.toThrow(BankNotFoundError);
  });

  it('should persist a new hash and return the plaintext once', async() => {
    // Arrange
    jest.spyOn(dao, 'findById').mockResolvedValue(createMock<BankDto>({ id: 3 }));

    // Act
    const result = await sut.execute(3);

    // Assert
    expect(result.webhookToken).toEqual(expect.any(String));
    expect(result.webhookToken.length).toBeGreaterThanOrEqual(16);
    expect(dao.updateIntegration).toHaveBeenCalledWith(3, {
      webhookTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });
});
