export class NfDto {
  rowId: number;
  orderNumber: string | null;
  externalId: number;
  recipientDocument: string;
  recipientFantasyName: string;
  recipientCompanyName: string;
  processCode: number;
  processDescription: string;
  nfeNumber: number | null;
  nfeKey: string | null;
  totalValue: string;
  emissionDate: string;
  authorizationDate: string;
  cancellationCode: string;
  cancellationDescription: string;
  cancellationReason: string;
}
