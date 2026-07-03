import { BankDto } from 'src/app/global/bank/application/dtos/bank.dto';
import { ProviderItemScheduleType } from '../../domain/enums/provider-item-schedule-type.enum';
import { ProviderItemInstallmentDto } from './provider-item-installment.dto';

export class ProviderItemDto {
  id: number;
  providerId: number;
  description: string;
  totalValueInCents: number;
  installmentsCount: number;
  scheduleType: ProviderItemScheduleType;
  intervalDays: number | null;
  dueDay: number | null;
  firstDueDate: Date;
  bank: BankDto;
  active: boolean;
  installments: ProviderItemInstallmentDto[];
  createdAt: Date;
  updatedAt: Date;
}
