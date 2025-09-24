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

export const loadIncidents = async () => {
  if (!nc) return;

  console.log('Loading incidents');
  return nc
    .request('data.get.incidents')
    .then((incidentsReply) => sc.decode(incidentsReply.data))
    .catch((error) => {
      console.error('Error:', error);
      return [];
    });
};

export const incidentSubscribe = () => {
  if (!nc) return;
  const incidents: any[] = [];
  return nc.subscribe('incidents.updated', {
    callback: (inc: any) => {
      const i = incidents.findIndex((x) => x.id === inc.id);
      if (i >= 0) incidents[i] = inc;
      else incidents.unshift(inc);
    },
  });
};
