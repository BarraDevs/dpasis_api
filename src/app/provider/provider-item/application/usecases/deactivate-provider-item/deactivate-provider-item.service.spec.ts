import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ProviderItemNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-not-found.error';
import { ProviderItemFactory } from 'src/app/provider/provider-item/domain/factories/provider-item.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderItemScheduleType } from '../../../domain/enums/provider-item-schedule-type.enum';
import { ProviderItemModule } from '../../../provider-item.module';
import type { IProviderItemRepository } from '../../persistence/repository/provider-item-repository.interface';
import { CreateProviderItem } from '../create-provider-item/create-provider-item.service';
import { CreateProviderItemInputDto } from '../create-provider-item/dtos/create-provider-item.dto';
import { DeactivateProviderItem } from './deactivate-provider-item.service';

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

describe('DeactivateProviderItem - Unit tests', () => {
  let sut: DeactivateProviderItem;
  let providerItemRepository: IProviderItemRepository;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeactivateProviderItem,
        {
          provide: TOKENS.ProviderItemRepository,
          useValue: createMock<IProviderItemRepository>(),
        },
      ],
    }).compile();

    sut = module.get(DeactivateProviderItem);
    providerItemRepository = module.get(TOKENS.ProviderItemRepository);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ProviderItemNotFoundError when item does not exist', async() => {
    // Arrange
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(1)).rejects.toThrow(ProviderItemNotFoundError);
  });

  it('should call repository.updateStatus after deactivating item', async() => {
    // Arrange
    const item = ProviderItemFactory.create({
      providerId: 1,
      description: 'Serviço',
      totalValueInCents: 10000,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      bankId: 1,
    });
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(item);
    const updateStatusSpy = jest.spyOn(providerItemRepository, 'updateStatus');

    // Act
    await sut.execute(1);

    // Assert
    expect(item.props.active).toBe(false);
    expect(updateStatusSpy).toHaveBeenCalledWith(1, false);
    expect(updateStatusSpy).toHaveBeenCalledTimes(1);
  });

  it('should return success message', async() => {
    // Arrange
    const item = ProviderItemFactory.create({
      providerId: 1,
      description: 'Serviço',
      totalValueInCents: 10000,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      bankId: 1,
    });
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(item);

    // Act
    const result = await sut.execute(1);

    // Assert
    expect(result).toEqual<SuccessMessage>({
      message: 'Item do prestador desativado com sucesso',
    });
  });
});

describe('DeactivateProviderItem - Integration tests', () => {
  let sut: DeactivateProviderItem;
  let createProviderItem: CreateProviderItem;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderItemModule],
    }).compile();

    sut = module.get(DeactivateProviderItem);
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

  async function createActiveItem() {
    const bank = await prisma.bank.create({ data: baseBankData });
    const provider = await prisma.provider.create({ data: baseProviderData });
    const input: CreateProviderItemInputDto = {
      providerId: provider.id,
      description: 'Serviço',
      totalValueInCents: 10000,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: '2026-07-10',
      bankId: bank.id,
    };

    return createProviderItem.execute(input);
  }

  it('should throw ProviderItemNotFoundError when item does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ProviderItemNotFoundError);
  });

  it('should deactivate active item in database', async() => {
    // Arrange
    const { id } = await createActiveItem();

    // Act
    await sut.execute(id);

    // Assert
    const updated = await prisma.providerItem.findUnique({ where: { id } });
    expect(updated?.active).toBe(false);
  });

  it('should keep item inactive when already inactive', async() => {
    // Arrange
    const { id } = await createActiveItem();
    await sut.execute(id);

    // Act
    const result = await sut.execute(id);

    // Assert
    const updated = await prisma.providerItem.findUnique({ where: { id } });
    expect(updated?.active).toBe(false);
    expect(result).toEqual({ message: 'Item do prestador desativado com sucesso' });
  });
});
