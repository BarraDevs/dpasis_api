import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ShipperNotFoundError } from 'src/app/shipper/domain/errors/shipper-not-found';
import { ShipperModule } from 'src/app/shipper/shipper.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ShipperDto } from '../../dtos/shipper.dto';
import { DeleteShipper } from './delete-shipper.service';

describe('DeleteShipper', () => {
  let sut: DeleteShipper;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ShipperModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(DeleteShipper);
    prisma = module.get(PrismaService);

    await prisma.shipper.deleteMany();
  });

  afterEach(async() => {
    await prisma.shipper.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should delete shipper successfully when shipper exists', async() => {
      // Arrange
      const shipperId = 'valid-shipper-id';
      const mockShipper = createMock<ShipperDto>();

      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(mockShipper);
      const deleteSpy = jest.spyOn(sut['shipperDao'], 'delete').mockResolvedValue(undefined);

      // Act
      const result = await sut.execute(shipperId);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(shipperId);
      expect(deleteSpy).toHaveBeenCalledWith(shipperId);
      expect(result).toEqual<SuccessMessage>({ message: 'Transportadora deletada com sucesso!' });
    });

    it('should throw ShipperNotFoundError when shipper does not exist', async() => {
      // Arrange
      const shipperId = 'non-existent-shipper-id';
      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(null);
      const deleteSpy = jest.spyOn(sut['shipperDao'], 'delete').mockResolvedValue(undefined);

      // Act & Assert
      expect.assertions(3);
      await expect(sut.execute(shipperId)).rejects.toBeInstanceOf(ShipperNotFoundError);
      expect(findByIdSpy).toHaveBeenCalledWith(shipperId);
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('should call findById before attempting to delete', async() => {
      // Arrange
      const shipperId = 'test-shipper-id';
      const mockShipper = createMock<ShipperDto>();

      const findByIdSpy = jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(mockShipper);
      const deleteSpy = jest.spyOn(sut['shipperDao'], 'delete').mockResolvedValue(undefined);

      // Act
      await sut.execute(shipperId);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(shipperId);
      expect(findByIdSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith(shipperId);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });

    it('should return correct success message', async() => {
      // Arrange
      const shipperId = 'valid-shipper-id';
      const mockShipper = createMock<ShipperDto>();

      jest.spyOn(sut['shipperDao'], 'findById').mockResolvedValue(mockShipper);
      jest.spyOn(sut['shipperDao'], 'delete').mockResolvedValue(undefined);

      // Act
      const result = await sut.execute(shipperId);

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Transportadora deletada com sucesso!');
    });
  });

  describe('integration tests', () => {
    let existingShipper: ShipperDto;

    beforeEach(async() => {
      existingShipper = await prisma.shipper.create({
        data: {
          companyName: 'Transportadora para Deletar Ltda',
          fantasyName: 'Delete Transport',
          cnpj: '12345678000195',
          contact: 'João da Silva',
          representative: 'Maria Santos',
          zipCode: '01234567',
          street: 'Rua de Teste',
          number: '123',
          complement: 'Galpão 1',
          reference: 'Próximo ao terminal',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
        },
      });
    });

    it('should delete existing shipper successfully from database', async() => {
      // Act
      const result = await sut.execute(existingShipper.id);

      // Assert
      expect(result).toEqual({ message: 'Transportadora deletada com sucesso!' });

      // Verify shipper was deleted from database
      const deletedShipper = await prisma.shipper.findUnique({
        where: { id: existingShipper.id },
      });
      expect(deletedShipper).toBeNull();
    });

    it('should throw ShipperNotFoundError for non-existent shipper in database', async() => {
      // Arrange
      const nonExistentId = 'non-existent-shipper-id';

      // Act & Assert
      expect.assertions(2);
      await expect(sut.execute(nonExistentId)).rejects.toBeInstanceOf(ShipperNotFoundError);

      // Verify existing shipper was not affected
      const stillExistingShipper = await prisma.shipper.findUnique({
        where: { id: existingShipper.id },
      });
      expect(stillExistingShipper).not.toBeNull();
    });

    it('should throw ShipperNotFoundError for empty string ID', async() => {
      // Arrange
      const emptyId = '';

      // Act & Assert
      expect.assertions(1);
      await expect(sut.execute(emptyId)).rejects.toBeInstanceOf(ShipperNotFoundError);
    });

    it('should not affect other shippers when deleting one shipper', async() => {
      // Arrange - Create additional shippers
      const additionalShipper1 = await prisma.shipper.create({
        data: {
          companyName: 'Transportadora para Manter 1 Ltda',
          fantasyName: 'Keep Transport 1',
          cnpj: '11111111000111',
          contact: 'Pedro Silva',
          representative: 'Ana Costa',
          zipCode: '11111111',
          street: 'Rua A',
          number: '111',
          complement: null,
          reference: null,
          neighborhood: 'Bairro A',
          city: 'Rio de Janeiro',
          state: 'RJ',
        },
      });

      const additionalShipper2 = await prisma.shipper.create({
        data: {
          companyName: 'Transportadora para Manter 2 Ltda',
          fantasyName: 'Keep Transport 2',
          cnpj: '22222222000222',
          contact: 'Carlos Oliveira',
          representative: 'Juliana Lima',
          zipCode: '22222222',
          street: 'Rua B',
          number: '222',
          complement: 'Sala 2',
          reference: 'Próximo ao shopping',
          neighborhood: 'Bairro B',
          city: 'Belo Horizonte',
          state: 'MG',
        },
      });

      // Act
      await sut.execute(existingShipper.id);

      // Assert
      const deletedShipper = await prisma.shipper.findUnique({
        where: { id: existingShipper.id },
      });

      const keptShipper1 = await prisma.shipper.findUnique({
        where: { id: additionalShipper1.id },
      });

      const keptShipper2 = await prisma.shipper.findUnique({
        where: { id: additionalShipper2.id },
      });

      expect(deletedShipper).toBeNull();
      expect(keptShipper1).not.toBeNull();
      expect(keptShipper2).not.toBeNull();
      expect(keptShipper1?.companyName).toBe('Transportadora para Manter 1 Ltda');
      expect(keptShipper2?.companyName).toBe('Transportadora para Manter 2 Ltda');
    });

    it('should delete shipper and verify it cannot be found afterwards', async() => {
      // Act
      await sut.execute(existingShipper.id);

      // Assert - Try to delete again
      expect.assertions(1);
      await expect(sut.execute(existingShipper.id)).rejects.toBeInstanceOf(ShipperNotFoundError);
    });

    it('should delete shipper with different properties successfully', async() => {
      // Arrange - Create shipper with minimal required fields
      const minimalShipper = await prisma.shipper.create({
        data: {
          companyName: 'Transportadora Mínima Ltda',
          fantasyName: 'Minimal',
          cnpj: '33333333000333',
          contact: 'Contato Teste',
          representative: 'Representante Teste',
          zipCode: '33333333',
          street: 'Rua Teste',
          number: '333',
          complement: null,
          reference: null,
          neighborhood: 'Teste',
          city: 'Teste',
          state: 'TS',
        },
      });

      // Act
      const result = await sut.execute(minimalShipper.id);

      // Assert
      expect(result).toEqual({ message: 'Transportadora deletada com sucesso!' });

      const deletedShipper = await prisma.shipper.findUnique({
        where: { id: minimalShipper.id },
      });
      expect(deletedShipper).toBeNull();
    });

    it('should maintain database integrity after multiple deletions', async() => {
      // Arrange - Create multiple shippers
      const shipper1 = await prisma.shipper.create({
        data: {
          companyName: 'Transportadora 1',
          fantasyName: 'Trans 1',
          cnpj: '44444444000444',
          contact: 'Contato 1',
          representative: 'Rep 1',
          zipCode: '44444444',
          street: 'Rua 1',
          number: '444',
          complement: null,
          reference: null,
          neighborhood: 'Bairro 1',
          city: 'Cidade 1',
          state: 'C1',
        },
      });

      const shipper2 = await prisma.shipper.create({
        data: {
          companyName: 'Transportadora 2',
          fantasyName: 'Trans 2',
          cnpj: '55555555000555',
          contact: 'Contato 2',
          representative: 'Rep 2',
          zipCode: '55555555',
          street: 'Rua 2',
          number: '555',
          complement: null,
          reference: null,
          neighborhood: 'Bairro 2',
          city: 'Cidade 2',
          state: 'C2',
        },
      });

      // Act - Delete in sequence
      await sut.execute(existingShipper.id);
      await sut.execute(shipper1.id);
      await sut.execute(shipper2.id);

      // Assert
      const count = await prisma.shipper.count();
      expect(count).toBe(0);
    });
  });
});
