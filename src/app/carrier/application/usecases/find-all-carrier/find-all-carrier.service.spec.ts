import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CarrierModule } from '../../../carrier.module';
import { CarrierDto } from '../../dtos/carrier.dto';
import { FindAllCarrierQueryDto } from './dtos/find-all-carrier.dto';
import { FindAllCarrier } from './find-all-carrier.service';

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

describe('FindAllCarrier - Integration tests', () => {
  let sut: FindAllCarrier;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CarrierModule],
    }).compile();

    sut = module.get(FindAllCarrier);
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

  it('should return empty results when no carriers exist', async() => {
    // Arrange
    const query: FindAllCarrierQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all carriers with pagination', async() => {
    // Arrange
    await prisma.carrier.create({ data: makeCarrierData({ document: '09748165000110' }) });
    await prisma.carrier.create({
      data: makeCarrierData({
        name: 'Transportadora B',
        document: '33000167000101',
      }),
    });
    await prisma.carrier.create({
      data: makeCarrierData({
        name: 'Transportadora C',
        document: '11222333000181',
      }),
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results correctly', async() => {
    // Arrange
    for (let i = 0; i < 25; i++) {
      await prisma.carrier.create({
        data: makeCarrierData({
          name: `Transportadora ${i + 1}`,
          document: String(10000000000000 + i),
        }),
      });
    }

    // Act
    const page1 = await sut.execute({ page: 1, size: 10 });
    const page3 = await sut.execute({ page: 3, size: 10 });

    // Assert
    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  it('should order by id asc', async() => {
    // Arrange
    const first = await prisma.carrier.create({
      data: makeCarrierData({ document: '09748165000110' }),
    });
    const second = await prisma.carrier.create({
      data: makeCarrierData({ document: '33000167000101', name: 'B' }),
    });
    const third = await prisma.carrier.create({
      data: makeCarrierData({ document: '11222333000181', name: 'C' }),
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0].id).toBe(first.id);
    expect(result.data[1].id).toBe(second.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    // Arrange
    await prisma.carrier.create({ data: makeCarrierData({ document: '09748165000110', active: true }) });
    await prisma.carrier.create({
      data: makeCarrierData({ document: '33000167000101', active: false, name: 'Inativa' }),
    });
    await prisma.carrier.create({
      data: makeCarrierData({ document: '11222333000181', active: true, name: 'Ativa 2' }),
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: true });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: CarrierDto) => d.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    // Arrange
    await prisma.carrier.create({ data: makeCarrierData({ document: '09748165000110', active: true }) });
    await prisma.carrier.create({
      data: makeCarrierData({ document: '33000167000101', active: false, name: 'Inativa 1' }),
    });
    await prisma.carrier.create({
      data: makeCarrierData({ document: '11222333000181', active: false, name: 'Inativa 2' }),
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: false });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: CarrierDto) => !d.active)).toBe(true);
  });

  it('should return correct CarrierDto structure', async() => {
    // Arrange
    const created = await prisma.carrier.create({
      data: makeCarrierData({
        complement: 'Sala 1',
        document: '09748165000110',
      }),
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual<CarrierDto>({
      id: created.id,
      name: 'Transportadora LTDA',
      fantasyName: 'Transportadora',
      representative: 'João Silva',
      document: '09748165000110',
      contact: 'João Silva - (11) 99999-9999',
      active: true,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      complement: 'Sala 1',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  it('should filter by search insensitive across name fantasyName document and representative', async() => {
    // Arrange
    await prisma.carrier.create({
      data: makeCarrierData({
        name: 'Alpha Logística',
        fantasyName: 'Alpha',
        representative: 'Carlos',
        document: '09748165000110',
      }),
    });
    await prisma.carrier.create({
      data: makeCarrierData({
        name: 'Beta Transportes',
        fantasyName: 'Beta',
        representative: 'Maria Santos',
        document: '33000167000101',
      }),
    });
    await prisma.carrier.create({
      data: makeCarrierData({
        name: 'Gamma',
        fantasyName: 'Gama Fantasy',
        representative: 'Pedro',
        document: '11222333000181',
      }),
    });

    // Act
    const byName = await sut.execute({ page: 1, size: 10, search: 'alpha' });
    const byRepresentative = await sut.execute({ page: 1, size: 10, search: 'maria' });
    const byFantasy = await sut.execute({ page: 1, size: 10, search: 'gama fantasy' });
    const byDocument = await sut.execute({ page: 1, size: 10, search: '33000167000101' });

    // Assert
    expect(byName.data).toHaveLength(1);
    expect(byName.data[0].name).toBe('Alpha Logística');

    expect(byRepresentative.data).toHaveLength(1);
    expect(byRepresentative.data[0].representative).toBe('Maria Santos');

    expect(byFantasy.data).toHaveLength(1);
    expect(byFantasy.data[0].fantasyName).toBe('Gama Fantasy');

    expect(byDocument.data).toHaveLength(1);
    expect(byDocument.data[0].document).toBe('33000167000101');
  });
});
