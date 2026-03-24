import { AppException } from 'src/core/filters/app.exception';
import { NumberMustBePositiveAndInt } from 'src/shared/value-objects/positive-int/positive-int.error';
import { ClientDiscountCreateProps, ClientDiscountProps } from '../entities/client-discount.entity';
import { DiscountType } from '../enums/discount-type.enum';
import { InvalidDiscountValueError } from '../value-objects/discount-value/discount-value.error';
import { ClientDiscountFactory } from './client-discount.factory';

function makeCreateProps(overrides?: Partial<ClientDiscountCreateProps>): ClientDiscountCreateProps {
  return {
    clientId: 1,
    description: 'Desconto de teste',
    type: DiscountType.PERCENTAGE,
    discountValue: 1050,
    month: 3,
    year: 2026,
    doNotGenerateCharge: false,
    terminateContract: false,
    ...overrides,
  };
}

function makeLoadProps(overrides?: Partial<ClientDiscountProps>): ClientDiscountProps {
  return {
    id: 1,
    active: true,
    clientId: 1,
    description: 'Desconto de teste',
    type: DiscountType.PERCENTAGE,
    discountValue: 1050,
    month: 3,
    year: 2026,
    doNotGenerateCharge: false,
    terminateContract: false,
    ...overrides,
  };
}

