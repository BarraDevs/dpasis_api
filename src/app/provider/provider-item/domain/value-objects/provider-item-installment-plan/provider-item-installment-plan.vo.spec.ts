import { ProviderItemScheduleType } from '../../enums/provider-item-schedule-type.enum';
import { ProviderItemInstallmentStatus } from '../../enums/provider-item-installment-status.enum';
import { ProviderItemInstallmentsCountBelowPaidCountError } from '../../errors/provider-item-installments-count-below-paid-count.error';
import { ProviderItemTotalValueLessThanPaidAmountError } from '../../errors/provider-item-total-value-less-than-paid-amount.error';
import { ProviderItemInstallmentPlan } from './provider-item-installment-plan.vo';

describe('ProviderItemInstallmentPlan - Unit tests', () => {
  let sut: typeof ProviderItemInstallmentPlan;

  beforeEach(() => {
    sut = ProviderItemInstallmentPlan;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should split total value with remainder on last installment', () => {
    // Arrange
    const input = {
      totalValueInCents: 100,
      installmentsCount: 3,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
    };

    // Act
    const result = sut.generate(input);

    // Assert
    expect(result).toHaveLength(3);
    expect(result.map((item) => item.valueInCents)).toEqual([33, 33, 34]);
    expect(result.every((item) => item.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
  });

  it('should calculate INTERVAL_DAYS due dates from firstDueDate', () => {
    // Arrange
    const input = {
      totalValueInCents: 300,
      installmentsCount: 3,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
    };

    // Act
    const result = sut.generate(input);

    // Assert
    expect(result[0].dueDate.toISOString().split('T')[0]).toBe('2026-07-10');
    expect(result[1].dueDate.toISOString().split('T')[0]).toBe('2026-08-09');
    expect(result[2].dueDate.toISOString().split('T')[0]).toBe('2026-09-08');
  });

  it('should calculate DUE_DAY due dates using day of month', () => {
    // Arrange
    const input = {
      totalValueInCents: 200,
      installmentsCount: 2,
      scheduleType: ProviderItemScheduleType.DUE_DAY,
      intervalDays: null,
      dueDay: 10,
      firstDueDate: new Date('2026-07-10'),
    };

    // Act
    const result = sut.generate(input);

    // Assert
    expect(result[0].dueDate.toISOString().split('T')[0]).toBe('2026-07-10');
    expect(result[1].dueDate.toISOString().split('T')[0]).toBe('2026-08-10');
  });

  it('should clamp DUE_DAY to last day of month when dueDay exceeds month length', () => {
    // Arrange
    const input = {
      totalValueInCents: 100,
      installmentsCount: 2,
      scheduleType: ProviderItemScheduleType.DUE_DAY,
      intervalDays: null,
      dueDay: 31,
      firstDueDate: new Date('2026-01-31'),
    };

    // Act
    const result = sut.generate(input);

    // Assert
    expect(result[0].dueDate.toISOString().split('T')[0]).toBe('2026-01-31');
    expect(result[1].dueDate.toISOString().split('T')[0]).toBe('2026-02-28');
  });

  it('should preserve paid installments and recalculate pending on edit', () => {
    // Arrange
    const input = {
      totalValueInCents: 1000,
      installmentsCount: 4,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      paidInstallments: [
        {
          id: 1,
          number: 1,
          valueInCents: 200,
          dueDate: new Date('2026-07-10'),
          status: ProviderItemInstallmentStatus.PAID,
        },
        {
          id: 2,
          number: 2,
          valueInCents: 200,
          dueDate: new Date('2026-08-09'),
          status: ProviderItemInstallmentStatus.PAID,
        },
      ],
    };

    // Act
    const result = sut.generate(input);

    // Assert
    expect(result).toHaveLength(4);
    expect(result[0].status).toBe(ProviderItemInstallmentStatus.PAID);
    expect(result[1].status).toBe(ProviderItemInstallmentStatus.PAID);
    expect(result[0].valueInCents).toBe(200);
    expect(result[1].valueInCents).toBe(200);
    expect(result.slice(2).every((item) => item.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
    expect(result.slice(2).reduce((sum, item) => sum + item.valueInCents, 0)).toBe(600);
  });

  it('should throw when installmentsCount is below paid count', () => {
    // Arrange
    const input = {
      totalValueInCents: 1000,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      paidInstallments: [
        {
          id: 1,
          number: 1,
          valueInCents: 200,
          dueDate: new Date('2026-07-10'),
          status: ProviderItemInstallmentStatus.PAID,
        },
        {
          id: 2,
          number: 2,
          valueInCents: 200,
          dueDate: new Date('2026-08-09'),
          status: ProviderItemInstallmentStatus.PAID,
        },
      ],
    };

    // Act & Assert
    expect(() => sut.generate(input)).toThrow(ProviderItemInstallmentsCountBelowPaidCountError);
  });

  it('should throw when total value is less than paid amount', () => {
    // Arrange
    const input = {
      totalValueInCents: 150,
      installmentsCount: 3,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      paidInstallments: [
        {
          id: 1,
          number: 1,
          valueInCents: 200,
          dueDate: new Date('2026-07-10'),
          status: ProviderItemInstallmentStatus.PAID,
        },
      ],
    };

    // Act & Assert
    expect(() => sut.generate(input)).toThrow(ProviderItemTotalValueLessThanPaidAmountError);
  });

  it('should generate single installment with full total value', () => {
    // Arrange
    const input = {
      totalValueInCents: 500,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
    };

    // Act
    const result = sut.generate(input);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].valueInCents).toBe(500);
    expect(result[0].status).toBe(ProviderItemInstallmentStatus.PENDING);
  });

  it('should return only paid drafts when all installments are paid', () => {
    // Arrange
    const input = {
      totalValueInCents: 400,
      installmentsCount: 2,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      paidInstallments: [
        {
          id: 1,
          number: 1,
          valueInCents: 200,
          dueDate: new Date('2026-07-10'),
          status: ProviderItemInstallmentStatus.PAID,
        },
        {
          id: 2,
          number: 2,
          valueInCents: 200,
          dueDate: new Date('2026-08-09'),
          status: ProviderItemInstallmentStatus.PAID,
        },
      ],
    };

    // Act
    const result = sut.generate(input);

    // Assert
    expect(result).toHaveLength(2);
    expect(result.every((item) => item.status === ProviderItemInstallmentStatus.PAID)).toBe(true);
    expect(result.reduce((sum, item) => sum + item.valueInCents, 0)).toBe(400);
  });

  it('should ignore PENDING installments in paidInstallments array', () => {
    // Arrange
    const input = {
      totalValueInCents: 1000,
      installmentsCount: 3,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      paidInstallments: [
        {
          id: 1,
          number: 1,
          valueInCents: 200,
          dueDate: new Date('2026-07-10'),
          status: ProviderItemInstallmentStatus.PAID,
        },
        {
          id: 2,
          number: 2,
          valueInCents: 999,
          dueDate: new Date('2026-08-09'),
          status: ProviderItemInstallmentStatus.PENDING,
        },
      ],
    };

    // Act
    const result = sut.generate(input);

    // Assert
    expect(result).toHaveLength(3);
    expect(result[0].status).toBe(ProviderItemInstallmentStatus.PAID);
    expect(result[0].valueInCents).toBe(200);
    expect(result.slice(1).every((item) => item.status === ProviderItemInstallmentStatus.PENDING)).toBe(true);
    expect(result.slice(1).reduce((sum, item) => sum + item.valueInCents, 0)).toBe(800);
  });

  it('should accept total value exactly equal to paid total with no pending installments', () => {
    // Arrange
    const input = {
      totalValueInCents: 300,
      installmentsCount: 1,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      paidInstallments: [
        {
          id: 1,
          number: 1,
          valueInCents: 300,
          dueDate: new Date('2026-07-10'),
          status: ProviderItemInstallmentStatus.PAID,
        },
      ],
    };

    // Act
    const result = sut.generate(input);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(ProviderItemInstallmentStatus.PAID);
    expect(result[0].valueInCents).toBe(300);
  });

  it('should allocate remaining cent to single pending installment', () => {
    // Arrange
    const input = {
      totalValueInCents: 201,
      installmentsCount: 2,
      scheduleType: ProviderItemScheduleType.INTERVAL_DAYS,
      intervalDays: 30,
      dueDay: null,
      firstDueDate: new Date('2026-07-10'),
      paidInstallments: [
        {
          id: 1,
          number: 1,
          valueInCents: 200,
          dueDate: new Date('2026-07-10'),
          status: ProviderItemInstallmentStatus.PAID,
        },
      ],
    };

    // Act
    const result = sut.generate(input);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[1].status).toBe(ProviderItemInstallmentStatus.PENDING);
    expect(result[1].valueInCents).toBe(1);
  });
});
