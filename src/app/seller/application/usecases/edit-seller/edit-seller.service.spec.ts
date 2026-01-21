import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { CompanyDto } from 'src/app/company/application/dtos/company.dto';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { SellerDuplicateEmailError } from 'src/app/seller/domain/errors/duplicate-email.error';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { SellerModule } from 'src/app/seller/seller.module';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { DatabaseModule } from 'src/infra/database/database.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { EditSellerInputDto } from './dtos/edit-seller.dto';
import { EditSeller } from './edit-seller.service';

describe('EditSeller', () => {
  let sut: EditSeller;
  let sellerDao: ISellerDao;
  let sellerRepository: ISellerRepository;
  let findCompanyById: FindCompanyById;
  let uploadSingle: UploadSingle;

  const mockSellerData = {
    id: 'seller-id-123',
    name: 'John Doe',
    nickname: 'Johnny',
    phone: '1122223333',
    cellphone: '11999998888',
    email: 'john@example.com',
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
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    active: true,
    companies: [
      { id: 'company-id-1', name: 'Company 1' },
      { id: 'company-id-2', name: 'Company 2' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEditDto: EditSellerInputDto = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '1133334444',
  };

  describe('Unit Tests', () => {
    beforeEach(async() => {
      const module = await Test.createTestingModule({
        providers: [
          EditSeller,
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

      sut = module.get<EditSeller>(EditSeller);
      sellerDao = module.get<ISellerDao>(TOKENS.SellerDao);
      sellerRepository = module.get<ISellerRepository>(TOKENS.SellerRepository);
      findCompanyById = module.get<FindCompanyById>(FindCompanyById);
      uploadSingle = module.get<UploadSingle>(UploadSingle);
    });

    it('should be defined', () => {
      expect(sut).toBeDefined();
    });

    it('should throw SellerNotFoundError when seller does not exist', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute('non-existent-id', mockEditDto)).rejects.toThrow(SellerNotFoundError);
      expect(sellerRepository.edit).not.toHaveBeenCalled();
    });

    it('should throw SellerDuplicateEmailError when email already exists', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue({
        id: 'another-seller-id',
        email: mockEditDto.email,
      } as any);

      // Act & Assert
      await expect(sut.execute('seller-id-123', mockEditDto)).rejects.toThrow(SellerDuplicateEmailError);
      expect(sellerRepository.edit).not.toHaveBeenCalled();
    });

    it('should not check email duplicity when email is the same', async() => {
      // Arrange
      const editData: EditSellerInputDto = {
        name: 'John Updated',
        email: mockSellerData.email, // Same email
      };

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(sellerRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute('seller-id-123', editData);

      // Assert
      expect(sellerDao.findByEmail).not.toHaveBeenCalled();
      expect(sellerRepository.edit).toHaveBeenCalledTimes(1);
    });

    it('should not check email duplicity when email is not provided', async() => {
      // Arrange
      const editData: EditSellerInputDto = {
        name: 'John Updated',
      };

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(sellerRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute('seller-id-123', editData);

      // Assert
      expect(sellerDao.findByEmail).not.toHaveBeenCalled();
      expect(sellerRepository.edit).toHaveBeenCalledTimes(1);
    });

    it('should edit seller without changing image', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(sellerRepository, 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute('seller-id-123', mockEditDto);

      // Assert
      expect(result).toEqual({ message: 'Vendedor editado com sucesso!' });
      expect(sellerRepository.edit).toHaveBeenCalledTimes(1);
      expect(uploadSingle.execute).not.toHaveBeenCalled();

      const editedSeller = (sellerRepository.edit as jest.Mock).mock.calls[0][0];
      expect(editedSeller.props.avatarUrl).toBe(mockSellerData.avatarUrl);
    });

    it('should edit seller with new image', async() => {
      // Arrange
      const mockFile = createMock<Express.Multer.File>({
        mimetype: 'image/jpeg',
        size: 1024,
      });
      const newImageUrl = 'https://cdn.example.com/new-avatar.jpg';

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: newImageUrl });
      jest.spyOn(sellerRepository, 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute('seller-id-123', mockEditDto, mockFile);

      // Assert
      expect(result).toEqual({ message: 'Vendedor editado com sucesso!' });
      expect(uploadSingle.execute).toHaveBeenCalledWith(mockFile, 'sellers/avatars');
      expect(sellerRepository.edit).toHaveBeenCalledTimes(1);

      const editedSeller = (sellerRepository.edit as jest.Mock).mock.calls[0][0];
      expect(editedSeller.props.avatarUrl).toBe(newImageUrl);
    });

    it('should verify companies when companyIds is provided', async() => {
      // Arrange
      const editData: EditSellerInputDto = {
        companyIds: ['new-company-id-1', 'new-company-id-2'],
      };
      const activeCompany = createMock<CompanyDto>({
        active: true,
        fantasyName: 'Active Company',
      });

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue(activeCompany);
      jest.spyOn(sellerRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute('seller-id-123', editData);

      // Assert
      expect(findCompanyById.execute).toHaveBeenCalledTimes(2);
      expect(findCompanyById.execute).toHaveBeenCalledWith('new-company-id-1');
      expect(findCompanyById.execute).toHaveBeenCalledWith('new-company-id-2');
    });

    it('should not verify companies when companyIds is not provided', async() => {
      // Arrange
      const company = createMock<CompanyDto>({
        active: true,
        fantasyName: 'Test Company',
      });
      const editData: EditSellerInputDto = {
        name: 'Updated Name',
      };

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue(company);
      jest.spyOn(sellerRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute('seller-id-123', editData);

      // Assert
      expect(findCompanyById.execute).not.toHaveBeenCalled();

      const editedSeller = (sellerRepository.edit as jest.Mock).mock.calls[0][0];
      expect(editedSeller.props.companyIds).toEqual(['company-id-1', 'company-id-2']);
    });

    it('should throw CompanyNotFoundError when company does not exist', async() => {
      // Arrange
      const editData: EditSellerInputDto = {
        companyIds: ['non-existent-company-id'],
      };

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(findCompanyById, 'execute').mockRejectedValue(new CompanyNotFoundError());

      // Act & Assert
      await expect(sut.execute('seller-id-123', editData)).rejects.toThrow(CompanyNotFoundError);
      expect(sellerRepository.edit).not.toHaveBeenCalled();
    });

    it('should throw CompanyNotActiveError when any company is inactive', async() => {
      // Arrange
      const editData: EditSellerInputDto = {
        companyIds: ['company-id-1', 'company-id-2'],
      };

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      const activeCompany = createMock<CompanyDto>({ active: true });
      const inactiveCompany = createMock<CompanyDto>({
        active: false,
        fantasyName: 'Inactive Company',
      });
      const findCompanySpy = jest.spyOn(findCompanyById, 'execute')
        .mockResolvedValueOnce(activeCompany)
        .mockResolvedValueOnce(inactiveCompany);

      // Act & Assert
      expect.assertions(3);
      await expect(sut.execute('seller-id-123', editData)).rejects.toThrow(CompanyNotActiveError);
      expect(findCompanySpy).toHaveBeenCalledTimes(2);
      expect(sellerRepository.edit).not.toHaveBeenCalled();
    });

    it('should edit seller with partial data', async() => {
      // Arrange
      const editData: EditSellerInputDto = {
        phone: '1144445555',
      };

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(sellerRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute('seller-id-123', editData);

      // Assert
      expect(sellerRepository.edit).toHaveBeenCalledTimes(1);

      const editedSeller = (sellerRepository.edit as jest.Mock).mock.calls[0][0];
      expect(editedSeller.props.phone).toBe('1144445555');
      expect(editedSeller.props.name).toBe(mockSellerData.name);
      expect(editedSeller.props.email).toBe(mockSellerData.email);
    });

    it('should edit seller with null values for nullable fields', async() => {
      // Arrange
      const editData: EditSellerInputDto = {
        nickname: null,
        complement: null,
        reference: null,
        observation: null,
      };

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(sellerRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute('seller-id-123', editData);

      // Assert
      expect(sellerRepository.edit).toHaveBeenCalledTimes(1);

      const editedSeller = (sellerRepository.edit as jest.Mock).mock.calls[0][0];
      expect(editedSeller.props.nickname).toBeNull();
      expect(editedSeller.props.complement).toBeNull();
      expect(editedSeller.props.reference).toBeNull();
      expect(editedSeller.props.observation).toBeNull();
    });

    it('should propagate upload errors', async() => {
      // Arrange
      const mockFile = createMock<Express.Multer.File>({
        mimetype: 'image/jpeg',
        size: 1024,
      });
      const uploadError = new Error('S3 upload failed');

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(uploadSingle, 'execute').mockRejectedValue(uploadError);

      // Act & Assert
      await expect(sut.execute('seller-id-123', mockEditDto, mockFile)).rejects.toThrow('S3 upload failed');
      expect(uploadSingle.execute).toHaveBeenCalledWith(mockFile, 'sellers/avatars');
      expect(sellerRepository.edit).not.toHaveBeenCalled();
    });

    it('should maintain existing companies when companyIds is not provided', async() => {
      // Arrange
      const editData: EditSellerInputDto = {
        name: 'Updated Name',
      };

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(sellerRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute('seller-id-123', editData);

      // Assert
      const editedSeller = (sellerRepository.edit as jest.Mock).mock.calls[0][0];
      expect(editedSeller.props.companyIds).toEqual(['company-id-1', 'company-id-2']);
    });

    it('should replace companies when companyIds is provided', async() => {
      // Arrange
      const editData: EditSellerInputDto = {
        companyIds: ['new-company-id-1'],
      };
      const activeCompany = createMock<CompanyDto>({
        active: true,
        fantasyName: 'Active Company',
      });

      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue(activeCompany);
      jest.spyOn(sellerRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute('seller-id-123', editData);

      // Assert
      const editedSeller = (sellerRepository.edit as jest.Mock).mock.calls[0][0];
      expect(editedSeller.props.companyIds).toEqual(['new-company-id-1']);
    });

    it('should use Seller.load to preserve seller entity', async() => {
      // Arrange
      jest.spyOn(sellerDao, 'findById').mockResolvedValue(mockSellerData as any);
      jest.spyOn(sellerDao, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(sellerRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute('seller-id-123', mockEditDto);

      // Assert
      const editedSeller = (sellerRepository.edit as jest.Mock).mock.calls[0][0];
      expect(editedSeller.props.id).toBe(mockSellerData.id);
      expect(editedSeller.props.active).toBe(mockSellerData.active);
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

    const createTestSeller = async(emailSuffix: string = '001', companies: any[] = []) => {
      const account = await prisma.account.create({
        data: {
          email: `seller${emailSuffix}@test.com`,
          password: 'hashedPassword',
          status: 'active',
        },
      });

      const role = await prisma.role.create({
        data: {
          accountId: account.id,
          role: AccountRole.SELLER,
        },
      });

      return await prisma.seller.create({
        data: {
          roleId: role.id,
          name: `Seller ${emailSuffix}`,
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
          companies: {
            connect: companies.map(c => ({ id: c.id })),
          },
        },
        include: {
          role: {
            include: {
              account: true,
            },
          },
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

      sut = module.get<EditSeller>(EditSeller);
      prisma = module.get<PrismaService>(PrismaService);
      uploadSingle = module.get<UploadSingle>(UploadSingle);

      // Clean database
      await prisma.seller.deleteMany();
      await prisma.role.deleteMany();
      await prisma.account.deleteMany();
      await prisma.company.deleteMany();
    });

    afterEach(async() => {
      await prisma.seller.deleteMany();
      await prisma.role.deleteMany();
      await prisma.account.deleteMany();
      await prisma.company.deleteMany();
    });

    it('should edit seller successfully in database', async() => {
      // Arrange
      const company = await createTestCompany('001');
      const seller = await createTestSeller('001', [company]);

      const editData: EditSellerInputDto = {
        name: 'Updated Seller Name',
        phone: '2222222222',
      };

      // Act
      const result = await sut.execute(seller.id, editData);

      // Assert
      expect(result).toEqual({ message: 'Vendedor editado com sucesso!' });

      const updatedSeller = await prisma.seller.findUnique({
        where: { id: seller.id },
      });

      expect(updatedSeller?.name).toBe('Updated Seller Name');
      expect(updatedSeller?.phone).toBe('2222222222');
    });

    it('should throw error when seller does not exist in database', async() => {
      // Arrange
      const editData: EditSellerInputDto = {
        name: 'Updated Name',
      };

      // Act & Assert
      await expect(sut.execute('non-existent-id', editData)).rejects.toThrow(SellerNotFoundError);
    });

    it('should throw error when email already exists in database', async() => {
      // Arrange
      const company = await createTestCompany('001');
      const seller1 = await createTestSeller('001', [company]);
      const seller2 = await createTestSeller('002', [company]);

      const editData: EditSellerInputDto = {
        email: seller2.role.account.email,
      };

      // Act & Assert
      await expect(sut.execute(seller1.id, editData)).rejects.toThrow(SellerDuplicateEmailError);
    });

    it('should update seller email in database', async() => {
      // Arrange
      const company = await createTestCompany('001');
      const seller = await createTestSeller('001', [company]);

      const editData: EditSellerInputDto = {
        email: 'newemail@test.com',
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const updatedSeller = await prisma.seller.findUnique({
        where: { id: seller.id },
        include: {
          role: {
            include: {
              account: true,
            },
          },
        },
      });

      expect(updatedSeller?.role.account.email).toBe('newemail@test.com');
    });

    it('should update seller companies in database', async() => {
      // Arrange
      const company1 = await createTestCompany('001');
      const company2 = await createTestCompany('002');
      const company3 = await createTestCompany('003');

      const seller = await createTestSeller('001', [company1, company2]);

      const editData: EditSellerInputDto = {
        companyIds: [company3.id],
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const updatedSeller = await prisma.seller.findUnique({
        where: { id: seller.id },
        include: { companies: true },
      });

      expect(updatedSeller?.companies).toHaveLength(1);
      expect(updatedSeller?.companies[0].id).toBe(company3.id);
    });

    it('should throw error when company does not exist in database', async() => {
      // Arrange
      const company = await createTestCompany('001');
      const seller = await createTestSeller('001', [company]);

      const editData: EditSellerInputDto = {
        companyIds: ['non-existent-company-id'],
      };

      // Act & Assert
      await expect(sut.execute(seller.id, editData)).rejects.toThrow(CompanyNotFoundError);
    });

    it('should throw error when company is inactive in database', async() => {
      // Arrange
      const company = await createTestCompany('001');
      await prisma.company.update({
        where: { id: company.id },
        data: { active: false },
      });

      const seller = await createTestSeller('001', [company]);
      const editData: EditSellerInputDto = {
        companyIds: [company.id],
      };

      // Act & Assert
      await expect(sut.execute(seller.id, editData)).rejects.toThrow(CompanyNotActiveError);
    });

    it('should throw error when any company is inactive in database', async() => {
      // Arrange
      const company1 = await createTestCompany('001');
      const company2 = await createTestCompany('002');
      await prisma.company.update({
        where: { id: company2.id },
        data: { active: false },
      });

      const seller = await createTestSeller('001', [company1]);
      const editData: EditSellerInputDto = {
        companyIds: [company1.id, company2.id],
      };

      // Act & Assert
      await expect(sut.execute(seller.id, editData)).rejects.toThrow(CompanyNotActiveError);
    });

    it('should edit seller with uploaded image', async() => {
      // Arrange
      const company = await createTestCompany('001');
      const seller = await createTestSeller('001', [company]);

      const mockFile = createMock<Express.Multer.File>({
        mimetype: 'image/png',
        size: 2048,
      });
      const mockImageUrl = 'https://cdn.example.com/sellers/avatars/new-image.png';

      jest.spyOn(uploadSingle, 'execute').mockResolvedValue({ url: mockImageUrl });

      const editData: EditSellerInputDto = {
        name: 'Updated with Image',
      };

      // Act
      await sut.execute(seller.id, editData, mockFile);

      // Assert
      const updatedSeller = await prisma.seller.findUnique({
        where: { id: seller.id },
      });

      expect(updatedSeller?.avatarUrl).toBe(mockImageUrl);
      expect(uploadSingle.execute).toHaveBeenCalledWith(mockFile, 'sellers/avatars');
    });

    it('should edit seller with null optional fields', async() => {
      // Arrange
      const company = await createTestCompany('001');

      const account = await prisma.account.create({
        data: {
          email: 'seller-nulls@test.com',
          password: 'hashedPassword',
          status: 'active',
        },
      });

      const role = await prisma.role.create({
        data: {
          accountId: account.id,
          role: AccountRole.SELLER,
        },
      });

      const seller = await prisma.seller.create({
        data: {
          roleId: role.id,
          name: 'Seller With Values',
          nickname: 'Nick',
          phone: '1111111111',
          cellphone: '11999999999',
          commission: 10,
          zipCode: '12345678',
          street: 'Test St',
          number: '123',
          complement: 'Apt 10',
          reference: 'Near park',
          neighborhood: 'Test',
          city: 'Test City',
          state: 'TS',
          observation: 'Good seller',
          active: true,
          companies: {
            connect: [{ id: company.id }],
          },
        },
      });

      const editData: EditSellerInputDto = {
        nickname: null,
        complement: null,
        reference: null,
        observation: null,
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const updatedSeller = await prisma.seller.findUnique({
        where: { id: seller.id },
      });

      expect(updatedSeller?.nickname).toBeNull();
      expect(updatedSeller?.complement).toBeNull();
      expect(updatedSeller?.reference).toBeNull();
      expect(updatedSeller?.observation).toBeNull();
    });

    it('should maintain existing companies when not provided', async() => {
      // Arrange
      const company1 = await createTestCompany('001');
      const company2 = await createTestCompany('002');
      const seller = await createTestSeller('001', [company1, company2]);

      const editData: EditSellerInputDto = {
        name: 'Updated Name',
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const updatedSeller = await prisma.seller.findUnique({
        where: { id: seller.id },
        include: { companies: true },
      });

      expect(updatedSeller?.companies).toHaveLength(2);
      expect(updatedSeller?.companies.map(c => c.id)).toContain(company1.id);
      expect(updatedSeller?.companies.map(c => c.id)).toContain(company2.id);
    });

    it('should edit multiple fields simultaneously', async() => {
      // Arrange
      const company1 = await createTestCompany('001');
      const company2 = await createTestCompany('002');
      const seller = await createTestSeller('001', [company1]);

      const editData: EditSellerInputDto = {
        name: 'New Name',
        phone: '3333333333',
        cellphone: '33999999999',
        email: 'newemail-multi@test.com',
        commission: 15,
        companyIds: [company2.id],
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const updatedSeller = await prisma.seller.findUnique({
        where: { id: seller.id },
        include: {
          companies: true,
          role: { include: { account: true } },
        },
      });

      expect(updatedSeller?.name).toBe('New Name');
      expect(updatedSeller?.phone).toBe('3333333333');
      expect(updatedSeller?.cellphone).toBe('33999999999');
      expect(updatedSeller?.commission).toBe(15);
      expect(updatedSeller?.role.account.email).toBe('newemail-multi@test.com');
      expect(updatedSeller?.companies).toHaveLength(1);
      expect(updatedSeller?.companies[0].id).toBe(company2.id);
    });

    it('should allow same email when editing same seller', async() => {
      // Arrange
      const company = await createTestCompany('001');
      const seller = await createTestSeller('001', [company]);

      const editData: EditSellerInputDto = {
        name: 'Updated Name',
        email: seller.role.account.email, // Same email
      };

      // Act
      const result = await sut.execute(seller.id, editData);

      // Assert
      expect(result).toEqual({ message: 'Vendedor editado com sucesso!' });

      const updatedSeller = await prisma.seller.findUnique({
        where: { id: seller.id },
        include: { role: { include: { account: true } } },
      });

      expect(updatedSeller?.name).toBe('Updated Name');
      expect(updatedSeller?.role.account.email).toBe(seller.role.account.email);
    });
  });
});
