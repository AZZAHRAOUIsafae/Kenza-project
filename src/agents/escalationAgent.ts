import { AgentState, EscalationReason } from '../types';
import { appendTrace } from './state';
import { BusinessTools } from '../tools';

export class EscalationAgent {
  public static async execute(
    state: AgentState,
    reason: EscalationReason,
    reasonDescription: string,
    lastUserMessage: string
  ): Promise<AgentState> {
    appendTrace(state, 'escalation', 'Escalation triggered — delegating to human merchant', {
      reason,
      reasonDescription,
    });

    const customerRes = BusinessTools.getCustomer(state.customerId);
    const customer = customerRes.data;

    const escalationRes = BusinessTools.createEscalation({
      conversationId: state.conversationId,
      customerId: state.customerId,
      customerName: customer?.name || state.customerName || 'Client WhatsApp',
      customerPhone: customer?.phone || '+212600000000',
      reason,
      reasonDescription,
      customerContext: `Ville: ${customer?.city || state.customerCity || 'N/A'}, Commandes antérieures: ${customer?.totalOrdersCount || 0}`,
      conversationSnippet: lastUserMessage,
      priority: reason === 'billing_invoice_requested' ? 'medium' : 'high',
    });

    state.toolResults['createEscalation'] = escalationRes;
    state.escalationStatus = {
      isEscalated: true,
      reason,
      details: reasonDescription,
    };
    state.currentStage = 'escalated';

    appendTrace(state, 'escalation', 'Escalation ticket created in database', {
      escalationId: escalationRes.data?.id,
      status: 'pending',
    });

    return state;
  }
}
