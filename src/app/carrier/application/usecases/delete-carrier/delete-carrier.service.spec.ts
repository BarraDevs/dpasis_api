import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Carrier } from 'src/app/carrier/domain/entities/carrier.entity';
import { CarrierNotFoundError } from 'src/app/carrier/domain/errors/carrier-not-found.error';
import { CarrierFactory } from 'src/app/carrier/domain/factories/carrier.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CarrierModule } from '../../../carrier.module';
import type { ICarrierRepository } from '../../persistence/repository/carrier-repository.interface';
import { CreateCarrier } from '../create-carrier/create-carrier.service';
import { DeleteCarrier } from './delete-carrier.service';

describe('DeleteCarrier - Unit tests', () => {
  let sut: DeleteCarrier;
  let carrierRepository: ICarrierRepository;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteCarrier,
        {
          provide: TOKENS.CarrierRepository,
          useValue: createMock<ICarrierRepository>(),
        },
      ],
    }).compile();

    sut = module.get(DeleteCarrier);
    carrierRepository = module.get(TOKENS.CarrierRepository);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CarrierNotFoundError when carrier does not exist', async() => {
    jest.spyOn(carrierRepository, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1)).rejects.toThrow(CarrierNotFoundError);
  });

  it('should call repository.delete with correct id', async() => {
    const carrier = CarrierFactory.create({
      name: 'Transportadora LTDA',
      fantasyName: 'Transportadora',
      representative: 'João Silva',
      document: '09.748.165/0001-10',
      contact: 'João Silva - (11) 99999-9999',
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });
    jest.spyOn(carrierRepository, 'findById').mockResolvedValue(carrier);
    const deleteSpy = jest.spyOn(carrierRepository, 'delete');

    await sut.execute(1);

    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it('should return success message', async() => {
    jest.spyOn(carrierRepository, 'findById').mockResolvedValue(createMock<Carrier>());

    const result = await sut.execute(1);

    expect(result).toEqual<SuccessMessage>({ message: 'Transportadora excluída com sucesso' });
  });

  it('should not call delete when carrier does not exist', async() => {
    jest.spyOn(carrierRepository, 'findById').mockResolvedValue(null);
    const deleteSpy = jest.spyOn(carrierRepository, 'delete');

    await expect(sut.execute(1)).rejects.toThrow(CarrierNotFoundError);
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});

describe('DeleteCarrier - Integration tests', () => {
  let sut: DeleteCarrier;
  let createCarrier: CreateCarrier;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CarrierModule],
    }).compile();

    sut = module.get(DeleteCarrier);
    createCarrier = module.get(CreateCarrier);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should delete carrier from database', async() => {
    const { id } = await createCarrier.execute({
      name: 'Transportadora LTDA',
      fantasyName: 'Transportadora',
      representative: 'João Silva',
      document: '09.748.165/0001-10',
      contact: 'João Silva - (11) 99999-9999',
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });

    await sut.execute(id);

    const deleted = await prisma.carrier.findUnique({ where: { id } });
    expect(deleted).toBeNull();
  });
});
