import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { SellerDuplicateEmailError } from 'src/app/seller/domain/errors/duplicate-email.error';
import { SellerModule } from 'src/app/seller/seller.module';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { CreateSeller } from './create-seller.service';
import { CreateSellerInputDto } from './dtos/create-seller.dto';

describe('CreateSeller', () => {
  let sut: CreateSeller;
  let sellerDao: ISellerDao;
  let sellerRepository: ISellerRepository;
  let findCompanyById: FindCompanyById;
  let uploadSingle: UploadSingle;

  const mockSellerDto: CreateSellerInputDto = {
    name: 'John Doe',
    nickname: 'Johnny',
    phone: '1122223333',
    cellphone: '11999998888',
    email: 'john@example.com',
    password: 'SecurePass123!',
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
    companyIds: ['company-id-1', 'company-id-2'],
  };

  describe('Unit Tests', () => {
    beforeEach(async() => {
      const module = await Test.createTestingModule({
        providers: [
          CreateSeller,
          {
            provide: TOKENS.SellerDao,
            useValue: createMock<ISellerDao>(),
          },
          {
            provide: TOKENS.SellerRepository,
            useValue: createMock<ISellerRepository>(),
          },
          {
            provide: FindCompanyById,
            useValue: createMock<FindCompanyById>(),
          },
          {
            provide: UploadSingle,
            useValue: createMock<UploadSingle>(),
          },
        ],
      }).compile();

      sut = module.get<CreateSeller>(CreateSeller);
      sellerDao = module.get<ISellerDao>(TOKENS.SellerDao);
      sellerRepository = module.get<ISellerRepository>(TOKENS.SellerRepository);
      findCompanyById = module.get<FindCompanyById>(FindCompanyById);
      uploadSingle = module.get<UploadSingle>(UploadSingle);
    });

    it('should be defined', () => {
      expect(sut).toBeDefined();
    });

    it('should throw SellerDuplicateEmailError when email already exists', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue({ email: mockSellerDto.email } as any);

      // Act & Assert
      await expect(sut.execute(mockSellerDto)).rejects.toThrow(SellerDuplicateEmailError);
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('should throw CompanyNotFoundError when company does not exist', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(findCompanyById, 'execute').mockRejectedValue(new CompanyNotFoundError());

      // Act & Assert
      await expect(sut.execute(mockSellerDto)).rejects.toThrow(CompanyNotFoundError);
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });

    it('should create seller without image', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue({} as any);
      jest.spyOn(sellerRepository, 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(mockSellerDto);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.id).toBeDefined();
      expect(sellerRepository.save).toHaveBeenCalledTimes(1);
      expect(uploadSingle.execute).not.toHaveBeenCalled();
    });

    it('should create seller with image', async() => {
      // Arrange
      const mockFile = createMock<Express.Multer.File>({
        mimetype: 'image/jpeg',
        size: 1024,
      });
      const mockImageUrl = 'https://cdn.example.com/avatar.jpg';

      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue({} as any);
      jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: mockImageUrl });
      jest.spyOn(sellerRepository, 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(mockSellerDto, mockFile);

      // Assert
      expect(result).toHaveProperty('id');
      expect(uploadSingle.execute).toHaveBeenCalledWith(mockFile, 'sellers/avatars');
      expect(sellerRepository.save).toHaveBeenCalledTimes(1);

      const savedSeller = (sellerRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedSeller.props.avatarUrl).toBe(mockImageUrl);
    });

    it('should verify all companies exist', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue({} as any);
      jest.spyOn(sellerRepository, 'save').mockResolvedValue();

      // Act
      await sut.execute(mockSellerDto);

      // Assert
      expect(findCompanyById.execute).toHaveBeenCalledTimes(2);
      expect(findCompanyById.execute).toHaveBeenNthCalledWith(1, 'company-id-1');
      expect(findCompanyById.execute).toHaveBeenNthCalledWith(2, 'company-id-2');
    });

    it('should hash password before saving', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue({} as any);
      jest.spyOn(sellerRepository, 'save').mockResolvedValue();

      // Act
      await sut.execute(mockSellerDto);

      // Assert
      expect(sellerRepository.save).toHaveBeenCalledTimes(1);
      const hashedPassword = (sellerRepository.save as jest.Mock).mock.calls[0][1];
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(mockSellerDto.password);
      expect(hashedPassword.length).toBeGreaterThan(20);
    });

    it('should create seller with null optional fields', async() => {
      // Arrange
      const dtoWithNulls: CreateSellerInputDto = {
        ...mockSellerDto,
        nickname: null,
        complement: null,
        reference: null,
        observation: null,
      };

      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue({} as any);
      jest.spyOn(sellerRepository, 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(dtoWithNulls);

      // Assert
      expect(result).toHaveProperty('id');
      expect(sellerRepository.save).toHaveBeenCalledTimes(1);

      const savedSeller = (sellerRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedSeller.props.nickname).toBeNull();
      expect(savedSeller.props.complement).toBeNull();
      expect(savedSeller.props.reference).toBeNull();
      expect(savedSeller.props.observation).toBeNull();
      expect(savedSeller.props.avatarUrl).toBeNull();
    });

    it('should upload image to correct folder', async() => {
      // Arrange
      const mockFile = createMock<Express.Multer.File>({
        mimetype: 'image/png',
        size: 2048,
      });
      const mockImageUrl = 'https://cdn.example.com/sellers/avatars/image.png';

      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue({} as any);
      jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: mockImageUrl });
      jest.spyOn(sellerRepository, 'save').mockResolvedValue();

      // Act
      await sut.execute(mockSellerDto, mockFile);

      // Assert
      expect(uploadSingle.execute).toHaveBeenCalledWith(mockFile, 'sellers/avatars');
      expect(uploadSingle.execute).toHaveBeenCalledTimes(1);
    });

    it('should check email before verifying companies', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue({ email: mockSellerDto.email } as any);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue({} as any);

      // Act & Assert
      await expect(sut.execute(mockSellerDto)).rejects.toThrow(SellerDuplicateEmailError);
      expect(findCompanyById.execute).not.toHaveBeenCalled();
    });

    it('should return seller id after creation', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue({} as any);
      jest.spyOn(sellerRepository, 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(mockSellerDto);

      // Assert
      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });

    it('should propagate upload errors', async() => {
      // Arrange
      const mockFile = createMock<Express.Multer.File>({
        mimetype: 'image/jpeg',
        size: 1024,
      });
      const uploadError = new Error('S3 upload failed');

      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue({} as any);
      jest.spyOn(uploadSingle, 'execute').mockRejectedValue(uploadError);

      // Act & Assert
      await expect(sut.execute(mockSellerDto, mockFile)).rejects.toThrow('S3 upload failed');
      expect(uploadSingle.execute).toHaveBeenCalledWith(mockFile, 'sellers/avatars');
      expect(sellerRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    let prisma: PrismaService;

    const createTestCompany = async(documentSuffix: string = '001') => {
      return await prisma.company.create({
        data: {
          name: `Test Company ${documentSuffix}`,
          fantasyName: `Test ${documentSuffix}`,
          document: `12345678${documentSuffix}190`,
          ie: `IE${documentSuffix}`,
          phone01: '1111111111',
          email01: `company${documentSuffix}@test.com`,
          zipCode: '12345678',
          street: 'Test St',
          number: '123',
          neighborhood: 'Test',
          city: 'Test City',
          state: 'TS',
          active: true,
        },
      });
    };

    beforeEach(async() => {
      const module = await Test.createTestingModule({
        imports: [
          SellerModule,
          ConfigModule,
          DatabaseModule,
        ],
      }).compile();

      sut = module.get<CreateSeller>(CreateSeller);
      prisma = module.get<PrismaService>(PrismaService);
      uploadSingle = module.get<UploadSingle>(UploadSingle);

      // Clean database
      await prisma.role.deleteMany();
      await prisma.account.deleteMany();
      await prisma.seller.deleteMany();
      await prisma.company.deleteMany();
    });

    afterEach(async() => {
      await prisma.role.deleteMany();
      await prisma.account.deleteMany();
      await prisma.seller.deleteMany();
      await prisma.company.deleteMany();
    });

    it('should create seller successfully in database', async() => {
      // Arrange
      const company = await createTestCompany();

      const sellerData: CreateSellerInputDto = {
        ...mockSellerDto,
        email: 'unique@test.com',
        companyIds: [company.id],
      };

      // Act
      const result = await sut.execute(sellerData);

      // Assert
      expect(result).toHaveProperty('id');

      const createdSeller = await prisma.seller.findUnique({
        where: { id: result.id },
      });

      expect(createdSeller).toBeDefined();
      expect(createdSeller?.name).toBe(sellerData.name);
      expect(createdSeller?.phone).toBe(sellerData.phone);
      expect(createdSeller?.active).toBe(true);
    });

    it('should create seller with hashed password', async() => {
      // Arrange
      const company = await createTestCompany();

      const sellerData: CreateSellerInputDto = {
        ...mockSellerDto,
        email: 'password-test@test.com',
        password: 'PlainPassword123!',
        companyIds: [company.id],
      };

      // Act
      const result = await sut.execute(sellerData);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: result.id },
        include: { role: { include: { account: true } } },
      });

      expect(seller).toBeDefined();
      expect(seller?.role.account.password).not.toBe('PlainPassword123!');
      expect(seller?.role.account.password.length).toBeGreaterThan(20);
      expect(seller?.role.account.password).toContain('$');
    });

    it('should throw error when email already exists in database', async() => {
      // Arrange
      const company = await createTestCompany();

      const account = await prisma.account.create({
        data: {
          email: 'duplicate@test.com',
          password: 'hashedPassword',
          status: 'active',
        },
      });

      const role = await prisma.role.create({
        data: {
          accountId: account.id,
          role: 'seller',
        },
      });

      await prisma.seller.create({
        data: {
          roleId: role.id,
          name: 'Existing Seller',
          phone: '1111111111',
          cellphone: '11999999999',
          commission: 10,
          zipCode: '12345678',
          street: 'Test St',
          number: '123',
          neighborhood: 'Test',
          city: 'Test City',
          state: 'TS',
          active: true,
        },
      });

      const sellerData: CreateSellerInputDto = {
        ...mockSellerDto,
        email: 'duplicate@test.com',
        companyIds: [company.id],
      };

      // Act & Assert
      await expect(sut.execute(sellerData)).rejects.toThrow(SellerDuplicateEmailError);
    });

    it('should throw error when company does not exist in database', async() => {
      // Arrange
      const sellerData: CreateSellerInputDto = {
        ...mockSellerDto,
        email: 'test-company@test.com',
        companyIds: ['non-existent-company-id'],
      };

      // Act & Assert
      await expect(sut.execute(sellerData)).rejects.toThrow(CompanyNotFoundError);
    });

    it('should create seller with multiple companies', async() => {
      // Arrange
      const company1 = await createTestCompany('001');
      const company2 = await createTestCompany('002');

      const sellerData: CreateSellerInputDto = {
        ...mockSellerDto,
        email: 'multi-company@test.com',
        companyIds: [company1.id, company2.id],
      };

      // Act
      const result = await sut.execute(sellerData);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: result.id },
        include: { companies: true },
      });

      expect(seller?.companies).toHaveLength(2);
      expect(seller?.companies.map(c => c.id)).toContain(company1.id);
      expect(seller?.companies.map(c => c.id)).toContain(company2.id);
    });

    it('should create seller with uploaded image', async() => {
      // Arrange
      const company = await createTestCompany();

      const mockFile = createMock<Express.Multer.File>({
        mimetype: 'image/jpeg',
        size: 1024,
      });

      const mockImageUrl = 'https://cdn.example.com/avatar-123.jpg';
      jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: mockImageUrl });

      const sellerData: CreateSellerInputDto = {
        ...mockSellerDto,
        email: 'with-image@test.com',
        companyIds: [company.id],
      };

      // Act
      const result = await sut.execute(sellerData, mockFile);

      // Assert
      const createdSeller = await prisma.seller.findUnique({
        where: { id: result.id },
      });

      expect(createdSeller?.avatarUrl).toBe(mockImageUrl);
    });

    it('should create seller with null optional fields', async() => {
      // Arrange
      const company = await createTestCompany();

      const sellerData: CreateSellerInputDto = {
        ...mockSellerDto,
        email: 'nulls@test.com',
        nickname: null,
        complement: null,
        reference: null,
        observation: null,
        companyIds: [company.id],
      };

      // Act
      const result = await sut.execute(sellerData);

      // Assert
      const createdSeller = await prisma.seller.findUnique({
        where: { id: result.id },
      });

      expect(createdSeller?.nickname).toBeNull();
      expect(createdSeller?.complement).toBeNull();
      expect(createdSeller?.reference).toBeNull();
      expect(createdSeller?.observation).toBeNull();
      expect(createdSeller?.avatarUrl).toBeNull();
    });

    it('should create account with seller email', async() => {
      // Arrange
      const company = await createTestCompany();

      const sellerData: CreateSellerInputDto = {
        ...mockSellerDto,
        email: 'account-email@test.com',
        companyIds: [company.id],
      };

      // Act
      const result = await sut.execute(sellerData);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: result.id },
        include: { role: { include: { account: true } } },
      });

      expect(seller?.role.account.email).toBe('account-email@test.com');
    });

    it('should create role with seller type', async() => {
      // Arrange
      const company = await createTestCompany();

      const sellerData: CreateSellerInputDto = {
        ...mockSellerDto,
        email: 'role-test@test.com',
        companyIds: [company.id],
      };

      // Act
      const result = await sut.execute(sellerData);

      // Assert
      const seller = await prisma.seller.findUnique({
        where: { id: result.id },
        include: { role: true },
      });

      expect(seller?.role.role).toBe(AccountRole.SELLER);
    });
  });
});
