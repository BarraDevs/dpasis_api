import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerModule } from '../../../seller.module';
import { CreateSeller } from '../create-seller/create-seller.service';
import { FindAllSeller } from './find-all-seller.service';

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

  it('should return paginated sellers', async() => {
    await createSeller.execute({
      name: 'João Silva',
      phone: '1133334444',
      nickname: null,
      whatsapp: '11999998888',
      email: 'joao@vendedor.com',
      commission: 10,
      profilePictureUrl: null,
      observation: null,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.totalItems).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('João Silva');
  });

  it('should filter by search', async() => {
    await createSeller.execute({
      name: 'João Silva',
      phone: '1133334444',
      nickname: null,
      whatsapp: '11999998888',
      email: 'joao@vendedor.com',
      commission: 10,
      profilePictureUrl: null,
      observation: null,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '1000',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });

    await createSeller.execute({
      name: 'Maria Santos',
      phone: '1144445555',
      nickname: null,
      whatsapp: '11888887777',
      email: 'maria@vendedor.com',
      commission: 15,
      profilePictureUrl: null,
      observation: null,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '2000',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });

    const result = await sut.execute({ page: 1, size: 10, search: 'Maria' });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].name).toBe('Maria Santos');
  });
});
