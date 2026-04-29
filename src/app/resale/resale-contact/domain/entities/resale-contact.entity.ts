export type ResaleContactProps = ResaleContactCreateProps & {
  id: number | null;
  active: boolean;
};

export type ResaleContactCreateProps = {
  resaleId: number;
  departmentId: number;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  observations: string | null;
  receiveNF: boolean;
};

export class ResaleContact {
  private readonly _props: ResaleContactProps;

  static _instantiate(props: ResaleContactProps): ResaleContact {
    return new ResaleContact(props);
  }

  private constructor(props: ResaleContactProps) {
    this._props = props;
  }

  public get props(): Readonly<ResaleContactProps> {
    return { ...this._props };
  }

  public isActive(): boolean {
    return this._props.active ?? true;
  }

  public activate(): void {
    this._props.active = true;
  }

  public deactivate(): void {
    this._props.active = false;
  }
}
