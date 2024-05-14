import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { Paginated } from '../interfaces/paginated.interface';

/**
 * Applies sorting + pagination to a query builder.
 * `sortable` maps public sort keys to query-builder columns. Only whitelisted keys
 * are accepted, so user input never reaches ORDER BY directly (no SQL injection).
 */
export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  query: PaginationQueryDto,
  sortable: Record<string, string>,
  defaultSort: string,
): Promise<Paginated<T>> {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const column = (query.sortBy && sortable[query.sortBy]) || sortable[defaultSort];
  const order = query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const [items, total] = await qb
    .orderBy(column, order)
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/** Escapes LIKE wildcards in user search input. */
export function likePattern(search: string): string {
  return `%${search.trim().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
