import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CancelOrderInputDto } from './cancel-order.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CancelOrderInputDto,
};

describe('CancelOrderInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('reason field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if reason is empty (%s)', async(value: any) => {
      // Arrange
      const data = {
        reason: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('reason é obrigatório');
      });
    });

    it.each([
      123,
      true,
      {},
      [],
    ])('should throw an error if reason is not a string (%s)', async(value: any) => {
      // Arrange
      const data = {
        reason: value,
      };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('reason deve ser uma string');
      });
    });

    it('should trim whitespace from reason', async() => {
      // Arrange
      const reason = 'Motivo teste';
      const data = {
        reason: `  ${reason}  `,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
      expect(result.reason).toBe(reason);
    });
  });

  describe('observation field', () => {
    it('should accept undefined for observation', async() => {
      // Arrange
      const data = {
        reason: 'Motivo teste',
        observation: undefined,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
      expect(result.observation).toBeUndefined();
    });

    it('should accept valid string for observation', async() => {
      // Arrange
      const observation = 'Iniciando produção conforme planejamento';
      const data = {
        reason: 'Motivo teste',
        observation,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
      expect(result.observation).toBe(observation);
    });

    it('should accept empty string for observation', async() => {
      // Arrange
      const data = {
        reason: 'Motivo teste',
        observation: '',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
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
        reason: 'Motivo teste',
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
        reason: 'Motivo teste',
        observation: `  ${observation}  `,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
      expect(result.observation).toBe(observation);
    });

    it('should accept null for observation (treated as undefined)', async() => {
      // Arrange
      const data = {
        reason: 'Motivo teste',
        observation: null,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
    });
  });

  describe('Complete DTO validation', () => {
    it('should pass with all required fields', async() => {
      // Arrange
      const data = {
        reason: 'Motivo teste',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
      expect(result.reason).toBe('Motivo teste');
      expect(result.observation).toBeUndefined();
    });

    it('should pass with all fields including optional observation', async() => {
      // Arrange
      const data = {
        reason: 'Motivo teste',
        observation: 'Starting production as planned',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
      expect(result.reason).toBe('Motivo teste');
      expect(result.observation).toBe('Starting production as planned');
    });

    it('should apply transformations (trim) to all string fields', async() => {
      // Arrange
      const data = {
        reason: '  Motivo teste  ',
        observation: '  Test observation  ',
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
      expect(result.reason).toBe('Motivo teste');
      expect(result.observation).toBe('Test observation');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long observation string', async() => {
      // Arrange
      const longObservation = 'A'.repeat(1000);
      const data = {
        reason: 'Motivo teste',
        observation: longObservation,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
      expect(result.observation).toBe(longObservation);
      expect(result.observation?.length).toBe(1000);
    });

    it('should handle observation with special characters', async() => {
      // Arrange
      const specialObservation = 'Test with special chars: @#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const data = {
        reason: 'Motivo teste',
        observation: specialObservation,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
      expect(result.observation).toBe(specialObservation);
    });

    it('should handle observation with newlines and tabs', async() => {
      // Arrange
      const multilineObservation = 'Line 1\nLine 2\tTabbed';
      const data = {
        reason: 'Motivo teste',
        observation: multilineObservation,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
      expect(result.observation).toBe(multilineObservation);
    });

    it('should handle observation with unicode characters', async() => {
      // Arrange
      const unicodeObservation = 'Produção iniciada com sucesso! 🚀 ✅ 日本語';
      const data = {
        reason: 'Motivo teste',
        observation: unicodeObservation,
      };

      // Act
      const result = await target.transform(data, metadata);

      // Assert
      expect(result).toBeInstanceOf(CancelOrderInputDto);
      expect(result.observation).toBe(unicodeObservation);
    });
  });
});
