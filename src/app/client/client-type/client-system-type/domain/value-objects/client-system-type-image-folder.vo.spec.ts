import { ClientSystemTypeImageFolder } from './client-system-type-image-folder.vo';

describe('ClientSystemTypeImageFolder', () => {
  it('should return client-system-types as value', () => {
    const sut = new ClientSystemTypeImageFolder();
    expect(sut.value).toBe('client-system-types');
  });

  it('should return the same value on multiple calls', () => {
    const sut = new ClientSystemTypeImageFolder();

    expect(sut.value).toBe('client-system-types');
    expect(sut.value).toBe('client-system-types');
    expect(sut.value).toBe('client-system-types');
  });
});
