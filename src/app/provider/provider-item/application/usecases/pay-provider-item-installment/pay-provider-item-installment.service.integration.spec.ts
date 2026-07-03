import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderItemInstallmentStatus } from '../../../domain/enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from '../../../domain/enums/provider-item-schedule-type.enum';
import { ProviderItemInstallmentAlreadyPaidError } from '../../../domain/errors/provider-item-installment-already-paid.error';
import { ProviderItemInstallmentNotFoundError } from '../../../domain/errors/provider-item-installment-not-found.error';
import { ProviderItemNotFoundError } from '../../../domain/errors/provider-item-not-found.error';
import { ProviderItemModule } from '../../../provider-item.module';
import { CreateProviderItem } from '../create-provider-item/create-provider-item.service';
import { CreateProviderItemInputDto } from '../create-provider-item/dtos/create-provider-item.dto';
import { PayProviderItemInstallment } from './pay-provider-item-installment.service';

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

describe('PayProviderItemInstallment - Integration tests', () => {
  let sut: PayProviderItemInstallment;
  let createProviderItem: CreateProviderItem;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderItemModule],
    }).compile();

    sut = module.get(PayProviderItemInstallment);
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

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should mark installment as paid', async() => {
    // Arrange
    const bank = await prisma.bank.create({ data: baseBankData });
    const provider = await prisma.provider.create({ data: baseProviderData });

    const input: CreateProviderItemInputDto = {
      providerId: provider.id,
      description: 'Serviço',
      totalValueInCents: 30000,
      installmentsCount: 3,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: '2026-07-10',
      bankId: bank.id,
    };

    const created = await createProviderItem.execute(input);
    const installment = await prisma.providerItemInstallment.findFirst({
      where: { providerItemId: created.id, number: 1 },
    });

    // Act
    await sut.execute(created.id, installment!.id);

    // Assert
    const updated = await prisma.providerItemInstallment.findUnique({
      where: { id: installment!.id },
    });
    expect(updated?.status).toBe(ProviderItemInstallmentStatus.PAID);
  });

  it('should throw when installment is already paid', async() => {
    // Arrange
    const bank = await prisma.bank.create({ data: baseBankData });
    const provider = await prisma.provider.create({ data: baseProviderData });

    const created = await createProviderItem.execute({
      providerId: provider.id,
      description: 'Serviço',
      totalValueInCents: 10000,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: '2026-07-10',
      bankId: bank.id,
    });

    const installment = await prisma.providerItemInstallment.findFirst({
      where: { providerItemId: created.id },
    });

    await sut.execute(created.id, installment!.id);

    // Act & Assert
    await expect(sut.execute(created.id, installment!.id)).rejects.toThrow(ProviderItemInstallmentAlreadyPaidError);
  });

  it('should throw ProviderItemNotFoundError when item does not exist', async() => {
    await expect(sut.execute(99999, 1)).rejects.toThrow(ProviderItemNotFoundError);
  });

  it('should throw ProviderItemInstallmentNotFoundError when installment belongs to another item', async() => {
    // Arrange
    const bank = await prisma.bank.create({ data: baseBankData });
    const provider = await prisma.provider.create({ data: baseProviderData });

    const firstItem = await createProviderItem.execute({
      providerId: provider.id,
      description: 'Serviço A',
      totalValueInCents: 10000,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: '2026-07-10',
      bankId: bank.id,
    });

    const secondItem = await createProviderItem.execute({
      providerId: provider.id,
      description: 'Serviço B',
      totalValueInCents: 10000,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: '2026-07-10',
      bankId: bank.id,
    });

    const installmentFromSecondItem = await prisma.providerItemInstallment.findFirst({
      where: { providerItemId: secondItem.id },
    });

    // Act & Assert
    await expect(
      sut.execute(firstItem.id, installmentFromSecondItem!.id),
    ).rejects.toThrow(ProviderItemInstallmentNotFoundError);
  });
});
