import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AccountModule } from 'src/app/account/account.module';
import { ConfigModule } from 'src/core/config/config.module';
import { AccountWithSensitiveDataDto } from '../../dtos/account.dto';
import { FindAccountByCredential } from './find-account-by-credential.service';

describe('FindAccountByCredential - Unit tests', () => {
  let sut: FindAccountByCredential;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AccountModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAccountByCredential);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call accountDao.findByCredential with correct values', async() => {
    // Arrange
    const credential = 'any-credential';
    const findByCredentialSpy = jest.spyOn(sut['accountDao'], 'findByCredential');

    // Act
    await sut.execute(credential);

    // Assert
    expect(findByCredentialSpy).toHaveBeenCalledWith(credential);
  });

  it('should return null if account is not found', async() => {
    // Arrange
    const credential = 'non-existing-credential';
    jest.spyOn(sut['accountDao'], 'findByCredential').mockResolvedValue(null);

    // Act
    const result = await sut.execute(credential);

    // Assert
    expect(result).toBeNull();
  });

  it('should return account if found by credential', async() => {
    // Arrange
    const credential = 'jhondoe@email.com';
    const account = createMock<AccountWithSensitiveDataDto>();
    jest.spyOn(sut['accountDao'], 'findByCredential').mockResolvedValue(account);

    // Act
    const result = await sut.execute(credential);

    // Assert
    expect(result).toEqual(account);
  });
});
