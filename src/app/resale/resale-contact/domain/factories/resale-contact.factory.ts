import { Email } from 'src/shared/value-objects/email/email.vo';
import { Phone } from 'src/shared/value-objects/phone/phone.vo';
import { ResaleContact, ResaleContactCreateProps, ResaleContactProps } from '../entities/resale-contact.entity';

export class ResaleContactFactory {
  static create(props: ResaleContactCreateProps): ResaleContact {
    const email = new Email(props.email);
    const phone = props.phone?.trim() ? new Phone(props.phone).value : null;
    const whatsapp = props.whatsapp?.trim() ? new Phone(props.whatsapp).value : null;

    return ResaleContact._instantiate({
      id: null,
      resaleId: props.resaleId,
      departmentId: props.departmentId,
      name: props.name,
      email: email.value,
      phone,
      whatsapp,
      observations: props.observations ?? null,
      receiveNF: props.receiveNF,
      active: true,
    });
  }

  static edit(existing: ResaleContact, data: Omit<ResaleContactCreateProps, 'resaleId'>): ResaleContact {
    const props = existing.props;

    const email = data.email !== undefined ? new Email(data.email).value : props.email;
    const phone = data.phone !== undefined ? (data.phone?.trim() ? new Phone(data.phone).value : null) : props.phone;
    const whatsapp = data.whatsapp !== undefined ? (data.whatsapp?.trim() ? new Phone(data.whatsapp).value : null) : props.whatsapp;

    return ResaleContact._instantiate({
      id: props.id,
      resaleId: props.resaleId,
      departmentId: data.departmentId ?? props.departmentId,
      name: data.name ?? props.name,
      email,
      phone,
      whatsapp,
      observations: data.observations !== undefined ? data.observations : props.observations,
      receiveNF: data.receiveNF !== undefined ? data.receiveNF : props.receiveNF,
      active: props.active,
    });
  }

  static load(props: ResaleContactProps): ResaleContact {
    return ResaleContact._instantiate({
      id: props.id,
      resaleId: props.resaleId,
      departmentId: props.departmentId,
      name: props.name,
      email: props.email,
      phone: props.phone,
      whatsapp: props.whatsapp,
      observations: props.observations,
      receiveNF: props.receiveNF,
      active: props.active,
    });
  }
}
