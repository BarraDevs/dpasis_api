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

    sut = module.get<FindAccountById>(FindAccountById);
    prisma = module.get<PrismaService>(PrismaService);

    await prisma.account.deleteMany();
  });

  afterAll(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return null if account is not found', async() => {
    // Arrange
    const credential = 'non-existing-credential';

    // Act
    const result = await sut.execute(credential);

    // Assert
    expect(result).toBeNull();
  });

  it('should return account if found by id', async() => {
    // Arrange
    const createdAccount = await prisma.account.create({
      data: {
        document: '12345678900',
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
    const result = await sut.execute(createdAccount.id);

    // Assert
    expect(result).not.toBeNull();
    expect(result).toEqual<AccountDto>({
      id: createdAccount.id,
      email: createdAccount.email,
      roles: [AccountRole.ADMIN],
      status: AccountStatus.ACTIVE,
    });
  });
});
