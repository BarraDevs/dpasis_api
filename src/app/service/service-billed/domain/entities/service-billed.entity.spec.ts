import { ServiceBilled, ServiceBilledProps } from './service-billed.entity';

function makeServiceBilledProps(overrides?: Partial<ServiceBilledProps>): ServiceBilledProps {
  return {
    id: 1,
    description: 'Descrição do serviço faturado',
    isJunction: false,
    installmentDays: [5, 15, 25],
    active: true,
    ...overrides,
  };
}

describe('ServiceBilled Entity', () => {
  describe('_instantiate', () => {
    it('should create a ServiceBilled instance with the provided props', () => {
      const props = makeServiceBilledProps();

      const serviceBilled = ServiceBilled._instantiate(props);

      expect(serviceBilled).toBeInstanceOf(ServiceBilled);
    });

    it('should create a ServiceBilled with null id', () => {
      const props = makeServiceBilledProps({ id: null });

      const serviceBilled = ServiceBilled._instantiate(props);

      expect(serviceBilled.props.id).toBeNull();
    });

    it('should create a ServiceBilled with isJunction true', () => {
      const props = makeServiceBilledProps({ isJunction: true });

      const serviceBilled = ServiceBilled._instantiate(props);

      expect(serviceBilled.props.isJunction).toBe(true);
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeServiceBilledProps({
        id: 42,
        description: 'Custom description',
        isJunction: true,
        installmentDays: [10, 20],
        active: false,
      });

      const serviceBilled = ServiceBilled._instantiate(props);

      expect(serviceBilled.props).toEqual<ServiceBilledProps>({
        id: 42,
        description: 'Custom description',
        isJunction: true,
        installmentDays: [10, 20],
        active: false,
      });
    });

    it('should return a copy of installmentDays (immutability)', () => {
      const props = makeServiceBilledProps({ installmentDays: [5, 15] });
      const serviceBilled = ServiceBilled._instantiate(props);

      const returnedDays = serviceBilled.props.installmentDays;
      returnedDays.push(25);

      expect(serviceBilled.props.installmentDays).toEqual([5, 15]);
    });
  });

  describe('isActive', () => {
    it('should return true when active is true', () => {
      const serviceBilled = ServiceBilled._instantiate(makeServiceBilledProps({ active: true }));

      expect(serviceBilled.isActive()).toBe(true);
    });

    it('should return false when active is false', () => {
      const serviceBilled = ServiceBilled._instantiate(makeServiceBilledProps({ active: false }));

      expect(serviceBilled.isActive()).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate the billed service', () => {
      const serviceBilled = ServiceBilled._instantiate(makeServiceBilledProps({ active: false }));

      serviceBilled.activate();

      expect(serviceBilled.isActive()).toBe(true);
    });

    it('should deactivate the billed service', () => {
      const serviceBilled = ServiceBilled._instantiate(makeServiceBilledProps({ active: true }));

      serviceBilled.deactivate();

      expect(serviceBilled.isActive()).toBe(false);
    });
  });
});
