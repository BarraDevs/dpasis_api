import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type WhereFragment = Record<string, unknown>;

/**
 * Converte DTOs de filtro genéricos em fragmentos de `where` tipados pelo Prisma.
 * Cada fragmento cobre tipicamente um campo; o DAO deve compor com `{ AND: fragments }`.
 */
@Injectable()
export class PrismaFilterCompilerService {
  public compileWhereFragments<WhereInput extends object>(
    filter: Record<string, unknown> | undefined,
  ): WhereInput[] {
    return this.compileFilterFragments(filter) as WhereInput[];
  }

  /** Expõe o compilador de um único campo (útil em testes e extensões). */
  public compileFieldFragment(field: string, o: Record<string, unknown>): WhereFragment | null {
    return this.compileOneFieldFragment(field, o);
  }

  private compileFilterFragments(filter: Record<string, unknown> | undefined): WhereFragment[] {
    if (!filter || !this.isPlainObject(filter)) {
      return [];
    }
    const conditions: WhereFragment[] = [];
    for (const [field, ops] of Object.entries(filter)) {
      if (!this.isPlainObject(ops)) {
        continue;
      }
      const fragment = this.compileOneFieldFragment(field, ops);
      if (fragment != null) {
        conditions.push(fragment);
      }
    }
    return conditions;
  }

  private compileOneFieldFragment(field: string, o: Record<string, unknown>): WhereFragment | null {
    if (o.isNull === true) {
      return { [field]: null };
    }
    if (o.isNull === false) {
      return { [field]: { not: null } };
    }

    const hasStringPattern = o.contains != null || o.startsWith != null || o.endsWith != null;
    const hasIntPattern =
      typeof o.eq === 'number' ||
      typeof o.ne === 'number' ||
      typeof o.gt === 'number' ||
      typeof o.gte === 'number' ||
      typeof o.lt === 'number' ||
      typeof o.lte === 'number' ||
      (Array.isArray(o.in) && o.in.length > 0 && typeof o.in[0] === 'number') ||
      (Array.isArray(o.notIn) && o.notIn.length > 0 && typeof o.notIn[0] === 'number');

    if (typeof o.eq === 'boolean') {
      const inner: Prisma.BoolFilter = { equals: o.eq };
      return { [field]: inner };
    }

    if (hasIntPattern) {
      const inner = this.buildIntInner(o);
      return Object.keys(inner).length > 0 ? { [field]: inner } : null;
    }

    if (hasStringPattern) {
      const inner = this.buildStringInner(o);
      return Object.keys(inner).length > 0 ? { [field]: inner } : null;
    }

    const hasDateCandidate =
      typeof o.gt === 'string' ||
      typeof o.gte === 'string' ||
      typeof o.lt === 'string' ||
      typeof o.lte === 'string' ||
      (typeof o.eq === 'string' && this.isLikelyDateFilterString(o.eq)) ||
      (typeof o.ne === 'string' && this.isLikelyDateFilterString(o.ne)) ||
      (Array.isArray(o.in) &&
        o.in.length > 0 &&
        typeof o.in[0] === 'string' &&
        this.isLikelyDateFilterString(o.in[0] as string));

    if (hasDateCandidate) {
      const dateInner = this.tryBuildDateInner(o);
      if (dateInner != null) {
        return { [field]: dateInner };
      }
    }

    const stringInner = this.buildStringScalarInner(o);
    if (Object.keys(stringInner).length > 0) {
      return { [field]: stringInner };
    }

    return null;
  }

  private buildIntInner(o: Record<string, unknown>): Prisma.IntFilter {
    const inner: Prisma.IntFilter = {};
    if (typeof o.eq === 'number') {
      inner.equals = o.eq;
    }
    if (typeof o.ne === 'number') {
      inner.not = { equals: o.ne };
    }
    if (Array.isArray(o.in) && o.in.length > 0) {
      inner.in = o.in;
    }
    if (Array.isArray(o.notIn) && o.notIn.length > 0) {
      inner.notIn = o.notIn;
    }
    if (typeof o.gt === 'number') {
      inner.gt = o.gt;
    }
    if (typeof o.gte === 'number') {
      inner.gte = o.gte;
    }
    if (typeof o.lt === 'number') {
      inner.lt = o.lt;
    }
    if (typeof o.lte === 'number') {
      inner.lte = o.lte;
    }
    return inner;
  }

  private buildStringInner(o: Record<string, unknown>): Prisma.StringFilter {
    const inner = this.buildStringScalarInner(o);
    if (typeof o.contains === 'string') {
      inner.contains = o.contains;
      inner.mode = Prisma.QueryMode.insensitive;
    }
    if (typeof o.startsWith === 'string') {
      inner.startsWith = o.startsWith;
      inner.mode = Prisma.QueryMode.insensitive;
    }
    if (typeof o.endsWith === 'string') {
      inner.endsWith = o.endsWith;
      inner.mode = Prisma.QueryMode.insensitive;
    }
    return inner;
  }

  private buildStringScalarInner(o: Record<string, unknown>): Prisma.StringFilter {
    const inner: Prisma.StringFilter = {};
    if (typeof o.eq === 'string') {
      inner.equals = o.eq;
    }
    if (typeof o.ne === 'string') {
      inner.not = { equals: o.ne };
    }
    if (Array.isArray(o.in) && o.in.length > 0) {
      inner.in = o.in;
    }
    if (Array.isArray(o.notIn) && o.notIn.length > 0) {
      inner.notIn = o.notIn;
    }
    return inner;
  }

  private tryBuildDateInner(o: Record<string, unknown>): Prisma.DateTimeFilter | null {
    try {
      const inner: Prisma.DateTimeFilter = {};
      let any = false;
      type DateScalarKey = keyof Pick<Prisma.DateTimeFilter, 'equals' | 'gt' | 'gte' | 'lt' | 'lte'>;
      const maybeParse = (key: DateScalarKey, v: unknown): boolean => {
        if (typeof v !== 'string') {
          return false;
        }
        try {
          inner[key] = this.toDate(v);
          return true;
        }
        catch {
          return false;
        }
      };

      if (maybeParse('equals', o.eq)) {
        any = true;
      }
      if (typeof o.ne === 'string') {
        inner.not = { equals: this.toDate(o.ne) };
        any = true;
      }
      for (const k of ['gt', 'gte', 'lt', 'lte'] as const) {
        if (maybeParse(k, o[k])) {
          any = true;
        }
      }

      if (Array.isArray(o.in) && o.in.length > 0) {
        const dates = (o.in as unknown[]).map((x) => {
          if (typeof x !== 'string') {
            throw new Error('invalid');
          }
          return this.toDate(x);
        });
        inner.in = dates;
        any = true;
      }
      if (Array.isArray(o.notIn) && o.notIn.length > 0) {
        const dates = (o.notIn as unknown[]).map((x) => {
          if (typeof x !== 'string') {
            throw new Error('invalid');
          }
          return this.toDate(x);
        });
        inner.notIn = dates;
        any = true;
      }

      if (!any) {
        return null;
      }
      return inner;
    }
    catch {
      return null;
    }
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private toDate(iso: string): Date {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      throw new RangeError(`Data inválida: ${iso}`);
    }
    return d;
  }

  /** Evita tratar strings curtas (ex.: número de documento "123") como ISO. */
  private isLikelyDateFilterString(value: string): boolean {
    return value.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(value);
  }
}
