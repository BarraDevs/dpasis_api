import { BudgetItemType } from '../../enums/budget-item-type.enum';
import { BudgetStatus } from '../../enums/budget-status.enum';
import { BudgetMustHaveItemsError } from '../errors/budget-must-have-items.error';
import { InvalidBudgetStatusError } from '../errors/invalid-budget-status.error';
import { BudgetItem, BudgetItemCreateProps, BudgetItemProps } from './budget-item.entity';
import { Budget, BudgetCreateProps, BudgetProps } from './budget.entity';

describe('Budget Entity', () => {
  const validItem: BudgetItemCreateProps = {
    itemType: BudgetItemType.PRODUCT,
    productId: 'product-id-123',
    serviceId: null,
    description: 'Laptop Dell Inspiron 15',
    quantity: 2,
    unitPriceInCents: 250000,
    discountInCents: 10000,
  };

  const validCreateProps: BudgetCreateProps = {
    companyId: 'company-id-123',
    clientId: 'client-id-123',
    sellerId: 'seller-id-123',
    freightType: 'CIF',
    shipperId: 'shipper-id-123',
    freightValueInCents: 5000,
    discountInCents: 2000,
    commercialProcess: 'PROC-2026-001',
    commercialNote: 'Nota comercial sobre o orçamento',
    observations: 'Cliente preferencial',
    items: [validItem],
  };

  describe('create', () => {
    it('should create a budget with valid props', () => {
      // Act
      const budget = Budget.create(validCreateProps);

      // Assert
      expect(budget).toBeInstanceOf(Budget);
      expect(budget.props).toEqual<BudgetProps>({
        id: expect.any(String),
        companyId: validCreateProps.companyId,
        clientId: validCreateProps.clientId,
        sellerId: validCreateProps.sellerId,
        freightType: validCreateProps.freightType,
        shipperId: validCreateProps.shipperId,
        freightValueInCents: validCreateProps.freightValueInCents,
        subtotalInCents: 490000, // (2 * 250000) - 10000
        discountInCents: validCreateProps.discountInCents,
        totalInCents: 493000, // (490000 + 5000) - 2000
        commercialProcess: validCreateProps.commercialProcess,
        commercialNote: validCreateProps.commercialNote,
        observations: validCreateProps.observations,
        status: BudgetStatus.PENDING,
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(budget.items).toHaveLength(1);
      expect(budget.items[0].props).toEqual<BudgetItemProps>({
        id: expect.any(String),
        itemType: validItem.itemType,
        productId: validItem.productId,
        serviceId: validItem.serviceId,
        description: validItem.description,
        quantity: validItem.quantity,
        unitPriceInCents: validItem.unitPriceInCents,
        discountInCents: validItem.discountInCents,
        subtotalInCents: 490000, // (2 * 250000) - 10000
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should create budget with createdAt and updatedAt timestamps', () => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const budget = Budget.create(validCreateProps);

      // Assert
      const afterCreate = new Date();
      expect(budget.props.createdAt).toBeInstanceOf(Date);
      expect(budget.props.updatedAt).toBeInstanceOf(Date);
      expect(budget.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(budget.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should calculate item subtotal correctly (quantity * unitPrice) - discount', () => {
      // Act
      const budget = Budget.create(validCreateProps);

      // Assert
      const item = budget.items[0];
      const expectedSubtotal = 2 * 250000 - 10000; // 490000
      expect(item.props.subtotalInCents).toBe(expectedSubtotal);
    });

    it('should calculate budget subtotal as sum of all items', () => {
      // Arrange
      const props: BudgetCreateProps = {
        ...validCreateProps,
        items: [
          { ...validItem, quantity: 2, unitPriceInCents: 100000, discountInCents: 5000 }, // 195000
          { ...validItem, quantity: 1, unitPriceInCents: 50000, discountInCents: 0 }, // 50000
        ],
      };

      // Act
      const budget = Budget.create(props);

      // Assert
      expect(budget.props.subtotalInCents).toBe(245000); // 195000 + 50000
    });

    it('should calculate total as (subtotal + freight) - discount', () => {
      // Arrange
      const props: BudgetCreateProps = {
        ...validCreateProps,
        freightValueInCents: 10000,
        discountInCents: 5000,
        items: [{ ...validItem, quantity: 1, unitPriceInCents: 100000, discountInCents: 0 }], // subtotal: 100000
      };

      // Act
      const budget = Budget.create(props);

      // Assert
      expect(budget.props.totalInCents).toBe(105000); // (100000 + 10000) - 5000
    });

    it('should create budget with status PENDING', () => {
      // Act
      const budget = Budget.create(validCreateProps);

      // Assert
      expect(budget.props.status).toBe(BudgetStatus.PENDING);
      expect(budget.props.approvedBy).toBeNull();
      expect(budget.props.approvedAt).toBeNull();
      expect(budget.props.rejectedBy).toBeNull();
      expect(budget.props.rejectedAt).toBeNull();
      expect(budget.props.rejectionReason).toBeNull();
    });

    it('should create budget with multiple items', () => {
      // Arrange
      const props: BudgetCreateProps = {
        ...validCreateProps,
        items: [
          validItem,
          { ...validItem, productId: 'product-2', description: 'Mouse' },
          { ...validItem, productId: 'product-3', description: 'Keyboard' },
        ],
      };

      // Act
      const budget = Budget.create(props);

      // Assert
      expect(budget.items).toHaveLength(3);
      expect(budget.items[0].props.id).toBeDefined();
      expect(budget.items[1].props.id).toBeDefined();
      expect(budget.items[2].props.id).toBeDefined();
    });

    it('should throw error when creating budget without items', () => {
      // Arrange
      const props: BudgetCreateProps = {
        ...validCreateProps,
        items: [],
      };

      // Act & Assert
      expect(() => Budget.create(props)).toThrow(BudgetMustHaveItemsError);
    });

    it('should create budget with null optional fields', () => {
      // Arrange
      const props: BudgetCreateProps = {
        ...validCreateProps,
        shipperId: null,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
      };

      // Act
      const budget = Budget.create(props);

      // Assert
      expect(budget.props.shipperId).toBeNull();
      expect(budget.props.commercialProcess).toBeNull();
      expect(budget.props.commercialNote).toBeNull();
      expect(budget.props.observations).toBeNull();
    });

    it('should create budget with zero discount', () => {
      // Arrange
      const props: BudgetCreateProps = {
        ...validCreateProps,
        discountInCents: 0,
      };

      // Act
      const budget = Budget.create(props);

      // Assert
      expect(budget.props.discountInCents).toBe(0);
    });

    it('should create budget with zero freight', () => {
      // Arrange
      const props: BudgetCreateProps = {
        ...validCreateProps,
        freightType: 'SEM_FRETE',
        freightValueInCents: 0,
        shipperId: null,
      };

      // Act
      const budget = Budget.create(props);

      // Assert
      expect(budget.props.freightValueInCents).toBe(0);
      expect(budget.props.freightType).toBe('SEM_FRETE');
    });
  });

  describe('load', () => {
    it('should load budget with existing props', () => {
      // Arrange
      const existingItemProps: BudgetItemProps = {
        id: 'item-id-123',
        itemType: BudgetItemType.PRODUCT,
        productId: 'product-id-123',
        serviceId: null,
        description: 'Product',
        quantity: 1,
        unitPriceInCents: 100000,
        discountInCents: 0,
        subtotalInCents: 100000,
        createdAt: new Date('2026-01-15T10:00:00Z'),
        updatedAt: new Date('2026-01-15T10:00:00Z'),
      };

      const existingItems = [BudgetItem.load(existingItemProps)];

      const existingProps: BudgetProps = {
        id: 'budget-id-123',
        companyId: 'company-id-123',
        clientId: 'client-id-123',
        sellerId: 'seller-id-123',
        freightType: 'FOB',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 100000,
        discountInCents: 5000,
        totalInCents: 95000,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        status: BudgetStatus.APPROVED,
        approvedBy: 'admin-id-123',
        approvedAt: new Date('2026-01-15T10:00:00Z'),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        createdAt: new Date('2026-01-15T10:00:00Z'),
        updatedAt: new Date('2026-01-15T10:00:00Z'),
      };

      // Act
      const budget = Budget.load(existingProps, existingItems);

      // Assert
      expect(budget).toBeInstanceOf(Budget);
      expect(budget.props.id).toBe('budget-id-123');
      expect(budget.props.status).toBe(BudgetStatus.APPROVED);
      expect(budget.props.approvedBy).toBe('admin-id-123');
    });

    it('should throw error when loading budget without items', () => {
      // Arrange
      const invalidProps: BudgetProps = {
        id: 'budget-id',
        companyId: 'company-id',
        clientId: 'client-id',
        sellerId: 'seller-id',
        freightType: 'CIF',
        shipperId: null,
        freightValueInCents: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
        status: BudgetStatus.PENDING,
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act & Assert
      expect(() => Budget.load(invalidProps, [])).toThrow(BudgetMustHaveItemsError);
    });
  });

  describe('isApproved', () => {
    it('should return true when budget status is APPROVED', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      budget.approve('admin-id');

      // Assert
      expect(budget.isApproved()).toBe(true);
      expect(budget.props.status).toBe(BudgetStatus.APPROVED);
    });

    it.each(
      Object.values(BudgetStatus).filter((status) => status !== BudgetStatus.APPROVED),
    )('should return false when budget status is %s', (status) => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      (budget as any)._props.status = status;

      // Assert
      expect(budget.isApproved()).toBe(false);
      expect(budget.props.status).toBe(status);
    });
  });

  describe('approve', () => {
    it('should approve budget when status is PENDING', async() => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      const accountId = 'admin-id-123';
      const beforeApprove = new Date();

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10)); // Garantir timestamp diferente
      budget.approve(accountId);

      // Assert
      expect(budget.props).toEqual<BudgetProps>({
        ...budget.props,
        id: budget.props.id,
        status: BudgetStatus.APPROVED,
        approvedBy: accountId,
        approvedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(budget.props.approvedAt!.getTime()).toBeGreaterThan(beforeApprove.getTime());
      expect(budget.props.updatedAt.getTime()).toBeGreaterThan(beforeApprove.getTime());
    });

    it('should throw error when trying to approve non-PENDING budget', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      budget.approve('admin-id');

      // Act & Assert
      expect(() => budget.approve('admin-id-2')).toThrow(InvalidBudgetStatusError);
    });
  });

  describe('reject', () => {
    it('should reject budget when status is PENDING', async() => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      const accountId = 'admin-id-123';
      const reason = 'Preço muito alto';
      const beforeReject = new Date();

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10)); // Garantir timestamp diferente
      budget.reject(accountId, reason);

      // Assert
      expect(budget.props).toEqual<BudgetProps>({
        ...budget.props,
        id: budget.props.id,
        status: BudgetStatus.REJECTED,
        rejectedBy: accountId,
        rejectedAt: expect.any(Date),
        rejectionReason: reason,
        updatedAt: expect.any(Date),
      });
      expect(budget.props.rejectedAt!.getTime()).toBeGreaterThan(beforeReject.getTime());
      expect(budget.props.updatedAt.getTime()).toBeGreaterThan(beforeReject.getTime());
    });

    it('should throw error when trying to reject non-PENDING budget', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      budget.approve('admin-id');

      // Act & Assert
      expect(() => budget.reject('admin-id-2', 'reason')).toThrow(InvalidBudgetStatusError);
    });
  });

  describe('cancel', () => {
    it('should cancel PENDING budget', async() => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      const beforeCancel = new Date();

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10)); // Garantir timestamp diferente
      budget.cancel();

      // Assert
      expect(budget.props).toEqual<BudgetProps>({
        ...budget.props,
        id: budget.props.id,
        status: BudgetStatus.CANCELLED,
      });
      expect(budget.props.updatedAt.getTime()).toBeGreaterThan(beforeCancel.getTime());
    });

    it('should cancel APPROVED budget', async() => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      budget.approve('admin-id');
      const beforeCancel = new Date();

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10)); // Garantir timestamp diferente
      budget.cancel();

      // Assert
      expect(budget.props).toEqual<BudgetProps>({
        ...budget.props,
        id: budget.props.id,
        status: BudgetStatus.CANCELLED,
      });
      expect(budget.props.updatedAt.getTime()).toBeGreaterThan(beforeCancel.getTime());
    });

    it('should cancel REJECTED budget', async() => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      budget.reject('admin-id', 'reason');
      const beforeCancel = new Date();

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10)); // Garantir timestamp diferente
      budget.cancel();

      // Assert
      expect(budget.props).toEqual<BudgetProps>({
        ...budget.props,
        id: budget.props.id,
        status: BudgetStatus.CANCELLED,
      });
      expect(budget.props.updatedAt.getTime()).toBeGreaterThan(beforeCancel.getTime());
    });

    it('should throw error when trying to cancel already CANCELLED budget', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      budget.cancel();

      // Act & Assert
      expect(() => budget.cancel()).toThrow(InvalidBudgetStatusError);
    });
  });

  describe('update', () => {
    it('should update basic properties in PENDING budget', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);

      // Act
      budget.update({
        freightType: 'FOB',
        observations: 'Updated observations',
      });

      // Assert
      expect(budget.props.freightType).toBe('FOB');
      expect(budget.props.observations).toBe('Updated observations');
    });

    it('should update monetary values and recalculate total', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      const initialSubtotal = budget.props.subtotalInCents;

      // Act
      budget.update({
        freightValueInCents: 10000,
        discountInCents: 2000,
      });

      // Assert
      expect(budget.props.freightValueInCents).toBe(10000);
      expect(budget.props.discountInCents).toBe(2000);
      expect(budget.props.totalInCents).toBe(initialSubtotal + 10000 - 2000);
    });

    it('should update nullable fields to null', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);

      // Act
      budget.update({
        shipperId: null,
        commercialProcess: null,
        commercialNote: null,
        observations: null,
      });

      // Assert
      expect(budget.props.shipperId).toBeNull();
      expect(budget.props.commercialProcess).toBeNull();
      expect(budget.props.commercialNote).toBeNull();
      expect(budget.props.observations).toBeNull();
    });

    it('should not change unchanged fields (partial update)', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      const originalProps = budget.props;

      // Act
      budget.update({ freightType: 'FOB' });

      // Assert
      expect(budget.props).toEqual<BudgetProps>({ ...originalProps, freightType: 'FOB', updatedAt: expect.any(Date) });
    });

    it('should update updatedAt timestamp', async() => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      const originalUpdatedAt = budget.props.updatedAt;

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10)); // Garantir timestamp diferente
      budget.update({ freightType: 'FOB' });

      // Assert
      expect(budget.props.updatedAt).not.toEqual(originalUpdatedAt);
    });

    it('should throw error when updating non-PENDING budget', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      budget.approve('admin-id');

      // Act & Assert
      expect(() => budget.update({ freightType: 'FOB' })).toThrow(InvalidBudgetStatusError);
    });

    it('should validate positive values for monetary fields', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);

      // Act & Assert
      expect(() => budget.update({ freightValueInCents: -100 })).toThrow();
      expect(() => budget.update({ discountInCents: -100 })).toThrow();
    });
  });

  describe('replaceItems', () => {
    it('should replace all items in PENDING budget', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      const newItems: BudgetItemCreateProps[] = [
        {
          itemType: BudgetItemType.PRODUCT,
          productId: 'new-product-1',
          serviceId: null,
          description: 'New Product 1',
          quantity: 2,
          unitPriceInCents: 50000,
          discountInCents: 0,
        },
        {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId: 'new-service-1',
          description: 'New Service 1',
          quantity: 1,
          unitPriceInCents: 30000,
          discountInCents: 0,
        },
      ];

      // Act
      budget.replaceItems(newItems);

      // Assert
      expect(budget.items).toHaveLength(2);
      expect(budget.items[0].props.description).toBe('New Product 1');
      expect(budget.items[1].props.description).toBe('New Service 1');
    });

    it('should recalculate totals when replacing items', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      const newItems: BudgetItemCreateProps[] = [
        {
          itemType: BudgetItemType.PRODUCT,
          productId: 'new-product',
          serviceId: null,
          description: 'New Product',
          quantity: 3,
          unitPriceInCents: 10000,
          discountInCents: 100,
        },
      ];
      const expectedSubtotal = 3 * 10000 - 100; // 29900

      // Act
      budget.replaceItems(newItems);

      // Assert
      expect(budget.props.subtotalInCents).toBe(expectedSubtotal);
      expect(budget.props.totalInCents).toBe(
        expectedSubtotal + budget.props.freightValueInCents - budget.props.discountInCents,
      );
    });

    it('should throw error when replacing with empty array', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);

      // Act & Assert
      expect(() => budget.replaceItems([])).toThrow(BudgetMustHaveItemsError);
    });

    it('should throw error when replacing items in non-PENDING budget', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      budget.approve('admin-id');
      const newItems: BudgetItemCreateProps[] = [validItem];

      // Act & Assert
      expect(() => budget.replaceItems(newItems)).toThrow(InvalidBudgetStatusError);
    });

    it('should create new item entities (not reference old ones)', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      const oldItemId = budget.items[0].props.id;
      const newItems: BudgetItemCreateProps[] = [validItem];

      // Act
      budget.replaceItems(newItems);

      // Assert
      expect(budget.items[0].props.id).not.toBe(oldItemId);
    });
  });

  describe('props getter', () => {
    it('should return readonly copy of props', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);

      // Act
      const props1 = budget.props;
      const props2 = budget.props;

      // Assert
      expect(props1).toEqual(props2);
      expect(props1).not.toBe(props2);
    });
  });

  describe('items getter', () => {
    it('should return readonly copy of items array', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      const items = budget.items;

      // Act
      const maliciousItem = BudgetItem.create({
        itemType: BudgetItemType.PRODUCT,
        productId: 'malicious-product',
        serviceId: null,
        description: 'Malicious',
        quantity: 999,
        unitPriceInCents: 999999,
        discountInCents: 0,
      });
      (items as BudgetItem[]).push(maliciousItem);

      // Assert
      expect(budget.items).toHaveLength(1);
      expect(budget.items[0].props.description).not.toBe('Malicious');
    });
  });

  describe('ensureCanBeDeleted', () => {
    it('should not throw error when budget is PENDING', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      expect(budget.props.status).toBe(BudgetStatus.PENDING);

      // Act & Assert
      expect(() => budget.ensureCanBeDeleted()).not.toThrow();
    });

    it('should throw error when budget is APPROVED', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      budget.approve('admin-id');

      // Act & Assert
      expect(() => budget.ensureCanBeDeleted()).toThrow(InvalidBudgetStatusError);
    });

    it('should throw error when budget is REJECTED', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      budget.reject('admin-id', 'Test reason');

      // Act & Assert
      expect(() => budget.ensureCanBeDeleted()).toThrow(InvalidBudgetStatusError);
    });

    it('should throw error when budget is CANCELLED', () => {
      // Arrange
      const budget = Budget.create(validCreateProps);
      budget.cancel();

      // Act & Assert
      expect(() => budget.ensureCanBeDeleted()).toThrow(InvalidBudgetStatusError);
    });
  });
});
