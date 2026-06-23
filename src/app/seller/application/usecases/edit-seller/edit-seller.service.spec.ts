import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { SellerDto } from 'src/app/seller/application/dtos/seller.dto';
import type { IUploadFileQueueProducer } from 'src/app/upload-file/application/queue/upload-file-queue-producer.interface';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import { SellerNotFoundError } from '../../../domain/errors/seller-not-found.error';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { EditSeller } from './edit-seller.service';

function makeSellerDto(overrides: Partial<SellerDto> = {}): SellerDto {
  return {
    id: 99,
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
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const mockFile = {
  fieldname: 'file',
  originalname: 'new.png',
  encoding: '7bit',
  mimetype: 'image/png',
  buffer: Buffer.from(''),
  size: 200,
} as Express.Multer.File;

describe('EditSeller - Unit tests', () => {
  let sut: EditSeller;
  let sellerDao: ISellerDao;
  let sellerRepository: ISellerRepository;
  let uploadFileQueueProducer: IUploadFileQueueProducer;
  let uploadSingle: UploadSingle;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        EditSeller,
        { provide: TOKENS.SellerDao, useValue: createMock<ISellerDao>() },
        { provide: TOKENS.SellerRepository, useValue: createMock<ISellerRepository>() },
        { provide: TOKENS.UploadFileQueueProducer, useValue: createMock<IUploadFileQueueProducer>() },
        { provide: UploadSingle, useValue: createMock<UploadSingle>() },
      ],
    }).compile();

    sut = module.get(EditSeller);
    sellerDao = module.get(TOKENS.SellerDao);
    sellerRepository = module.get(TOKENS.SellerRepository);
    uploadFileQueueProducer = module.get(TOKENS.UploadFileQueueProducer);
    uploadSingle = module.get(UploadSingle);

    jest.spyOn(sellerDao, 'findById').mockResolvedValue(makeSellerDto());
    jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw SellerNotFoundError when seller does not exist', async() => {
    // Arrange
    jest.spyOn(sellerDao, 'findById').mockResolvedValue(null);
    const editSpy = jest.spyOn(sellerRepository, 'edit');

    // Act & Assert
    await expect(sut.execute(99, { name: 'Test' })).rejects.toThrow(SellerNotFoundError);
    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should persist fields without uploading when file is omitted', async() => {
    // Arrange
    const editSpy = jest.spyOn(sellerRepository, 'edit');

    // Act
    await sut.execute(99, { name: 'Novo nome' });

    // Assert
    expect(uploadSingle.execute).not.toHaveBeenCalled();
    expect(uploadFileQueueProducer.addDeleteJob).not.toHaveBeenCalled();
    const entity = editSpy.mock.calls[0]?.[0];
    expect(entity?.props.name).toBe('Novo nome');
    expect(entity?.props.profilePictureUrl).toBeNull();
  });

  it('should upload and set profilePictureUrl when file is provided', async() => {
    // Arrange
    const newUrl = 'https://cdn.example.com/sellers/99/new.png';
    jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: newUrl });
    const editSpy = jest.spyOn(sellerRepository, 'edit');

    // Act
    await sut.execute(99, { name: 'João Silva' }, mockFile);

    // Assert
    expect(uploadSingle.execute).toHaveBeenCalledWith(mockFile, 'sellers/99/profile-picture');
    expect(uploadFileQueueProducer.addDeleteJob).not.toHaveBeenCalled();
    expect(editSpy.mock.calls[0]?.[0].props.profilePictureUrl).toBe(newUrl);
  });

  it('should enqueue delete for previous profile picture URL when replacing with a new file', async() => {
    // Arrange
    const previousUrl = 'https://bucket/old.png';
    jest.spyOn(sellerDao, 'findById').mockResolvedValue(
      makeSellerDto({ profilePictureUrl: previousUrl }),
    );
    jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: 'https://bucket/new.png' });

    // Act
    await sut.execute(99, {}, mockFile);

    // Assert
    expect(uploadFileQueueProducer.addDeleteJob).toHaveBeenCalledWith({ fileUrl: previousUrl });
  });

  it('should throw EmailAlreadyTakenError when email is taken by another seller', async() => {
    // Arrange
    jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue({ id: 1 });
    const editSpy = jest.spyOn(sellerRepository, 'edit');

    // Act & Assert
    await expect(sut.execute(99, { email: 'outro@vendedor.com' })).rejects.toThrow(EmailAlreadyTakenError);
    expect(editSpy).not.toHaveBeenCalled();
  });

  it('should allow keeping the same email for the same seller', async() => {
    // Arrange
    jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue({ id: 99 });
    const editSpy = jest.spyOn(sellerRepository, 'edit');

    // Act
    await sut.execute(99, { email: 'joao@vendedor.com' });

    // Assert
    expect(editSpy).toHaveBeenCalledTimes(1);
  });

  it('should not check email uniqueness when email is omitted', async() => {
    // Arrange
    const findByEmailSpy = jest.spyOn(sellerDao, 'findByEmail');

    // Act
    await sut.execute(99, { name: 'Novo nome' });

    // Assert
    expect(findByEmailSpy).not.toHaveBeenCalled();
  });

  it('should return success message', async() => {
    // Act
    const result = await sut.execute(99, { name: 'Novo nome' });

    // Assert
    expect(result).toEqual<SuccessMessage>({ message: 'Edição realizada com sucesso' });
  });
});
