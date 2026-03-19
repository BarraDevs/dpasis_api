import { InvalidEmailError } from 'src/shared/value-objects/email/email.error';
import { InvalidPhoneError } from 'src/shared/value-objects/phone/phone.error';
import {
  ClientContact,
  ClientContactCreateProps,
  ClientContactProps,
} from '../entities/client-contact.entity';
import { ClientContactFactory } from './client-contact.factory';

function makeClientContactCreateProps(
  overrides?: Partial<ClientContactCreateProps>,
): ClientContactCreateProps {
  return {
    clientId: 10,
    departmentId: 5,
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    whatsapp: '11988888888',
    observations: 'Contato principal',
    receiveNF: true,
    ...overrides,
  };
}

function makeClientContactProps(overrides?: Partial<ClientContactProps>): ClientContactProps {
  return {
    id: 1,
    clientId: 10,
    departmentId: 5,
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999999999',
    whatsapp: '11988888888',
    observations: 'Contato principal',
    receiveNF: true,
    active: true,
    ...overrides,
  };
}

describe('ClientContactFactory', () => {
  describe('create', () => {
    it('should create a ClientContact with id null', () => {
      const props = makeClientContactCreateProps();

      const clientContact = ClientContactFactory.create(props);

      expect(clientContact).toBeInstanceOf(ClientContact);
      expect(clientContact.props.id).toBeNull();
    });

    it('should create a ClientContact with active true', () => {
      const props = makeClientContactCreateProps();

      const clientContact = ClientContactFactory.create(props);

      expect(clientContact.props.active).toBe(true);
    });

    it('should create a ClientContact with all CreateProps', () => {
      const props = makeClientContactCreateProps({
        clientId: 42,
        departmentId: 8,
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '11977777777',
        whatsapp: '11966666666',
        observations: 'Observação',
        receiveNF: false,
      });

      const clientContact = ClientContactFactory.create(props);

      expect(clientContact.props).toEqual({
        id: null,
        clientId: 42,
        departmentId: 8,
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '11977777777',
        whatsapp: '11966666666',
        observations: 'Observação',
        receiveNF: false,
        active: true,
      });
    });

    it('should create a ClientContact with null phone when empty string', () => {
      const props = makeClientContactCreateProps({ phone: '' });

      const clientContact = ClientContactFactory.create(props);

      expect(clientContact.props.phone).toBeNull();
    });

    it('should create a ClientContact with null phone when whitespace-only', () => {
      const props = makeClientContactCreateProps({ phone: '   ' });

      const clientContact = ClientContactFactory.create(props);

      expect(clientContact.props.phone).toBeNull();
    });

    it('should create a ClientContact with null whatsapp when empty string', () => {
      const props = makeClientContactCreateProps({ whatsapp: '' });

      const clientContact = ClientContactFactory.create(props);

      expect(clientContact.props.whatsapp).toBeNull();
    });

    it('should create a ClientContact with null observations when null', () => {
      const props = makeClientContactCreateProps({ observations: null });

      const clientContact = ClientContactFactory.create(props);

      expect(clientContact.props.observations).toBeNull();
    });

    it('should create a ClientContact with null observations when undefined', () => {
      const props = makeClientContactCreateProps({ observations: undefined });

      const clientContact = ClientContactFactory.create(props);

      expect(clientContact.props.observations).toBeNull();
    });

    it('should normalize email to lowercase', () => {
      const props = makeClientContactCreateProps({ email: 'Joao@Example.COM' });

      const clientContact = ClientContactFactory.create(props);

      expect(clientContact.props.email).toBe('joao@example.com');
    });

    it('should sanitize phone (remove non-digits)', () => {
      const props = makeClientContactCreateProps({ phone: '(11) 99999-9999' });

      const clientContact = ClientContactFactory.create(props);

      expect(clientContact.props.phone).toBe('11999999999');
    });

    it('should throw InvalidEmailError when email is invalid', () => {
      const props = makeClientContactCreateProps({ email: 'invalid-email' });

      expect(() => ClientContactFactory.create(props)).toThrow(InvalidEmailError);
      expect(() => ClientContactFactory.create(props)).toThrow('E-mail inválido');
    });

    it('should throw InvalidPhoneError when phone has invalid length', () => {
      const props = makeClientContactCreateProps({ phone: '123' });

      expect(() => ClientContactFactory.create(props)).toThrow(InvalidPhoneError);
      expect(() => ClientContactFactory.create(props)).toThrow('Telefone inválido');
    });
  });

  describe('edit', () => {
    it('should edit ClientContact preserving unchanged fields', () => {
      const existing = ClientContact._instantiate(makeClientContactProps());
      const data = makeClientContactCreateProps({
        name: 'Nome Atualizado',
        observations: 'Nova observação',
        receiveNF: false,
      });

      const clientContact = ClientContactFactory.edit(existing, data);

      expect(clientContact.props).toEqual({
        ...existing.props,
        name: 'Nome Atualizado',
        observations: 'Nova observação',
        receiveNF: false,
      });
    });

    it('should edit ClientContact with departmentId', () => {
      const existing = ClientContact._instantiate(makeClientContactProps());
      const data = makeClientContactCreateProps({ departmentId: 99 });

      const clientContact = ClientContactFactory.edit(existing, data);

      expect(clientContact.props).toEqual({
        ...existing.props,
        ...data,
        departmentId: 99,
      });
    });

    it('should edit ClientContact with new email', () => {
      const existing = ClientContact._instantiate(makeClientContactProps());
      const data = makeClientContactCreateProps({ email: 'novo@example.com' });

      const clientContact = ClientContactFactory.edit(existing, data);

      expect(clientContact.props).toEqual({
        ...existing.props,
        ...data,
        email: 'novo@example.com',
      });
    });

    it('should edit ClientContact with null phone', () => {
      const existing = ClientContact._instantiate(makeClientContactProps());
      const data = makeClientContactCreateProps({ phone: '' });

      const clientContact = ClientContactFactory.edit(existing, data);

      expect(clientContact.props).toEqual({
        ...existing.props,
        ...data,
        phone: null,
      });
    });

    it('should edit ClientContact with new phone', () => {
      const existing = ClientContact._instantiate(makeClientContactProps({ phone: null }));
      const data = makeClientContactCreateProps({ phone: '11955555555' });

      const clientContact = ClientContactFactory.edit(existing, data);

      expect(clientContact.props).toEqual({
        ...existing.props,
        ...data,
        phone: '11955555555',
      });
    });

    it('should edit ClientContact with receiveNF', () => {
      const existing = ClientContact._instantiate(makeClientContactProps({ receiveNF: true }));
      const data = makeClientContactCreateProps({ receiveNF: false });

      const clientContact = ClientContactFactory.edit(existing, data);

      expect(clientContact.props).toEqual({
        ...existing.props,
        ...data,
        receiveNF: false,
      });
    });

    it('should edit ClientContact with observations', () => {
      const existing = ClientContact._instantiate(makeClientContactProps());
      const data = makeClientContactCreateProps({ observations: 'Nova observação' });

      const clientContact = ClientContactFactory.edit(existing, data);

      expect(clientContact.props).toEqual({
        ...existing.props,
        ...data,
        observations: 'Nova observação',
      });
    });

    it('should throw InvalidEmailError when editing with invalid email', () => {
      const existing = ClientContact._instantiate(makeClientContactProps());
      const data = makeClientContactCreateProps({ email: 'invalid' });

      expect(() => ClientContactFactory.edit(existing, data)).toThrow(InvalidEmailError);
    });

    it('should throw InvalidPhoneError when editing with invalid phone', () => {
      const existing = ClientContact._instantiate(makeClientContactProps());
      const data = makeClientContactCreateProps({ phone: '123' });

      expect(() => ClientContactFactory.edit(existing, data)).toThrow(InvalidPhoneError);
    });
  });

  describe('load', () => {
    it('should load a ClientContact with the provided props', () => {
      const props = makeClientContactProps({
        id: 99,
        clientId: 20,
        departmentId: 10,
        name: 'Contato Carregado',
        email: 'loaded@example.com',
        phone: '11944444444',
        whatsapp: null,
        observations: null,
        receiveNF: false,
      });

      const clientContact = ClientContactFactory.load(props);

      expect(clientContact).toBeInstanceOf(ClientContact);
      expect(clientContact.props.id).toBe(99);
      expect(clientContact.props.clientId).toBe(20);
      expect(clientContact.props.departmentId).toBe(10);
      expect(clientContact.props.name).toBe('Contato Carregado');
      expect(clientContact.props.email).toBe('loaded@example.com');
      expect(clientContact.props.phone).toBe('11944444444');
      expect(clientContact.props.whatsapp).toBeNull();
      expect(clientContact.props.observations).toBeNull();
      expect(clientContact.props.receiveNF).toBe(false);
    });

    it('should preserve all props when loading', () => {
      const props = makeClientContactProps();

      const clientContact = ClientContactFactory.load(props);

      expect(clientContact.props).toEqual(props);
    });
  });
});
