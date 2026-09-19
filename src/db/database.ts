import fs from 'fs';
import path from 'path';
import {
  Customer,
  CustomerHistory,
  Product,
  ProductVariant,
  Cart,
  CartItem,
  Order,
  DeliveryRule,
  DiscountPolicy,
  FollowUp,
  Escalation,
  ConversationSummary,
  Message,
  ApiUsageRecord,
  ApiUsageSummary,
  ExecutionTraceStep,
  PromotionRule,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_DELIVERY_RULES,
  INITIAL_DISCOUNT_POLICY,
  INITIAL_ORDERS,
} from '../data/seedData';
import { DatasetLoader } from '../data/csvDataLoader';
import { DuplicateOrderError, ProductNotFoundError, StockUnavailableError } from '../utils/errors';

export interface DatabaseState {
  customers: Record<string, Customer>;
  products: Record<string, Product>;
  deliveryRules: Record<string, DeliveryRule>;
  discountPolicy: DiscountPolicy;
  promotions: Record<string, PromotionRule>;
  commercialPolicyText: string;
  storeFaqText: string;
  carts: Record<string, Cart>;
  orders: Record<string, Order>;
  conversations: Record<
    string,
    {
      id: string;
      customerId?: string;
      status: 'active' | 'escalated' | 'human_takeover' | 'closed';
      channel: string;
      summary: string;
      createdAt: string;
      updatedAt: string;
      messages: Message[];
      latestTrace?: ExecutionTraceStep[];
    }
  >;
  followups: Record<string, FollowUp>;
  escalations: Record<string, Escalation>;
  apiUsage: ApiUsageRecord[];
}

class DatabaseService {
  private state: DatabaseState = {
    customers: {},
    products: {},
    deliveryRules: {},
    discountPolicy: INITIAL_DISCOUNT_POLICY,
    promotions: {},
    commercialPolicyText: '',
    storeFaqText: '',
    carts: {},
    orders: {},
    conversations: {},
    followups: {},
    escalations: {},
    apiUsage: [],
  };

  private storageFile = path.resolve(process.cwd(), 'data_kenza_store.json');
  private initialized = false;

  constructor() {
    this.init();
  }

  public init(forceReset = false) {
    if (this.initialized && !forceReset) return;

    if (!forceReset && fs.existsSync(this.storageFile)) {
      try {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        this.state = JSON.parse(raw);
        this.initialized = true;
        return;
      } catch {
        // Fallback to fresh seed on parse error
      }
    }

    this.seed();
    this.initialized = true;
  }

  private save() {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch {
      // Ignore write errors in restricted environments
    }
  }

