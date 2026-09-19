import { db } from '../db/database';
import { CartEngine } from '../services/cartEngine';
import { DiscountPolicyEngine } from '../services/discountPolicy';
import {
  Customer,
  CustomerHistory,
  Product,
  Cart,
  Order,
  DeliveryRule,
  DiscountPolicy,
  FollowUp,
  Escalation,
  ToolResult,
  EscalationReason,
} from '../types';
import {
  ProductNotFoundError,
  StockUnavailableError,
  DeliveryCalculationError,
  UnauthorizedDiscountError,
} from '../utils/errors';

export class BusinessTools {
  private static wrapTool<T>(
    toolName: string,
    executor: () => T
  ): ToolResult<T> {
    const start = Date.now();
    try {
      const data = executor();
      return {
        success: true,
        toolName,
        data,
        executionTimeMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorCode = (err as { code?: string }).code || 'TOOL_EXECUTION_ERROR';
      return {
        success: false,
        toolName,
        error: {
          code: errorCode,
          message: errorMessage,
          details: (err as { details?: unknown }).details,
        },
        executionTimeMs: Date.now() - start,
      };
    }
  }

  // 1. getCustomer
  public static getCustomer(idOrPhone: string): ToolResult<Customer | null> {
    return this.wrapTool('getCustomer', () => {
      if (!idOrPhone || typeof idOrPhone !== 'string') {
        throw new Error('Valid id or phone string required');
      }
      return db.getCustomer(idOrPhone);
    });
  }

  // 2. getCustomerHistory
  public static getCustomerHistory(customerId: string): ToolResult<CustomerHistory | null> {
    return this.wrapTool('getCustomerHistory', () => {
      if (!customerId) throw new Error('customerId is required');
      return db.getCustomerHistory(customerId);
    });
  }

  // 3. searchProducts
  public static searchProducts(params: { query: string; category?: string }): ToolResult<Product[]> {
    return this.wrapTool('searchProducts', () => {
      const query = params?.query || '';
      return db.searchProducts(query, params?.category);
    });
  }

  // 4. getProduct
  public static getProduct(productId: string): ToolResult<Product> {
    return this.wrapTool('getProduct', () => {
      if (!productId) throw new Error('productId is required');
      const prod = db.getProduct(productId);
      if (!prod) throw new ProductNotFoundError(productId);
      return prod;
    });
  }

  // 5. checkStock
  public static checkStock(params: {
    productId: string;
    variantId?: string;
    size?: string;
    color?: string;
  }): ToolResult<{ inStock: boolean; quantity: number; alternatives: Product['variants'] }> {
    return this.wrapTool('checkStock', () => {
      if (!params?.productId) throw new Error('productId is required');
      const res = db.checkStock(params.productId, params.variantId, params.size, params.color);
      return {
        inStock: res.inStock,
        quantity: res.quantity,
        alternatives: res.alternatives,
      };
    });
  }

  // 6. calculateDelivery
  public static calculateDelivery(params: { city: string; cartSubtotalMAD?: number }): ToolResult<{
    city: string;
    feeMAD: number;
    estimatedDays: string;
    isFree: boolean;
  }> {
    return this.wrapTool('calculateDelivery', () => {
      if (!params?.city) throw new Error('city is required');
      const rule = db.getDeliveryRule(params.city);
      const subtotal = params.cartSubtotalMAD || 0;
      const isFree = subtotal >= rule.freeShippingThresholdMAD;
      const feeMAD = isFree ? 0 : rule.feeMAD;

      return {
        city: rule.city,
        feeMAD,
        estimatedDays: `${rule.estimatedDaysMin}-${rule.estimatedDaysMax} jours`,
        isFree,
        inDeliveryGrid: rule.isAvailable,
        paiementALaLivraison: rule.paiementALaLivraison ?? false,
        retraitBoutique: rule.retraitBoutique ?? false,
        delaiHeures: rule.delaiHeures,
      };
    });
  }

  // 7. getDeliveryRules
  public static getDeliveryRules(): ToolResult<DeliveryRule[]> {
    return this.wrapTool('getDeliveryRules', () => {
      return db.listDeliveryRules();
    });
  }

  // 7b. getPromotions
  public static getPromotions(params?: { ref?: string }) {
    return this.wrapTool('getPromotions', () => {
      if (params?.ref) {
        return db.getPromotionForRef(params.ref);
      }
      return db.getPromotions();
    });
  }

  // 7c. getCommercialPolicy
  public static getCommercialPolicy() {
    return this.wrapTool('getCommercialPolicy', () => {
      return {
        policyMarkdown: db.getCommercialPolicy(),
        faqMarkdown: db.getStoreFaq(),
        maxDiscountPercentWithoutValidation: 10,
        exchangeDays: 7,
        storePickupCities: ['Casablanca', 'Fès'],
        storePickupHours: 24,
      };
    });
  }

  // 8. getDiscountPolicy
  public static getDiscountPolicy(params?: {
    productId?: string;
    requestedPrice?: number;
    requestedPercent?: number;
    customerId?: string;
  }): ToolResult<DiscountPolicy & { evaluation?: unknown }> {
    return this.wrapTool('getDiscountPolicy', () => {
      const policy = db.getDiscountPolicy();
      if (params?.productId) {
        const prod = db.getProduct(params.productId);
        if (!prod) throw new ProductNotFoundError(params.productId);
        const customer = params.customerId ? db.getCustomer(params.customerId) : null;
        const evaluation = DiscountPolicyEngine.evaluateDiscount(
          prod,
          params.requestedPercent,
          params.requestedPrice,
          customer
        );
        return { ...policy, evaluation };
      }
      return { ...policy };
    });
  }

  // 9. getOrCreateCart
  public static getOrCreateCart(params: { conversationId: string; customerId: string }): ToolResult<Cart> {
    return this.wrapTool('getOrCreateCart', () => {
      if (!params?.conversationId || !params?.customerId) {
        throw new Error('conversationId and customerId are required');
      }
      return db.getOrCreateCart(params.conversationId, params.customerId);
    });
  }

  // 10. updateCart
  public static updateCart(params: {
    cartId: string;
    action: 'add' | 'remove' | 'update_quantity' | 'change_variant' | 'set_city' | 'apply_discount';
    productId?: string;
    variantId?: string;
    itemId?: string;
    quantity?: number;
    size?: string;
    color?: string;
    city?: string;
    discountMAD?: number;
  }): ToolResult<Cart> {
    return this.wrapTool('updateCart', () => {
      const { cartId, action } = params;
      if (!cartId) throw new Error('cartId is required');

      switch (action) {
        case 'add':
          if (!params.productId) throw new Error('productId is required for adding to cart');
          return CartEngine.addItem(cartId, params.productId, params.variantId, params.quantity || 1, params.size, params.color);

        case 'remove':
          if (!params.itemId && !params.variantId) throw new Error('itemId or variantId is required');
          return CartEngine.removeItem(cartId, params.itemId || params.variantId!);

        case 'update_quantity':
          if (!params.itemId && !params.variantId) throw new Error('itemId or variantId is required');
          return CartEngine.updateQuantity(cartId, params.itemId || params.variantId!, params.quantity ?? 1);

        case 'change_variant':
          if (!params.itemId && !params.variantId) throw new Error('itemId or variantId is required');
          if (!params.size) throw new Error('new size is required for variant change');
          return CartEngine.changeVariant(cartId, params.itemId || params.variantId!, params.size, params.color);

        case 'set_city':
          if (!params.city) throw new Error('city is required');
          return CartEngine.setDeliveryInfo(cartId, params.city);

        case 'apply_discount':
          return CartEngine.applyDiscount(cartId, params.discountMAD || 0);

        default:
          throw new Error(`Unsupported cart action: ${action}`);
      }
    });
  }

  // 11. createOrder
  public static createOrder(params: {
    cartId: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryCity: string;
    idempotencyKey?: string;
  }): ToolResult<Order> {
    return this.wrapTool('createOrder', () => {
      const { cartId, customerName, customerPhone, deliveryAddress, deliveryCity } = params;
      if (!cartId || !customerName || !customerPhone || !deliveryAddress || !deliveryCity) {
        throw new Error('cartId, customerName, customerPhone, deliveryAddress and deliveryCity are required');
      }

      const key = params.idempotencyKey || `idem-${cartId}-${customerPhone}`;
      return CartEngine.checkoutOrder(cartId, customerName, customerPhone, deliveryAddress, deliveryCity, key);
    });
  }

  // 12. getOrder
  public static getOrder(orderId: string): ToolResult<Order | null> {
    return this.wrapTool('getOrder', () => {
      if (!orderId) throw new Error('orderId is required');
      return db.getOrder(orderId);
    });
  }

  // 13. scheduleFollowup
  public static scheduleFollowup(params: {
    conversationId: string;
    customerId: string;
    cartId: string;
    delayMinutes?: number;
  }): ToolResult<FollowUp> {
    return this.wrapTool('scheduleFollowup', () => {
      const { conversationId, customerId, cartId, delayMinutes = 30 } = params;
      if (!conversationId || !customerId || !cartId) {
        throw new Error('conversationId, customerId, and cartId are required');
      }

      const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
      return db.scheduleFollowup(conversationId, customerId, cartId, scheduledAt);
    });
  }

  // 14. cancelFollowup
  public static cancelFollowup(followupId: string, reason = 'Customer renewed interaction'): ToolResult<FollowUp | null> {
    return this.wrapTool('cancelFollowup', () => {
      if (!followupId) throw new Error('followupId is required');
      return db.cancelFollowup(followupId, reason);
    });
  }

  // 15. createEscalation
  public static createEscalation(params: {
    conversationId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    reason: EscalationReason;
    reasonDescription: string;
    customerContext?: string;
    conversationSnippet?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): ToolResult<Escalation> {
    return this.wrapTool('createEscalation', () => {
      const { conversationId, customerId, customerName, customerPhone, reason, reasonDescription } = params;
      if (!conversationId || !customerId || !reason) {
        throw new Error('conversationId, customerId, and reason are required');
      }

      return db.createEscalation({
        conversationId,
        customerId,
        customerName: customerName || 'Client',
        customerPhone: customerPhone || 'Inconnu',
        reason,
        reasonDescription,
        customerContext: params.customerContext || '',
        conversationSnippet: params.conversationSnippet || '',
        priority: params.priority || 'medium',
      });
    });
  }

  // 16. getConversationContext
  public static getConversationContext(conversationId: string): ToolResult<{
    conversation: unknown;
    customer: Customer | null;
    cart: Cart | null;
    history: CustomerHistory | null;
  }> {
    return this.wrapTool('getConversationContext', () => {
      const conv = db.getConversation(conversationId);
      const customer = conv?.customerId ? db.getCustomer(conv.customerId) : null;
      const history = customer ? db.getCustomerHistory(customer.id) : null;
      let cart: Cart | null = null;
      if (conv?.customerId) {
        cart = db.getOrCreateCart(conversationId, conv.customerId);
      }
      return {
        conversation: conv,
        customer,
        cart,
        history,
      };
    });
  }

  // 17. trackApiUsage
  public static trackApiUsage(params: {
    requestId: string;
    conversationId?: string;
    model: string;
    endpoint: string;
    success: boolean;
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
    errorMessage?: string;
  }): ToolResult<unknown> {
    return this.wrapTool('trackApiUsage', () => {
      const totalTokens = (params.promptTokens || 0) + (params.completionTokens || 0);
      return db.recordApiUsage({
        ...params,
        totalTokens,
      });
    });
  }
}
