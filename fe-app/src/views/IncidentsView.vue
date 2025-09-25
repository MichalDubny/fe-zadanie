<template>
  <div>
    <NavigationPanel />
    <div class="p-2">
      <h1>Incidents</h1>

      <div>
        <div>{{ store.incidents.length }} incidents</div>
        <div>Definitions: {{ store.definitions ? 'Loaded' : 'Not loaded' }}</div>

        <div v-for="incident in store.incidents" :key="incident.id">
          <div>{{ incident.title }}</div>
        </div>
 
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import NavigationPanel from '@/components/NavigationPanel.vue';
import { loadIncidents, loadIncidentDefinitions } from '@/services/natsService';
import { useIncidents } from '@/store';
import { onMounted } from 'vue';

const store: any = useIncidents();

onMounted(() => {
  if (store.incidents.length !== 0) return;
  initIncidentsData();
});

const initIncidentsData = () => {
  loadIncidentDefinitions()
    ?.then((definitions: any) => {
      store.updateDefinitions(definitions);
      console.log('Definitions stored:', store.definitions);
      return loadIncidents();
    })
    .then((incidents: any) => {
      store.updateIncidents(incidents);
    })
    .catch((error: any) => {
      console.error('Error:', error);
    });
};
</script>
