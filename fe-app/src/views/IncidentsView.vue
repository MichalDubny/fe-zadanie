<template>
  <div>
    <NavigationPanel />
    <div class="p-2">
      <h1>Incidents</h1>

      <div v-if="state.definitions">
        <IncidentsList
          v-if="state.definitions.views.list"
          :listDefinition="state.definitions.views.list.children"
        />
        <IncidentsDetail
          v-if="state.definitions.views.detail && state.currentIncident"
          :detailDefinition="state.definitions.views.detail.children"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import NavigationPanel from '@/components/NavigationPanel.vue';
import { loadIncidents, loadIncidentDefinitions } from '@/services/natsService';
import { useIncidents } from '@/store';
import IncidentsList from '@/components/Incidents/IncidentsList.vue';
import IncidentsDetail from '@/components/Incidents/IncidentsDetail.vue';
import { onMounted } from 'vue';

const state: any = useIncidents();

onMounted(() => {
  if (state.incidents.length !== 0) return;
  initIncidentsData();
});

const initIncidentsData = () => {
  loadIncidentDefinitions()
    ?.then((definitions: any) => {
      state.updateDefinitions(definitions);
      //  console.log('Definitions stored:', state.definitions);
      return loadIncidents();
    })
    .then((incidents: any) => {
      //  console.log('Incidents stored:', incidents);
      state.updateIncidents(incidents);
    })
    .catch((error: any) => {
      console.error('Error:', error);
    });
};
</script>
