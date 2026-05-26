import { Test } from '@nestjs/testing';
import { ResaleFactory } from 'src/app/resale/resale/domain/factories/resale.factory';
import { ResaleType } from 'src/app/resale/resale/domain/enums/resale-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleRepositoryAdapterPrisma } from './resale-prisma.repository';

describe('ResaleRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ResaleRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ResaleRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ResaleRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  function makeCreateProps() {
    return {
      type: ResaleType.PJ,
      name: 'Revenda Exemplo',
      identifier: null,
      zipCode: '01310-100',
      street: 'Av Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      licenseType: 'A1',
      document: '09.748.165/0001-10',
      ie: null,
      phone01: '11999999999',
      phone02: null,
      voucher: null,
      email: null,
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
    };
  }

  describe('save', () => {
    it('should persist resale and return id', async() => {
      const entity = ResaleFactory.create({ ...makeCreateProps(), id: 100 });

      const id = await sut.save(entity);

      expect(id).toBe(100);

      const saved = await prisma.resale.findUnique({ where: { id: 100 } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('Revenda Exemplo');
      expect(saved?.document).toBe('09748165000110');
      expect(saved?.type).toBe('PJ');
      expect(saved?.active).toBe(true);
    });

    it('should persist explicit createdAt when provided on entity', async() => {
      const createdAt = new Date('2020-03-15T00:00:00.000Z');
      const entity = ResaleFactory.create({
        ...makeCreateProps(),
        id: 199,
        createdAt,
      });

      await sut.save(entity);

      const saved = await prisma.resale.findUnique({ where: { id: 199 } });
      expect(saved?.createdAt).toEqual(createdAt);
    });

    it('should persist extended optional columns on save', async() => {
      const validity = new Date('2027-03-01T00:00:00.000Z');
      const entity = ResaleFactory.create({
        ...makeCreateProps(),
        id: 101,
        nickname: 'Nova loja',
        socialName: 'Razão social persistida',
        validityDate: validity,
        accessEmail: 'save@test.com',
        accessPassword: 'senha-save',
        paymentDay: 4,
        bonus: 88,
        billingStartDay: 30,
        indicatorResale: true,
        recurringResale: true,
      });

      const id = await sut.save(entity);

      expect(id).toBe(101);

      const saved = await prisma.resale.findUnique({ where: { id: 101 } });
      expect(saved?.nickname).toBe('Nova loja');
      expect(saved?.socialName).toBe('Razão social persistida');
      expect(saved?.validityDate?.toISOString()).toBe(validity.toISOString());
      expect(saved?.accessEmail).toBe('save@test.com');
      expect(saved?.accessPassword).toBe('senha-save');
      expect(saved?.paymentDay).toBe(4);
      expect(saved?.bonus).toBe(88);
      expect(saved?.billingStartDay).toBe(30);
      expect(saved?.indicatorResale).toBe(true);
      expect(saved?.recurringResale).toBe(true);
    });

    it('should persist honorificId on save', async() => {
      const honorific = await prisma.honorific.create({ data: { name: 'Prof.' } });
      const entity = ResaleFactory.create({
        ...makeCreateProps(),
        id: 102,
        honorificId: honorific.id,
      });

      const id = await sut.save(entity);

      expect(id).toBe(102);
      const saved = await prisma.resale.findUnique({ where: { id: 102 } });
      expect(saved?.honorificId).toBe(honorific.id);
    });
  });

  describe('findById', () => {
    it('should return null when resale does not exist', async() => {
      const result = await sut.findById(99_999);

      expect(result).toBeNull();
    });

    it('should map row to entity', async() => {
      const validity = new Date('2026-04-10T00:00:00.000Z');
      await prisma.resale.create({
        data: {
          id: 50,
          type: 'PJ',
          name: 'Revenda DB',
          identifier: 'R-50',
          zipCode: '01310100',
          street: 'Rua X',
          neighborhood: 'Centro',
          city: 'Campinas',
          state: 'SP',
          licenseType: 'B',
          document: '28695096000179',
          ie: '123',
          phone01: '11988887777',
          phone02: null,
          voucher: null,
          email: 'r@test.com',
          website: null,
          nickname: 'RepoNick',
          socialName: 'Nome da revenda LTDA',
          validityDate: validity,
          accessEmail: 'acesso@repo.com',
          accessPassword: 'pwd-db',
          paymentDay: 6,
          bonus: 40,
          billingStartDay: 11,
          receivesSupportEmail: true,
          servedByRoot: true,
          manufacturerResale: false,
          indicatorResale: true,
          recurringResale: false,
          active: false,
        },
      });

      const result = await sut.findById(50);

      expect(result).not.toBeNull();
      expect(result?.props.validityDate?.toISOString()).toBe(validity.toISOString());
      expect(result?.props).toMatchObject({
        id: 50,
        type: 'PJ',
        name: 'Revenda DB',
        identifier: 'R-50',
        document: '28695096000179',
        active: false,
        nickname: 'RepoNick',
        socialName: 'Nome da revenda LTDA',
        accessEmail: 'acesso@repo.com',
        accessPassword: 'pwd-db',
        paymentDay: 6,
        bonus: 40,
        billingStartDay: 11,
        receivesSupportEmail: true,
        servedByRoot: true,
        indicatorResale: true,
        recurringResale: false,
        honorificId: null,
      });
    });
  });

  describe('edit', () => {
    it('should update fields', async() => {
      await prisma.resale.create({
        data: {
          id: 7,
          type: 'PJ',
          name: 'Antigo',
          identifier: null,
          zipCode: '01310100',
          street: 'Rua A',
          neighborhood: 'B',
          city: 'São Paulo',
          state: 'SP',
          licenseType: 'A1',
          document: '09748165000110',
          ie: null,
          phone01: '11999999999',
          phone02: null,
          voucher: null,
          email: null,
          website: null,
          nickname: null,
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
          active: true,
        },
      });

      const base = makeCreateProps();
      const entity = ResaleFactory.edit({
        ...base,
        id: 7,
        name: 'Novo nome',
        identifier: 'ID-7',
        zipCode: '20040020',
        street: 'Rua Nova',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        licenseType: 'A2',
        document: '09748165000110',
        ie: 'IE-1',
        phone01: '21977776666',
        phone02: '21966665555',
        voucher: 'V-1',
        email: 'novo@test.com',
        website: 'https://exemplo.com',
        receivesSupportEmail: true,
        servedByRoot: true,
        manufacturerResale: true,
        active: false,
        profilePictureUrl: null,
      });

      await sut.edit(entity);

      const updated = await prisma.resale.findUnique({ where: { id: 7 } });
      expect(updated?.name).toBe('Novo nome');
      expect(updated?.identifier).toBe('ID-7');
      expect(updated?.city).toBe('Rio de Janeiro');
      expect(updated?.active).toBe(false);
      expect(updated?.manufacturerResale).toBe(true);
    });

    it('should persist extended optional columns on edit', async() => {
      await prisma.resale.create({
        data: {
          id: 71,
          type: 'PJ',
          name: 'Base',
          identifier: null,
          zipCode: '01310100',
          street: 'Rua A',
          neighborhood: 'B',
          city: 'São Paulo',
          state: 'SP',
          licenseType: 'A1',
          document: '09748165000110',
          ie: null,
          phone01: '11999999999',
          phone02: null,
          voucher: null,
          email: null,
          website: null,
          nickname: null,
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
          active: true,
        },
      });

      const validity = new Date('2029-06-15T00:00:00.000Z');
      const entity = ResaleFactory.edit({
        ...makeCreateProps(),
        id: 71,
        name: 'Base',
        nickname: 'Subsul',
        validityDate: validity,
        accessEmail: 'repo@test.com',
        accessPassword: 'hash-repo',
        paymentDay: 9,
        bonus: 77,
        billingStartDay: 29,
        indicatorResale: true,
        recurringResale: true,
        receivesSupportEmail: true,
        servedByRoot: true,
        manufacturerResale: false,
        profilePictureUrl: null,
        active: true,
      });

      await sut.edit(entity);

      const updated = await prisma.resale.findUnique({ where: { id: 71 } });
      expect(updated?.nickname).toBe('Subsul');
      expect(updated?.validityDate?.toISOString()).toBe(validity.toISOString());
      expect(updated?.accessEmail).toBe('repo@test.com');
      expect(updated?.accessPassword).toBe('hash-repo');
      expect(updated?.paymentDay).toBe(9);
      expect(updated?.bonus).toBe(77);
      expect(updated?.billingStartDay).toBe(29);
      expect(updated?.indicatorResale).toBe(true);
      expect(updated?.recurringResale).toBe(true);
    });
  });

  describe('delete', () => {
    it('should remove resale', async() => {
      await prisma.resale.create({
        data: {
          id: 88,
          type: 'PJ',
          name: 'Remover',
          identifier: null,
          zipCode: '01310100',
          street: 'S',
          neighborhood: 'N',
          city: 'C',
          state: 'SP',
          licenseType: 'A1',
          document: '28695096000179',
          ie: null,
          phone01: '11999999999',
          phone02: null,
          voucher: null,
          email: null,
          website: null,
          nickname: null,
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
          active: true,
        },
      });

      await sut.delete(88);

      const gone = await prisma.resale.findUnique({ where: { id: 88 } });
      expect(gone).toBeNull();
    });
  });
});
