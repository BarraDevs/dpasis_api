import { Test } from '@nestjs/testing';
import { CarrierDto } from 'src/app/carrier/application/dtos/carrier.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CarrierDaoAdapterPrisma } from './carrier-prisma.dao';

function makeCarrierData(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Transportadora LTDA',
    fantasyName: 'Transportadora',
    representative: 'João Silva',
    document: '09748165000110',
    contact: 'João Silva - (11) 99999-9999',
    active: true,
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    ...overrides,
  };
}

describe('CarrierDaoAdapterPrisma - Integration tests', () => {
  let sut: CarrierDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [CarrierDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(CarrierDaoAdapterPrisma);
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
    it('should return empty array when no carriers exist', async() => {
      const [carriers, total] = await sut.findAll({});

      expect(carriers).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return carriers saved with correct format', async() => {
      const created = await prisma.carrier.create({ data: makeCarrierData() });

      const [carriers, total] = await sut.findAll({});

      expect(carriers).toHaveLength(1);
      expect(total).toBe(1);
      expect(carriers[0]).toMatchObject<Partial<CarrierDto>>({
        id: created.id,
        name: 'Transportadora LTDA',
        fantasyName: 'Transportadora',
        document: '09748165000110',
        representative: 'João Silva',
        contact: 'João Silva - (11) 99999-9999',
        active: true,
      });
    });

    it('should filter by active when provided', async() => {
      await prisma.carrier.create({ data: makeCarrierData({ document: '09748165000110', active: true }) });
      await prisma.carrier.create({
        data: makeCarrierData({
          name: 'Transportadora Inativa',
          document: '33000167000101',
          active: false,
        }),
      });

      const [activeCarriers, activeTotal] = await sut.findAll({ active: true });
      const [inactiveCarriers, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeCarriers).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(inactiveCarriers).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
    });

    it('should search in representative field', async() => {
      await prisma.carrier.create({ data: makeCarrierData({ representative: 'Maria Santos' }) });
      await prisma.carrier.create({
        data: makeCarrierData({
          document: '33000167000101',
          representative: 'Pedro Lima',
        }),
      });

      const [carriers, total] = await sut.findAll({ search: 'maria' });

      expect(carriers).toHaveLength(1);
      expect(total).toBe(1);
      expect(carriers[0].representative).toBe('Maria Santos');
    });
  });

  describe('findById', () => {
    it('should return null when carrier does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return carrier by id', async() => {
      const created = await prisma.carrier.create({ data: makeCarrierData() });

      const result = await sut.findById(created.id);

      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe('Transportadora LTDA');
    });
  });

  describe('findByDocument', () => {
    it('should return null when document does not exist', async() => {
      const result = await sut.findByDocument('09748165000110');

      expect(result).toBeNull();
    });

    it('should return carrier by document', async() => {
      const created = await prisma.carrier.create({ data: makeCarrierData() });

      const result = await sut.findByDocument('09748165000110');

      expect(result?.id).toBe(created.id);
      expect(result?.document).toBe('09748165000110');
    });
  });
});
