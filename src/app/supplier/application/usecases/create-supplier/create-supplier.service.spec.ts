import { Test, TestingModule } from '@nestjs/testing';
import { Supplier } from 'src/app/supplier/domain/entities/supplier.entity';
import { SupplierDuplicateCnpjError } from 'src/app/supplier/domain/errors/duplicate-cnpj.error';
import { SupplierDuplicateIeError } from 'src/app/supplier/domain/errors/duplicate-ie.error';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateSupplier } from './create-supplier.service';
import { CreateSupplierInputDto, CreateSupplierOutputDto } from './dtos/create-supplier.dto';

describe('CreateSupplier', () => {
  let sut: CreateSupplier;
  let prisma: PrismaService;

  const validDto: CreateSupplierInputDto = {
    cnpj: '11.222.333/0001-44',
    ie: '123.456.789.110',
    group: 'Matéria Prima',
    type: 'Nacional',
    companyName: 'Fornecedor ABC Ltda',
    fantasyName: 'ABC Fornecedor',
    representative: 'João Silva',
  };

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateSupplier);
    prisma = module.get(PrismaService);

    await prisma.supplier.deleteMany();
  });

  afterAll(async() => {
    await prisma.supplier.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should call supplierDao.findByCnpj with correct CNPJ', async() => {
      // Arrange
      const findByCnpjSpy = jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(null);
      jest.spyOn(sut['supplierRepository'], 'save').mockResolvedValue();

      // Act
      await sut.execute(validDto);

      // Assert
      expect(findByCnpjSpy).toHaveBeenCalledWith(validDto.cnpj);
      expect(findByCnpjSpy).toHaveBeenCalledTimes(1);
    });

    it('should call supplierDao.findByIe with correct IE', async() => {
      // Arrange
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      const findByIeSpy = jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(null);
      jest.spyOn(sut['supplierRepository'], 'save').mockResolvedValue();

      // Act
      await sut.execute(validDto);

      // Assert
      expect(findByIeSpy).toHaveBeenCalledWith(validDto.ie);
      expect(findByIeSpy).toHaveBeenCalledTimes(1);
    });

    it('should call supplierRepository.save with created supplier', async() => {
      // Arrange
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['supplierRepository'], 'save').mockResolvedValue();

      // Act
      await sut.execute(validDto);

      // Assert
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith(expect.any(Supplier));

      const savedSupplier = saveSpy.mock.calls[0][0];
      expect(savedSupplier.props.cnpj).toBe(validDto.cnpj);
      expect(savedSupplier.props.ie).toBe(validDto.ie);
      expect(savedSupplier.props.companyName).toBe(validDto.companyName);
    });

    it('should throw SupplierDuplicateCnpjError when CNPJ already exists', async() => {
      // Arrange
      const existingSupplier = { id: 'existing-id', cnpj: validDto.cnpj };
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(existingSupplier as any);

      // Act & Assert
      await expect(sut.execute(validDto)).rejects.toThrow(SupplierDuplicateCnpjError);
    });

    it('should throw SupplierDuplicateIeError when IE already exists', async() => {
      // Arrange
      const existingSupplier = { id: 'existing-id', ie: validDto.ie };
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(existingSupplier as any);

      // Act & Assert
      await expect(sut.execute(validDto)).rejects.toThrow(SupplierDuplicateIeError);
    });

    it('should not call findByIe if CNPJ is duplicated', async() => {
      // Arrange
      const existingSupplier = { id: 'existing-id', cnpj: validDto.cnpj };
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(existingSupplier as any);
      const findByIeSpy = jest.spyOn(sut['supplierDao'], 'findByIe');

      // Act & Assert
      await expect(sut.execute(validDto)).rejects.toThrow(SupplierDuplicateCnpjError);
      expect(findByIeSpy).not.toHaveBeenCalled();
    });

    it('should return supplier id when successfully created', async() => {
      // Arrange
      jest.spyOn(sut['supplierDao'], 'findByCnpj').mockResolvedValue(null);
      jest.spyOn(sut['supplierDao'], 'findByIe').mockResolvedValue(null);
      jest.spyOn(sut['supplierRepository'], 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(validDto);

      // Assert
      expect(result).toEqual<CreateSupplierOutputDto>({
        id: expect.any(String),
      });
    });
  });

  describe('integration tests', () => {
    it('should successfully create a new supplier', async() => {
      // Act
      const result = await sut.execute(validDto);

      // Assert
      expect(result).toEqual<CreateSupplierOutputDto>({
        id: expect.any(String),
      });

      // Verify supplier was saved in database
      const savedSupplier = await prisma.supplier.findUnique({
        where: { id: result.id },
      });

      expect(savedSupplier).not.toBeNull();
      expect(savedSupplier?.cnpj).toBe(validDto.cnpj);
      expect(savedSupplier?.ie).toBe(validDto.ie);
      expect(savedSupplier?.group).toBe(validDto.group);
      expect(savedSupplier?.type).toBe(validDto.type);
      expect(savedSupplier?.companyName).toBe(validDto.companyName);
      expect(savedSupplier?.fantasyName).toBe(validDto.fantasyName);
      expect(savedSupplier?.representative).toBe(validDto.representative);
      expect(savedSupplier?.active).toBe(true);
      expect(savedSupplier?.createdAt).toBeInstanceOf(Date);
      expect(savedSupplier?.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw SupplierDuplicateCnpjError when trying to create supplier with existing CNPJ', async() => {
      // Arrange
      await prisma.supplier.create({
        data: {
          id: 'existing-supplier-id',
          cnpj: validDto.cnpj,
          ie: 'different-ie-123',
          group: 'Different Group',
          type: 'Different Type',
          companyName: 'Different Company',
          fantasyName: 'Different Fantasy',
          representative: 'Different Representative',
          active: true,
        },
      });

      // Act & Assert
      await expect(sut.execute(validDto)).rejects.toThrow(SupplierDuplicateCnpjError);
    });

    it('should throw SupplierDuplicateIeError when trying to create supplier with existing IE', async() => {
      // Arrange
      await prisma.supplier.create({
        data: {
          id: 'existing-supplier-id',
          cnpj: 'different-cnpj-123',
          ie: validDto.ie,
          group: 'Different Group',
          type: 'Different Type',
          companyName: 'Different Company',
          fantasyName: 'Different Fantasy',
          representative: 'Different Representative',
          active: true,
        },
      });

      // Act & Assert
      await expect(sut.execute(validDto)).rejects.toThrow(SupplierDuplicateIeError);
    });

    it('should create multiple suppliers with different CNPJ and IE', async() => {
      // Arrange
      const supplier2Dto: CreateSupplierInputDto = {
        ...validDto,
        cnpj: '22.333.444/0001-55',
        ie: '987.654.321.000',
        companyName: 'Fornecedor XYZ Ltda',
      };

      // Act
      const result1 = await sut.execute(validDto);
      const result2 = await sut.execute(supplier2Dto);

      // Assert
      expect(result1.id).not.toBe(result2.id);

      const supplier1 = await prisma.supplier.findUnique({ where: { id: result1.id } });
      const supplier2 = await prisma.supplier.findUnique({ where: { id: result2.id } });

      expect(supplier1?.cnpj).toBe(validDto.cnpj);
      expect(supplier2?.cnpj).toBe(supplier2Dto.cnpj);
      expect(supplier1?.ie).toBe(validDto.ie);
      expect(supplier2?.ie).toBe(supplier2Dto.ie);
    });
  });
});
