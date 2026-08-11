import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { InvalidDocumentError } from 'src/shared/value-objects/document/document.error';
import { CarrierModule } from '../../../carrier.module';
import { CreateCarrier } from './create-carrier.service';
import { CreateCarrierInputDto } from './dtos/create-carrier.dto';

describe('CreateCarrier - Integration tests', () => {
  let sut: CreateCarrier;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CarrierModule],
    }).compile();

    sut = module.get(CreateCarrier);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  function makeValidInput(overrides: Partial<CreateCarrierInputDto> = {}): CreateCarrierInputDto {
    return {
      name: 'Transportadora LTDA',
      fantasyName: 'Transportadora',
      representative: 'João Silva',
      document: '09.748.165/0001-10',
      contact: 'João Silva - (11) 99999-9999',
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

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('success path', () => {
    it('should create carrier and persist in database', async() => {
      const input = makeValidInput();

      const result = await sut.execute(input);

      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('number');
      expect(result.id).toBeGreaterThan(0);

      const saved = await prisma.carrier.findFirst({
        where: { document: '09748165000110' },
      });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('Transportadora LTDA');
      expect(saved?.fantasyName).toBe('Transportadora');
      expect(saved?.document).toBe('09748165000110');
      expect(saved?.active).toBe(true);
      expect(saved?.representative).toBe('João Silva');
      expect(saved?.contact).toBe('João Silva - (11) 99999-9999');
      expect(saved?.zipCode).toBe('01310100');
      expect(saved?.street).toBe('Av Paulista');
      expect(saved?.number).toBe('1000');
      expect(saved?.complement).toBeNull();
      expect(saved?.neighborhood).toBe('Bela Vista');
      expect(saved?.city).toBe('São Paulo');
      expect(saved?.state).toBe('SP');
    });

    it('should create carrier with complement filled', async() => {
      const input = makeValidInput({ complement: 'Sala 1' });

      const result = await sut.execute(input);

      const saved = await prisma.carrier.findUnique({ where: { id: result.id } });
      expect(saved?.complement).toBe('Sala 1');
    });
  });

  describe('document already taken', () => {
    it('should throw DocumentAlreadyTakenError when document already exists', async() => {
      const input = makeValidInput();

      await sut.execute(input);

      await expect(sut.execute(input)).rejects.toThrow(DocumentAlreadyTakenError);
      await expect(sut.execute(input)).rejects.toThrow('O documento 09748165000110 já está em uso.');
    });
  });

  describe('validation (factory)', () => {
    it('should throw when document has invalid format', async() => {
      const input = makeValidInput({ document: '123' });

      await expect(sut.execute(input)).rejects.toThrow(InvalidDocumentError);
    });

    it('should throw when name is empty', async() => {
      const input = makeValidInput({ name: '' });

      await expect(sut.execute(input)).rejects.toThrow('O campo name não pode ser vazio');
    });
  });
});
