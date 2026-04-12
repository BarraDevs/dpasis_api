import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { SetClientNextIdInputDto } from './set-client-next-id.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: SetClientNextIdInputDto,
};

function expectMessageToContain(message: string | string[], substring: string) {
  const messages = Array.isArray(message) ? message : [message];
  expect(messages.some(m => m.includes(substring))).toBe(true);
}

function makeValidInputDto(overrides: Partial<SetClientNextIdInputDto> = {}): SetClientNextIdInputDto {
  return {
    nextId: 1,
    ...overrides,
  };
}

describe('SetClientNextIdInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('nextId field', () => {
    it.each([undefined, null])('should throw if nextId is missing (%s)', async(value: unknown) => {
      const data = { ...makeValidInputDto(), nextId: value as number };

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'nextId');
      });
    });

    it.each([0, -1, -10])('should throw if nextId is not positive (%s)', async(value: number) => {
      const data = makeValidInputDto({ nextId: value });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'nextId');
      });
    });

    it('should throw if nextId is not an integer', async() => {
      const data = makeValidInputDto({ nextId: 1.5 });

      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expectMessageToContain(error.getResponse().message, 'nextId');
      });
    });

    it.each([1, 42, 99_999])('should accept valid nextId (%s)', async(nextId: number) => {
      const data = makeValidInputDto({ nextId });

      const result = await target.transform(data, metadata);

      expect(result).toBeInstanceOf(SetClientNextIdInputDto);
      expect(result.nextId).toBe(nextId);
    });
  });
});
