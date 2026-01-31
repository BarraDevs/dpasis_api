import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { BudgetItemType } from 'src/app/budget/enums/budget-item-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateBudgetInputDto } from './create-budget.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateBudgetInputDto,
};

describe('CreateBudgetInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('companyId field', () => {
    it.each([undefined, null, '', '  '])('should throw an error if companyId is empty (%s)', async(value: any) => {
      // Arrange
      const data = { companyId: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyId é obrigatório');
      });
    });

    it('should throw an error if companyId is not a valid UUID', async() => {
      // Arrange
      const data = { companyId: 'invalid-uuid' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyId deve ser um UUID válido');
      });
    });
  });

  describe('clientId field', () => {
    it.each([undefined, null, '', '  '])('should throw an error if clientId is empty (%s)', async(value: any) => {
      // Arrange
      const data = { clientId: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('clientId é obrigatório');
      });
    });

    it('should throw an error if clientId is not a valid UUID', async() => {
      // Arrange
      const data = { clientId: 'invalid-uuid' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('clientId deve ser um UUID válido');
      });
    });
  });

  describe('sellerId field', () => {
    it.each([undefined, null, '', '  '])('should throw an error if sellerId is empty (%s)', async(value: any) => {
      // Arrange
      const data = { sellerId: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('sellerId é obrigatório');
      });
    });

    it('should throw an error if sellerId is not a valid UUID', async() => {
      // Arrange
      const data = { sellerId: 'invalid-uuid' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('sellerId deve ser um UUID válido');
      });
    });
  });

  describe('freightType field', () => {
    it.each([undefined, null, '', '  '])('should throw an error if freightType is empty (%s)', async(value: any) => {
      // Arrange
      const data = { freightType: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('freightType é obrigatório');
      });
    });

    it('should throw an error if freightType exceeds maximum length', async() => {
      // Arrange
      const data = { freightType: 'a'.repeat(257) };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('freightType deve ter no máximo 256 caracteres');
      });
    });
  });

  describe('shipperId field (optional)', () => {
    it('should accept null for shipperId', async() => {
      // Arrange
      const data = { shipperId: null };

      // Act & Assert
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain('shipperId');
      });
    });

    it('should throw an error if shipperId is not a valid UUID', async() => {
      // Arrange
      const data = { shipperId: 'invalid-uuid' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('shipperId deve ser um UUID válido');
      });
    });
  });

  describe.each(['freightValueInCents', 'discountInCents'])(
    '%s field (required integer with @Min(0))',
    (field: string) => {
      it(`should throw an error if ${field} is negative`, async() => {
        // Arrange
        const data = { [field]: -1 };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(`${field} deve ser maior ou igual a 0`);
        });
      });

      it(`should throw an error if ${field} is not an integer`, async() => {
        // Arrange
        const data = { [field]: 1.5 };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).toContain(`${field} deve ser um número inteiro`);
        });
      });

      it(`should accept ${field} equal to 0`, async() => {
        // Arrange
        const data = { [field]: 0 };

        // Act & Assert
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).not.toContain(field);
        });
      });
    }
  );

  describe('optional text fields', () => {
    it.each(['commercialProcess', 'commercialNote', 'observations'])(
      'should accept null for %s',
      async(field: string) => {
        // Arrange
        const data = { [field]: null };

        // Act & Assert
        return target.transform(data, metadata).catch((error) => {
          expect(error.getResponse().message).not.toContain(field);
        });
      }
    );
  });

  describe('items field', () => {
    it.each([undefined, null])('should throw an error if items is empty (%s)', async(value: any) => {
      // Arrange
      const data = { items: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('items deve ser um array');
      });
    });

    it('should throw an error if items is an empty array', async() => {
      // Arrange
      const data = { items: [] };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('items deve ter ao menos 1 item');
      });
    });

    it('should throw an error if first item has invalid itemType', async() => {
      // Arrange
      const data = {
        items: [
          {
            itemType: 'INVALID',
            description: 'Test',
            quantity: 1,
            unitPriceInCents: 1000,
            discountInCents: 0,
          },
        ],
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('items.0.itemType deve ser "Produto" ou "Serviço"');
      });
    });

    it('should throw an error if second item has invalid itemType', async() => {
      // Arrange
      const data = {
        items: [
          { itemType: BudgetItemType.PRODUCT, description: 'Test', quantity: 1, unitPriceInCents: 1000, discountInCents: 0 },
          { itemType: 'INVALID', description: 'Test', quantity: 1, unitPriceInCents: 1000, discountInCents: 0 },
        ],
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('items.1.itemType deve ser "Produto" ou "Serviço"');
      });
    });

    it('should accept valid items array with product', async() => {
      // Arrange
      const data = {
        items: [
          {
            itemType: BudgetItemType.PRODUCT,
            productId: '550e8400-e29b-41d4-a716-446655440000',
            description: 'Product Description',
            quantity: 2,
            unitPriceInCents: 1500,
            discountInCents: 100,
          },
        ],
      };

      // Act & Assert
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain('items');
      });
    });

    it('should accept valid items array with service', async() => {
      // Arrange
      const data = {
        items: [
          {
            itemType: BudgetItemType.SERVICE,
            serviceId: '550e8400-e29b-41d4-a716-446655440000',
            description: 'Service Description',
            quantity: 1,
            unitPriceInCents: 5000,
            discountInCents: 0,
          },
        ],
      };

      // Act & Assert
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain('items');
      });
    });
  });

  it('should pass if all required fields are valid', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      clientId: '550e8400-e29b-41d4-a716-446655440001',
      sellerId: '550e8400-e29b-41d4-a716-446655440002',
      freightType: 'CIF',
      shipperId: '550e8400-e29b-41d4-a716-446655440003',
      freightValueInCents: 5000,
      discountInCents: 1000,
      commercialProcess: 'PROC-2024-001',
      commercialNote: 'Nota comercial teste',
      observations: 'Observações gerais',
      items: [
        {
          itemType: BudgetItemType.PRODUCT,
          productId: '550e8400-e29b-41d4-a716-446655440004',
          serviceId: null,
          description: 'Produto Teste',
          quantity: 10,
          unitPriceInCents: 2500,
          discountInCents: 250,
        },
        {
          itemType: BudgetItemType.SERVICE,
          productId: null,
          serviceId: '550e8400-e29b-41d4-a716-446655440005',
          description: 'Serviço Teste',
          quantity: 1,
          unitPriceInCents: 15000,
          discountInCents: 0,
        },
      ],
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateBudgetInputDto);
    expect(result.items).toHaveLength(2);
  });

  it('should pass with optional fields as null', async() => {
    // Arrange
    const data = {
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      clientId: '550e8400-e29b-41d4-a716-446655440001',
      sellerId: '550e8400-e29b-41d4-a716-446655440002',
      freightType: 'FOB',
      shipperId: null,
      freightValueInCents: 0,
      discountInCents: 0,
      commercialProcess: null,
      commercialNote: null,
      observations: null,
      items: [
        {
          itemType: BudgetItemType.PRODUCT,
          productId: '550e8400-e29b-41d4-a716-446655440004',
          serviceId: null,
          description: 'Produto Simples',
          quantity: 1,
          unitPriceInCents: 1000,
          discountInCents: 0,
        },
      ],
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateBudgetInputDto);
    expect(result.shipperId).toBeNull();
    expect(result.commercialProcess).toBeNull();
    expect(result.commercialNote).toBeNull();
    expect(result.observations).toBeNull();
  });
});
