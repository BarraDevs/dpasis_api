import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import { InvalidCommissionError } from 'src/shared/value-objects/commission/commision.vo.error';
import { SellerModule } from '../../../seller.module';
import { CreateSeller } from './create-seller.service';
import { CreateSellerInputDto } from './dtos/create-seller.dto';

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

  function makeValidInput(overrides: Partial<CreateSellerInputDto> = {}): CreateSellerInputDto {
    return {
      name: 'João Silva',
      phone: '1133334444',
      nickname: 'João',
      whatsapp: '11999998888',
      email: 'joao@vendedor.com',
      commission: 10.5,
      profilePictureUrl: null,
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

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('success path', () => {
    it('should create seller and persist in database', async() => {
      const input = makeValidInput();

      const result = await sut.execute(input);

      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('number');
      expect(result.id).toBeGreaterThan(0);

      const saved = await prisma.seller.findFirst({
        where: { email: 'joao@vendedor.com' },
      });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('João Silva');
      expect(saved?.active).toBe(true);
      expect(saved?.commission).toBe(10.5);
    });
  });

  describe('email already taken', () => {
    it('should throw EmailAlreadyTakenError when email already exists', async() => {
      const input = makeValidInput();

      await sut.execute(input);

      await expect(sut.execute(input)).rejects.toThrow(EmailAlreadyTakenError);
    });
  });

  describe('validation (factory)', () => {
    it('should throw when commission is invalid', async() => {
      const input = makeValidInput({ commission: 150 });

      await expect(sut.execute(input)).rejects.toThrow(InvalidCommissionError);
    });

    it('should throw when name is empty', async() => {
      const input = makeValidInput({ name: '' });

      await expect(sut.execute(input)).rejects.toThrow('O campo name não pode ser vazio');
    });
  });
});
