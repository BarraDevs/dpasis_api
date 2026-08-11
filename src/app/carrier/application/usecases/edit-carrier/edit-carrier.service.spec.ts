import { Test } from '@nestjs/testing';
import { CarrierNotFoundError } from 'src/app/carrier/domain/errors/carrier-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { InvalidDocumentError } from 'src/shared/value-objects/document/document.error';
import { CarrierModule } from '../../../carrier.module';
import { EditCarrier } from './edit-carrier.service';

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

describe('EditCarrier - Integration tests', () => {
  let sut: EditCarrier;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CarrierModule],
    }).compile();

    sut = module.get(EditCarrier);
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
    await expect(sut.execute(99999, { name: 'Novo Nome' })).rejects.toThrow(CarrierNotFoundError);
    await expect(sut.execute(99999, { name: 'Novo Nome' })).rejects.toThrow(
      'Transportadora não encontrada na base de dados.',
    );
  });

  it('should edit carrier name and persist in database', async() => {
    // Arrange
    const carrier = await prisma.carrier.create({
      data: makeCarrierData(),
    });

    // Act
    const result = await sut.execute(carrier.id, { name: 'Novo Nome LTDA' });

    // Assert
    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
    const updated = await prisma.carrier.findUnique({ where: { id: carrier.id } });
    expect(updated?.name).toBe('Novo Nome LTDA');
    expect(updated?.fantasyName).toBe('Transportadora');
    expect(updated?.document).toBe('09748165000110');
  });

  it('should throw DocumentAlreadyTakenError when document is taken by another carrier', async() => {
    // Arrange
    const carrier = await prisma.carrier.create({
      data: makeCarrierData({ document: '09748165000110' }),
    });
    await prisma.carrier.create({
      data: makeCarrierData({
        name: 'Outra Transportadora',
        document: '33000167000101',
      }),
    });

    // Act / Assert
    await expect(
      sut.execute(carrier.id, { document: '33.000.167/0001-01' }),
    ).rejects.toThrow(DocumentAlreadyTakenError);
  });

  it('should allow editing with the same document of the carrier itself', async() => {
    // Arrange
    const carrier = await prisma.carrier.create({
      data: makeCarrierData({ document: '09748165000110' }),
    });

    // Act
    const result = await sut.execute(carrier.id, {
      document: '09.748.165/0001-10',
      name: 'Nome Atualizado',
    });

    // Assert
    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
    const updated = await prisma.carrier.findUnique({ where: { id: carrier.id } });
    expect(updated?.name).toBe('Nome Atualizado');
    expect(updated?.document).toBe('09748165000110');
  });

  it('should edit only provided address fields and keep the rest', async() => {
    // Arrange
    const carrier = await prisma.carrier.create({
      data: makeCarrierData({
        street: 'Av Paulista',
        number: '1000',
        city: 'São Paulo',
        state: 'SP',
      }),
    });

    // Act
    await sut.execute(carrier.id, {
      street: 'Rua Augusta',
      number: '500',
    });

    // Assert
    const updated = await prisma.carrier.findUnique({ where: { id: carrier.id } });
    expect(updated?.street).toBe('Rua Augusta');
    expect(updated?.number).toBe('500');
    expect(updated?.city).toBe('São Paulo');
    expect(updated?.state).toBe('SP');
    expect(updated?.name).toBe('Transportadora LTDA');
    expect(updated?.neighborhood).toBe('Bela Vista');
  });

  it('should throw InvalidDocumentError when document has invalid format', async() => {
    // Arrange
    const carrier = await prisma.carrier.create({
      data: makeCarrierData(),
    });

    // Act / Assert
    await expect(sut.execute(carrier.id, { document: '123' })).rejects.toThrow(InvalidDocumentError);
  });

  it('should change document to a new unused valid document', async() => {
    // Arrange
    const carrier = await prisma.carrier.create({
      data: makeCarrierData({ document: '09748165000110' }),
    });

    // Act
    const result = await sut.execute(carrier.id, { document: '33.000.167/0001-01' });

    // Assert
    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
    const updated = await prisma.carrier.findUnique({ where: { id: carrier.id } });
    expect(updated?.document).toBe('33000167000101');
  });

  it('should keep fields unchanged when body is empty', async() => {
    // Arrange
    const carrier = await prisma.carrier.create({
      data: makeCarrierData({
        name: 'Transportadora LTDA',
        street: 'Av Paulista',
        active: true,
      }),
    });

    // Act
    const result = await sut.execute(carrier.id, {});

    // Assert
    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
    const updated = await prisma.carrier.findUnique({ where: { id: carrier.id } });
    expect(updated?.name).toBe('Transportadora LTDA');
    expect(updated?.street).toBe('Av Paulista');
    expect(updated?.document).toBe('09748165000110');
    expect(updated?.active).toBe(true);
  });

  it('should preserve active flag when editing other fields', async() => {
    // Arrange
    const carrier = await prisma.carrier.create({
      data: makeCarrierData({ active: false }),
    });

    // Act
    await sut.execute(carrier.id, { name: 'Nome Novo' });

    // Assert
    const updated = await prisma.carrier.findUnique({ where: { id: carrier.id } });
    expect(updated?.name).toBe('Nome Novo');
    expect(updated?.active).toBe(false);
  });
});
