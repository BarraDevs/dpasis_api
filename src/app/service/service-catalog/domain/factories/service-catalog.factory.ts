import { BooleanVo } from 'src/shared/value-objects/boolean/boolean.vo';
import { NonEmptyString } from 'src/shared/value-objects/non-empty-string/non-empty-string.vo';
import { PositiveInt } from 'src/shared/value-objects/positive-int/positive-int.vo';
import {
  ServiceCatalog,
  ServiceCatalogCreateProps,
  ServiceCatalogProps,
} from '../entities/service-catalog.entity';

export class ServiceCatalogFactory {
  private static validateCompanyIds(companyIds: number[], fieldName: string): number[] {
    if (!Array.isArray(companyIds)) {
      throw new Error(`${fieldName} deve ser um array`);
    }
    return companyIds.map((id, index) => new PositiveInt(id, `${fieldName}[${index}]`).value);
  }

  private static validateCreateProps(props: ServiceCatalogCreateProps): ServiceCatalogCreateProps {
    return {
      cnaeNbsIndopId: new PositiveInt(props.cnaeNbsIndopId, 'cnaeNbsIndopId').value,
      billedId: new PositiveInt(props.billedId, 'billedId').value,
      categoryId: new PositiveInt(props.categoryId, 'categoryId').value,
      deliveryTermId: new PositiveInt(props.deliveryTermId, 'deliveryTermId').value,
      freightId: new PositiveInt(props.freightId, 'freightId').value,
      proposalValidityId: new PositiveInt(props.proposalValidityId, 'proposalValidityId').value,
      warrantyId: new PositiveInt(props.warrantyId, 'warrantyId').value,
      companyIds: this.validateCompanyIds(props.companyIds ?? [], 'companyIds'),
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
      billedId: props.billedId,
      categoryId: props.categoryId,
      deliveryTermId: props.deliveryTermId,
      freightId: props.freightId,
      proposalValidityId: props.proposalValidityId,
      warrantyId: props.warrantyId,
      companyIds: props.companyIds ?? [],
      name: props.name,
      unitPriceInCents: props.unitPriceInCents,
      description: props.description,
      isCommercial: props.isCommercial,
      active: props.active,
    });
  }
}
