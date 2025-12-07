import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditSellerInputDto } from './edit-seller.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditSellerInputDto,
};

describe('EditSellerInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe.each(
    [
      'name',
      'nickname',
      'phone',
      'cellphone',
      'zipCode',
      'street',
      'number',
      'neighborhood',
      'city',
      'state',
    ]
  )('%s field', (field: string) => {
    it.each(
      [
        123,
        true,
        false,
        {},
        [],
      ]
    )('should throw an error if %s is not a string (%s)', async(value: any) => {
      // Arrange
      const data = { [field]: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ser uma string`);
      });
    });

    it(`should throw an error if ${field} exceeds maximum length`, async() => {
      // Arrange
      const data = { [field]: 'a'.repeat(257) };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain(`${field} deve ter no máximo 256 caracteres`);
      });
    });
  });

  describe('email field', () => {
    it('should throw an error if email is not valid', async() => {
      // Arrange
      const data = { email: 'invalid-email' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('email deve ser um email válido');
      });
    });

    it('should accept valid email', async() => {
      // Arrange
      const data = { email: 'valid@email.com' };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.email).toBe('valid@email.com');
    });
  });

  describe('commission field', () => {
    it('should throw an error if commission is negative', async() => {
      // Arrange
      const data = { commission: -1 };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('commission deve ser maior ou igual a 0');
      });
    });

    it('should throw an error if commission is greater than 100', async() => {
      // Arrange
      const data = { commission: 101 };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('commission deve ser menor ou igual a 100');
      });
    });

    it('should accept valid commission', async() => {
      // Arrange
      const data = { commission: 50 };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.commission).toBe(50);
    });
  });

  describe('companyIds field', () => {
    it('should throw an error if companyIds is not an array', async() => {
      // Arrange
      const data = { companyIds: 'not-an-array' };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ser um array');
      });
    });

    it('should throw an error if companyIds is an empty array', async() => {
      // Arrange
      const data = { companyIds: [] };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ter ao menos 1 item');
      });
    });

    it('should throw an error if companyIds contains non-string items', async() => {
      // Arrange
      const data = { companyIds: ['valid-id', 123, true] };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('companyIds deve ser uma string');
      });
    });

    it('should accept valid companyIds array', async() => {
      // Arrange
      const data = { companyIds: ['company-id-1', 'company-id-2'] };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result.companyIds).toEqual(['company-id-1', 'company-id-2']);
    });
  });

  it('should pass with empty object (all fields optional)', async() => {
    // Arrange
    const data = {};

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditSellerInputDto);
  });

  it('should pass with partial update - name only', async() => {
    // Arrange
    const data = {
      name: 'Updated Name',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditSellerInputDto);
    expect(result.name).toBe('Updated Name');
  });

  it('should pass with partial update - commission only', async() => {
    // Arrange
    const data = {
      commission: 25,
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditSellerInputDto);
    expect(result.commission).toBe(25);
  });

  it('should pass with partial update - multiple fields', async() => {
    // Arrange
    const data = {
      name: 'Updated Name',
      commission: 20,
      email: 'new@email.com',
      city: 'New City',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(EditSellerInputDto);
    expect(result.name).toBe('Updated Name');
    expect(result.commission).toBe(20);
    expect(result.email).toBe('new@email.com');
    expect(result.city).toBe('New City');
  });
});
