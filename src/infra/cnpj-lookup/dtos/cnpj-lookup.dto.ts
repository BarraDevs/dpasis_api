export class CnpjLookupOutputDto {
  fantasyName: string;
  companyName: string;
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
  };
}
