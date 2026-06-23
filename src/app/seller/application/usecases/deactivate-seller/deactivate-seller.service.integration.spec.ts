import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerNotFoundError } from '../../../domain/errors/seller-not-found.error';
import { SellerModule } from '../../../seller.module';
import { CreateSeller } from '../create-seller/create-seller.service';
import { CreateSellerInputDto } from '../create-seller/dtos/create-seller.dto';
import { DeactivateSeller } from './deactivate-seller.service';

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

describe('DeactivateSeller - Integration tests', () => {
  let sut: DeactivateSeller;
  let createSeller: CreateSeller;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [SellerModule],
    }).compile();

    sut = module.get(DeactivateSeller);
    createSeller = module.get(CreateSeller);
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

  it('should deactivate seller', async() => {
    // Arrange
    const { id } = await createSeller.execute(makeValidCreateSellerInput());

    // Act
    await sut.execute(id);

    // Assert
    const updated = await prisma.seller.findUnique({ where: { id } });
    expect(updated?.active).toBe(false);
  });

  it('should remain inactive when deactivating an already inactive seller', async() => {
    // Arrange
    const { id } = await createSeller.execute(makeValidCreateSellerInput());
    await sut.execute(id);

    // Act
    const result = await sut.execute(id);

    // Assert
    const updated = await prisma.seller.findUnique({ where: { id } });
    expect(updated?.active).toBe(false);
    expect(result).toEqual({ message: 'Vendedor desativado com sucesso' });
  });

  it('should throw SellerNotFoundError when seller does not exist', async() => {
    await expect(sut.execute(999)).rejects.toThrow(SellerNotFoundError);
  });
});
