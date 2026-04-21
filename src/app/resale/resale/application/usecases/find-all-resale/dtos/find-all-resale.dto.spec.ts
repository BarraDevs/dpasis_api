import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllResaleQueryDto } from './find-all-resale.dto';

const queryMetadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllResaleQueryDto,
};

describe('FindAllResaleQueryDto', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe(pipeOptions);
  });

  it('should accept empty query', async() => {
    const result = await pipe.transform({}, queryMetadata);

    expect(result).toBeInstanceOf(FindAllResaleQueryDto);
    expect(result).toEqual({});
  });

  it('should inherit page and size coercion from Queries', async() => {
    const result = await pipe.transform({ page: '2', size: '5' }, queryMetadata);

    expect(result.page).toBe(2);
    expect(result.size).toBe(5);
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('should coerce active from string %s', async(raw, expected) => {
    const result = await pipe.transform({ active: raw }, queryMetadata);

    expect(result.active).toBe(expected);
  });

  it('should accept active as boolean', async() => {
    const result = await pipe.transform({ active: true }, queryMetadata);

    expect(result.active).toBe(true);
  });

  it('should trim search', async() => {
    const result = await pipe.transform({ search: '  termo  ' }, queryMetadata);

    expect(result.search).toBe('termo');
  });

  it('should reject when active is not coercible to boolean', async() => {
    await expect(
      pipe.transform({ active: 'maybe' }, queryMetadata),
    ).rejects.toBeDefined();
  });

  it('should pass combined filters', async() => {
    const result = await pipe.transform(
      {
        page: '1',
        size: '10',
        search: 'revenda',
        active: 'true',
      },
      queryMetadata,
    );

    expect(result).toEqual({
      page: 1,
      size: 10,
      search: 'revenda',
      active: true,
    });
  });
});
