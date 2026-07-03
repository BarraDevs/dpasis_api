import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderItemScheduleType } from '../../../domain/enums/provider-item-schedule-type.enum';
import { ProviderItemModule } from '../../../provider-item.module';
import { CreateProviderItem } from '../create-provider-item/create-provider-item.service';
import { CreateProviderItemInputDto } from '../create-provider-item/dtos/create-provider-item.dto';
import { DeactivateProviderItem } from '../deactivate-provider-item/deactivate-provider-item.service';
import { FindAllProviderItem } from './find-all-provider-item.service';

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

describe('FindAllProviderItem - Integration tests', () => {
  let sut: FindAllProviderItem;
  let createProviderItem: CreateProviderItem;
  let deactivateProviderItem: DeactivateProviderItem;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderItemModule],
    }).compile();

    sut = module.get(FindAllProviderItem);
    createProviderItem = module.get(CreateProviderItem);
    deactivateProviderItem = module.get(DeactivateProviderItem);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  async function seedProvider() {
    const bank = await prisma.bank.create({ data: baseBankData });
    const provider = await prisma.provider.create({ data: baseProviderData });

    return { bank, provider };
  }

  function makeInput(providerId: number, bankId: number): CreateProviderItemInputDto {
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
    };
  }

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty pagination when no items exist for provider', async() => {
    // Arrange
    const { provider } = await seedProvider();

    // Act
    const result = await sut.execute({ providerId: provider.id });

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return items for provider with pagination', async() => {
    // Arrange
    const { bank, provider } = await seedProvider();
    await createProviderItem.execute(makeInput(provider.id, bank.id));

    // Act
    const result = await sut.execute({ providerId: provider.id, page: 1, size: 10 });

    // Assert
    expect(result.data).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.data[0].description).toBe('Serviço de manutenção');
  });

  it('should filter by active status', async() => {
    // Arrange
    const { bank, provider } = await seedProvider();
    const activeItem = await createProviderItem.execute(makeInput(provider.id, bank.id));
    const inactiveItem = await createProviderItem.execute({
      ...makeInput(provider.id, bank.id),
      description: 'Serviço inativo',
    });
    await deactivateProviderItem.execute(inactiveItem.id);

    // Act
    const activeResult = await sut.execute({ providerId: provider.id, active: true });
    const inactiveResult = await sut.execute({ providerId: provider.id, active: false });

    // Assert
    expect(activeResult.data).toHaveLength(1);
    expect(activeResult.data[0].id).toBe(activeItem.id);
    expect(inactiveResult.data).toHaveLength(1);
    expect(inactiveResult.data[0].id).toBe(inactiveItem.id);
  });
});
