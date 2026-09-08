import { Inject, Injectable } from '@nestjs/common';
import { RecordJobAudit } from 'src/app/audit/application/usecases/record-job-audit/record-job-audit.service';
import { FindBankPayment } from 'src/app/bank-payment/application/usecases/find-bank-payment/find-bank-payment.service';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import { ConfirmNfseBankPaymentInputDto, ConfirmNfseBankPaymentOutputDto } from './dtos/confirm-nfse-bank-payment.dto';

/**
 * Situações que provam que o boleto existe e é cobrável. `AWAITING_APPROVAL` fica de fora de
 * propósito: a solicitação ainda está em trânsito e a próxima varredura pergunta de novo.
 */
const CONFIRMED_STATUSES: BankPaymentStatus[] = [
  BankPaymentStatus.EMITTED,
  BankPaymentStatus.RECEIVED,
  BankPaymentStatus.PAID,
  BankPaymentStatus.MARKED_RECEIVED,
  BankPaymentStatus.EXPIRED,
  BankPaymentStatus.CANCELLED,
];

@Injectable()
export class ConfirmNfseBankPayment {
  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    @Inject(TOKENS.NfseRepository) private readonly nfseRepository: INfseRepository,
    private readonly findBankPayment: FindBankPayment,
    private readonly recordJobAudit: RecordJobAudit,
  ) {}

  /**
   * `POST /cobrancas` do Inter é assíncrono: `codigoSolicitacao` diz que a solicitação foi aceita,
   * não que o boleto foi produzido. Sem esta confirmação uma cobrança em `FALHA_EMISSAO` fica
   * indistinguível de uma saudável — a NFS-e aparece `ISSUED` e vinculada, e o cliente nunca recebe
   * nada. A inadimplência resultante parece do cliente.
   */
  public async execute(input: ConfirmNfseBankPaymentInputDto): Promise<ConfirmNfseBankPaymentOutputDto | null> {
    const nfse = await this.nfseRepository.findById(input.nfseId);
    if (!nfse) {
      throw new NfseNotFoundError();
    }

    const requestCode = nfse.props.bankPaymentRequestCode;
    if (!requestCode || nfse.hasConfirmedBankPayment()) {
      return null;
    }

    const provider = (nfse.props.bankPaymentProvider ?? BankPaymentProvider.INTER) as BankPaymentProvider;
    const bankPayment = await this.findBankPayment.execute(requestCode, provider);

    const confirmed = CONFIRMED_STATUSES.includes(bankPayment.status);
    nfse.markBankPaymentStatus(bankPayment.status, confirmed ? new Date() : null);

    // A produção da cobrança falhou do lado do provedor. O vínculo **não** é apagado: reemitir é
    // decisão humana, e limpar `bankPaymentRequestCode` reabriria a duplicidade fechada na Onda 2.
    if (bankPayment.status === BankPaymentStatus.FAILED) {
      nfse.markBankPaymentFailed(`Provedor reportou falha na emissão da cobrança ${requestCode}`);
    }

    await this.nfseRepository.edit(nfse);

    this.logger.debug(LogContext.BANK_PAYMENT, {
      adapter: 'nfse',
      action: 'confirmNfseBankPayment',
      nfseId: nfse.props.id,
      requestCode,
    });

    this.recordJobAudit.record({
      jobName: 'confirm-nfse-bank-payment',
      nfseId: nfse.props.id,
      from: null,
      to: bankPayment.status,
      reason: `Cobrança ${requestCode} · confirmada=${confirmed}`,
      succeeded: bankPayment.status !== BankPaymentStatus.FAILED,
    });

    return { nfseId: nfse.props.id, status: bankPayment.status, confirmed };
  }
}
