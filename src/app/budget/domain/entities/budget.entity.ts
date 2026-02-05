import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';
import { BudgetStatus } from '../../enums/budget-status.enum';
import { BudgetMustHaveItemsError } from '../errors/budget-must-have-items.error';
import { InvalidBudgetStatusError } from '../errors/invalid-budget-status.error';
import { BudgetItem, BudgetItemCreateProps } from './budget-item.entity';

export type BudgetProps = Omit<BudgetCreateProps, 'items'> & {
  id: string;
  status: BudgetStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  subtotalInCents: number;
  totalInCents: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BudgetCreateProps = {
  companyId: string;
  clientId: string;
  sellerId: string;
  freightType: string;
  shipperId: string | null;
  freightValueInCents: number;
  discountInCents: number;
  commercialProcess: string | null;
  commercialNote: string | null;
  observations: string | null;
  items: BudgetItemCreateProps[];
};

export class Budget {
  private _props: BudgetProps;
  private _items: BudgetItem[];

  static create({ items, ...props }: BudgetCreateProps): Budget {
    const budgetItems = items.map((item) => BudgetItem.create(item));
    const calculatedSubtotal = Budget.calculateBudgetSubtotal(budgetItems);
    const calculatedTotal = Budget.calculateBudgetTotal(calculatedSubtotal, props.freightValueInCents, props.discountInCents);

    return new Budget(
      {
        ...props,
        id: new UUID().value,
        status: BudgetStatus.PENDING,
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        subtotalInCents: calculatedSubtotal,
        totalInCents: calculatedTotal,
        createdAt: UTCDate.create().value,
        updatedAt: UTCDate.create().value,
      },
      budgetItems,
    );
  }

  static load(props: BudgetProps, items: BudgetItem[]): Budget {
    return new Budget(props, items);
  }

  public get props(): Readonly<BudgetProps> {
    return { ...this._props };
  }

  public get items(): ReadonlyArray<BudgetItem> {
    return [...this._items];
  }

  private constructor(props: BudgetProps, items: BudgetItem[]) {
    if (!items || items.length === 0) {
      throw new BudgetMustHaveItemsError();
    }

    this._props = {
      id: props.id,
      companyId: props.companyId,
      clientId: props.clientId,
      sellerId: props.sellerId,
      freightType: props.freightType,
      shipperId: props.shipperId,
      freightValueInCents: new PositiveInt(props.freightValueInCents, 'Valor do frete', true).value,
      subtotalInCents: new PositiveInt(props.subtotalInCents, 'Subtotal', true).value,
      discountInCents: new PositiveInt(props.discountInCents, 'Desconto', true).value,
      totalInCents: new PositiveInt(props.totalInCents, 'Total', true).value,
      commercialProcess: props.commercialProcess,
      commercialNote: props.commercialNote,
      observations: props.observations,
      status: props.status,
      approvedBy: props.approvedBy,
      approvedAt: props.approvedAt ? UTCDate.from(props.approvedAt).value : null,
      rejectedBy: props.rejectedBy,
      rejectedAt: props.rejectedAt ? UTCDate.from(props.rejectedAt).value : null,
      rejectionReason: props.rejectionReason,
      createdAt: UTCDate.from(props.createdAt).value,
      updatedAt: UTCDate.from(props.updatedAt).value,
    };

    this._items = items;
  }

  private static calculateBudgetSubtotal(items: BudgetItem[]): number {
    return items.reduce((sum, item) => sum + item.props.subtotalInCents, 0);
  }

  private static calculateBudgetTotal(subtotalInCents: number, freightInCents: number, discountInCents: number): number {
    return subtotalInCents + freightInCents - discountInCents;
  }

  private recalculateTotals(): void {
    this._props.subtotalInCents = Budget.calculateBudgetSubtotal(this._items);
    this._props.totalInCents = Budget.calculateBudgetTotal(this._props.subtotalInCents, this._props.freightValueInCents, this._props.discountInCents);
    this._props.updatedAt = UTCDate.create().value;
  }

  private isPending(): boolean {
    return this._props.status === BudgetStatus.PENDING;
  }

  private isCancelled(): boolean {
    return this._props.status === BudgetStatus.CANCELLED;
  }

  public isApproved(): boolean {
    return this._props.status === BudgetStatus.APPROVED;
  }

  public approve(accountId: string): void {
    if (!this.isPending()) {
      throw new InvalidBudgetStatusError(this._props.status, 'PENDING');
    }

    this._props.status = BudgetStatus.APPROVED;
    this._props.approvedBy = accountId;
    this._props.approvedAt = UTCDate.create().value;
    this._props.updatedAt = UTCDate.create().value;
  }

  public reject(accountId: string, reason: string): void {
    if (!this.isPending()) {
      throw new InvalidBudgetStatusError(this._props.status, 'PENDING');
    }

    this._props.status = BudgetStatus.REJECTED;
    this._props.rejectedBy = accountId;
    this._props.rejectedAt = UTCDate.create().value;
    this._props.rejectionReason = reason;
    this._props.updatedAt = UTCDate.create().value;
  }

  public cancel(): void {
    if (this.isCancelled()) {
      throw new InvalidBudgetStatusError(this._props.status, 'PENDING, APPROVED ou REJECTED');
    }

    this._props.status = BudgetStatus.CANCELLED;
    this._props.updatedAt = UTCDate.create().value;
  }

  public ensureCanBeDeleted(): void {
    if (!this.isPending()) {
      throw new InvalidBudgetStatusError(this._props.status, 'PENDING');
    }
  }

  public update(updates: Partial<Omit<BudgetCreateProps, 'items'>>): void {
    if (!this.isPending()) {
      throw new InvalidBudgetStatusError(this._props.status, 'PENDING');
    }

    if (updates.companyId !== undefined) this._props.companyId = updates.companyId;
    if (updates.clientId !== undefined) this._props.clientId = updates.clientId;
    if (updates.sellerId !== undefined) this._props.sellerId = updates.sellerId;
    if (updates.freightType !== undefined) this._props.freightType = updates.freightType;
    if (updates.shipperId !== undefined) this._props.shipperId = updates.shipperId;
    if (updates.commercialProcess !== undefined) this._props.commercialProcess = updates.commercialProcess;
    if (updates.commercialNote !== undefined) this._props.commercialNote = updates.commercialNote;
    if (updates.observations !== undefined) this._props.observations = updates.observations;
    if (updates.freightValueInCents !== undefined) this._props.freightValueInCents = new PositiveInt(updates.freightValueInCents, 'Valor do frete', true).value;
    if (updates.discountInCents !== undefined) this._props.discountInCents = new PositiveInt(updates.discountInCents, 'Desconto', true).value;

    if (updates.freightValueInCents !== undefined || updates.discountInCents !== undefined) {
      this._props.totalInCents = Budget.calculateBudgetTotal(this._props.subtotalInCents, this._props.freightValueInCents, this._props.discountInCents);
    }

    this._props.updatedAt = UTCDate.create().value;
  }

  public replaceItems(items: BudgetItemCreateProps[]): void {
    if (!this.isPending()) {
      throw new InvalidBudgetStatusError(this._props.status, 'PENDING');
    }

    if (items.length === 0) {
      throw new BudgetMustHaveItemsError();
    }

    this._items = items.map((item) => BudgetItem.create(item));
    this.recalculateTotals();
  }
}
