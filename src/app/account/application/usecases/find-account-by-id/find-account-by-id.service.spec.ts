import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AccountModule } from 'src/app/account/account.module';
import { ConfigModule } from 'src/core/config/config.module';
import { AccountDto } from '../../dtos/account.dto';
import { FindAccountById } from './find-account-by-id.service';

describe('FindAccountById - Unit tests', () => {
  let sut: FindAccountById;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AccountModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAccountById);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call accountDao.findById with correct values', async() => {
    // Arrange
    const id = 'any-id';
    const findByIdSpy = jest.spyOn(sut['accountDao'], 'findById');

    // Act
    await sut.execute(id);

    // Assert
    expect(findByIdSpy).toHaveBeenCalledWith(id);
  });

  it('should return null if account is not found', async() => {
    // Arrange
    const id = 'non-existing-id';
    jest.spyOn(sut['accountDao'], 'findById').mockResolvedValue(null);

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toBeNull();
  });

  it('should return account if found by id', async() => {
    // Arrange
    const id = 'any-id';
    const account = createMock<AccountDto>();
    jest.spyOn(sut['accountDao'], 'findById').mockResolvedValue(account);

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual(account);
  });
});
