import { Test } from '@nestjs/testing';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderModule } from '../../../provider.module';
import { FindAllProvider } from './find-all-provider.service';

describe('FindAllProvider - Integration tests', () => {
  let sut: FindAllProvider;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderModule],
    }).compile();

    sut = module.get(FindAllProvider);
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

  it('should return empty pagination when no providers exist', async() => {
    const result = await sut.execute({});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return providers with pagination', async() => {
    await prisma.provider.create({
      data: {
        name: 'Prestador LTDA',
        type: ProviderType.ONE_OFF,
        valueInCents: 150000,
        document: '09748165000110',
        ie: null,
        paymentDate: null,
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
        active: true,
      },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].name).toBe('Prestador LTDA');
  });
});
