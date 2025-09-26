<template>
  <div>
    <NavigationPanel />
    <div class="p-2">
      <h1>Instructions</h1>

      <div>
        <div>{{ store.instructions.length }} instructions</div>
        <div>Definitions: {{ store.definitions ? 'Loaded' : 'Not loaded' }}</div>

        <div v-for="instruction in store.instructions" :key="instruction.id">
          <div>{{ instruction.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import NavigationPanel from '@/components/NavigationPanel.vue';
import { useInstructions } from '@/store';
import { loadInstructionDefinitions, loadInstructions } from '@/services/natsService';
import { onMounted } from 'vue';

const store: any = useInstructions();

onMounted(() => {
  if (store.instructions.length !== 0) return;
  initInstructionsData();
});

const initInstructionsData = () => {
  loadInstructionDefinitions()
    ?.then((definitions: any) => {
      //  console.log('Definitions  :', definitions);
      store.updateDefinitions(definitions);
      return loadInstructions();
    })
    .then((instructions: any) => {
      // console.log(instructions);
      store.updateInstructions(instructions);
    })
    .catch((error: any) => {
      console.error('Error:', error);
    });
};
</script>
