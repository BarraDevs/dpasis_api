import { Test } from '@nestjs/testing';
import { CarrierNotFoundError } from 'src/app/carrier/domain/errors/carrier-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CarrierModule } from '../../../carrier.module';
import { CarrierDto } from '../../dtos/carrier.dto';
import { FindCarrierById } from './find-carrier-by-id.service';

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

describe('FindCarrierById - Integration tests', () => {
  let sut: FindCarrierById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CarrierModule],
    }).compile();

    sut = module.get(FindCarrierById);
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

  it('should throw CarrierNotFoundError when carrier does not exist', async() => {
    // Act / Assert
    await expect(sut.execute(99999)).rejects.toThrow(CarrierNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('Transportadora não encontrada na base de dados.');
  });

  it('should return CarrierDto when carrier exists', async() => {
    // Arrange
    const created = await prisma.carrier.create({
      data: makeCarrierData(),
    });

    // Act
    const result = await sut.execute(created.id);

    // Assert
    expect(result).toEqual<CarrierDto>({
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
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  it('should throw CarrierNotFoundError when onlyActive is true and carrier is inactive', async() => {
    // Arrange
    const created = await prisma.carrier.create({
      data: makeCarrierData({ active: false }),
    });

    // Act / Assert
    await expect(sut.execute(created.id, { onlyActive: true })).rejects.toThrow(CarrierNotFoundError);
    await expect(sut.execute(created.id, { onlyActive: true })).rejects.toThrow(
      'Transportadora não encontrada na base de dados.',
    );
  });

  it('should return CarrierDto when onlyActive is true and carrier is active', async() => {
    // Arrange
    const created = await prisma.carrier.create({
      data: makeCarrierData({ active: true }),
    });

    // Act
    const result = await sut.execute(created.id, { onlyActive: true });

    // Assert
    expect(result.id).toBe(created.id);
    expect(result.active).toBe(true);
  });

  it('should return inactive carrier when onlyActive is not set', async() => {
    // Arrange
    const created = await prisma.carrier.create({
      data: makeCarrierData({ active: false }),
    });

    // Act
    const result = await sut.execute(created.id);

    // Assert
    expect(result.id).toBe(created.id);
    expect(result.active).toBe(false);
  });
});
