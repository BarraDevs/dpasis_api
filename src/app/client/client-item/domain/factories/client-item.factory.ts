import { ClientItem, ClientItemCreateProps, ClientItemProps } from '../entities/client-item.entity';

export class ClientItemFactory {
  static create(props: ClientItemCreateProps): ClientItem {
    return ClientItem._instantiate({
      id: null,
      clientId: props.clientId,
      description: props.description,
      quantity: props.quantity,
      unitValueInCents: props.unitValueInCents,
      cnaeNbsIndopId: props.cnaeNbsIndopId,
    });
  }

  static edit(
    existing: ClientItem,
    data: Partial<Omit<ClientItemCreateProps, 'clientId'>>,
  ): ClientItem {
    const props = existing.props;

    return ClientItem._instantiate({
      id: props.id,
      clientId: props.clientId,
      description: data.description ?? props.description,
      quantity: data.quantity ?? props.quantity,
      unitValueInCents: data.unitValueInCents ?? props.unitValueInCents,
      cnaeNbsIndopId: data.cnaeNbsIndopId ?? props.cnaeNbsIndopId,
    });
  }

  static load(props: ClientItemProps): ClientItem {
    return ClientItem._instantiate({
      id: props.id,
      clientId: props.clientId,
      description: props.description,
      quantity: props.quantity,
      unitValueInCents: props.unitValueInCents,
      cnaeNbsIndopId: props.cnaeNbsIndopId,
    });
  }
}
