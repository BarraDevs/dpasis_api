import { Test } from '@nestjs/testing';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { CreateResale } from './create-resale.service';
import { makeCreateResaleInput } from 'src/test/fixtures/minimal-resale';

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

  it('should pass extended optional fields to the entity persisted by the repository', async() => {
    await sut.execute(
      makeCreateResaleInput({
        nickname: 'Centro',
        socialName: 'Nome oficial social',
        validityDate: '2026-09-01T00:00:00.000Z',
        accessEmail: 'acc@loja.com',
        accessPassword: 'pwd',
        paymentDay: 5,
        bonus: 10,
        billingStartDay: 20,
        servedByRoot: true,
        manufacturerResale: false,
        indicatorResale: true,
        recurringResale: false,
      }),
    );

    const entity = resaleRepository.save.mock.calls[0]?.[0];
    expect(entity?.props.nickname).toBe('Centro');
    expect(entity?.props.socialName).toBe('Nome oficial social');
    expect(entity?.props.validityDate).toEqual(new Date('2026-09-01T00:00:00.000Z'));
    expect(entity?.props.accessEmail).toBe('acc@loja.com');
    expect(entity?.props.accessPassword).toBe('pwd');
    expect(entity?.props.paymentDay).toBe(5);
    expect(entity?.props.bonus).toBe(10);
    expect(entity?.props.billingStartDay).toBe(20);
    expect(entity?.props.servedByRoot).toBe(true);
    expect(entity?.props.manufacturerResale).toBe(false);
    expect(entity?.props.indicatorResale).toBe(true);
    expect(entity?.props.recurringResale).toBe(false);
  });
});
