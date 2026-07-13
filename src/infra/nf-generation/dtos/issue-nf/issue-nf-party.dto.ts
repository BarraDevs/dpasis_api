import { NfPartyType } from '../../enums/nf-party-type.enum';
import { IssueNfAddressDto } from './issue-nf-address.dto';

export class IssueNfPartyDto {
  document: string;
  type: NfPartyType;
  ie?: string | null;
  companyName: string;
  fantasyName?: string | null;
  email?: string | null;
  phone?: string | null;
  address: IssueNfAddressDto;
  crt?: number | null;
  municipalRegistration?: string | null;
}
