import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { Nfse, NfseCreateProps, NfseProps } from '../entities/nfse.entity';
import { NfseStatus } from '../enums/nfse-status.enum';

export class NfseFactory {
  private static validateCreateProps(props: NfseCreateProps): NfseCreateProps {
    return {
      companyId: new PositiveInt(props.companyId, 'companyId').value,
      clientId: new PositiveInt(props.clientId, 'clientId').value,
      rpsNumber: new PositiveInt(props.rpsNumber, 'rpsNumber').value,
      rpsSeries: new NonEmptyString(props.rpsSeries, 'rpsSeries').value,
      data: props.data,
    };
  }

  static create(props: NfseCreateProps): Nfse {
    const validatedProps = this.validateCreateProps(props);

    return Nfse._instantiate({
      ...validatedProps,
      id: 0,
      status: NfseStatus.PENDING,
      batchProtocol: null,
      nfseNumber: null,
      verificationCode: null,
      issuedAt: null,
      errorMessage: null,
      canceledAt: null,
      cancelReasonCode: null,
      bankPaymentProvider: null,
      bankPaymentRequestCode: null,
      bankPaymentIdempotencyKey: null,
      bankPaymentRequestedAt: null,
      bankPaymentErrorMessage: null,
      bankPaymentFailedAt: null,
      bankPaymentStatus: null,
      bankPaymentConfirmedAt: null,
      bankPaymentSettledAt: null,
      bankPaymentNextSettlementAt: null,
      bankPaymentRetryCount: 0,
      bankPaymentNextRetryAt: null,
      reconcileAttemptCount: 0,
      nextReconcileAt: null,
      providerAlerts: null,
      providerAlertedAt: null,
      nfmId: null,
      createdAt: new Date(),
    });
  }

  /**
   * Valida o que dá para validar antes de o número de RPS existir. A reserva do RPS acontece dentro
   * da transação do repositório (`INfseRepository.reserve`), então `create()` deixou de ser o
   * caminho de inserção — sem esta checagem a validação sumiria do fluxo de emissão.
   */
  static validateReservation(props: Omit<NfseCreateProps, 'rpsNumber'>): void {
    new PositiveInt(props.companyId, 'companyId');
    new PositiveInt(props.clientId, 'clientId');
    new NonEmptyString(props.rpsSeries, 'rpsSeries');
  }

  static load(props: NfseProps): Nfse {
    return Nfse._instantiate({
      id: props.id,
      companyId: props.companyId,
      clientId: props.clientId,
      rpsNumber: props.rpsNumber,
      rpsSeries: props.rpsSeries,
      status: props.status,
      batchProtocol: props.batchProtocol,
      nfseNumber: props.nfseNumber,
      verificationCode: props.verificationCode,
      issuedAt: props.issuedAt,
      errorMessage: props.errorMessage,
      canceledAt: props.canceledAt,
      cancelReasonCode: props.cancelReasonCode,
      bankPaymentProvider: props.bankPaymentProvider,
      bankPaymentRequestCode: props.bankPaymentRequestCode,
      bankPaymentIdempotencyKey: props.bankPaymentIdempotencyKey,
      bankPaymentRequestedAt: props.bankPaymentRequestedAt,
      bankPaymentErrorMessage: props.bankPaymentErrorMessage,
      bankPaymentFailedAt: props.bankPaymentFailedAt,
      bankPaymentStatus: props.bankPaymentStatus,
      bankPaymentConfirmedAt: props.bankPaymentConfirmedAt,
      bankPaymentSettledAt: props.bankPaymentSettledAt ?? null,
      bankPaymentNextSettlementAt: props.bankPaymentNextSettlementAt ?? null,
      bankPaymentRetryCount: props.bankPaymentRetryCount ?? 0,
      bankPaymentNextRetryAt: props.bankPaymentNextRetryAt ?? null,
      reconcileAttemptCount: props.reconcileAttemptCount,
      nextReconcileAt: props.nextReconcileAt,
      providerAlerts: props.providerAlerts ?? null,
      providerAlertedAt: props.providerAlertedAt ?? null,
      nfmId: props.nfmId,
      createdAt: props.createdAt,
      data: props.data,
    });
  }
}
