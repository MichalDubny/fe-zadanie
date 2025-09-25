import { connect, StringCodec, type NatsConnection, type JetStreamClient } from 'nats.ws';

let sc = StringCodec();

let nc: NatsConnection | null = null;

export const connectNats = async () => {
  if (nc) return nc;

  console.log('Connecting to NATS via proxy...');
  try {
    nc = await connect({ servers: 'ws://localhost:8000' });
    console.log('Connected to NATS successfully');
    return nc;
  } catch (e: any) {
    console.error('[nats] connect failed:', e);
    throw e;
  }
};

const fechtData = (subject: string) => {
  if (!nc) return;

  return nc
    .request(subject)
    .then((reply) => JSON.parse(sc.decode(reply.data)))
    .catch((error) => {
      console.error('Error:', error);
      return [];
    });
};

export const loadDefinitions = (subject: string) => {
  return fechtData('definitions.get.' + subject);
};

export const loadIncidentDefinitions = () => {
  return fechtData('definitions.get.incidents');
};

export const loadInstructionDefinitions = () => {
  return fechtData('definitions.get.instructions');
};

export const loadIncidents = () => {
  return fechtData('data.get.incidents');
};

export const loadInstructions = () => {
  return fechtData('data.get.instructions');
};

export const subscribe = (subject: string) => {
  if (!nc) return;
  const data: any[] = [];
  return nc.subscribe(subject, {
    callback: (d: any) => {
      const i = data.findIndex((x) => x.id === d.id);
      if (i >= 0) data[i] = d;
      else data.unshift(d);
    },
  });
};

export const incidentSubscribe = () => {
  return subscribe('incidents.updated');
  /* if (!nc) return;
  const incidents: any[] = [];
  return nc.subscribe('incidents.updated', {
    callback: (inc: any) => {
      const i = incidents.findIndex((x) => x.id === inc.id);
      if (i >= 0) incidents[i] = inc;
      else incidents.unshift(inc);
    },
  });*/
};

export const instructionSubscribe = () => {
  return subscribe('instructions.updated');
};
