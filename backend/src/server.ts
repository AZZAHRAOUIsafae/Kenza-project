import Fastify from 'fastify';
import cors from '@fastify/cors';
import { salesAgentGraph } from './graph/salesGraph.js';
import { saveSessionState, getSessionState } from './cache/redisClient.js';

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: '*',
});

// Endpoint Healthcheck
fastify.get('/health', async () => {
  return { status: 'ok', service: 'kenza-fastify-api', engine: 'Node.js 20 + LangGraph' };
});

// Endpoint Webhook WhatsApp Cloud API
fastify.get('/webhook', async (request, reply) => {
  const query = request.query as any;
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return reply.status(200).send(challenge);
  }
  return reply.status(403).send('Verification failed');
});

// Traitement des messages entrants
fastify.post('/webhook', async (request, reply) => {
  const body = request.body as any;
  fastify.log.info({ body }, 'Incoming WhatsApp Webhook Payload');
  return { status: 'received' };
});

// Endpoint d'orchestration pour le simulateur et l'API directe
fastify.post('/api/chat', async (request, reply) => {
  const { phone, name, message } = request.body as { phone: string; name: string; message: string };

  // 1. Récupération de la session dans Redis 7
  const priorSession = await getSessionState<any>(phone);

  // 2. Exécution du graphe LangGraph
  const result = await salesAgentGraph.invoke({
    customerPhone: phone,
    customerName: name || 'Client',
    incomingMessage: message,
    language: 'darija',
    detectedIntent: 'unknown',
    isEscalated: false,
    responseMessage: '',
    traceLogs: [],
  });

  // 3. Persistance dans Redis 7
  await saveSessionState(phone, {
    lastMessage: message,
    lastResponse: result.responseMessage,
    updatedAt: new Date().toISOString(),
  });

  return {
    success: true,
    reply: result.responseMessage,
    intent: result.detectedIntent,
    isEscalated: result.isEscalated,
    traces: result.traceLogs,
  };
});

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`[Fastify] Serveur démarré sur http://${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
