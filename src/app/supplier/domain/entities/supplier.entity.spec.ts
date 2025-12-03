import { InvalidCnpjError } from 'src/shared/value-objects/cnpj/cnpj.error';
import { Supplier } from './supplier.entity';

describe('Supplier Entity', () => {
  const validProps = {
    cnpj: '55.967.002/0001-46',
    ie: '123.456.789.012',
    group: 'Group A',
    type: 'Premium',
    companyName: 'Tech Supplier Ltda',
    fantasyName: 'Tech Supplier',
    representative: 'John Doe',
    companyIds: ['comp-123', 'comp-456'],
  };

  describe('create', () => {
    it('should create a new supplier with active=true and timestamps', () => {
      // Act
      const supplier = Supplier.create(validProps);

      // Assert
      expect(supplier).toBeInstanceOf(Supplier);
      expect(supplier.props.id).toBeDefined();
      expect(supplier.props.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(supplier.props.cnpj).toBe('55967002000146'); // Sanitized
      expect(supplier.props.ie).toBe(validProps.ie);
      expect(supplier.props.group).toBe(validProps.group);
      expect(supplier.props.type).toBe(validProps.type);
      expect(supplier.props.companyName).toBe(validProps.companyName);
      expect(supplier.props.fantasyName).toBe(validProps.fantasyName);
      expect(supplier.props.representative).toBe(validProps.representative);
      expect(supplier.props.active).toBe(true);
      expect(supplier.props.createdAt).toBeInstanceOf(Date);
      expect(supplier.props.updatedAt).toBeInstanceOf(Date);
      expect(supplier.props.companyIds).toEqual(validProps.companyIds);
    });

    it('should sanitize cnpj removing special characters', () => {
      // Arrange
      const props = {
        ...validProps,
        cnpj: '55.967.002/0001-46',
      };

      // Act
      const supplier = Supplier.create(props);

      // Assert
      expect(supplier.props.cnpj).toBe('55967002000146');
    });

    it('should throw InvalidCnpjError for invalid cnpj', () => {
      // Arrange
      const props = {
        ...validProps,
        cnpj: '00.000.000/0000-00', // Invalid CNPJ
      };

      // Act & Assert
      expect(() => Supplier.create(props)).toThrow(InvalidCnpjError);
    });

    it('should generate different UUIDs for different instances', () => {
      // Act
      const supplier1 = Supplier.create(validProps);
      const supplier2 = Supplier.create(validProps);

      // Assert
      expect(supplier1.props.id).not.toBe(supplier2.props.id);
    });

    it('should set createdAt and updatedAt to current time', () => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const supplier = Supplier.create(validProps);

      // Assert
      const afterCreate = new Date();
      expect(supplier.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(supplier.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(supplier.props.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(supplier.props.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create supplier with all required properties', () => {
      // Act
      const supplier = Supplier.create(validProps);

      // Assert
      expect(supplier.props.cnpj).toBeDefined();
      expect(supplier.props.ie).toBeDefined();
      expect(supplier.props.group).toBeDefined();
      expect(supplier.props.type).toBeDefined();
      expect(supplier.props.companyName).toBeDefined();
      expect(supplier.props.fantasyName).toBeDefined();
      expect(supplier.props.representative).toBeDefined();
    });

    it('should validate cnpj with valid format', () => {
      // Arrange
      const props = {
        ...validProps,
        cnpj: '00365466000190',
      };

      // Act
      const supplier = Supplier.create(props);

      // Assert
      expect(supplier.props.cnpj).toBe('00365466000190');
    });

    it('should create multiple suppliers with same data but different IDs', () => {
      // Act
      const supplier1 = Supplier.create(validProps);
      const supplier2 = Supplier.create(validProps);
      const supplier3 = Supplier.create(validProps);

      // Assert
      expect(supplier1.props.id).not.toBe(supplier2.props.id);
      expect(supplier1.props.id).not.toBe(supplier3.props.id);
      expect(supplier2.props.id).not.toBe(supplier3.props.id);
      expect(supplier1.props.cnpj).toBe(supplier2.props.cnpj);
      expect(supplier1.props.cnpj).toBe(supplier3.props.cnpj);
    });
  });

  describe('load', () => {
    it('should load an existing supplier with all properties', () => {
      // Arrange
      const existingProps = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        cnpj: '55967002000146', // Already sanitized
        ie: '987.654.321.098',
        group: 'Group B',
        type: 'Standard',
        companyName: 'Existing Supplier Ltda',
        fantasyName: 'Existing Supplier',
        representative: 'Jane Smith',
        active: true,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-20T14:45:00Z'),
        companyIds: ['comp-123', 'comp-456'],
      };

      // Act
      const supplier = Supplier.load(existingProps);

      // Assert
      expect(supplier).toBeInstanceOf(Supplier);
      expect(supplier.props.id).toBe(existingProps.id);
      expect(supplier.props.cnpj).toBe(existingProps.cnpj);
      expect(supplier.props.ie).toBe(existingProps.ie);
      expect(supplier.props.group).toBe(existingProps.group);
      expect(supplier.props.type).toBe(existingProps.type);
      expect(supplier.props.companyName).toBe(existingProps.companyName);
      expect(supplier.props.fantasyName).toBe(existingProps.fantasyName);
      expect(supplier.props.representative).toBe(existingProps.representative);
      expect(supplier.props.active).toBe(existingProps.active);
      expect(supplier.props.createdAt).toBe(existingProps.createdAt);
      expect(supplier.props.updatedAt).toBe(existingProps.updatedAt);
      expect(supplier.props.companyIds).toEqual(existingProps.companyIds);
    });

    it('should load supplier with active=false', () => {
      // Arrange
      const existingProps = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        cnpj: '00365466000190',
        ie: '111222333444',
        group: 'Group C',
        type: 'VIP',
        companyName: 'Inactive Supplier',
        fantasyName: 'Inactive',
        representative: 'Bob Johnson',
        active: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-10T00:00:00Z'),
        companyIds: [],
      };

      // Act
      const supplier = Supplier.load(existingProps);

      // Assert
      expect(supplier.props.active).toBe(false);
    });

    it('should sanitize cnpj if loaded with formatting', () => {
      // Arrange
      const existingProps = {
        id: '323e4567-e89b-12d3-a456-426614174002',
        cnpj: '55.967.002/0001-46', // With formatting
        ie: '222333444555',
        group: 'Group D',
        type: 'Basic',
        companyName: 'Formatted Supplier',
        fantasyName: 'Formatted',
        representative: 'Alice Brown',
        active: true,
        createdAt: new Date('2024-02-01T00:00:00Z'),
        updatedAt: new Date('2024-02-01T00:00:00Z'),
        companyIds: [],
      };

      // Act
      const supplier = Supplier.load(existingProps);

      // Assert
      expect(supplier.props.cnpj).toBe('55967002000146');
    });

    it('should throw InvalidCnpjError when loading with invalid cnpj', () => {
      // Arrange
      const existingProps = {
        id: '423e4567-e89b-12d3-a456-426614174003',
        cnpj: '00.000.000/0000-00', // Invalid CNPJ
        ie: '333444555666',
        group: 'Group E',
        type: 'Enterprise',
        companyName: 'Invalid CNPJ Supplier',
        fantasyName: 'Invalid CNPJ',
        representative: 'Charlie Wilson',
        active: true,
        createdAt: new Date('2024-03-01T00:00:00Z'),
        updatedAt: new Date('2024-03-01T00:00:00Z'),
        companyIds: [],
      };

      // Act & Assert
      expect(() => Supplier.load(existingProps)).toThrow(InvalidCnpjError);
    });

    it('should preserve original timestamps when loading', () => {
      // Arrange
      const createdAt = new Date('2024-01-01T12:00:00Z');
      const updatedAt = new Date('2024-06-15T18:30:00Z');
      const existingProps = {
        id: '523e4567-e89b-12d3-a456-426614174004',
        cnpj: '00365466000190',
        ie: '444555666777',
        group: 'Group F',
        type: 'Gold',
        companyName: 'Timestamp Supplier',
        fantasyName: 'Timestamp',
        representative: 'David Martinez',
        active: true,
        createdAt,
        updatedAt,
        companyIds: [],
      };

      // Act
      const supplier = Supplier.load(existingProps);

      // Assert
      expect(supplier.props.createdAt).toBe(createdAt);
      expect(supplier.props.updatedAt).toBe(updatedAt);
      expect(supplier.props.createdAt.getTime()).toBe(createdAt.getTime());
      expect(supplier.props.updatedAt.getTime()).toBe(updatedAt.getTime());
    });

    it('should load supplier with different groups and types', () => {
      // Arrange
      const props1 = {
        id: '623e4567-e89b-12d3-a456-426614174005',
        cnpj: '00365466000190',
        ie: '555666777888',
        group: 'International',
        type: 'Platinum',
        companyName: 'International Supplier',
        fantasyName: 'International',
        representative: 'Emma Davis',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyIds: [],
      };

      const props2 = {
        id: '723e4567-e89b-12d3-a456-426614174006',
        cnpj: '55967002000146',
        ie: '666777888999',
        group: 'National',
        type: 'Silver',
        companyName: 'National Supplier',
        fantasyName: 'National',
        representative: 'Frank Garcia',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyIds: [],
      };

      // Act
      const supplier1 = Supplier.load(props1);
      const supplier2 = Supplier.load(props2);

      // Assert
      expect(supplier1.props.group).toBe('International');
      expect(supplier1.props.type).toBe('Platinum');
      expect(supplier2.props.group).toBe('National');
      expect(supplier2.props.type).toBe('Silver');
    });
  });

  describe('toggleStatus', () => {
    it('should toggle supplier status from active to inactive', () => {
      // Arrange
      const props = {
        id: 'toggle-test-id-1',
        cnpj: '00365466000190',
        ie: '777888999000',
        group: 'Toggle Group A',
        type: 'Toggle Type A',
        companyName: 'Toggle Test Supplier',
        fantasyName: 'Toggle Test',
        representative: 'Toggle Rep',
        active: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        companyIds: [],
      };

      const supplier = Supplier.load(props);

      // Act
      supplier.toggleStatus();

      // Assert
      expect(supplier.props.active).toBe(false);
    });

    it('should toggle supplier status from inactive to active', () => {
      // Arrange
      const props = {
        id: 'toggle-test-id-2',
        cnpj: '55967002000146',
        ie: '888999000111',
        group: 'Toggle Group B',
        type: 'Toggle Type B',
        companyName: 'Inactive Supplier',
        fantasyName: 'Inactive',
        representative: 'Inactive Rep',
        active: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        companyIds: [],
      };

      const supplier = Supplier.load(props);

      // Act
      supplier.toggleStatus();

      // Assert
      expect(supplier.props.active).toBe(true);
    });

    it('should toggle status multiple times', () => {
      // Arrange
      const supplier = Supplier.create(validProps);

      // Act & Assert
      expect(supplier.props.active).toBe(true);

      supplier.toggleStatus();
      expect(supplier.props.active).toBe(false);

      supplier.toggleStatus();
      expect(supplier.props.active).toBe(true);

      supplier.toggleStatus();
      expect(supplier.props.active).toBe(false);

      supplier.toggleStatus();
      expect(supplier.props.active).toBe(true);
    });

    it('should not modify other properties when toggling status', () => {
      // Arrange
      const props = {
        id: 'preserve-test-id',
        cnpj: '00365466000190',
        ie: '999000111222',
        group: 'Preserve Group',
        type: 'Preserve Type',
        companyName: 'Preserve Test Supplier',
        fantasyName: 'Preserve Test',
        representative: 'Preserve Rep',
        active: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        companyIds: [],
      };

      const supplier = Supplier.load(props);
      const originalId = supplier.props.id;
      const originalCnpj = supplier.props.cnpj;
      const originalIe = supplier.props.ie;
      const originalGroup = supplier.props.group;
      const originalType = supplier.props.type;
      const originalCompanyName = supplier.props.companyName;
      const originalFantasyName = supplier.props.fantasyName;
      const originalRepresentative = supplier.props.representative;

      // Act
      supplier.toggleStatus();

      // Assert
      expect(supplier.props.id).toBe(originalId);
      expect(supplier.props.cnpj).toBe(originalCnpj);
      expect(supplier.props.ie).toBe(originalIe);
      expect(supplier.props.group).toBe(originalGroup);
      expect(supplier.props.type).toBe(originalType);
      expect(supplier.props.companyName).toBe(originalCompanyName);
      expect(supplier.props.fantasyName).toBe(originalFantasyName);
      expect(supplier.props.representative).toBe(originalRepresentative);
    });
  });

  describe('props getter', () => {
    it('should return a copy of props (immutability)', () => {
      // Arrange
      const supplier = Supplier.create(validProps);

      // Act
      const props1 = supplier.props;
      const props2 = supplier.props;

      // Assert
      expect(props1).toEqual(props2);
      expect(props1).not.toBe(props2); // Different object references
    });

    it('should not allow external mutation of props', () => {
      // Arrange
      const supplier = Supplier.create(validProps);
      const originalCompanyName = supplier.props.companyName;

      // Act
      const props = supplier.props;
      (props as any).companyName = 'Modified Company Name';

      // Assert
      expect(supplier.props.companyName).toBe(originalCompanyName);
      expect(supplier.props.companyName).not.toBe('Modified Company Name');
    });

    it('should return all properties correctly', () => {
      // Arrange
      const supplier = Supplier.create(validProps);

      // Act
      const props = supplier.props;

      // Assert
      expect(props).toHaveProperty('id');
      expect(props).toHaveProperty('cnpj');
      expect(props).toHaveProperty('ie');
      expect(props).toHaveProperty('group');
      expect(props).toHaveProperty('type');
      expect(props).toHaveProperty('companyName');
      expect(props).toHaveProperty('fantasyName');
      expect(props).toHaveProperty('representative');
      expect(props).toHaveProperty('active');
      expect(props).toHaveProperty('createdAt');
      expect(props).toHaveProperty('updatedAt');
    });
  });
});
