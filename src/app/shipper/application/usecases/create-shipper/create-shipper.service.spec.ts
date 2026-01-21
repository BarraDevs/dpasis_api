import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Company } from '@prisma/client';
import { CompanyDto } from 'src/app/company/application/dtos/company.dto';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ShipperDuplicateCnpjError } from '../../../domain/errors/duplicate-cnpj.error';
import { ShipperModule } from '../../../shipper.module';
import { ShipperDto } from '../../dtos/shipper.dto';
import type { IShipperDao } from '../../persistence/dao/shipper-dao.interface';
import type { IShipperRepository } from '../../persistence/repository/shipper-repository.interface';
import { FindShipperById } from '../find-shipper-by-id/find-shipper-by-id.service';
import { CreateShipper } from './create-shipper.service';
import { CreateShipperInputDto, CreateShipperOutputDto } from './dtos/create-shipper.dto';

describe('CreateShipper', () => {
  let sut: CreateShipper;
  let prisma: PrismaService;
  let findShipperById: FindShipperById;
  let findCompanyById: FindCompanyById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ShipperModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateShipper);
    prisma = module.get(PrismaService);
    findShipperById = module.get(FindShipperById);
    findCompanyById = module.get(FindCompanyById);

    await prisma.shipper.deleteMany();
    await prisma.company.deleteMany();
  });

  afterEach(async() => {
    await prisma.shipper.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    let shipperDao: IShipperDao;
    let shipperRepository: IShipperRepository;

    beforeEach(async() => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CreateShipper,
          {
            provide: TOKENS.ShipperDao,
            useValue: createMock<IShipperDao>(),
          },
          {
            provide: TOKENS.ShipperRepository,
            useValue: createMock<IShipperRepository>(),
          },
          {
            provide: FindCompanyById,
            useValue: createMock<FindCompanyById>(),
          },
        ],
      }).compile();

      sut = module.get(CreateShipper);
      shipperDao = module.get(TOKENS.ShipperDao);
      shipperRepository = module.get(TOKENS.ShipperRepository);
      findCompanyById = module.get(FindCompanyById);
    });

    it('should throw error when CNPJ is duplicated', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora ABC Ltda',
        fantasyName: 'ABC Transportes',
        cnpj: '68529158000197',
        contact: '(11) 98765-4321',
        representative: 'João Silva',
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '100',
        complement: 'Sala 5',
        reference: 'Próximo ao mercado',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        companyIds: ['company-id-1'],
      };

      const existingShipper = createMock<ShipperDto>();
      jest.spyOn(shipperDao, 'findByCnpj').mockResolvedValue(existingShipper);

      // Act & Assert
      await expect(sut.execute(input)).rejects.toThrow(ShipperDuplicateCnpjError);
    });

    it('should verify all companies exist', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora ABC Ltda',
        fantasyName: 'ABC Transportes',
        cnpj: '11240693000106',
        contact: '(11) 98765-4321',
        representative: 'João Silva',
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        companyIds: ['company-id-1', 'company-id-2'],
      };

      jest.spyOn(shipperDao, 'findByCnpj').mockResolvedValue(null);
      const findCompanySpy = jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock());
      jest.spyOn(shipperRepository, 'save').mockResolvedValue();

      // Act
      await sut.execute(input);

      // Assert
      expect(findCompanySpy).toHaveBeenCalledTimes(2);
      expect(findCompanySpy).toHaveBeenCalledWith('company-id-1');
      expect(findCompanySpy).toHaveBeenCalledWith('company-id-2');
    });

    it('should throw CompanyNotActiveError when company is inactive', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora ABC Ltda',
        fantasyName: 'ABC Transportes',
        cnpj: '11240693000106',
        contact: '(11) 98765-4321',
        representative: 'João Silva',
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        companyIds: ['company-id-1'],
      };

      jest.spyOn(shipperDao, 'findByCnpj').mockResolvedValue(null);
      const inactiveCompany = createMock<CompanyDto>({
        id: 'company-id-1',
        name: 'Empresa Inativa',
        fantasyName: 'Empresa Inativa',
        document: '00000000000000',
        ie: '000000000',
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        zipCode: '00000-000',
        street: 'Rua Inativa',
        number: '0',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        phone01: '0000000000',
        phone02: null,
        cellphone: null,
        email01: 'inactive@company.com',
        email02: null,
      });
      const findCompanySpy = jest.spyOn(findCompanyById, 'execute').mockResolvedValue(inactiveCompany);
      const saveSpy = jest.spyOn(shipperRepository, 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      await expect(sut.execute(input)).rejects.toBeInstanceOf(CompanyNotActiveError);
      expect(findCompanySpy).toHaveBeenCalledWith('company-id-1');
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should call shipperRepository.save with created shipper', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora ABC Ltda',
        fantasyName: 'ABC Transportes',
        cnpj: '22231440000192',
        contact: '(11) 98765-4321',
        representative: 'João Silva',
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        companyIds: ['company-id-1'],
      };

      jest.spyOn(shipperDao, 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock());
      const saveSpy = jest.spyOn(shipperRepository, 'save').mockResolvedValue();

      // Act
      await sut.execute(input);

      // Assert
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          _props: expect.objectContaining({
            id: expect.any(String),
            companyName: input.companyName,
            fantasyName: input.fantasyName,
            cnpj: expect.any(String), // CNPJ is formatted by the value object
            contact: input.contact,
            representative: input.representative,
            zipCode: input.zipCode,
            street: input.street,
            number: input.number,
            complement: input.complement,
            reference: input.reference,
            neighborhood: input.neighborhood,
            city: input.city,
            state: input.state,
            companyIds: input.companyIds,
            active: true,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should return created shipper id', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora ABC Ltda',
        fantasyName: 'ABC Transportes',
        cnpj: '22231440000192',
        contact: '(11) 98765-4321',
        representative: 'João Silva',
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        companyIds: ['company-id-1'],
      };

      jest.spyOn(shipperDao, 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock());
      jest.spyOn(shipperRepository, 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(input);

      // Assert
      expect(result).toEqual<CreateShipperOutputDto>({
        id: expect.any(String),
      });
    });
  });

  describe('integration tests', () => {
    let company01: Company;
    let company02: Company;

    beforeEach(async() => {
      company01 = await prisma.company.create({
        data: {
          name: 'Company 01',
          fantasyName: 'Company 01 Fantasy',
          document: '63193451000102',
          ie: '123456789',
          zipCode: '01234-567',
          street: 'Street 01',
          number: '100',
          neighborhood: 'Neighborhood 01',
          complement: null,
          reference: null,
          city: 'São Paulo',
          state: 'SP',
          cellphone: '11987654321',
          phone01: '1133334444',
          phone02: null,
          email01: 'company01@test.com',
          email02: null,
          active: true,
        },
      });

      company02 = await prisma.company.create({
        data: {
          name: 'Company 02',
          fantasyName: 'Company 02 Fantasy',
          document: '03747069000171',
          ie: '987654321',
          zipCode: '09876-543',
          street: 'Street 02',
          number: '200',
          neighborhood: 'Neighborhood 02',
          complement: null,
          reference: null,
          city: 'Rio de Janeiro',
          state: 'RJ',
          cellphone: '21987654321',
          phone01: '2133334444',
          phone02: null,
          email01: 'company02@test.com',
          email02: null,
          active: true,
        },
      });
    });

    it('should throw error when CNPJ is duplicated', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora ABC Ltda',
        fantasyName: 'ABC Transportes',
        cnpj: '63193451000102',
        contact: '(11) 98765-4321',
        representative: 'João Silva',
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '100',
        complement: 'Sala 5',
        reference: 'Próximo ao mercado',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        companyIds: [company01.id],
      };

      await sut.execute(input);

      // Act & Assert
      await expect(sut.execute(input)).rejects.toThrow(ShipperDuplicateCnpjError);
    });

    it('should throw error when company does not exist', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora ABC Ltda',
        fantasyName: 'ABC Transportes',
        cnpj: '63193451000102',
        contact: '(11) 98765-4321',
        representative: 'João Silva',
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        companyIds: ['non-existing-company-id'],
      };

      // Act & Assert
      await expect(sut.execute(input)).rejects.toThrow(CompanyNotFoundError);
    });

    it('should throw CompanyNotActiveError when company is inactive', async() => {
      // Arrange
      const inactiveCompany = await prisma.company.create({
        data: {
          name: 'Company Inactive',
          fantasyName: 'Company Inactive Fantasy',
          document: '42901774000180',
          ie: '555666777',
          zipCode: '12345-678',
          street: 'Inactive Street',
          number: '999',
          neighborhood: 'Inactive Neighborhood',
          complement: null,
          reference: null,
          city: 'São Paulo',
          state: 'SP',
          cellphone: '11999999999',
          phone01: '1133334444',
          phone02: null,
          email01: 'inactive@test.com',
          email02: null,
          active: false,
        },
      });

      const input: CreateShipperInputDto = {
        companyName: 'Transportadora ABC Ltda',
        fantasyName: 'ABC Transportes',
        cnpj: '63193451000102',
        contact: '(11) 98765-4321',
        representative: 'João Silva',
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '100',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        companyIds: [inactiveCompany.id],
      };

      // Act & Assert
      await expect(sut.execute(input)).rejects.toThrow(CompanyNotActiveError);
    });

    it('should create a shipper successfully with all fields', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora ABC Ltda',
        fantasyName: 'ABC Transportes',
        cnpj: '63193451000102',
        contact: '(11) 98765-4321',
        representative: 'João Silva',
        zipCode: '01234-567',
        street: 'Rua das Flores',
        number: '100',
        complement: 'Sala 5',
        reference: 'Próximo ao mercado',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        companyIds: [company01.id],
      };

      // Act
      const output = await sut.execute(input);

      // Assert
      expect(output).toEqual<CreateShipperOutputDto>({
        id: expect.any(String),
      });

      const createdShipper = await findShipperById.execute(output.id);
      expect(createdShipper).toBeDefined();
      expect(createdShipper).toEqual<ShipperDto>({
        id: output.id,
        companyName: input.companyName,
        fantasyName: input.fantasyName,
        cnpj: '63193451000102',
        contact: input.contact,
        representative: input.representative,
        zipCode: input.zipCode,
        street: input.street,
        number: input.number,
        complement: input.complement,
        reference: input.reference,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: [
          {
            id: company01.id,
            name: company01.name,
          },
        ],
      });
    });

    it('should create a shipper successfully with optional fields as null', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora XYZ Ltda',
        fantasyName: 'XYZ Transportes',
        cnpj: '63193451000102',
        contact: '(21) 98765-4321',
        representative: 'Maria Santos',
        zipCode: '09876-543',
        street: 'Avenida Principal',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        companyIds: [company02.id],
      };

      // Act
      const output = await sut.execute(input);

      // Assert
      const createdShipper = await findShipperById.execute(output.id);
      expect(createdShipper).toBeDefined();
      expect(createdShipper!.complement).toBeNull();
      expect(createdShipper!.reference).toBeNull();
    });

    it('should create a shipper with multiple companies', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora Multi Ltda',
        fantasyName: 'Multi Transportes',
        cnpj: '63193451000102',
        contact: '(11) 91111-1111',
        representative: 'Carlos Alberto',
        zipCode: '11111-111',
        street: 'Rua Central',
        number: '300',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'Brasília',
        state: 'DF',
        companyIds: [company01.id, company02.id],
      };

      // Act
      const output = await sut.execute(input);

      // Assert
      const createdShipper = await findShipperById.execute(output.id);
      expect(createdShipper).toBeDefined();
      expect(createdShipper!.companies).toHaveLength(2);
      expect(createdShipper!.companies).toEqual(
        expect.arrayContaining([
          {
            id: company01.id,
            name: company01.name,
          },
          {
            id: company02.id,
            name: company02.name,
          },
        ]),
      );
    });

    it('should create a shipper with active status as true by default', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora DEF Ltda',
        fantasyName: 'DEF Transportes',
        cnpj: '63193451000102',
        contact: '(31) 92222-2222',
        representative: 'Ana Paula',
        zipCode: '22222-222',
        street: 'Rua Nova',
        number: '400',
        complement: null,
        reference: null,
        neighborhood: 'Bairro Novo',
        city: 'Belo Horizonte',
        state: 'MG',
        companyIds: [company01.id],
      };

      // Act
      const output = await sut.execute(input);

      // Assert
      const createdShipper = await findShipperById.execute(output.id);
      expect(createdShipper).toBeDefined();
      expect(createdShipper!.active).toBe(true);
    });

    it('should format CNPJ correctly', async() => {
      // Arrange
      const input: CreateShipperInputDto = {
        companyName: 'Transportadora GHI Ltda',
        fantasyName: 'GHI Transportes',
        cnpj: '79.380.058/0001-68',
        contact: '(41) 93333-3333',
        representative: 'Pedro Oliveira',
        zipCode: '33333-333',
        street: 'Avenida Teste',
        number: '500',
        complement: null,
        reference: null,
        neighborhood: 'Bairro Teste',
        city: 'Curitiba',
        state: 'PR',
        companyIds: [company01.id],
      };

      // Act
      const output = await sut.execute(input);

      // Assert
      const createdShipper = await findShipperById.execute(output.id);
      expect(createdShipper).toBeDefined();
      expect(createdShipper!.cnpj).toBe('79380058000168');
    });
  });
});
