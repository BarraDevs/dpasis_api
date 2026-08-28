import { Injectable } from '@nestjs/common';
import { FindNfmById } from 'src/app/tax-invoice/nfm/application/usecases/find-nfm-by-id/find-nfm-by-id.service';
import { ProcessIssueNfseBankPayment } from 'src/app/tax-invoice/nfse/application/usecases/process-issue-nfse-bank-payment/process-issue-nfse-bank-payment.service';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseBankPaymentAlreadyLinkedError } from '../../../domain/errors/nfse-bank-payment-already-linked.error';
import { NfseBankPaymentIssueFailedError } from '../../../domain/errors/nfse-bank-payment-issue-failed.error';
import { NfseNotIssuedForBankPaymentError } from '../../../domain/errors/nfse-not-issued-for-bank-payment.error';
import { IssueBankPaymentOutputDto } from '../issue-bank-payment/dtos/issue-bank-payment.dto';

@Injectable()
export class IssueBankPaymentByNfmId {
  constructor(
    private readonly findNfmById: FindNfmById,
    private readonly processIssueNfseBankPayment: ProcessIssueNfseBankPayment,
  ) {}

  public async execute(nfmId: number): Promise<IssueBankPaymentOutputDto> {
    const nfm = await this.findNfmById.execute(nfmId);

    if (nfm.nfse.status !== NfseStatus.ISSUED) {
      throw new NfseNotIssuedForBankPaymentError();
    }
    if (nfm.nfse.bankPaymentRequestCode) {
      throw new NfseBankPaymentAlreadyLinkedError();
    }

    const result = await this.processIssueNfseBankPayment.execute({ nfseId: nfm.nfse.id });
    if (!result) {
      throw new NfseBankPaymentIssueFailedError();
    }

    return result;
  }
}
