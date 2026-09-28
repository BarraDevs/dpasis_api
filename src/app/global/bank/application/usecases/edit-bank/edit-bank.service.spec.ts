import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { ISecretsCryptoGateway } from 'src/infra/secrets-crypto/secrets-crypto.gateway';
import { BankAlreadyExistsError } from '../../../domain/errors/bank-already-exists.error';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import { BankDto } from '../../dtos/bank.dto';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { EditBankInputDto } from './dtos/edit-bank.dto';
import { EditBank } from './edit-bank.service';

function makeValidEditBankInput(overrides: Partial<EditBankInputDto> = {}): EditBankInputDto {
  return {
    drawer: 'Empresa XYZ Ltda',
    wallet: '123',
    account: '12345-6',
    agency: '0001',
    bankCode: '001',
    bankName: 'Banco do Brasil',
    paymentLocation: null,
    ...overrides,
  };
}

describe('EditBank - Unit tests', () => {
  let sut: EditBank;
  let dao: IBankDao;
  let secretsCrypto: ISecretsCryptoGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditBank,
        { provide: TOKENS.BankDao, useValue: createMock<IBankDao>() },
        {
          provide: TOKENS.SecretsCryptoGateway,
          useValue: createMock<ISecretsCryptoGateway>({
            encrypt: jest.fn((value: string) => `enc:${value}`),
          }),
        },
      ],
    }).compile();

    sut = module.get(EditBank);
    dao = module.get(TOKENS.BankDao);
    secretsCrypto = module.get(TOKENS.SecretsCryptoGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw BankNotFoundError when bank does not exist', async() => {
    jest.spyOn(dao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1, makeValidEditBankInput())).rejects.toThrow(BankNotFoundError);
    expect(dao.edit).not.toHaveBeenCalled();
  });

  it('should throw BankAlreadyExistsError when another bank owns the unique key', async() => {
    jest.spyOn(dao, 'findById').mockResolvedValue(createMock<BankDto>({ id: 1 }));
    jest.spyOn(dao, 'findByBankCodeAgencyAccount').mockResolvedValue(createMock<BankDto>({ id: 2 }));

    await expect(sut.execute(1, makeValidEditBankInput())).rejects.toThrow(BankAlreadyExistsError);
    expect(dao.edit).not.toHaveBeenCalled();
  });

  it('should keep existing secrets when keys are omitted', async() => {
    // Arrange
    const input = makeValidEditBankInput();
    jest.spyOn(dao, 'findById').mockResolvedValue(createMock<BankDto>({ id: 1 }));
    jest.spyOn(dao, 'findByBankCodeAgencyAccount').mockResolvedValue(null);

    // Act
    const result = await sut.execute(1, input);

    // Assert
    expect(result).toEqual({ message: 'Banco atualizado com sucesso' });
    expect(secretsCrypto.encrypt).not.toHaveBeenCalled();
    expect(dao.edit).toHaveBeenCalledWith(1, expect.objectContaining({
      drawer: input.drawer,
      bankName: input.bankName,
    }));
    expect(dao.edit).toHaveBeenCalledWith(1, expect.not.objectContaining({
      clientIdCiphertext: expect.anything(),
    }));
  });

  it('should encrypt a new clientSecret without generating a webhook token', async() => {
    // Arrange
    jest.spyOn(dao, 'findById').mockResolvedValue(createMock<BankDto>({ id: 1 }));
    jest.spyOn(dao, 'findByBankCodeAgencyAccount').mockResolvedValue(null);

    // Act
    await sut.execute(1, makeValidEditBankInput({ clientSecret: 'novo-secret' }));

    // Assert
    expect(dao.edit).toHaveBeenCalledWith(1, expect.objectContaining({
      clientSecretCiphertext: 'enc:novo-secret',
    }));
    expect(dao.edit).toHaveBeenCalledWith(1, expect.not.objectContaining({
      webhookTokenHash: expect.anything(),
    }));
  });
});
