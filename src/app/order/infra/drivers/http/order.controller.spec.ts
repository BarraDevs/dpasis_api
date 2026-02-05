import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { Payload } from 'src/app/authentication/domain/types/payload.type';
import { OrderDto } from 'src/app/order/application/dtos/order.dto';
import { FindAllOrdersQueryDto } from 'src/app/order/application/usecases/find-all-orders/dtos/find-all-orders.dto';
import { OrderModule } from 'src/app/order/order.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { OrderController } from './order.controller';

describe('OrderController', () => {
  let sut: OrderController;
  const mockUser = createMock<Payload>();

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        OrderModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(OrderController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAllOrdersService with correct parameters', async() => {
      // Arrange
      const queries = createMock<FindAllOrdersQueryDto>();
      const output = createMock<IPagination<OrderDto>>();
      const findAllOrdersSpy = jest.spyOn(sut['findAllOrdersService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllOrdersSpy).toHaveBeenCalledWith(queries);
      expect(result).toEqual(output);
    });
  });

  describe('findOne', () => {
    it('should call findOrderByIdService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const output = createMock<OrderDto>();
      const findOrderByIdSpy = jest.spyOn(sut['findOrderByIdService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findOrderByIdSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });
  });

  describe('startProduction', () => {
    it('should call startProductionService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = { observation: 'Iniciando produção' };
      const output = createMock<SuccessMessage>();
      const startProductionSpy = jest.spyOn(sut['startProductionService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.startProduction(params, mockUser, body);

      // Assert
      expect(startProductionSpy).toHaveBeenCalledWith(params.id, mockUser.sub, body);
      expect(result).toEqual(output);
    });

    it('should call startProductionService without observation', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = {};
      const output = createMock<SuccessMessage>();
      const startProductionSpy = jest.spyOn(sut['startProductionService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.startProduction(params, mockUser, body);

      // Assert
      expect(startProductionSpy).toHaveBeenCalledWith(params.id, mockUser.sub, body);
      expect(result).toEqual(output);
    });
  });

  describe('invoice', () => {
    it('should call invoiceOrderService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = { observation: 'NF-e emitida' };
      const output = createMock<SuccessMessage>();
      const invoiceOrderSpy = jest.spyOn(sut['invoiceOrderService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.invoice(params, mockUser, body);

      // Assert
      expect(invoiceOrderSpy).toHaveBeenCalledWith(params.id, mockUser.sub, body);
      expect(result).toEqual(output);
    });

    it('should call invoiceOrderService without observation', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = {};
      const output = createMock<SuccessMessage>();
      const invoiceOrderSpy = jest.spyOn(sut['invoiceOrderService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.invoice(params, mockUser, body);

      // Assert
      expect(invoiceOrderSpy).toHaveBeenCalledWith(params.id, mockUser.sub, body);
      expect(result).toEqual(output);
    });
  });

  describe('ship', () => {
    it('should call shipOrderService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = { trackingCode: 'BR123456789', observation: 'Enviado via transportadora' };
      const output = createMock<SuccessMessage>();
      const shipOrderSpy = jest.spyOn(sut['shipOrderService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.ship(params, mockUser, body);

      // Assert
      expect(shipOrderSpy).toHaveBeenCalledWith(params.id, mockUser.sub, body);
      expect(result).toEqual(output);
    });

    it('should call shipOrderService with trackingCode only', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = { trackingCode: 'BR987654321' };
      const output = createMock<SuccessMessage>();
      const shipOrderSpy = jest.spyOn(sut['shipOrderService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.ship(params, mockUser, body);

      // Assert
      expect(shipOrderSpy).toHaveBeenCalledWith(params.id, mockUser.sub, body);
      expect(result).toEqual(output);
    });
  });

  describe('deliver', () => {
    it('should call deliverOrderService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = { observation: 'Entregue ao cliente' };
      const output = createMock<SuccessMessage>();
      const deliverOrderSpy = jest.spyOn(sut['deliverOrderService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.deliver(params, mockUser, body);

      // Assert
      expect(deliverOrderSpy).toHaveBeenCalledWith(params.id, mockUser.sub, body);
      expect(result).toEqual(output);
    });

    it('should call deliverOrderService without observation', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = {};
      const output = createMock<SuccessMessage>();
      const deliverOrderSpy = jest.spyOn(sut['deliverOrderService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.deliver(params, mockUser, body);

      // Assert
      expect(deliverOrderSpy).toHaveBeenCalledWith(params.id, mockUser.sub, body);
      expect(result).toEqual(output);
    });
  });

  describe('cancel', () => {
    it('should call cancelOrderService with correct parameters', async() => {
      // Arrange
      const params = createMock<Params>();
      const body = { reason: 'Cliente desistiu da compra' };
      const output = createMock<SuccessMessage>();
      const cancelOrderSpy = jest.spyOn(sut['cancelOrderService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.cancel(params, mockUser, body);

      // Assert
      expect(cancelOrderSpy).toHaveBeenCalledWith(params.id, mockUser.sub, body);
      expect(result).toEqual(output);
    });
  });
});
