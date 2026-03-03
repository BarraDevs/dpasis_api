import { Document } from 'src/shared/value-objects/document/document.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { OptionalString } from 'src/shared/value-objects/optional-string/optional-string.vo';
import { Company, CompanyCreateProps, CompanyProps } from '../entities/company.entity';

export class CompanyFactory {
  private static validateCreateProps(props: CompanyCreateProps): CompanyCreateProps {
    return {
      name: new NonEmptyString(props.name, 'name').value,
      fantasyName: new NonEmptyString(props.fantasyName, 'fantasyName').value,
      document: new Document(props.document).value,
      ie: new OptionalString(props.ie, 'ie').value,
      zipCode: new NonEmptyString(props.zipCode, 'zipCode').value,
      street: new NonEmptyString(props.street, 'street').value,
      number: new NonEmptyString(props.number, 'number').value,
      complement: new OptionalString(props.complement, 'complement').value,
      neighborhood: new NonEmptyString(props.neighborhood, 'neighborhood').value,
      city: new NonEmptyString(props.city, 'city').value,
      state: new NonEmptyString(props.state, 'state').value,
      phone01: new NonEmptyString(props.phone01, 'phone01').value,
      phone02: new OptionalString(props.phone02, 'phone02').value,
      cellphone: new OptionalString(props.cellphone, 'cellphone').value,
      email01: new NonEmptyString(props.email01, 'email01').value,
      email02: new OptionalString(props.email02, 'email02').value,
    };
  }

  static create(props: CompanyCreateProps): Company {
    const validatedProps = this.validateCreateProps(props);

    return Company._instantiate({
      ...validatedProps,
      id: 0,
      active: true,
    });
  }

  static edit(props: CompanyProps): Company {
    const validatedProps = this.validateCreateProps(props);

    return Company._instantiate({
      ...validatedProps,
      id: props.id,
      active: props.active,
    });
  }

  static load(props: CompanyProps): Company {
    return Company._instantiate({
      id: props.id,
      name: props.name,
      fantasyName: props.fantasyName,
      document: props.document,
      ie: props.ie,
      zipCode: props.zipCode,
      street: props.street,
      number: props.number,
      complement: props.complement,
      neighborhood: props.neighborhood,
      city: props.city,
      state: props.state,
      phone01: props.phone01,
      phone02: props.phone02,
      cellphone: props.cellphone,
      email01: props.email01,
      email02: props.email02,
      active: props.active,
    });
  }
}
