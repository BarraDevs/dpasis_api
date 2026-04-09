import { Billed, BilledProps } from './billed.entity';

function makeBilledProps(overrides?: Partial<BilledProps>): BilledProps {
  return {
    id: 1,
    description: 'Descrição do faturado',
    isJunction: false,
    installmentDays: [5, 15, 25],
    active: true,
    ...overrides,
  };
}

describe('Billed Entity', () => {
  describe('_instantiate', () => {
    it('should create a Billed instance with the provided props', () => {
      const props = makeBilledProps();

      const billed = Billed._instantiate(props);

      expect(billed).toBeInstanceOf(Billed);
    });

    it('should create a Billed with null id', () => {
      const props = makeBilledProps({ id: null });

      const billed = Billed._instantiate(props);

      expect(billed.props.id).toBeNull();
    });

    it('should create a Billed with isJunction true', () => {
      const props = makeBilledProps({ isJunction: true });

      const billed = Billed._instantiate(props);

      expect(billed.props.isJunction).toBe(true);
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeBilledProps({
        id: 42,
        description: 'Custom description',
        isJunction: true,
        installmentDays: [10, 20],
        active: false,
      });

      const billed = Billed._instantiate(props);

      expect(billed.props).toEqual<BilledProps>({
        id: 42,
        description: 'Custom description',
        isJunction: true,
        installmentDays: [10, 20],
        active: false,
      });
    });

    it('should return a copy of installmentDays (immutability)', () => {
      const props = makeBilledProps({ installmentDays: [5, 15] });
      const billed = Billed._instantiate(props);

      const returnedDays = billed.props.installmentDays;
      returnedDays.push(25);

      expect(billed.props.installmentDays).toEqual([5, 15]);
    });
  });

  describe('isActive', () => {
    it('should return true when active is true', () => {
      const billed = Billed._instantiate(makeBilledProps({ active: true }));

      expect(billed.isActive()).toBe(true);
    });

    it('should return false when active is false', () => {
      const billed = Billed._instantiate(makeBilledProps({ active: false }));

      expect(billed.isActive()).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate the billed', () => {
      const billed = Billed._instantiate(makeBilledProps({ active: false }));

      billed.activate();

      expect(billed.isActive()).toBe(true);
    });

    it('should deactivate the billed', () => {
      const billed = Billed._instantiate(makeBilledProps({ active: true }));

      billed.deactivate();

      expect(billed.isActive()).toBe(false);
    });
  });
});
