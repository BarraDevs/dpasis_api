import { AppException } from 'src/core/filters/app.exception';
import { Commission } from 'src/shared/value-objects/commission/commision.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';

export type ServiceProps = ServiceCreateProps & {
  id: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceCreateProps = {
  name: string;
  nickname: string | null;
  companyId: string;
  categoryId: string;
  productIds: string[];
  deadline: string | null;
  shippingValueInCents: number | null;
  warrant: string | null;
  weight: string | null;
  maxVolume: string | null;
  dimensions: string | null;
  commission: number;
  valueInCents: number;
  description: string | null;
}

export class Service {
  private static readonly REQUIRED_PRODUCT_IDS = 2;
  private readonly _props: ServiceProps;

  static create(props: ServiceCreateProps): Service {
    return new Service({
      ...props,
      id: new UUID().value,
      active: true,
      createdAt: UTCDate.create().value,
      updatedAt: UTCDate.create().value,
    });
  }

  static load(props: ServiceProps): Service {
    return new Service(props);
  }

  public get props(): Readonly<ServiceProps> {
    return {
      ...this._props,
      productIds: [...this._props.productIds],
    };
  }

  constructor(props: ServiceProps) {
    if (props.productIds.length !== Service.REQUIRED_PRODUCT_IDS) {
      throw new AppException(`O serviço deve possuir ${Service.REQUIRED_PRODUCT_IDS} produtos vinculados`, 400);
    }

    this._props = {
      id: props.id,
      active: props.active,
      createdAt: UTCDate.from(props.createdAt).value,
      updatedAt: UTCDate.from(props.updatedAt).value,
      name: props.name,
      nickname: props.nickname,
      companyId: props.companyId,
      categoryId: props.categoryId,
      productIds: props.productIds ? [...props.productIds] : [],
      deadline: props.deadline,
      shippingValueInCents: props.shippingValueInCents === null ? null : new PositiveInt(props.shippingValueInCents, 'Frete', true).value,
      warrant: props.warrant,
      weight: props.weight,
      maxVolume: props.maxVolume,
      dimensions: props.dimensions,
      commission: new Commission(props.commission).value,
      valueInCents: new PositiveInt(props.valueInCents, 'Valor', true).value,
      description: props.description,
    };
  }

  public toggleStatus(): void {
    this._props.active = !this._props.active;
    this._props.updatedAt = UTCDate.create().value;
  }
}
