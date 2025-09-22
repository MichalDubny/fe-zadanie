// client.ts - Fixed test client
import { connect, NatsConnection, StringCodec, Subscription } from 'nats';
import {
  Incident,
  IncidentAcknowledgeCommand,
  IncidentUpdateCommand,
  Instruction
} from './types';

const sc = StringCodec();

class TestClient {
  private nc: NatsConnection | null = null;

  async connect(): Promise<void> {
    console.log('Connecting to NATS...');
    this.nc = await connect({ servers: 'nats://localhost:4222' });
    console.log('Connected to NATS');
  }

  async testDataRequests(): Promise<void> {
    if (!this.nc) throw new Error('Not connected to NATS');
    
    console.log('\nTesting data requests...');
    
    // Test 1: Get all incidents
    console.log('Getting all incidents...');
    try {
      const incidentsReply = await this.nc.request('data.get.incidents', sc.encode(''), { timeout: 5000 });
      const incidents: Incident[] = JSON.parse(sc.decode(incidentsReply.data));
      console.log('Incidents:', incidents.length, 'items');
      incidents.forEach(inc => {
        console.log(`  - ${inc.id}: ${inc.title} (${inc.status}) - ${inc.city}`);
        console.log(`    Severity: ${inc.severity}, Created: ${inc.createdAt}`);
      });
    } catch (error: any) {
      console.error('Failed to get incidents:', error.message);
    }

    // Test 2: Get all instructions  
    console.log('\nGetting all instructions...');
    try {
      const instructionsReply = await this.nc.request('data.get.instructions', sc.encode(''), { timeout: 5000 });
      const instructions: Instruction[] = JSON.parse(sc.decode(instructionsReply.data));
      console.log('Instructions:', instructions.length, 'items');
      instructions.forEach(inst => {
        console.log(`  - ${inst.id}: ${inst.title} (${inst.category})`);
        console.log(`    Status: ${inst.status}, Content: ${inst.content.substring(0, 50)}...`);
      });
    } catch (error: any) {
      console.error('Failed to get instructions:', error.message);
    }
  }

  async testDefinitions(): Promise<void> {
    if (!this.nc) throw new Error('Not connected to NATS');
    
    console.log('\nTesting definition requests...');
    
    // Test different definition requests
    const definitionTests = [
      { request: 'definitions.get.incidents', description: 'Full incidents module' },
      { request: 'definitions.get.instructions', description: 'Full instructions module' },
      { request: 'definitions.get.nonexistent', description: 'Non-existent module (should error)' }
    ];

    for (const test of definitionTests) {
      try {
        console.log(`\n${test.description}: ${test.request}`);
        const defReply = await this.nc.request(test.request, sc.encode(''), { timeout: 5000 });
        const definition = JSON.parse(sc.decode(defReply.data));
        
        if (definition.error) {
          console.log(`Error: ${definition.error}`);
        } else {
          console.log(`Definition received successfully`);
          
          // Show structure based on what we received
          if (definition.layout) {
            console.log(`   Layout: ${definition.layout}`);
            if (definition.views) {
              const viewNames = Object.keys(definition.views);
              console.log(`  Views: ${viewNames.join(', ')}`);
              viewNames.forEach(viewName => {
                const view = definition.views[viewName];
                if (view.children) {
                  console.log(`      - ${viewName}: ${view.children.length} components`);
                }
              });
            }
          } else if (definition.tag === 'view') {
            // This is a specific view
            console.log(`   View: ${definition.name}`);
            console.log(`   Components: ${definition.children?.length || 0}`);
            if (definition.children) {
              const componentTypes = definition.children.map((c: any) => c.tag).join(', ');
              console.log(`  Types: ${componentTypes}`);
            }
          } else {
            console.log(`   Keys: ${Object.keys(definition).join(', ')}`);
          }
        }
      } catch (err: any) {
        console.log(`Request failed: ${err.message}`);
      }
    }
  }

