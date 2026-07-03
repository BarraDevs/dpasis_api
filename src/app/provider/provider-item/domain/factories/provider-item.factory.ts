import { Enum } from 'src/shared/value-objects/enum/enum.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { Day } from 'src/shared/value-objects/day/day.vo';
import {
  ProviderItem,
  ProviderItemCreateProps,
  ProviderItemInstallmentProps,
  ProviderItemProps,
} from '../entities/provider-item.entity';
import { ProviderItemScheduleType } from '../enums/provider-item-schedule-type.enum';
import { InvalidProviderItemScheduleTypeError } from '../errors/invalid-provider-item-schedule-type.error';
import { ProviderItemInstallmentPlan } from '../value-objects/provider-item-installment-plan/provider-item-installment-plan.vo';

export type ProviderItemFactoryEditInput = ProviderItemCreateProps & {
  id: number;
  active: boolean;
  paidInstallments?: ProviderItemInstallmentProps[];
};

export class ProviderItemFactory {
  private static validateScheduleFields(props: ProviderItemCreateProps): ProviderItemCreateProps {
    const scheduleType = new Enum(props.scheduleType, ProviderItemScheduleType, 'scheduleType').value;

    let intervalDays: number | null = null;
    let dueDay: number | null = null;

    switch (scheduleType) {
      case ProviderItemScheduleType.INTERVAL_DAYS:
        intervalDays = new PositiveInt(props.intervalDays!, 'intervalDays').value;
        break;
      case ProviderItemScheduleType.DUE_DAY:
        dueDay = new Day(props.dueDay!).value;
        break;
      default:
        throw new InvalidProviderItemScheduleTypeError();
    }

    return {
      providerId: new PositiveInt(props.providerId, 'providerId').value,
      description: new NonEmptyString(props.description.trim(), 'description').value,
      totalValueInCents: new PositiveInt(props.totalValueInCents, 'totalValueInCents').value,
      installmentsCount: new PositiveInt(props.installmentsCount, 'installmentsCount').value,
      scheduleType,
      intervalDays,
      dueDay,
      firstDueDate: UTCDate.from(props.firstDueDate).value,
      bankId: new PositiveInt(props.bankId, 'bankId').value,
    };
  }

  private static buildInstallments(
    props: ProviderItemCreateProps,
    paidInstallments?: ProviderItemInstallmentProps[],
  ): ProviderItemInstallmentProps[] {
    const drafts = ProviderItemInstallmentPlan.generate({
      ...props,
      paidInstallments,
    });

    return drafts.map((draft) => ({
      id: null,
      number: draft.number,
      valueInCents: draft.valueInCents,
      dueDate: draft.dueDate,
      status: draft.status,
    }));
  }

  static create(props: ProviderItemCreateProps): ProviderItem {
    const validatedProps = this.validateScheduleFields(props);
    const installments = this.buildInstallments(validatedProps);

    return ProviderItem._instantiate({
      ...validatedProps,
      id: null,
      active: true,
      installments,
    });
  }

  static edit(props: ProviderItemFactoryEditInput): ProviderItem {
    const validatedProps = this.validateScheduleFields(props);
    const installments = this.buildInstallments(validatedProps, props.paidInstallments);

    return ProviderItem._instantiate({
      ...validatedProps,
      id: props.id,
      active: props.active,
      installments,
    });
  }

  static load(props: ProviderItemProps): ProviderItem {
    return ProviderItem._instantiate({
      ...props,
      installments: props.installments.map((installment) => ({ ...installment })),
    });
  }
}