  public seed() {
    this.state = {
      customers: {},
      products: {},
      deliveryRules: {},
      discountPolicy: { ...INITIAL_DISCOUNT_POLICY },
      promotions: {},
      commercialPolicyText: '',
      storeFaqText: '',
      carts: {},
      orders: {},
      conversations: {},
      followups: {},
      escalations: {},
      apiUsage: [],
    };

    // 1. Seed customers: Load 120 customers from /data/dataset/clients.csv
    const csvCustomers = DatasetLoader.loadCustomers();
    for (const c of csvCustomers) {
      this.state.customers[c.id] = c;
    }
    // Also merge foundational initial customers for test suite stability
    for (const c of INITIAL_CUSTOMERS) {
      this.state.customers[c.id] = { ...c };
    }

    // 2. Seed products: Load 80 items grouped into models from /data/dataset/catalogue.csv
    const csvProducts = DatasetLoader.loadProducts();
    for (const p of csvProducts) {
      this.state.products[p.id] = p;
    }
    // Also merge foundational demo products for test suite and demo stability
    for (const p of INITIAL_PRODUCTS) {
      const cloned = JSON.parse(JSON.stringify(p)) as Product;
      cloned.totalStock = cloned.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
      cloned.inStock = cloned.totalStock > 0;
      this.state.products[cloned.id] = cloned;
    }

    // 3. Seed delivery rules from /data/dataset/livraison.csv
    const csvDeliveryRules = DatasetLoader.loadDeliveryRules();
    for (const d of csvDeliveryRules) {
      this.state.deliveryRules[d.city.toLowerCase()] = d;
      // Handle Moroccan alias names like 'casa'
      if (d.city.toLowerCase() === 'casablanca') {
        this.state.deliveryRules['casa'] = { ...d, city: 'Casablanca' };
      }
      if (d.city.toLowerCase() === 'fès') {
        this.state.deliveryRules['fes'] = { ...d, city: 'Fès' };
      }
      if (d.city.toLowerCase() === 'meknès') {
        this.state.deliveryRules['meknes'] = { ...d, city: 'Meknès' };
      }
      if (d.city.toLowerCase() === 'tétouan') {
        this.state.deliveryRules['tetouan'] = { ...d, city: 'Tétouan' };
      }
    }
    for (const d of INITIAL_DELIVERY_RULES) {
      if (!this.state.deliveryRules[d.city.toLowerCase()]) {
        this.state.deliveryRules[d.city.toLowerCase()] = { ...d };
      }
    }

    // 4. Seed promotions from /data/dataset/promotions.csv
    const csvPromotions = DatasetLoader.loadPromotions();
    for (const pr of csvPromotions) {
      this.state.promotions[pr.ref] = pr;
    }

    // 5. Seed historical orders from /data/dataset/commandes.csv & commandes-lignes.csv
    const csvOrders = DatasetLoader.loadHistoricalOrders(Object.values(this.state.customers));
    for (const o of csvOrders) {
      this.state.orders[o.id] = o;
    }
    for (const o of INITIAL_ORDERS) {
      this.state.orders[o.id] = { ...o };
    }

    // 6. Seed commercial policy and boutique FAQ from markdown files
    this.state.commercialPolicyText = DatasetLoader.loadCommercialPolicy();
    this.state.storeFaqText = DatasetLoader.loadStoreFaq();

    // 7. Seed initial conversation with memory for Yassine
    const yassineConvId = 'conv-yassine-init';
    this.state.conversations[yassineConvId] = {
      id: yassineConvId,
      customerId: 'cust-yassine-01',
      status: 'closed',
      channel: 'whatsapp_simulator',
      summary: 'Achat de Djellaba Royale et Gandora en taille L.',
      createdAt: '2026-02-05T14:00:00Z',
      updatedAt: '2026-02-05T14:25:00Z',
      messages: [
        {
          id: 'msg-yassine-1',
          conversationId: yassineConvId,
          sender: 'customer',
          content: 'Salam Kenza, bghit chi jalaba w gandora mzyana taille L l Casablanca.',
          timestamp: '2026-02-05T14:05:00Z',
        },
        {
          id: 'msg-yassine-2',
          conversationId: yassineConvId,
          sender: 'assistant',
          content: 'وعليكم السلام سي ياسين! مرحبا بك 😊 كاينين موديلات رائعين فالقياس L فجلابة سوسدي وقندورة مراكشية.',
          timestamp: '2026-02-05T14:06:00Z',
        },
      ],
    };

    this.save();
  }

  // --- Customers ---
  public getCustomer(idOrPhone: string): Customer | null {
    const direct = this.state.customers[idOrPhone];
    if (direct) return direct;
    const clean = idOrPhone.replace(/\s+/g, '');
    for (const c of Object.values(this.state.customers)) {
      if (c.phone.replace(/\s+/g, '') === clean || c.id === idOrPhone) {
        return c;
      }
    }
    return null;
  }

