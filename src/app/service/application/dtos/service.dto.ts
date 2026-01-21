export class ServiceDto {
  id: string;
  name: string;
  nickname: string | null;
  companyId: string;
  deadline: string | null;
  shippingValueInCents: number | null;
  warrant: string | null;
  weight: string | null;
  maxVolume: string | null;
  dimensions: string | null;
  commission: number;
  valueInCents: number;
  active: boolean;
  description: string | null;
  category: ServiceCategoryDto;
  products: ServiceProductDto[];
  createdAt: Date;
  updatedAt: Date;
}

class ServiceCategoryDto {
  id: string;
  name: string;
}

class ServiceProductDto {
  id: string;
  description: string;
}
