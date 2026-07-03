import { DateTime } from 'luxon';
import { ProviderItemInstallmentStatus } from '../../enums/provider-item-installment-status.enum';
import { ProviderItemScheduleType } from '../../enums/provider-item-schedule-type.enum';
import { ProviderItemInstallmentsCountBelowPaidCountError } from '../../errors/provider-item-installments-count-below-paid-count.error';
import { ProviderItemTotalValueLessThanPaidAmountError } from '../../errors/provider-item-total-value-less-than-paid-amount.error';
import { ProviderItemInstallmentProps } from '../../entities/provider-item.entity';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';

export type InstallmentPlanInput = {
  totalValueInCents: number;
  installmentsCount: number;
  scheduleType: ProviderItemScheduleType;
  intervalDays: number | null;
  dueDay: number | null;
  firstDueDate: Date;
  paidInstallments?: ProviderItemInstallmentProps[];
};

export type InstallmentPlanDraft = Omit<ProviderItemInstallmentProps, 'id'>;

export class ProviderItemInstallmentPlan {
  static generate(input: InstallmentPlanInput): InstallmentPlanDraft[] {
    const paidInstallments = [...(input.paidInstallments ?? [])]
      .filter((installment) => installment.status === ProviderItemInstallmentStatus.PAID)
      .sort((a, b) => a.number - b.number);

    const paidCount = paidInstallments.length;
    const pendingCount = input.installmentsCount - paidCount;

    if (pendingCount < 0) {
      throw new ProviderItemInstallmentsCountBelowPaidCountError();
    }

    const paidTotal = paidInstallments.reduce((sum, installment) => sum + installment.valueInCents, 0);

    if (input.totalValueInCents < paidTotal) {
      throw new ProviderItemTotalValueLessThanPaidAmountError();
    }

    const remainingValue = input.totalValueInCents - paidTotal;
    const pendingValues = this.splitValueInCents(remainingValue, pendingCount);

    const paidNumbers = new Set(paidInstallments.map((installment) => installment.number));
    const pendingNumbers = Array.from({ length: input.installmentsCount }, (_, index) => index + 1)
      .filter((number) => !paidNumbers.has(number));

    const paidDrafts: InstallmentPlanDraft[] = paidInstallments.map((installment) => ({
      number: installment.number,
      valueInCents: installment.valueInCents,
      dueDate: installment.dueDate,
      status: ProviderItemInstallmentStatus.PAID,
    }));

    const pendingDrafts: InstallmentPlanDraft[] = pendingNumbers.map((number, index) => ({
      number,
      valueInCents: pendingValues[index],
      dueDate: this.calculateDueDate(input, number),
      status: ProviderItemInstallmentStatus.PENDING,
    }));

    return [...paidDrafts, ...pendingDrafts].sort((a, b) => a.number - b.number);
  }

  private static splitValueInCents(total: number, count: number): number[] {
    if (count === 0) {
      return [];
    }

    const base = Math.floor(total / count);
    const remainder = total - base * count;
    const values = Array.from({ length: count }, () => base);
    values[count - 1] += remainder;

    return values;
  }

  private static calculateDueDate(input: InstallmentPlanInput, number: number): Date {
    const offset = number - 1;

    if (input.scheduleType === ProviderItemScheduleType.INTERVAL_DAYS) {
      const anchor = UTCDate.from(input.firstDueDate);
      if (offset === 0) {
        return anchor.value;
      }

      return anchor.addDays(offset * input.intervalDays!).value;
    }

    const anchor = UTCDate.from(input.firstDueDate);
    const base = DateTime.fromJSDate(anchor.value, { zone: 'utc' }).plus({ months: offset });
    const lastDayOfMonth = base.endOf('month').day;
    const day = Math.min(input.dueDay!, lastDayOfMonth);

    return base.set({ day }).startOf('day').toJSDate();
  }
}
