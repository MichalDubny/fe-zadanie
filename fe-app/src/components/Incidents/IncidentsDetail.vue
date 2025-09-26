<template>
  <div>
    <template v-for="child in detailDefinition" :key="child.tag">
      <template v-if="child.tag === TAG.GROUP">
        <IncidentsGroup :groupDefinition="child" />
      </template>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { TAG } from '@/models/constants';
import IncidentsGroup from './IncidentsGroup.vue';
import { ref } from 'vue';

const props = defineProps<{
  detailDefinition: any[];
}>();
 
</script>
