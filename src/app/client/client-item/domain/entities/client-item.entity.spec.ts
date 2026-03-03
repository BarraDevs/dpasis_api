import { ClientItem, ClientItemProps } from './client-item.entity';

function makeClientItemProps(overrides?: Partial<ClientItemProps>): ClientItemProps {
  return {
    id: 1,
    clientId: 10,
    description: 'Item de teste',
    quantity: 2,
    unitValueInCents: 10000,
    cnae: '1234567',
    nbs: '12345678',
    indop: '1',
    ...overrides,
  };
}

describe('ClientItem', () => {
  describe('_instantiate', () => {
    it('should create a ClientItem instance with the provided props', () => {
      const props = makeClientItemProps();

      const clientItem = ClientItem._instantiate(props);

      expect(clientItem).toBeInstanceOf(ClientItem);
    });

    it('should create a ClientItem with null id (before persistence)', () => {
      const props = makeClientItemProps({ id: null });

      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props.id).toBeNull();
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeClientItemProps({
        id: 42,
        clientId: 20,
        description: 'Descrição',
        quantity: 5,
        unitValueInCents: 5000,
        cnae: '1111111',
        nbs: '22222222',
        indop: '2',
      });

      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props).toEqual({
        id: 42,
        clientId: 20,
        description: 'Descrição',
        quantity: 5,
        unitValueInCents: 5000,
        cnae: '1111111',
        nbs: '22222222',
        indop: '2',
      });
    });

    it('should return a copy of props (immutability)', () => {
      const props = makeClientItemProps();
      const clientItem = ClientItem._instantiate(props);

      const returnedProps = clientItem.props;
      (returnedProps as Record<string, unknown>).description = 'Modified';

      expect(clientItem.props.description).toBe('Item de teste');
    });

    it('should return all expected props', () => {
      const props = makeClientItemProps();
      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props).toBeDefined();
      expect(Object.keys(clientItem.props)).toEqual([
        'id',
        'clientId',
        'description',
        'quantity',
        'unitValueInCents',
        'cnae',
        'nbs',
        'indop',
      ]);
    });
  });
});
