import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerNotFoundError } from '../../../domain/errors/seller-not-found.error';
import { SellerModule } from '../../../seller.module';
import { CreateSeller } from '../create-seller/create-seller.service';
import { DeactivateSeller } from './deactivate-seller.service';

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

    await sut.execute(id);

    const updated = await prisma.seller.findUnique({ where: { id } });
    expect(updated?.active).toBe(false);
  });

  it('should throw SellerNotFoundError when seller does not exist', async() => {
    await expect(sut.execute(999)).rejects.toThrow(SellerNotFoundError);
  });
});
