import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { SellerDuplicateEmailError } from 'src/app/seller/domain/errors/duplicate-email.error';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { SellerModule } from 'src/app/seller/seller.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SellerDto } from '../../dtos/seller.dto';
import { CreateSeller } from '../create-seller/create-seller.service';
import { CreateSellerInputDto } from '../create-seller/dtos/create-seller.dto';
import { FindSellerById } from '../find-seller-by-id/find-seller-by-id.service';
import { EditSeller } from './edit-seller.service';

describe('EditSeller', () => {
  let sut: EditSeller;
  let prisma: PrismaService;
  let createSeller: CreateSeller;
  let findSellerById: FindSellerById;
  let createCompany: CreateCompany;
  let companyId: string;
  let data: CreateSellerInputDto;

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
    it('should throw an error if seller is not found', async() => {
      // Arrange
      const findByIdSpy = jest.spyOn(sut['sellerDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      expect.assertions(2);
      return sut.execute('non-existent-id', {}).catch((error) => {
        expect(error).toBeInstanceOf(SellerNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith('non-existent-id');
      });
    });

    it('should throw an error if new email is duplicate', async() => {
      // Arrange
      const sellerData = createMock<SellerDto>({
        email: 'seller@email.com',
        phone: '1122223333',
        cellphone: '11999998888',
        commission: 29.66666666667,
      });
      const existingSellerData = createMock<SellerDto>({ email: 'existing@email.com' });
      jest.spyOn(sut['sellerDao'], 'findById').mockResolvedValue(sellerData);
      jest.spyOn(sut['sellerDao'], 'findByEmail').mockResolvedValue(existingSellerData);

      // Act & Assert
      expect.assertions(1);
      return sut.execute('seller-id', { email: 'existing@email.com' }).catch((error) => {
        expect(error).toBeInstanceOf(SellerDuplicateEmailError);
      });
    });

    it('should not throw error if email is not changed', async() => {
      // Arrange
      const sellerData = createMock<SellerDto>({
        email: 'seller@email.com',
        phone: '1122223333',
        cellphone: '11999998888',
        commission: 29.66666666667,
      });
      jest.spyOn(sut['sellerDao'], 'findById').mockResolvedValue(sellerData);
      const findByEmailSpy = jest.spyOn(sut['sellerDao'], 'findByEmail');
      const editSpy = jest.spyOn(sut['sellerRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute('seller-id', { email: 'seller@email.com' });

      // Assert
      expect(findByEmailSpy).not.toHaveBeenCalled();
      expect(editSpy).toHaveBeenCalled();
    });
  });

  describe('integration tests', () => {
    it('should throw an error if seller is not found', async() => {
      // Act & Assert
      expect.assertions(1);
      return sut.execute('non-existent-id', {}).catch((error) => {
        expect(error).toBeInstanceOf(SellerNotFoundError);
      });
    });

    it('should throw an error if new email is duplicate', async() => {
      // Arrange
      const seller1 = await createSeller.execute(data);
      await createSeller.execute({ ...data, email: 'another@email.com', phone: '2233334444', cellphone: '22988887777' });

      // Act & Assert
      expect.assertions(1);
      return sut.execute(seller1.id, { email: 'another@email.com' }).catch((error) => {
        expect(error).toBeInstanceOf(SellerDuplicateEmailError);
      });
    });

    it('should throw an error if company does not exist', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act & Assert
      expect.assertions(1);
      return sut.execute(seller.id, { companyIds: ['non-existent-company-id'] }).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
      });
    });

    it('should update seller name', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, { name: 'Updated Name' });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.name).toBe('Updated Name');
    });

    it('should update seller nickname', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, { nickname: 'NewNickname' });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.nickname).toBe('NewNickname');
    });

    it('should update seller phone and cellphone', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, { phone: '3344445555', cellphone: '33988889999' });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.phone).toBe('3344445555');
      expect(updatedSeller.cellphone).toBe('33988889999');
    });

    it('should update seller email', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, { email: 'newemail@example.com' });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.email).toBe('newemail@example.com');
    });

    it('should update seller commission', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, { commission: 15.5 });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.commission).toBe(15.5);
    });

    it('should update seller address fields', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, {
        zipCode: '22222222',
        street: 'New Street',
        number: '500',
        complement: 'New Complement',
        reference: 'New Reference',
        neighborhood: 'New Neighborhood',
        city: 'New City',
        state: 'NC',
      });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.zipCode).toBe('22222222');
      expect(updatedSeller.street).toBe('New Street');
      expect(updatedSeller.number).toBe('500');
      expect(updatedSeller.complement).toBe('New Complement');
      expect(updatedSeller.reference).toBe('New Reference');
      expect(updatedSeller.neighborhood).toBe('New Neighborhood');
      expect(updatedSeller.city).toBe('New City');
      expect(updatedSeller.state).toBe('NC');
    });

    it('should update seller observation and avatarUrl', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, {
        observation: 'New observation',
        avatarUrl: 'https://newavatar.com/image.jpg',
      });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.observation).toBe('New observation');
      expect(updatedSeller.avatarUrl).toBe('https://newavatar.com/image.jpg');
    });

    it('should set nullable fields to null', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, {
        nickname: null,
        complement: null,
        reference: null,
        observation: null,
        avatarUrl: null,
      });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.nickname).toBeNull();
      expect(updatedSeller.complement).toBeNull();
      expect(updatedSeller.reference).toBeNull();
      expect(updatedSeller.observation).toBeNull();
      expect(updatedSeller.avatarUrl).toBeNull();
    });

    it('should update seller companies', async() => {
      // Arrange
      const company2Id = (await createCompany.execute({
        name: 'Company 2',
        fantasyName: 'Company 2 Fantasy',
        document: '78776439000106',
        ie: 'ie teste 2',
        zipCode: 'zipCode teste 2',
        street: 'street teste 2',
        number: 'number teste 2',
        neighborhood: 'neighborhood teste 2',
        complement: null,
        reference: null,
        city: 'city teste 2',
        state: 'state teste 2',
        cellphone: '3399887766',
        phone01: '4499887766',
        phone02: null,
        email01: 'email01_2@teste.com',
        email02: 'email02_2@teste.com',
      })).id;

      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, { companyIds: [company2Id] });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.companies).toHaveLength(1);
      expect(updatedSeller.companies[0].id).toBe(company2Id);
    });

    it('should update seller with multiple companies', async() => {
      // Arrange
      const company2Id = (await createCompany.execute({
        name: 'Company 2',
        fantasyName: 'Company 2 Fantasy',
        document: '78776439000106',
        ie: 'ie teste 2',
        zipCode: 'zipCode teste 2',
        street: 'street teste 2',
        number: 'number teste 2',
        neighborhood: 'neighborhood teste 2',
        complement: null,
        reference: null,
        city: 'city teste 2',
        state: 'state teste 2',
        cellphone: '3399887766',
        phone01: '4499887766',
        phone02: null,
        email01: 'email01_2@teste.com',
        email02: 'email02_2@teste.com',
      })).id;

      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, { companyIds: [companyId, company2Id] });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.companies).toHaveLength(2);
      const companyIds = updatedSeller.companies.map(c => c.id).sort();
      expect(companyIds).toEqual([companyId, company2Id].sort());
    });

    it('should update only specified fields and keep others unchanged', async() => {
      // Arrange
      const seller = await createSeller.execute(data);
      const originalSeller = await findSellerById.execute(seller.id);

      // Act
      await sut.execute(seller.id, { name: 'Only Name Changed' });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.name).toBe('Only Name Changed');
      expect(updatedSeller.nickname).toBe(originalSeller.nickname);
      expect(updatedSeller.phone).toBe(originalSeller.phone);
      expect(updatedSeller.cellphone).toBe(originalSeller.cellphone);
      expect(updatedSeller.email).toBe(originalSeller.email);
      expect(updatedSeller.commission).toBe(originalSeller.commission);
    });

    it('should update email and update account email', async() => {
      // Arrange
      const seller = await createSeller.execute(data);
      const newEmail = 'updatedemail@example.com';

      // Act
      await sut.execute(seller.id, { email: newEmail });

      // Assert
      const account = await prisma.account.findFirst({
        where: { email: newEmail },
      });
      expect(account).toBeDefined();
      expect(account?.email).toBe(newEmail);
    });

    it('should not update email if same email is provided', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, { email: data.email, name: 'Updated Name' });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.email).toBe(data.email);
      expect(updatedSeller.name).toBe('Updated Name');
    });

    it('should update multiple fields at once', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act
      await sut.execute(seller.id, {
        name: 'Multi Update Name',
        commission: 20,
        observation: 'Multi update observation',
        phone: '4455556666',
      });

      // Assert
      const updatedSeller = await findSellerById.execute(seller.id);
      expect(updatedSeller.name).toBe('Multi Update Name');
      expect(updatedSeller.commission).toBe(20);
      expect(updatedSeller.observation).toBe('Multi update observation');
      expect(updatedSeller.phone).toBe('4455556666');
    });

    it('should return success message', async() => {
      // Arrange
      const seller = await createSeller.execute(data);

      // Act
      const result = await sut.execute(seller.id, { name: 'Updated Name' });

      // Assert
      expect(result.message).toBe('Vendedor editado com sucesso!');
    });
  });
});
