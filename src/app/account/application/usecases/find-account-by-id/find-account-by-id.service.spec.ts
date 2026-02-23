import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { AccountDto } from '../../dtos/account.dto';
import { IAccountDao } from '../../persistence/dao/account-dao.interface';
import { FindAccountById } from './find-account-by-id.service';

describe('FindAccountById - Unit tests', () => {
  let sut: FindAccountById;
  let accountDao: IAccountDao;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAccountById,
        {
          provide: TOKENS.AccountDao,
          useValue: createMock<IAccountDao>(),
        },
      ],
    }).compile();

    sut = module.get(FindAccountById);
    accountDao = module.get(TOKENS.AccountDao);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call accountDao.findById with correct values', async() => {
    // Arrange
    const id = 1;
    const findByIdSpy = jest.spyOn(accountDao, 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
  });

  it('should return null if account is not found', async() => {
    // Arrange
    const id = 0;
    jest.spyOn(accountDao, 'findById').mockResolvedValue(null);

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toBeNull();
  });

  it('should return account if found by id', async() => {
    // Arrange
    const id = 1;
    const account = createMock<AccountDto>();
    jest.spyOn(accountDao, 'findById').mockResolvedValue(account);

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual(account);
  });
});
