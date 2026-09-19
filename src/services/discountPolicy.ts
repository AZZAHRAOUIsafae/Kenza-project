import { db } from '../db/database';
import { Customer, Product } from '../types';
import { UnauthorizedDiscountError } from '../utils/errors';

export interface DiscountEvaluation {
  isAllowed: boolean;
  floorViolated: boolean;
  originalPriceMAD: number;
  minFloorPriceMAD: number;
  authorizedDiscountPercent: number;
  authorizedDiscountMAD: number;
  finalPriceMAD: number;
  reason: string;
}

export class DiscountPolicyEngine {
  /**
   * Evaluates a requested discount against hard business rules and product floors.
   * The LLM can NEVER bypass these rules.
   */
  public static evaluateDiscount(
    product: Product,
    requestedDiscountPercent?: number,
    requestedPrice?: number,
    customer?: Customer | null
  ): DiscountEvaluation {
    const policy = db.getDiscountPolicy();
    const originalPrice = product.basePriceMAD;
    const minFloor = product.minPriceFloorMAD;

    // Determine max authorized percent (VIP gets VIP rate)
    const isVip = customer?.tags?.includes('VIP') || (customer?.totalOrdersCount ?? 0) >= 2;
    const maxAllowedPercent = isVip ? policy.vipDiscountPercent : product.maxDiscountPercent;

    let targetPrice = originalPrice;
    let targetDiscountMAD = 0;
    let floorViolated = false;

    if (requestedPrice !== undefined) {
      if (requestedPrice < minFloor) {
        floorViolated = true;
        // Clamp to floor strictly
        targetPrice = minFloor;
        targetDiscountMAD = originalPrice - minFloor;
      } else {
        const computedDiscountPercent = ((originalPrice - requestedPrice) / originalPrice) * 100;
        if (computedDiscountPercent > maxAllowedPercent) {
          // Exceeds max policy discount -> clamp to max allowed percent
          const allowedDiscount = (originalPrice * maxAllowedPercent) / 100;
          targetPrice = Math.max(minFloor, originalPrice - allowedDiscount);
          targetDiscountMAD = originalPrice - targetPrice;
        } else {
          targetPrice = requestedPrice;
          targetDiscountMAD = originalPrice - requestedPrice;
        }
      }
    } else if (requestedDiscountPercent !== undefined) {
      const clampedPercent = Math.min(requestedDiscountPercent, maxAllowedPercent);
      const computedDiscount = (originalPrice * clampedPercent) / 100;
      const proposedPrice = originalPrice - computedDiscount;

      if (proposedPrice < minFloor) {
        floorViolated = true;
        targetPrice = minFloor;
        targetDiscountMAD = originalPrice - minFloor;
      } else {
        targetPrice = proposedPrice;
        targetDiscountMAD = computedDiscount;
      }
    }

    // Double check: Absolute floor constraint
    if (targetPrice < minFloor) {
      targetPrice = minFloor;
      targetDiscountMAD = originalPrice - minFloor;
      floorViolated = true;
    }

    const actualDiscountPercent = Number(((targetDiscountMAD / originalPrice) * 100).toFixed(1));

    return {
      isAllowed: !floorViolated,
      floorViolated,
      originalPriceMAD: originalPrice,
      minFloorPriceMAD: minFloor,
      authorizedDiscountPercent: actualDiscountPercent,
      authorizedDiscountMAD: Math.round(targetDiscountMAD),
      finalPriceMAD: Math.round(targetPrice),
      reason: floorViolated
        ? `الثمن المطلوب أقل من الحد الأدنى (${minFloor} درهم). تم تطبيق أقصى تخفيض مصرح به.`
        : `تخفيض موافق عليه (${actualDiscountPercent}%).`,
    };
  }

  /**
   * Strict validation that throws UnauthorizedDiscountError if floor is strictly violated.
   */
  public static assertSafePrice(product: Product, price: number): void {
    if (price < product.minPriceFloorMAD) {
      throw new UnauthorizedDiscountError(price, product.minPriceFloorMAD);
    }
  }
}
