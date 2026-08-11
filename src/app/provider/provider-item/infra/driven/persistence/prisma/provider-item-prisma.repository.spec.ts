import { Test } from '@nestjs/testing';
import { ProviderItemInstallmentStatus } from 'src/app/provider/provider-item/domain/enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from 'src/app/provider/provider-item/domain/enums/provider-item-schedule-type.enum';
import { ProviderItemFactory } from 'src/app/provider/provider-item/domain/factories/provider-item.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderItemRepositoryAdapterPrisma } from './provider-item-prisma.repository';

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

function makeValidCreateProps(providerId: number, bankId: number) {
  return {
    providerId,
    description: 'Serviço de manutenção',
    totalValueInCents: 30000,
    installmentsCount: 3,
    scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
    intervalDays: 30,
    dueDay: null,
    firstDueDate: new Date('2026-07-10'),
    bankId,
  };
}

describe('ProviderItemRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ProviderItemRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let providerId: number;
  let bankId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ProviderItemRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ProviderItemRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const bank = await prisma.bank.create({ data: baseBankData });
    const provider = await prisma.provider.create({ data: baseProviderData });

    bankId = bank.id;
    providerId = provider.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('save', () => {
    it('should persist provider item with installments and return id', async() => {
      // Arrange
      const entity = ProviderItemFactory.create(makeValidCreateProps(providerId, bankId));

      // Act
      const id = await sut.save(entity);

      // Assert
      expect(id).toBeGreaterThan(0);

      const saved = await prisma.providerItem.findUnique({
        where: { id },
        include: { installments: { orderBy: { number: 'asc' } } },
      });

      expect(saved).not.toBeNull();
      expect(saved?.description).toBe('Serviço de manutenção');
      expect(saved?.totalValueInCents).toBe(30000);
      expect(saved?.installments).toHaveLength(3);
      expect(saved?.installments.every((item) => item.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
      expect(saved?.installments.reduce((sum, item) => sum + item.valueInCents, 0)).toBe(30000);
    });
  });

  describe('findById', () => {
    it('should return null when provider item does not exist', async() => {
      // Act
      const result = await sut.findById(99999);

      // Assert
      expect(result).toBeNull();
    });

    it('should return ProviderItem entity with installments ordered by number', async() => {
      // Arrange
      const entity = ProviderItemFactory.create(makeValidCreateProps(providerId, bankId));
      const id = await sut.save(entity);

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.props.id).toBe(id);
      expect(result?.props.providerId).toBe(providerId);
      expect(result?.props.installments).toHaveLength(3);
      expect(result?.props.installments.map((item) => item.number)).toEqual([1, 2, 3]);
    });
  });

  describe('edit', () => {
    it('should update provider item fields', async() => {
      // Arrange
      const id = await sut.save(ProviderItemFactory.create(makeValidCreateProps(providerId, bankId)));
      const existing = await sut.findById(id);
      const updated = ProviderItemFactory.edit({
        ...existing!.props,
        id: existing!.props.id!,
        description: 'Descrição atualizada',
        totalValueInCents: 45000,
      });

      // Act
      await sut.edit(updated);

      // Assert
      const saved = await prisma.providerItem.findUnique({ where: { id } });
      expect(saved?.description).toBe('Descrição atualizada');
      expect(saved?.totalValueInCents).toBe(45000);
    });

    it('should keep paid installments and recreate pending ones', async() => {
      // Arrange
      const id = await sut.save(ProviderItemFactory.create(makeValidCreateProps(providerId, bankId)));
      const installments = await prisma.providerItemInstallment.findMany({
        where: { providerItemId: id },
        orderBy: { number: 'asc' },
      });

      await prisma.providerItemInstallment.update({
        where: { id: installments[0].id },
        data: { status: ProviderItemInstallmentStatus.PAID },
      });

      const existing = await sut.findById(id);
      const paidInstallments = existing!.props.installments.filter(
        (item) => item.status === ProviderItemInstallmentStatus.PAID,
      );
      const updated = ProviderItemFactory.edit({
        ...existing!.props,
        id: existing!.props.id!,
        totalValueInCents: 40000,
        paidInstallments,
      });

      // Act
      await sut.edit(updated);

      // Assert
      const updatedInstallments = await prisma.providerItemInstallment.findMany({
        where: { providerItemId: id },
        orderBy: { number: 'asc' },
      });

      expect(updatedInstallments).toHaveLength(3);
      expect(updatedInstallments[0].id).toBe(installments[0].id);
      expect(updatedInstallments[0].status).toBe(ProviderItemInstallmentStatus.PAID);
      expect(updatedInstallments.slice(1).every((item) => item.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
      expect(updatedInstallments.reduce((sum, item) => sum + item.valueInCents, 0)).toBe(40000);
    });

    it('should keep paid middle installment and recreate pending ones in original slots', async() => {
      // Arrange
      const id = await sut.save(ProviderItemFactory.create(makeValidCreateProps(providerId, bankId)));
      const installments = await prisma.providerItemInstallment.findMany({
        where: { providerItemId: id },
        orderBy: { number: 'asc' },
      });

      await prisma.providerItemInstallment.update({
        where: { id: installments[1].id },
        data: { status: ProviderItemInstallmentStatus.PAID },
      });

      const existing = await sut.findById(id);
      const paidInstallments = existing!.props.installments.filter(
        (item) => item.status === ProviderItemInstallmentStatus.PAID,
      );
      const updated = ProviderItemFactory.edit({
        ...existing!.props,
        id: existing!.props.id!,
        totalValueInCents: 40000,
        paidInstallments,
      });

      // Act
      await sut.edit(updated);

      // Assert
      const updatedInstallments = await prisma.providerItemInstallment.findMany({
        where: { providerItemId: id },
        orderBy: { number: 'asc' },
      });

      expect(updatedInstallments).toHaveLength(3);
      expect(updatedInstallments[1].id).toBe(installments[1].id);
      expect(updatedInstallments[1].number).toBe(2);
      expect(updatedInstallments[1].status).toBe(ProviderItemInstallmentStatus.PAID);
      expect(updatedInstallments[0].status).toBe(ProviderItemInstallmentStatus.PENDING);
      expect(updatedInstallments[0].number).toBe(1);
      expect(updatedInstallments[2].status).toBe(ProviderItemInstallmentStatus.PENDING);
      expect(updatedInstallments[2].number).toBe(3);
      expect(updatedInstallments.reduce((sum, item) => sum + item.valueInCents, 0)).toBe(40000);
    });
  });

  describe('updateStatus', () => {
    it('should update active flag without touching installments', async() => {
      // Arrange
      const id = await sut.save(ProviderItemFactory.create(makeValidCreateProps(providerId, bankId)));
      const installmentsBefore = await prisma.providerItemInstallment.findMany({
        where: { providerItemId: id },
        orderBy: { number: 'asc' },
      });

      // Act
      await sut.updateStatus(id, false);

      // Assert
      const saved = await prisma.providerItem.findUnique({ where: { id } });
      expect(saved?.active).toBe(false);

      const installmentsAfter = await prisma.providerItemInstallment.findMany({
        where: { providerItemId: id },
        orderBy: { number: 'asc' },
      });
      expect(installmentsAfter).toEqual(installmentsBefore);
    });
  });

  describe('edit - pay installment via entity', () => {
    it('should persist installment paid status from entity without dropping other installments', async() => {
      // Arrange
      const id = await sut.save(ProviderItemFactory.create(makeValidCreateProps(providerId, bankId)));
      const item = await sut.findById(id);
      const installmentId = item!.props.installments[0].id!;
      item!.payInstallment(installmentId);

      // Act
      await sut.edit(item!);

      // Assert
      const updatedInstallments = await prisma.providerItemInstallment.findMany({
        where: { providerItemId: id },
        orderBy: { number: 'asc' },
      });

      expect(updatedInstallments).toHaveLength(3);
      expect(updatedInstallments[0].id).toBe(installmentId);
      expect(updatedInstallments[0].status).toBe(ProviderItemInstallmentStatus.PAID);
      expect(updatedInstallments.slice(1).every((row) => row.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete provider item and installments', async() => {
      // Arrange
      const id = await sut.save(ProviderItemFactory.create(makeValidCreateProps(providerId, bankId)));

      // Act
      await sut.delete(id);

      // Assert
      const deleted = await prisma.providerItem.findUnique({ where: { id } });
      const installments = await prisma.providerItemInstallment.findMany({
        where: { providerItemId: id },
      });

      expect(deleted).toBeNull();
      expect(installments).toHaveLength(0);
    });

    it('should throw when deleting non-existent id', async() => {
      // Act & Assert
      await expect(sut.delete(99999)).rejects.toThrow();
    });
  });
});
