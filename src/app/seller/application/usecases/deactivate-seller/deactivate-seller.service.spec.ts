import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { DeactivateSeller } from './deactivate-seller.service';

describe('DeactivateSeller - Unit tests', () => {
  let sut: DeactivateSeller;
  let sellerRepository: ISellerRepository;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeactivateSeller,
        { provide: TOKENS.SellerRepository, useValue: createMock<ISellerRepository>() },
      ],
    }).compile();

    sut = module.get(DeactivateSeller);
    sellerRepository = module.get(TOKENS.SellerRepository);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw SellerNotFoundError when seller does not exist', async() => {
    // Arrange
    jest.spyOn(sellerRepository, 'findById').mockResolvedValue(null);
    const editSpy = jest.spyOn(sellerRepository, 'edit');

    // Act & Assert
    await expect(sut.execute(1)).rejects.toThrow(SellerNotFoundError);
    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should deactivate seller and persist changes', async() => {
    // Arrange
    const seller = createMock<Seller>();
    jest.spyOn(sellerRepository, 'findById').mockResolvedValue(seller);
    const deactivateSpy = jest.spyOn(seller, 'deactivate');
    const editSpy = jest.spyOn(sellerRepository, 'edit');

    // Act
    const result = await sut.execute(1);

    // Assert
    expect(deactivateSpy).toHaveBeenCalled();
    expect(editSpy).toHaveBeenCalledWith(seller);
    expect(result).toEqual<SuccessMessage>({ message: 'Vendedor desativado com sucesso' });
  });
});
