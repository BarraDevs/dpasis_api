import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { RejectBudgetInputDto } from './reject-budget.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: RejectBudgetInputDto,
};

describe('RejectBudgetInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('reason field', () => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )('should throw an error if reason is empty (%s)', async(value: any) => {
      const data = { reason: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('reason é obrigatório');
      });
    });

    it.each(
      [
        123,
        true,
        false,
        {},
        [],
      ]
    )('should throw an error if reason is not a string (%s)', async(value: any) => {
      const data = { reason: value };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('reason deve ser uma string');
      });
    });

    it('should throw an error if reason exceeds 512 characters', async() => {
      const data = { reason: 'a'.repeat(513) };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('reason deve ter no máximo 512 caracteres');
      });
    });

    it('should trim whitespace from reason', async() => {
      const data = { reason: '  Preço muito alto  ', accountId: '550e8400-e29b-41d4-a716-446655440000' };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(RejectBudgetInputDto);
      expect(result.reason).toBe('Preço muito alto');
    });
  });

  describe('accountId field', () => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )('should throw an error if accountId is empty (%s)', async(value: any) => {
      const data = {
        reason: 'Valid reason',
        accountId: value,
      };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('accountId é obrigatório');
      });
    });

    it.each(
      [
        123,
        true,
        false,
        {},
        [],
      ]
    )('should throw an error if accountId is not a string (%s)', async(value: any) => {
      const data = {
        reason: 'Valid reason',
        accountId: value,
      };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('accountId deve ser um UUID válido');
      });
    });

    it('should throw an error if accountId is not a valid UUID', async() => {
      const data = {
        reason: 'Valid reason',
        accountId: 'invalid-uuid-format',
      };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('accountId deve ser um UUID válido');
      });
    });

    it('should throw an error if accountId is a UUID v1 (not v4)', async() => {
      const data = {
        reason: 'Valid reason',
        accountId: 'a0eebc99-9c0b-11d6-a4ec-00ff0d0d9c34', // UUID v1
      };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('accountId deve ser um UUID válido');
      });
    });

    it('should accept a valid UUID v4', async() => {
      const data = {
        reason: 'Valid reason',
        accountId: '550e8400-e29b-41d4-a716-446655440000', // UUID v4
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(RejectBudgetInputDto);
      expect(result.accountId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should trim whitespace from accountId', async() => {
      const data = {
        reason: 'Valid reason',
        accountId: '  550e8400-e29b-41d4-a716-446655440000  ',
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(RejectBudgetInputDto);
      expect(result.accountId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('valid cases', () => {
    it('should pass if both required fields are valid', async() => {
      const data = {
        reason: 'Preço muito alto',
        accountId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(RejectBudgetInputDto);
      expect(result).toEqual(data);
    });

    it('should pass if reason has exactly 512 characters', async() => {
      const data = {
        reason: 'a'.repeat(512),
        accountId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(RejectBudgetInputDto);
      expect(result.reason).toHaveLength(512);
    });

    it('should pass with a short reason', async() => {
      const data = {
        reason: 'Cliente desistiu',
        accountId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(RejectBudgetInputDto);
      expect(result).toEqual(data);
    });

    it('should pass with a detailed reason', async() => {
      const data = {
        reason: 'Cliente solicitou orçamento em outra empresa devido ao prazo de entrega ser muito longo e as condições de pagamento não atenderem suas necessidades atuais',
        accountId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(RejectBudgetInputDto);
      expect(result).toEqual(data);
    });

    it('should pass with special characters in reason', async() => {
      const data = {
        reason: 'Preço R$ 10.000,00 acima do orçamento (limite: R$ 8.500,00)',
        accountId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(RejectBudgetInputDto);
      expect(result).toEqual(data);
    });

    it('should pass with line breaks in reason', async() => {
      const data = {
        reason: 'Motivos da rejeição:\n1. Preço alto\n2. Prazo longo',
        accountId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(RejectBudgetInputDto);
      expect(result).toEqual(data);
    });

    it('should pass with different valid UUIDs', async() => {
      const data = {
        reason: 'Valid reason',
        accountId: '123e4567-e89b-42d3-a456-426614174000',
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(RejectBudgetInputDto);
      expect(result.accountId).toBe('123e4567-e89b-42d3-a456-426614174000');
    });

    it('should trim both reason and accountId', async() => {
      const data = {
        reason: '  Preço muito alto  ',
        accountId: '  550e8400-e29b-41d4-a716-446655440000  ',
      };

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(RejectBudgetInputDto);
      expect(result.reason).toBe('Preço muito alto');
      expect(result.accountId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });
});
