import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { SellerFactory } from 'src/app/seller/domain/factories/seller.factory';
import type { IUploadFileQueueProducer } from 'src/app/upload-file/application/queue/upload-file-queue-producer.interface';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { DeleteSeller } from './delete-seller.service';

describe('DeleteSeller - Unit tests', () => {
  let sut: DeleteSeller;
  let sellerRepository: ISellerRepository;
  let uploadFileQueueProducer: IUploadFileQueueProducer;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteSeller,
        { provide: TOKENS.SellerRepository, useValue: createMock<ISellerRepository>() },
        { provide: TOKENS.UploadFileQueueProducer, useValue: createMock<IUploadFileQueueProducer>() },
      ],
    }).compile();

    sut = module.get(DeleteSeller);
    sellerRepository = module.get(TOKENS.SellerRepository);
    uploadFileQueueProducer = module.get(TOKENS.UploadFileQueueProducer);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw SellerNotFoundError when seller does not exist', async() => {
    // Arrange
    jest.spyOn(sellerRepository, 'findById').mockResolvedValue(null);
    const deleteSpy = jest.spyOn(sellerRepository, 'delete');

    // Act & Assert
    await expect(sut.execute(1)).rejects.toThrow(SellerNotFoundError);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should call repository.delete with correct id', async() => {
    // Arrange
    const seller = SellerFactory.create({
      name: 'João Silva',
      phone: '1133334444',
      nickname: null,
      whatsapp: '11999998888',
      email: 'joao@vendedor.com',
      commission: 10,
      profilePictureUrl: null,
      observation: null,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });
    jest.spyOn(sellerRepository, 'findById').mockResolvedValue(seller);
    const deleteSpy = jest.spyOn(sellerRepository, 'delete');

    // Act
    await sut.execute(1);

    // Assert
    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it('should enqueue delete job when seller has profile picture', async() => {
    // Arrange
    const previousUrl = 'https://bucket/old.png';
    const seller = SellerFactory.edit({
      id: 1,
      name: 'João Silva',
      phone: '1133334444',
      nickname: null,
      whatsapp: '11999998888',
      email: 'joao@vendedor.com',
      commission: 10,
      profilePictureUrl: previousUrl,
      observation: null,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      active: true,
    });
    jest.spyOn(sellerRepository, 'findById').mockResolvedValue(seller);

    // Act
    await sut.execute(1);

    // Assert
    expect(uploadFileQueueProducer.addDeleteJob).toHaveBeenCalledWith({ fileUrl: previousUrl });
  });

  it('should not enqueue delete job when seller has no profile picture', async() => {
    // Arrange
    const seller = SellerFactory.create({
      name: 'João Silva',
      phone: '1133334444',
      nickname: null,
      whatsapp: '11999998888',
      email: 'joao@vendedor.com',
      commission: 10,
      profilePictureUrl: null,
      observation: null,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });
    jest.spyOn(sellerRepository, 'findById').mockResolvedValue(seller);

    // Act
    await sut.execute(1);

    // Assert
    expect(uploadFileQueueProducer.addDeleteJob).not.toHaveBeenCalled();
  });

  it('should return success message', async() => {
    // Arrange
    jest.spyOn(sellerRepository, 'findById').mockResolvedValue(createMock<Seller>());

    // Act
    const result = await sut.execute(1);

    // Assert
    expect(result).toEqual<SuccessMessage>({ message: 'Vendedor excluído com sucesso' });
  });
});
