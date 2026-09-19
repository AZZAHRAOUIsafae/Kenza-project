import { AgentState } from '../types';
import { appendTrace } from './state';
import { BusinessTools } from '../tools';
import { QueueService } from '../services/queueService';

export class RelanceAgent {
  public static async execute(state: AgentState): Promise<AgentState> {
    appendTrace(state, 'relance', 'Relance Agent evaluating cart abandonment status', {
      cartStatus: state.cart?.status,
      itemsCount: state.cart?.items.length || 0,
      orderStatus: state.orderStatus,
      isEscalated: state.escalationStatus?.isEscalated,
    });

    // If order was already completed or conversation is escalated, do not schedule
    if (state.orderStatus?.orderId || state.escalationStatus?.isEscalated) {
      appendTrace(state, 'relance', 'Follow-up skipped: order completed or escalated');
      return state;
    }

    // Check if cart has items and is not yet ordered
    if (state.cart && state.cart.items.length > 0 && state.cart.status !== 'ORDERED') {
      const scheduleRes = BusinessTools.scheduleFollowup({
        conversationId: state.conversationId,
        customerId: state.customerId,
        cartId: state.cart.id,
        delayMinutes: 30, // standard interval
      });
      state.toolResults['scheduleFollowup'] = scheduleRes;

      if (scheduleRes.success && scheduleRes.data) {
        state.followupStatus = {
          isScheduled: true,
          followupId: scheduleRes.data.id,
        };

        // Enqueue to background worker queue (using 15-20s for demo responsiveness)
        await QueueService.scheduleFollowupJob(
          scheduleRes.data.id,
          state.conversationId,
          state.customerId,
          state.cart.id,
          20000 // 20 seconds for fast demo visualization
        );

        appendTrace(state, 'relance', 'Follow-up scheduled with BullMQ worker', {
          followupId: scheduleRes.data.id,
          scheduledTime: scheduleRes.data.scheduledAt,
        });
      }
    }

    return state;
  }
}
