import { Test } from '@nestjs/testing';
import { CarrierFactory } from 'src/app/carrier/domain/factories/carrier.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CarrierRepositoryAdapterPrisma } from './carrier-prisma.repository';

describe('CarrierRepositoryAdapterPrisma - Integration tests', () => {
  let sut: CarrierRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [CarrierRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(CarrierRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('save', () => {
    it('should persist carrier and return created id', async() => {
      const entity = CarrierFactory.create({
        name: 'Transportadora LTDA',
        fantasyName: 'Transportadora',
        representative: 'João Silva',
        document: '09.748.165/0001-10',
        contact: 'João Silva - (11) 99999-9999',
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '1000',
        complement: 'Sala 1',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
      });

      const id = await sut.save(entity);

      expect(id).toBeGreaterThan(0);

      const saved = await prisma.carrier.findFirst({
        where: { document: '09748165000110' },
      });

      expect(saved?.name).toBe('Transportadora LTDA');
      expect(saved?.active).toBe(true);
      expect(saved?.complement).toBe('Sala 1');
    });
  });

  describe('edit', () => {
    it('should update carrier in database', async() => {
      const id = await sut.save(CarrierFactory.create({
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
      }));

      const entity = await sut.findById(id);
      entity!.deactivate();
      await sut.edit(entity!);

      const updated = await prisma.carrier.findUnique({ where: { id } });
      expect(updated?.active).toBe(false);
    });
  });

  describe('findById', () => {
    it('should return null when carrier does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should rehydrate carrier entity', async() => {
      const created = await prisma.carrier.create({
        data: {
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
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.props.id).toBe(created.id);
      expect(result?.props.name).toBe('Transportadora LTDA');
    });
  });
});
