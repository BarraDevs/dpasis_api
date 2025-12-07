import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateItemInputDto, CreateItemsInputDto } from './create-item.dto';

const createItemsInputMetadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateItemsInputDto,
};

const createItemInputMetadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateItemInputDto,
};

describe('CreateItemDto', () => {
  describe('CreateItemInputDto', () => {
    let target: ValidationPipe;

    beforeEach(() => {
      target = new ValidationPipe(pipeOptions);
    });

    describe('description field', () => {
      it.each([
        undefined,
        null,
        '',
        '   ',
      ])('should throw an error if description is empty (%s)', async(value: any) => {
      // Arrange
        const data = {
          description: value,
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('description should not be empty');
        });
      });

      it.each([
        123,
        true,
        false,
        {},
        [],
      ])('should throw an error if description is not a string (%s)', async(value: any) => {
      // Arrange
        const data = {
          description: value,
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('description must be a string');
        });
      });

      it('should trim whitespace from description', async() => {
      // Arrange
        const data = {
          description: '  Valid Description  ',
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act
        const result = await target.transform(data, createItemInputMetadata);

        // Assert
        expect(result.description).toBe('Valid Description');
      });
    });

    describe('serviceCode field', () => {
      it.each([
        undefined,
        null,
        '',
        '   ',
      ])('should throw an error if serviceCode is empty (%s)', async(value: any) => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: value,
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('serviceCode should not be empty');
        });
      });

      it.each([
        123,
        true,
        false,
        {},
        [],
      ])('should throw an error if serviceCode is not a string (%s)', async(value: any) => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: value,
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('serviceCode must be a string');
        });
      });

      it('should throw an error if serviceCode exceeds 256 characters', async() => {
      // Arrange
        const longServiceCode = 'A'.repeat(257);
        const data = {
          description: 'Valid Description',
          serviceCode: longServiceCode,
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('serviceCode must be shorter than or equal to 256 characters');
        });
      });

      it('should accept serviceCode with exactly 256 characters', async() => {
      // Arrange
        const maxServiceCode = 'A'.repeat(256);
        const data = {
          description: 'Valid Description',
          serviceCode: maxServiceCode,
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act
        const result = await target.transform(data, createItemInputMetadata);

        // Assert
        expect(result.serviceCode).toBe(maxServiceCode);
      });

      it('should trim whitespace from serviceCode', async() => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: '  SKU-001  ',
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act
        const result = await target.transform(data, createItemInputMetadata);

        // Assert
        expect(result.serviceCode).toBe('SKU-001');
      });
    });

    describe('quantity field', () => {
      it.each([
        undefined,
        null,
      ])('should throw an error if quantity is empty (%s)', async(value: any) => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: 'SKU-001',
          quantity: value,
          unitPriceInCents: 1000,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('Quantidade deve ser um número inteiro');
        });
      });

      it.each([
        '0',
        0,
        '-1',
        -1,
      ])('should throw an error if quantity is less than 1 (%s)', async(value: any) => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: 'SKU-001',
          quantity: value,
          unitPriceInCents: 1000,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('Quantidade deve ser no mínimo 1');
        });
      });

      it.each([
        '1.5',
        1.5,
        '2.7',
        2.7,
      ])('should throw an error if quantity is not an integer (%s)', async(value: any) => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: 'SKU-001',
          quantity: value,
          unitPriceInCents: 1000,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('Quantidade deve ser um número inteiro');
        });
      });

      it('should convert string numbers to integers', async() => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: 'SKU-001',
          quantity: '5',
          unitPriceInCents: 1000,
        };

        // Act
        const result = await target.transform(data, createItemInputMetadata);

        // Assert
        expect(result.quantity).toBe(5);
        expect(typeof result.quantity).toBe('number');
      });

      it('should accept valid positive integers', async() => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: 'SKU-001',
          quantity: 10,
          unitPriceInCents: 1000,
        };

        // Act
        const result = await target.transform(data, createItemInputMetadata);

        // Assert
        expect(result.quantity).toBe(10);
      });
    });

    describe('unitPriceInCents field', () => {
      it.each([
        undefined,
        null,
      ])('should throw an error if unitPriceInCents is empty (%s)', async(value: any) => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('Preço deve ser um número inteiro');
        });
      });

      it.each([
        '-1',
        -1,
        '-100',
        -100,
      ])('should throw an error if unitPriceInCents is negative (%s)', async(value: any) => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('Preço não pode ser negativo');
        });
      });

      it.each([
        '1.5',
        1.5,
        '99.99',
        99.99,
      ])('should throw an error if unitPriceInCents is not an integer (%s)', async(value: any) => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('Preço deve ser um número inteiro');
        });
      });

      it('should accept zero price (free items)', async() => {
      // Arrange
        const data = {
          description: 'Free Item',
          serviceCode: 'SKU-FREE',
          quantity: 1,
          unitPriceInCents: 0,
        };

        // Act
        const result = await target.transform(data, createItemInputMetadata);

        // Assert
        expect(result.unitPriceInCents).toBe(0);
      });

      it('should convert string numbers to integers', async() => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: '1500',
        };

        // Act
        const result = await target.transform(data, createItemInputMetadata);

        // Assert
        expect(result.unitPriceInCents).toBe(1500);
        expect(typeof result.unitPriceInCents).toBe('number');
      });

      it('should accept valid positive integers', async() => {
      // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: 25000,
        };

        // Act
        const result = await target.transform(data, createItemInputMetadata);

        // Assert
        expect(result.unitPriceInCents).toBe(25000);
      });
    });

    it('should pass validation with all valid fields', async() => {
    // Arrange
      const data = {
        description: 'Valid Product Description',
        serviceCode: 'SKU-12345',
        quantity: 3,
        unitPriceInCents: 15000,
      };

      // Act
      const result = await target.transform(data, createItemInputMetadata);

      // Assert
      expect(result).toBeInstanceOf(CreateItemInputDto);
      expect(result).toEqual(data);
    });
  });

  describe('CreateItemsInputDto', () => {
    let target: ValidationPipe;

    beforeEach(() => {
      target = new ValidationPipe(pipeOptions);
    });

    describe('ownerId field', () => {
      it.each([
        undefined,
        null,
        '',
        '   ',
      ])('should throw an error if ownerId is empty (%s)', async(value: any) => {
      // Arrange
        const data = {
          ownerId: value,
          items: [
            {
              description: 'Valid Description',
              serviceCode: 'SKU-001',
              quantity: 1,
              unitPriceInCents: 1000,
            },
          ],
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemsInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('ownerId should not be empty');
        });
      });

      it.each([
        123,
        true,
        false,
        {},
        [],
      ])('should throw an error if ownerId is not a string (%s)', async(value: any) => {
      // Arrange
        const data = {
          ownerId: value,
          items: [
            {
              description: 'Valid Description',
              serviceCode: 'SKU-001',
              quantity: 1,
              unitPriceInCents: 1000,
            },
          ],
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemsInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('ownerId must be a string');
        });
      });

      it('should throw an error if ownerId exceeds 256 characters', async() => {
      // Arrange
        const longOwnerId = 'A'.repeat(257);
        const data = {
          ownerId: longOwnerId,
          items: [
            {
              description: 'Valid Description',
              serviceCode: 'SKU-001',
              quantity: 1,
              unitPriceInCents: 1000,
            },
          ],
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemsInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('ownerId must be shorter than or equal to 256 characters');
        });
      });

      it('should accept ownerId with exactly 256 characters', async() => {
      // Arrange
        const maxOwnerId = 'A'.repeat(256);
        const data = {
          ownerId: maxOwnerId,
          items: [
            {
              description: 'Valid Description',
              serviceCode: 'SKU-001',
              quantity: 1,
              unitPriceInCents: 1000,
            },
          ],
        };

        // Act
        const result = await target.transform(data, createItemsInputMetadata);

        // Assert
        expect(result.ownerId).toBe(maxOwnerId);
      });
    });

    describe('items field', () => {
      it.each([
        undefined,
        null,
      ])('should throw an error if items is not provided (%s)', async(value: any) => {
      // Arrange
        const data = {
          ownerId: 'valid-owner-id',
          items: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemsInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('items must be an array');
        });
      });

      it.each([
        'not-array',
        123,
        true,
      ])('should throw an error if items is not an array (%s)', async(value: any) => {
      // Arrange
        const data = {
          ownerId: 'valid-owner-id',
          items: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemsInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('items must be an array');
        });
      });

      it('should throw an error if items array is empty', async() => {
      // Arrange
        const data = {
          ownerId: 'valid-owner-id',
          items: [],
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemsInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('items must contain at least 1 elements');
        });
      });

      it('should validate each item in the array', async() => {
      // Arrange
        const data = {
          ownerId: 'valid-owner-id',
          items: [
            {
              description: 'Valid Item',
              serviceCode: 'SKU-001',
              quantity: 1,
              unitPriceInCents: 1000,
            },
            {
              description: '', // Invalid - empty description
              serviceCode: 'SKU-002',
              quantity: 1,
              unitPriceInCents: 2000,
            },
          ],
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemsInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('items.1.description should not be empty');
        });
      });

      it('should validate quantity in nested items', async() => {
      // Arrange
        const data = {
          ownerId: 'valid-owner-id',
          items: [
            {
              description: 'Valid Item',
              serviceCode: 'SKU-001',
              quantity: 0, // Invalid - less than 1
              unitPriceInCents: 1000,
            },
          ],
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemsInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('items.0.Quantidade deve ser no mínimo 1');
        });
      });

      it('should validate unitPriceInCents in nested items', async() => {
      // Arrange
        const data = {
          ownerId: 'valid-owner-id',
          items: [
            {
              description: 'Valid Item',
              serviceCode: 'SKU-001',
              quantity: 1,
              unitPriceInCents: -100, // Invalid - negative price
            },
          ],
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, createItemsInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('items.0.Preço não pode ser negativo');
        });
      });

      it('should accept multiple valid items', async() => {
      // Arrange
        const data = {
          ownerId: 'valid-owner-id',
          items: [
            {
              description: 'First Item',
              serviceCode: 'SKU-001',
              quantity: 2,
              unitPriceInCents: 1500,
            },
            {
              description: 'Second Item',
              serviceCode: 'SKU-002',
              quantity: 1,
              unitPriceInCents: 2500,
            },
            {
              description: 'Third Item',
              serviceCode: 'SKU-003',
              quantity: 5,
              unitPriceInCents: 800,
            },
          ],
        };

        // Act
        const result = await target.transform(data, createItemsInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(CreateItemsInputDto);
        expect(result.items).toHaveLength(3);
        expect(result.items[0]).toEqual({
          description: 'First Item',
          serviceCode: 'SKU-001',
          quantity: 2,
          unitPriceInCents: 1500,
        });
        expect(result.items[1]).toEqual({
          description: 'Second Item',
          serviceCode: 'SKU-002',
          quantity: 1,
          unitPriceInCents: 2500,
        });
        expect(result.items[2]).toEqual({
          description: 'Third Item',
          serviceCode: 'SKU-003',
          quantity: 5,
          unitPriceInCents: 800,
        });
      });

      it('should convert string numbers to integers in nested items', async() => {
      // Arrange
        const data = {
          ownerId: 'valid-owner-id',
          items: [
            {
              description: 'Test Item',
              serviceCode: 'SKU-001',
              quantity: '3', // String number
              unitPriceInCents: '2500', // String number
            },
          ],
        };

        // Act
        const result = await target.transform(data, createItemsInputMetadata);

        // Assert
        expect(result.items[0].quantity).toBe(3);
        expect(result.items[0].unitPriceInCents).toBe(2500);
        expect(typeof result.items[0].quantity).toBe('number');
        expect(typeof result.items[0].unitPriceInCents).toBe('number');
      });

      it('should trim whitespace in nested items', async() => {
      // Arrange
        const data = {
          ownerId: 'valid-owner-id',
          items: [
            {
              description: '  Test Item with spaces  ',
              serviceCode: '  SKU-001  ',
              quantity: 1,
              unitPriceInCents: 1000,
            },
          ],
        };

        // Act
        const result = await target.transform(data, createItemsInputMetadata);

        // Assert
        expect(result.items[0].description).toBe('Test Item with spaces');
        expect(result.items[0].serviceCode).toBe('SKU-001');
      });
    });

    it('should pass validation with all valid fields and single item', async() => {
    // Arrange
      const data = {
        ownerId: 'uuid-owner-123',
        items: [
          {
            description: 'Valid Product',
            serviceCode: 'SKU-12345',
            quantity: 2,
            unitPriceInCents: 15000,
          },
        ],
      };

      // Act
      const result = await target.transform(data, createItemsInputMetadata);

      // Assert
      expect(result).toBeInstanceOf(CreateItemsInputDto);
      expect(result).toEqual(data);
    });

    it('should pass validation with all valid fields and multiple items', async() => {
    // Arrange
      const data = {
        ownerId: 'uuid-owner-456',
        items: [
          {
            description: 'Product A',
            serviceCode: 'SKU-A001',
            quantity: 1,
            unitPriceInCents: 10000,
          },
          {
            description: 'Product B',
            serviceCode: 'SKU-B002',
            quantity: 3,
            unitPriceInCents: 5000,
          },
        ],
      };

      // Act
      const result = await target.transform(data, createItemsInputMetadata);

      // Assert
      expect(result).toBeInstanceOf(CreateItemsInputDto);
      expect(result).toEqual(data);
    });
  });
});
