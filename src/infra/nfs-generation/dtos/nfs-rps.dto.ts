import { NfsPartyDto } from './nfs-party.dto';
import { NfsServiceDto } from './nfs-service.dto';
import { NfsTakerDto } from './nfs-taker.dto';

export enum NfsRpsType {
  Rps = 1,
  MixedInvoice = 2,
  Coupon = 3,
}

export class NfsRpsDto {
  rpsNumber: number;
  rpsSeries: string;
  rpsType: NfsRpsType;
  issueDate: string; // AAAA-MM-DD
  competence: string; // AAAA-MM-DD
  provider: NfsPartyDto;
  taker?: NfsTakerDto;
  service: NfsServiceDto;
  simpleNationalOptant: boolean;
  fiscalIncentive: boolean;
  additionalInformation?: string;
}
