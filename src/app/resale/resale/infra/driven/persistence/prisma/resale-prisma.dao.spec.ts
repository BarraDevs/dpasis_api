import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleDaoAdapterPrisma } from './resale-prisma.dao';

describe('ResaleDaoAdapterPrisma - Integration tests', () => {
  let sut: ResaleDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ResaleDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ResaleDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  function resaleRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 1,
      type: 'PJ',
      name: 'Revenda Teste',
      identifier: 'REV-1',
      zipCode: '01310100',
      street: 'Av Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      licenseType: 'A1',
      document: '09748165000110',
      ie: null,
      phone01: '11999999999',
      phone02: null,
      voucher: null,
      email: 'contato@test.com',
      website: null,
      nickname: null,
      socialName: null,
      validityDate: null,
      accessEmail: null,
      accessPassword: null,
      paymentDay: null,
      bonus: null,
      billingStartDay: null,
      receivesSupportEmail: false,
      servedByRoot: false,
      manufacturerResale: false,
      indicatorResale: false,
      recurringResale: false,
      profilePictureUrl: null,
      active: true,
      ...overrides,
    };
  }

  describe('findAll', () => {
    it('should return empty array when no resales exist', async() => {
      const [rows, total] = await sut.findAll({});

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return resales with DTO shape', async() => {
      await prisma.resale.create({ data: resaleRow() });

      const [rows, total] = await sut.findAll({});

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0]).toMatchObject({
        id: 1,
        type: 'PJ',
        name: 'Revenda Teste',
        identifier: 'REV-1',
        document: '09748165000110',
        active: true,
      });
      expect(rows[0].createdAt).toBeInstanceOf(Date);
      expect(rows[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should filter by active when provided', async() => {
      await prisma.resale.createMany({
        data: [
          resaleRow({ id: 1, name: 'Ativa', active: true }),
          resaleRow({
            id: 2,
            name: 'Inativa',
            document: '28695096000179',
            active: false,
          }),
        ],
      });

      const [inactiveOnly, total] = await sut.findAll({ active: false });

      expect(total).toBe(1);
      expect(inactiveOnly).toHaveLength(1);
      expect(inactiveOnly[0].id).toBe(2);
      expect(inactiveOnly[0].active).toBe(false);
    });

    it('should search by name (case-insensitive)', async() => {
      await prisma.resale.createMany({
        data: [
          resaleRow({ id: 1, name: 'Revenda Alpha' }),
          resaleRow({
            id: 2,
            name: 'Outra loja',
            document: '28695096000179',
          }),
        ],
      });

      const [rows, total] = await sut.findAll({ search: 'alpha' });

      expect(total).toBe(1);
      expect(rows[0].name).toBe('Revenda Alpha');
    });

    it('should search by document (case-insensitive)', async() => {
      await prisma.resale.create({
        data: resaleRow({ id: 1, document: '09748165000110' }),
      });

      const [rows, total] = await sut.findAll({ search: '09748165000110' });

      expect(total).toBe(1);
      expect(rows[0].document).toBe('09748165000110');
    });

    it('should search by identifier (case-insensitive)', async() => {
      await prisma.resale.create({
        data: resaleRow({ id: 1, identifier: 'Codigo-XPTO' }),
      });

      const [rows, total] = await sut.findAll({ search: 'xpto' });

      expect(total).toBe(1);
      expect(rows[0].identifier).toBe('Codigo-XPTO');
    });

    it('should search by nickname (case-insensitive)', async() => {
      await prisma.resale.createMany({
        data: [
          resaleRow({ id: 1, nickname: 'Nick Cento' }),
          resaleRow({
            id: 2,
            name: 'Outra loja',
            document: '28695096000179',
            nickname: 'Outro',
          }),
        ],
      });

      const [rows, total] = await sut.findAll({ search: 'Nick' });

      expect(total).toBe(1);
      expect(rows[0].nickname).toBe('Nick Cento');
    });

    it('should search by socialName (case-insensitive)', async() => {
      await prisma.resale.createMany({
        data: [
          resaleRow({ id: 1, socialName: 'Revenda Instituto Alfa' }),
          resaleRow({
            id: 2,
            name: 'Outra loja',
            document: '28695096000179',
            socialName: 'Outra denominação',
          }),
        ],
      });

      const [rows, total] = await sut.findAll({ search: 'Instituto' });

      expect(total).toBe(1);
      expect(rows[0].socialName).toBe('Revenda Instituto Alfa');
    });

    it('should search by accessEmail (case-insensitive)', async() => {
      await prisma.resale.createMany({
        data: [
          resaleRow({
            id: 1,
            accessEmail: 'acesso@alfa.com',
          }),
          resaleRow({
            id: 2,
            name: 'Beta',
            document: '28695096000179',
            accessEmail: 'outro@beta.com',
          }),
        ],
      });

      const [rows, total] = await sut.findAll({ search: 'alfa.com' });

      expect(total).toBe(1);
      expect(rows[0].accessEmail).toBe('acesso@alfa.com');
    });

    it('should paginate and order by id asc', async() => {
      await prisma.resale.createMany({
        data: [3, 1, 2].map((id) =>
          resaleRow({
            id,
            name: `R${id}`,
            document: id === 1 ? '09748165000110' : id === 2 ? '28695096000179' : '97456321558',
            identifier: `id-${id}`,
          }),
        ),
      });

      const [page1, total] = await sut.findAll({ page: 1, size: 2 });
      const [page2] = await sut.findAll({ page: 2, size: 2 });

      expect(total).toBe(3);
      expect(page1.map((r) => r.id)).toEqual([1, 2]);
      expect(page2.map((r) => r.id)).toEqual([3]);
    });
  });

  describe('findById', () => {
    it('should return null when resale does not exist', async() => {
      const result = await sut.findById(99_999);

      expect(result).toBeNull();
    });

    it('should return resale by id including extended columns', async() => {
      const validity = new Date('2026-02-01T00:00:00.000Z');
      await prisma.resale.create({
        data: resaleRow({
          nickname: 'Nick DAO',
          validityDate: validity,
          accessEmail: 'dao@test.com',
          accessPassword: 'secret-dao',
          paymentDay: 3,
          bonus: 100,
          billingStartDay: 17,
          indicatorResale: true,
          recurringResale: false,
        }),
      });

      const result = await sut.findById(1);

      expect(result).not.toBeNull();
      expect(result?.validityDate?.toISOString()).toBe(validity.toISOString());
      expect(result).toMatchObject({
        nickname: 'Nick DAO',
        accessEmail: 'dao@test.com',
        accessPassword: 'secret-dao',
        paymentDay: 3,
        bonus: 100,
        billingStartDay: 17,
        indicatorResale: true,
        recurringResale: false,
      });
    });
  });

  describe('findByDocument', () => {
    it('should return null when document does not exist', async() => {
      const result = await sut.findByDocument('28695096000179');

      expect(result).toBeNull();
    });

    it('should find resale by document with case-insensitive match', async() => {
      await prisma.resale.create({
        data: resaleRow({ document: '09748165000110' }),
      });

      const result = await sut.findByDocument('09748165000110');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.document).toBe('09748165000110');
    });
  });

  describe('findMaxId', () => {
    it('should return 0 when table is empty', async() => {
      const max = await sut.findMaxId();

      expect(max).toBe(0);
    });

    it('should return highest id', async() => {
      await prisma.resale.createMany({
        data: [
          resaleRow({ id: 5, document: '09748165000110' }),
          resaleRow({ id: 12, document: '28695096000179' }),
        ],
      });

      const max = await sut.findMaxId();

      expect(max).toBe(12);
    });
  });
});
