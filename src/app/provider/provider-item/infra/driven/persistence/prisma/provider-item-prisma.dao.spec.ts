import { Test } from '@nestjs/testing';
import { ProviderItemDto } from 'src/app/provider/provider-item/application/dtos/provider-item.dto';
import { ProviderItemInstallmentStatus } from 'src/app/provider/provider-item/domain/enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from 'src/app/provider/provider-item/domain/enums/provider-item-schedule-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderItemDaoAdapterPrisma } from './provider-item-prisma.dao';

const baseBankData = {
  drawer: 'Empresa XYZ',
  wallet: '123',
  account: '12345-6',
  agency: '0001',
  bankCode: '001',
  bankName: 'Banco do Brasil',
  paymentLocation: null as string | null,
  active: true,
};

const baseProviderData = {
  name: 'Prestador LTDA',
  fantasyName: 'Prestador',
  document: '09748165000110',
  ie: null,
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

describe('ProviderItemDaoAdapterPrisma - Integration tests', () => {
  let sut: ProviderItemDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ProviderItemDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ProviderItemDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function seedDependencies() {
    const bank = await prisma.bank.create({ data: baseBankData });
    const provider = await prisma.provider.create({ data: baseProviderData });

    return { bank, provider };
  }

  async function createProviderItem(
    providerId: number,
    bankId: number,
    overrides: Record<string, unknown> = {},
  ) {
    const item = await prisma.providerItem.create({
      data: {
        providerId,
        description: 'Serviço de manutenção',
        totalValueInCents: 30000,
        installmentsCount: 3,
        scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
        intervalDays: 30,
        dueDay: null,
        firstDueDate: new Date('2026-07-10'),
        bankId,
        active: true,
        ...overrides,
      },
    });

    await prisma.providerItemInstallment.createMany({
      data: [
        {
          providerItemId: item.id,
          number: 1,
          valueInCents: 10000,
          dueDate: new Date('2026-07-10'),
          status: ProviderItemInstallmentStatus.PENDING,
        },
        {
          providerItemId: item.id,
          number: 2,
          valueInCents: 10000,
          dueDate: new Date('2026-08-10'),
          status: ProviderItemInstallmentStatus.PENDING,
        },
        {
          providerItemId: item.id,
          number: 3,
          valueInCents: 10000,
          dueDate: new Date('2026-09-10'),
          status: ProviderItemInstallmentStatus.PENDING,
        },
      ],
    });

    return item;
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    it('should return empty array when no items exist for provider', async() => {
      // Arrange
      const { provider } = await seedDependencies();

      // Act
      const [items, total] = await sut.findAll({ providerId: provider.id });

      // Assert
      expect(items).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return provider items with bank and installments in correct format', async() => {
      // Arrange
      const { bank, provider } = await seedDependencies();
      const created = await createProviderItem(provider.id, bank.id);

      // Act
      const [items, total] = await sut.findAll({ providerId: provider.id });

      // Assert
      expect(total).toBe(1);
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject<Partial<ProviderItemDto>>({
        id: created.id,
        providerId: provider.id,
        description: 'Serviço de manutenção',
        totalValueInCents: 30000,
        installmentsCount: 3,
        scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
        active: true,
      });
      expect(items[0].bank.id).toBe(bank.id);
      expect(items[0].bank.bankName).toBe('Banco do Brasil');
      expect(items[0].installments).toHaveLength(3);
      expect(items[0].installments[0].number).toBe(1);
      expect(items[0].installments[2].number).toBe(3);
    });

    it('should filter items by providerId', async() => {
      // Arrange
      const { bank, provider } = await seedDependencies();
      const otherProvider = await prisma.provider.create({
        data: {
          ...baseProviderData,
          document: '33000167000101',
          email: 'outro@prestador.com',
        },
      });

      await createProviderItem(provider.id, bank.id);
      await createProviderItem(otherProvider.id, bank.id, {
        description: 'Item de outro prestador',
      });

      // Act
      const [items, total] = await sut.findAll({ providerId: provider.id });

      // Assert
      expect(total).toBe(1);
      expect(items).toHaveLength(1);
      expect(items[0].providerId).toBe(provider.id);
    });

    it('should filter by active when provided', async() => {
      // Arrange
      const { bank, provider } = await seedDependencies();
      await createProviderItem(provider.id, bank.id, { active: true });
      await createProviderItem(provider.id, bank.id, {
        description: 'Item inativo',
        active: false,
      });

      // Act
      const [activeItems, activeTotal] = await sut.findAll({ providerId: provider.id, active: true });
      const [inactiveItems, inactiveTotal] = await sut.findAll({ providerId: provider.id, active: false });

      // Assert
      expect(activeTotal).toBe(1);
      expect(activeItems[0].active).toBe(true);
      expect(inactiveTotal).toBe(1);
      expect(inactiveItems[0].active).toBe(false);
    });

    it('should search by description case-insensitively', async() => {
      // Arrange
      const { bank, provider } = await seedDependencies();
      await createProviderItem(provider.id, bank.id, {
        description: 'Manutenção Preventiva',
      });
      await createProviderItem(provider.id, bank.id, {
        description: 'Outro serviço',
      });

      // Act
      const [items, total] = await sut.findAll({
        providerId: provider.id,
        search: 'manutenção',
      });

      // Assert
      expect(total).toBe(1);
      expect(items[0].description).toBe('Manutenção Preventiva');
    });

    it('should trim search before filtering', async() => {
      // Arrange
      const { bank, provider } = await seedDependencies();
      await createProviderItem(provider.id, bank.id, {
        description: 'Consultoria técnica',
      });

      // Act
      const [items, total] = await sut.findAll({
        providerId: provider.id,
        search: '  consultoria  ',
      });

      // Assert
      expect(total).toBe(1);
      expect(items[0].description).toBe('Consultoria técnica');
    });

    it('should paginate results when page and size are provided', async() => {
      // Arrange
      const { bank, provider } = await seedDependencies();
      await createProviderItem(provider.id, bank.id, { description: 'Item 1' });
      await createProviderItem(provider.id, bank.id, { description: 'Item 2' });
      await createProviderItem(provider.id, bank.id, { description: 'Item 3' });

      // Act
      const [page1, total] = await sut.findAll({ providerId: provider.id, page: 1, size: 2 });
      const [page2] = await sut.findAll({ providerId: provider.id, page: 2, size: 2 });

      // Assert
      expect(total).toBe(3);
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
    });

    it('should order results by id descending', async() => {
      // Arrange
      const { bank, provider } = await seedDependencies();
      const first = await createProviderItem(provider.id, bank.id, { description: 'Primeiro' });
      const second = await createProviderItem(provider.id, bank.id, { description: 'Segundo' });

      // Act
      const [items] = await sut.findAll({ providerId: provider.id });

      // Assert
      expect(items[0].id).toBe(second.id);
      expect(items[1].id).toBe(first.id);
    });
  });

  describe('findById', () => {
    it('should return null when provider item does not exist', async() => {
      // Act
      const result = await sut.findById(99999);

      // Assert
      expect(result).toBeNull();
    });

    it('should return provider item with bank and installments ordered by number', async() => {
      // Arrange
      const { bank, provider } = await seedDependencies();
      const created = await createProviderItem(provider.id, bank.id);

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.bank.id).toBe(bank.id);
      expect(result?.installments).toHaveLength(3);
      expect(result?.installments.map((item) => item.number)).toEqual([1, 2, 3]);
      expect(result?.installments.every((item) => item.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
    });
  });
});
