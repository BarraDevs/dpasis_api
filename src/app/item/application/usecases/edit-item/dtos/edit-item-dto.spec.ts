import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class-*/config';
import { EditItemInputDto } from './edit-item.dto';

const editItemInputMetadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditItemInputDto,
};

describe('EditItemDto', () => {
  describe('EditItemInputDto', () => {
    let target: ValidationPipe;

    beforeEach(() => {
      target = new ValidationPipe(pipeOptions);
    });

    describe('description field (optional)', () => {
      it('should allow undefined description (field is optional)', async() => {
        // Arrange
        const data = {
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.description).toBeUndefined();
        expect(result.serviceCode).toBe('SKU-001');
      });

      it.each([
        '',
        '   ',
      ])('should throw an error if description is provided but empty (%s)', async(value: any) => {
        // Arrange
        const data = {
          description: value,
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, editItemInputMetadata).catch((error) => {
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
        return target.transform(data, editItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('description must be a string');
        });
      });

      it('should trim whitespace from description when provided', async() => {
        // Arrange
        const data = {
          description: '  Updated Description  ',
          serviceCode: 'SKU-001',
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.description).toBe('Updated Description');
      });

      it('should accept valid description when provided', async() => {
        // Arrange
        const data = {
          description: 'Updated Item Description',
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.description).toBe('Updated Item Description');
      });
    });

    describe('serviceCode field (optional)', () => {
      it('should allow undefined serviceCode (field is optional)', async() => {
        // Arrange
        const data = {
          description: 'Updated Description',
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.serviceCode).toBeUndefined();
        expect(result.description).toBe('Updated Description');
      });

      it.each([
        '',
        '   ',
      ])('should throw an error if serviceCode is provided but empty (%s)', async(value: any) => {
        // Arrange
        const data = {
          description: 'Valid Description',
          serviceCode: value,
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, editItemInputMetadata).catch((error) => {
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
          serviceCode: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, editItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('serviceCode must be a string');
        });
      });

      it('should throw an error if serviceCode exceeds 256 characters', async() => {
        // Arrange
        const longServiceCode = 'A'.repeat(257);
        const data = {
          serviceCode: longServiceCode,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, editItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('serviceCode must be shorter than or equal to 256 characters');
        });
      });

      it('should accept serviceCode with exactly 256 characters', async() => {
        // Arrange
        const maxServiceCode = 'A'.repeat(256);
        const data = {
          serviceCode: maxServiceCode,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.serviceCode).toBe(maxServiceCode);
      });

      it('should trim whitespace from serviceCode when provided', async() => {
        // Arrange
        const data = {
          serviceCode: '  SKU-UPDATED  ',
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.serviceCode).toBe('SKU-UPDATED');
      });

      it('should accept valid serviceCode when provided', async() => {
        // Arrange
        const data = {
          serviceCode: 'SKU-NEW-001',
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.serviceCode).toBe('SKU-NEW-001');
      });
    });

    describe('quantity field (optional)', () => {
      it('should allow undefined quantity (field is optional)', async() => {
        // Arrange
        const data = {
          description: 'Updated Description',
          serviceCode: 'SKU-001',
          unitPriceInCents: 1000,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.quantity).toBeUndefined();
        expect(result.description).toBe('Updated Description');
      });

      it.each([
        '0',
        0,
        '-1',
        -1,
      ])('should throw an error if quantity is provided but less than 1 (%s)', async(value: any) => {
        // Arrange
        const data = {
          quantity: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, editItemInputMetadata).catch((error) => {
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
          quantity: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, editItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('Quantidade deve ser um número inteiro');
        });
      });

      it('should convert string numbers to integers when provided', async() => {
        // Arrange
        const data = {
          quantity: '10',
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.quantity).toBe(10);
        expect(typeof result.quantity).toBe('number');
      });

      it('should accept valid positive integers when provided', async() => {
        // Arrange
        const data = {
          quantity: 5,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.quantity).toBe(5);
      });
    });

    describe('unitPriceInCents field (optional)', () => {
      it('should allow undefined unitPriceInCents (field is optional)', async() => {
        // Arrange
        const data = {
          description: 'Updated Description',
          serviceCode: 'SKU-001',
          quantity: 1,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.unitPriceInCents).toBeUndefined();
        expect(result.description).toBe('Updated Description');
      });

      it.each([
        '-1',
        -1,
        '-100',
        -100,
      ])('should throw an error if unitPriceInCents is provided but negative (%s)', async(value: any) => {
        // Arrange
        const data = {
          unitPriceInCents: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, editItemInputMetadata).catch((error) => {
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
          unitPriceInCents: value,
        };

        // Act & Assert
        expect.assertions(1);
        return target.transform(data, editItemInputMetadata).catch((error) => {
          expect(error.getResponse().message).toContain('Preço deve ser um número inteiro');
        });
      });

      it('should accept zero price (free items) when provided', async() => {
        // Arrange
        const data = {
          unitPriceInCents: 0,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.unitPriceInCents).toBe(0);
      });

      it('should convert string numbers to integers when provided', async() => {
        // Arrange
        const data = {
          unitPriceInCents: '2500',
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.unitPriceInCents).toBe(2500);
        expect(typeof result.unitPriceInCents).toBe('number');
      });

      it('should accept valid positive integers when provided', async() => {
        // Arrange
        const data = {
          unitPriceInCents: 35000,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.unitPriceInCents).toBe(35000);
      });
    });

    describe('Partial updates', () => {
      it('should allow empty object (all fields optional)', async() => {
        // Arrange
        const data = {};

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(EditItemInputDto);
        expect(result.description).toBeUndefined();
        expect(result.serviceCode).toBeUndefined();
        expect(result.quantity).toBeUndefined();
        expect(result.unitPriceInCents).toBeUndefined();
      });

      it('should allow partial update with only description', async() => {
        // Arrange
        const data = {
          description: 'Only Description Updated',
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(EditItemInputDto);
        expect(result.description).toBe('Only Description Updated');
        expect(result.serviceCode).toBeUndefined();
        expect(result.quantity).toBeUndefined();
        expect(result.unitPriceInCents).toBeUndefined();
      });

      it('should allow partial update with only serviceCode', async() => {
        // Arrange
        const data = {
          serviceCode: 'UPDATED-SKU-001',
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(EditItemInputDto);
        expect(result.description).toBeUndefined();
        expect(result.serviceCode).toBe('UPDATED-SKU-001');
        expect(result.quantity).toBeUndefined();
        expect(result.unitPriceInCents).toBeUndefined();
      });

      it('should allow partial update with only quantity', async() => {
        // Arrange
        const data = {
          quantity: 15,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(EditItemInputDto);
        expect(result.description).toBeUndefined();
        expect(result.serviceCode).toBeUndefined();
        expect(result.quantity).toBe(15);
        expect(result.unitPriceInCents).toBeUndefined();
      });

      it('should allow partial update with only unitPriceInCents', async() => {
        // Arrange
        const data = {
          unitPriceInCents: 7500,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(EditItemInputDto);
        expect(result.description).toBeUndefined();
        expect(result.serviceCode).toBeUndefined();
        expect(result.quantity).toBeUndefined();
        expect(result.unitPriceInCents).toBe(7500);
      });

      it('should allow partial update with multiple fields', async() => {
        // Arrange
        const data = {
          description: 'Partially Updated Item',
          quantity: 8,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(EditItemInputDto);
        expect(result.description).toBe('Partially Updated Item');
        expect(result.serviceCode).toBeUndefined();
        expect(result.quantity).toBe(8);
        expect(result.unitPriceInCents).toBeUndefined();
      });

      it('should pass validation with all fields provided', async() => {
        // Arrange
        const data = {
          description: 'Fully Updated Item Description',
          serviceCode: 'FULL-UPDATE-001',
          quantity: 20,
          unitPriceInCents: 45000,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result).toBeInstanceOf(EditItemInputDto);
        expect(result).toEqual(data);
      });

      it('should trim whitespace from all provided string fields', async() => {
        // Arrange
        const data = {
          description: '  Trimmed Description  ',
          serviceCode: '  TRIM-SKU-001  ',
          quantity: 1,
          unitPriceInCents: 1000,
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.description).toBe('Trimmed Description');
        expect(result.serviceCode).toBe('TRIM-SKU-001');
        expect(result.quantity).toBe(1);
        expect(result.unitPriceInCents).toBe(1000);
      });

      it('should convert string numbers to integers for provided numeric fields', async() => {
        // Arrange
        const data = {
          quantity: '25',
          unitPriceInCents: '12500',
        };

        // Act
        const result = await target.transform(data, editItemInputMetadata);

        // Assert
        expect(result.quantity).toBe(25);
        expect(result.unitPriceInCents).toBe(12500);
        expect(typeof result.quantity).toBe('number');
        expect(typeof result.unitPriceInCents).toBe('number');
      });
    });
  });
});
