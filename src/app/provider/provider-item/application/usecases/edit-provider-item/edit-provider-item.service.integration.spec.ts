import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderItemInstallmentStatus } from '../../../domain/enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from '../../../domain/enums/provider-item-schedule-type.enum';
import { ProviderItemInstallmentsCountBelowPaidCountError } from '../../../domain/errors/provider-item-installments-count-below-paid-count.error';
import { ProviderItemNotFoundError } from '../../../domain/errors/provider-item-not-found.error';
import { ProviderItemModule } from '../../../provider-item.module';
import { CreateProviderItem } from '../create-provider-item/create-provider-item.service';
import { CreateProviderItemInputDto } from '../create-provider-item/dtos/create-provider-item.dto';
import { EditProviderItem } from './edit-provider-item.service';

const baseBankData = {
  drawer: 'Empresa XYZ',
  wallet: '123',
  account: '12345-6',
  agency: '0001',
  bankCode: '001',
  bankName: 'Banco do Brasil',
  paymentLocation: null,
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

describe('EditProviderItem - Integration tests', () => {
  let sut: EditProviderItem;
  let createProviderItem: CreateProviderItem;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderItemModule],
    }).compile();

    sut = module.get(EditProviderItem);
    createProviderItem = module.get(CreateProviderItem);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function createItem() {
    const bank = await prisma.bank.create({ data: baseBankData });
    const provider = await prisma.provider.create({ data: baseProviderData });

    const input: CreateProviderItemInputDto = {
      providerId: provider.id,
      description: 'Serviço',
      totalValueInCents: 40000,
      installmentsCount: 4,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: '2026-07-10',
      bankId: bank.id,
    };

    const created = await createProviderItem.execute(input);

    return { itemId: created.id };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should keep paid installments and recalculate pending ones', async() => {
    // Arrange
    const { itemId } = await createItem();
    const installments = await prisma.providerItemInstallment.findMany({
      where: { providerItemId: itemId },
      orderBy: { number: 'asc' },
    });

    await prisma.providerItemInstallment.update({
      where: { id: installments[0].id },
      data: { status: ProviderItemInstallmentStatus.PAID },
    });
    await prisma.providerItemInstallment.update({
      where: { id: installments[1].id },
      data: { status: ProviderItemInstallmentStatus.PAID },
    });

    const paidFirst = installments[0];
    const paidSecond = installments[1];

    // Act
    await sut.execute(itemId, { totalValueInCents: 50000 });

    // Assert
    const updated = await prisma.providerItemInstallment.findMany({
      where: { providerItemId: itemId },
      orderBy: { number: 'asc' },
    });

    expect(updated).toHaveLength(4);
    expect(updated[0].id).toBe(paidFirst.id);
    expect(updated[1].id).toBe(paidSecond.id);
    expect(updated[0].status).toBe(ProviderItemInstallmentStatus.PAID);
    expect(updated[1].status).toBe(ProviderItemInstallmentStatus.PAID);
    expect(updated[0].valueInCents).toBe(paidFirst.valueInCents);
    expect(updated[1].valueInCents).toBe(paidSecond.valueInCents);
    expect(updated.slice(2).every((item) => item.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
    expect(updated.reduce((sum, item) => sum + item.valueInCents, 0)).toBe(50000);
  });

  it('should throw ProviderItemNotFoundError when item does not exist', async() => {
    await expect(sut.execute(99999, { description: 'Teste' })).rejects.toThrow(ProviderItemNotFoundError);
  });

  it('should throw when installments count is below paid installments', async() => {
    // Arrange
    const { itemId } = await createItem();
    const installments = await prisma.providerItemInstallment.findMany({
      where: { providerItemId: itemId },
      orderBy: { number: 'asc' },
    });

    await prisma.providerItemInstallment.update({
      where: { id: installments[0].id },
      data: { status: ProviderItemInstallmentStatus.PAID },
    });
    await prisma.providerItemInstallment.update({
      where: { id: installments[1].id },
      data: { status: ProviderItemInstallmentStatus.PAID },
    });

    // Act & Assert
    await expect(sut.execute(itemId, { installmentsCount: 1 })).rejects.toThrow(
      ProviderItemInstallmentsCountBelowPaidCountError,
    );
  });
});
