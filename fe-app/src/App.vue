<script setup lang="ts"></script>

<template>
  <ListView />
</template>

<script lang="ts" setup>
import ListView from '@/views/ListView.vue';
import { connectNats, loadIncidents, incidentSubscribe } from '@/services/natsService';
import { onMounted, onUnmounted, ref } from 'vue';
import { Incident } from '@/models';

const incidentsRef = ref<Incident[]>([]);
const unsubscribeRef = ref<(() => void) | null>(null);
const ncRef = ref<NatsConnection | null>(null);

onMounted(() => {
  connectNats()
    .then((nc) => {
      ncRef.value = nc;
      return loadIncidents();
    })
    .then((incidents: Incident[]) => {
      incidentsRef.value = incidents;
      console.log('Incidents:', incidents); 
      unsubscribeRef.value = incidentSubscribe(); 
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});

onUnmounted(() => {
  if (ncRef.value) ncRef.value.close();
  if (unsubscribeRef.value) unsubscribeRef.value();
});
</script>
