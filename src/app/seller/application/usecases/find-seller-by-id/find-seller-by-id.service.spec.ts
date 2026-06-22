import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerNotFoundError } from '../../../domain/errors/seller-not-found.error';
import { SellerModule } from '../../../seller.module';
import { CreateSeller } from '../create-seller/create-seller.service';
import { FindSellerById } from './find-seller-by-id.service';

describe('FindSellerById - Integration tests', () => {
  let sut: FindSellerById;
  let createSeller: CreateSeller;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [SellerModule],
    }).compile();

    sut = module.get(FindSellerById);
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

  it('should return seller by id', async() => {
    const { id } = await createSeller.execute({
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

    const result = await sut.execute(id);

    expect(result.id).toBe(id);
    expect(result.name).toBe('João Silva');
  });

  it('should throw SellerNotFoundError when seller does not exist', async() => {
    await expect(sut.execute(999)).rejects.toThrow(SellerNotFoundError);
  });

  it('should throw SellerNotFoundError when onlyActive and seller is inactive', async() => {
    const { id } = await createSeller.execute({
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

    await prisma.seller.update({ where: { id }, data: { active: false } });

    await expect(sut.execute(id, { onlyActive: true })).rejects.toThrow(SellerNotFoundError);
  });
});
