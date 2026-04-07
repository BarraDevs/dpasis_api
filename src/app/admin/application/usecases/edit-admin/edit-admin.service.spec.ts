import { Test } from '@nestjs/testing';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { AdminModule } from '../../../admin.module';
import { AdminNotFoundError } from '../../../domain/errors/admin-not-found.error';
import { CreateAdmin } from '../create-admin/create-admin.service';
import { CreateAdminInputDto } from '../create-admin/dtos/create-admin.dto';
import { EditAdminInputDto } from './dtos/edit-admin.dto';
import { EditAdmin } from './edit-admin.service';

describe('EditAdmin - Integration tests', () => {
  let sut: EditAdmin;
  let createAdmin: CreateAdmin;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [AdminModule],
    }).compile();

    sut = module.get(EditAdmin);
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
      claims: [
        { subject: Claim.BANK_LIST.subject, action: Claim.BANK_LIST.action },
      ],
      ...overrides,
    };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw AdminNotFoundError when admin does not exist', async() => {
    const data: EditAdminInputDto = {
      name: 'X',
      claims: [{ subject: Claim.BANK_READ.subject, action: Claim.BANK_READ.action }],
    };

    await expect(sut.execute(999999, data)).rejects.toThrow(AdminNotFoundError);
  });

  it('should update admin and replace claims', async() => {
    const { id } = await createAdmin.execute(makeCreateInput());

    const result = await sut.execute(id, {
      name: 'Nome Novo',
      claims: [
        { subject: Claim.COMPANY_LIST.subject, action: Claim.COMPANY_LIST.action },
        { subject: Claim.FAQ_LIST.subject, action: Claim.FAQ_LIST.action },
      ],
    });

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });

    const row = await prisma.admin.findUnique({
      where: { accountId: id },
      include: { account: { include: { claims: true } } },
    });

    expect(row?.account.name).toBe('Nome Novo');
    expect(row?.account.claims).toHaveLength(2);
  });

  it('should throw DocumentAlreadyTakenError when document belongs to another admin', async() => {
    const first = await createAdmin.execute(
      makeCreateInput({ email: 'a@test.com', document: '529.982.247-25' }),
    );
    await createAdmin.execute(
      makeCreateInput({ email: 'b@test.com', document: '390.533.447-05' }),
    );

    await expect(
      sut.execute(first.id, {
        document: '390.533.447-05',
        claims: [{ subject: Claim.BANK_LIST.subject, action: Claim.BANK_LIST.action }],
      }),
    ).rejects.toThrow(DocumentAlreadyTakenError);
  });

  it('should not change password on edit', async() => {
    const { id } = await createAdmin.execute(makeCreateInput());
    const before = await prisma.account.findUnique({ where: { id } });

    await sut.execute(id, {
      name: 'Só nome',
      claims: [{ subject: Claim.BANK_LIST.subject, action: Claim.BANK_LIST.action }],
    });

    const after = await prisma.account.findUnique({ where: { id } });
    expect(after?.password).toBe(before?.password);
  });

  it('should persist status changes only via activate use case', async() => {
    const { id } = await createAdmin.execute(makeCreateInput());

    await prisma.account.update({
      where: { id },
      data: { status: AccountStatus.INACTIVE },
    });

    await sut.execute(id, {
      claims: [{ subject: Claim.BANK_LIST.subject, action: Claim.BANK_LIST.action }],
    });

    const acc = await prisma.account.findUnique({ where: { id } });
    expect(acc?.status).toBe(AccountStatus.INACTIVE);
  });
});
