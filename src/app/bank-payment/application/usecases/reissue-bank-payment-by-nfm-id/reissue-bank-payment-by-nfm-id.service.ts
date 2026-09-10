import { Injectable } from '@nestjs/common';
import { FindNfmById } from 'src/app/tax-invoice/nfm/application/usecases/find-nfm-by-id/find-nfm-by-id.service';
import { ReissueNfseBankPayment } from 'src/app/tax-invoice/nfse/application/usecases/reissue-nfse-bank-payment/reissue-nfse-bank-payment.service';
import {
  ReissueBankPaymentByNfmIdInputDto,
  ReissueBankPaymentByNfmIdOutputDto,
} from './dtos/reissue-bank-payment-by-nfm-id.dto';

@Injectable()
export class ReissueBankPaymentByNfmId {
  constructor(
    private readonly findNfmById: FindNfmById,
    private readonly reissueNfseBankPayment: ReissueNfseBankPayment,
  ) {}

  /**
   * Reemite o boleto da NFS-e desta NFM depois de o provedor reportar falha na produção da cobrança
   * (`FALHA_EMISSAO`). A decisão — e a consulta ao provedor que a sustenta — vive no use case da
   * NFS-e; aqui só se resolve a NFM.
   */
  public async execute(
    nfmId: number,
    input: ReissueBankPaymentByNfmIdInputDto,
  ): Promise<ReissueBankPaymentByNfmIdOutputDto> {
    const nfm = await this.findNfmById.execute(nfmId);

    return this.reissueNfseBankPayment.execute({ nfseId: nfm.nfse.id, reason: input.reason });
  }
}
