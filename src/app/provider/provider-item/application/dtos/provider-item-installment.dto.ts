import { ProviderItemInstallmentStatus } from '../../domain/enums/provider-item-installment-status.enum';

export class ProviderItemInstallmentDto {
  id: number;
  number: number;
  valueInCents: number;
  dueDate: Date;
  status: ProviderItemInstallmentStatus;
}
