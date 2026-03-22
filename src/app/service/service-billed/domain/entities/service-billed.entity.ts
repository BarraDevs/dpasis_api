export type ServiceBilledProps = ServiceBilledCreateProps & {
  id: number | null;
  active: boolean;
};

export type ServiceBilledCreateProps = {
  description: string;
  isJunction: boolean;
  installmentDays: number[];
};

export class ServiceBilled {
  private readonly _props: ServiceBilledProps;

  static _instantiate(props: ServiceBilledProps): ServiceBilled {
    return new ServiceBilled(props);
  }

  private constructor(props: ServiceBilledProps) {
    this._props = {
      id: props.id,
      description: props.description,
      isJunction: props.isJunction,
      installmentDays: [...props.installmentDays],
      active: props.active,
    };
  }

  public get props(): Readonly<ServiceBilledProps> {
    return {
      ...this._props,
      installmentDays: [...this._props.installmentDays],
    };
  }

  public isActive(): boolean {
    return this._props.active;
  }

  public activate(): void {
    this._props.active = true;
  }

  public deactivate(): void {
    this._props.active = false;
  }
}
