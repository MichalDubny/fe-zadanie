<template>
  <RouterView v-if="ncRef" />
  <div v-else class="flex justify-center align-center h-screen">Loading...</div>
</template>

<script lang="ts" setup>
import { connectNats } from '@/services/natsService';
import { onMounted, onUnmounted, ref } from 'vue';
import type { NatsConnection } from 'nats.ws';

const ncRef = ref<NatsConnection | undefined>(undefined);

onMounted(() => {
  connectNats()
    .then((nc: NatsConnection) => {
      ncRef.value = nc;
    })
    .catch((error) => {
      console.error('Nats Error:', error);
    });
});

onUnmounted(() => {
  if (ncRef.value) ncRef.value.close();
});
</script>

<style lang="scss">
@use './assets/scss/main.scss';
</style>
