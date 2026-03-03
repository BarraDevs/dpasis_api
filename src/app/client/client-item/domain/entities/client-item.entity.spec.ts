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

    it('should accept empty string for description, cnae, nbs, indop', () => {
      const props = makeClientItemProps({
        description: '',
        cnae: '',
        nbs: '',
        indop: '',
      });
      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props.description).toBe('');
      expect(clientItem.props.cnae).toBe('');
      expect(clientItem.props.nbs).toBe('');
      expect(clientItem.props.indop).toBe('');
    });

    it('should accept boundary string lengths (255, 50)', () => {
      const longDesc = 'a'.repeat(255);
      const maxStr = 'x'.repeat(50);
      const props = makeClientItemProps({
        description: longDesc,
        cnae: maxStr,
        nbs: maxStr,
        indop: maxStr,
      });
      const clientItem = ClientItem._instantiate(props);

      expect(clientItem.props.description).toHaveLength(255);
      expect(clientItem.props.cnae).toHaveLength(50);
      expect(clientItem.props.nbs).toHaveLength(50);
      expect(clientItem.props.indop).toHaveLength(50);
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
