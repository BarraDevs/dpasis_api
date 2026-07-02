import { Test } from '@nestjs/testing';
import { ProviderFactory } from 'src/app/provider/domain/factories/provider.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderRepositoryAdapterPrisma } from './provider-prisma.repository';

describe('ProviderRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ProviderRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ProviderRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ProviderRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  function makeCreateProps() {
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
    };
  }

  describe('save', () => {
    it('should persist provider and return created id', async() => {
      const entity = ProviderFactory.create(makeCreateProps());

      const id = await sut.save(entity);

      expect(id).toBeGreaterThan(0);

      const saved = await prisma.provider.findFirst({
        where: { document: '09748165000110' },
      });

      expect(saved).not.toBeNull();
      expect(saved?.id).toBe(id);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update provider in database', async() => {
      const entity = ProviderFactory.create(makeCreateProps());
      const id = await sut.save(entity);

      const entityToEdit = ProviderFactory.edit({
        ...entity.props,
        id,
        name: 'Nome Atualizado',
      });

      await sut.edit(entityToEdit);

      const updated = await prisma.provider.findUnique({ where: { id } });
      expect(updated?.name).toBe('Nome Atualizado');
    });
  });

  describe('findById', () => {
    it('should return null when provider does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return provider entity when found', async() => {
      const entity = ProviderFactory.create(makeCreateProps());
      const id = await sut.save(entity);

      const found = await sut.findById(id);

      expect(found).not.toBeNull();
      expect(found?.props.id).toBe(id);
      expect(found?.props.name).toBe('Prestador LTDA');
    });
  });

  describe('delete', () => {
    it('should remove provider from database', async() => {
      const entity = ProviderFactory.create(makeCreateProps());
      const id = await sut.save(entity);

      await sut.delete(id);

      const deleted = await prisma.provider.findUnique({ where: { id } });
      expect(deleted).toBeNull();
    });
  });
});
