import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { SellerFactory } from 'src/app/seller/domain/factories/seller.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerModule } from '../../../seller.module';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { CreateSeller } from '../create-seller/create-seller.service';
import { DeleteSeller } from './delete-seller.service';

describe('DeleteSeller - Unit tests', () => {
  let sut: DeleteSeller;
  let sellerRepository: ISellerRepository;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        DeleteSeller,
        {
          provide: TOKENS.SellerRepository,
          useValue: createMock<ISellerRepository>(),
        },
      ],
    }).compile();

    sut = module.get(DeleteSeller);
    sellerRepository = module.get(TOKENS.SellerRepository);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw SellerNotFoundError when seller does not exist', async() => {
    jest.spyOn(sellerRepository, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1)).rejects.toThrow(SellerNotFoundError);
  });

  it('should call repository.delete with correct id', async() => {
    const seller = SellerFactory.create({
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
    jest.spyOn(sellerRepository, 'findById').mockResolvedValue(seller);
    const deleteSpy = jest.spyOn(sellerRepository, 'delete');

    await sut.execute(1);

    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it('should return success message', async() => {
    jest.spyOn(sellerRepository, 'findById').mockResolvedValue(createMock<Seller>());

    const result = await sut.execute(1);

    expect(result).toEqual<SuccessMessage>({ message: 'Vendedor excluído com sucesso' });
  });

  it('should not call delete when seller does not exist', async() => {
    jest.spyOn(sellerRepository, 'findById').mockResolvedValue(null);
    const deleteSpy = jest.spyOn(sellerRepository, 'delete');

    await expect(sut.execute(1)).rejects.toThrow(SellerNotFoundError);
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});

describe('DeleteSeller - Integration tests', () => {
  let sut: DeleteSeller;
  let createSeller: CreateSeller;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [SellerModule],
    }).compile();

    sut = module.get(DeleteSeller);
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

  it('should delete seller from database', async() => {
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

    const deleted = await prisma.seller.findUnique({ where: { id } });
    expect(deleted).toBeNull();
  });
});
