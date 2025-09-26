import { create } from 'zustand-vue';
import { type Incident, type Instruction } from '@/models';

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

export const useIncidents = create((set, get) => ({
  incidents: [] as Incident[],
  definitions: undefined,
  removeAllIncidents: () => set({ incidents: [] }),
  updateIncidents: (newIncidents: Incident[]) => set({ incidents: newIncidents }),
  updateDefinitions: (newDefinitions: any) => set({ definitions: newDefinitions }),
  currentIncident: undefined,
  updateCurrentIncident: (incident: Incident) => set({ currentIncident: incident }),
  showEmpty: () => set({ currentIncident: undefined }),

  callFunctionByKey: (key: string) => {
    const func = getNestedValue(get(), key);
    if (typeof func === 'function') return func();
    return null;
  },

  getValueByKey: (key: string) => {
    const withoutState = key.replace('state.', '');
    return getNestedValue(get(), withoutState);
  },
}));

export const useInstructions = create((set, get) => ({
  instructions: [] as Instruction[],
  definitions: undefined,
  removeAllInstructions: () => set({ instructions: [] }),
  updateInstructions: (newInstructions: Instruction[]) => set({ instructions: newInstructions }),
  updateDefinitions: (newDefinitions: any) => set({ definitions: newDefinitions }),
  getValueByKey: (key: string) => {
    const withoutState = key.replace('state.', '');
    return getNestedValue(get(), withoutState);
  },
}));
