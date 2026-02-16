import { Test } from '@nestjs/testing';
import { AccountModule } from 'src/app/account/account.module';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AccountDto } from '../../dtos/account.dto';
import { FindAccountById } from './find-account-by-id.service';

describe('FindAccountById - Integration tests', () => {
  let sut: FindAccountById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        AccountModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAccountById);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

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
        name: 'Jhon Doe',
        email: 'jhondoe@email.com',
        password: 'securepassword',
        status: AccountStatus.ACTIVE,
        role: AccountRole.ADMIN,
      },
    });

    // Act
    const result = await sut.execute(account.id);

    // Assert
    expect(result).toEqual<AccountDto>({
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role as AccountRole,
      status: account.status as AccountStatus,
    });
  });
});
