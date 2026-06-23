import { Test } from '@nestjs/testing';
import { UploadFileQueueFakeAdapterProducer } from 'src/app/upload-file/infra/driven/queue/fake/upload-file-queue-fake.producer';
import { TOKENS } from 'src/core/di/token';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { SellerNotFoundError } from '../../../domain/errors/seller-not-found.error';
import { SellerModule } from '../../../seller.module';
import { CreateSeller } from '../create-seller/create-seller.service';
import { CreateSellerInputDto } from '../create-seller/dtos/create-seller.dto';
import { EditSeller } from './edit-seller.service';

const mockFile = {
  fieldname: 'file',
  originalname: 'new.png',
  encoding: '7bit',
  mimetype: 'image/png',
  buffer: Buffer.from(''),
  size: 200,
} as Express.Multer.File;

function makeValidCreateSellerInput(overrides: Partial<CreateSellerInputDto> = {}): CreateSellerInputDto {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    name: 'João Silva',
    phone: '1133334444',
    nickname: null,
    whatsapp: '11999998888',
    email: `joao-${suffix}@vendedor.com`,
    commission: 10,
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

describe('EditSeller - Integration tests', () => {
  let sut: EditSeller;
  let createSeller: CreateSeller;
  let prisma: PrismaService;
  let uploadQueue: UploadFileQueueFakeAdapterProducer;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [SellerModule],
    }).compile();

    sut = module.get(EditSeller);
    createSeller = module.get(CreateSeller);
    prisma = module.get(PrismaService);
    uploadQueue = module.get(TOKENS.UploadFileQueueProducer) as UploadFileQueueFakeAdapterProducer;
  });

  beforeEach(async() => {
    await prisma.truncate();
    uploadQueue.addedDeleteJobs.length = 0;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should edit seller', async() => {
    // Arrange
    const { id } = await createSeller.execute(makeValidCreateSellerInput());

    // Act
    await sut.execute(id, { name: 'João Santos' });

    // Assert
    const updated = await prisma.seller.findUnique({ where: { id } });
    expect(updated?.name).toBe('João Santos');
  });

  it('should throw SellerNotFoundError when seller does not exist', async() => {
    await expect(sut.execute(999, { name: 'Test' })).rejects.toThrow(SellerNotFoundError);
  });

  it('should throw EmailAlreadyTakenError when email is taken by another seller', async() => {
    // Arrange
    await createSeller.execute(makeValidCreateSellerInput({ email: 'joao@vendedor.com' }));
    const { id } = await createSeller.execute(makeValidCreateSellerInput({ email: 'maria@vendedor.com' }));

    // Act & Assert
    await expect(sut.execute(id, { email: 'joao@vendedor.com' })).rejects.toThrow(EmailAlreadyTakenError);
  });

  it('should persist profilePictureUrl after upload when file is provided', async() => {
    // Arrange
    const { id } = await createSeller.execute(makeValidCreateSellerInput());

    // Act
    await sut.execute(id, {}, mockFile);

    // Assert
    const row = await prisma.seller.findUnique({ where: { id } });
    expect(row?.profilePictureUrl).toMatch(/^http:\/\/fake-url\.com\//);
  });

  it('should enqueue delete job when replacing existing profile picture', async() => {
    // Arrange
    const { id } = await createSeller.execute(makeValidCreateSellerInput(), mockFile);
    const previousUrl = (await prisma.seller.findUnique({ where: { id } }))?.profilePictureUrl;
    uploadQueue.addedDeleteJobs.length = 0;

    // Act
    await sut.execute(id, {}, mockFile);

    // Assert
    expect(uploadQueue.addedDeleteJobs).toHaveLength(1);
    expect(uploadQueue.addedDeleteJobs[0]).toEqual({
      name: JobName.DeleteFile,
      data: { fileUrl: previousUrl },
    });
  });

  it('should return success message', async() => {
    // Arrange
    const { id } = await createSeller.execute(makeValidCreateSellerInput());

    // Act
    const result = await sut.execute(id, { name: 'João Santos' });

    // Assert
    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
  });
});
