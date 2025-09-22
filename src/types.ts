// JSON Definition Types for Frontend Assignment

export interface ModuleDefinition {
  layout: 'splitscreen';
  views: {
    list: ViewDefinition;
    detail: ViewDefinition;
    empty: ViewDefinition;
  };
}

export interface ViewDefinition {
  tag: 'view';
  name: 'list' | 'detail' | 'empty';
  children: ComponentDefinition[];
}

export type ComponentDefinition = 
  | TextComponent
  | InputComponent  
  | SelectComponent
  | ButtonComponent
  | TableComponent
  | CardComponent
  | GroupComponent
  | FormComponent
  | ModalComponent;

// Base component interface
interface BaseComponent {
  tag: string;
  class?: string;
  bind?: string;
  visibleWhen?: ConditionDefinition;
  disabledWhen?: ConditionDefinition;
}

// Text component
export interface TextComponent extends BaseComponent {
  tag: 'text';
  content: string | BindingExpression;
  htmlTag?: 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span';
  label?: string;
}

// Input component
export interface InputComponent extends BaseComponent {
  tag: 'input';
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string | BindingExpression;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea';
  rows?: number; // for textarea
  pattern?: string;
}

// Select component
export interface SelectComponent extends BaseComponent {
  tag: 'select';
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  multiple?: boolean;
  options: string[] | BindingExpression;
  value?: string | string[] | BindingExpression;
}

// Button component
export interface ButtonComponent extends BaseComponent {
  tag: 'button';
  text: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  onClick: ActionDefinition;
}

// Table component
export interface TableComponent extends BaseComponent {
  tag: 'table';
  bind: string;
  virtualized?: boolean;
  onRowClick?: ActionDefinition;
  columns: TableColumn[];
}

export interface TableColumn {
  key: string;
  title: string;
  width?: number;
  component?: string; // For custom cell renderers
}

// Card component
export interface CardComponent extends BaseComponent {
  tag: 'card';
  title: string;
  value: string | number | BindingExpression;
}

// Group container
export interface GroupComponent extends BaseComponent {
  tag: 'group';
  children: ComponentDefinition[];
}

// Form component
export interface FormComponent extends BaseComponent {
  tag: 'form';
  ref?: string;
  children: ComponentDefinition[];
}

// Modal component
export interface ModalComponent extends BaseComponent {
  tag: 'modal';
  name: string;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ComponentDefinition[];
}

// Action definitions
export type ActionDefinition = 
  | NavigateAction
  | PublishAction
  | ModalAction
  | ShowDetailAction
  | ShowEmptyAction;

export interface NavigateAction {
  action: 'navigate';
  to: string;
}

export interface PublishAction {
  action: 'publish';
  topic: string;
  payload: Record<string, any>;
  then?: ActionDefinition;
}

export interface ModalAction {
  action: 'modal';
  modal: string;
  close?: boolean;
}

export interface ShowDetailAction {
  action: 'showDetail';
  id: string | BindingExpression;
}

export interface ShowEmptyAction {
  action: 'showEmpty';
}

// Binding expressions
export type BindingExpression = {
  $bind: string;
} | {
  $ref: string;
};

// Condition definitions (simplified JSON logic)
export interface ConditionDefinition {
  eq?: [BindingExpression | string, BindingExpression | string];
  neq?: [BindingExpression | string, BindingExpression | string];
  gt?: [BindingExpression | number, BindingExpression | number];
  lt?: [BindingExpression | number, BindingExpression | number];
  and?: ConditionDefinition[];
  or?: ConditionDefinition[];
  not?: ConditionDefinition;
}

// Mustache template strings
export type TemplateString = string; // e.g., "Incident #{{params.id}}"

// Example usage interfaces for the frontend developer
export interface FrontendState {
  // Incidents module state
  incidents: Incident[];
  filteredIncidents: Incident[];
  currentIncident: Incident | null;
  cities: string[];
  severities: string[];
  kpis: {
    total: number;
    open: number;
    acknowledged: number;
    slaBreached: number;
  };
  filters: {
    city: string;
    severity: string[];
    dateRange: string;
  };
  
  // Instructions module state  
  instructions: Instruction[];
  currentInstruction: Instruction | null;
}

export interface Incident {
  id: string;
  title: string;
  city: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Instruction {
  id: string;
  title: string;
  category: 'emergency' | 'maintenance' | 'security' | 'general';
  status: 'active' | 'draft' | 'archived';
  content: string;
  updatedAt?: string;
}

// NATS message interfaces
export interface NATSCommand {
  topic: string;
  payload: unknown;
}

export interface IncidentAcknowledgeCommand {
  id: string;
}

export interface IncidentUpdateCommand {
  id: string;
  updates: Partial<Incident>;
}

export interface InstructionUpdateCommand {
  id: string;
  updates: Partial<Instruction>;
}