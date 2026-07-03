import { ProviderItemInstallmentStatus } from '../enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from '../enums/provider-item-schedule-type.enum';

export type ProviderItemInstallmentProps = {
  id: number | null;
  number: number;
  valueInCents: number;
  dueDate: Date;
  status: ProviderItemInstallmentStatus;
};

export type ProviderItemProps = ProviderItemCreateProps & {
  id: number | null;
  active: boolean;
  installments: ProviderItemInstallmentProps[];
};

export type ProviderItemCreateProps = {
  providerId: number;
  description: string;
  totalValueInCents: number;
  installmentsCount: number;
  scheduleType: ProviderItemScheduleType;
  intervalDays: number | null;
  dueDay: number | null;
  firstDueDate: Date;
  bankId: number;
};

export class ProviderItem {
  private readonly _props: ProviderItemProps;

  static _instantiate(props: ProviderItemProps): ProviderItem {
    return new ProviderItem(props);
  }

  private constructor(props: ProviderItemProps) {
    this._props = props;
  }

  public get props(): Readonly<ProviderItemProps> {
    return {
      ...this._props,
      installments: this._props.installments.map((installment) => ({ ...installment })),
    };
  }

  public isActive(): boolean {
    return this._props.active;
  }

  public activate(): void {
    this._props.active = true;
  }

  public deactivate(): void {
    this._props.active = false;
  }
}
