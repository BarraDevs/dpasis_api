import {
  ClientItem,
  ClientItemCreateProps,
  ClientItemProps,
} from '../entities/client-item.entity';
import { ClientItemFactory } from './client-item.factory';

function makeClientItemCreateProps(overrides?: Partial<ClientItemCreateProps>): ClientItemCreateProps {
  return {
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

describe('ClientItemFactory', () => {
  describe('create', () => {
    it('should create a ClientItem with id null', () => {
      const props = makeClientItemCreateProps();

      const clientItem = ClientItemFactory.create(props);

      expect(clientItem).toBeInstanceOf(ClientItem);
      expect(clientItem.props.id).toBeNull();
    });

    it('should create a ClientItem with all CreateProps', () => {
      const props = makeClientItemCreateProps({
        clientId: 42,
        description: 'Descrição completa',
        quantity: 5,
        unitValueInCents: 5000,
        cnae: '1111111',
        nbs: '22222222',
        indop: '2',
      });

      const clientItem = ClientItemFactory.create(props);

      expect(clientItem.props).toEqual({
        id: null,
        clientId: 42,
        description: 'Descrição completa',
        quantity: 5,
        unitValueInCents: 5000,
        cnae: '1111111',
        nbs: '22222222',
        indop: '2',
      });
    });
  });

  describe('edit', () => {
    it('should edit ClientItem preserving unchanged fields', () => {
      const existing = ClientItem._instantiate(makeClientItemProps());
      const data = { description: 'Descrição Atualizada' };

      const clientItem = ClientItemFactory.edit(existing, data);

      expect(clientItem.props).toEqual({
        ...existing.props,
        description: 'Descrição Atualizada',
      });
    });

    it('should edit ClientItem with quantity and unitValueInCents', () => {
      const existing = ClientItem._instantiate(makeClientItemProps());
      const data = { quantity: 10, unitValueInCents: 20000 };

      const clientItem = ClientItemFactory.edit(existing, data);

      expect(clientItem.props).toEqual({
        ...existing.props,
        quantity: 10,
        unitValueInCents: 20000,
      });
    });

    it('should edit ClientItem with cnae, nbs, indop', () => {
      const existing = ClientItem._instantiate(makeClientItemProps());
      const data = { cnae: '9999999', nbs: '88888888', indop: '3' };

      const clientItem = ClientItemFactory.edit(existing, data);

      expect(clientItem.props).toEqual({
        ...existing.props,
        cnae: '9999999',
        nbs: '88888888',
        indop: '3',
      });
    });
  });

  describe('load', () => {
    it('should load a ClientItem with the provided props', () => {
      const props = makeClientItemProps({
        id: 99,
        clientId: 20,
        description: 'Item Carregado',
        quantity: 3,
        unitValueInCents: 15000,
        cnae: '4444444',
        nbs: '55555555',
        indop: '4',
      });

      const clientItem = ClientItemFactory.load(props);

      expect(clientItem).toBeInstanceOf(ClientItem);
      expect(clientItem.props).toEqual({
        id: 99,
        clientId: 20,
        description: 'Item Carregado',
        quantity: 3,
        unitValueInCents: 15000,
        cnae: '4444444',
        nbs: '55555555',
        indop: '4',
      });
    });

    it('should preserve all props when loading', () => {
      const props = makeClientItemProps();

      const clientItem = ClientItemFactory.load(props);

      expect(clientItem.props).toEqual(props);
    });
  });
});
