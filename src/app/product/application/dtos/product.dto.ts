export class ProductDto {
  id: string;
  companyId: string;
  type: string;
  group01: string;
  group02: string;
  description: string;
  complement: string | null;
  manufacturerCode: string;
  brand: string;
  measureUnit: string;
  ncm: string;
  economicBatch: string;
  minimumStock: number;
  maximumStock: number;
  currentStock: number;
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
  additionalInfo: string | null;
  images: string[];
  suppliers: ProductSupplierDto[];
  createdAt: Date;
  updatedAt: Date;
}

class ProductSupplierDto {
  id: string;
  companyName: string;
  fantasyName: string;
}
