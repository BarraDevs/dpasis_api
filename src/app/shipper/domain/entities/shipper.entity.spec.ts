import { InvalidCnpjError } from 'src/shared/value-objects/cnpj/cnpj.error';
import { Shipper } from './shipper.entity';

describe('Shipper Entity', () => {
  const validProps = {
    companyName: 'Tech Shipper Ltda',
    fantasyName: 'Tech Shipper',
    cnpj: '55.967.002/0001-46',
    contact: '(11) 98765-4321',
    representative: 'John Doe',
    zipCode: '12345-678',
    street: 'Main Street',
    number: '123',
    complement: 'Suite 100',
    reference: 'Near the mall',
    neighborhood: 'Downtown',
    city: 'São Paulo',
    state: 'SP',
    companyIds: ['comp-123', 'comp-456'],
  };

  describe('create', () => {
    it('should create a new shipper with active=true and timestamps', () => {
      // Act
      const shipper = Shipper.create(validProps);

      // Assert
      expect(shipper).toBeInstanceOf(Shipper);
      expect(shipper.props.id).toBeDefined();
      expect(shipper.props.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(shipper.props.cnpj).toBe('55967002000146'); // Sanitized
      expect(shipper.props.companyName).toBe(validProps.companyName);
      expect(shipper.props.fantasyName).toBe(validProps.fantasyName);
      expect(shipper.props.contact).toBe(validProps.contact);
      expect(shipper.props.representative).toBe(validProps.representative);
      expect(shipper.props.zipCode).toBe(validProps.zipCode);
      expect(shipper.props.street).toBe(validProps.street);
      expect(shipper.props.number).toBe(validProps.number);
      expect(shipper.props.complement).toBe(validProps.complement);
      expect(shipper.props.reference).toBe(validProps.reference);
      expect(shipper.props.neighborhood).toBe(validProps.neighborhood);
      expect(shipper.props.city).toBe(validProps.city);
      expect(shipper.props.state).toBe(validProps.state);
      expect(shipper.props.active).toBe(true);
      expect(shipper.props.createdAt).toBeInstanceOf(Date);
      expect(shipper.props.updatedAt).toBeInstanceOf(Date);
      expect(shipper.props.companyIds).toEqual(validProps.companyIds);
    });

    it('should sanitize cnpj removing special characters', () => {
      // Arrange
      const props = {
        ...validProps,
        cnpj: '55.967.002/0001-46',
      };

      // Act
      const shipper = Shipper.create(props);

      // Assert
      expect(shipper.props.cnpj).toBe('55967002000146');
    });

    it('should throw InvalidCnpjError for invalid cnpj', () => {
      // Arrange
      const props = {
        ...validProps,
        cnpj: '00.000.000/0000-00', // Invalid CNPJ
      };

      // Act & Assert
      expect(() => Shipper.create(props)).toThrow(InvalidCnpjError);
    });

    it('should generate different UUIDs for different instances', () => {
      // Act
      const shipper1 = Shipper.create(validProps);
      const shipper2 = Shipper.create(validProps);

      // Assert
      expect(shipper1.props.id).not.toBe(shipper2.props.id);
    });

    it('should set createdAt and updatedAt to current time', () => {
      // Arrange
      const beforeCreate = new Date();

      // Act
      const shipper = Shipper.create(validProps);

      // Assert
      const afterCreate = new Date();
      expect(shipper.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(shipper.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(shipper.props.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(shipper.props.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create shipper with all required properties', () => {
      // Act
      const shipper = Shipper.create(validProps);

      // Assert
      expect(shipper.props.companyName).toBeDefined();
      expect(shipper.props.fantasyName).toBeDefined();
      expect(shipper.props.cnpj).toBeDefined();
      expect(shipper.props.contact).toBeDefined();
      expect(shipper.props.representative).toBeDefined();
      expect(shipper.props.zipCode).toBeDefined();
      expect(shipper.props.street).toBeDefined();
      expect(shipper.props.number).toBeDefined();
      expect(shipper.props.neighborhood).toBeDefined();
      expect(shipper.props.city).toBeDefined();
      expect(shipper.props.state).toBeDefined();
    });

    it('should validate cnpj with valid format', () => {
      // Arrange
      const props = {
        ...validProps,
        cnpj: '00365466000190',
      };

      // Act
      const shipper = Shipper.create(props);

      // Assert
      expect(shipper.props.cnpj).toBe('00365466000190');
    });

    it('should create multiple shippers with same data but different IDs', () => {
      // Act
      const shipper1 = Shipper.create(validProps);
      const shipper2 = Shipper.create(validProps);
      const shipper3 = Shipper.create(validProps);

      // Assert
      expect(shipper1.props.id).not.toBe(shipper2.props.id);
      expect(shipper1.props.id).not.toBe(shipper3.props.id);
      expect(shipper2.props.id).not.toBe(shipper3.props.id);
      expect(shipper1.props.cnpj).toBe(shipper2.props.cnpj);
      expect(shipper1.props.cnpj).toBe(shipper3.props.cnpj);
    });

    it('should create shipper with null complement', () => {
      // Arrange
      const props = {
        ...validProps,
        complement: null,
      };

      // Act
      const shipper = Shipper.create(props);

      // Assert
      expect(shipper.props.complement).toBeNull();
    });

    it('should create shipper with null reference', () => {
      // Arrange
      const props = {
        ...validProps,
        reference: null,
      };

      // Act
      const shipper = Shipper.create(props);

      // Assert
      expect(shipper.props.reference).toBeNull();
    });

    it('should create shipper with both complement and reference as null', () => {
      // Arrange
      const props = {
        ...validProps,
        complement: null,
        reference: null,
      };

      // Act
      const shipper = Shipper.create(props);

      // Assert
      expect(shipper.props.complement).toBeNull();
      expect(shipper.props.reference).toBeNull();
    });

    it('should create shipper with empty companyIds array', () => {
      // Arrange
      const props = {
        ...validProps,
        companyIds: [],
      };

      // Act
      const shipper = Shipper.create(props);

      // Assert
      expect(shipper.props.companyIds).toEqual([]);
      expect(shipper.props.companyIds).toHaveLength(0);
    });

    it('should create shipper with multiple companyIds', () => {
      // Arrange
      const props = {
        ...validProps,
        companyIds: ['comp-1', 'comp-2', 'comp-3', 'comp-4'],
      };

      // Act
      const shipper = Shipper.create(props);

      // Assert
      expect(shipper.props.companyIds).toEqual(['comp-1', 'comp-2', 'comp-3', 'comp-4']);
      expect(shipper.props.companyIds).toHaveLength(4);
    });
  });

  describe('load', () => {
    it('should load an existing shipper with all properties', () => {
      // Arrange
      const existingProps = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        companyName: 'Existing Shipper Ltda',
        fantasyName: 'Existing Shipper',
        cnpj: '55967002000146', // Already sanitized
        contact: '(21) 98765-4321',
        representative: 'Jane Smith',
        zipCode: '98765-432',
        street: 'Second Avenue',
        number: '456',
        complement: 'Building B',
        reference: 'Next to the park',
        neighborhood: 'Uptown',
        city: 'Rio de Janeiro',
        state: 'RJ',
        active: true,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-20T14:45:00Z'),
        companyIds: ['comp-123', 'comp-456'],
      };

      // Act
      const shipper = Shipper.load(existingProps);

      // Assert
      expect(shipper).toBeInstanceOf(Shipper);
      expect(shipper.props.id).toBe(existingProps.id);
      expect(shipper.props.companyName).toBe(existingProps.companyName);
      expect(shipper.props.fantasyName).toBe(existingProps.fantasyName);
      expect(shipper.props.cnpj).toBe(existingProps.cnpj);
      expect(shipper.props.contact).toBe(existingProps.contact);
      expect(shipper.props.representative).toBe(existingProps.representative);
      expect(shipper.props.zipCode).toBe(existingProps.zipCode);
      expect(shipper.props.street).toBe(existingProps.street);
      expect(shipper.props.number).toBe(existingProps.number);
      expect(shipper.props.complement).toBe(existingProps.complement);
      expect(shipper.props.reference).toBe(existingProps.reference);
      expect(shipper.props.neighborhood).toBe(existingProps.neighborhood);
      expect(shipper.props.city).toBe(existingProps.city);
      expect(shipper.props.state).toBe(existingProps.state);
      expect(shipper.props.active).toBe(existingProps.active);
      expect(shipper.props.createdAt).toStrictEqual(existingProps.createdAt);
      expect(shipper.props.updatedAt).toStrictEqual(existingProps.updatedAt);
      expect(shipper.props.companyIds).toEqual(existingProps.companyIds);
    });

    it('should load shipper with active=false', () => {
      // Arrange
      const existingProps = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        companyName: 'Inactive Shipper',
        fantasyName: 'Inactive',
        cnpj: '00365466000190',
        contact: '(31) 98765-4321',
        representative: 'Bob Johnson',
        zipCode: '11111-111',
        street: 'Third Street',
        number: '789',
        complement: null,
        reference: null,
        neighborhood: 'Midtown',
        city: 'Belo Horizonte',
        state: 'MG',
        active: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-10T00:00:00Z'),
        companyIds: [],
      };

      // Act
      const shipper = Shipper.load(existingProps);

      // Assert
      expect(shipper.props.active).toBe(false);
    });

    it('should sanitize cnpj if loaded with formatting', () => {
      // Arrange
      const existingProps = {
        id: '323e4567-e89b-12d3-a456-426614174002',
        companyName: 'Formatted Shipper',
        fantasyName: 'Formatted',
        cnpj: '55.967.002/0001-46', // With formatting
        contact: '(41) 98765-4321',
        representative: 'Alice Brown',
        zipCode: '22222-222',
        street: 'Fourth Avenue',
        number: '321',
        complement: 'Floor 3',
        reference: 'Behind the station',
        neighborhood: 'Old Town',
        city: 'Curitiba',
        state: 'PR',
        active: true,
        createdAt: new Date('2024-02-01T00:00:00Z'),
        updatedAt: new Date('2024-02-01T00:00:00Z'),
        companyIds: [],
      };

      // Act
      const shipper = Shipper.load(existingProps);

      // Assert
      expect(shipper.props.cnpj).toBe('55967002000146');
    });

    it('should throw InvalidCnpjError when loading with invalid cnpj', () => {
      // Arrange
      const existingProps = {
        id: '423e4567-e89b-12d3-a456-426614174003',
        companyName: 'Invalid CNPJ Shipper',
        fantasyName: 'Invalid CNPJ',
        cnpj: '00.000.000/0000-00', // Invalid CNPJ
        contact: '(51) 98765-4321',
        representative: 'Charlie Wilson',
        zipCode: '33333-333',
        street: 'Fifth Street',
        number: '654',
        complement: 'Room 10',
        reference: 'Opposite the library',
        neighborhood: 'New Area',
        city: 'Porto Alegre',
        state: 'RS',
        active: true,
        createdAt: new Date('2024-03-01T00:00:00Z'),
        updatedAt: new Date('2024-03-01T00:00:00Z'),
        companyIds: [],
      };

      // Act & Assert
      expect(() => Shipper.load(existingProps)).toThrow(InvalidCnpjError);
    });

    it('should preserve original timestamps when loading', () => {
      // Arrange
      const createdAt = new Date('2024-01-01T12:00:00Z');
      const updatedAt = new Date('2024-06-15T18:30:00Z');
      const existingProps = {
        id: '523e4567-e89b-12d3-a456-426614174004',
        companyName: 'Timestamp Shipper',
        fantasyName: 'Timestamp',
        cnpj: '00365466000190',
        contact: '(61) 98765-4321',
        representative: 'David Martinez',
        zipCode: '44444-444',
        street: 'Sixth Avenue',
        number: '987',
        complement: null,
        reference: null,
        neighborhood: 'East Side',
        city: 'Brasília',
        state: 'DF',
        active: true,
        createdAt,
        updatedAt,
        companyIds: [],
      };

      // Act
      const shipper = Shipper.load(existingProps);

      // Assert
      expect(shipper.props.createdAt).toStrictEqual(createdAt);
      expect(shipper.props.updatedAt).toStrictEqual(updatedAt);
      expect(shipper.props.createdAt.getTime()).toBe(createdAt.getTime());
      expect(shipper.props.updatedAt.getTime()).toBe(updatedAt.getTime());
    });

    it('should load shipper with different cities and states', () => {
      // Arrange
      const props1 = {
        id: '623e4567-e89b-12d3-a456-426614174005',
        companyName: 'Northern Shipper',
        fantasyName: 'Northern',
        cnpj: '00365466000190',
        contact: '(71) 98765-4321',
        representative: 'Emma Davis',
        zipCode: '55555-555',
        street: 'Seventh Street',
        number: '111',
        complement: 'Apt 5',
        reference: 'Near the beach',
        neighborhood: 'Coastal Area',
        city: 'Salvador',
        state: 'BA',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyIds: [],
      };

      const props2 = {
        id: '723e4567-e89b-12d3-a456-426614174006',
        companyName: 'Southern Shipper',
        fantasyName: 'Southern',
        cnpj: '55967002000146',
        contact: '(81) 98765-4321',
        representative: 'Frank Garcia',
        zipCode: '66666-666',
        street: 'Eighth Avenue',
        number: '222',
        complement: 'Block C',
        reference: 'In front of the square',
        neighborhood: 'Historical District',
        city: 'Recife',
        state: 'PE',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyIds: [],
      };

      // Act
      const shipper1 = Shipper.load(props1);
      const shipper2 = Shipper.load(props2);

      // Assert
      expect(shipper1.props.city).toBe('Salvador');
      expect(shipper1.props.state).toBe('BA');
      expect(shipper2.props.city).toBe('Recife');
      expect(shipper2.props.state).toBe('PE');
    });

    it('should load shipper with null complement and reference', () => {
      // Arrange
      const existingProps = {
        id: '823e4567-e89b-12d3-a456-426614174007',
        companyName: 'No Complement Shipper',
        fantasyName: 'No Complement',
        cnpj: '00365466000190',
        contact: '(85) 98765-4321',
        representative: 'Grace Lee',
        zipCode: '77777-777',
        street: 'Ninth Street',
        number: '333',
        complement: null,
        reference: null,
        neighborhood: 'Industrial Zone',
        city: 'Fortaleza',
        state: 'CE',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyIds: ['comp-789'],
      };

      // Act
      const shipper = Shipper.load(existingProps);

      // Assert
      expect(shipper.props.complement).toBeNull();
      expect(shipper.props.reference).toBeNull();
    });
  });

  describe('toggleStatus', () => {
    it('should toggle shipper status from active to inactive', () => {
      // Arrange
      const props = {
        id: 'toggle-test-id-1',
        companyName: 'Toggle Test Shipper',
        fantasyName: 'Toggle Test',
        cnpj: '00365466000190',
        contact: '(11) 91111-1111',
        representative: 'Toggle Rep',
        zipCode: '88888-888',
        street: 'Tenth Avenue',
        number: '444',
        complement: 'Suite 200',
        reference: 'Next to the hospital',
        neighborhood: 'Medical District',
        city: 'São Paulo',
        state: 'SP',
        active: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        companyIds: [],
      };

      const shipper = Shipper.load(props);

      // Act
      shipper.toggleStatus();

      // Assert
      expect(shipper.props.active).toBe(false);
    });

    it('should toggle shipper status from inactive to active', () => {
      // Arrange
      const props = {
        id: 'toggle-test-id-2',
        companyName: 'Inactive Shipper',
        fantasyName: 'Inactive',
        cnpj: '55967002000146',
        contact: '(11) 92222-2222',
        representative: 'Inactive Rep',
        zipCode: '99999-999',
        street: 'Eleventh Street',
        number: '555',
        complement: null,
        reference: null,
        neighborhood: 'Commercial Area',
        city: 'São Paulo',
        state: 'SP',
        active: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        companyIds: [],
      };

      const shipper = Shipper.load(props);

      // Act
      shipper.toggleStatus();

      // Assert
      expect(shipper.props.active).toBe(true);
    });

    it('should toggle status multiple times', () => {
      // Arrange
      const shipper = Shipper.create(validProps);

      // Act & Assert
      expect(shipper.props.active).toBe(true);

      shipper.toggleStatus();
      expect(shipper.props.active).toBe(false);

      shipper.toggleStatus();
      expect(shipper.props.active).toBe(true);

      shipper.toggleStatus();
      expect(shipper.props.active).toBe(false);

      shipper.toggleStatus();
      expect(shipper.props.active).toBe(true);
    });

    it('should not modify other properties when toggling status', () => {
      // Arrange
      const props = {
        id: 'preserve-test-id',
        companyName: 'Preserve Test Shipper',
        fantasyName: 'Preserve Test',
        cnpj: '00365466000190',
        contact: '(11) 93333-3333',
        representative: 'Preserve Rep',
        zipCode: '10101-010',
        street: 'Twelfth Avenue',
        number: '666',
        complement: 'Floor 5',
        reference: 'Behind the school',
        neighborhood: 'Educational District',
        city: 'São Paulo',
        state: 'SP',
        active: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        companyIds: ['comp-preserve'],
      };

      const shipper = Shipper.load(props);
      const originalId = shipper.props.id;
      const originalCompanyName = shipper.props.companyName;
      const originalFantasyName = shipper.props.fantasyName;
      const originalCnpj = shipper.props.cnpj;
      const originalContact = shipper.props.contact;
      const originalRepresentative = shipper.props.representative;
      const originalZipCode = shipper.props.zipCode;
      const originalStreet = shipper.props.street;
      const originalNumber = shipper.props.number;
      const originalComplement = shipper.props.complement;
      const originalReference = shipper.props.reference;
      const originalNeighborhood = shipper.props.neighborhood;
      const originalCity = shipper.props.city;
      const originalState = shipper.props.state;
      const originalCompanyIds = shipper.props.companyIds;

      // Act
      shipper.toggleStatus();

      // Assert
      expect(shipper.props.id).toBe(originalId);
      expect(shipper.props.companyName).toBe(originalCompanyName);
      expect(shipper.props.fantasyName).toBe(originalFantasyName);
      expect(shipper.props.cnpj).toBe(originalCnpj);
      expect(shipper.props.contact).toBe(originalContact);
      expect(shipper.props.representative).toBe(originalRepresentative);
      expect(shipper.props.zipCode).toBe(originalZipCode);
      expect(shipper.props.street).toBe(originalStreet);
      expect(shipper.props.number).toBe(originalNumber);
      expect(shipper.props.complement).toBe(originalComplement);
      expect(shipper.props.reference).toBe(originalReference);
      expect(shipper.props.neighborhood).toBe(originalNeighborhood);
      expect(shipper.props.city).toBe(originalCity);
      expect(shipper.props.state).toBe(originalState);
      expect(shipper.props.companyIds).toEqual(originalCompanyIds);
    });
  });

  describe('props getter', () => {
    it('should return a copy of props (immutability)', () => {
      // Arrange
      const shipper = Shipper.create(validProps);

      // Act
      const props1 = shipper.props;
      const props2 = shipper.props;

      // Assert
      expect(props1).toEqual(props2);
      expect(props1).not.toBe(props2); // Different object references
    });

    it('should not allow external mutation of props', () => {
      // Arrange
      const shipper = Shipper.create(validProps);
      const originalCompanyName = shipper.props.companyName;

      // Act
      const props = shipper.props;
      (props as any).companyName = 'Modified Company Name';

      // Assert
      expect(shipper.props.companyName).toBe(originalCompanyName);
      expect(shipper.props.companyName).not.toBe('Modified Company Name');
    });

    it('should return all properties correctly', () => {
      // Arrange
      const shipper = Shipper.create(validProps);

      // Act
      const props = shipper.props;

      // Assert
      expect(props).toHaveProperty('id');
      expect(props).toHaveProperty('companyName');
      expect(props).toHaveProperty('fantasyName');
      expect(props).toHaveProperty('cnpj');
      expect(props).toHaveProperty('contact');
      expect(props).toHaveProperty('representative');
      expect(props).toHaveProperty('zipCode');
      expect(props).toHaveProperty('street');
      expect(props).toHaveProperty('number');
      expect(props).toHaveProperty('complement');
      expect(props).toHaveProperty('reference');
      expect(props).toHaveProperty('neighborhood');
      expect(props).toHaveProperty('city');
      expect(props).toHaveProperty('state');
      expect(props).toHaveProperty('active');
      expect(props).toHaveProperty('createdAt');
      expect(props).toHaveProperty('updatedAt');
      expect(props).toHaveProperty('companyIds');
    });

    it('should not allow mutation of nested arrays in props', () => {
      // Arrange
      const shipper = Shipper.create(validProps);
      const originalCompanyIds = [...shipper.props.companyIds];

      // Act
      const props = shipper.props;
      props.companyIds.push('new-company-id');

      // Assert
      expect(shipper.props.companyIds).toEqual(originalCompanyIds);
      expect(shipper.props.companyIds).not.toContain('new-company-id');
    });
  });

  describe('invariant protection', () => {
    it('should ensure _props contains only valid entity properties without additional data', () => {
      // Arrange
      const createProps = {
        companyName: 'Invariant Shipper Ltda',
        fantasyName: 'Invariant Ship',
        cnpj: '55.967.002/0001-46',
        contact: '(11) 91234-5678',
        representative: 'Jane Smith',
        zipCode: '11111-111',
        street: 'Invariant Street',
        number: '999',
        complement: 'Suite A',
        reference: 'Near park',
        neighborhood: 'Test District',
        city: 'São Paulo',
        state: 'SP',
        companyIds: ['comp-1', 'comp-2'],
      };

      // Act
      const shipper = Shipper.create(createProps);

      // Assert - Verify _props has exactly the expected keys
      const expectedKeys = [
        'id',
        'companyName',
        'fantasyName',
        'cnpj',
        'contact',
        'representative',
        'zipCode',
        'street',
        'number',
        'complement',
        'reference',
        'neighborhood',
        'city',
        'state',
        'companyIds',
        'active',
        'createdAt',
        'updatedAt',
      ].sort();

      const actualKeys = Object.keys(shipper.props).sort();

      expect(actualKeys).toEqual(expectedKeys);
      expect(actualKeys.length).toBe(expectedKeys.length);
    });

    it('should not allow additional properties to leak into _props when using create', () => {
      // Arrange
      const propsWithExtra = {
        companyName: 'Extra Shipper Ltda',
        fantasyName: 'Extra Ship',
        cnpj: '55.967.002/0001-46',
        contact: '(11) 98888-7777',
        representative: 'Extra Rep',
        zipCode: '22222-222',
        street: 'Extra St',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Extra',
        city: 'Rio de Janeiro',
        state: 'RJ',
        companyIds: ['comp-x'],
        extraProperty: 'should not exist',
        maliciousData: { dangerous: true },
        unauthorizedField: 'leaked data',
        injectedCode: 'attack vector',
      } as any;

      // Act
      const shipper = Shipper.create(propsWithExtra);

      // Assert
      expect(shipper.props).not.toHaveProperty('extraProperty');
      expect(shipper.props).not.toHaveProperty('maliciousData');
      expect(shipper.props).not.toHaveProperty('unauthorizedField');
      expect(shipper.props).not.toHaveProperty('injectedCode');
    });

    it('should not allow additional properties to leak into _props when using load', () => {
      // Arrange
      const propsWithExtra = {
        id: 'existing-shipper-id',
        companyName: 'Loaded Shipper Ltda',
        fantasyName: 'Loaded Ship',
        cnpj: '55.967.002/0001-46',
        contact: '(11) 97777-6666',
        representative: 'Loaded Rep',
        zipCode: '33333-333',
        street: 'Load St',
        number: '300',
        complement: 'Floor 2',
        reference: 'Next to mall',
        neighborhood: 'Load District',
        city: 'Belo Horizonte',
        state: 'MG',
        companyIds: ['comp-y', 'comp-z'],
        active: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        maliciousProperty: 'compromising invariant',
        attackVector: { injection: 'attempt' },
        leakedField: 'unauthorized',
        pollutedData: 'should not be here',
      } as any;

      // Act
      const shipper = Shipper.load(propsWithExtra);

      // Assert
      expect(shipper.props).not.toHaveProperty('maliciousProperty');
      expect(shipper.props).not.toHaveProperty('attackVector');
      expect(shipper.props).not.toHaveProperty('leakedField');
      expect(shipper.props).not.toHaveProperty('pollutedData');
    });

    it('should maintain exact property count after operations', () => {
      // Arrange
      const createProps = {
        companyName: 'Operation Shipper Ltda',
        fantasyName: 'Op Ship',
        cnpj: '55.967.002/0001-46',
        contact: '(11) 96666-5555',
        representative: 'Op Rep',
        zipCode: '44444-444',
        street: 'Ops St',
        number: '400',
        complement: null,
        reference: null,
        neighborhood: 'Operations',
        city: 'Brasília',
        state: 'DF',
        companyIds: ['comp-ops'],
      };

      const shipper = Shipper.create(createProps);
      const initialKeyCount = Object.keys(shipper.props).length;

      // Act - Perform operations
      shipper.toggleStatus();
      shipper.toggleStatus();
      shipper.toggleStatus();
      const props1 = shipper.props;
      const props2 = shipper.props;

      // Assert
      const finalKeyCount = Object.keys(shipper.props).length;
      expect(finalKeyCount).toBe(initialKeyCount);
      expect(finalKeyCount).toBe(18); // Exact number of expected properties
      expect(props1.active).toBe(props2.active); // Ensure consistency
    });

    it('should ensure props getter returns consistent data structure', () => {
      // Arrange
      const loadProps = {
        id: 'consistent-shipper-id',
        companyName: 'Consistency Shipper Ltda',
        fantasyName: 'Consistent Ship',
        cnpj: '55.967.002/0001-46',
        contact: '(11) 95555-4444',
        representative: 'Consistent Rep',
        zipCode: '55555-555',
        street: 'Consistent Ave',
        number: '500',
        complement: 'Building A',
        reference: 'Corner location',
        neighborhood: 'Consistent Area',
        city: 'Fortaleza',
        state: 'CE',
        companyIds: ['comp-a', 'comp-b', 'comp-c'],
        active: false,
        createdAt: new Date('2024-06-15T10:00:00Z'),
        updatedAt: new Date('2024-06-20T15:30:00Z'),
      };

      // Act
      const shipper = Shipper.load(loadProps);
      const props1 = shipper.props;
      const props2 = shipper.props;

      // Assert
      expect(Object.keys(props1).length).toBe(Object.keys(props2).length);
      expect(Object.keys(props1).sort()).toEqual(Object.keys(props2).sort());
      expect(props1.id).toBe(props2.id);
      expect(props1.companyName).toBe(props2.companyName);
      expect(props1.fantasyName).toBe(props2.fantasyName);
      expect(props1.cnpj).toBe(props2.cnpj);
    });

    it('should ensure companyIds array is properly copied and isolated', () => {
      // Arrange
      const createProps = {
        companyName: 'Array Shipper Ltda',
        fantasyName: 'Array Ship',
        cnpj: '55.967.002/0001-46',
        contact: '(11) 94444-3333',
        representative: 'Array Rep',
        zipCode: '66666-666',
        street: 'Array St',
        number: '600',
        complement: null,
        reference: null,
        neighborhood: 'Array District',
        city: 'Salvador',
        state: 'BA',
        companyIds: ['comp-1', 'comp-2'],
      };

      // Act
      const shipper = Shipper.create(createProps);
      const companyIds1 = shipper.props.companyIds;
      const companyIds2 = shipper.props.companyIds;

      // Assert - Arrays should be different references (copies)
      expect(companyIds1).toEqual(companyIds2);
      expect(companyIds1).not.toBe(companyIds2);

      // Mutating returned array should not affect internal state
      companyIds1.push('new-company');
      expect(shipper.props.companyIds).toEqual(['comp-1', 'comp-2']);
      expect(shipper.props.companyIds.length).toBe(2);
    });
  });
});
