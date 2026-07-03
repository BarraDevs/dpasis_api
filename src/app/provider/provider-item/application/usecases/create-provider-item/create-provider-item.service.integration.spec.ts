import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderItemInstallmentStatus } from '../../../domain/enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from '../../../domain/enums/provider-item-schedule-type.enum';
import { ProviderItemModule } from '../../../provider-item.module';
import { CreateProviderItem } from './create-provider-item.service';
import { CreateProviderItemInputDto } from './dtos/create-provider-item.dto';

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

describe('CreateProviderItem - Integration tests', () => {
  let sut: CreateProviderItem;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderItemModule],
    }).compile();

    sut = module.get(CreateProviderItem);
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

  function makeValidInput(
    providerId: number,
    bankId: number,
    overrides: Partial<CreateProviderItemInputDto> = {},
  ): CreateProviderItemInputDto {
    return {
      providerId,
      description: 'Serviço de manutenção',
      totalValueInCents: 30000,
      installmentsCount: 3,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: '2026-07-10',
      bankId,
      ...overrides,
    };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should create provider item with pending installments', async() => {
    // Arrange
    const { bank, provider } = await seedDependencies();
    const input = makeValidInput(provider.id, bank.id);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeGreaterThan(0);

    const installments = await prisma.providerItemInstallment.findMany({
      where: { providerItemId: result.id },
      orderBy: { number: 'asc' },
    });

    expect(installments).toHaveLength(3);
    expect(installments.every((item) => item.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
    expect(installments.reduce((sum, item) => sum + item.valueInCents, 0)).toBe(30000);
  });

  it('should create provider item with DUE_DAY schedule', async() => {
    // Arrange
    const { bank, provider } = await seedDependencies();
    const input = makeValidInput(provider.id, bank.id, {
      scheduleType: ProviderItemScheduleType.DUE_DAY,
      intervalDays: null,
      dueDay: 10,
      installmentsCount: 3,
    });

    // Act
    const result = await sut.execute(input);

    // Assert
    const item = await prisma.providerItem.findUnique({ where: { id: result.id } });
    expect(item?.scheduleType).toBe(ProviderItemScheduleType.DUE_DAY);
    expect(item?.dueDay).toBe(10);

    const installments = await prisma.providerItemInstallment.findMany({
      where: { providerItemId: result.id },
    });
    expect(installments).toHaveLength(3);
    expect(installments.every((installment) => installment.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
  });
});
