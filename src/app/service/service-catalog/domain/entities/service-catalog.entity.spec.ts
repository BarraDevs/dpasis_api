import { ServiceCatalog, ServiceCatalogProps } from './service-catalog.entity';

function makeServiceCatalogProps(overrides?: Partial<ServiceCatalogProps>): ServiceCatalogProps {
  return {
    id: 1,
    cnaeNbsIndopId: 10,
    serviceBilledId: 20,
    serviceCategoryId: 30,
    serviceDeliveryTermId: 40,
    serviceFreightId: 50,
    serviceProposalValidityId: 60,
    serviceWarrantyId: 70,
    name: 'Serviço catálogo',
    unitPriceInCents: 1000,
    description: 'Descrição',
    isCommercial: true,
    active: true,
    ...overrides,
  };
}

describe('ServiceCatalog Entity', () => {
  describe('_instantiate', () => {
    it('should create a ServiceCatalog instance with the provided props', () => {
      const props = makeServiceCatalogProps();

      const entity = ServiceCatalog._instantiate(props);

      expect(entity).toBeInstanceOf(ServiceCatalog);
    });

    it('should create with id null', () => {
      const props = makeServiceCatalogProps({ id: null });

      const entity = ServiceCatalog._instantiate(props);

      expect(entity.props.id).toBeNull();
    });
  });

  describe('props', () => {
    it('should return all props correctly', () => {
      const props = makeServiceCatalogProps({
        id: 42,
        name: 'Nome',
        unitPriceInCents: 500,
        active: false,
        isCommercial: false,
      });

      const entity = ServiceCatalog._instantiate(props);

      expect(entity.props).toEqual<ServiceCatalogProps>({
        id: 42,
        cnaeNbsIndopId: 10,
        serviceBilledId: 20,
        serviceCategoryId: 30,
        serviceDeliveryTermId: 40,
        serviceFreightId: 50,
        serviceProposalValidityId: 60,
        serviceWarrantyId: 70,
        name: 'Nome',
        unitPriceInCents: 500,
        description: 'Descrição',
        isCommercial: false,
        active: false,
      });
    });

    it('should return a shallow copy so mutating the returned object does not change subsequent reads', () => {
      const entity = ServiceCatalog._instantiate(makeServiceCatalogProps({ name: 'Original' }));

      const first = entity.props;
      (first as any).name = 'Alterado';

      expect(entity.props.name).toBe('Original');
    });
  });

  describe('isActive', () => {
    it('should return true when active is true', () => {
      const entity = ServiceCatalog._instantiate(makeServiceCatalogProps({ active: true }));

      expect(entity.isActive()).toBe(true);
    });

    it('should return false when active is false', () => {
      const entity = ServiceCatalog._instantiate(makeServiceCatalogProps({ active: false }));

      expect(entity.isActive()).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate the catalog item', () => {
      const entity = ServiceCatalog._instantiate(makeServiceCatalogProps({ active: false }));

      entity.activate();

      expect(entity.isActive()).toBe(true);
      expect(entity.props.active).toBe(true);
    });

    it('should deactivate the catalog item', () => {
      const entity = ServiceCatalog._instantiate(makeServiceCatalogProps({ active: true }));

      entity.deactivate();

      expect(entity.isActive()).toBe(false);
      expect(entity.props.active).toBe(false);
    });
  });
});
