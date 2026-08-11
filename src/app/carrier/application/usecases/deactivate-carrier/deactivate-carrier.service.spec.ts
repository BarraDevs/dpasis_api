import { Test } from '@nestjs/testing';
import { CarrierNotFoundError } from 'src/app/carrier/domain/errors/carrier-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CarrierModule } from '../../../carrier.module';
import { DeactivateCarrier } from './deactivate-carrier.service';

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

describe('DeactivateCarrier - Integration tests', () => {
  let sut: DeactivateCarrier;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CarrierModule],
    }).compile();

    sut = module.get(DeactivateCarrier);
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

  it('should deactivate carrier in database', async() => {
    // Arrange
    const carrier = await prisma.carrier.create({
      data: makeCarrierData({ active: true }),
    });

    // Act
    await sut.execute(carrier.id);

    // Assert
    const updated = await prisma.carrier.findUnique({ where: { id: carrier.id } });
    expect(updated?.active).toBe(false);
  });

  it('should return success message', async() => {
    // Arrange
    const carrier = await prisma.carrier.create({
      data: makeCarrierData({ active: true }),
    });

    // Act
    const result = await sut.execute(carrier.id);

    // Assert
    expect(result).toEqual({ message: 'Transportadora desativada com sucesso' });
  });

  it('should be idempotent when carrier is already inactive', async() => {
    // Arrange
    const carrier = await prisma.carrier.create({
      data: makeCarrierData({ active: false }),
    });

    // Act
    const result = await sut.execute(carrier.id);

    // Assert
    expect(result).toEqual({ message: 'Transportadora desativada com sucesso' });
    const updated = await prisma.carrier.findUnique({ where: { id: carrier.id } });
    expect(updated?.active).toBe(false);
  });
});
