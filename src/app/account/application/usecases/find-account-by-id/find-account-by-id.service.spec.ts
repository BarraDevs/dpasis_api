import { Test } from '@nestjs/testing';
import { AccountModule } from 'src/app/account/account.module';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AccountDto } from '../../dtos/account.dto';
import { FindAccountById } from './find-account-by-id.service';

describe('FindAccountById', () => {
  let sut: FindAccountById;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AccountModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAccountById);
    prisma = module.get(PrismaService);

    await prisma.account.deleteMany();
  });

  afterAll(async() => {
    await prisma.account.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call accountDao.findById with correct values', async() => {
      // Arrange
      const id = 'any-id';
      const findByIdSpy = jest.spyOn(sut['accountDao'], 'findById');

      // Act
      await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
    });
  });

  describe('integration tests', () => {
    it('should return null if account is not found', async() => {
      // Arrange
      const id = 'non-existing-id';

      // Act
      const result = await sut.execute(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return account if found by id', async() => {
      // Arrange
      const account = await prisma.account.create({
        data: {
          email: 'jhondoe@email.com',
          password: 'securepassword',
          status: AccountStatus.ACTIVE,
          roles: {
            create: {
              role: AccountRole.ADMIN,
            },
          },
        },
      });

      // Act
      const result = await sut.execute(account.id);

      // Assert
      expect(result).toEqual<AccountDto>({
        id: account.id,
        email: account.email,
        roles: [AccountRole.ADMIN],
        status: AccountStatus.ACTIVE,
      });
    });
  });
});
