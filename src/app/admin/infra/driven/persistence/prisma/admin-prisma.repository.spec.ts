import { Test } from '@nestjs/testing';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { AdminFactory } from 'src/app/admin/domain/factories/admin.factory';
import { ClaimAction } from 'src/app/authentication/domain/authorization/claim-action.enum';
import { ClaimSubject } from 'src/app/authentication/domain/authorization/claim-subject.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AdminRepositoryAdapterPrisma } from './admin-prisma.repository';

describe('AdminRepositoryAdapterPrisma - Integration tests', () => {
  let sut: AdminRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [AdminRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(AdminRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('save', () => {
    it('should persist account, admin row and claims; return created account id', async() => {
      const entity = AdminFactory.create({
        name: 'Novo Admin',
        email: 'novo@test.com',
        document: '09.748.165/0001-10',
        profilePicture: null,
        claims: [
          { subject: ClaimSubject.Bank, action: ClaimAction.Create },
        ],
      });

      const id = await sut.save(entity, 'password-hash');

      expect(id).toBeGreaterThan(0);

      const account = await prisma.account.findUnique({
        where: { id },
        include: { admin: true, claims: true },
      });

      expect(account).not.toBeNull();
      expect(account?.name).toBe('Novo Admin');
      expect(account?.email).toBe('novo@test.com');
      expect(account?.password).toBe('password-hash');
      expect(account?.status).toBe(AccountStatus.ACTIVE);
      expect(account?.admin?.document).toBe('09748165000110');
      expect(account?.claims).toHaveLength(1);
      expect(account?.claims[0]).toMatchObject({
        subject: ClaimSubject.Bank,
        action: ClaimAction.Create,
      });
    });

    it('should deduplicate identical claims on create', async() => {
      const entity = AdminFactory.create({
        name: 'Dedupe',
        email: 'dedupe@test.com',
        document: '33.000.167/0001-01',
        profilePicture: null,
        claims: [
          { subject: ClaimSubject.Bank, action: ClaimAction.Create },
          { subject: ClaimSubject.Bank, action: ClaimAction.Create },
        ],
      });

      const id = await sut.save(entity, 'hash');

      const claims = await prisma.accountClaim.findMany({ where: { accountId: id } });

      expect(claims).toHaveLength(1);
      expect(claims[0]).toMatchObject({
        subject: ClaimSubject.Bank,
        action: ClaimAction.Create,
      });
    });
  });

  describe('edit', () => {
    it('should update account and admin document', async() => {
      const created = AdminFactory.create({
        name: 'Original',
        email: 'edit@test.com',
        document: '09.748.165/0001-10',
        profilePicture: null,
        claims: [{ subject: ClaimSubject.Bank, action: ClaimAction.Create }],
      });
      const id = await sut.save(created, 'hash');

      const edited = AdminFactory.edit({
        accountId: id,
        name: 'Atualizado',
        email: 'edit@test.com',
        document: '33.000.167/0001-01',
        profilePicture: 'https://pic.example/id.png',
        status: AccountStatus.INACTIVE,
        claims: [{ subject: ClaimSubject.Company, action: ClaimAction.List }],
      });

      await sut.edit(edited);

      const account = await prisma.account.findUnique({
        where: { id },
        include: { admin: true },
      });

      expect(account?.name).toBe('Atualizado');
      expect(account?.status).toBe(AccountStatus.INACTIVE);
      expect(account?.profilePicture).toBe('https://pic.example/id.png');
      expect(account?.admin?.document).toBe('33000167000101');
    });

    it('should replace claims and remove all when new list is empty', async() => {
      const created = AdminFactory.create({
        name: 'Claims',
        email: 'claims2@test.com',
        document: '09.748.165/0001-10',
        profilePicture: null,
        claims: [{ subject: ClaimSubject.Bank, action: ClaimAction.Create }],
      });
      const id = await sut.save(created, 'hash');

      const cleared = AdminFactory.edit({
        accountId: id,
        name: 'Claims',
        email: 'claims2@test.com',
        document: '09.748.165/0001-10',
        profilePicture: null,
        status: AccountStatus.ACTIVE,
        claims: [],
      });

      await sut.edit(cleared);

      const rows = await prisma.accountClaim.findMany({ where: { accountId: id } });

      expect(rows).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return null when admin does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should load admin entity with claims', async() => {
      const created = AdminFactory.create({
        name: 'Load',
        email: 'load@test.com',
        document: '09.748.165/0001-10',
        profilePicture: null,
        claims: [
          { subject: ClaimSubject.Faq, action: ClaimAction.Detail },
        ],
      });
      const id = await sut.save(created, 'hash');

      const found = await sut.findById(id);

      expect(found).not.toBeNull();
      expect(found?.props.accountId).toBe(id);
      expect(found?.props.name).toBe('Load');
      expect(found?.props.email).toBe('load@test.com');
      expect(found?.props.document).toBe('09748165000110');
      expect(found?.props.claims).toHaveLength(1);
      expect(found?.props.claims[0]).toEqual({
        subject: ClaimSubject.Faq,
        action: ClaimAction.Detail,
      });
    });
  });
});
