import { Test } from '@nestjs/testing';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { PermissionLevel } from 'src/app/admin/application/permission/permission-level.enum';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AdminModule } from '../../../admin.module';
import { AdminNotFoundError } from '../../../domain/errors/admin-not-found.error';
import { CreateAdmin } from '../create-admin/create-admin.service';
import { CreateAdminInputDto } from '../create-admin/dtos/create-admin.dto';
import { ActivateAdmin } from './activate-admin.service';

describe('ActivateAdmin - Integration tests', () => {
  let sut: ActivateAdmin;
  let createAdmin: CreateAdmin;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [AdminModule],
    }).compile();

    sut = module.get(ActivateAdmin);
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

  it('should set account status to active', async() => {
    const { id } = await createAdmin.execute(makeCreateInput());
    await prisma.account.update({
      where: { id },
      data: { status: AccountStatus.INACTIVE },
    });

    const result = await sut.execute(id);

    expect(result).toEqual({ message: 'Administrador ativado com sucesso' });
    const acc = await prisma.account.findUnique({ where: { id } });
    expect(acc?.status).toBe(AccountStatus.ACTIVE);
  });

  it('should keep account status to active when it is already active', async() => {
    const { id } = await createAdmin.execute(makeCreateInput());
    await prisma.account.update({
      where: { id },
      data: { status: AccountStatus.ACTIVE },
    });

    const result = await sut.execute(id);

    expect(result).toEqual({ message: 'Administrador ativado com sucesso' });
    const acc = await prisma.account.findUnique({ where: { id } });
    expect(acc?.status).toBe(AccountStatus.ACTIVE);
  });
});
