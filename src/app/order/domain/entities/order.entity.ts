import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';
import { OrderStatus } from '../../enums/order-status.enum';
import { CannotCancelDeliveredOrderError } from '../errors/cannot-cancel-delivered-order.error';
import { InvalidOrderStatusTransitionError } from '../errors/invalid-order-status-transition.error';
import { OrderStatusHistory } from '../value-objects/order-status-history.vo';

export type OrderProps = OrderCreateProps & {
  id: string;
  status: OrderStatus;
  trackingCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
};

export type OrderCreateProps = {
  budgetId: string;
  createdBy: string;
};

export class Order {
  private _props: OrderProps;
  private _statusHistory: OrderStatusHistory[];

  static create(props: OrderCreateProps): Order {
    const initialHistory = OrderStatusHistory.create(OrderStatus.CREATED, props.createdBy);

    return new Order(
      {
        id: new UUID().value,
        budgetId: props.budgetId,
        status: OrderStatus.CREATED,
        trackingCode: null,
        createdAt: UTCDate.create().value,
        updatedAt: UTCDate.create().value,
        createdBy: props.createdBy,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
      },
      [initialHistory]
    );
  }

  static load(props: OrderProps, statusHistory: OrderStatusHistory[]): Order {
    return new Order(props, statusHistory);
  }

  constructor(props: OrderProps, statusHistory: OrderStatusHistory[]) {
    this._props = {
      id: props.id,
      budgetId: props.budgetId,
      status: props.status,
      trackingCode: props.trackingCode,
      createdAt: UTCDate.from(props.createdAt).value,
      updatedAt: UTCDate.from(props.updatedAt).value,
      createdBy: props.createdBy,
      cancelledAt: props.cancelledAt ? UTCDate.from(props.cancelledAt).value : null,
      cancelledBy: props.cancelledBy,
      cancellationReason: props.cancellationReason,
    };

    this._statusHistory = statusHistory;
  }

  public get props(): Readonly<OrderProps> {
    return { ...this._props };
  }

  public get statusHistory(): ReadonlyArray<OrderStatusHistory> {
    return [...this._statusHistory];
  }

  private isDelivered(): boolean {
    return this._props.status === OrderStatus.DELIVERED;
  }

  private isCancelled(): boolean {
    return this._props.status === OrderStatus.CANCELLED;
  }

  public startProduction(accountId: string, observation?: string): void {
    if (!this.canTransitionTo(OrderStatus.PRODUCTION)) {
      throw new InvalidOrderStatusTransitionError(this._props.status, OrderStatus.PRODUCTION);
    }
    this.changeStatus(OrderStatus.PRODUCTION, accountId, observation);
  }

  public markAsInvoiced(accountId: string, observation?: string): void {
    if (!this.canTransitionTo(OrderStatus.INVOICED)) {
      throw new InvalidOrderStatusTransitionError(this._props.status, OrderStatus.INVOICED);
    }
    this.changeStatus(OrderStatus.INVOICED, accountId, observation);
  }

  public ship(accountId: string, trackingCode: string, observation?: string): void {
    if (!this.canTransitionTo(OrderStatus.SHIPPED)) {
      throw new InvalidOrderStatusTransitionError(this._props.status, OrderStatus.SHIPPED);
    }
    this._props.trackingCode = trackingCode;
    this.changeStatus(OrderStatus.SHIPPED, accountId, observation);
  }

  public deliver(accountId: string, observation?: string): void {
    if (!this.canTransitionTo(OrderStatus.DELIVERED)) {
      throw new InvalidOrderStatusTransitionError(this._props.status, OrderStatus.DELIVERED);
    }
    this.changeStatus(OrderStatus.DELIVERED, accountId, observation);
  }

  public cancel(accountId: string, reason: string): void {
    if (this.isDelivered()) {
      throw new CannotCancelDeliveredOrderError();
    }
    if (this.isCancelled()) {
      throw new InvalidOrderStatusTransitionError(this._props.status, OrderStatus.CANCELLED);
    }

    this._props.cancelledAt = UTCDate.create().value;
    this._props.cancelledBy = accountId;
    this._props.cancellationReason = reason;
    this.changeStatus(OrderStatus.CANCELLED, accountId, reason);
  }

  private canTransitionTo(targetStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.PRODUCTION],
      [OrderStatus.PRODUCTION]: [OrderStatus.INVOICED],
      [OrderStatus.INVOICED]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    return validTransitions[this._props.status].includes(targetStatus);
  }

  private changeStatus(newStatus: OrderStatus, accountId: string, observation?: string): void {
    this._props.status = newStatus;
    this._props.updatedAt = UTCDate.create().value;
    this.addToHistory(newStatus, accountId, observation);
  }

  private addToHistory(status: OrderStatus, accountId: string, observation?: string): void {
    const historyEntry = OrderStatusHistory.create(status, accountId, observation);
    this._statusHistory.push(historyEntry);
  }
}
