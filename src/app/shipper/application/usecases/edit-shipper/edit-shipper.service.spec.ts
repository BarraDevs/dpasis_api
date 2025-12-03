import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Company } from '@prisma/client';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ShipperDuplicateCnpjError } from '../../../domain/errors/duplicate-cnpj.error';
import { ShipperNotFoundError } from '../../../domain/errors/shipper-not-found.error';
import { ShipperModule } from '../../../shipper.module';
import { ShipperDto } from '../../dtos/shipper.dto';
import type { IShipperDao } from '../../persistence/dao/shipper-dao.interface';
import type { IShipperRepository } from '../../persistence/repository/shipper-repository.interface';
import { CreateShipper } from '../create-shipper/create-shipper.service';
import { CreateShipperInputDto } from '../create-shipper/dtos/create-shipper.dto';
import { FindShipperById } from '../find-shipper-by-id/find-shipper-by-id.service';
import { EditShipperInputDto } from './dtos/edit-shipper.dto';
import { EditShipper } from './edit-shipper.service';

describe('EditShipper', () => {
  let sut: EditShipper;
  let prisma: PrismaService;
  let createShipper: CreateShipper;
  let findShipperById: FindShipperById;
  let findCompanyById: FindCompanyById;
  let data: CreateShipperInputDto;
  let companyId: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ShipperModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditShipper);
    prisma = module.get(PrismaService);
    createShipper = module.get(CreateShipper);
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
          EditShipper,
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

      sut = module.get(EditShipper);
      shipperDao = module.get(TOKENS.ShipperDao);
      shipperRepository = module.get(TOKENS.ShipperRepository);
      findCompanyById = module.get(FindCompanyById);
    });

    it('should throw error when shipper does not exist', async() => {
      // Arrange
      const shipperId = 'non-existing-shipper-id';
      const input: EditShipperInputDto = {};

      jest.spyOn(shipperDao, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(sut.execute(shipperId, input)).rejects.toThrow(ShipperNotFoundError);
    });

    it('should throw error when CNPJ is duplicated', async() => {
      // Arrange
      const shipperId = 'shipper-id-1';
      const input: EditShipperInputDto = {
        cnpj: '33.119.159/0001-89',
      };

      const existingShipper = createMock<ShipperDto>({
        id: shipperId,
        cnpj: '20.975.708/0001-75',
        companies: [{ id: 'company-id-1', name: 'Company 1' }],
      });

      const duplicateShipper = createMock<ShipperDto>({
        id: 'other-shipper-id',
        cnpj: '43.927.286/0001-68',
      });

      jest.spyOn(shipperDao, 'findById').mockResolvedValue(existingShipper);
      jest.spyOn(shipperDao, 'findByCnpj').mockResolvedValue(duplicateShipper);

      // Act & Assert
      await expect(sut.execute(shipperId, input)).rejects.toThrow(ShipperDuplicateCnpjError);
    });

    it('should not throw error when CNPJ is unchanged', async() => {
      // Arrange
      const shipperId = 'shipper-id-1';
      const input: EditShipperInputDto = {
        cnpj: '43.927.286/0001-68',
        companyName: 'New Company Name',
      };

      const existingShipper = createMock<ShipperDto>({
        id: shipperId,
        cnpj: '43927286000168',
        companies: [{ id: 'company-id-1', name: 'Company 1' }],
      });

      jest.spyOn(shipperDao, 'findById').mockResolvedValue(existingShipper);
      jest.spyOn(shipperRepository, 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(shipperId, input);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });
    });

    it('should verify all companies exist when companyIds are provided', async() => {
      // Arrange
      const shipperId = 'shipper-id-1';
      const input: EditShipperInputDto = {
        companyIds: ['company-id-1', 'company-id-2'],
      };

      const existingShipper = createMock<ShipperDto>({
        id: shipperId,
        cnpj: '43927286000168',
        companies: [{ id: 'company-id-old', name: 'Old Company' }],
      });

      jest.spyOn(shipperDao, 'findById').mockResolvedValue(existingShipper);
      const findCompanySpy = jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock());
      jest.spyOn(shipperRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute(shipperId, input);

      // Assert
      expect(findCompanySpy).toHaveBeenCalledTimes(2);
      expect(findCompanySpy).toHaveBeenCalledWith('company-id-1');
      expect(findCompanySpy).toHaveBeenCalledWith('company-id-2');
    });

    it('should not verify companies when companyIds are not provided', async() => {
      // Arrange
      const shipperId = 'shipper-id-1';
      const input: EditShipperInputDto = {
        companyName: 'New Company Name',
      };

      const existingShipper = createMock<ShipperDto>({
        id: shipperId,
        cnpj: '05158719000179',
        companies: [{ id: 'company-id-1', name: 'Company 1' }],
      });

      jest.spyOn(shipperDao, 'findById').mockResolvedValue(existingShipper);
      const findCompanySpy = jest.spyOn(findCompanyById, 'execute');
      jest.spyOn(shipperRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute(shipperId, input);

      // Assert
      expect(findCompanySpy).not.toHaveBeenCalled();
    });

    it('should call shipperRepository.edit with updated shipper', async() => {
      // Arrange
      const shipperId = 'shipper-id-1';
      const input: EditShipperInputDto = {
        companyName: 'New Company Name',
        fantasyName: 'New Fantasy Name',
      };

      const existingShipper = createMock<ShipperDto>({
        id: shipperId,
        companyName: 'Old Company Name',
        fantasyName: 'Old Fantasy Name',
        cnpj: '05158719000179',
        companies: [{ id: 'company-id-1', name: 'Company 1' }],
      });

      jest.spyOn(shipperDao, 'findById').mockResolvedValue(existingShipper);
      const editSpy = jest.spyOn(shipperRepository, 'edit').mockResolvedValue();

      // Act
      await sut.execute(shipperId, input);

      // Assert
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          _props: expect.objectContaining({
            id: shipperId,
            companyName: input.companyName,
            fantasyName: input.fantasyName,
          }),
        }),
      );
    });

    it('should return success message', async() => {
      // Arrange
      const shipperId = 'shipper-id-1';
      const input: EditShipperInputDto = {
        companyName: 'New Company Name',
      };

      const existingShipper = createMock<ShipperDto>({
        id: shipperId,
        cnpj: '05158719000179',
        companies: [{ id: 'company-id-1', name: 'Company 1' }],
      });

      jest.spyOn(shipperDao, 'findById').mockResolvedValue(existingShipper);
      jest.spyOn(shipperRepository, 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(shipperId, input);

      // Assert
      expect(result).toEqual<SuccessMessage>({
        message: 'Transportadora atualizada com sucesso!',
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
          document: '05158719000179',
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
          document: '43345060000159',
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

      companyId = company01.id;

      data = {
        companyName: 'Transportadora ABC Ltda',
        fantasyName: 'ABC Transportes',
        cnpj: '08260358000165',
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
        companyIds: [companyId],
      };
    });

    it('should throw an error when shipper does not exist', async() => {
      // Arrange
      const shipperId = 'non-existing-shipper-id';

      // Act & Assert
      expect.assertions(1);
      return sut.execute(shipperId, {}).catch((error) => {
        expect(error).toBeInstanceOf(ShipperNotFoundError);
      });
    });

    it('should throw an error when cnpj is already used by another shipper', async() => {
      // Arrange
      await createShipper.execute(data);
      const shipper2 = await createShipper.execute({ ...data, cnpj: '25245792000195' });

      const editData: EditShipperInputDto = {
        cnpj: data.cnpj,
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(shipper2.id, editData).catch((error) => {
        expect(error).toBeInstanceOf(ShipperDuplicateCnpjError);
      });
    });

    it('should throw an error when company does not exist', async() => {
      // Arrange
      const shipper = await createShipper.execute(data);

      const editData: EditShipperInputDto = {
        companyIds: ['non-existing-company-id'],
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(shipper.id, editData).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
      });
    });

    it('should not throw an error when cnpj and company are unchanged', async() => {
      // Arrange
      const shipper = await createShipper.execute(data);

      const editData: EditShipperInputDto = {
        companyName: 'New Company Name',
      };

      // Act
      const result = await sut.execute(shipper.id, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });
    });

    it('should not throw an error when cnpj is "changed" but remains the same', async() => {
      // Arrange
      const shipper = await createShipper.execute(data);

      const editData: EditShipperInputDto = {
        cnpj: data.cnpj,
      };

      // Act
      const result = await sut.execute(shipper.id, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });
    });

    it('should not edit anything when no data is provided', async() => {
      // Arrange
      const shipper = await createShipper.execute(data);
      const shipperBeforeEdit = await findShipperById.execute(shipper.id);

      const editData: EditShipperInputDto = {};

      // Act
      await sut.execute(shipper.id, editData);

      // Assert
      const editedShipper = await findShipperById.execute(shipper.id);
      expect(editedShipper).toMatchObject({ ...shipperBeforeEdit, updatedAt: editedShipper!.updatedAt });
    });

    it('should edit a shipper successfully', async() => {
      // Arrange
      const shipper = await createShipper.execute(data);

      const editData: EditShipperInputDto = {
        companyName: 'Transportadora XYZ Ltda',
        fantasyName: 'XYZ Transportes',
        cnpj: '36980496000154',
        contact: '(21) 91234-5678',
        representative: 'Maria Santos',
      };

      // Act
      await sut.execute(shipper.id, editData);

      // Assert
      const editedShipper = await findShipperById.execute(shipper.id);
      expect(editedShipper).toEqual<ShipperDto>({
        id: shipper.id,
        companyName: editData.companyName!,
        fantasyName: editData.fantasyName!,
        cnpj: '36980496000154',
        contact: editData.contact!,
        representative: editData.representative!,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        reference: data.reference,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        active: true,
        createdAt: editedShipper!.createdAt,
        updatedAt: editedShipper!.updatedAt,
        companies: editedShipper!.companies,
      });
    });

    it('should change the company of a shipper successfully', async() => {
      // Arrange
      const shipper = await createShipper.execute(data);

      const editData: EditShipperInputDto = {
        companyIds: [company02.id],
      };

      // Act
      await sut.execute(shipper.id, editData);

      // Assert
      const editedShipper = await findShipperById.execute(shipper.id);
      expect(editedShipper!.companies[0].id).toBe(company02.id);
    });

    it('should edit multiple companies of a shipper successfully', async() => {
      // Arrange
      const shipper = await createShipper.execute(data);

      const editData: EditShipperInputDto = {
        companyIds: [company01.id, company02.id],
      };

      // Act
      await sut.execute(shipper.id, editData);

      // Assert
      const editedShipper = await findShipperById.execute(shipper.id);
      expect(editedShipper!.companies).toHaveLength(2);
      expect(editedShipper!.companies).toEqual(
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

    it('should edit address fields successfully', async() => {
      // Arrange
      const shipper = await createShipper.execute(data);

      const editData: EditShipperInputDto = {
        zipCode: '09876-543',
        street: 'Avenida Principal',
        number: '999',
        complement: 'Andar 10',
        reference: 'Perto da praça',
        neighborhood: 'Centro Novo',
        city: 'Rio de Janeiro',
        state: 'RJ',
      };

      // Act
      await sut.execute(shipper.id, editData);

      // Assert
      const editedShipper = await findShipperById.execute(shipper.id);
      expect(editedShipper).toMatchObject({
        zipCode: editData.zipCode,
        street: editData.street,
        number: editData.number,
        complement: editData.complement,
        reference: editData.reference,
        neighborhood: editData.neighborhood,
        city: editData.city,
        state: editData.state,
      });
    });

    it('should set optional fields to null', async() => {
      // Arrange
      const shipper = await createShipper.execute(data);

      const editData: EditShipperInputDto = {
        complement: null,
        reference: null,
      };

      // Act
      await sut.execute(shipper.id, editData);

      // Assert
      const editedShipper = await findShipperById.execute(shipper.id);
      expect(editedShipper!.complement).toBeNull();
      expect(editedShipper!.reference).toBeNull();
    });

    it('should edit all fields at once successfully', async() => {
      // Arrange
      const shipper = await createShipper.execute(data);

      const editData: EditShipperInputDto = {
        companyName: 'Transportadora Completa Ltda',
        fantasyName: 'Completa Transportes',
        cnpj: '39839945000137',
        contact: '(31) 94444-4444',
        representative: 'Carlos Souza',
        zipCode: '44444-444',
        street: 'Rua Completa',
        number: '444',
        complement: 'Complemento Completo',
        reference: 'Referência Completa',
        neighborhood: 'Bairro Completo',
        city: 'Belo Horizonte',
        state: 'MG',
        companyIds: [company02.id],
      };

      // Act
      await sut.execute(shipper.id, editData);

      // Assert
      const editedShipper = await findShipperById.execute(shipper.id);
      expect(editedShipper).toEqual<ShipperDto>({
        id: shipper.id,
        companyName: editData.companyName!,
        fantasyName: editData.fantasyName!,
        cnpj: editData.cnpj!,
        contact: editData.contact!,
        representative: editData.representative!,
        zipCode: editData.zipCode!,
        street: editData.street!,
        number: editData.number!,
        complement: editData.complement ?? null,
        reference: editData.reference ?? null,
        neighborhood: editData.neighborhood!,
        city: editData.city!,
        state: editData.state!,
        active: true,
        createdAt: editedShipper!.createdAt,
        updatedAt: editedShipper!.updatedAt,
        companies: [
          {
            id: company02.id,
            name: company02.name,
          },
        ],
      });
    });
  });
});
