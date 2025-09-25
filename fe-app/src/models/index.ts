export interface Incident {
  id: string;
  title: string;
  city: string;
  severity: string;
  status: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
 
export interface Instruction {
  id: string;
  title: string;
  category: string;
  status: string;
  content: string;
  updatedAt?: string;
}
