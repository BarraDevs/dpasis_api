import { Document } from 'src/shared/value-objects/document/document.vo';
import { Email } from 'src/shared/value-objects/email/email.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { OptionalString } from 'src/shared/value-objects/optional-string/optional-string.vo';
import { Provider, ProviderCreateProps, ProviderProps } from '../entities/provider.entity';

export class ProviderFactory {
  private static validateCreateProps(props: ProviderCreateProps): ProviderCreateProps {
    return {
      name: new NonEmptyString(props.name, 'name').value,
      document: new Document(props.document).value,
      ie: new OptionalString(props.ie, 'ie').value,
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
      document: props.document,
      ie: props.ie ?? null,
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
