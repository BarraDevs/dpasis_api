import { Test } from '@nestjs/testing';
import { ProviderNotFoundError } from 'src/app/provider/domain/errors/provider-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderModule } from '../../../provider.module';
import { FindProviderById } from './find-provider-by-id.service';

const providerPrismaData = {
  name: 'Prestador LTDA',
  document: '09748165000110',
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
  active: true,
};

describe('FindProviderById - Integration tests', () => {
  let sut: FindProviderById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderModule],
    }).compile();

    sut = module.get(FindProviderById);
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

  it('should throw ProviderNotFoundError when provider does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ProviderNotFoundError);
  });

  it('should return provider when found', async() => {
    const created = await prisma.provider.create({ data: providerPrismaData });

    const result = await sut.execute(created.id);

    expect(result.id).toBe(created.id);
    expect(result.name).toBe('Prestador LTDA');
    expect(result.document).toBe('09748165000110');
  });
});
