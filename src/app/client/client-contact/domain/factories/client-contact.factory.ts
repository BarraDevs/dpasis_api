import { Email } from 'src/shared/value-objects/email/email.vo';
import { Phone } from 'src/shared/value-objects/phone/phone.vo';
import { ClientContact, ClientContactCreateProps, ClientContactProps } from '../entities/client-contact.entity';

export class ClientContactFactory {
  static create(props: ClientContactCreateProps): ClientContact {
    const email = new Email(props.email);
    const phone = props.phone?.trim() ? new Phone(props.phone).value : null;
    const whatsapp = props.whatsapp?.trim() ? new Phone(props.whatsapp).value : null;

    return ClientContact._instantiate({
      id: null,
      clientId: props.clientId,
      departmentId: props.departmentId,
      name: props.name,
      email: email.value,
      phone,
      whatsapp,
      observations: props.observations ?? null,
      receiveNF: props.receiveNF,
    });
  }

  static edit(existing: ClientContact, data: Omit<ClientContactCreateProps, 'clientId'>): ClientContact {
    const props = existing.props;

    const email = data.email !== undefined ? new Email(data.email).value : props.email;
    const phone = data.phone !== undefined ? (data.phone?.trim() ? new Phone(data.phone).value : null) : props.phone;
    const whatsapp = data.whatsapp !== undefined ? (data.whatsapp?.trim() ? new Phone(data.whatsapp).value : null) : props.whatsapp;

    return ClientContact._instantiate({
      id: props.id,
      clientId: props.clientId,
      departmentId: data.departmentId ?? props.departmentId,
      name: data.name ?? props.name,
      email,
      phone,
      whatsapp,
      observations: data.observations !== undefined ? data.observations : props.observations,
      receiveNF: data.receiveNF !== undefined ? data.receiveNF : props.receiveNF,
    });
  }

  static load(props: ClientContactProps): ClientContact {
    return ClientContact._instantiate({
      id: props.id,
      clientId: props.clientId,
      departmentId: props.departmentId,
      name: props.name,
      email: props.email,
      phone: props.phone,
      whatsapp: props.whatsapp,
      observations: props.observations,
      receiveNF: props.receiveNF,
    });
  }
}
