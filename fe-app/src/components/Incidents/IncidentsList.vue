<template>
  <div>
    <template v-for="child in listDefinition" :key="child.tag">
     
      <template v-if="child.tag === TAG.TABLE">
        <IncidentsTable :tableDefinition="child"  />
      </template>
    </template>
     
  </div>
</template>

<script lang="ts" setup>
import { TAG } from '@/models/constants';
import IncidentsTable from './IncidentsTable.vue'; 

 

const props = defineProps<{
  listDefinition: any[];
}>();



</script>
 