import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ProviderItem } from 'src/app/provider/provider-item/domain/entities/provider-item.entity';
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
import { ActivateProviderItem } from './activate-provider-item.service';

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

describe('ActivateProviderItem - Unit tests', () => {
  let sut: ActivateProviderItem;
  let providerItemRepository: IProviderItemRepository;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ActivateProviderItem,
        {
          provide: TOKENS.ProviderItemRepository,
          useValue: createMock<IProviderItemRepository>(),
        },
      ],
    }).compile();

    sut = module.get(ActivateProviderItem);
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

  it('should call repository.updateActive with true', async() => {
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
    const updateActiveSpy = jest.spyOn(providerItemRepository, 'updateActive');

    // Act
    await sut.execute(1);

    // Assert
    expect(updateActiveSpy).toHaveBeenCalledWith(1, true);
    expect(updateActiveSpy).toHaveBeenCalledTimes(1);
  });

  it('should return success message', async() => {
    // Arrange
    jest.spyOn(providerItemRepository, 'findById').mockResolvedValue(createMock<ProviderItem>());

    // Act
    const result = await sut.execute(1);

    // Assert
    expect(result).toEqual<SuccessMessage>({
      message: 'Item do prestador ativado com sucesso',
    });
  });
});

describe('ActivateProviderItem - Integration tests', () => {
  let sut: ActivateProviderItem;
  let createProviderItem: CreateProviderItem;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProviderItemModule],
    }).compile();

    sut = module.get(ActivateProviderItem);
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

  async function createInactiveItem() {
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
    const { id } = await createProviderItem.execute(input);
    await prisma.providerItem.update({ where: { id }, data: { active: false } });

    return { id };
  }

  it('should throw ProviderItemNotFoundError when item does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ProviderItemNotFoundError);
  });

  it('should activate inactive item in database', async() => {
    // Arrange
    const { id } = await createInactiveItem();

    // Act
    await sut.execute(id);

    // Assert
    const updated = await prisma.providerItem.findUnique({ where: { id } });
    expect(updated?.active).toBe(true);
  });

  it('should keep item active when already active', async() => {
    // Arrange
    const bank = await prisma.bank.create({ data: baseBankData });
    const provider = await prisma.provider.create({ data: baseProviderData });
    const { id } = await createProviderItem.execute({
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

    // Act
    const result = await sut.execute(id);

    // Assert
    const updated = await prisma.providerItem.findUnique({ where: { id } });
    expect(updated?.active).toBe(true);
    expect(result).toEqual({ message: 'Item do prestador ativado com sucesso' });
  });
});
