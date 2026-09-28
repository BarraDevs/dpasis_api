export class BankPaymentCredentialsDto {
  bankId: number;
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  certPem: string;
  keyPem: string;
}
