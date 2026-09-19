/**
 * Kenza — Autonomous Moroccan Sales Agent
 * Core TypeScript Contracts and Domain Models
 */

export type LanguageCode = 'darija' | 'fr' | 'ar';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string;
  languagePreference: LanguageCode;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  tags?: string[];
  totalOrdersCount: number;
  totalSpentMAD: number;
}

export interface CustomerHistory {
  customer: Customer;
  previousOrders: Order[];
  previousConversations: ConversationSummary[];
  preferredCategory?: string;
  preferredSize?: string;
}

export interface ConversationSummary {
  id: string;
  status: ConversationStatus;
  lastMessageAt: string;
  summary: string;
  outcome: 'ordered' | 'abandoned' | 'escalated' | 'in_progress';
}

export type ConversationStatus = 'active' | 'escalated' | 'human_takeover' | 'closed';

export type MessageSender = 'customer' | 'assistant' | 'human_agent' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  metadata?: {
    intent?: string;
    toolCalls?: string[];
    suggestedProducts?: string[];
    cartState?: Partial<Cart>;
    audioUrl?: string;
    imageUrl?: string;
    isFollowUp?: boolean;
    traceId?: string;
  };
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string; // e.g., 'S', 'M', 'L', 'XL', 'Standard', '85', '90'
  color: string; // e.g., 'Bleu Majorelle', 'Vert Émeraude', 'Noir Doré'
  colorHex?: string;
  priceMAD: number;
  stockQuantity: number;
  isAvailable: boolean;
  imageUrl?: string;
  matiere?: string;
  saison?: string;
  delaiReassortJours?: number;
  codeBarre?: string;
  poidsG?: number;
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  nameDarija?: string;
  description: string;
  category: 'caftan' | 'djellaba' | 'cosmetique' | 'artisanat' | 'chaussures' | string;
  basePriceMAD: number;
  minPriceFloorMAD: number; // Strictly enforced: LLM cannot discount below this floor
  maxDiscountPercent: number; // e.g. 10 or 15
  imageUrl: string;
  tags: string[];
  variants: ProductVariant[];
  totalStock: number;
  inStock: boolean;
  ref?: string;
  modele?: string;
  famille?: string;
  genre?: string;
}

export interface InventoryCheckResult {
  productId: string;
  variantId?: string;
  inStock: boolean;
  availableQuantity: number;
  requestedQuantity: number;
  alternativeVariants?: ProductVariant[];
  alternativeProducts?: Product[];
}

export type CartStatus = 'EMPTY' | 'ACTIVE' | 'ABANDONED' | 'CHECKOUT' | 'ORDERED';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  color: string;
  unitPriceMAD: number;
  quantity: number;
  subtotalMAD: number;
}

export interface Cart {
  id: string;
  customerId: string;
  conversationId: string;
  status: CartStatus;
  items: CartItem[];
  subtotalMAD: number;
  discountMAD: number;
  discountCode?: string;
  deliveryFeeMAD: number;
  totalMAD: number;
  city?: string;
  deliveryAddress?: string;
  createdAt: string;
  updatedAt: string;
  abandonedAt?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  color: string;
  unitPriceMAD: number;
  quantity: number;
  totalMAD: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  conversationId: string;
  cartId: string;
  items: OrderItem[];
  subtotalMAD: number;
  discountMAD: number;
  deliveryFeeMAD: number;
  totalMAD: number;
  deliveryCity: string;
  deliveryAddress: string;
  status: OrderStatus;
  paymentMethod: 'cash_on_delivery' | 'cmi_online';
  createdAt: string;
  updatedAt: string;
  idempotencyKey: string;
}

export interface DeliveryRule {
  city: string;
  feeMAD: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  freeShippingThresholdMAD: number;
  isAvailable: boolean;
  delaiHeures?: number;
  paiementALaLivraison?: boolean;
  retraitBoutique?: boolean;
}

export interface PromotionRule {
  ref: string;
  modele: string;
  prixNormalMAD: number;
  prixPromoMAD: number;
  debut: string;
  fin: string;
  condition: string;
  isActive: boolean;
}

export interface DiscountPolicy {
  maxDiscountPercentGlobal: number; // e.g. 15%
  minOrderAmountForDiscountMAD: number; // e.g. 500 MAD
  vipDiscountPercent: number; // e.g. 20%
  floorPriceAbsoluteEnforced: boolean;
}

export type FollowUpStatus = 'scheduled' | 'executed' | 'cancelled' | 'failed';

export interface FollowUp {
  id: string;
  conversationId: string;
  customerId: string;
  cartId: string;
  scheduledAt: string;
  executedAt?: string;
  status: FollowUpStatus;
  attemptNumber: number;
  maxAttempts: number;
  messageGenerated?: string;
  cancellationReason?: string;
  createdAt: string;
}

export type EscalationReason =
  | 'unsupported_request'
  | 'human_requested'
  | 'billing_invoice_requested'
  | 'severe_complaint'
  | 'discount_floor_exceeded'
  | 'stock_issue_complex'
  | 'out_of_domain';

export type EscalationStatus = 'pending' | 'taken_over' | 'resolved';

export interface Escalation {
  id: string;
  conversationId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  reason: EscalationReason;
  reasonDescription: string;
  customerContext: string;
  conversationSnippet: string;
  cartSnapshot?: Partial<Cart>;
  status: EscalationStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  resolvedAt?: string;
  takenOverBy?: string;
}

export interface ApiUsageRecord {
  id: string;
  timestamp: string;
  requestId: string;
  conversationId?: string;
  model: string;
  endpoint: string;
  success: boolean;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  errorMessage?: string;
}

export interface ApiUsageSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  averageLatencyMs: number;
  recentRecords: ApiUsageRecord[];
}

export interface ToolResult<T = unknown> {
  success: boolean;
  toolName: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  executionTimeMs: number;
}

export interface ExecutionTraceStep {
  stepNumber: number;
  timestamp: string;
  component: 'orchestrator' | 'conversation_agent' | 'catalogue_agent' | 'guardrail' | 'escalation' | 'relance' | 'tool';
  action: string;
  details?: Record<string, unknown>;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  decision?: string;
}

export interface AgentState {
  conversationId: string;
  customerId: string;
  customerName?: string;
  customerCity?: string;
  language: LanguageCode;
  messages: Message[];
  currentIntent?: string;
  detectedEntities?: {
    productName?: string;
    size?: string;
    color?: string;
    quantity?: number;
    city?: string;
    discountRequested?: boolean;
    discountPercentRequested?: number;
    requestedPrice?: number;
  };
  selectedProduct?: Product;
  selectedVariant?: ProductVariant;
  cart?: Cart;
  deliveryInfo?: {
    city: string;
    feeMAD: number;
    estimatedDays: string;
    address?: string;
  };
  toolResults: Record<string, ToolResult>;
  currentStage: 'greeting' | 'qualifying' | 'catalog_search' | 'recommending' | 'variant_selection' | 'discount_handling' | 'checkout' | 'order_confirmed' | 'escalated' | 'followup_sent';
  escalationStatus?: {
    isEscalated: boolean;
    reason?: EscalationReason;
    details?: string;
  };
  followupStatus?: {
    isScheduled: boolean;
    followupId?: string;
  };
  orderStatus?: {
    orderId?: string;
    orderNumber?: string;
    totalMAD?: number;
  };
  trace: ExecutionTraceStep[];
}