describe('ClientDiscountFactory', () => {
  describe('create', () => {
    it('should create a ClientDiscount with id null', () => {
      const props = makeCreateProps();

      const discount = ClientDiscountFactory.create(props);

      expect(discount).toBeDefined();
      expect(discount.props.id).toBeNull();
    });

    it('should create with PERCENTAGE type and valid value', () => {
      const props = makeCreateProps({
        type: DiscountType.PERCENTAGE,
        discountValue: 1050,
      });

      const discount = ClientDiscountFactory.create(props);

      expect(discount.props.type).toBe(DiscountType.PERCENTAGE);
      expect(discount.props.discountValue).toBe(1050);
    });

    it('should create with MONETARY type and valid value', () => {
      const props = makeCreateProps({
        type: DiscountType.MONETARY,
        discountValue: 5000,
      });

      const discount = ClientDiscountFactory.create(props);

      expect(discount.props.type).toBe(DiscountType.MONETARY);
      expect(discount.props.discountValue).toBe(5000);
    });

    it('should throw InvalidDiscountValueError when percentage value exceeds 10000', () => {
      const props = makeCreateProps({
        type: DiscountType.PERCENTAGE,
        discountValue: 10001,
      });

      expect(() => ClientDiscountFactory.create(props)).toThrow(InvalidDiscountValueError);
    });

    it('should throw InvalidDiscountValueError when monetary value is negative', () => {
      const props = makeCreateProps({
        type: DiscountType.MONETARY,
        discountValue: -1,
      });

      expect(() => ClientDiscountFactory.create(props)).toThrow(InvalidDiscountValueError);
    });

    it('should throw AppException when month exceeds 12', () => {
      const props = makeCreateProps({ month: 13 });

      expect(() => ClientDiscountFactory.create(props)).toThrow(AppException);
    });

    it('should throw AppException when year is less than 2020', () => {
      const props = makeCreateProps({ year: 2019 });

      expect(() => ClientDiscountFactory.create(props)).toThrow(AppException);
    });

    it('should throw NumberMustBePositiveAndInt when month is 0', () => {
      const props = makeCreateProps({ month: 0 });

      expect(() => ClientDiscountFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should create with boundary month 1', () => {
      const props = makeCreateProps({ month: 1 });

      const discount = ClientDiscountFactory.create(props);

      expect(discount.props.month).toBe(1);
    });

    it('should create with boundary month 12', () => {
      const props = makeCreateProps({ month: 12 });

      const discount = ClientDiscountFactory.create(props);

      expect(discount.props.month).toBe(12);
    });

    it('should create with boundary year 2020', () => {
      const props = makeCreateProps({ year: 2020 });

      const discount = ClientDiscountFactory.create(props);

      expect(discount.props.year).toBe(2020);
    });

    it('should throw AppException when description is empty', () => {
      const props = makeCreateProps({ description: '' });

      expect(() => ClientDiscountFactory.create(props)).toThrow(AppException);
    });

    it('should throw AppException when description is only whitespace', () => {
      const props = makeCreateProps({ description: '   ' });

      expect(() => ClientDiscountFactory.create(props)).toThrow(AppException);
    });

    it('should trim description', () => {
      const props = makeCreateProps({ description: '  Desconto com espaços  ' });

      const discount = ClientDiscountFactory.create(props);

      expect(discount.props.description).toBe('Desconto com espaços');
    });

    it('should throw NumberMustBePositiveAndInt when clientId is 0', () => {
      const props = makeCreateProps({ clientId: 0 });

      expect(() => ClientDiscountFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should throw NumberMustBePositiveAndInt when clientId is negative', () => {
      const props = makeCreateProps({ clientId: -1 });

      expect(() => ClientDiscountFactory.create(props)).toThrow(NumberMustBePositiveAndInt);
    });

    it('should create with doNotGenerateCharge true', () => {
      const props = makeCreateProps({ doNotGenerateCharge: true });

      const discount = ClientDiscountFactory.create(props);

      expect(discount.props.doNotGenerateCharge).toBe(true);
    });

    it('should create with terminateContract true', () => {
      const props = makeCreateProps({ terminateContract: true });

      const discount = ClientDiscountFactory.create(props);

      expect(discount.props.terminateContract).toBe(true);
    });

    it('should throw when doNotGenerateCharge is not boolean', () => {
      const props = makeCreateProps({
        doNotGenerateCharge: 'true' as unknown as boolean,
      });

      expect(() => ClientDiscountFactory.create(props)).toThrow(AppException);
    });

    it('should throw when terminateContract is not boolean', () => {
      const props = makeCreateProps({
        terminateContract: 1 as unknown as boolean,
      });

      expect(() => ClientDiscountFactory.create(props)).toThrow(AppException);
    });

    it('should throw InvalidDiscountValueError when percentage value is negative', () => {
      const props = makeCreateProps({
        type: DiscountType.PERCENTAGE,
        discountValue: -1,
      });

      expect(() => ClientDiscountFactory.create(props)).toThrow(InvalidDiscountValueError);
    });

    it('should throw InvalidDiscountValueError when percentage value is decimal', () => {
      const props = makeCreateProps({
        type: DiscountType.PERCENTAGE,
        discountValue: 10.5,
      });

      expect(() => ClientDiscountFactory.create(props)).toThrow(InvalidDiscountValueError);
    });

    it('should throw AppException when type is invalid', () => {
      const props = makeCreateProps({
        type: 'invalid' as unknown as DiscountType,
      });

      expect(() => ClientDiscountFactory.create(props)).toThrow(AppException);
    });

    it('should create with all props correctly', () => {
      const props = makeCreateProps({
        clientId: 42,
        description: 'Desconto especial',
        type: DiscountType.MONETARY,
        discountValue: 15000,
        month: 6,
        year: 2025,
        doNotGenerateCharge: true,
        terminateContract: true,
      });

      const discount = ClientDiscountFactory.create(props);

      expect(discount.props.id).toBeNull();
      expect(discount.props.clientId).toBe(42);
      expect(discount.props.description).toBe('Desconto especial');
      expect(discount.props.type).toBe(DiscountType.MONETARY);
      expect(discount.props.discountValue).toBe(15000);
      expect(discount.props.month).toBe(6);
      expect(discount.props.year).toBe(2025);
      expect(discount.props.doNotGenerateCharge).toBe(true);
      expect(discount.props.terminateContract).toBe(true);
    });
  });

  describe('load', () => {
    it('should load ClientDiscount from props without validation', () => {
      const props = makeLoadProps();

      const discount = ClientDiscountFactory.load(props);

      expect(discount).toBeDefined();
      expect(discount.props.id).toBe(1);
      expect(discount.props.description).toBe('Desconto de teste');
    });

    it('should load ClientDiscount with id preserved', () => {
      const props = makeLoadProps({ id: 99 });

      const discount = ClientDiscountFactory.load(props);

      expect(discount.props.id).toBe(99);
    });

    it('should load ClientDiscount with invalid discount value without validation', () => {
      const props = makeLoadProps({
        type: DiscountType.PERCENTAGE,
        discountValue: 99999,
      });

      const discount = ClientDiscountFactory.load(props);

      expect(discount.props.discountValue).toBe(99999);
    });

    it('should load ClientDiscount with all props as provided', () => {
      const props = makeLoadProps({
        id: 10,
        clientId: 5,
        description: 'Desconto carregado',
        type: DiscountType.MONETARY,
        discountValue: 2500,
        month: 12,
        year: 2024,
        doNotGenerateCharge: true,
        terminateContract: true,
      });

      const discount = ClientDiscountFactory.load(props);

      expect(discount.props).toMatchObject({
        id: 10,
        clientId: 5,
        description: 'Desconto carregado',
        type: DiscountType.MONETARY,
        discountValue: 2500,
        month: 12,
        year: 2024,
        doNotGenerateCharge: true,
        terminateContract: true,
      });
    });
  });

  describe('edit', () => {
    it('should edit with same validation as create', () => {
      const props = makeLoadProps({ description: 'Descrição atualizada' });

      const discount = ClientDiscountFactory.edit(props);

      expect(discount.props.description).toBe('Descrição atualizada');
    });

    it('should edit and preserve id', () => {
      const props = makeLoadProps({ id: 42, description: 'Editado' });

      const discount = ClientDiscountFactory.edit(props);

      expect(discount.props.id).toBe(42);
      expect(discount.props.description).toBe('Editado');
    });

    it('should edit with full props and validate', () => {
      const props = makeLoadProps({
        id: 7,
        clientId: 100,
        description: 'Desconto editado',
        type: DiscountType.PERCENTAGE,
        discountValue: 500,
        month: 1,
        year: 2026,
        doNotGenerateCharge: true,
        terminateContract: false,
      });

      const discount = ClientDiscountFactory.edit(props);

      expect(discount.props.id).toBe(7);
      expect(discount.props.clientId).toBe(100);
      expect(discount.props.description).toBe('Desconto editado');
      expect(discount.props.discountValue).toBe(500);
      expect(discount.props.month).toBe(1);
      expect(discount.props.year).toBe(2026);
      expect(discount.props.doNotGenerateCharge).toBe(true);
      expect(discount.props.terminateContract).toBe(false);
    });

    it('should throw when edit has invalid data', () => {
      const props = makeLoadProps({ discountValue: 10001, type: DiscountType.PERCENTAGE });

      expect(() => ClientDiscountFactory.edit(props)).toThrow(InvalidDiscountValueError);
    });

    it('should throw when edit has empty description', () => {
      const props = makeLoadProps({ description: '' });

      expect(() => ClientDiscountFactory.edit(props)).toThrow(AppException);
    });
  });
});
