import { Client } from './client.entity';

describe('ClientEntity', () => {
  describe('create', () => {
    it('should create a Client with correct properties', () => {
      // Arrange
      const props = {
        kind: 'Type A',
        cnpj: '12345678901234',
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
  });

  describe('load', () => {
    it('should load a Client with given properties', () => {
      // Arrange
      const props = {
        id: 'unique-client-id',
        resourceId: 'resource-id',
        kind: 'Type B',
        cnpj: '43210987654321',
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
  });
});
