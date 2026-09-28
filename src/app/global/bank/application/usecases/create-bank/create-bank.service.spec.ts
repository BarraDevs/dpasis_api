import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { ISecretsCryptoGateway } from 'src/infra/secrets-crypto/secrets-crypto.gateway';
import { BankAlreadyExistsError } from '../../../domain/errors/bank-already-exists.error';
import { BankDto } from '../../dtos/bank.dto';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { CreateBank } from './create-bank.service';
import { CreateBankInputDto } from './dtos/create-bank.dto';

function makeValidCreateBankInput(overrides: Partial<CreateBankInputDto> = {}): CreateBankInputDto {
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

describe('CreateBank - Unit tests', () => {
  let sut: CreateBank;
  let dao: IBankDao;
  let secretsCrypto: ISecretsCryptoGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateBank,
        { provide: TOKENS.BankDao, useValue: createMock<IBankDao>() },
        {
          provide: TOKENS.SecretsCryptoGateway,
          useValue: createMock<ISecretsCryptoGateway>({
            encrypt: jest.fn((value: string) => `enc:${value}`),
          }),
        },
      ],
    }).compile();

    sut = module.get(CreateBank);
    dao = module.get(TOKENS.BankDao);
    secretsCrypto = module.get(TOKENS.SecretsCryptoGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw BankAlreadyExistsError when bankCode/agency/account already exist', async() => {
    // Arrange
    jest.spyOn(dao, 'findByBankCodeAgencyAccount').mockResolvedValue(createMock<BankDto>({ id: 9 }));

    // Act & Assert
    await expect(sut.execute(makeValidCreateBankInput())).rejects.toThrow(BankAlreadyExistsError);
    expect(dao.save).not.toHaveBeenCalled();
  });

  it('should persist public fields without encrypting when keys are omitted', async() => {
    // Arrange
    const input = makeValidCreateBankInput();
    jest.spyOn(dao, 'findByBankCodeAgencyAccount').mockResolvedValue(null);
    jest.spyOn(dao, 'save').mockResolvedValue(42);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result).toEqual({ id: 42 });
    expect(secretsCrypto.encrypt).not.toHaveBeenCalled();
    expect(dao.save).toHaveBeenCalledWith(expect.objectContaining({
      drawer: input.drawer,
      bankCode: input.bankCode,
    }));
  });

  it('should encrypt keys and return generated webhook token', async() => {
    // Arrange
    const input = makeValidCreateBankInput({
      apiUrl: 'https://cdpj.partners.bancointer.com.br',
      clientId: 'client-xyz',
      clientSecret: 'secret-xyz',
    });
    jest.spyOn(dao, 'findByBankCodeAgencyAccount').mockResolvedValue(null);
    jest.spyOn(dao, 'save').mockResolvedValue(7);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBe(7);
    expect(result.webhookToken).toEqual(expect.any(String));
    expect(dao.save).toHaveBeenCalledWith(expect.objectContaining({
      apiUrl: input.apiUrl,
      clientIdCiphertext: 'enc:client-xyz',
      clientIdHint: '-xyz',
      clientSecretCiphertext: 'enc:secret-xyz',
      webhookTokenHash: expect.any(String),
    }));
  });
});
