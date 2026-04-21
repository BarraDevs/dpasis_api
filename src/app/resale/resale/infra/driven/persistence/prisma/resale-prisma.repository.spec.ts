import { Test } from '@nestjs/testing';
import { ResaleFactory } from 'src/app/resale/resale/domain/factories/resale.factory';
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
      receivesSupportEmail: false,
      servedByDpa: false,
      manufacturerReseller: false,
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
      expect(saved?.active).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return null when resale does not exist', async() => {
      const result = await sut.findById(99_999);

      expect(result).toBeNull();
    });

    it('should map row to entity', async() => {
      await prisma.resale.create({
        data: {
          id: 50,
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
          receivesSupportEmail: true,
          servedByDpa: true,
          manufacturerReseller: false,
          active: false,
        },
      });

      const result = await sut.findById(50);

      expect(result).not.toBeNull();
      expect(result?.props).toMatchObject({
        id: 50,
        name: 'Revenda DB',
        identifier: 'R-50',
        document: '28695096000179',
        active: false,
        receivesSupportEmail: true,
        servedByDpa: true,
      });
    });
  });

  describe('edit', () => {
    it('should update fields', async() => {
      await prisma.resale.create({
        data: {
          id: 7,
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
          receivesSupportEmail: false,
          servedByDpa: false,
          manufacturerReseller: false,
          active: true,
        },
      });

      const entity = ResaleFactory.edit({
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
        servedByDpa: true,
        manufacturerReseller: true,
        active: false,
      });

      await sut.edit(entity);

      const updated = await prisma.resale.findUnique({ where: { id: 7 } });
      expect(updated?.name).toBe('Novo nome');
      expect(updated?.identifier).toBe('ID-7');
      expect(updated?.city).toBe('Rio de Janeiro');
      expect(updated?.active).toBe(false);
      expect(updated?.manufacturerReseller).toBe(true);
    });
  });

  describe('delete', () => {
    it('should remove resale', async() => {
      await prisma.resale.create({
        data: {
          id: 88,
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
          receivesSupportEmail: false,
          servedByDpa: false,
          manufacturerReseller: false,
          active: true,
        },
      });

      await sut.delete(88);

      const gone = await prisma.resale.findUnique({ where: { id: 88 } });
      expect(gone).toBeNull();
    });
  });
});
