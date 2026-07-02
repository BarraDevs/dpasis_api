import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { CreateHonorificInputDto } from 'src/app/global/honorific/application/usecases/create-honorific/dtos/create-honorific.dto';
import { EditHonorificInputDto } from 'src/app/global/honorific/application/usecases/edit-honorific/dtos/edit-honorific.dto';
import { FindAllHonorificQueryDto } from 'src/app/global/honorific/application/usecases/find-all-honorific/dtos/find-all-honorific.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { HonorificDaoAdapterPrisma } from './honorific-prisma.dao';

describe('HonorificDaoAdapterPrisma - Integration tests', () => {
  let sut: HonorificDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [HonorificDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(HonorificDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty when no rows', async() => {
      const [rows, total] = await sut.findAll({});

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should filter by search on name', async() => {
      await prisma.honorific.createMany({ data: [{ name: 'Sr.' }, { name: 'Dra.' }] });

      const [rows, total] = await sut.findAll({ search: 'dra' } as FindAllHonorificQueryDto);

      expect(total).toBe(1);
      expect(rows[0].name).toBe('Dra.');
    });

    it('should filter by active', async() => {
      await prisma.honorific.createMany({
        data: [
          { name: 'A', active: true },
          { name: 'B', active: false },
        ],
      });

      const [rows, total] = await sut.findAll({ active: false } as FindAllHonorificQueryDto);

      expect(total).toBe(1);
      expect(rows[0].name).toBe('B');
    });
  });

  describe('findByName', () => {
    it('should match case-insensitively', async() => {
      await prisma.honorific.create({ data: { name: 'Prof.' } });

      const found = await sut.findByName('prof.');

      expect(found).not.toBeNull();
      expect(found?.name).toBe('Prof.');
    });
  });

  describe('save / edit / delete / updateStatus', () => {
    it('should save and return id', async() => {
      const data: CreateHonorificInputDto = { name: 'Sr.' };

      const id = await sut.save(data);

      const row = await prisma.honorific.findUnique({ where: { id } });
      expect(row?.name).toBe('Sr.');
    });

    it('should edit partial fields', async() => {
      const { id } = await prisma.honorific.create({ data: { name: 'X' } });
      const data: EditHonorificInputDto = { name: 'Y' };

      await sut.edit(id, data);

      const row = await prisma.honorific.findUnique({ where: { id } });
      expect(row?.name).toBe('Y');
    });

    it('should delete', async() => {
      const { id } = await prisma.honorific.create({ data: { name: 'Z' } });

      await sut.delete(id);

      expect(await prisma.honorific.findUnique({ where: { id } })).toBeNull();
    });

    it('should updateStatus', async() => {
      const { id } = await prisma.honorific.create({ data: { name: 'W', active: true } });

      await sut.updateStatus(id, false);

      const row = await prisma.honorific.findUnique({ where: { id } });
      expect(row?.active).toBe(false);
    });
  });

  describe('findById', () => {
    it('should return HonorificDto or null', async() => {
      const created = await prisma.honorific.create({ data: { name: 'Q' } });

      const found = await sut.findById(created.id);

      expect(found).toMatchObject({
        id: created.id,
        name: 'Q',
      });

      expect(await sut.findById(999999)).toBeNull();
    });
  });

  describe('countClientsById', () => {
    it('should return zero when no client uses honorific', async() => {
      const honorific = await prisma.honorific.create({
        data: { name: `Cnt-${Date.now()}` },
      });

      const count = await sut.countClientsById(honorific.id);

      expect(count).toBe(0);
    });

    it('should return number of clients linked to honorific', async() => {
      const honorific = await prisma.honorific.create({
        data: { name: `Cnt2-${Date.now()}` },
      });
      const [group, resale] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `G-${Date.now()}`, active: true } }),
        prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      ]);

      await Promise.all([
        prisma.client.create({
          data: {
            id: 801,
            type: ClientType.PJ,
            document: '09748165000211',
            groupId: group.id,
            resaleId: resale.id,
            honorificId: honorific.id,
            companyName: 'A',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        }),
        prisma.client.create({
          data: {
            id: 802,
            type: ClientType.PJ,
            document: '09748165000222',
            groupId: group.id,
            resaleId: resale.id,
            honorificId: honorific.id,
            companyName: 'B',
            headquarters: 'SP',
            invoiceType: ClientInvoiceType.CONTRACT,
            generateInvoice: true,
            active: true,
          },
        }),
      ]);

      const count = await sut.countClientsById(honorific.id);

      expect(count).toBe(2);
    });
  });

  describe('countResalesById', () => {
    it('should return zero when no resale uses honorific', async() => {
      const honorific = await prisma.honorific.create({
        data: { name: `Rcnt-${Date.now()}` },
      });

      const count = await sut.countResalesById(honorific.id);

      expect(count).toBe(0);
    });

    it('should return number of resales linked to honorific', async() => {
      const honorific = await prisma.honorific.create({
        data: { name: `Rcnt2-${Date.now()}` },
      });

      await Promise.all([
        prisma.resale.create({
          data: {
            ...buildMinimalResaleData(nextResaleFixtureId()),
            honorificId: honorific.id,
          } as Prisma.ResaleUncheckedCreateInput,
        }),
        prisma.resale.create({
          data: {
            ...buildMinimalResaleData(nextResaleFixtureId()),
            honorificId: honorific.id,
          } as Prisma.ResaleUncheckedCreateInput,
        }),
      ]);

      const count = await sut.countResalesById(honorific.id);

      expect(count).toBe(2);
    });
  });
});
