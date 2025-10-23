import { CacheKeyBuilder } from './cache-key.builder';

describe('CacheKeyBuilder', () => {
  let sut: CacheKeyBuilder;

  beforeEach(() => {
    sut = new CacheKeyBuilder();
  });

  it('should throw an error if resource is not provided', () => {
    // Act
    const act = () => sut.build();

    // Assert
    expect(act).toThrow('Resource é obrigatório');
  });

  it('should throw an error if command is not provided', () => {
    // Act
    const act = () => sut.setResource('account').build();

    // Assert
    expect(act).toThrow('Command é obrigatório');
  });

  it.each(
    [
      { accountId: undefined, resource: 'account', command: 'list', data: undefined, expected: 'cache:global:account:list' },
      { accountId: undefined, resource: 'account', command: 'list', data: {}, expected: 'cache:global:account:list:{}' },
      { accountId: undefined, resource: 'account', command: 'list', data: { page: 1, size: 10 }, expected: 'cache:global:account:list:{"page":1,"size":10}' },
      { accountId: undefined, resource: 'account', command: 'detail', data: '123', expected: 'cache:global:account:detail:123' },
      { accountId: '', resource: 'category', command: 'list', data: undefined, expected: 'cache:global:category:list' },
      { accountId: '', resource: 'category', command: 'list', data: {}, expected: 'cache:global:category:list:{}' },
      { accountId: '', resource: 'category', command: 'list', data: { page: 1, size: 10 }, expected: 'cache:global:category:list:{"page":1,"size":10}' },
      { accountId: '', resource: 'category', command: 'detail', data: 'abc123', expected: 'cache:global:category:detail:abc123' },
      { resource: 'banner', command: 'list', data: undefined, expected: 'cache:global:banner:list' },
      { resource: 'banner', command: 'list', data: {}, expected: 'cache:global:banner:list:{}' },
      { resource: 'banner', command: 'list', data: { search: 'xpto' }, expected: 'cache:global:banner:list:{"search":"xpto"}' },
      { resource: 'banner', command: 'detail', data: 'random-id', expected: 'cache:global:banner:detail:random-id' },

      { accountId: 'acc-id', resource: 'account', command: 'list', data: undefined, expected: 'cache:acc-id:account:list' },
      { accountId: 'acc-id', resource: 'account', command: 'list', data: {}, expected: 'cache:acc-id:account:list:{}' },
      { accountId: 'acc-id', resource: 'account', command: 'list', data: { page: 1, size: 10 }, expected: 'cache:acc-id:account:list:{"page":1,"size":10}' },
      { accountId: 'acc-id', resource: 'account', command: 'detail', data: '123', expected: 'cache:acc-id:account:detail:123' },
      { accountId: 'acc-id', resource: 'category', command: 'list', data: undefined, expected: 'cache:acc-id:category:list' },
      { accountId: 'acc-id', resource: 'category', command: 'list', data: {}, expected: 'cache:acc-id:category:list:{}' },
      { accountId: 'acc-id', resource: 'category', command: 'list', data: { page: 1, size: 10 }, expected: 'cache:acc-id:category:list:{"page":1,"size":10}' },
      { accountId: 'acc-id', resource: 'category', command: 'detail', data: 'abc123', expected: 'cache:acc-id:category:detail:abc123' },
      { accountId: 'acc-id', resource: 'banner', command: 'list', data: undefined, expected: 'cache:acc-id:banner:list' },
      { accountId: 'acc-id', resource: 'banner', command: 'list', data: {}, expected: 'cache:acc-id:banner:list:{}' },
      { accountId: 'acc-id', resource: 'banner', command: 'list', data: { search: 'xpto' }, expected: 'cache:acc-id:banner:list:{"search":"xpto"}' },
      { accountId: 'acc-id', resource: 'banner', command: 'detail', data: 'random-id', expected: 'cache:acc-id:banner:detail:random-id' },
    ]
  )('should build correct cache key', (data: any) => {
    // Act
    const result = sut
      .setAccount(data.accountId)
      .setResource(data.resource)
      .setCommand(data.command, data.data)
      .build();

    // Assert
    expect(result).toBe(data.expected);
  });
});
