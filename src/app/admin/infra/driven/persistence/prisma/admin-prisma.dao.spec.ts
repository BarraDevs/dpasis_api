import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { AdminDetailDto, AdminListDto } from 'src/app/admin/application/dtos/admin.dto';
import {
  claimFromSubjectAction,
  type ClaimValue,
} from 'src/app/authentication/domain/authorization/claim';
import { ClaimAction } from 'src/app/authentication/domain/authorization/claim-action.enum';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AdminDaoAdapterPrisma } from './admin-prisma.dao';

async function seedAdmin(
  prisma: PrismaService,
  input: {
    name: string;
    email: string;
    document: string;
    status: AccountStatus;
  },
) {
  const account = await prisma.account.create({
    data: {
      role: AccountRole.ADMIN,
      name: input.name,
      email: input.email,
      password: 'hash',
      status: input.status,
      profilePicture: null,
    },
  });

  await prisma.admin.create({
    data: {
      accountId: account.id,
      document: input.document,
    },
  });

  return account;
}

async function expectedAdminListDto(
  prisma: PrismaService,
  accountId: number,
): Promise<AdminListDto> {
  const row = await prisma.admin.findUnique({
    where: { accountId },
    include: {
      account: {
        select: {
          name: true,
          email: true,
          status: true,
          profilePicture: true,
        },
      },
    },
  });
  if (!row) {
    throw new Error(`Admin not found for accountId ${accountId}`);
  }

  return {
    id: row.accountId,
    name: row.account.name,
    email: row.account.email,
    status: row.account.status as AccountStatus,
    profilePicture: row.account.profilePicture,
    document: row.document,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function expectedAdminDetailDto(
  prisma: PrismaService,
  accountId: number,
): Promise<AdminDetailDto> {
  const list = await expectedAdminListDto(prisma, accountId);
  const claimRows = await prisma.accountClaim.findMany({
    where: { accountId },
    orderBy: { id: 'asc' },
    select: { subject: true, action: true },
  });
  const claims: ClaimValue[] = claimRows
    .map(c => claimFromSubjectAction(c.subject, c.action))
    .filter((c): c is ClaimValue => c !== null);

  return {
    ...list,
    claims,
  };
}

describe('AdminDaoAdapterPrisma - Integration tests', () => {
  let sut: AdminDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [AdminDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(AdminDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no admins exist', async() => {
      const [rows, total] = await sut.findAll({});

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return admins with correct list dto shape', async() => {
      const account = await seedAdmin(prisma, {
        name: 'Admin Um',
        email: 'admin1@test.com',
        document: '99000000000001',
        status: AccountStatus.ACTIVE,
      });

      const [rows, total] = await sut.findAll({});

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0]).toMatchObject<Partial<AdminListDto>>({
        id: account.id,
        name: 'Admin Um',
        email: 'admin1@test.com',
        status: AccountStatus.ACTIVE,
        document: '99000000000001',
      });
      expect(rows[0]).toHaveProperty('createdAt');
      expect(rows[0]).toHaveProperty('updatedAt');
      expect(rows[0].createdAt).toBeInstanceOf(Date);
      expect(rows[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should return AdminListDto equal to persisted row (toEqual)', async() => {
      const account = await seedAdmin(prisma, {
        name: 'Dto Full',
        email: 'dto-full@test.com',
        document: '99000000000012',
        status: AccountStatus.ACTIVE,
      });

      const expected = await expectedAdminListDto(prisma, account.id);
      const [rows] = await sut.findAll({});

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual(expected);
    });

    it('should filter by active when provided', async() => {
      await seedAdmin(prisma, {
        name: 'Ativo',
        email: 'a@test.com',
        document: '99000000000002',
        status: AccountStatus.ACTIVE,
      });
      await seedAdmin(prisma, {
        name: 'Inativo',
        email: 'b@test.com',
        document: '99000000000003',
        status: AccountStatus.INACTIVE,
      });

      const [activeRows, activeTotal] = await sut.findAll({ active: true });
      const [inactiveRows, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeRows).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeRows[0].name).toBe('Ativo');
      expect(inactiveRows).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveRows[0].name).toBe('Inativo');
    });

    it('should paginate results correctly', async() => {
      for (let i = 0; i < 25; i++) {
        const doc = String(99100000000000 + i);
        await seedAdmin(prisma, {
          name: `Admin ${i}`,
          email: `admin${i}@pag.test.com`,
          document: doc,
          status: AccountStatus.ACTIVE,
        });
      }

      const [page1, total] = await sut.findAll({ page: 1, size: 10 });
      const [page2] = await sut.findAll({ page: 2, size: 10 });
      const [page3] = await sut.findAll({ page: 3, size: 10 });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page3).toHaveLength(5);
      expect(total).toBe(25);
    });

    it('should search by account name (case-insensitive)', async() => {
      await seedAdmin(prisma, {
        name: 'Maria Silva',
        email: 'maria@test.com',
        document: '99000000000004',
        status: AccountStatus.ACTIVE,
      });
      await seedAdmin(prisma, {
        name: 'Outro Nome',
        email: 'outro@test.com',
        document: '99000000000005',
        status: AccountStatus.ACTIVE,
      });

      const [rows, total] = await sut.findAll({ search: 'silva' });

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0].name).toBe('Maria Silva');
    });

    it('should search by email', async() => {
      await seedAdmin(prisma, {
        name: 'A',
        email: 'unico@dominio.com',
        document: '99000000000006',
        status: AccountStatus.ACTIVE,
      });

      const [rows, total] = await sut.findAll({ search: 'unico@dom' });

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0].email).toBe('unico@dominio.com');
    });

    it('should search by document', async() => {
      await seedAdmin(prisma, {
        name: 'Doc',
        email: 'doc@test.com',
        document: '99000000000007',
        status: AccountStatus.ACTIVE,
      });

      const [rows, total] = await sut.findAll({ search: '99000000' });

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0].document).toBe('99000000000007');
    });
  });

  describe('findById', () => {
    it('should return null when admin does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return list dto when admin exists', async() => {
      const account = await seedAdmin(prisma, {
        name: 'Find Me',
        email: 'find@test.com',
        document: '99000000000008',
        status: AccountStatus.ACTIVE,
      });

      const result = await sut.findById(account.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(account.id);
      expect(result?.name).toBe('Find Me');
      expect(result?.email).toBe('find@test.com');
      expect(result?.document).toBe('99000000000008');
    });

    it('should return AdminListDto equal to persisted row (toEqual)', async() => {
      const account = await seedAdmin(prisma, {
        name: 'Find Dto Full',
        email: 'find-dto-full@test.com',
        document: '99000000000013',
        status: AccountStatus.ACTIVE,
      });

      const expected = await expectedAdminListDto(prisma, account.id);
      const result = await sut.findById(account.id);

      expect(result).toEqual(expected);
    });
  });

  describe('findByIdWithClaims', () => {
    it('should return null when admin does not exist', async() => {
      const result = await sut.findByIdWithClaims(99999);

      expect(result).toBeNull();
    });

    it('should return detail with claims mapped from account_claim', async() => {
      const account = await prisma.account.create({
        data: {
          role: AccountRole.ADMIN,
          name: 'Com Claims',
          email: 'claims@test.com',
          password: 'hash',
          status: AccountStatus.ACTIVE,
          profilePicture: null,
        },
      });
      await prisma.admin.create({
        data: { accountId: account.id, document: '99000000000009' },
      });
      await prisma.accountClaim.create({
        data: {
          accountId: account.id,
          subject: ClaimSubject.Bank,
          action: ClaimAction.Write,
        },
      });

      const result = await sut.findByIdWithClaims(account.id);

      expect(result).not.toBeNull();
      expect(result?.claims).toHaveLength(1);
      expect(result?.claims[0]).toEqual({
        subject: ClaimSubject.Bank,
        action: ClaimAction.Write,
      });
    });

    it('should return AdminDetailDto equal to persisted row (toEqual)', async() => {
      const account = await seedAdmin(prisma, {
        name: 'Detail Dto Full',
        email: 'detail-dto-full@test.com',
        document: '99000000000014',
        status: AccountStatus.ACTIVE,
      });
      await prisma.accountClaim.create({
        data: {
          accountId: account.id,
          subject: ClaimSubject.Company,
          action: ClaimAction.Read,
        },
      });

      const expected = await expectedAdminDetailDto(prisma, account.id);
      const result = await sut.findByIdWithClaims(account.id);

      expect(result).toEqual(expected);
    });
  });

  describe('findByDocument', () => {
    it('should return null when document does not exist', async() => {
      const result = await sut.findByDocument('99000000000999');

      expect(result).toBeNull();
    });

    it('should return id when document matches (case-insensitive)', async() => {
      const account = await seedAdmin(prisma, {
        name: 'D',
        email: 'd@test.com',
        document: '99000000000010',
        status: AccountStatus.ACTIVE,
      });

      const result = await sut.findByDocument('99000000000010');

      expect(result).toEqual({ id: account.id });
    });
  });

  describe('findByEmail', () => {
    it('should return null when email does not exist', async() => {
      const result = await sut.findByEmail('missing@test.com');

      expect(result).toBeNull();
    });

    it('should return account id by email', async() => {
      const account = await seedAdmin(prisma, {
        name: 'E',
        email: 'email.busca@test.com',
        document: '99000000000011',
        status: AccountStatus.ACTIVE,
      });

      const result = await sut.findByEmail('  email.busca@test.com  ');

      expect(result).toEqual({ id: account.id });
    });
  });
});
