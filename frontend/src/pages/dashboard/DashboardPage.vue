<script setup lang="ts">
import { computed } from 'vue';
import AdminDashboard from '@/components/dashboard/AdminDashboard.vue';
import StudentDashboard from '@/components/dashboard/StudentDashboard.vue';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { useAuthStore } from '@/stores/auth';
import { formatDate } from '@/utils/format';

const auth = useAuthStore();
const today = formatDate(new Date());
const view = computed(() => (auth.isStaff ? AdminDashboard : auth.isTeacher ? TeacherDashboard : StudentDashboard));
</script>

<template>
  <div>
    <PageHeader :title="$t('dashboard.greeting', { name: auth.user?.firstName })" :subtitle="`${$t('dashboard.subtitle')} · ${today}`" />
    <component :is="view" />
  </div>
</template>
