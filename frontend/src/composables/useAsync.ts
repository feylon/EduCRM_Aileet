import { ref, shallowRef, type Ref } from 'vue';
import { getErrorMessage } from '@/utils/errors';

/** Loading / error / data state for a single async call. */
export function useAsync<T>(fn: () => Promise<T>, options: { immediate?: boolean } = {}) {
  const data = shallowRef<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function run() {
    loading.value = true;
    error.value = null;
    try {
      data.value = await fn();
    } catch (err) {
      error.value = getErrorMessage(err);
    } finally {
      loading.value = false;
    }
  }

  if (options.immediate !== false) run();
  return { data, loading, error, run };
}
