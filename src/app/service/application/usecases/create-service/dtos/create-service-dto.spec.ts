import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateServiceInputDto } from './create-service.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateServiceInputDto,
};

describe('CreateServiceInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should validate with all required fields', async() => {
    // Arrange
    const data: CreateServiceInputDto = {
      name: 'Manutenção Preventiva',
      nickname: 'Manutenção',
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      categoryId: '550e8400-e29b-41d4-a716-446655440001',
      productIds: [
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
      ],
      deadline: '5 dias úteis',
      shippingValueInCents: 1500,
      warrant: '90 dias',
      weight: 'até 10kg',
      maxVolume: 'até 0.5m³',
      dimensions: '50x40x30',
      commission: 10,
      valueInCents: 25000,
      description: 'Serviço de manutenção preventiva',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(CreateServiceInputDto);
    expect(result).toEqual(data);
  });

  describe('productIds validation', () => {
    it('should reject when productIds has less than 2 items', async() => {
      // Arrange
      const data = {
        productIds: ['550e8400-e29b-41d4-a716-446655440002'],
      };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('productIds deve conter exatamente 2 itens');
      });
    });

    it('should reject when productIds has more than 2 items', async() => {
      // Arrange
      const data = {
        productIds: [
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
          '550e8400-e29b-41d4-a716-446655440004',
          '550e8400-e29b-41d4-a716-446655440004',
        ],
      };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('productIds deve conter exatamente 2 itens');
      });
    });

    it('should reject when productIds has duplicates', async() => {
      // Arrange
      const data = {
        productIds: [
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
      };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('productIds não deve conter itens duplicados');
      });
    });
  });

  describe('commission validation', () => {
    it('should reject when commission is above 100', async() => {
      // Arrange
      const data = { commission: 101 };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('commission deve ser menor ou igual a 100');
      });
    });

    it('should reject when commission is negative', async() => {
      // Arrange
      const data = { commission: -1 };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('commission deve ser maior ou igual a 0');
      });
    });
  });

  describe('valueInCents validation', () => {
    it('should reject when valueInCents is negative', async() => {
      // Arrange
      const data = { valueInCents: -1 };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('valueInCents deve ser maior ou igual a 0');
      });
    });

    it('should reject when valueInCents is not an integer', async() => {
      // Arrange
      const data = { valueInCents: '100.5' };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('valueInCents deve ser um número inteiro');
      });
    });

    it('should accept valueInCents as 0', async() => {
      // Arrange
      const data = { valueInCents: 0 };

      // Act & Assert
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain('valueInCents');
      });
    });
  });

  describe('shippingValueInCents validation', () => {
    it('should reject when shippingValueInCents is negative', async() => {
      // Arrange
      const data = { shippingValueInCents: -1 };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('shippingValueInCents deve ser maior ou igual a 0');
      });
    });

    it('should reject when shippingValueInCents is not an integer', async() => {
      // Arrange
      const data = { shippingValueInCents: '100.5' };

      // Act & Assert
      expect.assertions(1);
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('shippingValueInCents deve ser um número inteiro');
      });
    });

    it('should accept shippingValueInCents as 0', async() => {
      // Arrange
      const data = { shippingValueInCents: 0 };

      // Act & Assert
      await target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).not.toContain('shippingValueInCents');
      });
    });
  });
});
