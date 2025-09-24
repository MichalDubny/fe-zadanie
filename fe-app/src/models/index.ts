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
