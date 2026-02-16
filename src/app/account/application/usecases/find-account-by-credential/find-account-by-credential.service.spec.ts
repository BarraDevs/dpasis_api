import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { AccountWithSensitiveDataDto } from '../../dtos/account.dto';
import { IAccountDao } from '../../persistence/dao/account-dao.interface';
import { FindAccountByCredential } from './find-account-by-credential.service';

describe('FindAccountByCredential - Unit tests', () => {
  let sut: FindAccountByCredential;
  let accountDao: IAccountDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAccountByCredential,
        {
          provide: TOKENS.AccountDao,
          useValue: createMock<IAccountDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindAccountByCredential);
    accountDao = module.get(TOKENS.AccountDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call accountDao.findByCredential with correct values', async() => {
    // Arrange
    const credential = 'any-credential';
    const findByCredentialSpy = jest.spyOn(accountDao, 'findByCredential');

    // Act
    await sut.execute(credential);

    // Assert
    expect(findByCredentialSpy).toHaveBeenCalledWith(credential);
  });

  it('should return null if account is not found', async() => {
    // Arrange
    const credential = 'non-existing-credential';
    jest.spyOn(accountDao, 'findByCredential').mockResolvedValue(null);

    // Act
    const result = await sut.execute(credential);

    // Assert
    expect(result).toBeNull();
  });

  it('should return account if found by credential', async() => {
    // Arrange
    const credential = 'jhondoe@email.com';
    const account = createMock<AccountWithSensitiveDataDto>();
    jest.spyOn(accountDao, 'findByCredential').mockResolvedValue(account);

    // Act
    const result = await sut.execute(credential);

    // Assert
    expect(result).toEqual(account);
  });
});
