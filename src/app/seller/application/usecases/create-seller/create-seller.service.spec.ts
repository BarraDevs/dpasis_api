import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountStatus } from 'src/app/account/domain/enums/account-status.enum';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { SellerDuplicateEmailError } from 'src/app/seller/domain/errors/duplicate-email.error';
import { SellerModule } from 'src/app/seller/seller.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerDto } from '../../dtos/seller.dto';
import { FindSellerById } from '../find-seller-by-id/find-seller-by-id.service';
import { CreateSeller } from './create-seller.service';
import { CreateSellerInputDto, CreateSellerOutputDto } from './dtos/create-seller.dto';

describe('CreateSeller', () => {
  let sut: CreateSeller;
  let prisma: PrismaService;
  let findSellerById: FindSellerById;
  let data: CreateSellerInputDto;
  let companyId: string;
  let createCompany: CreateCompany;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SellerModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateSeller);
    findSellerById = module.get(FindSellerById);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);

    await prisma.seller.deleteMany();
    await prisma.role.deleteMany();
    await prisma.account.deleteMany();
    await prisma.company.deleteMany();

    companyId = (await createCompany.execute({
      name: 'name teste',
      fantasyName: 'fantasyName teste',
      document: '61067756000142',
      ie: 'ie teste',
      zipCode: 'zipCode teste',
      street: 'street teste',
      number: 'number teste',
      neighborhood: 'neighborhood teste',
      complement: null,
      reference: null,
      city: 'city teste',
      state: 'state teste',
      cellphone: '2299887766',
      phone01: '3399887766',
      phone02: null,
      email01: 'email01@teste.com',
      email02: 'email02@teste.com',
    })).id;

    data = {
      name: 'John Doe',
      nickname: 'Johnny',
      phone: '1122223333',
      cellphone: '11999998888',
      email: 'seller@email.com',
      commission: 10,
      zipCode: '01310100',
      street: 'Avenida Paulista',
      number: '1000',
      complement: 'Sala 101',
      reference: 'Próximo ao metrô',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      observation: 'Vendedor experiente',
      avatarUrl: 'https://example.com/avatar.jpg',
      companyIds: [companyId],
    };
  });

  afterEach(async() => {
    await prisma.seller.deleteMany();
    await prisma.role.deleteMany();
    await prisma.account.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw an error if email is duplicate', async() => {
      // Arrange
      const sellerData = createMock<SellerDto>();
      const findByEmailSpy = jest.spyOn(sut['sellerDao'], 'findByEmail').mockResolvedValue(sellerData);
      const saveSpy = jest.spyOn(sut['sellerRepository'], 'save').mockResolvedValue();
      const seller = Seller.create(data);

      // Act & Assert
      expect.assertions(3);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(SellerDuplicateEmailError);
        expect(findByEmailSpy).toHaveBeenCalledWith(seller.props.email);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw an error if company does not exist', async() => {
      // Arrange
      const invalidData = { ...data, companyIds: ['non-existent-company-id'] };
      const findByEmailSpy = jest.spyOn(sut['sellerDao'], 'findByEmail').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['sellerRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
        expect(findByEmailSpy).toHaveBeenCalledWith(invalidData.email);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should create a seller and return its id', async() => {
      // Arrange
      const findByEmailSpy = jest.spyOn(sut['sellerDao'], 'findByEmail').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['sellerRepository'], 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(data);

      // Assert
      expect(findByEmailSpy).toHaveBeenCalledWith(data.email);
      expect(saveSpy).toHaveBeenCalledWith(expect.any(Seller), expect.any(String));
      expect(result).toEqual<CreateSellerOutputDto>({ id: result.id });
    });
  });

  describe('integration tests', () => {
    it('should throw an error if email is duplicate', async() => {
      // Arrange
      await sut.execute(data);
      const newData = { ...data, email: 'seller@email.com' };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(newData).catch((error) => {
        expect(error).toBeInstanceOf(SellerDuplicateEmailError);
      });
    });

    it('should throw an error if company does not exist', async() => {
      // Arrange
      const invalidData = { ...data, companyIds: ['non-existent-company-id'] };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
      });
    });

    it('should persist the seller in the database', async() => {
      // Act
      const createResult = await sut.execute(data);
      const sellerDto = await findSellerById.execute(createResult.id);

      // Assert
      expect(sellerDto).toBeDefined();
      expect(sellerDto).toEqual<SellerDto>({
        id: createResult.id,
        name: data.name,
        nickname: data.nickname,
        phone: data.phone,
        cellphone: data.cellphone,
        email: data.email,
        commission: data.commission,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        reference: data.reference,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        observation: data.observation,
        avatarUrl: data.avatarUrl,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: expect.arrayContaining([
          expect.objectContaining({
            id: companyId,
          }),
        ]),
      });
    });

    it('should create an account for the seller', async() => {
      // Act
      await sut.execute(data);

      // Assert
      const account = await prisma.account.findFirst({
        where: { email: data.email },
      });
      expect(account).toBeDefined();
      expect(account?.email).toBe(data.email);
      expect(account?.password).toBeDefined();
    });

    it('should create a role for the seller', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: createResult.id },
        include: { role: true },
      });
      expect(seller?.role).toBeDefined();
      expect(seller?.role.role).toBe('SELLER');
    });

    it('should link seller to role correctly', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: createResult.id },
        include: { role: true },
      });
      expect(seller).toBeDefined();
      expect(seller?.roleId).toBeDefined();
      expect(seller?.roleId).toBe(seller?.role.id);
    });

    it('should link role to account correctly', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: createResult.id },
        include: {
          role: {
            include: {
              account: true,
            },
          },
        },
      });
      expect(seller?.role).toBeDefined();
      expect(seller?.role.accountId).toBeDefined();
      expect(seller?.role.account).toBeDefined();
      expect(seller?.role.accountId).toBe(seller?.role.account.id);
    });

    it('should create account with ACTIVE status', async() => {
      // Act
      await sut.execute(data);

      // Assert
      const account = await prisma.account.findFirst({
        where: { email: data.email },
      });
      expect(account).toBeDefined();
      expect(account?.status).toBe(AccountStatus.ACTIVE);
    });

    it('should link seller, role and account in cascade', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: createResult.id },
        include: {
          role: {
            include: {
              account: true,
            },
          },
        },
      });

      expect(seller).toBeDefined();
      expect(seller?.role).toBeDefined();
      expect(seller?.role.account).toBeDefined();

      // Verify the cascade relationship
      expect(seller?.id).toBe(createResult.id);
      expect(seller?.roleId).toBe(seller?.role.id);
      expect(seller?.role.accountId).toBe(seller?.role.account.id);
      expect(seller?.role.account.email).toBe(data.email);
    });

    it('should create account with same email as seller', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: createResult.id },
        include: {
          role: {
            include: {
              account: true,
            },
          },
        },
      });

      expect(seller?.role.account.email).toBe(data.email);

      const account = await prisma.account.findFirst({
        where: { email: data.email },
      });
      expect(account?.email).toBe(data.email);
    });

    it('should create only one account per seller', async() => {
      // Act
      await sut.execute(data);

      // Assert
      const accounts = await prisma.account.findMany({
        where: { email: data.email },
      });
      expect(accounts).toHaveLength(1);
    });

    it('should create only one role per seller', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const roles = await prisma.role.findMany({
        where: {
          seller: {
            id: createResult.id,
          },
        },
      });
      expect(roles).toHaveLength(1);
    });

    it('should prevent creation of seller with duplicate account email', async() => {
      // Arrange
      await sut.execute(data);
      const duplicateData = {
        ...data,
        name: 'Jane Doe',
        phone: '2233334444',
        cellphone: '22988887777',
        email: data.email, // Same email
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(duplicateData).catch((error) => {
        expect(error).toBeInstanceOf(SellerDuplicateEmailError);
      });
    });

    it('should create role with SELLER type only', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: createResult.id },
        include: { role: true },
      });
      expect(seller?.role.role).toBe('SELLER');
      expect(seller?.role.role).not.toBe('ADMIN');
      expect(seller?.role.role).not.toBe('USER');
    });

    it('should maintain referential integrity between seller, role and account', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: createResult.id },
        include: {
          role: {
            include: {
              account: true,
            },
          },
        },
      });

      // Check all IDs are unique and properly linked
      expect(seller?.id).toBeDefined();
      expect(seller?.roleId).toBeDefined();
      expect(seller?.role.id).toBeDefined();
      expect(seller?.role.accountId).toBeDefined();
      expect(seller?.role.account.id).toBeDefined();

      // Verify relationships
      expect(seller?.roleId).toBe(seller?.role.id);
      expect(seller?.role.accountId).toBe(seller?.role.account.id);

      // Verify IDs are different from each other
      expect(seller?.id).not.toBe(seller?.role.id);
      expect(seller?.role.id).not.toBe(seller?.role.account.id);
    });

    it('should retrieve account through role relationship', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: createResult.id },
        include: {
          role: {
            include: {
              account: true,
            },
          },
        },
      });

      expect(seller).toBeDefined();
      expect(seller?.role).toBeDefined();
      expect(seller?.role.account).toBeDefined();
      expect(seller?.role.account.email).toBe(data.email);
    });

    it('should ensure account can be accessed through seller', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: createResult.id },
        include: {
          role: {
            include: {
              account: true,
            },
          },
        },
      });

      expect(seller).toBeDefined();
      expect(seller?.role).toBeDefined();
      expect(seller?.role.account).toBeDefined();
      expect(seller?.role.account.email).toBe(data.email);
      expect(seller?.role.account.status).toBe(AccountStatus.ACTIVE);
    });
  });
});
