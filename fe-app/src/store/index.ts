import { create } from 'zustand-vue';
import { type Incident, type Instruction } from '@/models';

export const useIncidents = create((set) => ({
  incidents: [] as Incident[],
  definitions: null,
  removeAllIncidents: () => set({ incidents: [] }),
  updateIncidents: (newIncidents: Incident[]) => set({ incidents: newIncidents }),
  updateDefinitions: (newDefinitions: any) => {
    set({ definitions: newDefinitions });
  },
}));

export const useInstructions = create((set) => ({
  instructions: [] as Instruction[],
  definitions: null,
  removeAllInstructions: () => set({ instructions: [] }),
  updateInstructions: (newInstructions: Instruction[]) => set({ instructions: newInstructions }),
  updateDefinitions: (newDefinitions: any) => set({ definitions: newDefinitions }),
}));
