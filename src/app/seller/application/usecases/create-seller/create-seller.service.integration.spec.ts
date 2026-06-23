import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import { InvalidCommissionError } from 'src/shared/value-objects/commission/commision.vo.error';
import { SellerModule } from '../../../seller.module';
import { CreateSeller } from './create-seller.service';
import { CreateSellerInputDto } from './dtos/create-seller.dto';

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
    email: `joao-${Date.now()}@vendedor.com`,
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

describe('CreateSeller - Integration tests', () => {
  let sut: CreateSeller;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [SellerModule],
    }).compile();

    sut = module.get(CreateSeller);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should create seller and persist in database', async() => {
    // Arrange
    const input = makeValidCreateSellerInput();

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeGreaterThan(0);

    const saved = await prisma.seller.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe('João Silva');
    expect(saved?.active).toBe(true);
    expect(saved?.commission).toBe(10.5);
    expect(saved?.profilePictureUrl).toBeNull();
  });

  it('should persist profilePictureUrl after upload when file is provided', async() => {
    // Arrange
    const input = makeValidCreateSellerInput();

    // Act
    const result = await sut.execute(input, mockFile);

    // Assert
    const saved = await prisma.seller.findUnique({ where: { id: result.id } });
    expect(saved?.profilePictureUrl).toMatch(/^http:\/\/fake-url\.com\//);
  });

  it('should throw EmailAlreadyTakenError when email already exists', async() => {
    // Arrange
    const input = makeValidCreateSellerInput();
    await sut.execute(input);

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(EmailAlreadyTakenError);
  });

  it('should throw when commission is invalid', async() => {
    // Arrange
    const input = makeValidCreateSellerInput({ commission: 150 });

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(InvalidCommissionError);
  });

  it('should throw when name is empty', async() => {
    // Arrange
    const input = makeValidCreateSellerInput({ name: '' });

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow('O campo name não pode ser vazio');
  });
});
