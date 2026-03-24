export class ServiceCatalogDto {
  id: number;
  cnaeNbsIndopId: number;
  serviceBilledId: number;
  serviceCategoryId: number;
  serviceDeliveryTermId: number;
  serviceFreightId: number;
  serviceProposalValidityId: number;
  serviceWarrantyId: number;
  name: string;
  unitPriceInCents: number;
  description: string;
  isCommercial: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
