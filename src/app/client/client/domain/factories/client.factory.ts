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
  private static validateCreateProps(props: ClientCreateProps): ClientCreateProps {
    return {
      type: new Enum(props.type, ClientType, 'type').value,
      invoiceType: new Enum(props.invoiceType, ClientInvoiceType, 'invoiceType').value,
      document: new Document(props.document).value,
      groupId: new PositiveInt(props.groupId, 'groupId').value,
      ownerId: new PositiveInt(props.ownerId, 'ownerId').value,
      companyName: new NonEmptyString(props.companyName, 'companyName').value,
      headquarters: new NonEmptyString(props.headquarters, 'headquarters').value,
      ie: new OptionalString(props.ie, 'ie').value,
      fantasyName: new OptionalString(props.fantasyName, 'fantasyName').value,
      generateInvoice: new BooleanVo(props.generateInvoice, 'generateInvoice').value,
    };
  }

  static create(props: ClientCreateProps): Client {
    const validatedProps = this.validateCreateProps(props);

    return Client._instantiate({
      ...validatedProps,
      id: 0,
      active: true,
    });
  }

  static edit(props: ClientProps): Client {
    const validatedProps = this.validateCreateProps(props);

    return Client._instantiate({
      ...validatedProps,
      id: props.id,
      active: props.active,
    });
  }

  static load(props: ClientProps): Client {
    return Client._instantiate({
      id: props.id,
      type: props.type,
      document: props.document,
      ie: props.ie,
      groupId: props.groupId,
      ownerId: props.ownerId,
      invoiceType: props.invoiceType,
      generateInvoice: props.generateInvoice,
      companyName: props.companyName,
      fantasyName: props.fantasyName,
      headquarters: props.headquarters,
      active: props.active,
    });
  }
}
