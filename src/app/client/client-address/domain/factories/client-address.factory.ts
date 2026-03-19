import { ClientAddress, ClientAddressCreateProps, ClientAddressProps } from '../entities/client-address.entity';

export class ClientAddressFactory {
  static create(props: ClientAddressCreateProps): ClientAddress {
    return ClientAddress._instantiate({ ...props, id: null, active: true });
  }

  static edit(props: ClientAddressProps): ClientAddress {
    return ClientAddress._instantiate(props);
  }

  static load(props: ClientAddressProps): ClientAddress {
    return ClientAddress._instantiate({
      id: props.id,
      clientId: props.clientId,
      type: props.type,
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
