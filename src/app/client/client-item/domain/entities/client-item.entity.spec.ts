import { ClientItem, ClientItemProps } from './client-item.entity';

function makeClientItemProps(overrides?: Partial<ClientItemProps>): ClientItemProps {
  return {
    id: 1,
    clientId: 10,
    description: 'Item de teste',
    quantity: 2,
    unitValueInCents: 10000,
    cnaeNbsIndopId: 1,
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
        cnaeNbsIndopId: 2,
      });

      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props).toEqual<ClientItemProps>({
        id: 42,
        clientId: 20,
        description: 'Descrição',
        quantity: 5,
        unitValueInCents: 5000,
        cnaeNbsIndopId: 2,
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
        'cnaeNbsIndopId',
      ]);
    });
  });

  describe('edge cases', () => {
    it('should accept quantity zero', () => {
      const props = makeClientItemProps({ quantity: 0 });
      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props.quantity).toBe(0);
    });

    it('should accept unitValueInCents zero', () => {
      const props = makeClientItemProps({ unitValueInCents: 0 });
      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props.unitValueInCents).toBe(0);
    });

    it('should accept empty string for description', () => {
      const props = makeClientItemProps({ description: '' });
      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props.description).toBe('');
    });

    it('should accept boundary string length (255) for description', () => {
      const longDesc = 'a'.repeat(255);
      const props = makeClientItemProps({ description: longDesc });
      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props.description).toHaveLength(255);
    });

    it('should accept clientId zero', () => {
      const props = makeClientItemProps({ clientId: 0 });
      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props.clientId).toBe(0);
    });

    it('should accept large numeric values', () => {
      const props = makeClientItemProps({
        quantity: 999999,
        unitValueInCents: 999999999,
      });
      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props.quantity).toBe(999999);
      expect(clientItem.props.unitValueInCents).toBe(999999999);
    });
  });
});
