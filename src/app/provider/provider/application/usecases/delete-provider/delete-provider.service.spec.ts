import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Provider } from 'src/app/provider/provider/domain/entities/provider.entity';
import { ProviderNotFoundError } from 'src/app/provider/provider/domain/errors/provider-not-found.error';
import { ProviderFactory } from 'src/app/provider/provider/domain/factories/provider.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderModule } from '../../../provider.module';
import type { IProviderRepository } from '../../persistence/repository/provider-repository.interface';
import { CreateProvider } from '../create-provider/create-provider.service';
import { DeleteProvider } from './delete-provider.service';

describe('DeleteProvider - Unit tests', () => {
  let sut: DeleteProvider;
  let providerRepository: IProviderRepository;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteProvider,
        {
          provide: TOKENS.ProviderRepository,
          useValue: createMock<IProviderRepository>(),
        },
      ],
    }).compile();

    sut = module.get(DeleteProvider);
    providerRepository = module.get(TOKENS.ProviderRepository);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ProviderNotFoundError when provider does not exist', async() => {
    jest.spyOn(providerRepository, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1)).rejects.toThrow(ProviderNotFoundError);
  });

  it('should call repository.delete with correct id', async() => {
    const provider = ProviderFactory.create({
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
    });
    jest.spyOn(providerRepository, 'findById').mockResolvedValue(provider);
    const deleteSpy = jest.spyOn(providerRepository, 'delete');

    await sut.execute(1);

    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it('should return success message', async() => {
    jest.spyOn(providerRepository, 'findById').mockResolvedValue(createMock<Provider>());

    const result = await sut.execute(1);

    expect(result).toEqual<SuccessMessage>({ message: 'Prestador excluído com sucesso' });
  });

  it('should not call delete when provider does not exist', async() => {
    jest.spyOn(providerRepository, 'findById').mockResolvedValue(null);
    const deleteSpy = jest.spyOn(providerRepository, 'delete');

    await expect(sut.execute(1)).rejects.toThrow(ProviderNotFoundError);
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});

describe('DeleteProvider - Integration tests', () => {
  let sut: DeleteProvider;
  let createProvider: CreateProvider;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderModule],
    }).compile();

    sut = module.get(DeleteProvider);
    createProvider = module.get(CreateProvider);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should delete provider from database', async() => {
    const { id } = await createProvider.execute({
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
    });

    await sut.execute(id);

    const deleted = await prisma.provider.findUnique({ where: { id } });
    expect(deleted).toBeNull();
  });
});
