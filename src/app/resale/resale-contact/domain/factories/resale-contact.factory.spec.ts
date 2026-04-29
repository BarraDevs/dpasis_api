import { InvalidEmailError } from 'src/shared/value-objects/email/email.error';
import { InvalidPhoneError } from 'src/shared/value-objects/phone/phone.error';
import {
  ResaleContact,
  ResaleContactCreateProps,
  ResaleContactProps,
} from '../entities/resale-contact.entity';
import { ResaleContactFactory } from './resale-contact.factory';

function makeResaleContactCreateProps(
  overrides?: Partial<ResaleContactCreateProps>,
): ResaleContactCreateProps {
  return {
    resaleId: 10,
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

function makeResaleContactProps(overrides?: Partial<ResaleContactProps>): ResaleContactProps {
  return {
    id: 1,
    resaleId: 10,
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

describe('ResaleContactFactory', () => {
  describe('create', () => {
    it('should create a ResaleContact with id null', () => {
      const props = makeResaleContactCreateProps();

      const resaleContact = ResaleContactFactory.create(props);

      expect(resaleContact).toBeInstanceOf(ResaleContact);
      expect(resaleContact.props.id).toBeNull();
    });

    it('should create a ResaleContact with active true', () => {
      const props = makeResaleContactCreateProps();

      const resaleContact = ResaleContactFactory.create(props);

      expect(resaleContact.props.active).toBe(true);
    });

    it('should create a ResaleContact with all CreateProps', () => {
      const props = makeResaleContactCreateProps({
        resaleId: 42,
        departmentId: 8,
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '11977777777',
        whatsapp: '11966666666',
        observations: 'Observação',
        receiveNF: false,
      });

      const resaleContact = ResaleContactFactory.create(props);

      expect(resaleContact.props).toEqual<ResaleContactProps>({
        id: null,
        resaleId: 42,
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

    it('should create a ResaleContact with null phone when empty string', () => {
      const props = makeResaleContactCreateProps({ phone: '' });

      const resaleContact = ResaleContactFactory.create(props);

      expect(resaleContact.props.phone).toBeNull();
    });

    it('should create a ResaleContact with null phone when whitespace-only', () => {
      const props = makeResaleContactCreateProps({ phone: '   ' });

      const resaleContact = ResaleContactFactory.create(props);

      expect(resaleContact.props.phone).toBeNull();
    });

    it('should create a ResaleContact with null whatsapp when empty string', () => {
      const props = makeResaleContactCreateProps({ whatsapp: '' });

      const resaleContact = ResaleContactFactory.create(props);

      expect(resaleContact.props.whatsapp).toBeNull();
    });

    it('should create a ResaleContact with null observations when null', () => {
      const props = makeResaleContactCreateProps({ observations: null });

      const resaleContact = ResaleContactFactory.create(props);

      expect(resaleContact.props.observations).toBeNull();
    });

    it('should create a ResaleContact with null observations when undefined', () => {
      const props = makeResaleContactCreateProps({ observations: undefined });

      const resaleContact = ResaleContactFactory.create(props);

      expect(resaleContact.props.observations).toBeNull();
    });

    it('should normalize email to lowercase', () => {
      const props = makeResaleContactCreateProps({ email: 'Joao@Example.COM' });

      const resaleContact = ResaleContactFactory.create(props);

      expect(resaleContact.props.email).toBe('joao@example.com');
    });

    it('should sanitize phone (remove non-digits)', () => {
      const props = makeResaleContactCreateProps({ phone: '(11) 99999-9999' });

      const resaleContact = ResaleContactFactory.create(props);

      expect(resaleContact.props.phone).toBe('11999999999');
    });

    it('should throw InvalidEmailError when email is invalid', () => {
      const props = makeResaleContactCreateProps({ email: 'invalid-email' });

      expect(() => ResaleContactFactory.create(props)).toThrow(InvalidEmailError);
      expect(() => ResaleContactFactory.create(props)).toThrow('E-mail inválido');
    });

    it('should throw InvalidPhoneError when phone has invalid length', () => {
      const props = makeResaleContactCreateProps({ phone: '123' });

      expect(() => ResaleContactFactory.create(props)).toThrow(InvalidPhoneError);
      expect(() => ResaleContactFactory.create(props)).toThrow('Telefone inválido');
    });
  });

  describe('edit', () => {
    it('should edit ResaleContact preserving unchanged fields', () => {
      const existing = ResaleContact._instantiate(makeResaleContactProps());
      const data = makeResaleContactCreateProps({
        name: 'Nome Atualizado',
        observations: 'Nova observação',
        receiveNF: false,
      });

      const resaleContact = ResaleContactFactory.edit(existing, data);

      expect(resaleContact.props).toEqual<ResaleContactProps>({
        ...existing.props,
        name: 'Nome Atualizado',
        observations: 'Nova observação',
        receiveNF: false,
      });
    });

    it('should edit ResaleContact with departmentId', () => {
      const existing = ResaleContact._instantiate(makeResaleContactProps());
      const data = makeResaleContactCreateProps({ departmentId: 99 });

      const resaleContact = ResaleContactFactory.edit(existing, data);

      expect(resaleContact.props).toEqual<ResaleContactProps>({
        ...existing.props,
        ...data,
        departmentId: 99,
      });
    });

    it('should edit ResaleContact with new email', () => {
      const existing = ResaleContact._instantiate(makeResaleContactProps());
      const data = makeResaleContactCreateProps({ email: 'novo@example.com' });

      const resaleContact = ResaleContactFactory.edit(existing, data);

      expect(resaleContact.props).toEqual<ResaleContactProps>({
        ...existing.props,
        ...data,
        email: 'novo@example.com',
      });
    });

    it('should edit ResaleContact with null phone', () => {
      const existing = ResaleContact._instantiate(makeResaleContactProps());
      const data = makeResaleContactCreateProps({ phone: '' });

      const resaleContact = ResaleContactFactory.edit(existing, data);

      expect(resaleContact.props).toEqual<ResaleContactProps>({
        ...existing.props,
        ...data,
        phone: null,
      });
    });

    it('should edit ResaleContact with new phone', () => {
      const existing = ResaleContact._instantiate(makeResaleContactProps({ phone: null }));
      const data = makeResaleContactCreateProps({ phone: '11955555555' });

      const resaleContact = ResaleContactFactory.edit(existing, data);

      expect(resaleContact.props).toEqual<ResaleContactProps>({
        ...existing.props,
        ...data,
        phone: '11955555555',
      });
    });

    it('should edit ResaleContact with receiveNF', () => {
      const existing = ResaleContact._instantiate(makeResaleContactProps({ receiveNF: true }));
      const data = makeResaleContactCreateProps({ receiveNF: false });

      const resaleContact = ResaleContactFactory.edit(existing, data);

      expect(resaleContact.props).toEqual<ResaleContactProps>({
        ...existing.props,
        ...data,
        receiveNF: false,
      });
    });

    it('should edit ResaleContact with observations', () => {
      const existing = ResaleContact._instantiate(makeResaleContactProps());
      const data = makeResaleContactCreateProps({ observations: 'Nova observação' });

      const resaleContact = ResaleContactFactory.edit(existing, data);

      expect(resaleContact.props).toEqual<ResaleContactProps>({
        ...existing.props,
        ...data,
        observations: 'Nova observação',
      });
    });

    it('should throw InvalidEmailError when editing with invalid email', () => {
      const existing = ResaleContact._instantiate(makeResaleContactProps());
      const data = makeResaleContactCreateProps({ email: 'invalid' });

      expect(() => ResaleContactFactory.edit(existing, data)).toThrow(InvalidEmailError);
    });

    it('should throw InvalidPhoneError when editing with invalid phone', () => {
      const existing = ResaleContact._instantiate(makeResaleContactProps());
      const data = makeResaleContactCreateProps({ phone: '123' });

      expect(() => ResaleContactFactory.edit(existing, data)).toThrow(InvalidPhoneError);
    });
  });

  describe('load', () => {
    it('should load a ResaleContact with the provided props', () => {
      const props = makeResaleContactProps({
        id: 99,
        resaleId: 20,
        departmentId: 10,
        name: 'Contato Carregado',
        email: 'loaded@example.com',
        phone: '11944444444',
        whatsapp: null,
        observations: null,
        receiveNF: false,
      });

      const resaleContact = ResaleContactFactory.load(props);

      expect(resaleContact).toBeInstanceOf(ResaleContact);
      expect(resaleContact.props.id).toBe(99);
      expect(resaleContact.props.resaleId).toBe(20);
      expect(resaleContact.props.departmentId).toBe(10);
      expect(resaleContact.props.name).toBe('Contato Carregado');
      expect(resaleContact.props.email).toBe('loaded@example.com');
      expect(resaleContact.props.phone).toBe('11944444444');
      expect(resaleContact.props.whatsapp).toBeNull();
      expect(resaleContact.props.observations).toBeNull();
      expect(resaleContact.props.receiveNF).toBe(false);
    });

    it('should preserve all props when loading', () => {
      const props = makeResaleContactProps();

      const resaleContact = ResaleContactFactory.load(props);

      expect(resaleContact.props).toEqual<ResaleContactProps>(props);
    });
  });
});
