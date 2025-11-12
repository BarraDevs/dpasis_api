import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ShipperDuplicateCnpjError } from 'src/app/shipper/domain/errors/duplicate-cnpj.error';
import { ShipperModule } from 'src/app/shipper/shipper.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ShipperDto } from '../../dtos/shipper.dto';
import { CreateShipper } from './create-shipper.service';
import { CreateShipperInputDto, CreateShipperOutputDto } from './dtos/create-shipper.dto';

describe('CreateShipper', () => {
  let sut: CreateShipper;
  let prisma: PrismaService;
  let data: CreateShipperInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ShipperModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateShipper);
    prisma = module.get(PrismaService);

    // Clean database for integration tests
    await prisma.shipper.deleteMany();

    data = {
      companyName: 'Transportadora Express Ltda',
      fantasyName: 'Express Transportes',
      cnpj: '12345678000195',
      contact: 'João Silva',
      representative: 'Maria Santos',
      zipCode: '01234567',
      street: 'Rua das Transportadoras',
      number: '123',
      complement: 'Galpão 10',
      reference: 'Próximo ao terminal rodoviário',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    };
  });

  afterEach(async() => {
    await prisma.shipper.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw ShipperDuplicateCnpjError when cnpj already exists', async() => {
      // Arrange
      const existingShipper = createMock<ShipperDto>();
      const findByCnpjSpy = jest.spyOn(sut['shipperDao'], 'findByCnpj').mockResolvedValue(existingShipper);
      const saveSpy = jest.spyOn(sut['shipperDao'], 'save').mockResolvedValue('new-shipper-id');

      // Act & Assert
      expect.assertions(3);
      await expect(sut.execute(data)).rejects.toBeInstanceOf(ShipperDuplicateCnpjError);
      expect(findByCnpjSpy).toHaveBeenCalledWith(data.cnpj);
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should create shipper successfully when cnpj does not exist', async() => {
      // Arrange
      const expectedId = 'new-shipper-id';
      const findByCnpjSpy = jest.spyOn(sut['shipperDao'], 'findByCnpj').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['shipperDao'], 'save').mockResolvedValue(expectedId);

      // Act
      const result = await sut.execute(data);

      // Assert
      expect(findByCnpjSpy).toHaveBeenCalledWith(data.cnpj);
      expect(saveSpy).toHaveBeenCalledWith(data);
      expect(result).toEqual<CreateShipperOutputDto>({ id: expectedId });
    });

    it('should call dao methods with correct parameters', async() => {
      // Arrange
      const findByCnpjSpy = jest.spyOn(sut['shipperDao'], 'findByCnpj').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['shipperDao'], 'save').mockResolvedValue('shipper-id');

      // Act
      await sut.execute(data);

      // Assert
      expect(findByCnpjSpy).toHaveBeenCalledTimes(1);
      expect(findByCnpjSpy).toHaveBeenCalledWith(data.cnpj);
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith(data);
    });
  });

  describe('integration tests', () => {
    it('should throw ShipperDuplicateCnpjError when cnpj already exists in database', async() => {
      // Arrange
      await sut.execute(data);

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(data)).rejects.toBeInstanceOf(ShipperDuplicateCnpjError);
    });

    it('should persist shipper in database and return generated id', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');

      // Verify shipper was actually saved in database
      const savedShipper = await prisma.shipper.findUnique({
        where: { id: result.id },
      });

      expect(savedShipper).toBeDefined();
      expect(savedShipper).toEqual<ShipperDto>({
        id: result.id,
        companyName: data.companyName,
        fantasyName: data.fantasyName,
        cnpj: data.cnpj,
        contact: data.contact,
        representative: data.representative,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        reference: data.reference,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        createdAt: savedShipper!.createdAt,
        updatedAt: savedShipper!.updatedAt,
      });
    });

    it('should create multiple shippers with different cnpjs', async() => {
      // Arrange
      const secondShipperData: CreateShipperInputDto = {
        ...data,
        companyName: 'Transportadora Veloz Ltda',
        cnpj: '98765432000187',
      };

      // Act
      const firstResult = await sut.execute(data);
      const secondResult = await sut.execute(secondShipperData);

      // Assert
      expect(firstResult.id).not.toBe(secondResult.id);

      const firstShipper = await prisma.shipper.findUnique({
        where: { id: firstResult.id },
      });
      const secondShipper = await prisma.shipper.findUnique({
        where: { id: secondResult.id },
      });

      expect(firstShipper).toBeDefined();
      expect(secondShipper).toBeDefined();
      expect(firstShipper?.cnpj).toBe(data.cnpj);
      expect(secondShipper?.cnpj).toBe(secondShipperData.cnpj);
    });

    it('should handle optional fields correctly', async() => {
      // Arrange
      const dataWithNulls: CreateShipperInputDto = {
        ...data,
        complement: null,
        reference: null,
      };

      // Act
      const result = await sut.execute(dataWithNulls);

      // Assert
      expect(result).toBeDefined();

      const savedShipper = await prisma.shipper.findUnique({
        where: { id: result.id },
      });

      expect(savedShipper).toBeDefined();
      expect(savedShipper).toEqual<ShipperDto>({
        ...data,
        complement: null,
        reference: null,
        id: result.id,
        createdAt: savedShipper!.createdAt,
        updatedAt: savedShipper!.updatedAt,
      });
    });

    it('should preserve all field values correctly in database', async() => {
      // Act
      const result = await sut.execute(data);

      // Assert
      const savedShipper = await prisma.shipper.findUnique({
        where: { id: result.id },
      });

      expect(savedShipper?.companyName).toBe(data.companyName);
      expect(savedShipper?.fantasyName).toBe(data.fantasyName);
      expect(savedShipper?.cnpj).toBe(data.cnpj);
      expect(savedShipper?.contact).toBe(data.contact);
      expect(savedShipper?.representative).toBe(data.representative);
      expect(savedShipper?.zipCode).toBe(data.zipCode);
      expect(savedShipper?.street).toBe(data.street);
      expect(savedShipper?.number).toBe(data.number);
      expect(savedShipper?.complement).toBe(data.complement);
      expect(savedShipper?.reference).toBe(data.reference);
      expect(savedShipper?.neighborhood).toBe(data.neighborhood);
      expect(savedShipper?.city).toBe(data.city);
      expect(savedShipper?.state).toBe(data.state);
    });

    it('should generate unique ids for each shipper', async() => {
      // Arrange
      const secondData: CreateShipperInputDto = { ...data, cnpj: '11111111000111' };
      const thirdData: CreateShipperInputDto = { ...data, cnpj: '22222222000222' };

      // Act
      const result1 = await sut.execute(data);
      const result2 = await sut.execute(secondData);
      const result3 = await sut.execute(thirdData);

      // Assert
      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).not.toBe(result3.id);
      expect(result2.id).not.toBe(result3.id);
    });
  });
});
