<template>
  <div class="horizontal-panel">
    <div
      class="panel-item"
      @click="showOwners(PAGE.INCIDENTS.path)"
      :class="{ active: activeRoute === PAGE.INCIDENTS.path }"
    >
      Incidents
    </div>
    <div
      class="panel-item"
      @click="showOwners(PAGE.INSTRUCTIONS.path)"
      :class="{ active: activeRoute === PAGE.INSTRUCTIONS.path }"
    >
      Instructions
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { PAGE } from '@/models/constants';

const router = useRouter();
const activeRoute = ref(router.currentRoute.value.path);

const showOwners = (path: string) => {
  if (path === activeRoute.value) return;

  router.push(path);
};
</script>
<script lang="ts" setup></script>
