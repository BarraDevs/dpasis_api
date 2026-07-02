import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import { InvalidDocumentError } from 'src/shared/value-objects/document/document.error';
import { ProviderModule } from '../../../provider.module';
import { CreateProvider } from './create-provider.service';
import { CreateProviderInputDto } from './dtos/create-provider.dto';

describe('CreateProvider - Integration tests', () => {
  let sut: CreateProvider;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderModule],
    }).compile();

    sut = module.get(CreateProvider);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  function makeValidInput(overrides: Partial<CreateProviderInputDto> = {}): CreateProviderInputDto {
    return {
      name: 'Prestador LTDA',
      document: '09.748.165/0001-10',
      ie: null,
      fantasyName: 'Prestador',
      email: 'contato@prestador.com',
      website: 'https://prestador.com',
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

  it('should create provider and persist in database', async() => {
    const input = makeValidInput();

    const result = await sut.execute(input);

    expect(result.id).toBeGreaterThan(0);

    const saved = await prisma.provider.findFirst({
      where: { document: '09748165000110' },
    });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe('Prestador LTDA');
    expect(saved?.fantasyName).toBe('Prestador');
    expect(saved?.document).toBe('09748165000110');
    expect(saved?.active).toBe(true);
    expect(saved?.email).toBe('contato@prestador.com');
  });

  it('should create provider with optional fields filled', async() => {
    const input = makeValidInput({
      ie: '123456789',
      complement: 'Sala 1',
    });

    const result = await sut.execute(input);

    expect(result).toHaveProperty('id');

    const saved = await prisma.provider.findFirst({
      where: { document: '09748165000110' },
    });
    expect(saved?.ie).toBe('123456789');
    expect(saved?.complement).toBe('Sala 1');
  });

  it('should throw DocumentAlreadyTakenError when document already exists', async() => {
    const input = makeValidInput();
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(DocumentAlreadyTakenError);
  });

  it('should throw EmailAlreadyTakenError when email already exists', async() => {
    const input = makeValidInput();
    await sut.execute(input);

    const input2 = makeValidInput({
      document: '33.000.167/0001-01',
      email: 'contato@prestador.com',
    });

    await expect(sut.execute(input2)).rejects.toThrow(EmailAlreadyTakenError);
  });

  it('should throw when document has invalid format', async() => {
    const input = makeValidInput({ document: '123' });

    await expect(sut.execute(input)).rejects.toThrow(InvalidDocumentError);
  });
});