  public getOrCreateCustomer(phone: string, name = 'Client WhatsApp', city = 'Casablanca'): Customer {
    const existing = this.getCustomer(phone);
    if (existing) return existing;

    const id = `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newCust: Customer = {
      id,
      name,
      phone,
      city,
      languagePreference: 'darija',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['Nouveau'],
      totalOrdersCount: 0,
      totalSpentMAD: 0,
    };
    this.state.customers[id] = newCust;
    this.save();
    return newCust;
  }

  public listCustomers(): Customer[] {
    return Object.values(this.state.customers);
  }

  public getCustomerHistory(customerId: string): CustomerHistory | null {
    const customer = this.getCustomer(customerId);
    if (!customer) return null;

    const previousOrders = Object.values(this.state.orders).filter((o) => o.customerId === customer.id);
    const previousConversations: ConversationSummary[] = Object.values(this.state.conversations)
      .filter((c) => c.customerId === customer.id)
      .map((c) => ({
        id: c.id,
        status: c.status,
        lastMessageAt: c.updatedAt,
        summary: c.summary,
        outcome: c.status === 'closed' ? 'ordered' : c.status === 'escalated' ? 'escalated' : 'in_progress',
      }));

    return {
      customer,
      previousOrders,
      previousConversations,
      preferredCategory: 'djellaba',
      preferredSize: 'L',
    };
  }

  // --- Products & Inventory ---
  public listProducts(): Product[] {
    return Object.values(this.state.products);
  }

  public getProduct(idOrSku: string): Product | null {
    if (!idOrSku) return null;
    if (this.state.products[idOrSku]) return this.state.products[idOrSku];

    const clean = idOrSku.toLowerCase().trim();
    // Also lookup by variant SKU or ID
    for (const p of Object.values(this.state.products)) {
      if (p.id.toLowerCase() === clean) return p;
      if (p.variants.some((v) => v.sku.toLowerCase() === clean || v.id.toLowerCase() === clean)) {
        return p;
      }
    }
    return null;
  }

  public searchProducts(query: string, category?: string): Product[] {
    const q = query.toLowerCase().trim();
    return Object.values(this.state.products).filter((p) => {
      const matchCat = category
        ? p.category.toLowerCase() === category.toLowerCase() ||
          p.famille?.toLowerCase() === category.toLowerCase()
        : true;
      if (!matchCat) return false;
      if (!q) return true;

      const inName = p.name.toLowerCase().includes(q);
      const inAr = p.nameAr?.includes(q);
      const inDarija = p.nameDarija?.toLowerCase().includes(q);
      const inDesc = p.description.toLowerCase().includes(q);
      const inTags = p.tags.some((t) => t.toLowerCase().includes(q));
      const inVariants = p.variants.some(
        (v) =>
          v.sku.toLowerCase().includes(q) ||
          v.color.toLowerCase().includes(q) ||
          v.size.toLowerCase() === q ||
          (v.matiere && v.matiere.toLowerCase().includes(q))
      );
      return inName || inAr || inDarija || inDesc || inTags || inVariants;
    });
  }

  public checkStock(productId: string, variantId?: string, size?: string, color?: string): { inStock: boolean; quantity: number; variant?: ProductVariant; alternatives: ProductVariant[] } {
    const product = this.getProduct(productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    let targetVariant: ProductVariant | undefined;
    if (variantId) {
      targetVariant = product.variants.find(
        (v) => v.id === variantId || v.sku.toLowerCase() === variantId.toLowerCase()
      );
    } else if (size && color) {
      targetVariant = product.variants.find(
        (v) => v.size.toLowerCase() === size.toLowerCase() && v.color.toLowerCase().includes(color.toLowerCase())
      );
    } else if (size) {
      targetVariant = product.variants.find((v) => v.size.toLowerCase() === size.toLowerCase());
    }

    const alternatives = product.variants.filter((v) => v.isAvailable && v.stockQuantity > 0 && v.id !== targetVariant?.id);

    if (targetVariant) {
      return {
        inStock: targetVariant.isAvailable && targetVariant.stockQuantity > 0,
        quantity: targetVariant.stockQuantity,
        variant: targetVariant,
        alternatives,
      };
    }

    return {
      inStock: product.inStock && product.totalStock > 0,
      quantity: product.totalStock,
      alternatives,
    };
  }

  public reserveStock(productId: string, variantId: string, quantity: number): boolean {
    const product = this.getProduct(productId);
    if (!product) return false;
    const variant = product.variants.find((v) => v.id === variantId || v.sku === variantId);
    if (!variant || variant.stockQuantity < quantity) return false;

    variant.stockQuantity -= quantity;
    variant.isAvailable = variant.stockQuantity > 0;
    product.totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
    product.inStock = product.totalStock > 0;
    this.save();
    return true;
  }

  // --- Delivery Rules ---
  public getDeliveryRule(city: string): DeliveryRule {
    const normalized = city.toLowerCase().trim();
    const rule = this.state.deliveryRules[normalized];
    if (rule) return rule;

    // Cities absent from delivery grid trigger escalation as per politique-commerciale.md
    return {
      city,
      feeMAD: 40,
      estimatedDaysMin: 2,
      estimatedDaysMax: 4,
      freeShippingThresholdMAD: 500,
      isAvailable: false, // Explicitly false so agents can identify cities outside the grid
    };
  }

  public listDeliveryRules(): DeliveryRule[] {
    return Object.values(this.state.deliveryRules);
  }

  public isCityInDeliveryGrid(city: string): boolean {
    const normalized = city.toLowerCase().trim();
    return !!this.state.deliveryRules[normalized];
  }

  public isCashOnDeliveryAllowed(city: string): boolean {
    const normalized = city.toLowerCase().trim();
    const rule = this.state.deliveryRules[normalized];
    return rule?.paiementALaLivraison ?? false;
  }

  public isStorePickupAllowed(city: string): boolean {
    const normalized = city.toLowerCase().trim();
    const rule = this.state.deliveryRules[normalized];
    return rule?.retraitBoutique ?? false;
  }

  // --- Promotions, Commercial Policy & FAQ ---
  public getPromotions(): PromotionRule[] {
    return Object.values(this.state.promotions);
  }

  public getPromotionForRef(ref: string): PromotionRule | null {
    return this.state.promotions[ref] || null;
  }

  public getCommercialPolicy(): string {
    return this.state.commercialPolicyText;
  }

  public getStoreFaq(): string {
    return this.state.storeFaqText;
  }

  // --- Discount Policy ---
  public getDiscountPolicy(): DiscountPolicy {
    return this.state.discountPolicy;
  }

  // --- Carts ---
  public getOrCreateCart(conversationId: string, customerId: string): Cart {
    // Look for active cart in conversation
    for (const c of Object.values(this.state.carts)) {
      if (c.conversationId === conversationId && (c.status === 'ACTIVE' || c.status === 'EMPTY' || c.status === 'CHECKOUT')) {
        return c;
      }
    }

    const cartId = `cart-${Date.now()}`;
    const newCart: Cart = {
      id: cartId,
      customerId,
      conversationId,
      status: 'EMPTY',
      items: [],
      subtotalMAD: 0,
      discountMAD: 0,
      deliveryFeeMAD: 0,
      totalMAD: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.carts[cartId] = newCart;
    this.save();
    return newCart;
  }

  public getCart(id: string): Cart | null {
    return this.state.carts[id] || null;
  }

  public saveCart(cart: Cart): Cart {
    cart.updatedAt = new Date().toISOString();
    this.state.carts[cart.id] = cart;
    this.save();
    return cart;
  }

  // --- Orders ---
  public createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
    // Idempotency check
    for (const o of Object.values(this.state.orders)) {
      if (o.idempotencyKey === orderData.idempotencyKey) {
        throw new DuplicateOrderError(o.orderNumber, { existingOrder: o });
      }
    }

    // Verify stock and reserve
    for (const item of orderData.items) {
      const stockCheck = this.checkStock(item.productId, item.variantId);
      if (!stockCheck.inStock || stockCheck.quantity < item.quantity) {
        throw new StockUnavailableError(item.productName, item.size, { requested: item.quantity, available: stockCheck.quantity });
      }
    }

    // Deduct stock
    for (const item of orderData.items) {
      this.reserveStock(item.productId, item.variantId, item.quantity);
    }

    const id = `ord-${Date.now()}`;
    const orderNumber = `KZ-${new Date().getFullYear()}-${String(Object.keys(this.state.orders).length + 101).padStart(5, '0')}`;

    const order: Order = {
      ...orderData,
      id,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.orders[id] = order;

    // Update customer stats
    const customer = this.state.customers[order.customerId];
    if (customer) {
      customer.totalOrdersCount += 1;
      customer.totalSpentMAD += order.totalMAD;
      customer.updatedAt = new Date().toISOString();
    }

    // Update cart status to ORDERED
    const cart = this.state.carts[order.cartId];
    if (cart) {
      cart.status = 'ORDERED';
      cart.updatedAt = new Date().toISOString();
    }

    // Cancel any pending follow-up for this customer/conversation
    for (const f of Object.values(this.state.followups)) {
      if (f.conversationId === order.conversationId && f.status === 'scheduled') {
        f.status = 'cancelled';
        f.cancellationReason = `Order completed (#${orderNumber})`;
      }
    }

