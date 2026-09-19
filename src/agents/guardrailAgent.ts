import { AgentState } from '../types';
import { appendTrace } from './state';
import { BusinessTools } from '../tools';
import { DiscountPolicyEngine } from '../services/discountPolicy';

export class GuardrailAgent {
  public static async execute(state: AgentState): Promise<AgentState> {
    appendTrace(state, 'guardrail', 'Policy & Guardrail verification running', {
      currentIntent: state.currentIntent,
      selectedProduct: state.selectedProduct?.name,
    });

    // 1. Guardrail for Discount Negotiation
    if (state.currentIntent === 'discount_negotiation') {
      if (!state.selectedProduct || (state.detectedEntities?.requestedPrice && state.selectedProduct.basePriceMAD < state.detectedEntities.requestedPrice)) {
        state.selectedProduct = BusinessTools.getProduct('prod-djellaba-sousdi').data || state.selectedProduct;
      }
      const requestedPrice = state.detectedEntities?.requestedPrice;
      const discountPercent = state.detectedEntities?.discountPercentRequested;
      const evalResult = DiscountPolicyEngine.evaluateDiscount(
        state.selectedProduct!,
        discountPercent,
        requestedPrice,
        state.customerId ? BusinessTools.getCustomer(state.customerId).data : null
      );

      appendTrace(state, 'guardrail', 'Discount policy floor validation', {
        requestedDiscountPercent: discountPercent,
        minPriceFloorMAD: evalResult.minFloorPriceMAD,
        finalPriceMAD: evalResult.finalPriceMAD,
        floorViolated: evalResult.floorViolated,
        decision: evalResult.floorViolated
          ? 'Floor strictly enforced: discounted price cannot drop below minimum floor'
          : 'Discount authorized within permitted bounds',
      });

      state.toolResults['getDiscountPolicy'] = {
        success: true,
        toolName: 'getDiscountPolicy',
        data: evalResult as any,
        executionTimeMs: 1,
      };
    }

    // 2. Guardrail for Delivery Pricing
    const targetCity = state.detectedEntities?.city || state.customerCity || 'Casablanca';
    const deliveryRes = BusinessTools.calculateDelivery({
      city: targetCity,
      cartSubtotalMAD: state.cart?.subtotalMAD || state.selectedProduct?.basePriceMAD || 0,
    });
    state.toolResults['calculateDelivery'] = deliveryRes;

    if (deliveryRes.success && deliveryRes.data) {
      state.deliveryInfo = {
        city: deliveryRes.data.city,
        feeMAD: deliveryRes.data.feeMAD,
        estimatedDays: deliveryRes.data.estimatedDays,
      };

      appendTrace(state, 'guardrail', 'calculateDelivery() rules enforced', {
        city: deliveryRes.data.city,
        feeMAD: deliveryRes.data.feeMAD,
        isFree: deliveryRes.data.isFree,
      });
    }

    // 3. Price Integrity check
    if (state.selectedProduct) {
      if (state.selectedProduct.basePriceMAD < state.selectedProduct.minPriceFloorMAD) {
        throw new Error('Integrity error: base price below floor');
      }
    }

    return state;
  }
}
