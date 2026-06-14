import { NfEnvironment } from '../enums/nf-environment.enum';

export class InvalidateNfNumbersInputDto {
  environment: NfEnvironment;
  year: number;
  series: number;
  startNumber: number;
  endNumber: number;
  reason: string;
}

export class InvalidateNfNumbersOutputDto {
  code: number;
  description: string;
}
