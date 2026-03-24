import {
  ServiceAttendanceValue,
  ServiceAttendanceValueProps,
} from './service-attendance-value.entity';

function makeServiceAttendanceValueProps(
  overrides?: Partial<ServiceAttendanceValueProps>,
): ServiceAttendanceValueProps {
  return {
    id: 1,
    serviceId: 10,
    values: { day: 100, night: 200 },
    totalValueInCents: 300,
    ...overrides,
  };
}

describe('ServiceAttendanceValue Entity', () => {
  describe('_instantiate', () => {
    it('should create a ServiceAttendanceValue instance with the provided props', () => {
      const props = makeServiceAttendanceValueProps();

      const entity = ServiceAttendanceValue._instantiate(props);

      expect(entity).toBeInstanceOf(ServiceAttendanceValue);
    });

    it('should create with id null', () => {
      const props = makeServiceAttendanceValueProps({ id: null });

      const entity = ServiceAttendanceValue._instantiate(props);

      expect(entity.props.id).toBeNull();
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeServiceAttendanceValueProps({
        id: 42,
        serviceId: 99,
        values: { morning: 50, afternoon: 75 },
        totalValueInCents: 125,
      });

      const entity = ServiceAttendanceValue._instantiate(props);

      expect(entity.props).toEqual<ServiceAttendanceValueProps>({
        id: 42,
        serviceId: 99,
        values: { morning: 50, afternoon: 75 },
        totalValueInCents: 125,
      });
    });

    it('should return a shallow copy so mutating the returned object does not change subsequent reads', () => {
      const entity = ServiceAttendanceValue._instantiate(
        makeServiceAttendanceValueProps({ serviceId: 1, totalValueInCents: 100 }),
      );

      const first = entity.props;
      (first as any).serviceId = 999;
      (first as any).totalValueInCents = 888;

      expect(entity.props.serviceId).toBe(1);
      expect(entity.props.totalValueInCents).toBe(100);
    });
  });
});
