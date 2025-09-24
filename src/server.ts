// server.ts - Fixed NATS backend with KV buckets
import { promises as fs } from 'fs';
import { connect, JetStreamClient, KV, Msg, NatsConnection, StringCodec } from 'nats';
import path from 'path';
import {
  Incident,
  IncidentAcknowledgeCommand,
  IncidentUpdateCommand,
  Instruction,
  InstructionUpdateCommand,
  ModuleDefinition
} from './types'; // Adjust path as needed

const sc = StringCodec();

// Backend-specific types
interface SeedData {
  incidents: Incident[];
  instructions: Instruction[];
}

interface DefinitionResponse extends Partial<ModuleDefinition> {
  error?: string;
  [key: string]: any;
}

interface CommandResponse {
  success: boolean;
  error?: string;
}

// Sample seed data
const SEED_DATA: SeedData = {
  incidents: [
    { 
      id: "INC-001", 
      title: "Network outage", 
      city: "New York", 
      severity: "high", 
      status: "open",
      description: "Critical network infrastructure failure",
      createdAt: new Date().toISOString()
    },
    { 
      id: "INC-002", 
      title: "Database slow", 
      city: "LA", 
      severity: "medium", 
      status: "acknowledged",
      description: "Database performance degradation",
      createdAt: new Date().toISOString()
    },
    { 
      id: "INC-003", 
      title: "Security alert", 
      city: "Chicago", 
      severity: "critical", 
      status: "open",
      description: "Suspicious activity detected",
      createdAt: new Date().toISOString()
    }
  ],
  instructions: [
    { 
      id: "INST-001", 
      title: "Emergency Protocol", 
      category: "emergency", 
      status: "active", 
      content: "Step 1: Assess the situation immediately..."
    },
    { 
      id: "INST-002", 
      title: "Database Maintenance", 
      category: "maintenance", 
      status: "active", 
      content: "Check logs for performance issues..."
    }
  ]
};

class SimpleBackend {
  private nc: NatsConnection | null = null;
  private js: JetStreamClient | null = null;
  private incidentsKV: KV | null = null;
  private instructionsKV: KV | null = null;
  private definitionsKV: KV | null = null;
  private kpisKV: KV | null = null;

  async start(): Promise<void> {
    console.log('Starting backend...');
    
    try {
      // Connect to NATS
      this.nc = await connect({ servers: 'nats://localhost:4222' });
      this.js = this.nc.jetstream();
      
      console.log('Connected to NATS');
      
      // Setup JetStream resources
      await this.setupJetStream();
      
      // Seed initial data
      await this.seedData();
      
      // Start message handlers
      this.startHandlers();
      
      console.log('Backend ready - listening for messages');
    } catch (error) {
      console.error('Failed to start backend:', error);
      throw error;
    }
  }

  private async setupJetStream(): Promise<void> {
    if (!this.js) throw new Error('JetStream not initialized');
    
    const jsm = await this.js.jetstreamManager();
    
    // Create streams for events
    const streams = [
      { name: 'incidents-events', subjects: ['incidents.>'] },
      { name: 'instructions-events', subjects: ['instructions.>'] }
    ];
    
    for (const streamConfig of streams) {
      try {
        await jsm.streams.add(streamConfig);
        console.log(`Created stream: ${streamConfig.name}`);
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          console.log(`Stream already exists: ${streamConfig.name}`);
        } else {
          console.error(`Error creating stream ${streamConfig.name}:`, err.message);
        }
      }
    }

    // Get KV buckets
    try {
      this.incidentsKV = await this.js.views.kv('incidents-current');
      console.log('Connected to incidents-current KV');
    } catch (err: any) {
      console.error('Failed to connect to incidents-current KV:', err.message);
    }

    try {
      this.instructionsKV = await this.js.views.kv('instructions-current');
      console.log('Connected to instructions-current KV');
    } catch (err: any) {
      console.error('ailed to connect to instructions-current KV:', err.message);
    }


    try {
      this.kpisKV = await this.js.views.kv('app-kpis');
      console.log('Connected to app-kpis KV');
    } catch (err: any) {
      console.error('Failed to connect to app-kpis KV:', err.message);
    }

