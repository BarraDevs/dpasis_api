import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { ILocalSecureFileGateway } from 'src/infra/local-secure-file/local-secure-file.gateway';
import { BankInUseError } from '../../../domain/errors/bank-in-use.error';
import { BankNotFoundError } from '../../../domain/errors/bank-not-found.error';
import { BankDto } from '../../dtos/bank.dto';
import type { IBankDao } from '../../persistence/dao/bank-dao.interface';
import { DeleteBank } from './delete-bank.service';

describe('DeleteBank - Unit tests', () => {
  let sut: DeleteBank;
  let dao: IBankDao;
  let localSecureFile: ILocalSecureFileGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteBank,
        { provide: TOKENS.BankDao, useValue: createMock<IBankDao>() },
        { provide: TOKENS.LocalSecureFileGateway, useValue: createMock<ILocalSecureFileGateway>() },
      ],
    }).compile();

    sut = module.get(DeleteBank);
    dao = module.get(TOKENS.BankDao);
    localSecureFile = module.get(TOKENS.LocalSecureFileGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw BankNotFoundError when bank does not exist', async() => {
    jest.spyOn(dao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(99)).rejects.toThrow(BankNotFoundError);
    expect(dao.delete).not.toHaveBeenCalled();
  });

  it('should throw BankInUseError when invoice configs reference the bank', async() => {
    jest.spyOn(dao, 'findById').mockResolvedValue(createMock<BankDto>({ id: 1 }));
    jest.spyOn(dao, 'countClientInvoiceConfigsByBankId').mockResolvedValue(1);

    await expect(sut.execute(1)).rejects.toThrow(BankInUseError);
    expect(dao.delete).not.toHaveBeenCalled();
  });

  it('should delete the bank and its certificate directory', async() => {
    // Arrange
    jest.spyOn(dao, 'findById').mockResolvedValue(createMock<BankDto>({ id: 12 }));
    jest.spyOn(dao, 'countClientInvoiceConfigsByBankId').mockResolvedValue(0);

    // Act
    const result = await sut.execute(12);

    // Assert
    expect(dao.delete).toHaveBeenCalledWith(12);
    expect(localSecureFile.deleteDirectory).toHaveBeenCalledWith('12');
    expect(result).toEqual({ message: 'Banco excluído com sucesso.' });
  });
});
