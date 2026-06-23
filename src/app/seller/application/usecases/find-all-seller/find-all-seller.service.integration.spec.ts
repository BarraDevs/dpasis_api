import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerDto } from '../../dtos/seller.dto';
import { SellerModule } from '../../../seller.module';
import { CreateSeller } from '../create-seller/create-seller.service';
import { CreateSellerInputDto } from '../create-seller/dtos/create-seller.dto';
import { FindAllSeller } from './find-all-seller.service';

function makeValidCreateSellerInput(overrides: Partial<CreateSellerInputDto> = {}): CreateSellerInputDto {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    name: 'João Silva',
    phone: '1133334444',
    nickname: null,
    whatsapp: '11999998888',
    email: `seller-${suffix}@vendedor.com`,
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

describe('FindAllSeller - Integration tests', () => {
  let sut: FindAllSeller;
  let createSeller: CreateSeller;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [SellerModule],
    }).compile();

    sut = module.get(FindAllSeller);
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

  it('should return empty results when no sellers exist', async() => {
    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return paginated sellers', async() => {
    // Arrange
    await createSeller.execute(makeValidCreateSellerInput());

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.totalItems).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('João Silva');
  });

  it('should filter by search', async() => {
    // Arrange
    await createSeller.execute(makeValidCreateSellerInput());
    await createSeller.execute(makeValidCreateSellerInput({
      name: 'Maria Santos',
      email: `maria-${Date.now()}@vendedor.com`,
      phone: '1144445555',
      whatsapp: '11888887777',
    }));

    // Act
    const result = await sut.execute({ page: 1, size: 10, search: 'Maria' });

    // Assert
    expect(result.totalItems).toBe(1);
    expect(result.data[0].name).toBe('Maria Santos');
  });

  it('should filter by active when active is true', async() => {
    // Arrange
    const { id: activeId } = await createSeller.execute(makeValidCreateSellerInput());
    const { id: inactiveId } = await createSeller.execute(makeValidCreateSellerInput({
      name: 'Maria Santos',
      email: `maria-${Date.now()}@vendedor.com`,
      phone: '1144445555',
      whatsapp: '11888887777',
    }));
    await prisma.seller.update({ where: { id: inactiveId }, data: { active: false } });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: true });

    // Assert
    expect(result.totalItems).toBe(1);
    expect(result.data[0].id).toBe(activeId);
    expect(result.data.every((s: SellerDto) => s.active)).toBe(true);
  });

  it('should paginate results correctly', async() => {
    // Arrange
    for (let i = 0; i < 3; i++) {
      await createSeller.execute(makeValidCreateSellerInput({
        name: `Vendedor ${i}`,
        email: `vendedor-${Date.now()}-${i}@vendedor.com`,
      }));
    }

    // Act
    const page1 = await sut.execute({ page: 1, size: 2 });
    const page2 = await sut.execute({ page: 2, size: 2 });

    // Assert
    expect(page1.data).toHaveLength(2);
    expect(page1.totalItems).toBe(3);
    expect(page1.totalPages).toBe(2);
    expect(page2.data).toHaveLength(1);
    expect(page2.currentPage).toBe(2);
  });
});
