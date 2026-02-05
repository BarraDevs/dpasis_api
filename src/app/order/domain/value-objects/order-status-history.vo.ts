import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { OrderStatus } from '../../enums/order-status.enum';

export type OrderStatusHistoryProps = {
  status: OrderStatus;
  changedAt: Date;
  changedBy: string;
  observation: string | null;
};

export class OrderStatusHistory {
  constructor(private readonly props: OrderStatusHistoryProps) {}

  public get status(): OrderStatus {
    return this.props.status;
  }

  public get changedAt(): Date {
    return this.props.changedAt;
  }

  public get changedBy(): string {
    return this.props.changedBy;
  }

  public get observation(): string | null {
    return this.props.observation;
  }

  static create(status: OrderStatus, changedBy: string, observation?: string): OrderStatusHistory {
    return new OrderStatusHistory({
      status,
      changedAt: UTCDate.create().value,
      changedBy,
      observation: observation ?? null,
    });
  }

  static load(props: OrderStatusHistoryProps): OrderStatusHistory {
    return new OrderStatusHistory({
      ...props,
      changedAt: UTCDate.from(props.changedAt).value,
    });
  }

  public toJSON(): OrderStatusHistoryProps {
    return {
      status: this.props.status,
      changedAt: this.props.changedAt,
      changedBy: this.props.changedBy,
      observation: this.props.observation,
    };
  }
}
