import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ShipperDuplicateCnpjError } from 'src/app/shipper/domain/errors/duplicate-cnpj.error';
import { ShipperNotFoundError } from 'src/app/shipper/domain/errors/shipper-not-found';
import { ShipperModule } from 'src/app/shipper/shipper.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ShipperDto } from '../../dtos/shipper.dto';
import { CreateShipper } from '../create-shipper/create-shipper.service';
import { CreateShipperInputDto } from '../create-shipper/dtos/create-shipper.dto';
import { EditShipperInputDto } from './dtos/edit-shipper.dto';
import { EditShipper } from './edit-shipper.service';

describe('EditShipper', () => {
  let sut: EditShipper;
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

    sut = module.get(EditShipper);
    prisma = module.get(PrismaService);
    createShipper = module.get(CreateShipper);

    // Clean database for integration tests
    await prisma.shipper.deleteMany();

    // Create a shipper for testing edits
    createShipperData = {
      companyName: 'Transportadora Original Ltda',
      fantasyName: 'Original Transport',
      cnpj: '12345678000195',
      contact: 'João Silva',
      representative: 'Maria Santos',
      zipCode: '01234567',
      street: 'Rua Original',
      number: '123',
      complement: 'Galpão 1',
      reference: 'Próximo ao terminal',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
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
      const editData: EditShipperInputDto = {};

      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(null);
      const editSpy = jest.spyOn(sut['shipperDao'], 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      await expect(sut.execute(nonExistentId, editData)).rejects.toBeInstanceOf(ShipperNotFoundError);
      expect(findByIdSpy).toHaveBeenCalledWith(nonExistentId);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should throw ShipperDuplicateCnpjError when cnpj already exists for another shipper', async() => {
      // Arrange
      const existingShipper = createMock<ShipperDto>({
        id: existingShipperId,
        cnpj: '12345678000195',
      });
      const duplicateShipper = createMock<ShipperDto>({
        id: 'another-id',
        cnpj: '98765432000187',
      });
      const editData: EditShipperInputDto = { cnpj: '98765432000187' };

      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(existingShipper);
      const findByCnpjSpy = jest.spyOn(sut['shipperDao'], 'findByCnpj').mockResolvedValue(duplicateShipper);
      const editSpy = jest.spyOn(sut['shipperDao'], 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(4);
      await expect(sut.execute(existingShipperId, editData)).rejects.toBeInstanceOf(ShipperDuplicateCnpjError);
      expect(findByIdSpy).toHaveBeenCalledWith(existingShipperId);
      expect(findByCnpjSpy).toHaveBeenCalledWith(editData.cnpj);
      expect(editSpy).not.toHaveBeenCalled();
    });

    it('should not check for cnpj duplication when cnpj is not being changed', async() => {
      // Arrange
      const existingShipper = createMock<ShipperDto>({
        id: existingShipperId,
        cnpj: '12345678000195',
      });
      const editData: EditShipperInputDto = { companyName: 'Updated Company Name' };

      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(existingShipper);
      const findByCnpjSpy = jest.spyOn(sut['shipperDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['shipperDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingShipperId, editData);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(existingShipperId);
      expect(findByCnpjSpy).not.toHaveBeenCalled();
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });
    });

    it('should allow same cnpj when updating the same shipper', async() => {
      // Arrange
      const existingShipper = createMock<ShipperDto>({
        id: existingShipperId,
        cnpj: '12345678000195',
      });
      const editData: EditShipperInputDto = {
        companyName: 'Updated Name',
        cnpj: '12345678000195',
      };

      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(existingShipper);
      const findByCnpjSpy = jest.spyOn(sut['shipperDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['shipperDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingShipperId, editData);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(existingShipperId);
      expect(findByCnpjSpy).not.toHaveBeenCalled();
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });
    });

    it('should successfully update shipper when all validations pass', async() => {
      // Arrange
      const existingShipper = createMock<ShipperDto>({
        id: existingShipperId,
        cnpj: '12345678000195',
      });
      const editData: EditShipperInputDto = {
        companyName: 'Updated Company Name',
        fantasyName: 'Updated Fantasy',
        contact: 'Pedro Oliveira',
      };

      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(existingShipper);
      const editSpy = jest.spyOn(sut['shipperDao'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute(existingShipperId, editData);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(existingShipperId);
      expect(editSpy).toHaveBeenCalledWith(existingShipperId, editData);
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });
    });

    it('should call dao methods with correct parameters', async() => {
      // Arrange
      const existingShipper = createMock<ShipperDto>({ id: existingShipperId });
      const editData: EditShipperInputDto = { companyName: 'New Name' };

      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(existingShipper);
      const editSpy = jest.spyOn(sut['shipperDao'], 'edit').mockResolvedValue();

      // Act
      await sut.execute(existingShipperId, editData);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(editSpy).toHaveBeenCalledWith(existingShipperId, editData);
    });
  });

  describe('integration tests', () => {
    it('should throw ShipperNotFoundError when shipper does not exist in database', async() => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const editData: EditShipperInputDto = { companyName: 'Updated Shipper' };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(nonExistentId, editData)).rejects.toBeInstanceOf(ShipperNotFoundError);
    });

    it('should throw ShipperDuplicateCnpjError when cnpj already exists for another shipper in database', async() => {
      // Arrange
      const anotherShipperData: CreateShipperInputDto = {
        ...createShipperData,
        cnpj: '98765432000187',
      };
      await createShipper.execute(anotherShipperData);

      const editData: EditShipperInputDto = { cnpj: '98765432000187' };

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(existingShipperId, editData)).rejects.toBeInstanceOf(ShipperDuplicateCnpjError);
    });

    it('should successfully update shipper companyName in database', async() => {
      // Arrange
      const editData: EditShipperInputDto = {
        companyName: 'Updated Transportadora Name',
      };

      // Act
      const result = await sut.execute(existingShipperId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });

      // Verify update in database
      const updatedShipper = await prisma.shipper.findUnique({
        where: { id: existingShipperId },
      });

      expect(updatedShipper).toBeDefined();
      expect(updatedShipper).toEqual<ShipperDto>({
        ...createShipperData,
        companyName: 'Updated Transportadora Name',
        id: existingShipperId,
        createdAt: updatedShipper!.createdAt,
        updatedAt: updatedShipper!.updatedAt,
      });
    });

    it('should successfully update multiple fields in database', async() => {
      // Arrange
      const editData: EditShipperInputDto = {
        companyName: 'Completely Updated Transportadora',
        fantasyName: 'Updated Express',
        contact: 'Carlos Almeida',
        representative: 'Fernanda Costa',
        city: 'Rio de Janeiro',
        state: 'RJ',
      };

      // Act
      const result = await sut.execute(existingShipperId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });

      // Verify updates in database
      const updatedShipper = await prisma.shipper.findUnique({
        where: { id: existingShipperId },
      });

      expect(updatedShipper).toBeDefined();
      expect(updatedShipper).toEqual<ShipperDto>({
        ...createShipperData,
        ...editData,
        id: existingShipperId,
        createdAt: updatedShipper!.createdAt,
        updatedAt: updatedShipper!.updatedAt,
      });
    });

    it('should successfully update cnpj to new unique value', async() => {
      // Arrange
      const editData: EditShipperInputDto = {
        cnpj: '11111111000111',
      };

      // Act
      const result = await sut.execute(existingShipperId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });

      // Verify update in database
      const updatedShipper = await prisma.shipper.findUnique({
        where: { id: existingShipperId },
      });

      expect(updatedShipper).toBeDefined();
      expect(updatedShipper?.cnpj).toBe(editData.cnpj);
    });

    it('should handle optional fields being set to null', async() => {
      // Arrange
      const editData: EditShipperInputDto = {
        complement: null,
        reference: null,
      };

      // Act
      const result = await sut.execute(existingShipperId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });

      // Verify updates in database
      const updatedShipper = await prisma.shipper.findUnique({
        where: { id: existingShipperId },
      });

      expect(updatedShipper).toBeDefined();
      expect(updatedShipper?.complement).toBeNull();
      expect(updatedShipper?.reference).toBeNull();
    });

    it('should update only specified fields leaving others unchanged', async() => {
      // Arrange
      const editData: EditShipperInputDto = {
        contact: 'New Contact Person',
      };

      // Act
      const result = await sut.execute(existingShipperId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });

      // Verify only contact was updated
      const updatedShipper = await prisma.shipper.findUnique({
        where: { id: existingShipperId },
      });

      expect(updatedShipper).toBeDefined();
      expect(updatedShipper?.contact).toBe('New Contact Person');
      expect(updatedShipper?.companyName).toBe(createShipperData.companyName);
      expect(updatedShipper?.fantasyName).toBe(createShipperData.fantasyName);
      expect(updatedShipper?.representative).toBe(createShipperData.representative);
    });

    it('should update all address fields successfully', async() => {
      // Arrange
      const editData: EditShipperInputDto = {
        zipCode: '99999999',
        street: 'Avenida Nova',
        number: '999',
        complement: 'Andar 9',
        reference: 'Em frente ao shopping',
        neighborhood: 'Novo Bairro',
        city: 'Curitiba',
        state: 'PR',
      };

      // Act
      const result = await sut.execute(existingShipperId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });

      // Verify address updates in database
      const updatedShipper = await prisma.shipper.findUnique({
        where: { id: existingShipperId },
      });

      expect(updatedShipper).toBeDefined();
      expect(updatedShipper?.zipCode).toBe(editData.zipCode);
      expect(updatedShipper?.street).toBe(editData.street);
      expect(updatedShipper?.number).toBe(editData.number);
      expect(updatedShipper?.complement).toBe(editData.complement);
      expect(updatedShipper?.reference).toBe(editData.reference);
      expect(updatedShipper?.neighborhood).toBe(editData.neighborhood);
      expect(updatedShipper?.city).toBe(editData.city);
      expect(updatedShipper?.state).toBe(editData.state);
    });

    it('should not modify other shippers when updating one', async() => {
      // Arrange - Create another shipper
      const anotherShipperData: CreateShipperInputDto = {
        companyName: 'Another Transportadora Ltda',
        fantasyName: 'Another Transport',
        cnpj: '22222222000222',
        contact: 'Another Contact',
        representative: 'Another Rep',
        zipCode: '22222222',
        street: 'Another Street',
        number: '222',
        complement: null,
        reference: null,
        neighborhood: 'Another Neighborhood',
        city: 'Another City',
        state: 'AC',
      };
      const anotherResult = await createShipper.execute(anotherShipperData);

      const editData: EditShipperInputDto = {
        companyName: 'Updated First Shipper',
      };

      // Act
      await sut.execute(existingShipperId, editData);

      // Assert
      const firstShipper = await prisma.shipper.findUnique({
        where: { id: existingShipperId },
      });

      const secondShipper = await prisma.shipper.findUnique({
        where: { id: anotherResult.id },
      });

      expect(firstShipper?.companyName).toBe('Updated First Shipper');
      expect(secondShipper?.companyName).toBe(anotherShipperData.companyName);
    });

    it('should handle empty update data object', async() => {
      // Arrange
      const editData: EditShipperInputDto = {};

      // Act
      const result = await sut.execute(existingShipperId, editData);

      // Assert
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora atualizada com sucesso!' });

      // Verify nothing changed
      const shipper = await prisma.shipper.findUnique({
        where: { id: existingShipperId },
      });

      expect(shipper?.companyName).toBe(createShipperData.companyName);
      expect(shipper?.cnpj).toBe(createShipperData.cnpj);
    });
  });
});
