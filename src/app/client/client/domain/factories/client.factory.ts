import { AppException } from 'src/core/filters/app.exception';
import { BooleanVo } from 'src/shared/value-objects/boolean/boolean.vo';
import { Document } from 'src/shared/value-objects/document/document.vo';
import { Enum } from 'src/shared/value-objects/enum/enum.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { OptionalString } from 'src/shared/value-objects/optional-string/optional-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { Client, ClientCreateProps, ClientProps } from '../entities/client.entity';
import { ClientInvoiceType } from '../enums/client-invoice-type.enum';
import { ClientType } from '../enums/client-type.enum';

export class ClientFactory {
  private static validateCompanyIds(companyIds: number[], fieldName: string): number[] {
    if (!Array.isArray(companyIds)) {
      throw new Error(`${fieldName} deve ser um array`);
    }
    return companyIds.map((id, index) => new PositiveInt(id, `${fieldName}[${index}]`).value);
  }

  private static validateCreateProps(props: ClientCreateProps): Omit<ClientProps, 'id' | 'active' | 'isSubClient'> {
    return {
      type: new Enum(props.type, ClientType, 'type').value,
      invoiceType: new Enum(props.invoiceType, ClientInvoiceType, 'invoiceType').value,
      document: new Document(props.document).value,
      groupId: new PositiveInt(props.groupId, 'groupId').value,
      resaleId: new PositiveInt(props.resaleId, 'resaleId').value,
      parentClientId: props.parentClientId,
      companyIds: this.validateCompanyIds(props.companyIds ?? [], 'companyIds'),
      companyName: new NonEmptyString(props.companyName, 'companyName').value,
      headquarters: new NonEmptyString(props.headquarters, 'headquarters').value,
      ie: new OptionalString(props.ie, 'ie').value,
      fantasyName: new OptionalString(props.fantasyName, 'fantasyName').value,
      socialName: new OptionalString(props.socialName, 'socialName').value,
      domain: ClientFactory.validateDomain(props.domain),
      generateInvoice: new BooleanVo(props.generateInvoice, 'generateInvoice').value,
    };
  }

  private static validateDomain(domain: string | null | undefined): string | null {
    const normalized = new OptionalString(domain, 'domain').value;
    if (normalized !== null && normalized.length > 128) {
      throw new AppException('O campo domain deve ter no máximo 128 caracteres.');
    }

    return normalized;
  }

  static create(props: ClientCreateProps & { id?: number }): Client {
    const { id: explicitId, ...createProps } = props;
    const validatedProps = this.validateCreateProps(createProps);

    const id = explicitId !== undefined && explicitId !== null
      ? new PositiveInt(explicitId, 'id').value
      : 0;

    return Client._instantiate({
      ...validatedProps,
      id,
      active: true,
      isSubClient: validatedProps.parentClientId != null,
    });
  }

  static edit(props: ClientProps): Client {
    const validatedProps = this.validateCreateProps(props);

    return Client._instantiate({
      ...validatedProps,
      id: props.id,
      active: props.active,
      isSubClient: validatedProps.parentClientId != null,
    });
  }

  static load(props: ClientProps): Client {
    return Client._instantiate({
      id: props.id,
      type: props.type,
      document: props.document,
      ie: props.ie,
      groupId: props.groupId,
      resaleId: props.resaleId,
      parentClientId: props.parentClientId ?? null,
      isSubClient: props.isSubClient ?? false,
      companyIds: props.companyIds ?? [],
      invoiceType: props.invoiceType,
      generateInvoice: props.generateInvoice,
      companyName: props.companyName,
      fantasyName: props.fantasyName,
      socialName: props.socialName ?? null,
      domain: props.domain ?? null,
      headquarters: props.headquarters,
      active: props.active,
    });
  }
}
