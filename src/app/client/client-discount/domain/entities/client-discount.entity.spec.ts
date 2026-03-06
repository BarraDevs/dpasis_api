import { DiscountType } from '../enums/discount-type.enum';
import { ClientDiscount, ClientDiscountProps } from './client-discount.entity';

function makeClientDiscountProps(overrides?: Partial<ClientDiscountProps>): ClientDiscountProps {
  return {
    id: 1,
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

describe('ClientDiscount Entity', () => {
  describe('_instantiate', () => {
    it('should create a ClientDiscount instance with the provided props', () => {
      const props = makeClientDiscountProps();

      const discount = ClientDiscount._instantiate(props);

      expect(discount).toBeInstanceOf(ClientDiscount);
    });

    it('should create a ClientDiscount with null id', () => {
      const props = makeClientDiscountProps({ id: null });

      const discount = ClientDiscount._instantiate(props);

      expect(discount.props.id).toBeNull();
    });

    it('should create a ClientDiscount with PERCENTAGE type', () => {
      const props = makeClientDiscountProps({ type: DiscountType.PERCENTAGE });

      const discount = ClientDiscount._instantiate(props);

      expect(discount.props.type).toBe(DiscountType.PERCENTAGE);
    });

    it('should create a ClientDiscount with MONETARY type', () => {
      const props = makeClientDiscountProps({ type: DiscountType.MONETARY });

      const discount = ClientDiscount._instantiate(props);

      expect(discount.props.type).toBe(DiscountType.MONETARY);
    });

    it('should create a ClientDiscount with doNotGenerateCharge true', () => {
      const props = makeClientDiscountProps({ doNotGenerateCharge: true });

      const discount = ClientDiscount._instantiate(props);

      expect(discount.props.doNotGenerateCharge).toBe(true);
    });

    it('should create a ClientDiscount with terminateContract true', () => {
      const props = makeClientDiscountProps({ terminateContract: true });

      const discount = ClientDiscount._instantiate(props);

      expect(discount.props.terminateContract).toBe(true);
    });

    it('should create a ClientDiscount with boundary discount values', () => {
      const props = makeClientDiscountProps({
        type: DiscountType.PERCENTAGE,
        discountValue: 10000,
      });

      const discount = ClientDiscount._instantiate(props);

      expect(discount.props.discountValue).toBe(10000);
    });

    it('should create a ClientDiscount with monetary value 0', () => {
      const props = makeClientDiscountProps({
        type: DiscountType.MONETARY,
        discountValue: 0,
      });

      const discount = ClientDiscount._instantiate(props);

      expect(discount.props.discountValue).toBe(0);
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeClientDiscountProps({
        id: 42,
        clientId: 10,
        description: 'Desconto especial',
        type: DiscountType.MONETARY,
        discountValue: 5000,
        month: 6,
        year: 2025,
        doNotGenerateCharge: true,
        terminateContract: true,
      });

      const discount = ClientDiscount._instantiate(props);

      expect(discount.props).toEqual({
        id: 42,
        clientId: 10,
        description: 'Desconto especial',
        type: DiscountType.MONETARY,
        discountValue: 5000,
        month: 6,
        year: 2025,
        doNotGenerateCharge: true,
        terminateContract: true,
      });
    });

    it('should return all expected props', () => {
      const props = makeClientDiscountProps();
      const discount = ClientDiscount._instantiate(props);

      expect(discount.props).toBeDefined();
      expect(Object.keys(discount.props)).toEqual([
        'id',
        'clientId',
        'description',
        'type',
        'discountValue',
        'month',
        'year',
        'doNotGenerateCharge',
        'terminateContract',
      ]);
    });

    it('should return a copy of props (immutability)', () => {
      const props = makeClientDiscountProps();
      const discount = ClientDiscount._instantiate(props);

      const returnedProps = discount.props;
      (returnedProps as Record<string, unknown>).description = 'Modified';

      expect(discount.props.description).toBe('Desconto de teste');
    });

    it('should preserve immutability when mutating discountValue', () => {
      const props = makeClientDiscountProps({ discountValue: 1050 });
      const discount = ClientDiscount._instantiate(props);

      const returnedProps = discount.props as unknown as Record<string, unknown>;
      returnedProps.discountValue = 9999;

      expect(discount.props.discountValue).toBe(1050);
    });

    it('should preserve immutability when mutating clientId', () => {
      const props = makeClientDiscountProps({ clientId: 5 });
      const discount = ClientDiscount._instantiate(props);

      const returnedProps = discount.props as unknown as Record<string, unknown>;
      returnedProps.clientId = 999;

      expect(discount.props.clientId).toBe(5);
    });

    it('should preserve immutability when mutating type', () => {
      const props = makeClientDiscountProps({ type: DiscountType.PERCENTAGE });
      const discount = ClientDiscount._instantiate(props);

      const returnedProps = discount.props as unknown as Record<string, unknown>;
      returnedProps.type = DiscountType.MONETARY;

      expect(discount.props.type).toBe(DiscountType.PERCENTAGE);
    });

    it('should return a new object on each props access', () => {
      const props = makeClientDiscountProps();
      const discount = ClientDiscount._instantiate(props);

      const firstAccess = discount.props;
      const secondAccess = discount.props;

      expect(firstAccess).not.toBe(secondAccess);
      expect(firstAccess).toEqual(secondAccess);
    });
  });
});
