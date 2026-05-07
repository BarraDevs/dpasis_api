import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { SearchClientInputDto } from './search-client.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: SearchClientInputDto,
};

describe('SearchClientInputDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should transform nested filter with groupId in', async() => {
    const data = { page: '1', size: '10', filter: { groupId: { in: [1, 2] } } };
    const result = await target.transform(data, metadata);
    expect(result).toBeInstanceOf(SearchClientInputDto);
    expect(result.page).toBe(1);
    expect(result.size).toBe(10);
    expect(result.filter?.groupId?.in).toEqual([1, 2]);
  });

  it('should strip unknown filter property (whitelist)', async() => {
    const data = { filter: { unknownField: { eq: 1 }, groupId: { eq: 1 } } };
    const result = await target.transform(data, metadata);
    expect(result.filter).toBeDefined();
    expect('unknownField' in (result.filter as object)).toBe(false);
    expect(result.filter?.groupId?.eq).toBe(1);
  });

  it('should accept empty body', async() => {
    const data = {};
    const result = await target.transform(data, metadata);
    expect(result).toBeInstanceOf(SearchClientInputDto);
    expect(result.filter).toBeUndefined();
  });
});
