import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ShipperNotFoundError } from 'src/app/shipper/domain/errors/shipper-not-found.error';
import { ShipperModule } from 'src/app/shipper/shipper.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ShipperDto } from '../../dtos/shipper.dto';
import { CreateShipper } from '../create-shipper/create-shipper.service';
import { CreateShipperInputDto } from '../create-shipper/dtos/create-shipper.dto';
import { FindShipperById } from './find-shipper-by-id.service';

describe('FindShipperById', () => {
  let sut: FindShipperById;
  let prisma: PrismaService;
  let createShipper: CreateShipper;
  let existingShipperId: string;
  let createShipperData: CreateShipperInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ShipperModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindShipperById);
    prisma = module.get(PrismaService);
    createShipper = module.get(CreateShipper);

    // Clean database for integration tests
    await prisma.shipper.deleteMany();

    // Create a shipper for testing
    createShipperData = {
      companyName: 'Transportadora Teste Ltda',
      fantasyName: 'Teste Transport',
      cnpj: '12345678000195',
      contact: 'João Silva',
      representative: 'Maria Santos',
      zipCode: '01234567',
      street: 'Rua Teste',
      number: '123',
      complement: 'Galpão 1',
      reference: 'Próximo ao terminal',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      companyIds: [],
    };

    const createResult = await createShipper.execute(createShipperData);
    existingShipperId = createResult.id;
  });

  afterEach(async() => {
    await prisma.shipper.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw ShipperNotFoundError when shipper does not exist', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      expect.assertions(2);
      await expect(sut.execute(nonExistentId)).rejects.toBeInstanceOf(ShipperNotFoundError);
      expect(findByIdSpy).toHaveBeenCalledWith(nonExistentId);
    });

    it('should return shipper data when shipper exists', async() => {
      // Arrange
      const shipperId = 'existing-shipper-id';
      const expectedShipper = createMock<ShipperDto>({
        id: shipperId,
        companyName: 'Transportadora Teste Ltda',
        fantasyName: 'Teste Transport',
        cnpj: '12345678000195',
        contact: 'João Silva',
        representative: 'Maria Santos',
        zipCode: '01234567',
        street: 'Rua Teste',
        number: '123',
        complement: 'Galpão 1',
        reference: 'Próximo ao terminal',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(expectedShipper);

      // Act
      const result = await sut.execute(shipperId);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(shipperId);
      expect(result).toEqual(expectedShipper);
    });

    it('should call shipperDao.findById with correct id', async() => {
      // Arrange
      const shipperId = 'test-shipper-id';
      const mockShipper = createMock<ShipperDto>({ id: shipperId });
      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(mockShipper);

      // Act
      await sut.execute(shipperId);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(shipperId);
      expect(findByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should return exactly what shipperDao returns when shipper exists', async() => {
      // Arrange
      const shipperId = 'test-id';
      const mockShipperData = createMock<ShipperDto>({
        id: shipperId,
        companyName: 'Specific Transportadora Name',
        cnpj: '98765432000187',
      });

      jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(mockShipperData);

      // Act
      const result = await sut.execute(shipperId);

      // Assert
      expect(result).toBe(mockShipperData);
    });
  });

  describe('integration tests', () => {
    it('should throw ShipperNotFoundError when shipper does not exist in database', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id-123';

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(nonExistentId)).rejects.toBeInstanceOf(ShipperNotFoundError);
    });

    it('should return complete shipper data when shipper exists in database', async() => {
      // Act
      const result = await sut.execute(existingShipperId);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<ShipperDto>({
        id: existingShipperId,
        companyName: createShipperData.companyName,
        fantasyName: createShipperData.fantasyName,
        cnpj: createShipperData.cnpj,
        contact: createShipperData.contact,
        representative: createShipperData.representative,
        zipCode: createShipperData.zipCode,
        street: createShipperData.street,
        number: createShipperData.number,
        complement: createShipperData.complement,
        reference: createShipperData.reference,
        neighborhood: createShipperData.neighborhood,
        city: createShipperData.city,
        state: createShipperData.state,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: [],
      });
    });

    it('should return different shippers for different IDs', async() => {
      // Arrange
      const secondShipperData: CreateShipperInputDto = {
        ...createShipperData,
        companyName: 'Segunda Transportadora Ltda',
        fantasyName: 'Second Transport',
        cnpj: '18247807000199',
      };

      const secondShipperResult = await createShipper.execute(secondShipperData);
      const secondShipperId = secondShipperResult.id;

      // Act
      const firstShipper = await sut.execute(existingShipperId);
      const secondShipper = await sut.execute(secondShipperId);

      // Assert
      expect(firstShipper.id).toBe(existingShipperId);
      expect(secondShipper.id).toBe(secondShipperId);
      expect(firstShipper.companyName).toBe(createShipperData.companyName);
      expect(secondShipper.companyName).toBe(secondShipperData.companyName);
      expect(firstShipper.cnpj).toBe(createShipperData.cnpj);
      expect(secondShipper.cnpj).toBe(secondShipperData.cnpj);
      expect(firstShipper.id).not.toBe(secondShipper.id);
    });

    it('should handle shipper with null optional fields', async() => {
      // Arrange
      const shipperWithNulls: CreateShipperInputDto = {
        ...createShipperData,
        companyName: 'Transportadora Com Nulls Ltda',
        cnpj: '90910555000163',
        complement: null,
        reference: null,
      };

      const createResult = await createShipper.execute(shipperWithNulls);
      const shipperWithNullsId = createResult.id;

      // Act
      const result = await sut.execute(shipperWithNullsId);

      // Assert
      expect(result).toEqual<ShipperDto>({
        companyName: shipperWithNulls.companyName,
        fantasyName: shipperWithNulls.fantasyName,
        cnpj: shipperWithNulls.cnpj,
        contact: shipperWithNulls.contact,
        representative: shipperWithNulls.representative,
        zipCode: shipperWithNulls.zipCode,
        street: shipperWithNulls.street,
        number: shipperWithNulls.number,
        complement: shipperWithNulls.complement,
        reference: shipperWithNulls.reference,
        neighborhood: shipperWithNulls.neighborhood,
        city: shipperWithNulls.city,
        state: shipperWithNulls.state,
        id: shipperWithNullsId,
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        companies: [],
      });
    });

    it('should return consistent data on multiple calls for same ID', async() => {
      // Act
      const firstCall = await sut.execute(existingShipperId);
      const secondCall = await sut.execute(existingShipperId);

      // Assert
      expect(firstCall).toEqual(secondCall);
      expect(firstCall.id).toBe(secondCall.id);
      expect(firstCall.companyName).toBe(secondCall.companyName);
      expect(firstCall.cnpj).toBe(secondCall.cnpj);
      expect(firstCall.createdAt).toEqual(secondCall.createdAt);
      expect(firstCall.updatedAt).toEqual(secondCall.updatedAt);
    });

    it('should return all shipper fields correctly', async() => {
      // Act
      const result = await sut.execute(existingShipperId);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.companyName).toBe(createShipperData.companyName);
      expect(result.fantasyName).toBe(createShipperData.fantasyName);
      expect(result.cnpj).toBe(createShipperData.cnpj);
      expect(result.contact).toBe(createShipperData.contact);
      expect(result.representative).toBe(createShipperData.representative);
      expect(result.zipCode).toBe(createShipperData.zipCode);
      expect(result.street).toBe(createShipperData.street);
      expect(result.number).toBe(createShipperData.number);
      expect(result.complement).toBe(createShipperData.complement);
      expect(result.reference).toBe(createShipperData.reference);
      expect(result.neighborhood).toBe(createShipperData.neighborhood);
      expect(result.city).toBe(createShipperData.city);
      expect(result.state).toBe(createShipperData.state);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw ShipperNotFoundError for empty string ID', async() => {
      // Arrange
      const emptyId = '';

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(emptyId)).rejects.toBeInstanceOf(ShipperNotFoundError);
    });
  });
});
