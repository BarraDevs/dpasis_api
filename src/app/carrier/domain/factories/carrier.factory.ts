import { Document } from 'src/shared/value-objects/document/document.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { OptionalString } from 'src/shared/value-objects/optional-string/optional-string.vo';
import { Carrier, CarrierCreateProps, CarrierProps } from '../entities/carrier.entity';

export class CarrierFactory {
  private static validateCreateProps(props: CarrierCreateProps): CarrierCreateProps {
    return {
      name: new NonEmptyString(props.name, 'name').value,
      fantasyName: new NonEmptyString(props.fantasyName, 'fantasyName').value,
      representative: new NonEmptyString(props.representative, 'representative').value,
      document: new Document(props.document).value,
      contact: new NonEmptyString(props.contact, 'contact').value,
      zipCode: new NonEmptyString(props.zipCode, 'zipCode').value,
      street: new NonEmptyString(props.street, 'street').value,
      number: new NonEmptyString(props.number, 'number').value,
      complement: new OptionalString(props.complement, 'complement').value,
      neighborhood: new NonEmptyString(props.neighborhood, 'neighborhood').value,
      city: new NonEmptyString(props.city, 'city').value,
      state: new NonEmptyString(props.state, 'state').value,
    };
  }

  static create(props: CarrierCreateProps): Carrier {
    const validatedProps = this.validateCreateProps(props);

    return Carrier._instantiate({
      ...validatedProps,
      id: 0,
      active: true,
    });
  }

  static edit(props: CarrierProps): Carrier {
    const validatedProps = this.validateCreateProps(props);

    return Carrier._instantiate({
      ...validatedProps,
      id: props.id,
      active: props.active,
    });
  }

  static load(props: CarrierProps): Carrier {
    return Carrier._instantiate({
      id: props.id,
      name: props.name,
      fantasyName: props.fantasyName,
      representative: props.representative,
      document: props.document,
      contact: props.contact,
      zipCode: props.zipCode,
      street: props.street,
      number: props.number,
      complement: props.complement,
      neighborhood: props.neighborhood,
      city: props.city,
      state: props.state,
      active: props.active,
    });
  }
}
