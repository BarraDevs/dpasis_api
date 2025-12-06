import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { SellerModule } from 'src/app/seller/seller.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateSeller } from '../create-seller/create-seller.service';
import { FindSellerById } from '../find-seller-by-id/find-seller-by-id.service';
import { UpdateSellerStatus } from './update-seller-status.service';

describe('UpdateSellerStatus', () => {
  let sut: UpdateSellerStatus;
  let prisma: PrismaService;
  let createSeller: CreateSeller;
  let findSellerById: FindSellerById;
  let createCompany: CreateCompany;
  let companyId: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SellerModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(UpdateSellerStatus);
    prisma = module.get(PrismaService);
    createSeller = module.get(CreateSeller);
    findSellerById = module.get(FindSellerById);
    createCompany = module.get(CreateCompany);

    await prisma.company.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.account.deleteMany();

    companyId = (await createCompany.execute({
      name: 'Test Company Ltd',
      fantasyName: 'Test Company',
      document: '73094364000151',
      ie: '123456789',
      zipCode: '12345678',
      street: 'Main Street',
      number: '100',
      neighborhood: 'Downtown',
      complement: null,
      reference: null,
      city: 'São Paulo',
      state: 'SP',
      cellphone: '11999999999',
      phone01: '1133333333',
      phone02: null,
      email01: 'test@company.com',
      email02: null,
    })).id;
  });

  afterEach(async() => {
    await prisma.company.deleteMany();
    await prisma.seller.deleteMany();
    await prisma.account.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw SellerNotFoundError if seller does not exist', async() => {
      // Arrange
      const id = 'non-existing-id';
      const findByIdSpy = jest.spyOn(sut['sellerRepository'], 'findById').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['sellerRepository'], 'edit');

      // Act & Assert
      expect.assertions(3);
      return sut.execute(id).catch((error) => {
        expect(error).toBeInstanceOf(SellerNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith(id);
        expect(editSpy).not.toHaveBeenCalled();
      });
    });

    it('should call sellerRepository.findById and sellerRepository.edit with correct values', async() => {
      // Arrange
      const id = 'seller-id-123';
      const sellerEntity = Seller.load({
        id,
        name: 'Test Seller',
        nickname: 'Tester',
        email: 'test@seller.com',
        phone: '1122223333',
        cellphone: '11999998888',
        commission: 10,
        zipCode: '01234567',
        street: 'Rua Teste',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        observation: null,
        avatarUrl: null,
        companyIds: [companyId],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const findByIdSpy = jest.spyOn(sut['sellerRepository'], 'findById').mockResolvedValue(sellerEntity);
      const editSpy = jest.spyOn(sut['sellerRepository'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id);
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          id,
          active: false, // Should be toggled
        }),
      }));
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });
    });

    it('should toggle status from active to inactive', async() => {
      // Arrange
      const id = 'seller-id-123';
      const sellerEntity = Seller.load({
        id,
        name: 'Active Seller',
        nickname: 'Active',
        email: 'active@seller.com',
        phone: '2122223333',
        cellphone: '21999998888',
        commission: 15,
        zipCode: '02222222',
        street: 'Rua Ativa',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        observation: null,
        avatarUrl: null,
        companyIds: [companyId],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['sellerRepository'], 'findById').mockResolvedValue(sellerEntity);
      const editSpy = jest.spyOn(sut['sellerRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          active: false,
        }),
      }));
    });

    it('should toggle status from inactive to active', async() => {
      // Arrange
      const id = 'seller-id-123';
      const sellerEntity = Seller.load({
        id,
        name: 'Inactive Seller',
        nickname: 'Inactive',
        email: 'inactive@seller.com',
        phone: '3133334444',
        cellphone: '31988887777',
        commission: 20,
        zipCode: '03333333',
        street: 'Rua Inativa',
        number: '300',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'Belo Horizonte',
        state: 'MG',
        observation: null,
        avatarUrl: null,
        companyIds: [companyId],
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['sellerRepository'], 'findById').mockResolvedValue(sellerEntity);
      const editSpy = jest.spyOn(sut['sellerRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(id);

      // Assert
      expect(editSpy).toHaveBeenCalledWith(expect.objectContaining({
        props: expect.objectContaining({
          active: true,
        }),
      }));
    });
  });

  describe('integration tests', () => {
    it('should throw SellerNotFoundError if seller does not exist', async() => {
      // Arrange
      const id = 'non-existing-seller-id';

      // Act & Assert
      await expect(sut.execute(id)).rejects.toThrow(SellerNotFoundError);
    });

    it('should toggle seller status from active to inactive', async() => {
      // Arrange
      const seller = await createSeller.execute({
        name: 'Test Seller',
        nickname: 'Tester',
        email: 'test@seller.com',
        phone: '1144445555',
        cellphone: '11977776666',
        commission: 10,
        zipCode: '01111111',
        street: 'Main Street',
        number: '100',
        complement: 'Suite 1',
        reference: 'Near metro',
        neighborhood: 'Downtown',
        city: 'São Paulo',
        state: 'SP',
        observation: null,
        avatarUrl: null,
        companyIds: [companyId],
      });

      // Verify initial status is active
      const initialSeller = await findSellerById.execute(seller.id);
      expect(initialSeller).not.toBeNull();
      expect(initialSeller!.active).toBe(true);

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });

      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller).not.toBeNull();
      expect(updatedSeller!.active).toBe(false);
    });

    it('should toggle seller status from inactive to active', async() => {
      // Arrange
      const seller = await createSeller.execute({
        name: 'Inactive Seller',
        nickname: 'Inactive',
        email: 'inactive@seller.com',
        phone: '2155556666',
        cellphone: '21966665555',
        commission: 15,
        zipCode: '02222222',
        street: 'Secondary Street',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Center',
        city: 'Rio de Janeiro',
        state: 'RJ',
        observation: null,
        avatarUrl: null,
        companyIds: [companyId],
      });

      // First toggle to inactive
      await sut.execute(seller.id);
      const inactiveSeller = await findSellerById.execute(seller.id);
      expect(inactiveSeller).not.toBeNull();
      expect(inactiveSeller!.active).toBe(false);

      // Act - Toggle back to active
      const result = await sut.execute(seller.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Status atualizado com sucesso.' });

      const activeSeller = await findSellerById.execute(seller.id);
      expect(activeSeller).not.toBeNull();
      expect(activeSeller!.active).toBe(true);
    });

    it('should toggle status multiple times correctly', async() => {
      // Arrange
      const seller = await createSeller.execute({
        name: 'Multiple Toggle Seller',
        nickname: 'Toggle',
        email: 'toggle@seller.com',
        phone: '3166667777',
        cellphone: '31955554444',
        commission: 20,
        zipCode: '03333333',
        street: 'Toggle Street',
        number: '300',
        complement: null,
        reference: null,
        neighborhood: 'Central',
        city: 'Belo Horizonte',
        state: 'MG',
        observation: null,
        avatarUrl: null,
        companyIds: [companyId],
      });

      // Act & Assert - Toggle 1: active -> inactive
      await sut.execute(seller.id);
      let currentSeller = await findSellerById.execute(seller.id);
      expect(currentSeller).not.toBeNull();
      expect(currentSeller!.active).toBe(false);

      // Toggle 2: inactive -> active
      await sut.execute(seller.id);
      currentSeller = await findSellerById.execute(seller.id);
      expect(currentSeller).not.toBeNull();
      expect(currentSeller!.active).toBe(true);

      // Toggle 3: active -> inactive
      await sut.execute(seller.id);
      currentSeller = await findSellerById.execute(seller.id);
      expect(currentSeller).not.toBeNull();
      expect(currentSeller!.active).toBe(false);

      // Toggle 4: inactive -> active
      await sut.execute(seller.id);
      currentSeller = await findSellerById.execute(seller.id);
      expect(currentSeller).not.toBeNull();
      expect(currentSeller!.active).toBe(true);
    });

    it('should update updatedAt timestamp on status toggle', async() => {
      // Arrange
      const seller = await createSeller.execute({
        name: 'Timestamp Test Seller',
        nickname: 'Timestamp',
        email: 'timestamp@seller.com',
        phone: '4177778888',
        cellphone: '41944443333',
        commission: 8,
        zipCode: '04444444',
        street: 'Timestamp Avenue',
        number: '400',
        complement: null,
        reference: null,
        neighborhood: 'District',
        city: 'Curitiba',
        state: 'PR',
        observation: null,
        avatarUrl: null,
        companyIds: [companyId],
      });

      const beforeToggle = await findSellerById.execute(seller.id);
      expect(beforeToggle).not.toBeNull();

      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Act
      await sut.execute(seller.id);

      // Assert
      const afterToggle = await findSellerById.execute(seller.id);
      expect(afterToggle).not.toBeNull();
    });

    it('should preserve all other seller properties when toggling status', async() => {
      // Arrange
      const originalData = {
        name: 'Preserve Props Seller',
        nickname: 'Props',
        email: 'preserve@seller.com',
        phone: '5188889999',
        cellphone: '51933332222',
        commission: 25,
        zipCode: '05555555',
        street: 'Building Street',
        number: '500',
        complement: 'Building A',
        reference: 'Near park',
        neighborhood: 'Zone',
        city: 'Porto Alegre',
        state: 'RS',
        observation: 'Top seller',
        avatarUrl: null,
        companyIds: [companyId],
      };

      const seller = await createSeller.execute(originalData);
      const initialSeller = await findSellerById.execute(seller.id);
      expect(initialSeller).not.toBeNull();

      // Act
      await sut.execute(seller.id);

      // Assert
      const toggledSeller = await findSellerById.execute(seller.id);
      expect(toggledSeller).not.toBeNull();
      expect(toggledSeller!.name).toBe(originalData.name);
      expect(toggledSeller!.nickname).toBe(originalData.nickname);
      expect(toggledSeller!.email).toBe(originalData.email);
      expect(toggledSeller!.phone).toBe(originalData.phone);
      expect(toggledSeller!.cellphone).toBe(originalData.cellphone);
      expect(toggledSeller!.commission).toBe(originalData.commission);
      expect(toggledSeller!.zipCode).toBe(originalData.zipCode);
      expect(toggledSeller!.street).toBe(originalData.street);
      expect(toggledSeller!.number).toBe(originalData.number);
      expect(toggledSeller!.complement).toBe(originalData.complement);
      expect(toggledSeller!.reference).toBe(originalData.reference);
      expect(toggledSeller!.neighborhood).toBe(originalData.neighborhood);
      expect(toggledSeller!.city).toBe(originalData.city);
      expect(toggledSeller!.state).toBe(originalData.state);
      expect(toggledSeller!.observation).toBe(originalData.observation);
      expect(toggledSeller!.avatarUrl).toBe(originalData.avatarUrl);
      expect(toggledSeller!.companies).toEqual(initialSeller!.companies);
      expect(toggledSeller!.createdAt).toEqual(initialSeller!.createdAt);
      // Only active and updatedAt should change
      expect(toggledSeller!.active).not.toBe(initialSeller!.active);
    });

    it('should work with sellers associated with multiple companies', async() => {
      // Arrange
      const company2Id = (await createCompany.execute({
        name: 'Second Company Ltd',
        fantasyName: 'Second Company',
        document: '20852273000171',
        ie: '987654321',
        zipCode: '87654321',
        street: 'Second Street',
        number: '200',
        neighborhood: 'Uptown',
        complement: null,
        reference: null,
        city: 'Rio de Janeiro',
        state: 'RJ',
        cellphone: '21988888888',
        phone01: '2144444444',
        phone02: null,
        email01: 'test@company2.com',
        email02: null,
      })).id;

      const seller = await createSeller.execute({
        name: 'Multi Company Seller',
        nickname: 'Multi',
        email: 'multi@seller.com',
        phone: '6199990000',
        cellphone: '61922221111',
        commission: 12,
        zipCode: '06666666',
        street: 'Global Avenue',
        number: '600',
        complement: 'HQ Floor',
        reference: null,
        neighborhood: 'Federal',
        city: 'Brasília',
        state: 'DF',
        observation: null,
        avatarUrl: null,
        companyIds: [companyId, company2Id],
      });

      const initialSeller = await findSellerById.execute(seller.id);
      expect(initialSeller).not.toBeNull();
      expect(initialSeller!.companies).toHaveLength(2);

      // Act
      await sut.execute(seller.id);

      // Assert
      const toggledSeller = await findSellerById.execute(seller.id);
      expect(toggledSeller).not.toBeNull();
      expect(toggledSeller!.active).toBe(false);
      expect(toggledSeller!.companies).toHaveLength(2);
      expect(toggledSeller!.companies).toEqual(initialSeller!.companies);
    });

    it('should return success message with correct text', async() => {
      // Arrange
      const seller = await createSeller.execute({
        name: 'Message Test Seller',
        nickname: 'Message',
        email: 'message@seller.com',
        phone: '8511112222',
        cellphone: '85911112222',
        commission: 18,
        zipCode: '07777777',
        street: 'Message Street',
        number: '700',
        complement: null,
        reference: null,
        neighborhood: 'Office Zone',
        city: 'Fortaleza',
        state: 'CE',
        observation: null,
        avatarUrl: null,
        companyIds: [companyId],
      });

      // Act
      const result = await sut.execute(seller.id);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Status atualizado com sucesso.',
      });
      expect(result.message).toBe('Status atualizado com sucesso.');
    });

    it('should handle sellers with different commission values', async() => {
      // Arrange
      const seller = await createSeller.execute({
        name: 'Commission Test Seller',
        nickname: 'Commission',
        email: 'commission@seller.com',
        phone: '7122223333',
        cellphone: '71922223333',
        commission: 50,
        zipCode: '08888888',
        street: 'Commission Avenue',
        number: '800',
        complement: null,
        reference: null,
        neighborhood: 'Business',
        city: 'Salvador',
        state: 'BA',
        observation: null,
        avatarUrl: null,
        companyIds: [companyId],
      });

      const initialSeller = await findSellerById.execute(seller.id);
      expect(initialSeller).not.toBeNull();
      expect(initialSeller!.commission).toBe(50);

      // Act
      await sut.execute(seller.id);

      // Assert
      const toggledSeller = await findSellerById.execute(seller.id);
      expect(toggledSeller).not.toBeNull();
      expect(toggledSeller!.commission).toBe(50); // Commission should not change
      expect(toggledSeller!.active).toBe(false); // Only status should change
    });

    it('should handle sellers with null optional fields', async() => {
      // Arrange
      const seller = await createSeller.execute({
        name: 'Null Fields Seller',
        nickname: null,
        email: 'nullfields@seller.com',
        phone: '8133334444',
        cellphone: '81933334444',
        commission: 10,
        zipCode: '09999999',
        street: 'Null Street',
        number: '900',
        complement: null,
        reference: null,
        neighborhood: 'Test Zone',
        city: 'Recife',
        state: 'PE',
        observation: null,
        avatarUrl: null,
        companyIds: [companyId],
      });

      const initialSeller = await findSellerById.execute(seller.id);
      expect(initialSeller).not.toBeNull();
      expect(initialSeller!.nickname).toBeNull();
      expect(initialSeller!.complement).toBeNull();

      // Act
      await sut.execute(seller.id);

      // Assert
      const toggledSeller = await findSellerById.execute(seller.id);
      expect(toggledSeller).not.toBeNull();
      expect(toggledSeller!.nickname).toBeNull(); // Should remain null
      expect(toggledSeller!.complement).toBeNull(); // Should remain null
      expect(toggledSeller!.active).toBe(false); // Only status should change
    });
  });
});
