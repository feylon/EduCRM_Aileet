import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/services/http';
import type { Paginated } from '@/types/api';
import type { Course, Group, Teacher, User } from '@/types/models';
import { fullName } from '@/utils/format';

const TTL = 60_000;

/**
 * Cached option lists for select inputs (courses, groups, teachers, admins).
 * Reloaded at most once a minute unless `invalidate` is called after a change.
 */
export const useLookupsStore = defineStore('lookups', () => {
  const courses = ref<Course[]>([]);
  const groups = ref<Group[]>([]);
  const teachers = ref<Teacher[]>([]);
  const admins = ref<User[]>([]);
  const loadedAt: Record<string, number> = {};

  async function fetchAll<T>(url: string, params: Record<string, unknown> = {}): Promise<T[]> {
    const { data } = await http.get<{ data: Paginated<T> }>(url, { params: { limit: 100, sortBy: 'name', sortOrder: 'ASC', ...params } });
    return data.data.items;
  }

  function fresh(key: string, force: boolean) {
    return !force && loadedAt[key] && Date.now() - loadedAt[key] < TTL;
  }

  async function loadCourses(force = false) {
    if (fresh('courses', force)) return courses.value;
    courses.value = await fetchAll<Course>('/courses');
    loadedAt.courses = Date.now();
    return courses.value;
  }

  async function loadGroups(force = false) {
    if (fresh('groups', force)) return groups.value;
    groups.value = await fetchAll<Group>('/groups');
    loadedAt.groups = Date.now();
    return groups.value;
  }

  async function loadTeachers(force = false) {
    if (fresh('teachers', force)) return teachers.value;
    teachers.value = await fetchAll<Teacher>('/teachers', { sortBy: 'firstName' });
    loadedAt.teachers = Date.now();
    return teachers.value;
  }

  /** Staff users (for lead assignment). Uses the leads-accessible teachers-free endpoint. */
  async function loadAdmins(force = false) {
    if (fresh('admins', force)) return admins.value;
    admins.value = await fetchAll<User>('/leads/assignees', { sortBy: undefined, sortOrder: undefined });
    loadedAt.admins = Date.now();
    return admins.value;
  }

  function invalidate(key?: 'courses' | 'groups' | 'teachers' | 'admins') {
    if (key) delete loadedAt[key];
    else Object.keys(loadedAt).forEach((k) => delete loadedAt[k]);
  }

  const courseOptions = () => courses.value.map((c) => ({ value: c.id, label: c.name }));
  const groupOptions = () => groups.value.map((g) => ({ value: g.id, label: `${g.name} · ${g.course?.name ?? ''}` }));
  const teacherOptions = () => teachers.value.map((t) => ({ value: t.id, label: fullName(t.user) }));
  const adminOptions = () => admins.value.map((u) => ({ value: u.id, label: fullName(u) }));

  return {
    courses,
    groups,
    teachers,
    admins,
    loadCourses,
    loadGroups,
    loadTeachers,
    loadAdmins,
    invalidate,
    courseOptions,
    groupOptions,
    teacherOptions,
    adminOptions,
  };
});
