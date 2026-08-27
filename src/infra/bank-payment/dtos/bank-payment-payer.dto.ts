import { BankPaymentPersonType } from '../enums/bank-payment-person-type.enum';

export class BankPaymentPayerDto {
  document: string;
  personType: BankPaymentPersonType;
  name: string;
  email?: string;
  areaCode?: string;
  phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}
