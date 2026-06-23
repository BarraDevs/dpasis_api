import { Test } from '@nestjs/testing';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import { InvalidProviderTypeFieldsError } from '../../../domain/errors/invalid-provider-type-fields.error';
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

  function makeValidOneOffInput(overrides: Partial<CreateProviderInputDto> = {}): CreateProviderInputDto {
    return {
      name: 'Prestador LTDA',
      type: ProviderType.ONE_OFF,
      valueInCents: 150000,
      document: '09.748.165/0001-10',
      ie: null,
      deadline: 30,
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

  it('should create ONE_OFF provider and persist in database', async() => {
    const input = makeValidOneOffInput();

    const result = await sut.execute(input);

    expect(result.id).toBeGreaterThan(0);

    const saved = await prisma.provider.findFirst({
      where: { document: '09748165000110' },
    });
    expect(saved).not.toBeNull();
    expect(saved?.type).toBe(ProviderType.ONE_OFF);
    expect(saved?.deadline).toBe(30);
    expect(saved?.paymentDate).toBeNull();
    expect(saved?.active).toBe(true);
  });

  it('should create RECURRING provider with paymentDate', async() => {
    const input = makeValidOneOffInput({
      type: ProviderType.RECURRING,
      document: '33.000.167/0001-01',
      email: 'recorrente@prestador.com',
      paymentDate: 15,
      deadline: undefined,
    });

    const result = await sut.execute(input);

    const saved = await prisma.provider.findUnique({ where: { id: result.id } });
    expect(saved?.type).toBe(ProviderType.RECURRING);
    expect(saved?.paymentDate).toBe(15);
    expect(saved?.deadline).toBeNull();
  });

  it('should throw DocumentAlreadyTakenError when document already exists', async() => {
    const input = makeValidOneOffInput();
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(DocumentAlreadyTakenError);
  });

  it('should throw EmailAlreadyTakenError when email already exists', async() => {
    const input = makeValidOneOffInput();
    await sut.execute(input);

    const input2 = makeValidOneOffInput({
      document: '33.000.167/0001-01',
      email: 'contato@prestador.com',
    });

    await expect(sut.execute(input2)).rejects.toThrow(EmailAlreadyTakenError);
  });

  it('should throw when ONE_OFF without deadline', async() => {
    const input = makeValidOneOffInput({ deadline: undefined });

    await expect(sut.execute(input)).rejects.toThrow(InvalidProviderTypeFieldsError);
  });
});
