export type BilledProps = BilledCreateProps & {
  id: number | null;
  active: boolean;
};

export type BilledCreateProps = {
  description: string;
  isJunction: boolean;
  installmentDays: number[];
};

export class Billed {
  private readonly _props: BilledProps;

  static _instantiate(props: BilledProps): Billed {
    return new Billed(props);
  }

  private constructor(props: BilledProps) {
    this._props = {
      id: props.id,
      description: props.description,
      isJunction: props.isJunction,
      installmentDays: [...props.installmentDays],
      active: props.active,
    };
  }

  public get props(): Readonly<BilledProps> {
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
