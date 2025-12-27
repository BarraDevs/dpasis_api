import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { ProductStockMovementTypeEnum } from 'src/app/product-stock-movement/domain/enums/product-stock-movement.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateProductStockMovementInputDto } from './create-product-stock-movement.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateProductStockMovementInputDto,
};

describe('CreateProductStockMovementInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('productId field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if productId is empty (%s)', async(value: any) => {
      // Arrange
      const data = {
        productId: value,
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: '10',
        unitPriceInCents: '5000',
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('productId é obrigatório');
      });
    });
  });

  describe('type field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if type is empty (%s)', async(value: any) => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: value,
        quantity: '10',
        unitPriceInCents: '5000',
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('type é obrigatório');
      });
    });

    it.each([
      'INVALID',
      'input',
      'output',
      'ENTRADA',
      'SAIDA',
      123,
      true,
    ])('should throw an error if type is not a valid enum value (%s)', async(value: any) => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: value,
        quantity: '10',
        unitPriceInCents: '5000',
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('type must be one of the following values: INPUT, OUTPUT');
      });
    });
  });

  describe('quantity field', () => {
    it.each([
      undefined,
      null,
    ])('should throw an error if quantity is empty (%s)', async(value: any) => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: value,
        unitPriceInCents: '5000',
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('quantity deve ser um número inteiro');
      });
    });

    it.each([
      '0',
      '-1',
      '-10',
      '-100',
    ])('should throw an error if quantity is less than 1 (%s)', async(value: any) => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: value,
        unitPriceInCents: '5000',
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('quantity deve ser maior que zero');
      });
    });

    it.each([
      '1.5',
      '10.75',
      '5.99',
    ])('should throw an error if quantity is not an integer (%s)', async(value: any) => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: value,
        unitPriceInCents: '5000',
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('quantity deve ser um número inteiro');
      });
    });

    it.each([
      'abc',
      'ten',
      'invalid',
      true,
      false,
      {},
      [],
    ])('should throw an error if quantity is not a number (%s)', async(value: any) => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: value,
        unitPriceInCents: '5000',
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('quantity deve ser um número inteiro');
      });
    });
  });

  describe('unitPriceInCents field', () => {
    it.each([
      undefined,
      null,
    ])('should throw an error if unitPriceInCents is empty (%s)', async(value: any) => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: '10',
        unitPriceInCents: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('unitPriceInCents deve ser um número inteiro');
      });
    });

    it.each([
      '-1',
      '-10',
      '-100',
      '-5000',
    ])('should throw an error if unitPriceInCents is negative (%s)', async(value: any) => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: '10',
        unitPriceInCents: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('unitPriceInCents deve ser maior ou igual a zero');
      });
    });

    it.each([
      '1.5',
      '10.75',
      '5.99',
    ])('should throw an error if unitPriceInCents is not an integer (%s)', async(value: any) => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: '10',
        unitPriceInCents: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('unitPriceInCents deve ser um número inteiro');
      });
    });

    it.each([
      'abc',
      'five thousand',
      'invalid',
      true,
      false,
      {},
      [],
    ])('should throw an error if unitPriceInCents is not a number (%s)', async(value: any) => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: '10',
        unitPriceInCents: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('unitPriceInCents deve ser um número inteiro');
      });
    });

    it('should pass if unitPriceInCents is zero', async() => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: '10',
        unitPriceInCents: '0',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CreateProductStockMovementInputDto);
      expect(result.unitPriceInCents).toBe(0);
    });
  });

  describe('valid scenarios', () => {
    it('should pass with all valid fields for INPUT type', async() => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: '50',
        unitPriceInCents: '5000',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CreateProductStockMovementInputDto);
      expect(result.productId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.type).toBe(ProductStockMovementTypeEnum.INPUT);
      expect(result.quantity).toBe(50);
      expect(result.unitPriceInCents).toBe(5000);
    });

    it('should pass with all valid fields for OUTPUT type', async() => {
      // Arrange
      const data = {
        productId: '987e6543-e21b-43d3-a654-426614174999',
        type: ProductStockMovementTypeEnum.OUTPUT,
        quantity: '30',
        unitPriceInCents: '10000',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CreateProductStockMovementInputDto);
      expect(result.productId).toBe('987e6543-e21b-43d3-a654-426614174999');
      expect(result.type).toBe(ProductStockMovementTypeEnum.OUTPUT);
      expect(result.quantity).toBe(30);
      expect(result.unitPriceInCents).toBe(10000);
    });

    it('should convert string numbers to integers', async() => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: '100',
        unitPriceInCents: '7500',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.quantity).toBe(100);
      expect(result.unitPriceInCents).toBe(7500);
      expect(typeof result.quantity).toBe('number');
      expect(typeof result.unitPriceInCents).toBe('number');
    });

    it('should accept numeric values directly', async() => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: 25,
        unitPriceInCents: 3000,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.quantity).toBe(25);
      expect(result.unitPriceInCents).toBe(3000);
    });

    it('should pass with minimum valid values', async() => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: '1',
        unitPriceInCents: '0',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.quantity).toBe(1);
      expect(result.unitPriceInCents).toBe(0);
    });

    it('should pass with large values', async() => {
      // Arrange
      const data = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        type: ProductStockMovementTypeEnum.INPUT,
        quantity: '10000',
        unitPriceInCents: '999999999',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.quantity).toBe(10000);
      expect(result.unitPriceInCents).toBe(999999999);
    });
  });
});
