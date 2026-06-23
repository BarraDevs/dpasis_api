import { Test } from '@nestjs/testing';
import { UploadFileQueueFakeAdapterProducer } from 'src/app/upload-file/infra/driven/queue/fake/upload-file-queue-fake.producer';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { SellerModule } from '../../../seller.module';
import { CreateSeller } from '../create-seller/create-seller.service';
import { CreateSellerInputDto } from '../create-seller/dtos/create-seller.dto';
import { DeleteSeller } from './delete-seller.service';

const mockFile = {
  fieldname: 'file',
  originalname: 'photo.png',
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

describe('DeleteSeller - Integration tests', () => {
  let sut: DeleteSeller;
  let createSeller: CreateSeller;
  let prisma: PrismaService;
  let uploadQueue: UploadFileQueueFakeAdapterProducer;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [SellerModule],
    }).compile();

    sut = module.get(DeleteSeller);
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

  it('should delete seller from database', async() => {
    // Arrange
    const { id } = await createSeller.execute(makeValidCreateSellerInput());

    // Act
    await sut.execute(id);

    // Assert
    const deleted = await prisma.seller.findUnique({ where: { id } });
    expect(deleted).toBeNull();
  });

  it('should enqueue delete job when seller has profile picture', async() => {
    // Arrange
    const { id } = await createSeller.execute(makeValidCreateSellerInput(), mockFile);
    const profilePictureUrl = (await prisma.seller.findUnique({ where: { id } }))?.profilePictureUrl;

    // Act
    await sut.execute(id);

    // Assert
    expect(uploadQueue.addedDeleteJobs).toHaveLength(1);
    expect(uploadQueue.addedDeleteJobs[0]).toEqual({
      name: JobName.DeleteFile,
      data: { fileUrl: profilePictureUrl },
    });
  });

  it('should not enqueue delete job when seller has no profile picture', async() => {
    // Arrange
    const { id } = await createSeller.execute(makeValidCreateSellerInput());

    // Act
    await sut.execute(id);

    // Assert
    expect(uploadQueue.addedDeleteJobs).toHaveLength(0);
  });

  it('should return success message', async() => {
    // Arrange
    const { id } = await createSeller.execute(makeValidCreateSellerInput());

    // Act
    const result = await sut.execute(id);

    // Assert
    expect(result).toEqual({ message: 'Vendedor excluído com sucesso' });
  });
});
