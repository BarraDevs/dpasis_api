import { Test } from '@nestjs/testing';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { ProviderNotFoundError } from 'src/app/provider/domain/errors/provider-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderModule } from '../../../provider.module';
import { DeactivateProvider } from './deactivate-provider.service';

describe('DeactivateProvider - Integration tests', () => {
  let sut: DeactivateProvider;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderModule],
    }).compile();

    sut = module.get(DeactivateProvider);
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

  it('should deactivate provider in database', async() => {
    const provider = await prisma.provider.create({
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

    await sut.execute(provider.id);

    const updated = await prisma.provider.findUnique({ where: { id: provider.id } });
    expect(updated?.active).toBe(false);
  });

  it('should return success message', async() => {
    const provider = await prisma.provider.create({
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

    const result = await sut.execute(provider.id);

    expect(result).toEqual({ message: 'Prestador desativado com sucesso' });
  });
});
