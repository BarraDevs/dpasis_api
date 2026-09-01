import { Month } from 'src/shared/value-objects/month/month.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { Nfm, NfmCreateProps, NfmProps } from '../entities/nfm.entity';

export type NfmFactoryCreateInput = NfmCreateProps;

export class NfmFactory {
  private static validateCreateProps(props: NfmCreateProps): NfmCreateProps {
    return {
      clientId: new PositiveInt(props.clientId, 'clientId').value,
      clientDocument: new NonEmptyString(props.clientDocument, 'clientDocument').value,
      companyName: new NonEmptyString(props.companyName, 'companyName').value,
      referenceMonth: new Month(props.referenceMonth).value,
      referenceYear: new PositiveInt(props.referenceYear, 'referenceYear').value,
      totalValueInCents: new PositiveInt(props.totalValueInCents, 'totalValueInCents', true).value,
      cnaeNbsIndopId: new PositiveInt(props.cnaeNbsIndopId, 'cnaeNbsIndopId').value,
      data: props.data,
    };
  }

  static create(props: NfmFactoryCreateInput): Nfm {
    const validatedProps = this.validateCreateProps(props);

    return Nfm._instantiate({
      ...validatedProps,
      id: 0,
      nfse: null,
    });
  }

  static load(props: NfmProps): Nfm {
    return Nfm._instantiate({
      id: props.id,
      clientId: props.clientId,
      clientDocument: props.clientDocument,
      companyName: props.companyName,
      referenceMonth: props.referenceMonth,
      referenceYear: props.referenceYear,
      totalValueInCents: props.totalValueInCents,
      cnaeNbsIndopId: props.cnaeNbsIndopId,
      data: props.data,
      nfse: props.nfse,
    });
  }
}
