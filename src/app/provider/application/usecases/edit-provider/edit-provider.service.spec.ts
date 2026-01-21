import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { ProviderDuplicateCnpjError } from 'src/app/provider/domain/errors/duplicate-cnpj.error';
import { InvalidProviderTypeError } from 'src/app/provider/domain/errors/invalid-provider-type.error';
import { ProviderNotFoundError } from 'src/app/provider/domain/errors/provider-not-found.error';
import { ProviderModule } from 'src/app/provider/provider.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderDto } from '../../dtos/provider.dto';
import { CreateProvider } from '../create-provider/create-provider.service';
import { CreateProviderInputDto } from '../create-provider/dtos/create-provider.dto';
import { FindProviderById } from '../find-provider-by-id/find-provider-by-id.service';
import { EditProvider } from './edit-provider.service';

describe('EditProvider', () => {
  let sut: EditProvider;
  let prisma: PrismaService;
  let createProvider: CreateProvider;
  let findProviderById: FindProviderById;
  let createCompany: CreateCompany;
  let companyId: string;
  let data: CreateProviderInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ProviderModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditProvider);
    prisma = module.get(PrismaService);
    createProvider = module.get(CreateProvider);
    findProviderById = module.get(FindProviderById);
    createCompany = module.get(CreateCompany);

    await prisma.provider.deleteMany();
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
      name: 'Provider Test',
      type: ProviderType.RECURRING,
      valueInCents: 10000,
      cnpj: '11222333000181',
      ie: '123456789',
      paymentDay: 15,
      paymentExpirationDate: null,
      companyName: 'Provider Company',
      zipCode: '12345678',
      street: 'Main Street',
      number: '100',
      complement: null,
      reference: null,
      neighborhood: 'Downtown',
      city: 'São Paulo',
      state: 'SP',
      email: 'provider@email.com',
      website: 'https://provider.com',
      companyIds: [companyId],
    };
  });

  afterEach(async() => {
    await prisma.provider.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw an error if provider is not found', async() => {
      // Arrange
      const findByIdSpy = jest.spyOn(sut['providerDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      expect.assertions(2);
      return sut.execute('non-existent-id', {}).catch((error) => {
        expect(error).toBeInstanceOf(ProviderNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith('non-existent-id');
      });
    });

    it('should throw an error if provider type is invalid', async() => {
      // Arrange
      const provider = await createProvider.execute(data);

      // Act & Assert
      expect.assertions(1);
      return sut.execute(provider.id, { type: 'INVALID_TYPE' as ProviderType }).catch((error) => {
        expect(error).toBeInstanceOf(InvalidProviderTypeError);
      });
    });

    it('should throw an error if new cnpj is duplicate', async() => {
      // Arrange
      const providerData = createMock<ProviderDto>({
        email: 'jhondoe@email.com',
        cnpj: '24089630000142',
        type: ProviderType.RECURRING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const existingProvider = createMock<ProviderDto>({ cnpj: '22333444000105' });
      jest.spyOn(sut['providerDao'], 'findById').mockResolvedValue(providerData);
      jest.spyOn(sut['providerDao'], 'findByCnpj').mockResolvedValue(existingProvider);

      // Act & Assert
      expect.assertions(1);
      return sut.execute('provider-id', { cnpj: '21324716000114' }).catch((error) => {
        expect(error).toBeInstanceOf(ProviderDuplicateCnpjError);
      });
    });
  });

  describe('integration tests', () => {
    it('should throw an error if provider is not found', async() => {
      // Act & Assert
      expect.assertions(1);
      return sut.execute('non-existent-id', {}).catch((error) => {
        expect(error).toBeInstanceOf(ProviderNotFoundError);
      });
    });

    it('should throw an error if new cnpj is duplicate', async() => {
      // Arrange
      const provider1 = await createProvider.execute(data);
      await createProvider.execute({ ...data, cnpj: '73214759000140' });

      // Act & Assert
      expect.assertions(1);
      return sut.execute(provider1.id, { cnpj: '73214759000140' }).catch((error) => {
        expect(error).toBeInstanceOf(ProviderDuplicateCnpjError);
      });
    });

    it('should throw an error if company does not exist', async() => {
      // Arrange
      const provider = await createProvider.execute(data);

      // Act & Assert
      expect.assertions(1);
      return sut.execute(provider.id, { companyIds: ['non-existent-company-id'] }).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
      });
    });

    it('should throw an error if company is inactive', async() => {
      // Arrange
      const provider = await createProvider.execute(data);

      await prisma.company.update({
        where: { id: companyId },
        data: { active: false },
      });

      // Act & Assert
      expect.assertions(1);
      return sut.execute(provider.id, { companyIds: [companyId] }).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotActiveError);
      });
    });

    it('should throw an error if any company is inactive', async() => {
      // Arrange
      const provider = await createProvider.execute(data);

      const company2 = await createCompany.execute({
        name: 'Company 02',
        fantasyName: 'Company 02',
        document: '22.930.133/0001-08',
        ie: '987654321',
        zipCode: '87654321',
        street: 'Street 02',
        number: '200',
        neighborhood: 'District 02',
        complement: null,
        reference: null,
        city: 'Rio',
        state: 'RJ',
        cellphone: '21987654321',
        phone01: '2133334444',
        phone02: null,
        email01: 'company02@test.com',
        email02: null,
      });

      await prisma.company.update({
        where: { id: company2.id },
        data: { active: false },
      });

      // Act & Assert
      expect.assertions(1);
      return sut.execute(provider.id, { companyIds: [companyId, company2.id] }).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotActiveError);
      });
    });

    it('should update provider name', async() => {
      // Arrange
      const provider = await createProvider.execute(data);

      // Act
      await sut.execute(provider.id, { name: 'Updated Name' });

      // Assert
      const updatedProvider = await findProviderById.execute(provider.id);
      expect(updatedProvider.name).toBe('Updated Name');
    });

    it('should update provider type from RECURRING to ONE_TIME and set paymentDay to null', async() => {
      // Arrange
      const provider = await createProvider.execute({
        ...data,
        type: ProviderType.RECURRING,
        paymentDay: 15,
      });

      // Act
      await sut.execute(provider.id, {
        type: ProviderType.ONE_TIME,
        paymentExpirationDate: new Date('2025-12-31'),
      });

      // Assert
      const updatedProvider = await findProviderById.execute(provider.id);
      expect(updatedProvider.type).toBe(ProviderType.ONE_TIME);
      expect(updatedProvider.paymentDay).toBeNull();
      expect(updatedProvider.paymentExpirationDate).toEqual(new Date('2025-12-31'));
    });

    it('should update provider type from ONE_TIME to RECURRING and set paymentDay to 15', async() => {
      // Arrange
      const provider = await createProvider.execute({
        ...data,
        type: ProviderType.ONE_TIME,
        paymentExpirationDate: new Date('2025-12-31'),
      });

      // Act
      await sut.execute(provider.id, {
        type: ProviderType.RECURRING,
        paymentDay: 15,
      });

      // Assert
      const updatedProvider = await findProviderById.execute(provider.id);
      expect(updatedProvider.type).toBe(ProviderType.RECURRING);
      expect(updatedProvider.paymentDay).toBe(15);
      expect(updatedProvider.paymentExpirationDate).toBeNull();
    });

    it('should return success message', async() => {
      // Arrange
      const provider = await createProvider.execute(data);

      // Act
      const result = await sut.execute(provider.id, { name: 'Updated Name' });

      // Assert
      expect(result.message).toBe('Prestador editado com sucesso!');
    });
  });
});
