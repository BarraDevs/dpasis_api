import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { SellerDuplicateEmailError } from 'src/app/seller/domain/errors/duplicate-email.error';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { SellerModule } from 'src/app/seller/seller.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerDto } from '../../dtos/seller.dto';
import { CreateSeller } from '../create-seller/create-seller.service';
import { CreateSellerInputDto } from '../create-seller/dtos/create-seller.dto';
import { FindSellerById } from '../find-seller-by-id/find-seller-by-id.service';
import { EditSellerInputDto } from './dtos/edit-seller.dto';
import { EditSeller } from './edit-seller.service';

describe('EditSeller', () => {
  let sut: EditSeller;
  let prisma: PrismaService;
  let createSeller: CreateSeller;
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

    sut = module.get(EditSeller);
    prisma = module.get(PrismaService);
    createSeller = module.get(CreateSeller);
    findSellerById = module.get(FindSellerById);
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
      document: '56292818000180',
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

  describe('integration tests', () => {
    it('should throw an error when seller does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(nonExistentId, {})).rejects.toBeInstanceOf(SellerNotFoundError);
    });

    it('should throw an error when email is already used by another seller', async() => {
      // Arrange
      await createSeller.execute(data); // Create seller1 with data.email
      const seller2 = await createSeller.execute({ ...data, email: 'another@test.com' });

      const editData: EditSellerInputDto = {
        email: data.email, // Try to use seller1's email
      };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(seller2.id, editData)).rejects.toBeInstanceOf(SellerDuplicateEmailError);
    });

    it('should throw an error when email is already used (case-insensitive)', async() => {
      // Arrange
      await createSeller.execute(data); // Create seller1 with data.email
      const seller2 = await createSeller.execute({ ...data, email: 'another@test.com' });

      const editData: EditSellerInputDto = {
        email: data.email.toUpperCase(), // Try to use seller1's email with different case
      };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(seller2.id, editData)).rejects.toBeInstanceOf(SellerDuplicateEmailError);
    });

    it('should throw an error when company does not exist', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      const editData: EditSellerInputDto = {
        companyIds: ['non-existing-company-id'],
      };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(seller.id, editData)).rejects.toBeInstanceOf(CompanyNotFoundError);
    });

    it('should throw an error when company is not active', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      await prisma.company.update({
        where: { id: companyId01 },
        data: { active: false },
      });

      const editData: EditSellerInputDto = {
        companyIds: [companyId01],
      };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(seller.id, editData)).rejects.toBeInstanceOf(CompanyNotActiveError);
    });

    it('should throw an error when any company in the list is not active', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      await prisma.company.update({
        where: { id: companyId02 },
        data: { active: false },
      });

      const editData: EditSellerInputDto = {
        companyIds: [companyId01, companyId02],
      };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(seller.id, editData)).rejects.toBeInstanceOf(CompanyNotActiveError);
    });

    it('should not throw an error when email remains the same', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      const editData: EditSellerInputDto = {
        email: data.email,
        name: 'New Name',
      };

      // Act
      const result = await sut.execute(seller.id, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Vendedor editado com sucesso!' });
    });

    it('should not edit anything when no data is provided (except updatedAt)', async() => {
      // Arrange
      const seller = await createSeller.execute(data);
      const sellerBeforeEdit = await findSellerById.execute(seller.id);

      const editData: EditSellerInputDto = {};

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const editedSeller = await findSellerById.execute(seller.id);
      expect(editedSeller?.name).toBe(sellerBeforeEdit?.name);
      expect(editedSeller?.email).toBe(sellerBeforeEdit?.email);
      expect(editedSeller?.commission).toBe(sellerBeforeEdit?.commission);
      expect(editedSeller?.updatedAt).not.toEqual(sellerBeforeEdit?.updatedAt);
    });

    it('should edit a seller successfully', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      const editData: EditSellerInputDto = {
        name: 'Updated Name',
        nickname: 'Updated Nickname',
        phone: '2111111111',
        cellphone: '21911111111',
        commission: 20,
        street: 'Updated Street',
        city: 'Updated City',
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const editedSeller = await findSellerById.execute(seller.id);
      expect(editedSeller).toEqual<SellerDto>({
        id: seller.id,
        name: editData.name!,
        nickname: editData.nickname!,
        phone: editData.phone!,
        cellphone: editData.cellphone!,
        email: data.email, // Unchanged
        commission: editData.commission!,
        zipCode: data.zipCode, // Unchanged
        street: editData.street!,
        number: data.number, // Unchanged
        complement: data.complement, // Unchanged
        reference: data.reference, // Unchanged
        neighborhood: data.neighborhood, // Unchanged
        city: editData.city!,
        state: data.state, // Unchanged
        observation: data.observation, // Unchanged
        avatarUrl: null,
        active: true,
        createdAt: editedSeller!.createdAt,
        updatedAt: editedSeller!.updatedAt,
        companies: editedSeller!.companies,
      });
    });

    it('should change the email of a seller successfully', async() => {
      // Arrange
      const seller = await createSeller.execute(data);
      const newEmail = 'newemail@test.com';

      const editData: EditSellerInputDto = {
        email: newEmail,
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const editedSeller = await findSellerById.execute(seller.id);
      expect(editedSeller?.email).toBe(newEmail);
    });

    it('should change the company of a seller successfully', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      const editData: EditSellerInputDto = {
        companyIds: [companyId02],
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const editedSeller = await findSellerById.execute(seller.id);
      expect(editedSeller?.companies).toHaveLength(1);
      expect(editedSeller?.companies[0].id).toBe(companyId02);
    });

    it('should add multiple companies to a seller', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      const editData: EditSellerInputDto = {
        companyIds: [companyId01, companyId02],
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const editedSeller = await findSellerById.execute(seller.id);
      expect(editedSeller?.companies).toHaveLength(2);
      expect(editedSeller?.companies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: companyId01 }),
          expect.objectContaining({ id: companyId02 }),
        ]),
      );
    });

    it('should set optional fields to null', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      const editData: EditSellerInputDto = {
        nickname: null,
        complement: null,
        reference: null,
        observation: null,
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const editedSeller = await findSellerById.execute(seller.id);
      expect(editedSeller?.nickname).toBeNull();
      expect(editedSeller?.complement).toBeNull();
      expect(editedSeller?.reference).toBeNull();
      expect(editedSeller?.observation).toBeNull();
    });

    it('should update commission value', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      const editData: EditSellerInputDto = {
        commission: 25,
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const editedSeller = await findSellerById.execute(seller.id);
      expect(editedSeller?.commission).toBe(25);
    });

    it('should update address fields', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      const editData: EditSellerInputDto = {
        zipCode: '99999-999',
        street: 'New Street',
        number: '1000',
        complement: 'New Complement',
        reference: 'New Reference',
        neighborhood: 'New Neighborhood',
        city: 'New City',
        state: 'NS',
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const editedSeller = await findSellerById.execute(seller.id);
      expect(editedSeller?.zipCode).toBe(editData.zipCode);
      expect(editedSeller?.street).toBe(editData.street);
      expect(editedSeller?.number).toBe(editData.number);
      expect(editedSeller?.complement).toBe(editData.complement);
      expect(editedSeller?.reference).toBe(editData.reference);
      expect(editedSeller?.neighborhood).toBe(editData.neighborhood);
      expect(editedSeller?.city).toBe(editData.city);
      expect(editedSeller?.state).toBe(editData.state);
    });

    it('should update phone numbers', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      const editData: EditSellerInputDto = {
        phone: '3122222222',
        cellphone: '31922222222',
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const editedSeller = await findSellerById.execute(seller.id);
      expect(editedSeller?.phone).toBe(editData.phone);
      expect(editedSeller?.cellphone).toBe(editData.cellphone);
    });

    it('should return success message after editing', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      const editData: EditSellerInputDto = {
        name: 'Updated Name',
      };

      // Act
      const result = await sut.execute(seller.id, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Vendedor editado com sucesso!',
      });
    });

    it('should update only provided fields and keep others unchanged', async() => {
      // Arrange
      const seller = await createSeller.execute(data);
      const sellerBeforeEdit = await findSellerById.execute(seller.id);

      const editData: EditSellerInputDto = {
        name: 'Only Name Changed',
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const editedSeller = await findSellerById.execute(seller.id);
      expect(editedSeller?.name).toBe('Only Name Changed');
      expect(editedSeller?.email).toBe(sellerBeforeEdit?.email);
      expect(editedSeller?.phone).toBe(sellerBeforeEdit?.phone);
      expect(editedSeller?.cellphone).toBe(sellerBeforeEdit?.cellphone);
      expect(editedSeller?.commission).toBe(sellerBeforeEdit?.commission);
      expect(editedSeller?.zipCode).toBe(sellerBeforeEdit?.zipCode);
    });

    it('should preserve active status when editing', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      const editData: EditSellerInputDto = {
        name: 'Updated Name',
      };

      // Act
      await sut.execute(seller.id, editData);

      // Assert
      const editedSeller = await findSellerById.execute(seller.id);
      expect(editedSeller?.active).toBe(true);
    });
  });
});
