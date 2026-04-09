import { AppException } from 'src/core/filters/app.exception';
import { ServiceCatalogCreateProps, ServiceCatalogProps } from '../entities/service-catalog.entity';
import { ServiceCatalogFactory } from './service-catalog.factory';

function makeCreateProps(overrides?: Partial<ServiceCatalogCreateProps>): ServiceCatalogCreateProps {
  return {
    cnaeNbsIndopId: 1,
    billedId: 2,
    categoryId: 3,
    deliveryTermId: 4,
    freightId: 5,
    proposalValidityId: 6,
    warrantyId: 7,
    companyIds: [1],
    name: 'Serviço catálogo',
    unitPriceInCents: 1000,
    description: 'Descrição do serviço',
    isCommercial: true,
    ...overrides,
  };
}

function makeProps(overrides?: Partial<ServiceCatalogProps>): ServiceCatalogProps {
  return {
    id: 1,
    ...makeCreateProps(),
    active: true,
    ...overrides,
  };
}

describe('ServiceCatalogFactory', () => {
  describe('create', () => {
    it('should create a ServiceCatalog with id null and active true', () => {
      const props = makeCreateProps();

      const entity = ServiceCatalogFactory.create(props);

      expect(entity).toBeDefined();
      expect(entity.props.id).toBeNull();
      expect(entity.props.active).toBe(true);
    });

    it('should persist validated fields', () => {
      const props = makeCreateProps({
        name: 'Nome',
        unitPriceInCents: 2500,
        description: 'Texto',
        isCommercial: false,
      });

      const entity = ServiceCatalogFactory.create(props);

      expect(entity.props.cnaeNbsIndopId).toBe(1);
      expect(entity.props.name).toBe('Nome');
      expect(entity.props.unitPriceInCents).toBe(2500);
      expect(entity.props.description).toBe('Texto');
      expect(entity.props.isCommercial).toBe(false);
    });

    it('should trim name and description', () => {
      const props = makeCreateProps({
        name: '  Nome com espaços  ',
        description: '  Descrição com espaços  ',
      });

      const entity = ServiceCatalogFactory.create(props);

      expect(entity.props.name).toBe('Nome com espaços');
      expect(entity.props.description).toBe('Descrição com espaços');
    });

    it('should allow unitPriceInCents zero', () => {
      const props = makeCreateProps({ unitPriceInCents: 0 });

      const entity = ServiceCatalogFactory.create(props);

      expect(entity.props.unitPriceInCents).toBe(0);
    });

    it('should throw when name is empty', () => {
      const props = makeCreateProps({ name: '' });

      expect(() => ServiceCatalogFactory.create(props)).toThrow(AppException);
    });

    it('should throw when description is empty', () => {
      const props = makeCreateProps({ description: '   ' });

      expect(() => ServiceCatalogFactory.create(props)).toThrow(AppException);
    });

    it('should throw when cnaeNbsIndopId is not positive', () => {
      const props = makeCreateProps({ cnaeNbsIndopId: 0 });

      expect(() => ServiceCatalogFactory.create(props)).toThrow(AppException);
    });

    it('should throw when unitPriceInCents is negative', () => {
      const props = makeCreateProps({ unitPriceInCents: -1 });

      expect(() => ServiceCatalogFactory.create(props)).toThrow(AppException);
    });

    it('should throw when isCommercial is not a boolean', () => {
      const props = { ...makeCreateProps(), isCommercial: 'true' as unknown as boolean };

      expect(() => ServiceCatalogFactory.create(props)).toThrow(AppException);
    });

    it('should throw when companyIds contains invalid id', () => {
      const props = makeCreateProps({ companyIds: [0] });

      expect(() => ServiceCatalogFactory.create(props)).toThrow(AppException);
    });

    it('should accept valid companyIds', () => {
      const props = makeCreateProps({ companyIds: [1, 2, 3] });

      const entity = ServiceCatalogFactory.create(props);

      expect(entity.props.companyIds).toEqual([1, 2, 3]);
    });
  });

  describe('load', () => {
    it('should load ServiceCatalog from props without re-validating strings and ints', () => {
      const props = makeProps();

      const entity = ServiceCatalogFactory.load(props);

      expect(entity).toBeDefined();
      expect(entity.props.id).toBe(1);
      expect(entity.props.name).toBe('Serviço catálogo');
    });

    it('should preserve id and active', () => {
      const props = makeProps({ id: 99, active: false });

      const entity = ServiceCatalogFactory.load(props);

      expect(entity.props.id).toBe(99);
      expect(entity.props.active).toBe(false);
    });
  });

  describe('edit', () => {
    it('should apply the same validation as create', () => {
      const props = makeProps({ name: 'Nome atualizado', description: 'Nova descrição' });

      const entity = ServiceCatalogFactory.edit(props);

      expect(entity.props.name).toBe('Nome atualizado');
      expect(entity.props.description).toBe('Nova descrição');
    });

    it('should preserve id and active', () => {
      const props = makeProps({ id: 42, active: false, name: 'Editado' });

      const entity = ServiceCatalogFactory.edit(props);

      expect(entity.props.id).toBe(42);
      expect(entity.props.active).toBe(false);
      expect(entity.props.name).toBe('Editado');
    });

    it('should throw when edit data is invalid', () => {
      const props = makeProps({ name: '' });

      expect(() => ServiceCatalogFactory.edit(props)).toThrow(AppException);
    });
  });
});
