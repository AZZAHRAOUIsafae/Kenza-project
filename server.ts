import 'dotenv/config';
import express from 'express';
import path from 'path';
import { db } from './src/db/database';
import { BusinessTools } from './src/tools';
import { AgentOrchestrator } from './src/agents/orchestrator';
import { CartEngine } from './src/services/cartEngine';
import { QueueService } from './src/services/queueService';
import { RagService } from './src/services/ragService';

const projectRoot = process.cwd();

async function startServer() {
  const app = express();
  const preferredPort = Number(process.env.PORT) || 3000;

  const startListener = (port: number) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Kenza server running on http://0.0.0.0:${port}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        const fallbackPort = port + 1;
        console.warn(`[server] Port ${port} is busy, retrying on ${fallbackPort}`);
        startListener(fallbackPort);
        return;
      }

      throw error;
    });
  };

  app.use(express.json());
  app.use('/products', express.static(path.join(projectRoot, 'public', 'products')));
  app.use(express.static(path.join(projectRoot, 'public')));

  // Initialize BullMQ worker queue service & RAG index
  QueueService.initializeWorker();
  RagService.initializeIndex().catch((err) => console.warn('[RAG] Background indexing deferred:', err));

  // --- 1. Health check ---
  app.get(['/health', '/api/health'], (req, res) => {
    res.json({
      status: 'ok',
      service: 'kenza-sales-agent-api',
      timestamp: new Date().toISOString(),
      orchestrator: 'LangGraph-compatible',
      database: 'PostgreSQL-ready / Active',
      queue: 'BullMQ-compatible / Active',
      models: {
        reasoning: process.env.LLM_MODEL || 'gpt-5.5',
        highVolume: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1',
        embeddings: process.env.EMBEDDING_MODEL || 'embedder-small-3',
      },
    });
  });

  // --- 2. Customers API ---
  app.get('/api/customers', (req, res) => {
    res.json(db.listCustomers());
  });

  app.get('/api/customers/:id', (req, res) => {
    const customer = db.getCustomer(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  });

  app.get('/api/customers/:id/history', (req, res) => {
    const history = db.getCustomerHistory(req.params.id);
    if (!history) return res.status(404).json({ error: 'Customer history not found' });
    res.json(history);
  });

  // --- 3. Products & Stock API ---
  app.get('/api/products', (req, res) => {
    const query = (req.query.q as string) || '';
    const category = req.query.category as string | undefined;
    const products = db.searchProducts(query, category);
    res.json(products);
  });

  app.get('/api/products/:id', (req, res) => {
    const product = db.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  });

  app.get('/api/products/:id/stock', (req, res) => {
    try {
      const size = req.query.size as string | undefined;
      const color = req.query.color as string | undefined;
      const stock = db.checkStock(req.params.id, undefined, size, color);
      res.json(stock);
    } catch (err: unknown) {
      res.status(404).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- 4. Conversations & Messaging API ---
  app.get('/api/conversations', (req, res) => {
    res.json(db.listConversations());
  });

  app.post('/api/conversations', (req, res) => {
    const { customerId } = req.body;
    const conv = db.getOrCreateConversation(undefined, customerId);
    res.status(201).json(conv);
  });

  app.get('/api/conversations/:id', (req, res) => {
    const conv = db.getConversation(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conv);
  });

  // Core messaging endpoint that triggers LangGraph Agent Orchestrator
  app.post('/api/conversations/:id/messages', async (req, res) => {
    try {
      const { content, customerId, customerPhone, customerName, isHumanMerchant } = req.body;
      const conversationId = req.params.id;

      if (!content) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // If sent directly by merchant during human takeover
      if (isHumanMerchant) {
        const msg = db.addMessage(conversationId, 'human_agent', content);
        return res.json({ message: msg, takeover: true });
      }

      const activeCustId = customerId || 'cust-yassine-01';
      const result = await AgentOrchestrator.processMessage({
        conversationId,
        customerId: activeCustId,
        messageText: content,
        customerPhone,
        customerName,
      });

      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Direct chat endpoint used by conversational UI
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        conversationId,
        customerId,
        messageText,
        content,
        message,
        customerPhone,
        customerName,
        isHumanMerchant,
      } = req.body;

      const text = messageText || content || message;
      if (!text) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const activeCustId = customerId || 'cust-yassine-01';
      const activeConvId = conversationId || `conv-${activeCustId}`;

      // If merchant sent message during human takeover
      if (isHumanMerchant) {
        const msg = db.addMessage(activeConvId, 'human_agent', text);
        return res.json({
          replyMessage: msg,
          takeover: true,
        });
      }

      const result = await AgentOrchestrator.processMessage({
        conversationId: activeConvId,
        customerId: activeCustId,
        messageText: text,
        customerPhone,
        customerName,
      });

      res.json(result);
    } catch (err: unknown) {
      console.error('[API /api/chat error]', err);
      res.status(500).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // --- 5. Carts API ---
  app.get('/api/carts/:id', (req, res) => {
    const cart = db.getCart(req.params.id);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json(cart);
  });

  app.put('/api/carts/:id', (req, res) => {
    try {
      const { action, productId, variantId, itemId, quantity, size, color, city, discountMAD } = req.body;
      const result = BusinessTools.updateCart({
        cartId: req.params.id,
        action,
        productId,
        variantId,
        itemId,
        quantity,
        size,
        color,
        city,
        discountMAD,
      });

      if (!result.success) {
        return res.status(400).json(result.error);
      }
      res.json(result.data);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- 6. Orders API ---
  app.get('/api/orders', (req, res) => {
    res.json(db.listOrders());
  });

  app.get('/api/orders/:id', (req, res) => {
    const order = db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  });

  app.post('/api/orders', (req, res) => {
    try {
      const { cartId, customerName, customerPhone, deliveryAddress, deliveryCity, idempotencyKey } = req.body;
      const result = BusinessTools.createOrder({
        cartId,
        customerName,
        customerPhone,
        deliveryAddress,
        deliveryCity,
        idempotencyKey,
      });

      if (!result.success) {
        return res.status(400).json(result.error);
      }
      res.status(201).json(result.data);
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- 7. Follow-ups API ---
  app.get('/api/followups', (req, res) => {
    res.json(db.listFollowups());
  });

  app.post('/api/followups', (req, res) => {
    const { conversationId, customerId, cartId, delayMinutes } = req.body;
    const result = BusinessTools.scheduleFollowup({
      conversationId,
      customerId,
      cartId,
      delayMinutes,
    });
    res.status(201).json(result.data);
  });

  app.post('/api/followups/:id/cancel', (req, res) => {
    const result = BusinessTools.cancelFollowup(req.params.id, req.body.reason);
    res.json(result.data);
  });

  // --- 8. Escalations API & Takeover ---
  app.get('/api/escalations', (req, res) => {
    res.json(db.listEscalations());
  });

  app.post('/api/escalations/:id/takeover', (req, res) => {
    const agentName = req.body.agentName || 'Gérant du Magasin';
    const result = db.takeoverEscalation(req.params.id, agentName);
    if (!result) return res.status(404).json({ error: 'Escalation not found' });
    res.json(result);
  });

  // --- 9. Analytics & API Usage API ---
  app.get('/api/analytics', (req, res) => {
    res.json(db.getAnalytics());
  });

  app.get(['/api/telemetry', '/api/api-usage'], (req, res) => {
    const summary = db.getApiUsageSummary();
    res.json({
      ...summary,
      avgLatencyMs: summary.averageLatencyMs,
      records: summary.recentRecords,
    });
  });

  // --- 9b. Dynamic Dataset: Promotions, Policy & FAQ ---
  app.get('/api/promotions', (req, res) => {
    res.json(db.getPromotions());
  });

  app.get('/api/policy', (req, res) => {
    res.json({
      commercialPolicy: db.getCommercialPolicy(),
      storeFaq: db.getStoreFaq(),
    });
  });

  // Semantic RAG search endpoint (Embedder-small-3 cosine similarity)
  app.post('/api/rag/search', async (req, res) => {
    try {
      const { query, category, limit } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }
      const results = await RagService.search(query, {
        category,
        limit: limit ? parseInt(limit, 10) : 5,
      });
      res.json({ query, count: results.length, results });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- 10. Database Reset & Re-seed ---
  app.post('/api/seed', (req, res) => {
    db.seed();
    res.json({ message: 'Dataset reloaded dynamically from CSV and MD files successfully' });
  });

  app.post(['/api/reset', '/api/demo/reset'], (req, res) => {
    db.init(true);
    res.json({ message: 'Database reset to initial demo state' });
  });

  // --- 11. Automated Scenario Runner (for Evaluator 1-Click Verification) ---
  app.post('/api/demo/run-scenario', async (req, res) => {
    const scenario = req.body.scenario as string;
    const testConvId = `demo-${scenario}-${Date.now()}`;
    const testCustomerId = 'cust-yassine-01';

    try {
      let promptText = '';
      switch (scenario) {
        case 'A': // Normal sale
          promptText = 'سلام، بغيت شي جلابة سوسدي مخيطة مزيان قياس M ل الدار البيضاء، صيفطوها ليا';
          break;
        case 'B': // Out of stock alternative
          promptText = 'بصحة وراحة، بغيت جلابة سوسدي فهاد اللون الأزرق قياس L واش كاينة؟';
          break;
        case 'C': // Change size
          promptText = 'سلام، بدلت رأيي، عطيني قياس L فجلابة سوسدي بلاصت M';
          break;
        case 'D': // Discount floor violation
          promptText = 'واش كاين شي تخفيض؟ ديرها ليا ب 500 درهم دابا ناخدها (minimum floor is 650)';
          break;
        case 'E': // Memory
          promptText = 'سلام كنزة، أنا ياسين عاوتاني، شنو كاين جديد؟';
          break;
        case 'F': // Abandoned cart follow-up
          promptText = 'عجباتني هاد الجلابة وغادي نفكر فيها من بعد';
          break;
        case 'G': // Human escalation
          promptText = 'Je veux une facture au nom de ma société SARL avec ICE et TVA';
          break;
        case 'H': // Darija with spelling mistakes
          promptText = 'ch7al taman dyal had caftan w wash katsifto l fes bzerba?';
          break;
        case 'I': // Store information & showrooms inquiry
          promptText = 'Quelles sont les adresses de vos boutiques, vos horaires et votre numéro de téléphone ?';
          break;
        default:
          promptText = 'سلام، كنزة مرحبا';
      }

      const result = await AgentOrchestrator.processMessage({
        conversationId: testConvId,
        customerId: testCustomerId,
        messageText: promptText,
      });

      res.json({
        scenario,
        promptSent: promptText,
        result,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // --- API 404 fallback (prevents API calls from returning Vite SPA HTML) ---
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // --- Vite / Static Files Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  startListener(preferredPort);
}

startServer();
