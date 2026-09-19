import { AgentState, Message, LanguageCode, Product, ProductVariant, Cart, ToolResult, ExecutionTraceStep } from '../types';

export function createInitialAgentState(params: {
  conversationId: string;
  customerId: string;
  customerName?: string;
  customerCity?: string;
  language?: LanguageCode;
  messages?: Message[];
  cart?: Cart;
}): AgentState {
  return {
    conversationId: params.conversationId,
    customerId: params.customerId,
    customerName: params.customerName,
    customerCity: params.customerCity,
    language: params.language || 'darija',
    messages: params.messages || [],
    currentIntent: undefined,
    detectedEntities: {},
    selectedProduct: undefined,
    selectedVariant: undefined,
    cart: params.cart,
    deliveryInfo: params.customerCity
      ? {
          city: params.customerCity,
          feeMAD: 25,
          estimatedDays: '1-2 jours',
        }
      : undefined,
    toolResults: {},
    currentStage: 'greeting',
    escalationStatus: { isEscalated: false },
    followupStatus: { isScheduled: false },
    orderStatus: undefined,
    trace: [],
  };
}

export function appendTrace(
  state: AgentState,
  component: ExecutionTraceStep['component'],
  action: string,
  details?: Record<string, unknown>,
  toolInfo?: { toolName: string; input?: unknown; output?: unknown }
) {
  const step: ExecutionTraceStep = {
    stepNumber: state.trace.length + 1,
    timestamp: new Date().toISOString(),
    component,
    action,
    details,
    toolName: toolInfo?.toolName,
    toolInput: toolInfo?.input,
    toolOutput: toolInfo?.output,
    decision: details?.decision as string | undefined,
  };
  state.trace.push(step);
}
