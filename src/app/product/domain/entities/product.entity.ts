import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
import { UUID } from 'src/shared/value-objects/uuid/uuid.vo';
import { InvalidMaximumStockError } from '../errors/invalid-maximum-stock.error';
import { InvalidMinimumStockError } from '../errors/invalid-minimum-stock.error';
import { InvalidStockRangeError } from '../errors/invalid-stock-range.error';

export type ProductProps = ProductCreateProps & {
  id: string;
  currentStock: number; // Gerenciado via StockMovements (DDD)
  createdAt: Date;
  updatedAt: Date;
};

export type ProductCreateProps = {
  companyId: string;
  type: string;
  group01: string;
  group02: string;
  description: string;
  complement?: string | null;
  manufacturerCode: string;
  brand: string;
  measureUnit: string;
  ncm: string;
  economicBatch: string;
  minimumStock: number;
  maximumStock: number;
  warrantyDays: number;
  weightInKg: number;
  heightInCm: number;
  lengthInCm: number;
  widthInCm: number;
  markup: number;
  marginB: number;
  currency: string;
  exchangeRate: number;
  unitCostInCents: number;
  unitPriceInCents: number;
  ean: string;
  additionalInfo?: string | null;
  images: string[];
  supplierIds: string[];
};

export class Product {
  private readonly _props: ProductProps;

  static create(props: ProductCreateProps): Product {
    return new Product({
      ...props,
      id: new UUID().value,
      currentStock: 0,
      createdAt: UTCDate.create().value,
      updatedAt: UTCDate.create().value,
    });
  }

  static load(props: ProductProps): Product {
    return new Product(props);
  }

  public get props(): Readonly<ProductProps> {
    return {
      ...this._props,
      images: [...this._props.images],
      supplierIds: [...this._props.supplierIds],
    };
  }

  constructor(props: ProductProps) {
    if (props.minimumStock < 0) {
      throw new InvalidMinimumStockError();
    }
    if (props.maximumStock < 0) {
      throw new InvalidMaximumStockError();
    }
    if (props.minimumStock > props.maximumStock) {
      throw new InvalidStockRangeError();
    }

    this._props = {
      id: props.id,
      currentStock: props.currentStock,
      createdAt: UTCDate.from(props.createdAt).value,
      updatedAt: UTCDate.from(props.updatedAt).value,
      companyId: props.companyId,
      type: props.type,
      group01: props.group01,
      group02: props.group02,
      description: props.description,
      complement: props.complement ?? null,
      manufacturerCode: props.manufacturerCode,
      brand: props.brand,
      measureUnit: props.measureUnit,
      ncm: props.ncm,
      economicBatch: props.economicBatch,
      minimumStock: props.minimumStock,
      maximumStock: props.maximumStock,
      warrantyDays: props.warrantyDays,
      weightInKg: props.weightInKg,
      heightInCm: props.heightInCm,
      lengthInCm: props.lengthInCm,
      widthInCm: props.widthInCm,
      markup: props.markup,
      marginB: props.marginB,
      currency: props.currency,
      exchangeRate: props.exchangeRate,
      unitCostInCents: props.unitCostInCents,
      unitPriceInCents: props.unitPriceInCents,
      ean: props.ean,
      additionalInfo: props.additionalInfo ?? null,
      images: props.images ? [...props.images] : [],
      supplierIds: props.supplierIds ? [...props.supplierIds] : [],
    };
  }

  public hasStock(): boolean {
    return this._props.currentStock > 0;
  }

  public updateStock(newStock: number): void {
    this._props.currentStock = this.props.currentStock + newStock;
    this._props.updatedAt = UTCDate.create().value;
  }
}
