import { AppException } from 'src/core/filters/app.exception';
import { BilledCreateProps, BilledProps } from '../entities/billed.entity';
import { BilledFactory } from './billed.factory';

function makeCreateProps(overrides?: Partial<BilledCreateProps>): BilledCreateProps {
  return {
    description: 'Descrição do faturado',
    isJunction: false,
    installmentDays: [5, 15, 25],
    ...overrides,
  };
}

function makeLoadProps(overrides?: Partial<BilledProps>): BilledProps {
  return {
    id: 1,
    description: 'Descrição do faturado',
    isJunction: false,
    installmentDays: [5, 15, 25],
    active: true,
    ...overrides,
  };
}

describe('BilledFactory', () => {
  describe('create', () => {
    it('should create a Billed with id null and active true', () => {
      const props = makeCreateProps();

      const billed = BilledFactory.create(props);

      expect(billed).toBeDefined();
      expect(billed.props.id).toBeNull();
      expect(billed.props.active).toBe(true);
    });

    it('should create with isJunction true', () => {
      const props = makeCreateProps({ isJunction: true });

      const billed = BilledFactory.create(props);

      expect(billed.props.isJunction).toBe(true);
    });

    it('should create with installmentDays', () => {
      const props = makeCreateProps({ installmentDays: [10, 20, 30] });

      const billed = BilledFactory.create(props);

      expect(billed.props.installmentDays).toEqual([10, 20, 30]);
    });

    it('should trim description', () => {
      const props = makeCreateProps({ description: '  Descrição com espaços  ' });

      const billed = BilledFactory.create(props);

      expect(billed.props.description).toBe('Descrição com espaços');
    });

    it('should throw when description is empty', () => {
      const props = makeCreateProps({ description: '' });

      expect(() => BilledFactory.create(props)).toThrow(AppException);
    });

    it('should throw when installmentDays is not an array', () => {
      const props = makeCreateProps({ installmentDays: 'invalid' as unknown as number[] });

      expect(() => BilledFactory.create(props)).toThrow(AppException);
    });

    it('should throw when installmentDays contains negative number', () => {
      const props = makeCreateProps({ installmentDays: [5, -1, 25] });

      expect(() => BilledFactory.create(props)).toThrow(AppException);
    });

    it('should create with empty installmentDays array', () => {
      const props = makeCreateProps({ installmentDays: [] });

      const billed = BilledFactory.create(props);

      expect(billed.props.installmentDays).toEqual([]);
    });

    it('should create with installmentDays including 0', () => {
      const props = makeCreateProps({ installmentDays: [0, 15, 30] });

      const billed = BilledFactory.create(props);

      expect(billed.props.installmentDays).toEqual([0, 15, 30]);
    });

    it('should sort installmentDays in ascending order', () => {
      const props = makeCreateProps({ installmentDays: [30, 15, 0] });

      const billed = BilledFactory.create(props);

      expect(billed.props.installmentDays).toEqual([0, 15, 30]);
    });

    it('should remove duplicate installmentDays', () => {
      const props = makeCreateProps({ installmentDays: [30, 15, 15, 30] });

      const billed = BilledFactory.create(props);

      expect(billed.props.installmentDays).toEqual([15, 30]);
    });
  });

  describe('load', () => {
    it('should load Billed from props without validation', () => {
      const props = makeLoadProps();

      const billed = BilledFactory.load(props);

      expect(billed).toBeDefined();
      expect(billed.props.id).toBe(1);
      expect(billed.props.description).toBe('Descrição do faturado');
    });

    it('should load with id preserved', () => {
      const props = makeLoadProps({ id: 99 });

      const billed = BilledFactory.load(props);

      expect(billed.props.id).toBe(99);
    });
  });

  describe('edit', () => {
    it('should edit with same validation as create', () => {
      const props = makeLoadProps({ description: 'Descrição atualizada' });

      const billed = BilledFactory.edit(props);

      expect(billed.props.description).toBe('Descrição atualizada');
    });

    it('should edit and preserve id and active', () => {
      const props = makeLoadProps({ id: 42, description: 'Editado', active: false });

      const billed = BilledFactory.edit(props);

      expect(billed.props.id).toBe(42);
      expect(billed.props.description).toBe('Editado');
      expect(billed.props.active).toBe(false);
    });

    it('should throw when edit has invalid data', () => {
      const props = makeLoadProps({ description: '' });

      expect(() => BilledFactory.edit(props)).toThrow(AppException);
    });
  });
});
