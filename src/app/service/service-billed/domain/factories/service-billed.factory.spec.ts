import { AppException } from 'src/core/filters/app.exception';
import { ServiceBilledCreateProps, ServiceBilledProps } from '../entities/service-billed.entity';
import { ServiceBilledFactory } from './service-billed.factory';

function makeCreateProps(overrides?: Partial<ServiceBilledCreateProps>): ServiceBilledCreateProps {
  return {
    description: 'Descrição do serviço faturado',
    isJunction: false,
    installmentDays: [5, 15, 25],
    ...overrides,
  };
}

function makeLoadProps(overrides?: Partial<ServiceBilledProps>): ServiceBilledProps {
  return {
    id: 1,
    description: 'Descrição do serviço faturado',
    isJunction: false,
    installmentDays: [5, 15, 25],
    active: true,
    ...overrides,
  };
}

describe('ServiceBilledFactory', () => {
  describe('create', () => {
    it('should create a ServiceBilled with id null and active true', () => {
      const props = makeCreateProps();

      const serviceBilled = ServiceBilledFactory.create(props);

      expect(serviceBilled).toBeDefined();
      expect(serviceBilled.props.id).toBeNull();
      expect(serviceBilled.props.active).toBe(true);
    });

    it('should create with isJunction true', () => {
      const props = makeCreateProps({ isJunction: true });

      const serviceBilled = ServiceBilledFactory.create(props);

      expect(serviceBilled.props.isJunction).toBe(true);
    });

    it('should create with installmentDays', () => {
      const props = makeCreateProps({ installmentDays: [10, 20, 30] });

      const serviceBilled = ServiceBilledFactory.create(props);

      expect(serviceBilled.props.installmentDays).toEqual([10, 20, 30]);
    });

    it('should trim description', () => {
      const props = makeCreateProps({ description: '  Descrição com espaços  ' });

      const serviceBilled = ServiceBilledFactory.create(props);

      expect(serviceBilled.props.description).toBe('Descrição com espaços');
    });

    it('should throw when description is empty', () => {
      const props = makeCreateProps({ description: '' });

      expect(() => ServiceBilledFactory.create(props)).toThrow(AppException);
    });

    it('should throw when installmentDays is not an array', () => {
      const props = makeCreateProps({ installmentDays: 'invalid' as unknown as number[] });

      expect(() => ServiceBilledFactory.create(props)).toThrow(AppException);
    });

    it('should throw when installmentDays contains negative number', () => {
      const props = makeCreateProps({ installmentDays: [5, -1, 25] });

      expect(() => ServiceBilledFactory.create(props)).toThrow(AppException);
    });

    it('should create with empty installmentDays array', () => {
      const props = makeCreateProps({ installmentDays: [] });

      const serviceBilled = ServiceBilledFactory.create(props);

      expect(serviceBilled.props.installmentDays).toEqual([]);
    });

    it('should create with installmentDays including 0', () => {
      const props = makeCreateProps({ installmentDays: [0, 15, 30] });

      const serviceBilled = ServiceBilledFactory.create(props);

      expect(serviceBilled.props.installmentDays).toEqual([0, 15, 30]);
    });

    it('should sort installmentDays in ascending order', () => {
      const props = makeCreateProps({ installmentDays: [30, 15, 0] });

      const serviceBilled = ServiceBilledFactory.create(props);

      expect(serviceBilled.props.installmentDays).toEqual([0, 15, 30]);
    });

    it('should remove duplicate installmentDays', () => {
      const props = makeCreateProps({ installmentDays: [30, 15, 15, 30] });

      const serviceBilled = ServiceBilledFactory.create(props);

      expect(serviceBilled.props.installmentDays).toEqual([15, 30]);
    });
  });

  describe('load', () => {
    it('should load ServiceBilled from props without validation', () => {
      const props = makeLoadProps();

      const serviceBilled = ServiceBilledFactory.load(props);

      expect(serviceBilled).toBeDefined();
      expect(serviceBilled.props.id).toBe(1);
      expect(serviceBilled.props.description).toBe('Descrição do serviço faturado');
    });

    it('should load with id preserved', () => {
      const props = makeLoadProps({ id: 99 });

      const serviceBilled = ServiceBilledFactory.load(props);

      expect(serviceBilled.props.id).toBe(99);
    });
  });

  describe('edit', () => {
    it('should edit with same validation as create', () => {
      const props = makeLoadProps({ description: 'Descrição atualizada' });

      const serviceBilled = ServiceBilledFactory.edit(props);

      expect(serviceBilled.props.description).toBe('Descrição atualizada');
    });

    it('should edit and preserve id and active', () => {
      const props = makeLoadProps({ id: 42, description: 'Editado', active: false });

      const serviceBilled = ServiceBilledFactory.edit(props);

      expect(serviceBilled.props.id).toBe(42);
      expect(serviceBilled.props.description).toBe('Editado');
      expect(serviceBilled.props.active).toBe(false);
    });

    it('should throw when edit has invalid data', () => {
      const props = makeLoadProps({ description: '' });

      expect(() => ServiceBilledFactory.edit(props)).toThrow(AppException);
    });
  });
});
