import { Inject, Injectable } from '@nestjs/common';
import { CancelBankPayment } from 'src/app/bank-payment/application/usecases/cancel-bank-payment/cancel-bank-payment.service';
import { CancelNfse } from 'src/app/tax-invoice/nfse/application/usecases/cancel-nfse/cancel-nfse.service';
import { NfseCancellationReason } from 'src/app/tax-invoice/nfse/domain/enums/nfse-cancellation-reason.enum';
import { Nfse } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';
import { FindClientInvoiceConfigByClientId } from 'src/app/client/client-invoice-config/application/usecases/find-client-invoice-config-by-client-id/find-client-invoice-config-by-client-id.service';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import { bankIdFromClientInvoiceConfig } from 'src/app/tax-invoice/nfse/application/helpers/bank-id-from-invoice-config';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { CancelNfmInputDto, CancelNfmOutputDto } from './dtos/cancel-nfm.dto';

const CANCEL_REASON_LABELS: Record<number, string> = {
  [NfseCancellationReason.ErrorOnIssuance]: 'Erro na emissão da NFS-e',
  [NfseCancellationReason.ServiceNotProvided]: 'Serviço não prestado',
  [NfseCancellationReason.DuplicateNote]: 'Nota fiscal duplicada',
};

type BankPaymentCancellation = {
  canceled: boolean;
  error?: string;
};

@Injectable()
export class CancelNfm {
  constructor(
    @Inject(TOKENS.NfmRepository) private readonly nfmRepository: INfmRepository,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly cancelNfse: CancelNfse,
    private readonly cancelBankPayment: CancelBankPayment,
    private readonly findClientInvoiceConfigByClientId: FindClientInvoiceConfigByClientId,
  ) {}

  public async execute(nfmId: number, input: CancelNfmInputDto): Promise<CancelNfmOutputDto> {
    const nfm = await this.nfmRepository.findById(nfmId);
    if (!nfm) {
      throw new NfmNotFoundError();
    }

    nfm.ensureCanCancel();

    // Boleto primeiro: cancelar cobrança é reversível (basta reemitir), cancelar NFS-e não é. Na
    // ordem inversa, uma falha no boleto deixaria uma nota cancelada com cobrança viva — que é
    // exatamente o cenário que esta cascata existe para eliminar.
    const bankPayment = await this.cancelLinkedBankPayment(nfm.props.nfse!, input.cancelReasonCode);

    const result = await this.cancelNfse.execute(nfm.props.nfse!.props.id, input);

    return {
      id: nfmId,
      status: result.status,
      canceledAt: result.canceledAt,
      bankPaymentCanceled: bankPayment.canceled,
      ...(bankPayment.error ? { bankPaymentError: bankPayment.error } : {}),
    };
  }

  /**
   * A falha do boleto não aborta o cancelamento da nota: a decisão é que a rota sempre conclua e a
   * pendência fique visível na resposta e no log, em vez de travar a operação. Quem receber
   * `bankPaymentCanceled: false` com `bankPaymentError` precisa tratar a cobrança manualmente.
   */
  private async cancelLinkedBankPayment(nfse: Nfse, cancelReasonCode: number): Promise<BankPaymentCancellation> {
    const requestCode = nfse.props.bankPaymentRequestCode;
    const provider = nfse.props.bankPaymentProvider;

    if (!requestCode || !provider) {
      return { canceled: false };
    }

    try {
      const bankId = await bankIdFromClientInvoiceConfig(
        this.findClientInvoiceConfigByClientId,
        nfse.props.clientId,
      );
      await this.cancelBankPayment.execute(requestCode, {
        provider: provider as BankPaymentProvider,
        bankId,
        reason: CancelNfm.buildCancelReason(cancelReasonCode),
      });

      return { canceled: true };
    }
    catch (error: any) {
      this.logger.error(LogContext.BANK_PAYMENT, {
        adapter: 'nfm',
        action: 'cancelNfm',
        nfseId: nfse.props.id,
        requestCode,
        error,
      });

      return { canceled: false, error: error?.message ?? 'Falha ao cancelar a cobrança bancária.' };
    }
  }

  private static buildCancelReason(cancelReasonCode: number): string {
    return (CANCEL_REASON_LABELS[cancelReasonCode] ?? 'Cancelamento da NFS-e').slice(0, 50);
  }
}
