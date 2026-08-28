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
    });
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
      data: props.data,
    });
  }
}
