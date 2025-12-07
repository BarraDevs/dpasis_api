import { InvalidCnpjError } from 'src/shared/value-objects/cnpj/cnpj.error';
import { Client } from './client.entity';

describe('ClientEntity', () => {
  describe('create', () => {
    it('should create a Client with correct properties', () => {
      // Arrange
      const props = {
        kind: 'Type A',
        cnpj: '65357259000130',
        ie: '987654321',
        group: 'Group A',
        type: 'Type 1',
        generateInvoice: true,
        companyName: 'Company A',
        fantasyName: 'Fantasy A',
        owner: 'Owner A',
        headquarters: 'Headquarters A',
        companyIds: [
          'company-id-1',
          'company-id-2',
        ],
      };

      // Act
      const client = Client.create(props);

      // Assert
      expect(client.props).toMatchObject({
        ...props,
        id: expect.any(String),
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw an error for invalid CNPJ', () => {
      // Arrange
      const props = {
        kind: 'Type A',
        cnpj: 'invalid-cnpj',
        ie: '987654321',
        group: 'Group A',
        type: 'Type 1',
        generateInvoice: true,
        companyName: 'Company A',
        fantasyName: 'Fantasy A',
        owner: 'Owner A',
        headquarters: 'Headquarters A',
        companyIds: [
          'company-id-1',
          'company-id-2',
        ],
      };

      // Act & Assert
      expect(() => Client.create(props)).toThrow(InvalidCnpjError);
    });
  });

  describe('load', () => {
    it('should load a Client with given properties', () => {
      // Arrange
      const props = {
        id: 'unique-client-id',
        kind: 'Type B',
        cnpj: '94456938000164',
        ie: '123456789',
        group: 'Group B',
        type: 'Type 2',
        generateInvoice: false,
        companyName: 'Company B',
        fantasyName: 'Fantasy B',
        owner: 'Owner B',
        headquarters: 'Headquarters B',
        active: false,
        companyIds: [
          'company-id-3',
          'company-id-4',
        ],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
      };

      // Act
      const client = Client.load(props);

      // Assert
      expect(client.props).toEqual(props);
    });

    it('should throw an error for invalid CNPJ when loading', () => {
      // Arrange
      const props = {
        id: 'unique-client-id',
        resourceId: 'resource-id',
        kind: 'Type B',
        cnpj: 'invalid-cnpj',
        ie: '123456789',
        group: 'Group B',
        type: 'Type 2',
        generateInvoice: false,
        companyName: 'Company B',
        fantasyName: 'Fantasy B',
        owner: 'Owner B',
        headquarters: 'Headquarters B',
        active: false,
        companyIds: [
          'company-id-3',
          'company-id-4',
        ],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
      };

      // Act & Assert
      expect(() => Client.load(props)).toThrow(InvalidCnpjError);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle the client status', () => {
      // Arrange
      const props = {
        id: 'unique-client-id',
        resourceId: 'resource-id',
        kind: 'Type C',
        cnpj: '94456938000164',
        ie: '876543210',
        group: 'Group C',
        type: 'Type 3',
        generateInvoice: true,
        companyName: 'Company C',
        fantasyName: 'Fantasy C',
        owner: 'Owner C',
        headquarters: 'Headquarters C',
        active: false,
        companyIds: [
          'company-id-5',
          'company-id-6',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const client = Client.load(props);

      // Act & Assert
      expect(client.props.active).toBe(false);

      client.toggleStatus();
      expect(client.props.active).toBe(true);

      client.toggleStatus();
      expect(client.props.active).toBe(false);
    });
  });

  describe('invariant protection', () => {
    it('should ensure _props contains only valid entity properties without additional data', () => {
      // Arrange
      const validProps = {
        kind: 'Type A',
        cnpj: '65357259000130',
        ie: '987654321',
        group: 'Group A',
        type: 'Type 1',
        generateInvoice: true,
        companyName: 'Company A',
        fantasyName: 'Fantasy A',
        owner: 'Owner A',
        headquarters: 'Headquarters A',
        companyIds: ['company-id-1'],
      };

      // Act
      const client = Client.create(validProps);

      // Assert - Verify _props has exactly the expected keys
      const expectedKeys = [
        'id',
        'kind',
        'cnpj',
        'ie',
        'group',
        'type',
        'generateInvoice',
        'companyName',
        'fantasyName',
        'owner',
        'headquarters',
        'companyIds',
        'active',
        'createdAt',
        'updatedAt',
      ].sort();

      const actualKeys = Object.keys(client.props).sort();

      expect(actualKeys).toEqual(expectedKeys);
      expect(actualKeys.length).toBe(expectedKeys.length);
    });

    it('should not allow additional properties to leak into _props when using create', () => {
      // Arrange
      const propsWithExtra = {
        kind: 'Type A',
        cnpj: '65357259000130',
        ie: '987654321',
        group: 'Group A',
        type: 'Type 1',
        generateInvoice: true,
        companyName: 'Company A',
        fantasyName: 'Fantasy A',
        owner: 'Owner A',
        headquarters: 'Headquarters A',
        companyIds: ['company-id-1'],
        extraProperty: 'should not exist',
        anotherExtra: 123,
      } as any;

      // Act
      const client = Client.create(propsWithExtra);

      // Assert
      expect(client.props).not.toHaveProperty('extraProperty');
      expect(client.props).not.toHaveProperty('anotherExtra');
    });

    it('should not allow additional properties to leak into _props when using load', () => {
      // Arrange
      const propsWithExtra = {
        id: 'unique-client-id',
        kind: 'Type B',
        cnpj: '94456938000164',
        ie: '123456789',
        group: 'Group B',
        type: 'Type 2',
        generateInvoice: false,
        companyName: 'Company B',
        fantasyName: 'Fantasy B',
        owner: 'Owner B',
        headquarters: 'Headquarters B',
        active: false,
        companyIds: ['company-id-3'],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
        maliciousProperty: 'compromising invariant',
        anotherExtra: 123,
      } as any;

      // Act
      const client = Client.load(propsWithExtra);

      // Assert
      expect(client.props).not.toHaveProperty('maliciousProperty');
      expect(client.props).not.toHaveProperty('anotherExtra');
    });

    it('should maintain exact property count after operations', () => {
      // Arrange
      const props = {
        kind: 'Type A',
        cnpj: '65357259000130',
        ie: '987654321',
        group: 'Group A',
        type: 'Type 1',
        generateInvoice: true,
        companyName: 'Company A',
        fantasyName: 'Fantasy A',
        owner: 'Owner A',
        headquarters: 'Headquarters A',
        companyIds: ['company-id-1'],
      };

      const client = Client.create(props);
      const initialKeyCount = Object.keys(client.props).length;

      // Act
      client.toggleStatus();
      client.toggleStatus();

      // Assert
      const finalKeyCount = Object.keys(client.props).length;
      expect(finalKeyCount).toBe(initialKeyCount);
      expect(finalKeyCount).toBe(15); // Exact number of expected properties
    });
  });
});
