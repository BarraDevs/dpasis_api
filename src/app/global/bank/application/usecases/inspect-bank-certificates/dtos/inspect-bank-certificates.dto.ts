export class BankCertificateInspectionDto {
  bankId: number;
  owner: string;
  path: string;
  notAfter: Date | null;
  loadError: string | null;
}