    this.save();
    return order;
  }

  public getOrder(id: string): Order | null {
    return this.state.orders[id] || null;
  }

  public listOrders(): Order[] {
    return Object.values(this.state.orders).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Conversations & Messages ---
  public getOrCreateConversation(id?: string, customerId?: string): { id: string; customerId?: string; status: 'active' | 'escalated' | 'human_takeover' | 'closed'; channel: string; summary: string; createdAt: string; updatedAt: string; messages: Message[]; latestTrace?: ExecutionTraceStep[] } {
    if (id && this.state.conversations[id]) {
      return this.state.conversations[id];
    }

    const convId = id || `conv-${Date.now()}`;
    const conv = {
      id: convId,
      customerId,
      status: 'active' as const,
      channel: 'whatsapp_simulator',
      summary: 'Nouvelle conversation client',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    this.state.conversations[convId] = conv;
    this.save();
    return conv;
  }

  public getConversation(id: string) {
    return this.state.conversations[id] || null;
  }

  public listConversations() {
    return Object.values(this.state.conversations).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public addMessage(conversationId: string, sender: Message['sender'], content: string, metadata?: Message['metadata']): Message {
    const conv = this.getOrCreateConversation(conversationId);
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      conversationId,
      sender,
      content,
      timestamp: new Date().toISOString(),
      metadata,
    };
    conv.messages.push(msg);
    conv.updatedAt = new Date().toISOString();
    this.save();
    return msg;
  }

  public updateConversationTrace(conversationId: string, trace: ExecutionTraceStep[]) {
    const conv = this.getOrCreateConversation(conversationId);
    conv.latestTrace = trace;
    this.save();
  }

  public setConversationStatus(conversationId: string, status: 'active' | 'escalated' | 'human_takeover' | 'closed') {
    const conv = this.getOrCreateConversation(conversationId);
    conv.status = status;
    conv.updatedAt = new Date().toISOString();
    this.save();
  }

  // --- Follow-ups ---
  public scheduleFollowup(conversationId: string, customerId: string, cartId: string, scheduledAt: string): FollowUp {
    const id = `fol-${Date.now()}`;
    const followUp: FollowUp = {
      id,
      conversationId,
      customerId,
      cartId,
      scheduledAt,
      status: 'scheduled',
      attemptNumber: 1,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
    };
    this.state.followups[id] = followUp;
    this.save();
    return followUp;
  }

  public cancelFollowup(id: string, reason: string): FollowUp | null {
    const followUp = this.state.followups[id];
    if (!followUp) return null;
    followUp.status = 'cancelled';
    followUp.cancellationReason = reason;
    this.save();
    return followUp;
  }

  public listFollowups(): FollowUp[] {
    return Object.values(this.state.followups).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }

  public markFollowupExecuted(id: string, messageGenerated: string): FollowUp | null {
    const followUp = this.state.followups[id];
    if (!followUp) return null;
    followUp.status = 'executed';
    followUp.executedAt = new Date().toISOString();
    followUp.messageGenerated = messageGenerated;
    this.save();
    return followUp;
  }

  // --- Escalations ---
  public createEscalation(data: Omit<Escalation, 'id' | 'createdAt' | 'status'>): Escalation {
    const id = `esc-${Date.now()}`;
    const escalation: Escalation = {
      ...data,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.state.escalations[id] = escalation;
    this.setConversationStatus(data.conversationId, 'escalated');
    this.save();
    return escalation;
  }

  public takeoverEscalation(id: string, agentName: string): Escalation | null {
    const escalation = this.state.escalations[id];
    if (!escalation) return null;
    escalation.status = 'taken_over';
    escalation.takenOverBy = agentName;
    this.setConversationStatus(escalation.conversationId, 'human_takeover');
    this.save();
    return escalation;
  }

  public listEscalations(): Escalation[] {
    return Object.values(this.state.escalations).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- API Usage Tracking ---
  public recordApiUsage(record: Omit<ApiUsageRecord, 'id' | 'timestamp'>): ApiUsageRecord {
    const rec: ApiUsageRecord = {
      ...record,
      id: `api-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.apiUsage.push(rec);
    // Keep max 500 records
    if (this.state.apiUsage.length > 500) {
      this.state.apiUsage.shift();
    }
    this.save();
    return rec;
  }

  public getApiUsageSummary(): ApiUsageSummary {
    const records = this.state.apiUsage;
    const totalRequests = records.length;
    const successfulRequests = records.filter((r) => r.success).length;
    const failedRequests = records.filter((r) => !r.success).length;
    const totalTokens = records.reduce((acc, r) => acc + (r.totalTokens || 0), 0);
    const averageLatencyMs = totalRequests > 0 ? Math.round(records.reduce((acc, r) => acc + r.latencyMs, 0) / totalRequests) : 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalTokens,
      averageLatencyMs,
      recentRecords: records.slice(-50).reverse(),
    };
  }

  // --- Analytics Dashboard Data ---
  public getAnalytics() {
    const conversations = Object.values(this.state.conversations);
    const orders = Object.values(this.state.orders);
    const carts = Object.values(this.state.carts);
    const followups = Object.values(this.state.followups);
    const escalations = Object.values(this.state.escalations);

    const totalConversations = conversations.length;
    const activeConversations = conversations.filter((c) => c.status === 'active').length;
    const totalOrders = orders.length;
    const totalSalesMAD = orders.reduce((acc, o) => acc + o.totalMAD, 0);
    const abandonedCarts = carts.filter((c) => c.status === 'ABANDONED').length;
    const pendingFollowups = followups.filter((f) => f.status === 'scheduled').length;
    const pendingEscalations = escalations.filter((e) => e.status === 'pending').length;
    const conversionRate = totalConversations > 0 ? Number(((totalOrders / totalConversations) * 100).toFixed(1)) : 0;

    return {
      totalConversations,
      activeConversations,
      totalOrders,
      totalSalesMAD,
      conversionRate,
      abandonedCarts,
      pendingFollowups,
      pendingEscalations,
      ordersByStatus: {
        confirmed: orders.filter((o) => o.status === 'confirmed').length,
        delivered: orders.filter((o) => o.status === 'delivered').length,
        pending: orders.filter((o) => o.status === 'pending').length,
      },
    };
  }
}

export const db = new DatabaseService();
