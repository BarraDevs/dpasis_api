import { Test } from '@nestjs/testing';
import { ProviderNotFoundError } from 'src/app/provider/domain/errors/provider-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderModule } from '../../../provider.module';
import { ActivateProvider } from './activate-provider.service';

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
  active: false,
};

describe('ActivateProvider - Integration tests', () => {
  let sut: ActivateProvider;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderModule],
    }).compile();

    sut = module.get(ActivateProvider);
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

  it('should activate provider in database', async() => {
    const provider = await prisma.provider.create({ data: providerPrismaData });

    await sut.execute(provider.id);

    const updated = await prisma.provider.findUnique({ where: { id: provider.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const provider = await prisma.provider.create({ data: providerPrismaData });

    const result = await sut.execute(provider.id);

    expect(result).toEqual({ message: 'Prestador ativado com sucesso' });
  });
});
