import { BooleanVo } from 'src/shared/value-objects/boolean/boolean.vo';
import { Document } from 'src/shared/value-objects/document/document.vo';
import { Enum } from 'src/shared/value-objects/enum/enum.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { OptionalString } from 'src/shared/value-objects/optional-string/optional-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { Resale, ResaleCreateProps, ResaleProps } from '../entities/resale.entity';
import { ResaleType } from '../enums/resale-type.enum';

export class ResaleFactory {
  private static validateCreateProps(props: ResaleCreateProps): Omit<ResaleProps, 'id' | 'active'> {
    return {
      type: new Enum(props.type, ResaleType, 'type').value,
      name: new NonEmptyString(props.name, 'name').value,
      identifier: new OptionalString(props.identifier, 'identifier').value,
      zipCode: new NonEmptyString(props.zipCode, 'zipCode').value,
      street: new NonEmptyString(props.street, 'street').value,
      neighborhood: new NonEmptyString(props.neighborhood, 'neighborhood').value,
      city: new NonEmptyString(props.city, 'city').value,
      state: new NonEmptyString(props.state, 'state').value,
      licenseType: new NonEmptyString(props.licenseType, 'licenseType').value,
      document: new Document(props.document).value,
      ie: new OptionalString(props.ie, 'ie').value,
      phone01: new NonEmptyString(props.phone01, 'phone01').value,
      phone02: new OptionalString(props.phone02, 'phone02').value,
      voucher: new OptionalString(props.voucher, 'voucher').value,
      email: new OptionalString(props.email, 'email').value,
      website: new OptionalString(props.website, 'website').value,
      nickname: new OptionalString(props.nickname, 'nickname').value,
      socialName: new OptionalString(props.socialName, 'socialName').value,
      validityDate: props.validityDate ?? null,
      accessEmail: new OptionalString(props.accessEmail, 'accessEmail').value,
      accessPassword: new OptionalString(props.accessPassword, 'accessPassword').value,
      paymentDay: props.paymentDay ?? null,
      bonus: props.bonus ?? null,
      billingStartDay: props.billingStartDay ?? null,
      receivesSupportEmail: new BooleanVo(props.receivesSupportEmail, 'receivesSupportEmail').value,
      servedByRoot: new BooleanVo(props.servedByRoot, 'servedByRoot').value,
      manufacturerResale: new BooleanVo(props.manufacturerResale, 'manufacturerResale').value,
      indicatorResale: new BooleanVo(props.indicatorResale, 'indicatorResale').value,
      recurringResale: new BooleanVo(props.recurringResale, 'recurringResale').value,
      profilePictureUrl: new OptionalString(props.profilePictureUrl, 'profilePictureUrl').value,
    };
  }

  static create(props: ResaleCreateProps & { id?: number }): Resale {
    const { id: explicitId, ...createProps } = props;
    const validatedProps = this.validateCreateProps(createProps);

    const id = explicitId !== undefined && explicitId !== null
      ? new PositiveInt(explicitId, 'id').value
      : 0;

    return Resale._instantiate({
      ...validatedProps,
      id,
      active: true,
    });
  }

  static edit(props: ResaleProps): Resale {
    const validatedProps = this.validateCreateProps(props);

    return Resale._instantiate({
      ...validatedProps,
      id: props.id,
      active: props.active,
    });
  }

  static load(props: ResaleProps): Resale {
    return Resale._instantiate({
      id: props.id,
      type: props.type as ResaleType,
      name: props.name,
      identifier: props.identifier ?? null,
      zipCode: props.zipCode,
      street: props.street,
      neighborhood: props.neighborhood,
      city: props.city,
      state: props.state,
      licenseType: props.licenseType,
      document: props.document,
      ie: props.ie ?? null,
      phone01: props.phone01,
      phone02: props.phone02 ?? null,
      voucher: props.voucher ?? null,
      email: props.email ?? null,
      website: props.website ?? null,
      nickname: props.nickname ?? null,
      socialName: props.socialName ?? null,
      validityDate: props.validityDate ?? null,
      accessEmail: props.accessEmail ?? null,
      accessPassword: props.accessPassword ?? null,
      paymentDay: props.paymentDay ?? null,
      bonus: props.bonus ?? null,
      billingStartDay: props.billingStartDay ?? null,
      receivesSupportEmail: props.receivesSupportEmail,
      servedByRoot: props.servedByRoot,
      manufacturerResale: props.manufacturerResale,
      indicatorResale: props.indicatorResale,
      recurringResale: props.recurringResale,
      profilePictureUrl: props.profilePictureUrl ?? null,
      active: props.active,
    });
  }
}
