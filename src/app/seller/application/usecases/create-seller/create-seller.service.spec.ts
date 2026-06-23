import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { CreateSeller } from './create-seller.service';
import { CreateSellerInputDto, CreateSellerOutputDto } from './dtos/create-seller.dto';

const mockFile = {
  fieldname: 'file',
  originalname: 'photo.png',
  encoding: '7bit',
  mimetype: 'image/png',
  buffer: Buffer.from(''),
  size: 200,
} as Express.Multer.File;

function makeValidCreateSellerInput(overrides: Partial<CreateSellerInputDto> = {}): CreateSellerInputDto {
  return {
    name: 'João Silva',
    phone: '1133334444',
    nickname: 'João',
    whatsapp: '11999998888',
    email: 'joao@vendedor.com',
    commission: 10.5,
    observation: null,
    zipCode: '01310100',
    street: 'Av Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    ...overrides,
  };
}

describe('CreateSeller - Unit tests', () => {
  let sut: CreateSeller;
  let sellerDao: ISellerDao;
  let sellerRepository: ISellerRepository;
  let uploadSingle: UploadSingle;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateSeller,
        { provide: TOKENS.SellerDao, useValue: createMock<ISellerDao>() },
        { provide: TOKENS.SellerRepository, useValue: createMock<ISellerRepository>() },
        { provide: UploadSingle, useValue: createMock<UploadSingle>() },
      ],
    }).compile();

    sut = module.get(CreateSeller);
    sellerDao = module.get(TOKENS.SellerDao);
    sellerRepository = module.get(TOKENS.SellerRepository);
    uploadSingle = module.get(UploadSingle);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should save entity and return id when file is omitted', async() => {
    // Arrange
    const input = makeValidCreateSellerInput();
    jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(sellerRepository, 'save').mockResolvedValue(42);
    const editSpy = jest.spyOn(sellerRepository, 'edit');

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(sellerRepository.save).toHaveBeenCalledTimes(1);
    expect(uploadSingle.execute).not.toHaveBeenCalled();
    expect(editSpy).not.toHaveBeenCalled();
    expect(result).toEqual<CreateSellerOutputDto>({ id: 42 });
  });

  it('should upload profile picture and edit seller when file is provided', async() => {
    // Arrange
    const input = makeValidCreateSellerInput();
    const newUrl = 'https://cdn.example.com/sellers/7/new.png';
    jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(sellerRepository, 'save').mockResolvedValue(7);
    jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: newUrl });
    const editSpy = jest.spyOn(sellerRepository, 'edit');

    // Act
    await sut.execute(input, mockFile);

    // Assert
    expect(uploadSingle.execute).toHaveBeenCalledWith(mockFile, 'sellers/7/profile-picture');
    expect(editSpy).toHaveBeenCalledTimes(1);
    expect(editSpy.mock.calls[0]?.[0].props.profilePictureUrl).toBe(newUrl);
  });

  it('should throw EmailAlreadyTakenError when email already exists', async() => {
    // Arrange
    const input = makeValidCreateSellerInput();
    jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue({ id: 99 });
    const saveSpy = jest.spyOn(sellerRepository, 'save');

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(EmailAlreadyTakenError);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should check email before saving', async() => {
    // Arrange
    const input = makeValidCreateSellerInput();
    const findByEmailSpy = jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(sellerRepository, 'save').mockResolvedValue(1);

    // Act
    await sut.execute(input);

    // Assert
    expect(findByEmailSpy).toHaveBeenCalledWith(input.email);
  });
});
