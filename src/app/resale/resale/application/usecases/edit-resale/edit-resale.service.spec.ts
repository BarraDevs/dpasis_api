import { Test } from '@nestjs/testing';
import { ResaleDto } from 'src/app/resale/resale/application/dtos/resale.dto';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { EditResale } from './edit-resale.service';

function makeResaleDto(overrides: Partial<ResaleDto> = {}): ResaleDto {
  return {
    id: 99,
    name: 'Revenda',
    identifier: null,
    zipCode: '01310-100',
    street: 'Rua A',
    neighborhood: 'Bairro',
    city: 'Cidade',
    state: 'SP',
    licenseType: 'A1',
    document: '09748165000110',
    ie: null,
    phone01: '11999999999',
    phone02: null,
    voucher: null,
    email: null,
    website: null,
    receivesSupportEmail: false,
    servedByDpa: false,
    manufacturerReseller: false,
    profilePictureUrl: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('EditResale - Unit tests', () => {
  let sut: EditResale;
  const resaleDao = {
    findById: jest.fn(),
    findByDocument: jest.fn(),
  };
  const resaleRepository = {
    edit: jest.fn(),
  };
  const uploadFileQueueProducer = {
    addDeleteJob: jest.fn(),
  };
  const uploadSingle = {
    execute: jest.fn(),
  };

  const mockFile = {
    fieldname: 'file',
    originalname: 'new.png',
    encoding: '7bit',
    mimetype: 'image/png',
    buffer: Buffer.from(''),
    size: 200,
  } as Express.Multer.File;

  beforeEach(async() => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        EditResale,
        { provide: TOKENS.ResaleDao, useValue: resaleDao },
        { provide: TOKENS.ResaleRepository, useValue: resaleRepository },
        { provide: TOKENS.UploadFileQueueProducer, useValue: uploadFileQueueProducer },
        { provide: UploadSingle, useValue: uploadSingle },
      ],
    }).compile();

    sut = module.get(EditResale);

    resaleDao.findById.mockResolvedValue(makeResaleDto());
    resaleDao.findByDocument.mockResolvedValue(null);
  });

  it('should persist fields without uploading when file is omitted', async() => {
    await sut.execute(99, { name: 'Novo nome' });

    expect(uploadSingle.execute).not.toHaveBeenCalled();
    expect(uploadFileQueueProducer.addDeleteJob).not.toHaveBeenCalled();
    const entity = resaleRepository.edit.mock.calls[0]?.[0];
    expect(entity?.props.name).toBe('Novo nome');
    expect(entity?.props.profilePictureUrl).toBeNull();
  });

  it('should upload and set profilePictureUrl when file is provided', async() => {
    const newUrl = 'https://cdn.example.com/resales/99/new.png';
    uploadSingle.execute.mockResolvedValue({ url: newUrl });

    await sut.execute(99, { name: 'Revenda' }, mockFile);

    expect(uploadSingle.execute).toHaveBeenCalledWith(mockFile, 'resales/99/profile-picture');
    expect(uploadFileQueueProducer.addDeleteJob).not.toHaveBeenCalled();
    const entity = resaleRepository.edit.mock.calls[0]?.[0];
    expect(entity?.props.profilePictureUrl).toBe(newUrl);
  });

  it('should enqueue delete for previous profile picture URL when replacing with a new file', async() => {
    const previousUrl = 'https://bucket/old.png';
    resaleDao.findById.mockResolvedValue(
      makeResaleDto({
        profilePictureUrl: previousUrl,
      }),
    );

    uploadSingle.execute.mockResolvedValue({ url: 'https://bucket/new.png' });

    await sut.execute(99, {}, mockFile);

    expect(uploadFileQueueProducer.addDeleteJob).toHaveBeenCalledTimes(1);
    expect(uploadFileQueueProducer.addDeleteJob).toHaveBeenCalledWith({
      fileUrl: previousUrl,
    });
  });

  it('should not enqueue delete when uploading first picture', async() => {
    uploadSingle.execute.mockResolvedValue({ url: 'https://bucket/first.png' });

    await sut.execute(99, {}, mockFile);

    expect(uploadFileQueueProducer.addDeleteJob).not.toHaveBeenCalled();
  });
});
