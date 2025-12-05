import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { Provider } from 'src/app/provider/domain/entities/provider.entity';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { ProviderDuplicateCnpjError } from 'src/app/provider/domain/errors/duplicate-cnpj.error';
import { ProviderModule } from 'src/app/provider/provider.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderDto } from '../../dtos/provider.dto';
import { FindProviderById } from '../find-provider-by-id/find-provider-by-id.service';
import { CreateProvider } from './create-provider.service';
import { CreateProviderInputDto, CreateProviderOutputDto } from './dtos/create-provider.dto';

describe('CreateProvider', () => {
  let sut: CreateProvider;
  let prisma: PrismaService;
  let findProviderById: FindProviderById;
  let data: CreateProviderInputDto;
  let companyId: string;
  let createCompany: CreateCompany;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ProviderModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateProvider);
    findProviderById = module.get(FindProviderById);
    prisma = module.get(PrismaService);
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
    it('should throw an error if cnpj is duplicate', async() => {
      // Arrange
      const providerData = createMock<ProviderDto>();
      const findByCnpjSpy = jest.spyOn(sut['providerDao'], 'findByCnpj').mockResolvedValue(providerData);
      const saveSpy = jest.spyOn(sut['providerRepository'], 'save').mockResolvedValue();
      const provider = Provider.create(data);

      // Act & Assert
      expect.assertions(3);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(ProviderDuplicateCnpjError);
        expect(findByCnpjSpy).toHaveBeenCalledWith(provider.props.cnpj);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw an error if company does not exist', async() => {
      // Arrange
      const invalidData = { ...data, companyIds: ['non-existent-company-id'] };
      const findByCnpjSpy = jest.spyOn(sut['providerDao'], 'findByCnpj').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['providerRepository'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
        expect(findByCnpjSpy).toHaveBeenCalledWith(invalidData.cnpj);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should create a provider and return its id', async() => {
      // Arrange
      const findByCnpjSpy = jest.spyOn(sut['providerDao'], 'findByCnpj').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['providerRepository'], 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(data);

      // Assert
      expect(findByCnpjSpy).toHaveBeenCalledWith(data.cnpj);
      expect(saveSpy).toHaveBeenCalledWith(expect.any(Provider));
      expect(result).toEqual<CreateProviderOutputDto>({ id: result.id });
    });
  });

  describe('integration tests', () => {
    it('should throw an error if cnpj is duplicate', async() => {
      // Arrange
      await sut.execute(data);

      // Act & Assert
      expect.assertions(1);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(ProviderDuplicateCnpjError);
      });
    });

    it('should throw an error if cnpj is duplicate even with different formatting', async() => {
      // Arrange
      await sut.execute(data);
      const formattedData = { ...data, cnpj: '11.222.333/0001-81' };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(formattedData).catch((error) => {
        expect(error).toBeInstanceOf(ProviderDuplicateCnpjError);
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

    it('should persist the provider with RECURRING type in the database', async() => {
      // Act
      const createResult = await sut.execute(data);
      const providerDto = await findProviderById.execute(createResult.id);

      // Assert
      expect(providerDto).toBeDefined();
      expect(providerDto).toEqual<ProviderDto>({
        id: createResult.id,
        name: data.name,
        type: ProviderType.RECURRING,
        valueInCents: data.valueInCents,
        cnpj: data.cnpj,
        ie: data.ie,
        paymentDay: data.paymentDay,
        paymentExpirationDate: null,
        companyName: data.companyName,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        reference: data.reference,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        email: data.email,
        website: data.website,
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

    it('should persist the provider with ONE_TIME type in the database', async() => {
      // Arrange
      const oneTimeData: CreateProviderInputDto = {
        ...data,
        cnpj: '96013602000152',
        type: ProviderType.ONE_TIME,
        paymentDay: null,
        paymentExpirationDate: new Date('2025-12-31'),
      };

      // Act
      const createResult = await sut.execute(oneTimeData);
      const providerDto = await findProviderById.execute(createResult.id);

      // Assert
      expect(providerDto).toBeDefined();
      expect(providerDto.type).toBe(ProviderType.ONE_TIME);
      expect(providerDto.paymentDay).toBeNull();
      expect(providerDto.paymentExpirationDate).toEqual(new Date('2025-12-31'));
    });
  });
});
