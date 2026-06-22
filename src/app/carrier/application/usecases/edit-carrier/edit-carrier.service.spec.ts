import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CarrierNotFoundError } from 'src/app/carrier/domain/errors/carrier-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { CarrierDto } from '../../dtos/carrier.dto';
import type { ICarrierDao } from '../../persistence/dao/carrier-dao.interface';
import type { ICarrierRepository } from '../../persistence/repository/carrier-repository.interface';
import { EditCarrier } from './edit-carrier.service';

describe('EditCarrier - Unit tests', () => {
  let sut: EditCarrier;
  let carrierDao: ICarrierDao;
  let carrierRepository: ICarrierRepository;

  const existingCarrier = createMock<CarrierDto>({
    id: 1,
    active: true,
    name: 'Transportadora LTDA',
    fantasyName: 'Transportadora',
    representative: 'João Silva',
    document: '09748165000110',
    contact: 'João Silva - (11) 99999-9999',
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  });

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditCarrier,
        { provide: TOKENS.CarrierDao, useValue: createMock<ICarrierDao>() },
        { provide: TOKENS.CarrierRepository, useValue: createMock<ICarrierRepository>() },
      ],
    }).compile();

    sut = module.get(EditCarrier);
    carrierDao = module.get(TOKENS.CarrierDao);
    carrierRepository = module.get(TOKENS.CarrierRepository);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CarrierNotFoundError when carrier does not exist', async() => {
    jest.spyOn(carrierDao, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1, { name: 'Novo Nome' })).rejects.toThrow(CarrierNotFoundError);
  });

  it('should edit carrier successfully', async() => {
    jest.spyOn(carrierDao, 'findById').mockResolvedValue(existingCarrier);
    const editSpy = jest.spyOn(carrierRepository, 'edit').mockResolvedValue();

    const result = await sut.execute(1, { name: 'Novo Nome' });

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
    expect(editSpy).toHaveBeenCalled();
  });

  it('should throw DocumentAlreadyTakenError when document is taken by another carrier', async() => {
    jest.spyOn(carrierDao, 'findById').mockResolvedValue(existingCarrier);
    jest.spyOn(carrierDao, 'findByDocument').mockResolvedValue(
      createMock<CarrierDto>({ id: 2, document: '33000167000101' }),
    );

    await expect(
      sut.execute(1, { document: '33.000.167/0001-01' }),
    ).rejects.toThrow(DocumentAlreadyTakenError);
  });
});
