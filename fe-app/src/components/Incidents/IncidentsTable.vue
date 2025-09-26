<template>
  <div>
    <table class="table">
      <thead class="table-header">
        <tr>
          <th
            v-for="column in tableDefinition.columns"
            :style="{ width: column.width + 'px' }"
            :key="column.key"
          >
            {{ column.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in state.incidents"
          :key="row.id"
          class="table-row"
          @click="onRowClick(row)"
        >
          <td v-for="column in tableDefinition.columns" :key="column.key">
            {{ row[column.key as keyof Incident] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
import type { Incident } from '@/models';
import { useIncidents } from '@/store';

const state: any = useIncidents();

const onRowClick = (row: Incident) => {
  state.updateCurrentIncident(row); 
  console.log(row.id);
};

const props = defineProps<{
  tableDefinition: any;
}>();
</script>