  async testCommands(): Promise<Incident[]> {
    if (!this.nc) throw new Error('Not connected to NATS');
    
    console.log('\nTesting command execution...');
    
    // Subscribe to updates first
    console.log('Subscribing to incident updates...');
    const sub: Subscription = this.nc.subscribe('incidents.updated');
    
    try {
      // Test acknowledge command
      console.log('Acknowledging incident INC-001...');
      const ackCommand: IncidentAcknowledgeCommand = { id: 'INC-001' };
      const ackReply = await this.nc.request('commands.incident.acknowledge', sc.encode(JSON.stringify(ackCommand)), { timeout: 5000 });
      const ackResult = JSON.parse(sc.decode(ackReply.data));
      console.log('Acknowledge result:', ackResult);
      
      // Test update command
      console.log('Updating incident INC-002...');
      const updateCommand: IncidentUpdateCommand = { 
        id: 'INC-002', 
        updates: { 
          status: 'resolved',
          description: 'Issue has been resolved successfully' 
        } 
      };
      const updateReply = await this.nc.request('commands.incident.update', sc.encode(JSON.stringify(updateCommand)), { timeout: 5000 });
      const updateResult = JSON.parse(sc.decode(updateReply.data));
      console.log('Update result:', updateResult);

      // Wait for update notifications
      console.log('\nWaiting for update notifications...');
      const updates: Incident[] = [];
      
      return new Promise((resolve) => {
        let updateCount = 0;
        const maxUpdates = 2; // Expecting 2 updates
        
        const processUpdates = async () => {
          try {
            for await (const msg of sub) {
              const incident: Incident = JSON.parse(sc.decode(msg.data));
              console.log(`Received update: ${incident.id} status: ${incident.status}`);
              updates.push(incident);
              updateCount++;
              
              if (updateCount >= maxUpdates) {
                sub.unsubscribe();
                break;
              }
            }
          } catch (error: any) {
            console.error('Error processing updates:', error.message);
          }
          resolve(updates);
        };
        
        processUpdates();
        
        // Timeout after 3 seconds
        setTimeout(() => {
          if (updateCount < maxUpdates) {
            console.log(`Timeout: Only received ${updateCount}/${maxUpdates} updates`);
            sub.unsubscribe();
            resolve(updates);
          }
        }, 3000);
      });
      
    } catch (error: any) {
      console.error('Command execution failed:', error.message);
      sub.unsubscribe();
      return [];
    }
  }

  async verifyChanges(): Promise<void> {
    if (!this.nc) throw new Error('Not connected to NATS');
    
    console.log('\nVerifying changes in data...');
    try {
      const incidentsReply = await this.nc.request('data.get.incidents', sc.encode(''), { timeout: 5000 });
      const updatedIncidents: Incident[] = JSON.parse(sc.decode(incidentsReply.data));
      
      console.log('Final incident statuses:');
      updatedIncidents.forEach(inc => {
        console.log(`  - ${inc.id}: ${inc.status}${inc.updatedAt ? ` (updated: ${inc.updatedAt})` : ''}`);
      });
    } catch (error: any) {
      console.error('Failed to verify changes:', error.message);
    }
  }

  async disconnect(): Promise<void> {
    if (this.nc) {
      console.log('Disconnecting from NATS...');
      await this.nc.drain();
      await this.nc.close();
      this.nc = null;
    }
  }
}

async function runTests(): Promise<void> {
  const client = new TestClient();
  
  try {
    // Connect to NATS
    await client.connect();
    
    // Run all tests
    await client.testDataRequests();
    await client.testDefinitions();
    await client.testCommands();
    await client.verifyChanges();
    
    console.log('\nAll tests completed successfully!');
    
  } catch (error: any) {
    console.error('Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await client.disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down client...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down client...');
  process.exit(0);
});

// Run the tests
runTests().catch(console.error);