import type { ListParams, Paginated } from '@/types/api';
import { api, cleanParams } from './http';

/** Standard REST resource: list / get / create / update / remove. */
export function createCrudService<T, CreatePayload = Partial<T>, UpdatePayload = Partial<CreatePayload>>(resource: string) {
  return {
    list: (params: ListParams = {}) => api.get<Paginated<T>>(resource, { params: cleanParams(params) }),
    get: (id: string) => api.get<T>(`${resource}/${id}`),
    create: (payload: CreatePayload) => api.post<T>(resource, payload),
    update: (id: string, payload: UpdatePayload) => api.patch<T>(`${resource}/${id}`, payload),
    remove: (id: string) => api.delete(`${resource}/${id}`),
  };
}
