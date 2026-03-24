import { hasAnyPositiveReference } from './has-any-positive-reference';

describe('hasAnyPositiveReference', () => {
  it('returns false when there are no counters', async() => {
    await expect(hasAnyPositiveReference([])).resolves.toBe(false);
  });

  it('returns false when all counters return zero', async() => {
    const result = await hasAnyPositiveReference([async() => 0, async() => 0]);
    expect(result).toBe(false);
  });

  it('returns true when the first counter returns a positive number', async() => {
    const result = await hasAnyPositiveReference([async() => 3]);
    expect(result).toBe(true);
  });

  it('returns true when a later counter returns positive without calling subsequent counters', async() => {
    const third = jest.fn(async() => 1);
    const fourth = jest.fn(async() => 99);
    const result = await hasAnyPositiveReference([
      async() => 0,
      async() => 0,
      third,
      fourth,
    ]);
    expect(result).toBe(true);
    expect(third).toHaveBeenCalledTimes(1);
    expect(fourth).not.toHaveBeenCalled();
  });

  it('does not call counters after the first positive', async() => {
    const after = jest.fn(async() => 0);
    const result = await hasAnyPositiveReference([async() => 2, after]);
    expect(result).toBe(true);
    expect(after).not.toHaveBeenCalled();
  });
});
