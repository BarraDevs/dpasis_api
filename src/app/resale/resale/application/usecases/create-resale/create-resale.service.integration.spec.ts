import { Test } from '@nestjs/testing';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { ResaleModule } from 'src/app/resale/resale/resale.module';
import { DocumentAlreadyTakenError } from 'src/shared/errors/document-already-taken';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleIdAlreadyTakenError } from '../../../domain/errors/resale-id-already-taken.error';
import { makeCreateResaleInput, resetResaleIntegrationState } from 'src/test/fixtures/minimal-resale';
import { CreateResale } from './create-resale.service';

describe('CreateResale - Integration tests', () => {
  let sut: CreateResale;
  let prisma: PrismaService;
  let uploadSingle: UploadSingle;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleModule],
    }).compile();

    sut = module.get(CreateResale);
    prisma = module.get(PrismaService);
    uploadSingle = module.get(UploadSingle);
  });

  beforeEach(async() => {
    await resetResaleIntegrationState(prisma, 1);
  });

  afterAll(async() => {
    await resetResaleIntegrationState(prisma, 1);
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should assign id from sequence when id is omitted and persist resale', async() => {
    const input = makeCreateResaleInput();

    const { id } = await sut.execute(input);

    expect(id).toBe(1);

    const row = await prisma.resale.findUnique({ where: { id: 1 } });
    expect(row).not.toBeNull();
    expect(row?.name).toBe('Revenda Teste');
    expect(row?.document).toBe('09748165000110');
    expect(row?.profilePictureUrl).toBeNull();

    const seq = await prisma.resaleSequence.findUniqueOrThrow({ where: { id: 1 } });
    expect(seq.nextId).toBe(2);
  });

  it('should use consecutive sequence ids for multiple creates without explicit id', async() => {
    const first = await sut.execute(makeCreateResaleInput({ document: '09.748.165/0001-10' }));
    const second = await sut.execute(
      makeCreateResaleInput({
        name: 'Segunda',
        document: '28.695.096/0001-79',
      }),
    );

    expect(first.id).toBe(1);
    expect(second.id).toBe(2);
  });

  it('should persist optional flags as false when omitted', async() => {
    const input = makeCreateResaleInput();
    delete (input as { receivesSupportEmail?: boolean }).receivesSupportEmail;
    delete (input as { servedByRoot?: boolean }).servedByRoot;
    delete (input as { manufacturerResale?: boolean }).manufacturerResale;
    delete (input as { indicatorResale?: boolean }).indicatorResale;
    delete (input as { recurringResale?: boolean }).recurringResale;

    await sut.execute(input);

    const row = await prisma.resale.findFirst();
    expect(row?.receivesSupportEmail).toBe(false);
    expect(row?.servedByRoot).toBe(false);
    expect(row?.manufacturerResale).toBe(false);
    expect(row?.indicatorResale).toBe(false);
    expect(row?.recurringResale).toBe(false);
  });

  it('should persist true when optional boolean flags are provided', async() => {
    await sut.execute(
      makeCreateResaleInput({
        receivesSupportEmail: true,
        servedByRoot: true,
        manufacturerResale: true,
        indicatorResale: true,
        recurringResale: true,
      }),
    );

    const row = await prisma.resale.findFirst();
    expect(row?.receivesSupportEmail).toBe(true);
    expect(row?.servedByRoot).toBe(true);
    expect(row?.manufacturerResale).toBe(true);
    expect(row?.indicatorResale).toBe(true);
    expect(row?.recurringResale).toBe(true);
  });

  it('should persist extended optional fields when provided', async() => {
    const validityIso = '2026-11-20T15:30:00.000Z';

    const { id } = await sut.execute(
      makeCreateResaleInput({
        nickname: 'Loja Norte',
        validityDate: validityIso,
        accessEmail: 'painel@loja.com',
        accessPassword: 'armazenado',
        paymentDay: 7,
        bonus: 42,
        billingStartDay: 14,
        servedByRoot: true,
        manufacturerResale: true,
        indicatorResale: false,
        recurringResale: true,
      }),
    );

    const row = await prisma.resale.findUniqueOrThrow({ where: { id } });

    expect(row.nickname).toBe('Loja Norte');
    expect(row.validityDate?.toISOString()).toBe(validityIso);
    expect(row.accessEmail).toBe('painel@loja.com');
    expect(row.accessPassword).toBe('armazenado');
    expect(row.paymentDay).toBe(7);
    expect(row.bonus).toBe(42);
    expect(row.billingStartDay).toBe(14);
    expect(row.servedByRoot).toBe(true);
    expect(row.manufacturerResale).toBe(true);
    expect(row.indicatorResale).toBe(false);
    expect(row.recurringResale).toBe(true);
  });

  it('should create with explicit id and bump sequence to at least id + 1', async() => {
    const explicitId = 500;

    const { id } = await sut.execute(makeCreateResaleInput({ id: explicitId }));

    expect(id).toBe(explicitId);

    const seq = await prisma.resaleSequence.findUniqueOrThrow({ where: { id: 1 } });
    expect(seq.nextId).toBeGreaterThanOrEqual(explicitId + 1);
  });

  it('should throw ResaleIdAlreadyTakenError when explicit id already exists', async() => {
    await sut.execute(makeCreateResaleInput({ id: 100, document: '09.748.165/0001-10' }));

    await expect(
      sut.execute(
        makeCreateResaleInput({
          id: 100,
          name: 'Outra',
          document: '28.695.096/0001-79',
        }),
      ),
    ).rejects.toThrow(ResaleIdAlreadyTakenError);
    await expect(
      sut.execute(
        makeCreateResaleInput({
          id: 100,
          name: 'Outra',
          document: '28.695.096/0001-79',
        }),
      ),
    ).rejects.toThrow('O id 100 já está em uso.');
  });

  it('should throw DocumentAlreadyTakenError when document is already used (normalized)', async() => {
    await sut.execute(makeCreateResaleInput());

    await expect(
      sut.execute(
        makeCreateResaleInput({
          name: 'Duplicada',
          document: '09.748.165/0001-10',
        }),
      ),
    ).rejects.toThrow(DocumentAlreadyTakenError);
    await expect(
      sut.execute(
        makeCreateResaleInput({
          name: 'Duplicada',
          document: '09.748.165/0001-10',
        }),
      ),
    ).rejects.toThrow('O documento 09748165000110 já está em uso.');
  });

  it('should treat same document with different masking as duplicate', async() => {
    await sut.execute(makeCreateResaleInput({ document: '09748165000110' }));

    await expect(
      sut.execute(
        makeCreateResaleInput({
          name: 'Dup',
          document: '09.748.165/0001-10',
        }),
      ),
    ).rejects.toThrow(DocumentAlreadyTakenError);
  });

  it('should persist profilePictureUrl after upload when file is provided', async() => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'avatar.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('fake'),
      size: 500,
      destination: '',
      filename: '',
      path: '',
      stream: undefined as any,
    };

    const expectedUrl = 'http://fake-url.com/profile.png';
    const uploadSpy = jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: expectedUrl });

    const { id } = await sut.execute(makeCreateResaleInput(), mockFile);

    expect(uploadSpy).toHaveBeenCalledWith(expect.objectContaining({ originalname: 'avatar.png' }), 'resales/1/profile-picture');

    const row = await prisma.resale.findUnique({ where: { id } });
    expect(row?.profilePictureUrl).toBe(expectedUrl);

    uploadSpy.mockRestore();
  });
});
