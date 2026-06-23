import { Document } from 'src/shared/value-objects/document/document.vo';
import { Email } from 'src/shared/value-objects/email/email.vo';
import { Enum } from 'src/shared/value-objects/enum/enum.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { OptionalString } from 'src/shared/value-objects/optional-string/optional-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { Provider, ProviderCreateProps, ProviderProps } from '../entities/provider.entity';
import { ProviderType } from '../enums/provider-type.enum';
import { InvalidProviderTypeFieldsError } from '../errors/invalid-provider-type-fields.error';

export class ProviderFactory {
  private static validatePaymentDate(value: number, resource: string): number {
    const day = new PositiveInt(value, resource).value;
    if (day > 31) {
      throw new InvalidProviderTypeFieldsError();
    }
    return day;
  }

  private static resolveTypeFields(
    type: ProviderType,
    paymentDate: number | null | undefined,
    deadline: number | null | undefined,
  ): { paymentDate: number | null; deadline: number | null } {
    switch (type) {
      case ProviderType.RECURRING:
        if (paymentDate == null) {
          throw new InvalidProviderTypeFieldsError();
        }
        return {
          paymentDate: this.validatePaymentDate(paymentDate, 'paymentDate'),
          deadline: null,
        };
      case ProviderType.ONE_OFF:
        if (deadline == null) {
          throw new InvalidProviderTypeFieldsError();
        }
        return {
          paymentDate: null,
          deadline: new PositiveInt(deadline, 'deadline').value,
        };
      default:
        throw new InvalidProviderTypeFieldsError();
    }
  }

  private static validateCreateProps(props: ProviderCreateProps): ProviderCreateProps {
    const type = new Enum(props.type, ProviderType, 'type').value;
    const typeFields = this.resolveTypeFields(type, props.paymentDate, props.deadline);

    return {
      name: new NonEmptyString(props.name, 'name').value,
      type,
      valueInCents: new PositiveInt(props.valueInCents, 'valueInCents', true).value,
      document: new Document(props.document).value,
      ie: new OptionalString(props.ie, 'ie').value,
      paymentDate: typeFields.paymentDate,
      deadline: typeFields.deadline,
      fantasyName: new NonEmptyString(props.fantasyName, 'fantasyName').value,
      email: new Email(props.email).value,
      website: new NonEmptyString(props.website, 'website').value,
      zipCode: new NonEmptyString(props.zipCode, 'zipCode').value,
      street: new NonEmptyString(props.street, 'street').value,
      number: new NonEmptyString(props.number, 'number').value,
      complement: new OptionalString(props.complement, 'complement').value,
      neighborhood: new NonEmptyString(props.neighborhood, 'neighborhood').value,
      city: new NonEmptyString(props.city, 'city').value,
      state: new NonEmptyString(props.state, 'state').value,
    };
  }

  static create(props: ProviderCreateProps): Provider {
    const validatedProps = this.validateCreateProps(props);

    return Provider._instantiate({
      ...validatedProps,
      id: 0,
      active: true,
    });
  }

  static edit(props: ProviderProps): Provider {
    const validatedProps = this.validateCreateProps(props);

    return Provider._instantiate({
      ...validatedProps,
      id: props.id,
      active: props.active,
    });
  }

  static load(props: ProviderProps): Provider {
    return Provider._instantiate({
      id: props.id,
      name: props.name,
      type: props.type as ProviderType,
      valueInCents: props.valueInCents,
      document: props.document,
      ie: props.ie ?? null,
      paymentDate: props.paymentDate ?? null,
      deadline: props.deadline ?? null,
      fantasyName: props.fantasyName,
      email: props.email,
      website: props.website,
      zipCode: props.zipCode,
      street: props.street,
      number: props.number,
      complement: props.complement ?? null,
      neighborhood: props.neighborhood,
      city: props.city,
      state: props.state,
      active: props.active,
    });
  }
}
