<template>
  <div :class="groupDefinition.class">
    <div v-for="child in groupDefinition.children" :key="child.tag">
      <IncidentsGroup v-if="child.tag === TAG.GROUP" :groupDefinition="child" />
      <h1 v-if="child.tag === TAG.H1" :class="child.class">
        <DynamicalText :text="child.content" :state="state" />
      </h1>
      <button v-if="child.tag === TAG.BUTTON" :class="child.class" @click="child.onClick || null">
        {{ child.text }}
      </button>
      <div v-if="child.tag === TAG.TEXT" :class="child.class">
        <div v-if="child.label" class="bold">{{ child.label }}</div>
        <p v-if="child.content">
            {{ state.getValueByKey(child.content.$bind) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { TAG } from '@/models/constants';
import { useIncidents } from '@/store';
import DynamicalText from '../DynamicalText.vue';

const state: any = useIncidents();

const props = defineProps<{
  groupDefinition: any;
}>();
 
</script>