    try {
      this.definitionsKV = await this.js.views.kv('definitions-data');
      console.log('Connected to definitions-data KV');
    } catch (err: any) {
      console.error('Failed to connect to definitions-data KV:', err.message);
    }
  }

  private async seedData(): Promise<void> {
    if (!this.incidentsKV || !this.instructionsKV || !this.definitionsKV) {
      console.warn('KV buckets not available, storing data in memory only');
      return;
    }
    
    // Store incidents in KV
    for (const incident of SEED_DATA.incidents) {
      await this.incidentsKV.put(incident.id, sc.encode(JSON.stringify(incident)));
    }
    console.log('Seeded incidents to KV');
    
    // Store instructions in KV
    for (const instruction of SEED_DATA.instructions) {
      await this.instructionsKV.put(instruction.id, sc.encode(JSON.stringify(instruction)));
    }
    console.log('Seeded instructions to KV');

    // Load and store definitions in KV
    await this.loadAndStoreDefinitions();
    
    console.log('Seeded initial data');
  }

  private async loadAndStoreDefinitions(): Promise<void> {
    if (!this.definitionsKV) return;

    const modules = ['incidents', 'instructions']; // Add more modules as needed
    
    for (const module of modules) {
      try {
        const definition = await this.loadDefinitionFromFile(module);
        if (!definition.error) {
          await this.definitionsKV.put(module, sc.encode(JSON.stringify(definition)));
          console.log(`Stored definition for ${module} in KV`);
        }
      } catch (error: any) {
        console.error(`Failed to store definition for ${module}:`, error.message);
      }
    }
  }

  private async loadDefinitionFromFile(module: string): Promise<DefinitionResponse> {
    const filename = `definitions/${module}.json`;
    try {
      const content = await fs.readFile(path.join(__dirname, filename), 'utf8');
      const moduleDefinition: ModuleDefinition = JSON.parse(content);
      return moduleDefinition;
    } catch (error: any) {
      console.error(`Failed to load definition ${filename}:`, error.message);
      return { error: `Definition not found: ${module}` };
    }
  }

  private startHandlers(): void {
    if (!this.nc) throw new Error('NATS connection not initialized');
    
    // Handle definition requests - use direct request/reply, not through streams
    this.nc.subscribe('definitions.get.*', {
      callback: async (err: Error | null, msg: Msg) => {
        if (err) {
          console.error('Definition request error:', err);
          return;
        }
        
        const subject = msg.subject; // e.g. "definitions.get.incidents"
        const parts = subject.split('.');
        const module = parts[2];
        
        console.log(`Loading definition: ${module}`);
        
        try {
          const definition = await this.loadDefinitionFromFile(module);

          console.log(`✅ Definition response for ${module}:`, Object.keys(definition));
          msg.respond(sc.encode(JSON.stringify(definition)));
        } catch (error: any) {
          console.error('Definition error:', error.message);
          msg.respond(sc.encode(JSON.stringify({ error: error.message })));
        }
      }
    });

    // Handle data requests
    this.nc.subscribe('data.get.*', {
      callback: async (err: Error | null, msg: Msg) => {
        if (err) {
          console.error('Data request error:', err);
          return;
        }
        
        const subject = msg.subject; // e.g. "data.get.incidents"
        const parts = subject.split('.');
        const module = parts[2];
        
        console.log(`Data request: ${module}`);
        
        try {
          if (module === 'incidents') {
            const incidents = await this.getAllIncidents();
            msg.respond(sc.encode(JSON.stringify(incidents)));
          } else if (module === 'instructions') {
            const instructions = await this.getAllInstructions();
            msg.respond(sc.encode(JSON.stringify(instructions)));
          } else {
            msg.respond(sc.encode(JSON.stringify([])));
          }
        } catch (error: any) {
          console.error('Data request error:', error.message);
          msg.respond(sc.encode(JSON.stringify({ error: error.message })));
        }
      }
    });

    // Handle commands
    this.nc.subscribe('commands.>', {
      callback: async (err: Error | null, msg: Msg) => {
        if (err) {
          console.error('Command error:', err);
          return;
        }
        
        const subject = msg.subject;
        
        try {
          console.log('Command received:', subject);
          
          if (subject === 'commands.incident.acknowledge') {
            const data = JSON.parse(sc.decode(msg.data)) as IncidentAcknowledgeCommand;
            await this.acknowledgeIncident(data.id);
            msg.respond(sc.encode(JSON.stringify({ success: true })));
          } else if (subject === 'commands.incident.update') {
            const data = JSON.parse(sc.decode(msg.data)) as IncidentUpdateCommand;
            await this.updateIncident(data.id, data.updates);
            msg.respond(sc.encode(JSON.stringify({ success: true })));
          } else if (subject === 'commands.instruction.update') {
            const data = JSON.parse(sc.decode(msg.data)) as InstructionUpdateCommand;
            await this.updateInstruction(data.id, data.updates);
            msg.respond(sc.encode(JSON.stringify({ success: true })));
          } else {
            console.log('Unknown command:', subject);
            msg.respond(sc.encode(JSON.stringify({ success: false, error: 'Unknown command' })));
          }
        } catch (parseError: any) {
          console.error('Command processing error:', parseError);
          msg.respond(sc.encode(JSON.stringify({ success: false, error: parseError.message })));
        }
      }
    });
    
    console.log('Message handlers started');
  }

  private async getAllIncidents(): Promise<Incident[]> {
    if (this.incidentsKV) {
      const incidents: Incident[] = [];
      const keys = await this.incidentsKV.keys();
      
      for await (const key of keys) {
        try {
          const entry = await this.incidentsKV.get(key);
          if (entry) {
            const incident = JSON.parse(sc.decode(entry.value));
            incidents.push(incident);
          }
        } catch (error) {
          console.error(`Error reading incident ${key}:`, error);
        }
      }
      
      return incidents;
    } else {
      // Fallback to in-memory data
      return SEED_DATA.incidents;
    }
  }

  private async getAllInstructions(): Promise<Instruction[]> {
    if (this.instructionsKV) {
      const instructions: Instruction[] = [];
      const keys = await this.instructionsKV.keys();
      
      for await (const key of keys) {
        try {
          const entry = await this.instructionsKV.get(key);
          if (entry) {
            const instruction = JSON.parse(sc.decode(entry.value));
            instructions.push(instruction);
          }
        } catch (error) {
          console.error(`Error reading instruction ${key}:`, error);
        }
      }
      
      return instructions;
    } else {
      // Fallback to in-memory data
      return SEED_DATA.instructions;
    }
  }

  private async acknowledgeIncident(id: string): Promise<void> {
    if (!this.nc) throw new Error('NATS connection not initialized');
    
    if (this.incidentsKV) {
      // Update in KV
      const entry = await this.incidentsKV.get(id);
      if (entry) {
        const incident = JSON.parse(sc.decode(entry.value));
        incident.status = 'acknowledged';
        incident.updatedAt = new Date().toISOString();
        
        await this.incidentsKV.put(id, sc.encode(JSON.stringify(incident)));
        
        // Publish update event
        this.nc.publish('incidents.updated', sc.encode(JSON.stringify(incident)));
        console.log('Acknowledged incident:', id);
      } else {
        throw new Error(`Incident not found: ${id}`);
      }
    } else {
      // Fallback to in-memory update
      const incident = SEED_DATA.incidents.find(i => i.id === id);
      if (incident) {
        incident.status = 'acknowledged';
        incident.updatedAt = new Date().toISOString();
        
        // Publish update event
        this.nc.publish('incidents.updated', sc.encode(JSON.stringify(incident)));
        console.log('Acknowledged incident:', id);
      } else {
        throw new Error(`Incident not found: ${id}`);
      }
    }
  }

  private async updateIncident(id: string, updates: Partial<Incident>): Promise<void> {
    if (!this.nc) throw new Error('NATS connection not initialized');
    
    if (this.incidentsKV) {
      // Update in KV
      const entry = await this.incidentsKV.get(id);
      if (entry) {
        const incident = JSON.parse(sc.decode(entry.value));
        Object.assign(incident, updates);
        incident.updatedAt = new Date().toISOString();
        
        await this.incidentsKV.put(id, sc.encode(JSON.stringify(incident)));
        
        // Publish update event
        this.nc.publish('incidents.updated', sc.encode(JSON.stringify(incident)));
        console.log('Updated incident:', id, updates);
      } else {
        throw new Error(`Incident not found: ${id}`);
      }
    } else {
      // Fallback to in-memory update
      const incident = SEED_DATA.incidents.find(i => i.id === id);
      if (incident) {
        Object.assign(incident, updates);
        incident.updatedAt = new Date().toISOString();
        
        // Publish update event
        this.nc.publish('incidents.updated', sc.encode(JSON.stringify(incident)));
        console.log('Updated incident:', id, updates);
      } else {
        throw new Error(`Incident not found: ${id}`);
      }
    }
  }

  private async updateInstruction(id: string, updates: Partial<Instruction>): Promise<void> {
    if (!this.nc) throw new Error('NATS connection not initialized');
    
    if (this.instructionsKV) {
      // Update in KV
      const entry = await this.instructionsKV.get(id);
      if (entry) {
        const instruction = JSON.parse(sc.decode(entry.value));
        Object.assign(instruction, updates);
        instruction.updatedAt = new Date().toISOString();
        
        await this.instructionsKV.put(id, sc.encode(JSON.stringify(instruction)));
        
        // Publish update event
        this.nc.publish('instructions.updated', sc.encode(JSON.stringify(instruction)));
        console.log('Updated instruction:', id, updates);
      } else {
        throw new Error(`Instruction not found: ${id}`);
      }
    } else {
      // Fallback to in-memory update
      const instruction = SEED_DATA.instructions.find(i => i.id === id);
      if (instruction) {
        Object.assign(instruction, updates);
        instruction.updatedAt = new Date().toISOString();
        
        // Publish update event
        this.nc.publish('instructions.updated', sc.encode(JSON.stringify(instruction)));
        console.log('Updated instruction:', id, updates);
      } else {
        throw new Error(`Instruction not found: ${id}`);
      }
    }
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down...');
    if (this.nc) {
      await this.nc.drain();
      await this.nc.close();
    }
  }
}

// Start the backend
const backend = new SimpleBackend();
backend.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await backend.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await backend.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});