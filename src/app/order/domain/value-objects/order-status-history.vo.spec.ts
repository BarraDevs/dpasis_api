import { OrderStatus } from '../../enums/order-status.enum';
import { OrderStatusHistory, OrderStatusHistoryProps } from './order-status-history.vo';

describe('OrderStatusHistory Value Object', () => {
  const accountId = 'account-id-123';
  const observation = 'Test observation';

  describe('create', () => {
    it('should create a new status history entry', () => {
      // Act
      const history = OrderStatusHistory.create(OrderStatus.CREATED, accountId);

      // Assert
      expect(history.status).toBe(OrderStatus.CREATED);
      expect(history.changedBy).toBe(accountId);
      expect(history.changedAt).toBeInstanceOf(Date);
      expect(history.observation).toBeNull();
    });

    it('should create a status history entry with observation', () => {
      // Act
      const history = OrderStatusHistory.create(OrderStatus.PRODUCTION, accountId, observation);

      // Assert
      expect(history.status).toBe(OrderStatus.PRODUCTION);
      expect(history.changedBy).toBe(accountId);
      expect(history.changedAt).toBeInstanceOf(Date);
      expect(history.observation).toBe(observation);
    });

    it('should create entries for all status types', () => {
      // Act & Assert
      Object.values(OrderStatus).forEach((status) => {
        const history = OrderStatusHistory.create(status, accountId);
        expect(history.status).toBe(status);
        expect(history.changedBy).toBe(accountId);
      });
    });

    it('should set observation to null when not provided', () => {
      // Act
      const history = OrderStatusHistory.create(OrderStatus.CREATED, accountId);

      // Assert
      expect(history.observation).toBeNull();
    });

    it('should set observation to null when undefined is passed', () => {
      // Act
      const history = OrderStatusHistory.create(OrderStatus.CREATED, accountId, undefined);

      // Assert
      expect(history.observation).toBeNull();
    });

    it('should create entries with current timestamp', () => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const history = OrderStatusHistory.create(OrderStatus.CREATED, accountId);

      // Assert
      const afterCreate = new Date();
      expect(history.changedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(history.changedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('load', () => {
    it('should load an existing status history entry', () => {
      // Arrange
      const props: OrderStatusHistoryProps = {
        status: OrderStatus.PRODUCTION,
        changedAt: new Date('2024-01-15T10:30:00Z'),
        changedBy: accountId,
        observation: 'Loaded observation',
      };

      // Act
      const history = OrderStatusHistory.load(props);

      // Assert
      expect(history.status).toBe(props.status);
      expect(history.changedAt).toEqual(props.changedAt);
      expect(history.changedBy).toBe(props.changedBy);
      expect(history.observation).toBe(props.observation);
    });

    it('should load entry with null observation', () => {
      // Arrange
      const props: OrderStatusHistoryProps = {
        status: OrderStatus.INVOICED,
        changedAt: new Date('2024-01-15T10:30:00Z'),
        changedBy: accountId,
        observation: null,
      };

      // Act
      const history = OrderStatusHistory.load(props);

      // Assert
      expect(history.observation).toBeNull();
    });

    it('should normalize date when loading', () => {
      // Arrange
      const dateString = '2024-01-15T10:30:00Z';
      const props: OrderStatusHistoryProps = {
        status: OrderStatus.SHIPPED,
        changedAt: new Date(dateString),
        changedBy: accountId,
        observation: null,
      };

      // Act
      const history = OrderStatusHistory.load(props);

      // Assert
      expect(history.changedAt).toBeInstanceOf(Date);
      expect(history.changedAt.toISOString()).toBe(new Date(dateString).toISOString());
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON format', () => {
      // Arrange
      const history = OrderStatusHistory.create(OrderStatus.CREATED, accountId, observation);

      // Act
      const json = history.toJSON();

      // Assert
      expect(json).toEqual({
        status: OrderStatus.CREATED,
        changedAt: history.changedAt,
        changedBy: accountId,
        observation,
      });
    });

    it('should convert to JSON with null observation', () => {
      // Arrange
      const history = OrderStatusHistory.create(OrderStatus.PRODUCTION, accountId);

      // Act
      const json = history.toJSON();

      // Assert
      expect(json).toEqual({
        status: OrderStatus.PRODUCTION,
        changedAt: history.changedAt,
        changedBy: accountId,
        observation: null,
      });
    });

    it('should create a new object on toJSON (not reference)', () => {
      // Arrange
      const history = OrderStatusHistory.create(OrderStatus.CREATED, accountId);
      const json1 = history.toJSON();
      const json2 = history.toJSON();

      // Assert
      expect(json1).toEqual(json2);
      expect(json1).not.toBe(json2); // Different references
    });
  });

  describe('getters', () => {
    it('should provide read-only access to status', () => {
      // Arrange
      const history = OrderStatusHistory.create(OrderStatus.CREATED, accountId);

      // Act
      const status = history.status;

      // Assert
      expect(status).toBe(OrderStatus.CREATED);
    });

    it('should provide read-only access to changedAt', () => {
      // Arrange
      const history = OrderStatusHistory.create(OrderStatus.PRODUCTION, accountId);

      // Act
      const changedAt = history.changedAt;

      // Assert
      expect(changedAt).toBeInstanceOf(Date);
    });

    it('should provide read-only access to changedBy', () => {
      // Arrange
      const history = OrderStatusHistory.create(OrderStatus.INVOICED, accountId);

      // Act
      const changedBy = history.changedBy;

      // Assert
      expect(changedBy).toBe(accountId);
    });

    it('should provide read-only access to observation', () => {
      // Arrange
      const history = OrderStatusHistory.create(OrderStatus.SHIPPED, accountId, observation);

      // Act
      const obs = history.observation;

      // Assert
      expect(obs).toBe(observation);
    });
  });

  describe('integration scenarios', () => {
    it('should handle create → toJSON → load cycle', () => {
      // Arrange
      const original = OrderStatusHistory.create(OrderStatus.PRODUCTION, accountId, observation);

      // Act
      const json = original.toJSON();
      const loaded = OrderStatusHistory.load(json);

      // Assert
      expect(loaded.status).toBe(original.status);
      expect(loaded.changedBy).toBe(original.changedBy);
      expect(loaded.observation).toBe(original.observation);
      expect(loaded.changedAt.getTime()).toBe(original.changedAt.getTime());
    });

    it('should create multiple history entries with sequential timestamps', () => {
      // Arrange & Act
      const history1 = OrderStatusHistory.create(OrderStatus.CREATED, accountId);
      const history2 = OrderStatusHistory.create(OrderStatus.PRODUCTION, accountId);
      const history3 = OrderStatusHistory.create(OrderStatus.INVOICED, accountId);

      // Assert
      expect(history2.changedAt.getTime()).toBeGreaterThanOrEqual(history1.changedAt.getTime());
      expect(history3.changedAt.getTime()).toBeGreaterThanOrEqual(history2.changedAt.getTime());
    });

    it('should preserve all data when converting to JSON and back', () => {
      // Arrange
      const props: OrderStatusHistoryProps = {
        status: OrderStatus.CANCELLED,
        changedAt: new Date('2024-06-15T14:30:00Z'),
        changedBy: 'specific-account-id',
        observation: 'Cliente solicitou cancelamento',
      };

      // Act
      const original = OrderStatusHistory.load(props);
      const json = original.toJSON();
      const restored = OrderStatusHistory.load(json);

      // Assert
      expect(restored.status).toBe(original.status);
      expect(restored.changedAt.getTime()).toBe(original.changedAt.getTime());
      expect(restored.changedBy).toBe(original.changedBy);
      expect(restored.observation).toBe(original.observation);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string observation', () => {
      // Act
      const history = OrderStatusHistory.create(OrderStatus.CREATED, accountId, '');

      // Assert
      expect(history.observation).toBe('');
    });

    it('should handle very long observation text', () => {
      // Arrange
      const longObservation = 'A'.repeat(1000);

      // Act
      const history = OrderStatusHistory.create(OrderStatus.CANCELLED, accountId, longObservation);

      // Assert
      expect(history.observation).toBe(longObservation);
      expect(history.observation?.length).toBe(1000);
    });

    it('should handle special characters in observation', () => {
      // Arrange
      const specialObservation = 'Observação com acentuação, "aspas", e símbolos: @#$%&*()';

      // Act
      const history = OrderStatusHistory.create(OrderStatus.PRODUCTION, accountId, specialObservation);

      // Assert
      expect(history.observation).toBe(specialObservation);
    });

    it('should handle different account ID formats', () => {
      // Arrange
      const accountIds = [
        'uuid-format-1234-5678',
        'simple-id',
        '12345',
        'account@email.com',
      ];

      // Act & Assert
      accountIds.forEach((id) => {
        const history = OrderStatusHistory.create(OrderStatus.CREATED, id);
        expect(history.changedBy).toBe(id);
      });
    });
  });
});
