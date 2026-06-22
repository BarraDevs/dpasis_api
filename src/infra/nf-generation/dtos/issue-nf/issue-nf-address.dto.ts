export class IssueNfAddressDto {
  zipCode: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  cityCode: string;
  countryCode?: string;
}
