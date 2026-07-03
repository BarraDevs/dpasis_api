import { Test } from '@nestjs/testing';
import { ProviderItemInstallmentStatus } from 'src/app/provider/provider-item/domain/enums/provider-item-installment-status.enum';
import { ProviderItemNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderItemScheduleType } from '../../../domain/enums/provider-item-schedule-type.enum';
import { ProviderItemModule } from '../../../provider-item.module';
import { CreateProviderItem } from '../create-provider-item/create-provider-item.service';
import { CreateProviderItemInputDto } from '../create-provider-item/dtos/create-provider-item.dto';
import { FindProviderItemById } from './find-provider-item-by-id.service';

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

describe('FindProviderItemById - Integration tests', () => {
  let sut: FindProviderItemById;
  let createProviderItem: CreateProviderItem;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderItemModule],
    }).compile();

    sut = module.get(FindProviderItemById);
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

  it('should throw ProviderItemNotFoundError when item does not exist', async() => {
    // Act & Assert
    await expect(sut.execute(99999)).rejects.toThrow(ProviderItemNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('Item do prestador não encontrado.');
  });

  it('should return item with installments', async() => {
    // Arrange
    const bank = await prisma.bank.create({ data: baseBankData });
    const provider = await prisma.provider.create({ data: baseProviderData });
    const input: CreateProviderItemInputDto = {
      providerId: provider.id,
      description: 'Serviço de manutenção',
      totalValueInCents: 30000,
      installmentsCount: 3,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: '2026-07-10',
      bankId: bank.id,
    };
    const { id } = await createProviderItem.execute(input);

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result.id).toBe(id);
    expect(result.providerId).toBe(provider.id);
    expect(result.description).toBe('Serviço de manutenção');
    expect(result.installments).toHaveLength(3);
    expect(result.installments.every((item) => item.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
    expect(result.bank.id).toBe(bank.id);
  });
});
