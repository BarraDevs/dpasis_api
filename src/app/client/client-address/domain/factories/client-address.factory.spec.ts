import {
  ClientAddress,
  ClientAddressCreateProps,
  ClientAddressProps,
} from '../entities/client-address.entity';
import { ClientAddressType } from '../enums/client-address-type.enum';
import { ClientAddressFactory } from './client-address.factory';

function makeClientAddressCreateProps(overrides?: Partial<ClientAddressCreateProps>): ClientAddressCreateProps {
  return {
    clientId: 10,
    type: ClientAddressType.MAIN,
    zipCode: '12345-678',
    street: 'Rua Teste',
    number: '123',
    complement: 'Apto 123',
    neighborhood: 'Bairro Teste',
    city: 'Cidade Teste',
    state: 'SP',
    ...overrides,
  };
}

function makeClientAddressProps(overrides?: Partial<ClientAddressProps>): ClientAddressProps {
  return {
    id: 1,
    clientId: 10,
    type: ClientAddressType.MAIN,
    zipCode: '12345-678',
    street: 'Rua Teste',
    number: '123',
    complement: 'Apto 123',
    neighborhood: 'Bairro Teste',
    city: 'Cidade Teste',
    state: 'SP',
    active: true,
    ...overrides,
  };
}

describe('ClientAddressFactory', () => {
  describe('create', () => {
    it('should create a ClientAddress with id null', () => {
      const props = makeClientAddressCreateProps();

      const clientAddress = ClientAddressFactory.create(props);

      expect(clientAddress).toBeInstanceOf(ClientAddress);
      expect(clientAddress.props.id).toBeNull();
    });

    it('should create a ClientAddress with active true', () => {
      const props = makeClientAddressCreateProps();

      const clientAddress = ClientAddressFactory.create(props);

      expect(clientAddress).toBeInstanceOf(ClientAddress);
      expect(clientAddress.props.active).toBe(true);
    });

    it('should create a ClientAddress with all CreateProps', () => {
      const props = makeClientAddressCreateProps({
        clientId: 42,
        type: ClientAddressType.BILLING,
        zipCode: '98765-432',
        street: 'Av. Principal',
        number: '456',
        complement: 'Sala 10',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
      });

      const clientAddress = ClientAddressFactory.create(props);

      expect(clientAddress.props).toEqual({
        id: null,
        clientId: 42,
        type: ClientAddressType.BILLING,
        zipCode: '98765-432',
        street: 'Av. Principal',
        number: '456',
        complement: 'Sala 10',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        active: true,
      });
    });

    it('should create a ClientAddress with null complement', () => {
      const props = makeClientAddressCreateProps({ complement: null });

      const clientAddress = ClientAddressFactory.create(props);

      expect(clientAddress.props.complement).toBeNull();
    });

    it.each(Object.values(ClientAddressType))('should create a ClientAddress with type %s', (type: ClientAddressType) => {
      const props = makeClientAddressCreateProps({ type });

      const clientAddress = ClientAddressFactory.create(props);

      expect(clientAddress.props.type).toBe(type);
    });
  });

  describe('edit', () => {
    it('should create a ClientAddress with full props including id', () => {
      const props = makeClientAddressProps({
        id: 99,
        clientId: 5,
        type: ClientAddressType.SUPPORT,
      });

      const clientAddress = ClientAddressFactory.edit(props);

      expect(clientAddress).toBeInstanceOf(ClientAddress);
      expect(clientAddress.props.id).toBe(99);
      expect(clientAddress.props.clientId).toBe(5);
      expect(clientAddress.props.type).toBe(ClientAddressType.SUPPORT);
    });

    it('should preserve all props when editing', () => {
      const props = makeClientAddressProps({
        id: 42,
        clientId: 10,
        type: ClientAddressType.CORRESPONDENCE,
        zipCode: '11111-222',
        street: 'Rua Editada',
        number: '999',
        complement: null,
        neighborhood: 'Novo Bairro',
        city: 'Nova Cidade',
        state: 'MG',
        active: false,
      });

      const clientAddress = ClientAddressFactory.edit(props);

      expect(clientAddress.props).toEqual(props);
    });
  });

  describe('load', () => {
    it('should load a ClientAddress with the provided props', () => {
      const props = makeClientAddressProps({
        id: 1,
        clientId: 10,
        type: ClientAddressType.MAIN,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 123',
        neighborhood: 'Bairro Teste',
        city: 'Cidade Teste',
        state: 'SP',
        active: true,
      });

      const clientAddress = ClientAddressFactory.load(props);

      expect(clientAddress).toBeInstanceOf(ClientAddress);
      expect(clientAddress.props.id).toBe(1);
      expect(clientAddress.props.clientId).toBe(10);
      expect(clientAddress.props.type).toBe(ClientAddressType.MAIN);
      expect(clientAddress.props.zipCode).toBe('12345-678');
      expect(clientAddress.props.street).toBe('Rua Teste');
      expect(clientAddress.props.number).toBe('123');
      expect(clientAddress.props.complement).toBe('Apto 123');
      expect(clientAddress.props.neighborhood).toBe('Bairro Teste');
      expect(clientAddress.props.city).toBe('Cidade Teste');
      expect(clientAddress.props.state).toBe('SP');
      expect(clientAddress.props.active).toBe(true);
    });

    it('should load only the expected fields from props', () => {
      const props = makeClientAddressProps({
        id: 50,
        clientId: 100,
        type: ClientAddressType.BILLING,
        zipCode: '54321-000',
        street: 'Av. Carregada',
        number: '777',
        complement: null,
        neighborhood: 'Bairro Load',
        city: 'Cidade Load',
        state: 'BA',
        active: false,
      });

      const clientAddress = ClientAddressFactory.load(props);

      expect(clientAddress.props).toEqual({
        id: 50,
        clientId: 100,
        type: ClientAddressType.BILLING,
        zipCode: '54321-000',
        street: 'Av. Carregada',
        number: '777',
        complement: null,
        neighborhood: 'Bairro Load',
        city: 'Cidade Load',
        state: 'BA',
        active: false,
      });
    });

    it('should load ClientAddress with null complement', () => {
      const props = makeClientAddressProps({ complement: null });

      const clientAddress = ClientAddressFactory.load(props);

      expect(clientAddress.props.complement).toBeNull();
    });
  });
});
