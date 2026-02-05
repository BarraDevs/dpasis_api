import { OrderStatus } from '../../enums/order-status.enum';
import { CannotCancelDeliveredOrderError } from '../errors/cannot-cancel-delivered-order.error';
import { InvalidOrderStatusTransitionError } from '../errors/invalid-order-status-transition.error';
import { OrderStatusHistory, OrderStatusHistoryProps } from '../value-objects/order-status-history.vo';
import { Order } from './order.entity';

describe('Order Entity', () => {
  const budgetId = 'budget-id-123';
  const accountId = 'account-id-123';

  describe('create', () => {
    it('should create a new order with CREATED status', () => {
      // Act
      const order = Order.create({ budgetId, createdBy: accountId });

      // Assert
      expect(order.props).toEqual<Order['props']>({
        id: expect.any(String),
        budgetId,
        status: OrderStatus.CREATED,
        trackingCode: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: accountId,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
      });
    });

    it('should initialize status history with CREATED status', () => {
      // Act
      const order = Order.create({ budgetId, createdBy: accountId });

      // Assert
      expect(order.statusHistory).toHaveLength(1);
      expect(order.statusHistory[0].status).toBe(OrderStatus.CREATED);
      expect(order.statusHistory[0].changedBy).toBe(accountId);
      expect(order.statusHistory[0].changedAt).toBeInstanceOf(Date);
      expect(order.statusHistory[0].observation).toBeNull();
      expect(order.statusHistory[0].toJSON()).toEqual<OrderStatusHistoryProps>({
        status: OrderStatus.CREATED,
        changedAt: expect.any(Date),
        changedBy: accountId,
        observation: null,
      });
    });
  });

  describe('load', () => {
    it('should load an existing order', () => {
      // Arrange
      const props = {
        id: 'order-id-123',
        budgetId,
        status: OrderStatus.PRODUCTION,
        trackingCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: accountId,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
      };

      const statusHistory: OrderStatusHistory[] = [
        OrderStatusHistory.create(OrderStatus.CREATED, accountId),
        OrderStatusHistory.create(OrderStatus.PRODUCTION, accountId, 'Iniciando produção'),
      ];

      // Act
      const order = Order.load(props, statusHistory);

      // Assert
      expect(order.props).toEqual<Order['props']>(props);
      expect(order.statusHistory).toEqual<OrderStatusHistory[]>(statusHistory);
    });
  });

  describe('startProduction', () => {
    it('should transition from CREATED to PRODUCTION', async() => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      const observation = 'Iniciando produção';
      const originalUpdatedAt = order.props.updatedAt;

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.startProduction(accountId, observation);

      // Assert
      expect(order.props.status).toBe(OrderStatus.PRODUCTION);
      expect(order.props.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(order.statusHistory).toHaveLength(2);
      expect(order.statusHistory[1].toJSON()).toEqual<OrderStatusHistoryProps>({
        status: OrderStatus.PRODUCTION,
        changedAt: expect.any(Date),
        changedBy: accountId,
        observation: observation,
      });
    });

    it.each(
      Object.values(OrderStatus).filter((status) => status !== OrderStatus.CREATED)
    )('should throw error when trying to start production from non-CREATED status (%s)', (status) => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      (order as any)._props.status = status;

      // Act & Assert
      expect(() => order.startProduction(accountId)).toThrow(InvalidOrderStatusTransitionError);
    });
  });

  describe('markAsInvoiced', () => {
    it('should transition from PRODUCTION to INVOICED', async() => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      order.startProduction(accountId);

      const observation = 'Nota fiscal emitida';
      const originalUpdatedAt = order.props.updatedAt;

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.markAsInvoiced(accountId, observation);

      // Assert
      expect(order.props.status).toBe(OrderStatus.INVOICED);
      expect(order.props.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(order.statusHistory).toHaveLength(3);
      expect(order.statusHistory[2].toJSON()).toEqual<OrderStatusHistoryProps>({
        status: OrderStatus.INVOICED,
        changedAt: expect.any(Date),
        changedBy: accountId,
        observation: observation,
      });
    });

    it.each(
      Object.values(OrderStatus).filter((status) => status !== OrderStatus.PRODUCTION)
    )('should throw error when trying to invoice from non-PRODUCTION status (%s)', (status) => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      (order as any)._props.status = status;

      // Act & Assert
      expect(() => order.markAsInvoiced(accountId)).toThrow(InvalidOrderStatusTransitionError);
    });
  });

  describe('ship', () => {
    it('should transition from INVOICED to SHIPPED with tracking code', async() => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      order.startProduction(accountId);
      order.markAsInvoiced(accountId);

      const trackingCode = 'BR123456789';
      const observation = 'Enviado via transportadora X';
      const originalUpdatedAt = order.props.updatedAt;

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.ship(accountId, trackingCode, observation);

      // Assert
      expect(order.props.status).toBe(OrderStatus.SHIPPED);
      expect(order.props.trackingCode).toBe(trackingCode);
      expect(order.props.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(order.statusHistory).toHaveLength(4);
      expect(order.statusHistory[3].toJSON()).toEqual<OrderStatusHistoryProps>({
        status: OrderStatus.SHIPPED,
        changedAt: expect.any(Date),
        changedBy: accountId,
        observation: observation,
      });
    });

    it.each(
      Object.values(OrderStatus).filter((status) => status !== OrderStatus.INVOICED)
    )('should throw error when trying to ship from non-INVOICED status (%s)', (status) => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      const trackingCode = 'BR123456789';
      (order as any)._props.status = status;

      // Act & Assert
      expect(() => order.ship(accountId, trackingCode)).toThrow(InvalidOrderStatusTransitionError);
    });
  });

  describe('deliver', () => {
    it('should transition from SHIPPED to DELIVERED', async() => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      order.startProduction(accountId);
      order.markAsInvoiced(accountId);
      order.ship(accountId, 'BR123456789');

      const observation = 'Entregue ao cliente';
      const originalUpdatedAt = order.props.updatedAt;

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.deliver(accountId, observation);

      // Assert
      expect(order.props.status).toBe(OrderStatus.DELIVERED);
      expect(order.props.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(order.statusHistory).toHaveLength(5);
      expect(order.statusHistory[4].toJSON()).toEqual<OrderStatusHistoryProps>({
        status: OrderStatus.DELIVERED,
        changedAt: expect.any(Date),
        changedBy: accountId,
        observation: observation,
      });
    });

    it.each(
      Object.values(OrderStatus).filter((status) => status !== OrderStatus.SHIPPED)
    )('should throw error when trying to deliver from non-SHIPPED status (%s)', (status) => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      (order as any)._props.status = status;

      // Act & Assert
      expect(() => order.deliver(accountId)).toThrow(InvalidOrderStatusTransitionError);
    });
  });

  describe('cancel', () => {
    it('should cancel order from CREATED status', async() => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      const reason = 'Cliente desistiu';
      const originalUpdatedAt = order.props.updatedAt;

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.cancel(accountId, reason);

      // Assert
      expect(order.props.status).toBe(OrderStatus.CANCELLED);
      expect(order.props.cancelledAt).toBeInstanceOf(Date);
      expect(order.props.cancelledBy).toBe(accountId);
      expect(order.props.cancellationReason).toBe(reason);
      expect(order.props.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(order.statusHistory).toHaveLength(2);
      expect(order.statusHistory[1].toJSON()).toEqual<OrderStatusHistoryProps>({
        status: OrderStatus.CANCELLED,
        changedAt: expect.any(Date),
        changedBy: accountId,
        observation: reason,
      });
    });

    it('should cancel order from PRODUCTION status', () => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      order.startProduction(accountId);
      const reason = 'Problema na produção';

      // Act
      order.cancel(accountId, reason);

      // Assert
      expect(order.props.status).toBe(OrderStatus.CANCELLED);
      expect(order.statusHistory).toHaveLength(3);
    });

    it('should cancel order from INVOICED status', () => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      order.startProduction(accountId);
      order.markAsInvoiced(accountId);
      const reason = 'Cancelamento de NF-e';

      // Act
      order.cancel(accountId, reason);

      // Assert
      expect(order.props.status).toBe(OrderStatus.CANCELLED);
      expect(order.statusHistory).toHaveLength(4);
    });

    it('should cancel order from SHIPPED status', () => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      order.startProduction(accountId);
      order.markAsInvoiced(accountId);
      order.ship(accountId, 'BR123456789');
      const reason = 'Transportadora não conseguiu entregar';

      // Act
      order.cancel(accountId, reason);

      // Assert
      expect(order.props.status).toBe(OrderStatus.CANCELLED);
      expect(order.statusHistory).toHaveLength(5);
    });

    it('should throw error when trying to cancel DELIVERED order', () => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      order.startProduction(accountId);
      order.markAsInvoiced(accountId);
      order.ship(accountId, 'BR123456789');
      order.deliver(accountId);
      const reason = 'Tentando cancelar';

      // Act & Assert
      expect(() => order.cancel(accountId, reason)).toThrow(CannotCancelDeliveredOrderError);
    });

    it('should throw error when trying to cancel already CANCELLED order', () => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      order.cancel(accountId, 'Primeira tentativa');

      // Act & Assert
      expect(() => order.cancel(accountId, 'Segunda tentativa')).toThrow(InvalidOrderStatusTransitionError);
    });
  });

  describe('complete workflow', () => {
    it('should complete full workflow from CREATED to DELIVERED', () => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });

      // Act
      order.startProduction(accountId, 'Iniciando produção');
      order.markAsInvoiced(accountId, 'NF-e emitida');
      order.ship(accountId, 'BR123456789', 'Enviado');
      order.deliver(accountId, 'Entregue');

      // Assert
      expect(order.props.status).toBe(OrderStatus.DELIVERED);
      expect(order.statusHistory).toHaveLength(5);
      expect(order.statusHistory[0].status).toBe(OrderStatus.CREATED);
      expect(order.statusHistory[1].status).toBe(OrderStatus.PRODUCTION);
      expect(order.statusHistory[2].status).toBe(OrderStatus.INVOICED);
      expect(order.statusHistory[3].status).toBe(OrderStatus.SHIPPED);
      expect(order.statusHistory[4].status).toBe(OrderStatus.DELIVERED);
    });

    it('should not allow any transition from DELIVERED status', () => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      order.startProduction(accountId);
      order.markAsInvoiced(accountId);
      order.ship(accountId, 'BR123456789');
      order.deliver(accountId);

      // Act & Assert
      expect(() => order.startProduction(accountId)).toThrow(InvalidOrderStatusTransitionError);
      expect(() => order.markAsInvoiced(accountId)).toThrow(InvalidOrderStatusTransitionError);
      expect(() => order.ship(accountId, 'BR999')).toThrow(InvalidOrderStatusTransitionError);
      expect(() => order.deliver(accountId)).toThrow(InvalidOrderStatusTransitionError);
      expect(() => order.cancel(accountId, 'reason')).toThrow(CannotCancelDeliveredOrderError);
    });
  });

  describe('status history', () => {
    it('should maintain immutable status history', () => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });
      const initialHistoryLength = order.statusHistory.length;

      // Act
      const history = order.statusHistory;
      (history as any).push({ status: 'fake', changedAt: new Date(), changedBy: 'fake', observation: null });

      // Assert
      expect(order.statusHistory.length).toBe(initialHistoryLength);
    });

    it('should record all status changes with correct order', () => {
      // Arrange
      const order = Order.create({ budgetId, createdBy: accountId });

      // Act
      order.startProduction(accountId);
      order.cancel(accountId, 'Cancelado');

      // Assert
      expect(order.statusHistory).toHaveLength(3);
      expect(order.statusHistory[0].status).toBe(OrderStatus.CREATED);
      expect(order.statusHistory[1].status).toBe(OrderStatus.PRODUCTION);
      expect(order.statusHistory[2].status).toBe(OrderStatus.CANCELLED);
      expect(order.statusHistory[1].changedAt.getTime()).toBeGreaterThanOrEqual(order.statusHistory[0].changedAt.getTime());
      expect(order.statusHistory[2].changedAt.getTime()).toBeGreaterThanOrEqual(order.statusHistory[1].changedAt.getTime());
    });
  });
});
