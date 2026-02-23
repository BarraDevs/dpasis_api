import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { CreateFaqInputDto } from './create-faq.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateFaqInputDto,
};

function makeValidInputDto(overrides: Partial<CreateFaqInputDto> = {}): CreateFaqInputDto {
  return {
    question: 'Como faço para recuperar minha senha?',
    answer: 'Clique em "Esqueci minha senha" na tela de login.',
    ...overrides,
  };
}

describe('CreateFaqInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('question field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if question is empty (%s)', async(value: any) => {
      const data = makeValidInputDto({ question: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('question é obrigatório');
      });
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if question is not a string (%s)', async(value: any) => {
      const data = makeValidInputDto({ question: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('question deve ser uma string');
      });
    });

    it('should throw an error if question exceeds 512 characters', async() => {
      const data = makeValidInputDto({ question: 'a'.repeat(513) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('question deve ter no máximo 512 caracteres');
      });
    });

    it('should trim whitespace from question', async() => {
      const data = makeValidInputDto({ question: '  Valid question?  ' });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Valid question?');
    });

    it('should accept valid question', async() => {
      const data = makeValidInputDto({ question: 'Como recuperar senha?' });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Como recuperar senha?');
    });
  });

  describe('answer field', () => {
    it.each([
      undefined,
      null,
      '',
      '  ',
    ])('should throw an error if answer is empty (%s)', async(value: any) => {
      const data = makeValidInputDto({ answer: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('answer é obrigatório');
      });
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if answer is not a string (%s)', async(value: any) => {
      const data = makeValidInputDto({ answer: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('answer deve ser uma string');
      });
    });

    it('should throw an error if answer exceeds 8192 characters', async() => {
      const data = makeValidInputDto({ answer: 'a'.repeat(8193) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('answer deve ter no máximo 8192 caracteres');
      });
    });

    it('should trim whitespace from answer', async() => {
      const data = makeValidInputDto({ answer: '  Valid answer.  ' });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe('Valid answer.');
    });

    it('should accept valid answer', async() => {
      const data = makeValidInputDto({ answer: 'Clique em esqueci senha.' });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe('Clique em esqueci senha.');
    });
  });

  describe('all fields validation', () => {
    it('should pass if all fields are valid', async() => {
      const data = makeValidInputDto({
        question: 'Como faço para recuperar minha senha?',
        answer: 'Clique em "Esqueci minha senha" na tela de login.',
      });

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(CreateFaqInputDto);
      expect(result.question).toBe('Como faço para recuperar minha senha?');
      expect(result.answer).toBe('Clique em "Esqueci minha senha" na tela de login.');
    });

    it('should accept boundary values for question (512 chars)', async() => {
      const question = 'a'.repeat(512);
      const data = makeValidInputDto({ question });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe(question);
    });

    it('should accept boundary values for answer (8192 chars)', async() => {
      const answer = 'a'.repeat(8192);
      const data = makeValidInputDto({ answer });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe(answer);
    });
  });
});
