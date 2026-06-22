import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import { SellerNotFoundError } from '../../../domain/errors/seller-not-found.error';
import { SellerModule } from '../../../seller.module';
import { CreateSeller } from '../create-seller/create-seller.service';
import { EditSeller } from './edit-seller.service';

describe('EditSeller - Integration tests', () => {
  let sut: EditSeller;
  let createSeller: CreateSeller;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [SellerModule],
    }).compile();

    sut = module.get(EditSeller);
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

  it('should edit seller', async() => {
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

    await sut.execute(id, { name: 'João Santos' });

    const updated = await prisma.seller.findUnique({ where: { id } });
    expect(updated?.name).toBe('João Santos');
  });

  it('should throw SellerNotFoundError when seller does not exist', async() => {
    await expect(sut.execute(999, { name: 'Test' })).rejects.toThrow(SellerNotFoundError);
  });

  it('should throw EmailAlreadyTakenError when email is taken by another seller', async() => {
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

    const { id } = await createSeller.execute({
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

    await expect(sut.execute(id, { email: 'joao@vendedor.com' })).rejects.toThrow(EmailAlreadyTakenError);
  });
});
