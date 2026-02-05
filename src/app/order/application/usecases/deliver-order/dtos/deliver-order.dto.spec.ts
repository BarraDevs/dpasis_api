import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { DeliverOrderInputDto } from './deliver-order.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: DeliverOrderInputDto,
};

describe('DeliverOrderInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('observation field', () => {
    it('should accept undefined for observation', async() => {
      // Arrange
      const data = {
        observation: undefined,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(DeliverOrderInputDto);
      expect(result.observation).toBeUndefined();
    });

    it('should accept valid string for observation', async() => {
      // Arrange
      const observation = 'Test observation';
      const data = {
        observation,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(DeliverOrderInputDto);
      expect(result.observation).toBe(observation);
    });

    it('should accept empty string for observation', async() => {
      // Arrange
      const data = {
        observation: '',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(DeliverOrderInputDto);
      expect(result.observation).toBe('');
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if observation is not a string (%s)', async(value: any) => {
      // Arrange
      const data = {
        observation: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('observation deve ser uma string');
      });
    });

    it('should trim whitespace from observation', async() => {
      // Arrange
      const observation = 'Test observation';
      const data = {
        observation: `  ${observation}  `,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(DeliverOrderInputDto);
      expect(result.observation).toBe(observation);
    });

    it('should accept null for observation (treated as undefined)', async() => {
      // Arrange
      const data = {
        observation: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(DeliverOrderInputDto);
    });

    it('should handle very long observation string', async() => {
      // Arrange
      const longObservation = 'A'.repeat(1000);
      const data = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        accountId: '550e8400-e29b-41d4-a716-446655440001',
        observation: longObservation,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(DeliverOrderInputDto);
      expect(result.observation).toBe(longObservation);
      expect(result.observation?.length).toBe(1000);
    });

    it('should handle observation with special characters', async() => {
      // Arrange
      const specialObservation = 'Test with special chars: @#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const data = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        accountId: '550e8400-e29b-41d4-a716-446655440001',
        observation: specialObservation,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(DeliverOrderInputDto);
      expect(result.observation).toBe(specialObservation);
    });

    it('should handle observation with newlines and tabs', async() => {
      // Arrange
      const multilineObservation = 'Line 1\nLine 2\tTabbed';
      const data = {
        orderId: '550e8400-e29b-41d4-a716-446655440000',
        accountId: '550e8400-e29b-41d4-a716-446655440001',
        observation: multilineObservation,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(DeliverOrderInputDto);
      expect(result.observation).toBe(multilineObservation);
    });

    it('should handle observation with unicode characters', async() => {
      // Arrange
      const unicodeObservation = 'Produção iniciada com sucesso! 🚀 ✅ 日本語';
      const data = { observation: unicodeObservation };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(DeliverOrderInputDto);
      expect(result.observation).toBe(unicodeObservation);
    });
  });
});
