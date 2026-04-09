import { Test } from '@nestjs/testing';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { PermissionLevel } from 'src/app/admin/domain/enums/permission-level.enum';
import { AdminCannotBeInactiveError } from 'src/app/admin/domain/errors/admin-cannot-be-inactive';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AdminModule } from '../../../admin.module';
import { AdminNotFoundError } from '../../../domain/errors/admin-not-found.error';
import { CreateAdmin } from '../create-admin/create-admin.service';
import { CreateAdminInputDto } from '../create-admin/dtos/create-admin.dto';
import { InactivateAdmin } from './inactivate-admin.service';

describe('InactivateAdmin - Integration tests', () => {
  let sut: InactivateAdmin;
  let createAdmin: CreateAdmin;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [AdminModule],
    }).compile();

    sut = module.get(InactivateAdmin);
    createAdmin = module.get(CreateAdmin);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  function makeCreateInput(overrides: Partial<CreateAdminInputDto> = {}): CreateAdminInputDto {
    return {
      name: 'Admin',
      email: 'admin@test.com',
      password: 'SenhaForte123',
      document: '529.982.247-25',
      profilePicture: null,
      subjects: [
        { subject: ClaimSubject.Bank, enabled: true, level: PermissionLevel.Read },
      ],
      ...overrides,
    };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw AdminNotFoundError when admin does not exist', async() => {
    await expect(sut.execute(999999)).rejects.toThrow(AdminNotFoundError);
  });

  it('should throw AdminCannotBeInactiveError when admin cannot be inactive', async() => {
    const { id } = await createAdmin.execute(makeCreateInput());
    await prisma.account.update({
      where: { id },
      data: { canBeRemoved: false },
    });

    await expect(sut.execute(id)).rejects.toThrow(AdminCannotBeInactiveError);
  });

  it('should set account status to inactive', async() => {
    const { id } = await createAdmin.execute(makeCreateInput());

    const result = await sut.execute(id);

    expect(result).toEqual({ message: 'Administrador inativado com sucesso' });
    const acc = await prisma.account.findUnique({ where: { id } });
    expect(acc?.status).toBe(AccountStatus.INACTIVE);
  });

  it('should keep account status to inactive when it is already inactive', async() => {
    const { id } = await createAdmin.execute(makeCreateInput());
    await prisma.account.update({
      where: { id },
      data: { status: AccountStatus.INACTIVE },
    });

    const result = await sut.execute(id);

    expect(result).toEqual({ message: 'Administrador inativado com sucesso' });
    const acc = await prisma.account.findUnique({ where: { id } });
    expect(acc?.status).toBe(AccountStatus.INACTIVE);
  });
});
