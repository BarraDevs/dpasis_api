import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyDto } from 'src/app/company/application/dtos/company.dto';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
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
  let createCompany: CreateCompany;
  let data: CreateSellerInputDto;
  let companyId01: string;
  let companyId02: string;

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

    await prisma.truncate();

    // Create first company
    companyId01 = (await createCompany.execute({
      name: 'Test Company 01',
      fantasyName: 'TC 01',
      document: '61067756000142',
      ie: 'ie teste 01',
      zipCode: '12345-678',
      street: 'Main Street',
      number: '100',
      neighborhood: 'Downtown',
      complement: null,
      reference: null,
      city: 'Test City',
      state: 'TC',
      cellphone: '11912345678',
      phone01: '1112345678',
      phone02: null,
      email01: 'company01@test.com',
      email02: 'company01.alt@test.com',
    })).id;

    // Create second company
    companyId02 = (await createCompany.execute({
      name: 'Test Company 02',
      fantasyName: 'TC 02',
      document: '73321315000104',
      ie: 'ie teste 02',
      zipCode: '87654-321',
      street: 'Second Street',
      number: '200',
      neighborhood: 'Uptown',
      complement: null,
      reference: null,
      city: 'Another City',
      state: 'AC',
      cellphone: '21912345678',
      phone01: '2112345678',
      phone02: null,
      email01: 'company02@test.com',
      email02: 'company02.alt@test.com',
    })).id;

    data = {
      name: 'John Doe Seller',
      nickname: 'JD',
      phone: '1134567890',
      cellphone: '11987654321',
      email: 'john.seller@test.com',
      password: 'SecurePassword123',
      commission: 10,
      zipCode: '11111-111',
      street: 'Seller Street',
      number: '500',
      complement: 'Apt 101',
      reference: 'Near the mall',
      neighborhood: 'Seller Neighborhood',
      city: 'Seller City',
      state: 'SC',
      observation: 'Top seller',
      companyIds: [companyId01],
    };
  });

  afterEach(async() => {
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
      const seller = Seller.create({ ...data, avatarUrl: null });

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

    it('should throw an error if company is not active', async() => {
      // Arrange
      const input = { ...data, companyIds: [companyId01] };
      const company = createMock<CompanyDto>({
        active: false,
        fantasyName: 'Inactive Company',
      });
      const findByEmailSpy = jest.spyOn(sut['sellerDao'], 'findByEmail').mockResolvedValue(null);
      const findCompanySpy = jest.spyOn(sut['findCompanyById'], 'execute').mockResolvedValue(company);
      const saveSpy = jest.spyOn(sut['sellerRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(5);
      return sut.execute(input).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotActiveError);
        expect(error.message).toContain('Inactive Company');
        expect(findByEmailSpy).toHaveBeenCalledWith(input.email);
        expect(findCompanySpy).toHaveBeenCalledWith(companyId01);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw an error if any company in the list is not active', async() => {
      // Arrange
      const input = { ...data, companyIds: [companyId01, companyId02] };
      const activeCompany = createMock<CompanyDto>({
        active: true,
        fantasyName: 'Active Company',
      });
      const inactiveCompany = createMock<CompanyDto>({
        active: false,
        fantasyName: 'Inactive Company 2',
      });
      const findByEmailSpy = jest.spyOn(sut['sellerDao'], 'findByEmail').mockResolvedValue(null);
      const findCompanySpy = jest.spyOn(sut['findCompanyById'], 'execute')
        .mockResolvedValueOnce(activeCompany)
        .mockResolvedValueOnce(inactiveCompany);
      const saveSpy = jest.spyOn(sut['sellerRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(6);
      return sut.execute(input).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotActiveError);
        expect(error.message).toContain('Inactive Company 2');
        expect(findByEmailSpy).toHaveBeenCalledWith(input.email);
        expect(findCompanySpy).toHaveBeenCalledTimes(2);
        expect(findCompanySpy).toHaveBeenCalledWith(companyId01);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should create a seller without image and return its id', async() => {
      // Arrange
      const findByEmailSpy = jest.spyOn(sut['sellerDao'], 'findByEmail').mockResolvedValue(null);
      const company = createMock<CompanyDto>({ active: true });
      const findCompanySpy = jest.spyOn(sut['findCompanyById'], 'execute').mockResolvedValue(company);
      const saveSpy = jest.spyOn(sut['sellerRepository'], 'save').mockResolvedValue();
      const uploadSpy = jest.spyOn(sut['uploadFileService'], 'execute');

      // Act
      const result = await sut.execute(data);

      // Assert
      expect(findByEmailSpy).toHaveBeenCalledWith(data.email);
      expect(findCompanySpy).toHaveBeenCalledWith(companyId01);
      expect(saveSpy).toHaveBeenCalledWith(expect.any(Seller), expect.any(String));
      expect(uploadSpy).not.toHaveBeenCalled();
      expect(result).toEqual<CreateSellerOutputDto>({ id: expect.any(String) });
    });

    it('should create a seller with image and return its id', async() => {
      // Arrange
      const mockImage = {
        fieldname: 'image',
        originalname: 'avatar.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size: 1024,
      } as Express.Multer.File;
      const mockImageUrl = 'https://storage.example.com/sellers/avatars/avatar.jpg';
      const findByEmailSpy = jest.spyOn(sut['sellerDao'], 'findByEmail').mockResolvedValue(null);
      const company = createMock<CompanyDto>({ active: true });
      const findCompanySpy = jest.spyOn(sut['findCompanyById'], 'execute').mockResolvedValue(company);
      const uploadSpy = jest.spyOn(sut['uploadFileService'], 'execute').mockResolvedValue({ url: mockImageUrl });
      const saveSpy = jest.spyOn(sut['sellerRepository'], 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(data, mockImage);

      // Assert
      expect(findByEmailSpy).toHaveBeenCalledWith(data.email);
      expect(findCompanySpy).toHaveBeenCalledWith(companyId01);
      expect(uploadSpy).toHaveBeenCalledWith(mockImage, 'sellers/avatars');
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          _props: expect.objectContaining({
            avatarUrl: mockImageUrl,
          }),
        }),
        expect.any(String),
      );
      expect(result).toEqual<CreateSellerOutputDto>({ id: expect.any(String) });
    });

    it('should hash the password before saving', async() => {
      // Arrange
      const company = createMock<CompanyDto>({ active: true });
      jest.spyOn(sut['findCompanyById'], 'execute').mockResolvedValue(company);
      const saveSpy = jest.spyOn(sut['sellerRepository'], 'save').mockResolvedValue();

      // Act
      await sut.execute(data);

      // Assert
      expect(saveSpy).toHaveBeenCalledWith(
        expect.any(Seller),
        expect.not.stringContaining(data.password), // Hashed password should be different
      );
      const hashedPassword = saveSpy.mock.calls[0][1];
      expect(hashedPassword).not.toBe(data.password);
      expect(hashedPassword).toBeTruthy();
    });

    it('should create a seller with multiple companies', async() => {
      // Arrange
      const multiCompanyData = { ...data, companyIds: [companyId01, companyId02] };
      const findByEmailSpy = jest.spyOn(sut['sellerDao'], 'findByEmail').mockResolvedValue(null);
      const company = createMock<CompanyDto>({ active: true });
      const findCompanySpy = jest.spyOn(sut['findCompanyById'], 'execute').mockResolvedValue(company);
      const saveSpy = jest.spyOn(sut['sellerRepository'], 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(multiCompanyData);

      // Assert
      expect(findByEmailSpy).toHaveBeenCalledWith(multiCompanyData.email);
      expect(findCompanySpy).toHaveBeenCalledTimes(2);
      expect(findCompanySpy).toHaveBeenCalledWith(companyId01);
      expect(findCompanySpy).toHaveBeenCalledWith(companyId02);
      expect(saveSpy).toHaveBeenCalledWith(expect.any(Seller), expect.any(String));
      expect(result).toEqual<CreateSellerOutputDto>({ id: expect.any(String) });
    });

    it('should create seller with null optional fields', async() => {
      // Arrange
      const minimalData: CreateSellerInputDto = {
        ...data,
        nickname: null,
        complement: null,
        reference: null,
        observation: null,
      };
      const company = createMock<CompanyDto>({ active: true });
      jest.spyOn(sut['findCompanyById'], 'execute').mockResolvedValue(company);
      const saveSpy = jest.spyOn(sut['sellerRepository'], 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(minimalData);

      // Assert
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          _props: expect.objectContaining({
            nickname: null,
            complement: null,
            reference: null,
            observation: null,
          }),
        }),
        expect.any(String),
      );
      expect(result).toEqual<CreateSellerOutputDto>({ id: expect.any(String) });
    });
  });

  describe('integration tests', () => {
    it('should throw an error if email is duplicate', async() => {
      // Arrange
      await sut.execute(data);

      // Act & Assert
      expect.assertions(1);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(SellerDuplicateEmailError);
      });
    });

    it('should throw an error if email is duplicate even with different casing', async() => {
      // Arrange
      await sut.execute(data);
      const uppercaseEmailData = { ...data, email: data.email.toUpperCase() };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(uppercaseEmailData).catch((error) => {
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

    it('should throw an error if company is not active', async() => {
      // Arrange
      await prisma.company.update({
        where: { id: companyId01 },
        data: { active: false },
      });

      // Act & Assert
      expect.assertions(1);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotActiveError);
      });
    });

    it('should throw an error if any company in the list is not active', async() => {
      // Arrange
      const multiCompanyData = { ...data, companyIds: [companyId01, companyId02] };
      await prisma.company.update({
        where: { id: companyId02 },
        data: { active: false },
      });

      // Act & Assert
      expect.assertions(1);
      return sut.execute(multiCompanyData).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotActiveError);
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
        avatarUrl: null,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: expect.arrayContaining([
          expect.objectContaining({
            id: companyId01,
          }),
        ]),
      });
    });

    it('should create seller with multiple companies', async() => {
      // Arrange
      const multiCompanyData = { ...data, companyIds: [companyId01, companyId02] };

      // Act
      const createResult = await sut.execute(multiCompanyData);
      const sellerDto = await findSellerById.execute(createResult.id);

      // Assert
      expect(sellerDto).toBeDefined();
      expect(sellerDto?.companies).toHaveLength(2);
      expect(sellerDto?.companies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: companyId01 }),
          expect.objectContaining({ id: companyId02 }),
        ]),
      );
    });

    it('should create seller without optional fields', async() => {
      // Arrange
      const minimalData: CreateSellerInputDto = {
        name: 'Minimal Seller',
        nickname: null,
        phone: '(11) 1111-1111',
        cellphone: '(11) 91111-1111',
        email: 'minimal@test.com',
        password: 'Password123',
        commission: 5,
        zipCode: '22222-222',
        street: 'Minimal Street',
        number: '10',
        complement: null,
        reference: null,
        neighborhood: 'Minimal Neighborhood',
        city: 'Minimal City',
        state: 'MC',
        observation: null,
        companyIds: [companyId01],
      };

      // Act
      const createResult = await sut.execute(minimalData);
      const sellerDto = await findSellerById.execute(createResult.id);

      // Assert
      expect(sellerDto).toBeDefined();
      expect(sellerDto?.nickname).toBeNull();
      expect(sellerDto?.complement).toBeNull();
      expect(sellerDto?.reference).toBeNull();
      expect(sellerDto?.observation).toBeNull();
      expect(sellerDto?.avatarUrl).toBeNull();
    });

    it('should hash the password and not store it in plain text', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const accountInDb = await prisma.account.findUnique({
        where: { id: createResult.id },
      });
      expect(accountInDb).toBeDefined();
      expect(accountInDb?.password).not.toBe(data.password);
    });

    it('should create seller with active status by default', async() => {
      // Act
      const createResult = await sut.execute(data);
      const sellerDto = await findSellerById.execute(createResult.id);

      // Assert
      expect(sellerDto?.active).toBe(true);
    });

    it('should validate commission value within allowed range', async() => {
      // Arrange
      const validCommissionData = { ...data, commission: 0 };

      // Act
      const result1 = await sut.execute(validCommissionData);

      // Assert
      expect(result1.id).toBeDefined();

      // Test upper boundary
      const maxCommissionData = { ...data, email: 'max@test.com', commission: 100 };
      const result2 = await sut.execute(maxCommissionData);
      expect(result2.id).toBeDefined();
    });

    it('should allow multiple sellers with different emails', async() => {
      // Arrange
      const seller1Data = data;
      const seller2Data = { ...data, email: 'another.seller@test.com', cellphone: '(11) 99999-9999' };

      // Act
      const result1 = await sut.execute(seller1Data);
      const result2 = await sut.execute(seller2Data);

      // Assert
      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
    });

    it('should create seller and associate with correct account', async() => {
      // Act
      const createResult = await sut.execute(data);

      // Assert
      const sellerInDb = await prisma.seller.findUnique({
        where: { id: createResult.id },
        include: { role: { include: { account: true } } },
      });
      expect(sellerInDb).toBeDefined();
      expect(sellerInDb?.role.account).toBeDefined();
      expect(sellerInDb?.role.account.email).toBe(data.email);
    });
  });
});
