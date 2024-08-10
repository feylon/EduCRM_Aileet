import { reactive, ref, shallowRef, watch } from 'vue';
import type { ListParams, Paginated, PaginationMeta } from '@/types/api';
import { getErrorMessage } from '@/utils/errors';

interface TableOptions<F> {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  filters?: F;
  immediate?: boolean;
}

/**
 * Server-side table state: pagination, search, sorting and filters.
 * Changing search/filters resets to the first page and reloads automatically.
 */
export function useTable<T, F extends Record<string, unknown> = Record<string, unknown>>(
  fetcher: (params: ListParams) => Promise<Paginated<T>>,
  options: TableOptions<F> = {},
) {
  const rows = shallowRef<T[]>([]);
  const meta = ref<PaginationMeta | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const state = reactive({
    page: 1,
    limit: options.limit ?? 10,
    search: '',
    sortBy: options.sortBy,
    sortOrder: options.sortOrder ?? ('DESC' as 'ASC' | 'DESC'),
  });
  const filters = reactive({ ...(options.filters || {}) }) as F;

  let requestId = 0;
  async function load() {
    const current = ++requestId;
    loading.value = true;
    error.value = null;
    try {
      const result = await fetcher({ ...state, ...(filters as Record<string, never>) });
      if (current !== requestId) return; // a newer request has been sent
      rows.value = result.items;
      meta.value = result.meta;
      // Deleting the last row of the last page: step back a page.
      if (!result.items.length && state.page > 1 && result.meta.total > 0) {
        state.page = result.meta.totalPages;
        await load();
      }
    } catch (err) {
      if (current === requestId) error.value = getErrorMessage(err);
    } finally {
      if (current === requestId) loading.value = false;
    }
  }

  function setPage(page: number) {
    state.page = page;
    load();
  }

  function setLimit(limit: number) {
    state.limit = limit;
    state.page = 1;
    load();
  }

  function sort(key: string, order: 'ASC' | 'DESC') {
    state.sortBy = key;
    state.sortOrder = order;
    load();
  }

  function resetFilters() {
    Object.assign(filters, options.filters || {});
    state.search = '';
  }

  watch([() => state.search, () => ({ ...filters })], () => {
    state.page = 1;
    load();
  }, { deep: true });

  if (options.immediate !== false) load();

  return { rows, meta, loading, error, state, filters, load, setPage, setLimit, sort, resetFilters };
}
