import { Commission } from 'src/shared/value-objects/commission/commision.vo';
import { Email } from 'src/shared/value-objects/email/email.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { OptionalString } from 'src/shared/value-objects/optional-string/optional-string.vo';
import { Seller, SellerCreateProps, SellerProps } from '../entities/seller.entity';

export class SellerFactory {
  private static validateCreateProps(props: SellerCreateProps): SellerCreateProps {
    return {
      name: new NonEmptyString(props.name, 'name').value,
      phone: new NonEmptyString(props.phone, 'phone').value,
      nickname: new OptionalString(props.nickname, 'nickname').value,
      whatsapp: new NonEmptyString(props.whatsapp, 'whatsapp').value,
      email: new Email(props.email).value,
      commission: new Commission(props.commission).value,
      profilePictureUrl: new OptionalString(props.profilePictureUrl, 'profilePictureUrl').value,
      observation: new OptionalString(props.observation, 'observation').value,
      zipCode: new NonEmptyString(props.zipCode, 'zipCode').value,
      street: new NonEmptyString(props.street, 'street').value,
      number: new NonEmptyString(props.number, 'number').value,
      complement: new OptionalString(props.complement, 'complement').value,
      neighborhood: new NonEmptyString(props.neighborhood, 'neighborhood').value,
      city: new NonEmptyString(props.city, 'city').value,
      state: new NonEmptyString(props.state, 'state').value,
    };
  }

  static create(props: SellerCreateProps): Seller {
    const validatedProps = this.validateCreateProps(props);

    return Seller._instantiate({
      ...validatedProps,
      id: 0,
      active: true,
    });
  }

  static edit(props: SellerProps): Seller {
    const validatedProps = this.validateCreateProps(props);

    return Seller._instantiate({
      ...validatedProps,
      id: props.id,
      active: props.active,
    });
  }

  static load(props: SellerProps): Seller {
    return Seller._instantiate({
      id: props.id,
      name: props.name,
      phone: props.phone,
      nickname: props.nickname,
      whatsapp: props.whatsapp,
      email: props.email,
      commission: props.commission,
      profilePictureUrl: props.profilePictureUrl,
      observation: props.observation,
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
