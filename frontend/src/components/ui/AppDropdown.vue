<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { EllipsisVerticalIcon } from '@heroicons/vue/20/solid';
import type { Component } from 'vue';

export interface DropdownItem {
  label: string;
  icon?: Component;
  danger?: boolean;
  hidden?: boolean;
  action: () => void;
}

withDefaults(defineProps<{ items: DropdownItem[]; align?: 'left' | 'right' }>(), { align: 'right' });
</script>

<template>
  <Menu as="div" class="relative inline-block text-left" @click.stop>
    <MenuButton
      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      :aria-label="$t('common.actions')"
    >
      <slot name="button">
        <EllipsisVerticalIcon class="h-5 w-5" />
      </slot>
    </MenuButton>
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems
        :class="[
          'absolute z-30 mt-1 w-48 origin-top-right rounded-xl border border-slate-100 bg-white p-1 shadow-popover focus:outline-none',
          align === 'right' ? 'right-0' : 'left-0',
        ]"
      >
        <template v-for="item in items" :key="item.label">
          <MenuItem v-if="!item.hidden" v-slot="{ active }">
            <button
              type="button"
              :class="[
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm',
                item.danger ? 'text-rose-600' : 'text-slate-700',
                active ? (item.danger ? 'bg-rose-50' : 'bg-slate-50') : '',
              ]"
              @click="item.action()"
            >
              <component :is="item.icon" v-if="item.icon" class="h-4 w-4 shrink-0 opacity-70" />
              {{ item.label }}
            </button>
          </MenuItem>
        </template>
      </MenuItems>
    </transition>
  </Menu>
</template>
