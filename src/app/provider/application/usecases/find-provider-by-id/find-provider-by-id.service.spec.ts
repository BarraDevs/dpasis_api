import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { ProviderType } from 'src/app/provider/domain/enums/provider-type.enum';
import { ProviderNotFoundError } from 'src/app/provider/domain/errors/provider-not-found.error';
import { ProviderModule } from 'src/app/provider/provider.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProviderDto } from '../../dtos/provider.dto';
import { CreateProvider } from '../create-provider/create-provider.service';
import { CreateProviderInputDto } from '../create-provider/dtos/create-provider.dto';
import { FindProviderById } from './find-provider-by-id.service';

describe('FindProviderById', () => {
  let sut: FindProviderById;
  let prisma: PrismaService;
  let createProvider: CreateProvider;
  let createCompany: CreateCompany;
  let companyId: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ProviderModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindProviderById);
    prisma = module.get(PrismaService);
    createProvider = module.get(CreateProvider);
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
      return sut.execute('non-existent-id').catch((error) => {
        expect(error).toBeInstanceOf(ProviderNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith('non-existent-id');
      });
    });

    it('should return the provider if found', async() => {
      // Arrange
      const providerData = createMock<ProviderDto>();
      const findByIdSpy = jest.spyOn(sut['providerDao'], 'findById').mockResolvedValue(providerData);

      // Act
      const result = await sut.execute('provider-id');

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith('provider-id');
      expect(result).toEqual(providerData);
    });
  });

  describe('integration tests', () => {
    it('should throw an error if provider is not found', async() => {
      // Act & Assert
      expect.assertions(1);
      return sut.execute('non-existent-id').catch((error) => {
        expect(error).toBeInstanceOf(ProviderNotFoundError);
      });
    });

    it('should return the provider if found', async() => {
      // Arrange
      const data: CreateProviderInputDto = {
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

      const createResult = await createProvider.execute(data);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<ProviderDto>({
        id: createResult.id,
        name: data.name,
        type: data.type,
        valueInCents: data.valueInCents,
        cnpj: data.cnpj,
        ie: data.ie,
        paymentDay: data.paymentDay,
        paymentExpirationDate: data.paymentExpirationDate,
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
  });
});
