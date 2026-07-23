import { NfsAddressDto } from './nfs-address.dto';
import { NfsPartyDto } from './nfs-party.dto';

export class NfsTakerDto {
  identification?: NfsPartyDto;
  companyName: string;
  address?: NfsAddressDto;
  email?: string;
  phone?: string;
}
