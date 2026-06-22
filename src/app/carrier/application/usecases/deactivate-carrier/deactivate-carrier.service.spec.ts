import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CarrierNotFoundError } from 'src/app/carrier/domain/errors/carrier-not-found.error';
import { Carrier } from 'src/app/carrier/domain/entities/carrier.entity';
import { TOKENS } from 'src/core/di/token';
import type { ICarrierRepository } from '../../persistence/repository/carrier-repository.interface';
import { DeactivateCarrier } from './deactivate-carrier.service';

describe('DeactivateCarrier - Unit tests', () => {
  let sut: DeactivateCarrier;
  let carrierRepository: ICarrierRepository;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeactivateCarrier,
        { provide: TOKENS.CarrierRepository, useValue: createMock<ICarrierRepository>() },
      ],
    }).compile();

    sut = module.get(DeactivateCarrier);
    carrierRepository = module.get(TOKENS.CarrierRepository);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CarrierNotFoundError when carrier does not exist', async() => {
    jest.spyOn(carrierRepository, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1)).rejects.toThrow(CarrierNotFoundError);
  });

  it('should deactivate carrier', async() => {
    const carrier = createMock<Carrier>();
    jest.spyOn(carrierRepository, 'findById').mockResolvedValue(carrier);
    const deactivateSpy = jest.spyOn(carrier, 'deactivate');
    const editSpy = jest.spyOn(carrierRepository, 'edit').mockResolvedValue();

    const result = await sut.execute(1);

    expect(deactivateSpy).toHaveBeenCalled();
    expect(editSpy).toHaveBeenCalledWith(carrier);
    expect(result).toEqual({ message: 'Transportadora desativada com sucesso' });
  });
});
