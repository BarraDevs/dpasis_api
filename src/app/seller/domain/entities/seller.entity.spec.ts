import { InvalidEmailError } from 'src/shared/value-objects/email/email.error';
import { InvalidPhoneError } from 'src/shared/value-objects/phone/phone.error';
import { InvalidCommissionError } from '../errors/invalid-commission.error';
import { Seller } from './seller.entity';

describe('SellerEntity', () => {
  const baseProps = {
    name: 'John Doe',
    nickname: 'Johnny',
    phone: '1122223333',
    cellphone: '11999998888',
    email: 'john@example.com',
    commission: 10,
    zipCode: '01310100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Sala 101',
    reference: 'Próximo ao metrô',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    observation: 'Vendedor experiente',
    avatarUrl: 'https://example.com/avatar.jpg',
    companyIds: ['company-id-1', 'company-id-2'],
  };

  describe('create', () => {
    it('should create a seller with all properties', () => {
      // Act
      const seller = Seller.create(baseProps);

      // Assert
      expect(seller.props).toMatchObject({
        ...baseProps,
        id: expect.any(String),
        active: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should create a seller with null optional fields', () => {
      // Arrange
      const propsWithNulls = {
        ...baseProps,
        nickname: null,
        complement: null,
        reference: null,
        observation: null,
        avatarUrl: null,
      };

      // Act
      const seller = Seller.create(propsWithNulls);

      // Assert
      expect(seller.props.nickname).toBeNull();
      expect(seller.props.complement).toBeNull();
      expect(seller.props.reference).toBeNull();
      expect(seller.props.observation).toBeNull();
      expect(seller.props.avatarUrl).toBeNull();
    });

    it('should create seller with unique id', () => {
      // Act
      const seller1 = Seller.create(baseProps);
      const seller2 = Seller.create(baseProps);

      // Assert
      expect(seller1.props.id).not.toBe(seller2.props.id);
    });

    it('should create seller with active status as true by default', () => {
      // Act
      const seller = Seller.create(baseProps);

      // Assert
      expect(seller.props.active).toBe(true);
    });

    it('should create seller with timestamps', () => {
      // Arrange
      const beforeCreation = new Date();

      // Act
      const seller = Seller.create(baseProps);

      // Assert
      const afterCreation = new Date();
      expect(seller.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(seller.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(seller.props.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(seller.props.updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    describe('phone and cellphone validation', () => {
      it('should create seller with valid phone and cellphone formats', () => {
        // Arrange
        const props = {
          ...baseProps,
          phone: '11999998888',
          cellphone: '11888887777',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.phone).toBe('11999998888');
        expect(seller.props.cellphone).toBe('11888887777');
      });
    });

    it('should create seller with single company', () => {
      // Arrange
      const props = {
        ...baseProps,
        companyIds: ['single-company-id'],
      };

      // Act
      const seller = Seller.create(props);

      // Assert
      expect(seller.props.companyIds).toEqual(['single-company-id']);
      expect(seller.props.companyIds).toHaveLength(1);
    });

    it('should create seller with multiple companies', () => {
      // Arrange
      const props = {
        ...baseProps,
        companyIds: ['company-1', 'company-2', 'company-3'],
      };

      // Act
      const seller = Seller.create(props);

      // Assert
      expect(seller.props.companyIds).toEqual(['company-1', 'company-2', 'company-3']);
      expect(seller.props.companyIds).toHaveLength(3);
    });
  });

  describe('load', () => {
    it('should load a seller with all properties', () => {
      // Arrange
      const existingProps = {
        ...baseProps,
        id: 'existing-seller-id',
        active: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-06-01T00:00:00Z'),
      };

      // Act
      const seller = Seller.load(existingProps);

      // Assert
      expect(seller.props).toEqual(existingProps);
    });

    it('should load a seller with null optional fields', () => {
      // Arrange
      const existingProps = {
        name: 'Jane Doe',
        nickname: null,
        phone: '1133334444',
        cellphone: '11888887777',
        email: 'jane@example.com',
        commission: 5.5,
        zipCode: '04567890',
        street: 'Rua Teste',
        number: '500',
        complement: null,
        reference: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        observation: null,
        avatarUrl: null,
        companyIds: ['company-id-3'],
        id: 'jane-seller-id',
        active: true,
        createdAt: new Date('2023-05-15T00:00:00Z'),
        updatedAt: new Date('2023-05-15T00:00:00Z'),
      };

      // Act
      const seller = Seller.load(existingProps);

      // Assert
      expect(seller.props.nickname).toBeNull();
      expect(seller.props.complement).toBeNull();
      expect(seller.props.reference).toBeNull();
      expect(seller.props.observation).toBeNull();
      expect(seller.props.avatarUrl).toBeNull();
    });

    it('should load a seller with inactive status', () => {
      // Arrange
      const existingProps = {
        ...baseProps,
        id: 'inactive-seller-id',
        active: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      // Act
      const seller = Seller.load(existingProps);

      // Assert
      expect(seller.props.active).toBe(false);
    });

    it('should load a seller with specific dates', () => {
      // Arrange
      const createdDate = new Date('2023-03-10T10:30:00Z');
      const updatedDate = new Date('2023-08-20T15:45:00Z');
      const existingProps = {
        ...baseProps,
        id: 'dated-seller-id',
        active: true,
        createdAt: createdDate,
        updatedAt: updatedDate,
      };

      // Act
      const seller = Seller.load(existingProps);

      // Assert
      expect(seller.props.createdAt).toBe(createdDate);
      expect(seller.props.updatedAt).toBe(updatedDate);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle seller status from active to inactive', () => {
      // Arrange
      const seller = Seller.create(baseProps);

      // Act & Assert
      expect(seller.props.active).toBe(true);

      seller.toggleStatus();
      expect(seller.props.active).toBe(false);
    });

    it('should toggle seller status from inactive to active', () => {
      // Arrange
      const existingProps = {
        ...baseProps,
        id: 'toggle-seller-id',
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const seller = Seller.load(existingProps);

      // Act & Assert
      expect(seller.props.active).toBe(false);

      seller.toggleStatus();
      expect(seller.props.active).toBe(true);
    });

    it('should toggle seller status multiple times', () => {
      // Arrange
      const seller = Seller.create(baseProps);

      // Act & Assert
      expect(seller.props.active).toBe(true);

      seller.toggleStatus();
      expect(seller.props.active).toBe(false);

      seller.toggleStatus();
      expect(seller.props.active).toBe(true);

      seller.toggleStatus();
      expect(seller.props.active).toBe(false);
    });
  });

  describe('props getter', () => {
    it('should return a readonly copy of props', () => {
      // Arrange
      const seller = Seller.create(baseProps);
      const props1 = seller.props;
      const props2 = seller.props;

      // Act & Assert
      expect(props1).toEqual(props2);
      expect(props1).not.toBe(props2); // Different object references
    });

    it('should return a copy of companyIds array', () => {
      // Arrange
      const seller = Seller.create(baseProps);
      const companyIds1 = seller.props.companyIds;
      const companyIds2 = seller.props.companyIds;

      // Act & Assert
      expect(companyIds1).toEqual(companyIds2);
      expect(companyIds1).not.toBe(companyIds2); // Different array references
    });

    it('should not allow modification of companyIds through props', () => {
      // Arrange
      const seller = Seller.create(baseProps);
      const originalCompanyIds = [...seller.props.companyIds];

      // Act
      const props = seller.props;
      props.companyIds.push('new-company-id');

      // Assert - companyIds should remain unchanged
      expect(seller.props.companyIds).toEqual(originalCompanyIds);
      expect(seller.props.companyIds).not.toContain('new-company-id');
    });

    it('should return all seller properties', () => {
      // Arrange
      const seller = Seller.create(baseProps);

      // Act
      const props = seller.props;

      // Assert
      expect(props).toHaveProperty('id');
      expect(props).toHaveProperty('name');
      expect(props).toHaveProperty('nickname');
      expect(props).toHaveProperty('phone');
      expect(props).toHaveProperty('cellphone');
      expect(props).toHaveProperty('email');
      expect(props).toHaveProperty('commission');
      expect(props).toHaveProperty('zipCode');
      expect(props).toHaveProperty('street');
      expect(props).toHaveProperty('number');
      expect(props).toHaveProperty('complement');
      expect(props).toHaveProperty('reference');
      expect(props).toHaveProperty('neighborhood');
      expect(props).toHaveProperty('city');
      expect(props).toHaveProperty('state');
      expect(props).toHaveProperty('observation');
      expect(props).toHaveProperty('avatarUrl');
      expect(props).toHaveProperty('companyIds');
      expect(props).toHaveProperty('active');
      expect(props).toHaveProperty('createdAt');
      expect(props).toHaveProperty('updatedAt');
    });
  });

  describe('edge cases', () => {
    it('should handle empty companyIds array', () => {
      // Arrange
      const props = {
        ...baseProps,
        companyIds: [],
      };

      // Act
      const seller = Seller.create(props);

      // Assert
      expect(seller.props.companyIds).toEqual([]);
      expect(seller.props.companyIds).toHaveLength(0);
    });

    it('should handle long strings for text fields', () => {
      // Arrange
      const longText = 'A'.repeat(1000);
      const props = {
        ...baseProps,
        name: longText,
        observation: longText,
      };

      // Act
      const seller = Seller.create(props);

      // Assert
      expect(seller.props.name).toBe(longText);
      expect(seller.props.observation).toBe(longText);
    });

    it('should handle special characters in text fields', () => {
      // Arrange
      const specialText = 'José da Silva & Cia. Ltda. - Comércio de Produtos Têxteis (Ação Especial) @ 2024!';
      const props = {
        ...baseProps,
        name: specialText,
        street: 'Rua São João, 1º andar',
        neighborhood: 'Jardim América',
      };

      // Act
      const seller = Seller.create(props);

      // Assert
      expect(seller.props.name).toBe(specialText);
      expect(seller.props.street).toBe('Rua São João, 1º andar');
      expect(seller.props.neighborhood).toBe('Jardim América');
    });

    it('should handle decimal commission values', () => {
      // Arrange
      const props = {
        ...baseProps,
        commission: 7.5,
      };

      // Act
      const seller = Seller.create(props);

      // Assert
      expect(seller.props.commission).toBe(7.5);
    });

    it('should preserve all null values when loading', () => {
      // Arrange
      const existingProps = {
        name: 'Minimal Seller',
        nickname: null,
        phone: '1144445555',
        cellphone: '11777776666',
        email: 'minimal@example.com',
        commission: 3,
        zipCode: '12345678',
        street: 'Street',
        number: '1',
        complement: null,
        reference: null,
        neighborhood: 'Neighborhood',
        city: 'City',
        state: 'ST',
        observation: null,
        avatarUrl: null,
        companyIds: ['company-id'],
        id: 'minimal-id',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const seller = Seller.load(existingProps);

      // Assert
      expect(seller.props.nickname).toBeNull();
      expect(seller.props.complement).toBeNull();
      expect(seller.props.reference).toBeNull();
      expect(seller.props.observation).toBeNull();
      expect(seller.props.avatarUrl).toBeNull();
    });
  });

  describe('validation', () => {
    describe('phone validation', () => {
      it('should create seller with valid phone (10 digits)', () => {
        // Arrange
        const props = {
          ...baseProps,
          phone: '1122223333',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.phone).toBe('1122223333');
      });

      it('should create seller with valid phone (11 digits)', () => {
        // Arrange
        const props = {
          ...baseProps,
          phone: '11922223333',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.phone).toBe('11922223333');
      });

      it('should sanitize phone removing non-numeric characters', () => {
        // Arrange
        const props = {
          ...baseProps,
          phone: '(11) 2222-3333',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.phone).toBe('1122223333');
      });

      it('should throw error when phone is empty', () => {
        // Arrange
        const props = {
          ...baseProps,
          phone: '',
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidPhoneError);
        expect(() => Seller.create(props)).toThrow('Telefone inválido');
      });

      it('should throw error when phone has less than 10 digits', () => {
        // Arrange
        const props = {
          ...baseProps,
          phone: '112223333',
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidPhoneError);
      });

      it('should throw error when phone has more than 11 digits', () => {
        // Arrange
        const props = {
          ...baseProps,
          phone: '119222233334',
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidPhoneError);
      });

      it.each([
        '',
        '123',
        '12345',
        '123456789',
        '119222233334',
        '1192222333344',
      ])('should throw error for invalid phone (%s)', (invalidPhone: string) => {
        // Arrange
        const props = {
          ...baseProps,
          phone: invalidPhone,
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidPhoneError);
      });
    });

    describe('cellphone validation', () => {
      it('should create seller with valid cellphone (11 digits)', () => {
        // Arrange
        const props = {
          ...baseProps,
          cellphone: '11999998888',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.cellphone).toBe('11999998888');
      });

      it('should create seller with valid cellphone (10 digits)', () => {
        // Arrange
        const props = {
          ...baseProps,
          cellphone: '1199998888',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.cellphone).toBe('1199998888');
      });

      it('should sanitize cellphone removing non-numeric characters', () => {
        // Arrange
        const props = {
          ...baseProps,
          cellphone: '(11) 99999-8888',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.cellphone).toBe('11999998888');
      });

      it('should throw error when cellphone is empty', () => {
        // Arrange
        const props = {
          ...baseProps,
          cellphone: '',
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidPhoneError);
        expect(() => Seller.create(props)).toThrow('Telefone inválido');
      });

      it('should throw error when cellphone has less than 10 digits', () => {
        // Arrange
        const props = {
          ...baseProps,
          cellphone: '119999888',
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidPhoneError);
      });

      it('should throw error when cellphone has more than 11 digits', () => {
        // Arrange
        const props = {
          ...baseProps,
          cellphone: '119999988889',
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidPhoneError);
      });

      it.each([
        '',
        '123',
        '999998888',
        '119999988889',
        '1199999888899',
      ])('should throw error for invalid cellphone (%s)', (invalidCellphone: string) => {
        // Arrange
        const props = {
          ...baseProps,
          cellphone: invalidCellphone,
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidPhoneError);
      });
    });

    describe('email validation', () => {
      it('should create seller with valid email', () => {
        // Arrange
        const props = {
          ...baseProps,
          email: 'seller@example.com',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.email).toBe('seller@example.com');
      });

      it('should create seller with email containing numbers', () => {
        // Arrange
        const props = {
          ...baseProps,
          email: 'seller123@example.com',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.email).toBe('seller123@example.com');
      });

      it('should create seller with email containing dots', () => {
        // Arrange
        const props = {
          ...baseProps,
          email: 'seller.name@example.com',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.email).toBe('seller.name@example.com');
      });

      it('should create seller with email containing hyphens', () => {
        // Arrange
        const props = {
          ...baseProps,
          email: 'seller-name@example.com',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.email).toBe('seller-name@example.com');
      });

      it('should create seller with email with subdomain', () => {
        // Arrange
        const props = {
          ...baseProps,
          email: 'seller@mail.example.com',
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.email).toBe('seller@mail.example.com');
      });

      it('should throw error when email is empty', () => {
        // Arrange
        const props = {
          ...baseProps,
          email: '',
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidEmailError);
        expect(() => Seller.create(props)).toThrow('E-mail inválido');
      });

      it('should throw error when email has no @', () => {
        // Arrange
        const props = {
          ...baseProps,
          email: 'sellerexample.com',
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidEmailError);
      });

      it('should throw error when email has no domain', () => {
        // Arrange
        const props = {
          ...baseProps,
          email: 'seller@',
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidEmailError);
      });

      it('should throw error when email has no username', () => {
        // Arrange
        const props = {
          ...baseProps,
          email: '@example.com',
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidEmailError);
      });

      it('should throw error when email has invalid format', () => {
        // Arrange
        const props = {
          ...baseProps,
          email: 'invalid-email',
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidEmailError);
      });

      it.each([
        '',
        'invalid-email',
        'invalid@',
        '@example.com',
        'invalid@.com',
        'invalid@@example.com',
        'invalid@example',
        'invalid@example.',
        'invalid@example.c',
        '   ',
      ])('should throw error for invalid email (%s)', (invalidEmail: string) => {
        // Arrange
        const props = {
          ...baseProps,
          email: invalidEmail,
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidEmailError);
      });
    });

    describe('commission validation', () => {
      it('should create seller with valid commission (0)', () => {
        // Arrange
        const props = {
          ...baseProps,
          commission: 0,
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.commission).toBe(0);
      });

      it('should create seller with valid commission (100)', () => {
        // Arrange
        const props = {
          ...baseProps,
          commission: 100,
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.commission).toBe(100);
      });

      it('should create seller with decimal commission', () => {
        // Arrange
        const props = {
          ...baseProps,
          commission: 15.5,
        };

        // Act
        const seller = Seller.create(props);

        // Assert
        expect(seller.props.commission).toBe(15.5);
      });

      it('should throw error when commission is negative', () => {
        // Arrange
        const props = {
          ...baseProps,
          commission: -1,
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidCommissionError);
        expect(() => Seller.create(props)).toThrow('A comissão deve estar entre 0 e 100');
      });

      it('should throw error when commission is greater than 100', () => {
        // Arrange
        const props = {
          ...baseProps,
          commission: 101,
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidCommissionError);
        expect(() => Seller.create(props)).toThrow('A comissão deve estar entre 0 e 100');
      });

      it.each([
        -100,
        -10,
        -1,
        -0.1,
        100.01,
        101,
        150,
        200,
      ])('should throw error for invalid commission (%s)', (invalidCommission: number) => {
        // Arrange
        const props = {
          ...baseProps,
          commission: invalidCommission,
        };

        // Act & Assert
        expect(() => Seller.create(props)).toThrow(InvalidCommissionError);
      });
    });

    describe('validation on load', () => {
      it('should validate phone when loading seller', () => {
        // Arrange
        const existingProps = {
          ...baseProps,
          id: 'test-id',
          phone: 'invalid',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Act & Assert
        expect(() => Seller.load(existingProps)).toThrow(InvalidPhoneError);
      });

      it('should validate cellphone when loading seller', () => {
        // Arrange
        const existingProps = {
          ...baseProps,
          id: 'test-id',
          cellphone: '123',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Act & Assert
        expect(() => Seller.load(existingProps)).toThrow(InvalidPhoneError);
      });

      it('should validate email when loading seller', () => {
        // Arrange
        const existingProps = {
          ...baseProps,
          id: 'test-id',
          email: 'invalid-email',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Act & Assert
        expect(() => Seller.load(existingProps)).toThrow(InvalidEmailError);
      });

      it('should validate commission when loading seller', () => {
        // Arrange
        const existingProps = {
          ...baseProps,
          id: 'test-id',
          commission: 150,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Act & Assert
        expect(() => Seller.load(existingProps)).toThrow(InvalidCommissionError);
      });
    });
  });

  describe('invariant protection', () => {
    it('should ensure _props contains only valid entity properties without additional data', () => {
      // Arrange
      const createProps = {
        name: 'Invariant Test Seller',
        nickname: 'InvTest',
        phone: '1133334444',
        cellphone: '11888887777',
        email: 'invariant@test.com',
        commission: 15,
        zipCode: '11111111',
        street: 'Invariant Street',
        number: '999',
        complement: 'Suite A',
        reference: 'Near park',
        neighborhood: 'Test District',
        city: 'São Paulo',
        state: 'SP',
        observation: 'Test observation',
        avatarUrl: 'https://test.com/avatar.jpg',
        companyIds: ['comp-1', 'comp-2'],
      };

      // Act
      const seller = Seller.create(createProps);

      // Assert - Verify _props has exactly the expected keys
      const expectedKeys = [
        'id',
        'name',
        'nickname',
        'phone',
        'cellphone',
        'email',
        'commission',
        'zipCode',
        'street',
        'number',
        'complement',
        'reference',
        'neighborhood',
        'city',
        'state',
        'observation',
        'avatarUrl',
        'companyIds',
        'active',
        'createdAt',
        'updatedAt',
      ].sort();

      const actualKeys = Object.keys(seller.props).sort();

      expect(actualKeys).toEqual(expectedKeys);
      expect(actualKeys.length).toBe(expectedKeys.length);
    });

    it('should not allow additional properties to leak into _props when using create', () => {
      // Arrange
      const propsWithExtra = {
        name: 'Extra Props Seller',
        nickname: 'Extra',
        phone: '1144445555',
        cellphone: '11777776666',
        email: 'extra@test.com',
        commission: 20,
        zipCode: '22222222',
        street: 'Extra St',
        number: '200',
        complement: null,
        reference: null,
        neighborhood: 'Extra',
        city: 'Rio de Janeiro',
        state: 'RJ',
        observation: null,
        avatarUrl: null,
        companyIds: ['comp-x'],
        extraProperty: 'should not exist',
        maliciousData: { dangerous: true },
        unauthorizedField: 'leaked data',
        injectedCode: 'attack vector',
      } as any;

      // Act
      const seller = Seller.create(propsWithExtra);

      // Assert
      expect(seller.props).not.toHaveProperty('extraProperty');
      expect(seller.props).not.toHaveProperty('maliciousData');
      expect(seller.props).not.toHaveProperty('unauthorizedField');
      expect(seller.props).not.toHaveProperty('injectedCode');
    });

    it('should not allow additional properties to leak into _props when using load', () => {
      // Arrange
      const propsWithExtra = {
        id: 'existing-seller-id',
        name: 'Loaded Seller',
        nickname: 'Loaded',
        phone: '1155556666',
        cellphone: '11666665555',
        email: 'loaded@test.com',
        commission: 25,
        zipCode: '33333333',
        street: 'Load St',
        number: '300',
        complement: 'Floor 2',
        reference: 'Next to mall',
        neighborhood: 'Load District',
        city: 'Belo Horizonte',
        state: 'MG',
        observation: 'Loaded obs',
        avatarUrl: 'https://loaded.com/avatar.jpg',
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
      const seller = Seller.load(propsWithExtra);

      // Assert
      expect(seller.props).not.toHaveProperty('maliciousProperty');
      expect(seller.props).not.toHaveProperty('attackVector');
      expect(seller.props).not.toHaveProperty('leakedField');
      expect(seller.props).not.toHaveProperty('pollutedData');
    });

    it('should maintain exact property count after operations', () => {
      // Arrange
      const createProps = {
        name: 'Operation Test Seller',
        nickname: 'OpTest',
        phone: '1166667777',
        cellphone: '11555554444',
        email: 'ops@test.com',
        commission: 12,
        zipCode: '44444444',
        street: 'Ops St',
        number: '400',
        complement: null,
        reference: null,
        neighborhood: 'Operations',
        city: 'Brasília',
        state: 'DF',
        observation: null,
        avatarUrl: null,
        companyIds: ['comp-ops'],
      };

      const seller = Seller.create(createProps);
      const initialKeyCount = Object.keys(seller.props).length;

      // Act - Perform operations
      seller.toggleStatus();
      seller.toggleStatus();
      seller.toggleStatus();
      const props1 = seller.props;
      const props2 = seller.props;

      // Assert
      const finalKeyCount = Object.keys(seller.props).length;
      expect(finalKeyCount).toBe(initialKeyCount);
      expect(finalKeyCount).toBe(21); // Exact number of expected properties
      expect(props1.active).toBe(props2.active); // Ensure consistency
    });

    it('should ensure props getter returns consistent data structure', () => {
      // Arrange
      const loadProps = {
        id: 'consistent-seller-id',
        name: 'Consistency Seller',
        nickname: 'Consistent',
        phone: '1177778888',
        cellphone: '11444443333',
        email: 'consistent@test.com',
        commission: 18,
        zipCode: '55555555',
        street: 'Consistent Ave',
        number: '500',
        complement: 'Building A',
        reference: 'Corner location',
        neighborhood: 'Consistent Area',
        city: 'Fortaleza',
        state: 'CE',
        observation: 'Consistent seller',
        avatarUrl: 'https://consistent.com/pic.jpg',
        companyIds: ['comp-a', 'comp-b', 'comp-c'],
        active: false,
        createdAt: new Date('2024-06-15T10:00:00Z'),
        updatedAt: new Date('2024-06-20T15:30:00Z'),
      };

      // Act
      const seller = Seller.load(loadProps);
      const props1 = seller.props;
      const props2 = seller.props;

      // Assert
      expect(Object.keys(props1).length).toBe(Object.keys(props2).length);
      expect(Object.keys(props1).sort()).toEqual(Object.keys(props2).sort());
      expect(props1.id).toBe(props2.id);
      expect(props1.name).toBe(props2.name);
      expect(props1.email).toBe(props2.email);
      expect(props1.commission).toBe(props2.commission);
    });

    it('should ensure companyIds array is properly copied and isolated', () => {
      // Arrange
      const createProps = {
        name: 'Array Test Seller',
        nickname: 'ArrTest',
        phone: '1188889999',
        cellphone: '11333332222',
        email: 'array@test.com',
        commission: 22,
        zipCode: '66666666',
        street: 'Array St',
        number: '600',
        complement: null,
        reference: null,
        neighborhood: 'Array District',
        city: 'Salvador',
        state: 'BA',
        observation: null,
        avatarUrl: null,
        companyIds: ['comp-1', 'comp-2'],
      };

      // Act
      const seller = Seller.create(createProps);
      const companyIds1 = seller.props.companyIds;
      const companyIds2 = seller.props.companyIds;

      // Assert - Arrays should be different references (copies)
      expect(companyIds1).toEqual(companyIds2);
      expect(companyIds1).not.toBe(companyIds2);

      // Mutating returned array should not affect internal state
      companyIds1.push('new-company');
      expect(seller.props.companyIds).toEqual(['comp-1', 'comp-2']);
      expect(seller.props.companyIds.length).toBe(2);
    });
  });
});
