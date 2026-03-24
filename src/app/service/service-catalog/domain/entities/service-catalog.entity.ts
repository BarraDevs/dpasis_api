export type ServiceCatalogProps = ServiceCatalogCreateProps & {
  id: number | null;
  active: boolean;
};

export type ServiceCatalogCreateProps = {
  cnaeNbsIndopId: number;
  serviceBilledId: number;
  serviceCategoryId: number;
  serviceDeliveryTermId: number;
  serviceFreightId: number;
  serviceProposalValidityId: number;
  serviceWarrantyId: number;
  companyIds: number[];
  name: string;
  unitPriceInCents: number;
  description: string;
  isCommercial: boolean;
};

export class ServiceCatalog {
  private readonly _props: ServiceCatalogProps;

  static _instantiate(props: ServiceCatalogProps): ServiceCatalog {
    return new ServiceCatalog(props);
  }

  private constructor(props: ServiceCatalogProps) {
    this._props = props;
  }

  public get props(): Readonly<ServiceCatalogProps> {
    return { ...this._props };
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
