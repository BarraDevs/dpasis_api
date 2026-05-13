import { Test } from '@nestjs/testing';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { UploadFileQueueFakeAdapterProducer } from 'src/app/upload-file/infra/driven/queue/fake/upload-file-queue-fake.producer';
import { ResaleModule } from 'src/app/resale/resale/resale.module';
import { TOKENS } from 'src/core/di/token';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { ResaleNotFoundError } from '../../../domain/errors/resale-not-found.error';
import { makeCreateResaleInput, resetResaleIntegrationState } from 'src/test/fixtures/minimal-resale';
import { CreateResale } from '../create-resale/create-resale.service';
import { EditResale } from './edit-resale.service';
import { EditResaleInputDto } from './dtos/edit-resale.dto';

describe('EditResale - Integration tests', () => {
  let sut: EditResale;
  let createResale: CreateResale;
  let prisma: PrismaService;
  let uploadSingle: UploadSingle;
  let uploadQueue: UploadFileQueueFakeAdapterProducer;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleModule],
    }).compile();

    sut = module.get(EditResale);
    createResale = module.get(CreateResale);
    prisma = module.get(PrismaService);
    uploadSingle = module.get(UploadSingle);
    uploadQueue = module.get(TOKENS.UploadFileQueueProducer) as UploadFileQueueFakeAdapterProducer;
  });

  beforeEach(async() => {
    await resetResaleIntegrationState(prisma, 1);
    uploadQueue.addedDeleteJobs.length = 0;
  });

  afterAll(async() => {
    await resetResaleIntegrationState(prisma, 1);
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should update only provided fields and return success message', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());

    const patch: EditResaleInputDto = { name: 'Revenda Renomeada' };
    const result = await sut.execute(id, patch);

    expect(result.message).toBe('Edição realizada com sucesso');

    const row = await prisma.resale.findUniqueOrThrow({ where: { id } });
    expect(row.name).toBe('Revenda Renomeada');
    expect(row.document).toBe('09748165000110');
  });

  it('should persist patches to extended optional fields', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());

    await sut.execute(id, {
      nickname: 'Apelido novo',
      socialName: 'Nome social público',
      validityDate: '2028-05-01T00:00:00.000Z',
      accessEmail: 'novo@loja.com',
      paymentDay: 12,
      bonus: 5,
      billingStartDay: 21,
      indicatorResale: true,
      recurringResale: true,
    });

    const row = await prisma.resale.findUniqueOrThrow({ where: { id } });

    expect(row.nickname).toBe('Apelido novo');
    expect(row.socialName).toBe('Nome social público');
    expect(row.validityDate?.toISOString()).toBe('2028-05-01T00:00:00.000Z');
    expect(row.accessEmail).toBe('novo@loja.com');
    expect(row.paymentDay).toBe(12);
    expect(row.bonus).toBe(5);
    expect(row.billingStartDay).toBe(21);
    expect(row.indicatorResale).toBe(true);
    expect(row.recurringResale).toBe(true);
  });

  it('should update document when not taken by another resale', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());

    await sut.execute(id, { document: '28.695.096/0001-79' });

    const row = await prisma.resale.findUniqueOrThrow({ where: { id } });
    expect(row.document).toBe('28695096000179');
  });

  it('should allow keeping the same document value', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());

    await expect(
      sut.execute(id, { document: '09.748.165/0001-10' }),
    ).resolves.toMatchObject({ message: 'Edição realizada com sucesso' });
  });

  it('should set identifier to null when explicitly passed as null', async() => {
    const { id } = await createResale.execute(
      makeCreateResaleInput({ identifier: 'EXT-1' }),
    );

    await sut.execute(id, { identifier: null });

    const row = await prisma.resale.findUniqueOrThrow({ where: { id } });
    expect(row.identifier).toBeNull();
  });

  it('should throw ResaleNotFoundError when id does not exist', async() => {
    await expect(sut.execute(99_999, { name: 'X' })).rejects.toThrow(ResaleNotFoundError);
    await expect(sut.execute(99_999, { name: 'X' })).rejects.toThrow('Revenda não encontrada na base de dados.');
  });

  it('should throw DocumentAlreadyTakenError when document belongs to another resale', async() => {
    const { id: idA } = await createResale.execute(
      makeCreateResaleInput({ name: 'A', document: '09.748.165/0001-10' }),
    );
    const { id: idB } = await createResale.execute(
      makeCreateResaleInput({
        name: 'B',
        document: '28.695.096/0001-79',
      }),
    );

    await expect(
      sut.execute(idB, { document: '09.748.165/0001-10' }),
    ).rejects.toThrow(DocumentAlreadyTakenError);

    const unchanged = await prisma.resale.findUniqueOrThrow({ where: { id: idB } });
    expect(unchanged.document).toBe('28695096000179');

    const a = await prisma.resale.findUniqueOrThrow({ where: { id: idA } });
    expect(a.document).toBe('09748165000110');
  });

  it('should not validate document collision when document field is omitted', async() => {
    const { id: idA } = await createResale.execute(
      makeCreateResaleInput({ name: 'A', document: '09.748.165/0001-10' }),
    );
    const { id: idB } = await createResale.execute(
      makeCreateResaleInput({
        name: 'B',
        document: '28.695.096/0001-79',
      }),
    );

    await expect(sut.execute(idB, { name: 'B atualizado' })).resolves.toBeDefined();
    expect(idA).not.toBe(idB);
  });

  it('should persist profilePictureUrl after upload when file is provided', async() => {
    const { id } = await createResale.execute(makeCreateResaleInput());

    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'avatar-edit.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('x'),
      size: 100,
      destination: '',
      filename: '',
      path: '',
      stream: undefined as any,
    };

    const expectedUrl = 'http://fake-url.com/after-edit.png';
    const uploadSpy = jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: expectedUrl });

    await sut.execute(id, { name: 'Revenda Teste' }, mockFile);

    expect(uploadSpy).toHaveBeenCalledWith(expect.objectContaining({ originalname: 'avatar-edit.png' }), `resales/${id}/profile-picture`);

    const row = await prisma.resale.findUniqueOrThrow({ where: { id } });
    expect(row.profilePictureUrl).toBe(expectedUrl);

    uploadSpy.mockRestore();
  });

  it('should enqueue delete of previous profile picture URL when uploading a replacement file', async() => {
    const oldUrl = 'https://storage.example.com/resales/old.png';
    await prisma.resale.create({
      data: {
        id: 42,
        name: 'Revenda',
        identifier: null,
        zipCode: '01310100',
        street: 'S',
        neighborhood: 'N',
        city: 'C',
        state: 'SP',
        licenseType: 'A1',
        document: '28695096000179',
        ie: null,
        phone01: '11999999999',
        phone02: null,
        voucher: null,
        email: null,
        website: null,
        nickname: null,
        socialName: null,
        validityDate: null,
        accessEmail: null,
        accessPassword: null,
        paymentDay: null,
        bonus: null,
        billingStartDay: null,
        receivesSupportEmail: false,
        servedByRoot: false,
        manufacturerResale: false,
        indicatorResale: false,
        recurringResale: false,
        profilePictureUrl: oldUrl,
        active: true,
      },
    });

    const mockFile = {
      fieldname: 'file',
      originalname: 'replace.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from(''),
      size: 50,
    } as Express.Multer.File;

    const uploadSpy = jest.spyOn(uploadSingle, 'execute').mockResolvedValue({
      url: 'https://storage.example.com/resales/new.png',
    });

    await sut.execute(42, { name: 'Revenda atualizada' }, mockFile);

    expect(uploadSpy).toHaveBeenCalled();

    expect(uploadQueue.addedDeleteJobs).toHaveLength(1);
    expect(uploadQueue.addedDeleteJobs[0]).toEqual({
      name: JobName.DeleteFile,
      data: { fileUrl: oldUrl },
    });

    uploadSpy.mockRestore();
  });
});
