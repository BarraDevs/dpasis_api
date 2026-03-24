import { BooleanVo } from 'src/shared/value-objects/boolean/boolean.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import {
  ServiceCatalog,
  ServiceCatalogCreateProps,
  ServiceCatalogProps,
} from '../entities/service-catalog.entity';

export class ServiceCatalogFactory {
  private static validateCreateProps(props: ServiceCatalogCreateProps): ServiceCatalogCreateProps {
    return {
      cnaeNbsIndopId: new PositiveInt(props.cnaeNbsIndopId, 'cnaeNbsIndopId').value,
      serviceBilledId: new PositiveInt(props.serviceBilledId, 'serviceBilledId').value,
      serviceCategoryId: new PositiveInt(props.serviceCategoryId, 'serviceCategoryId').value,
      serviceDeliveryTermId: new PositiveInt(props.serviceDeliveryTermId, 'serviceDeliveryTermId').value,
      serviceFreightId: new PositiveInt(props.serviceFreightId, 'serviceFreightId').value,
      serviceProposalValidityId: new PositiveInt(props.serviceProposalValidityId, 'serviceProposalValidityId').value,
      serviceWarrantyId: new PositiveInt(props.serviceWarrantyId, 'serviceWarrantyId').value,
      name: new NonEmptyString(props.name.trim(), 'name').value,
      unitPriceInCents: new PositiveInt(props.unitPriceInCents, 'unitPriceInCents', true).value,
      description: new NonEmptyString(props.description.trim(), 'description').value,
      isCommercial: new BooleanVo(props.isCommercial, 'isCommercial').value,
    };
  }

  static create(props: ServiceCatalogCreateProps): ServiceCatalog {
    const validatedProps = this.validateCreateProps(props);

    return ServiceCatalog._instantiate({
      ...validatedProps,
      id: null,
      active: true,
    });
  }

  static edit(props: ServiceCatalogProps): ServiceCatalog {
    const validatedProps = this.validateCreateProps(props);

    return ServiceCatalog._instantiate({
      ...validatedProps,
      id: props.id,
      active: props.active,
    });
  }

  static load(props: ServiceCatalogProps): ServiceCatalog {
    return ServiceCatalog._instantiate({
      id: props.id,
      cnaeNbsIndopId: props.cnaeNbsIndopId,
      serviceBilledId: props.serviceBilledId,
      serviceCategoryId: props.serviceCategoryId,
      serviceDeliveryTermId: props.serviceDeliveryTermId,
      serviceFreightId: props.serviceFreightId,
      serviceProposalValidityId: props.serviceProposalValidityId,
      serviceWarrantyId: props.serviceWarrantyId,
      name: props.name,
      unitPriceInCents: props.unitPriceInCents,
      description: props.description,
      isCommercial: props.isCommercial,
      active: props.active,
    });
  }
}
