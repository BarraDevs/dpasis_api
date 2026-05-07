import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { SearchRequestDto } from './search-request.dto';

/** Classe concreta mínima para exercitar validações da base abstrata. */
class TestSearchBodyDto extends SearchRequestDto {}

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: TestSearchBodyDto,
};

function makeSearchRequest(overrides: Partial<{ page: unknown; size: unknown }> = {}): Record<string, unknown> {
  return { ...overrides };
}

describe('SearchRequestDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should be defined', () => {
    expect(target).toBeDefined();
  });

  it('should accept empty body', async() => {
    const result = await target.transform(makeSearchRequest(), metadata);
    expect(result).toBeInstanceOf(TestSearchBodyDto);
    expect(result.page).toBeUndefined();
    expect(result.size).toBeUndefined();
  });

  it('should coerce page and size from numeric strings', async() => {
    const result = await target.transform(makeSearchRequest({ page: '1', size: '10' }), metadata);

    expect(result.page).toBe(1);
    expect(result.size).toBe(10);
  });

  it.each([
    ['page', 0, 'page deve ser um número positivo'],
    ['size', -1, 'size deve ser um número positivo'],
  ] as const)('should reject non-positive %s', async(field, value, expectedFragment) => {
    const data = makeSearchRequest({ [field]: value });

    expect.assertions(1);
    return target.transform(data, metadata).catch((error: { getResponse(): { message: unknown } }) => {
      expect(error.getResponse().message).toContain(expectedFragment);
    });
  });

  it.each([
    ['page', '1.5', 'page deve ser um número inteiro'],
    ['size', 'x', 'size deve ser um número inteiro'],
  ] as const)('should reject invalid integer %s', async(field, value, expectedFragment) => {
    const data = makeSearchRequest({ [field]: value });

    expect.assertions(1);
    return target.transform(data, metadata).catch((error: { getResponse(): { message: unknown } }) => {
      expect(error.getResponse().message).toContain(expectedFragment);
    });
  });
});
