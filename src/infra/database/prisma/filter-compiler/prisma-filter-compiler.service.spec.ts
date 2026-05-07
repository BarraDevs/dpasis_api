import { Test } from '@nestjs/testing';
import { PrismaFilterCompilerService } from './prisma-filter-compiler.service';

describe('PrismaFilterCompilerService - Unit tests', () => {
  let sut: PrismaFilterCompilerService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [PrismaFilterCompilerService],
    }).compile();

    sut = module.get(PrismaFilterCompilerService);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('compileWhereFragments', () => {
    it('should return empty array for undefined filter', () => {
      expect(sut.compileWhereFragments(undefined)).toEqual([]);
    });

    it('should return empty array for empty object', () => {
      expect(sut.compileWhereFragments({})).toEqual([]);
    });

    it('should skip non-object field values', () => {
      expect(sut.compileWhereFragments({ a: 'x', b: null, c: 1 } as Record<string, unknown>)).toEqual([]);
    });

    it('should combine multiple fields as separate fragments', () => {
      const result = sut.compileWhereFragments({
        groupId: { in: [1, 2] },
        active: { eq: true },
      });
      expect(result).toEqual([
        { groupId: { in: [1, 2] } },
        { active: { equals: true } },
      ]);
    });
  });

  describe('compileFieldFragment — int', () => {
    it('should map in', () => {
      expect(sut.compileFieldFragment('id', { in: [1, 2, 3] })).toEqual({ id: { in: [1, 2, 3] } });
    });

    it('should map eq and gte', () => {
      expect(sut.compileFieldFragment('groupId', { eq: 5, gte: 1 })).toEqual({ groupId: { equals: 5, gte: 1 } });
    });

    it('should map ne', () => {
      expect(sut.compileFieldFragment('resaleId', { ne: 9 })).toEqual({ resaleId: { not: { equals: 9 } } });
    });

    it('should map isNull true', () => {
      expect(sut.compileFieldFragment('parentClientId', { isNull: true })).toEqual({ parentClientId: null });
    });

    it('should map isNull false', () => {
      expect(sut.compileFieldFragment('parentClientId', { isNull: false })).toEqual({
        parentClientId: { not: null },
      });
    });
  });

  describe('compileFieldFragment — string', () => {
    it('should map contains with insensitive mode', () => {
      expect(sut.compileFieldFragment('companyName', { contains: 'acme' })).toEqual({
        companyName: { contains: 'acme', mode: 'insensitive' },
      });
    });

    it('should map eq', () => {
      expect(sut.compileFieldFragment('document', { eq: '123' })).toEqual({ document: { equals: '123' } });
    });
  });

  describe('compileFieldFragment — boolean', () => {
    it('should map eq false', () => {
      expect(sut.compileFieldFragment('active', { eq: false })).toEqual({ active: { equals: false } });
    });
  });

  describe('compileFieldFragment — date', () => {
    it('should map gte and lte as Date values', () => {
      const fragment = sut.compileFieldFragment('createdAt', {
        gte: '2026-01-01T00:00:00.000Z',
        lte: '2026-12-31T23:59:59.999Z',
      });
      expect(fragment).toEqual({
        createdAt: {
          gte: new Date('2026-01-01T00:00:00.000Z'),
          lte: new Date('2026-12-31T23:59:59.999Z'),
        },
      });
    });

    it('should fall back to string scalar when eq is not a date', () => {
      expect(sut.compileFieldFragment('document', { eq: 'plain' })).toEqual({ document: { equals: 'plain' } });
    });
  });
});
