import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { EditFaqInputDto } from './edit-faq.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: EditFaqInputDto,
};

function makeValidInputDto(overrides: Partial<EditFaqInputDto> = {}): EditFaqInputDto {
  return {
    ...overrides,
  };
}

describe('EditFaqInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('question field', () => {
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
        expect(error.getResponse().message).toContain('question must be a string');
      });
    });

    it('should throw an error if question exceeds 512 characters', async() => {
      const data = makeValidInputDto({ question: 'a'.repeat(513) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('question must be shorter than or equal to 512 characters');
      });
    });

    it('should accept valid question', async() => {
      const data = makeValidInputDto({ question: 'Nova pergunta?' });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Nova pergunta?');
    });

    it('should trim whitespace from question', async() => {
      const data = makeValidInputDto({ question: '  Nova pergunta?  ' });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Nova pergunta?');
    });

    it('should be optional', async() => {
      const data = makeValidInputDto({ question: undefined });

      const result = await target.transform(data, metadata);

      expect(result.question).toBeUndefined();
    });
  });

  describe('answer field', () => {
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
        expect(error.getResponse().message).toContain('answer must be a string');
      });
    });

    it('should throw an error if answer exceeds 8192 characters', async() => {
      const data = makeValidInputDto({ answer: 'a'.repeat(8193) });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('answer must be shorter than or equal to 8192 characters');
      });
    });

    it('should accept valid answer', async() => {
      const data = makeValidInputDto({ answer: 'Nova resposta.' });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe('Nova resposta.');
    });

    it('should trim whitespace from answer', async() => {
      const data = makeValidInputDto({ answer: '  Nova resposta.  ' });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe('Nova resposta.');
    });

    it('should be optional', async() => {
      const data = makeValidInputDto({ answer: undefined });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBeUndefined();
    });
  });

  describe('all fields validation', () => {
    it('should pass with empty object', async() => {
      const data = makeValidInputDto({});

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(EditFaqInputDto);
    });

    it('should pass with only question', async() => {
      const data = makeValidInputDto({ question: 'Nova pergunta?' });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Nova pergunta?');
      expect(result.answer).toBeUndefined();
    });

    it('should pass with only answer', async() => {
      const data = makeValidInputDto({ answer: 'Nova resposta.' });

      const result = await target.transform(data, metadata);

      expect(result.answer).toBe('Nova resposta.');
      expect(result.question).toBeUndefined();
    });

    it('should pass with all fields', async() => {
      const data = makeValidInputDto({
        question: 'Pergunta atualizada?',
        answer: 'Resposta atualizada.',
      });

      const result = await target.transform(data, metadata);

      expect(result.question).toBe('Pergunta atualizada?');
      expect(result.answer).toBe('Resposta atualizada.');
    });
  });
});
