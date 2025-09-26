<template>
  <div>{{ textRef }} {{ props.state.getValueByKey(stateRef) }}</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';

const props = defineProps<{
  text: string;
  state: any;
}>();

const textRef = ref('');
const stateRef = ref('');

onMounted(() => {
  const splitText = props.text.split('{{').join('').split('}}').join('').split('#');
  textRef.value = splitText[0];
  stateRef.value = splitText[1];
});
</script>
