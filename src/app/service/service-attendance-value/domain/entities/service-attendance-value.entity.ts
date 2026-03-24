export type ServiceAttendanceValueProps = ServiceAttendanceValueCreateProps & {
  id: number | null;
  totalValueInCents: number;
};

export type ServiceAttendanceValueCreateProps = {
  serviceId: number;
  values: Record<string, number>;
};

export class ServiceAttendanceValue {
  private readonly _props: ServiceAttendanceValueProps;

  static _instantiate(props: ServiceAttendanceValueProps): ServiceAttendanceValue {
    return new ServiceAttendanceValue(props);
  }

  private constructor(props: ServiceAttendanceValueProps) {
    this._props = props;
  }

  public get props(): Readonly<ServiceAttendanceValueProps> {
    return { ...this._props };
  }
}
