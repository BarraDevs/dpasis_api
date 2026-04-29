import { Test } from '@nestjs/testing';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { CreateResale } from './create-resale.service';
import { makeCreateResaleInput } from '../resale-integration-test.helper';

describe('CreateResale - Unit tests', () => {
  let sut: CreateResale;
  const resaleDao = {
    findById: jest.fn(),
    findByDocument: jest.fn(),
  };
  const resaleRepository = {
    save: jest.fn(),
  };
  const resaleSequenceRepository = {
    ensureNextIdIsAtLeast: jest.fn(),
    getAndIncrement: jest.fn(),
  };
  const uploadSingle = {
    execute: jest.fn(),
  };

  beforeEach(async() => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        CreateResale,
        { provide: TOKENS.ResaleDao, useValue: resaleDao },
        { provide: TOKENS.ResaleRepository, useValue: resaleRepository },
        { provide: TOKENS.ResaleSequenceRepository, useValue: resaleSequenceRepository },
        { provide: UploadSingle, useValue: uploadSingle },
      ],
    }).compile();

    sut = module.get(CreateResale);

    resaleDao.findById.mockResolvedValue(null);
    resaleDao.findByDocument.mockResolvedValue(null);
    resaleSequenceRepository.getAndIncrement.mockResolvedValue(1);
    resaleRepository.save.mockImplementation(async(entity) =>
      Promise.resolve(entity.props.id),
    );
  });

  it('should persist null profilePictureUrl when no file is sent', async() => {
    await sut.execute(makeCreateResaleInput());

    expect(uploadSingle.execute).not.toHaveBeenCalled();
    const entity = resaleRepository.save.mock.calls[0]?.[0];
    expect(entity?.props.profilePictureUrl).toBeNull();
  });

  it('should call UploadSingle when file is sent and persist returned url', async() => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'photo.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from(''),
      size: 100,
    } as Express.Multer.File;

    uploadSingle.execute.mockResolvedValue({ url: 'https://cdn.example.com/r/1/photo.png' });

    await sut.execute(makeCreateResaleInput(), mockFile);

    expect(uploadSingle.execute).toHaveBeenCalledWith(mockFile, 'resales/1/profile-picture');
    const entity = resaleRepository.save.mock.calls[0]?.[0];
    expect(entity?.props.profilePictureUrl).toBe('https://cdn.example.com/r/1/photo.png');
  });
});
