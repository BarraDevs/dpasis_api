import { CacheFakeAdapterGateway } from './cache-fake.gateway';

describe('CacheFakeAdapterGateway - Unit tests', () => {
  let sut: CacheFakeAdapterGateway;

  beforeEach(() => {
    sut = new CacheFakeAdapterGateway();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('setIfAbsent', () => {
    it('should grant the first claim and refuse the second for the same key', async() => {
      // Act
      const first = await sut.setIfAbsent('k', 'v', 60);
      const second = await sut.setIfAbsent('k', 'v', 60);

      // Assert
      expect(first).toBe(true);
      expect(second).toBe(false);
    });

    it('should treat different keys independently', async() => {
      // Act & Assert
      expect(await sut.setIfAbsent('a', 'v', 60)).toBe(true);
      expect(await sut.setIfAbsent('b', 'v', 60)).toBe(true);
    });
  });
});
