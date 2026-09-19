/**
 * Kenza — Standardized Error and Recovery System
 * Deliverable 18
 */

export abstract class KenzaError extends Error {
  public abstract readonly code: string;
  public abstract readonly statusCode: number;
  public readonly naturalMessage: string;
  public readonly details?: Record<string, unknown>;

  constructor(naturalMessage: string, details?: Record<string, unknown>) {
    super(naturalMessage);
    this.name = this.constructor.name;
    this.naturalMessage = naturalMessage;
    this.details = details;
  }
}

export class LLMUnavailableError extends KenzaError {
  public readonly code = 'LLM_UNAVAILABLE';
  public readonly statusCode = 503;
  constructor(details?: Record<string, unknown>) {
    super('عذراً، الخدمة الذكية مشغولة حالياً، كنزة غاتجاوبك فالحين.', details);
  }
}

export class ProductNotFoundError extends KenzaError {
  public readonly code = 'PRODUCT_NOT_FOUND';
  public readonly statusCode = 404;
  constructor(productIdentifier: string, details?: Record<string, unknown>) {
    super(`ما لقيناش هاد الموديل (${productIdentifier}) فالكاتالوج، واش بغيتي نقترح عليك موديلات مشابهة؟`, {
      productIdentifier,
      ...details,
    });
  }
}

export class StockUnavailableError extends KenzaError {
  public readonly code = 'STOCK_UNAVAILABLE';
  public readonly statusCode = 409;
  constructor(productName: string, size?: string, details?: Record<string, unknown>) {
    super(
      `للأسف ${productName} ${size ? `فالمقاس ${size}` : ''} سالا من الستوك حالياً. نقدر نقترح عليك بديل متوفر ومناسب ليك؟`,
      { productName, size, ...details }
    );
  }
}

export class DeliveryCalculationError extends KenzaError {
  public readonly code = 'DELIVERY_CALCULATION_ERROR';
  public readonly statusCode = 400;
  constructor(city: string, details?: Record<string, unknown>) {
    super(`المدينة المطلوبة (${city}) ما مسجلاش فشبكة التوصيل السريع ديالنا حالياً. نقدر نحولك للمسؤول؟`, {
      city,
      ...details,
    });
  }
}

export class OrderCreationError extends KenzaError {
  public readonly code = 'ORDER_CREATION_ERROR';
  public readonly statusCode = 500;
  constructor(reason: string, details?: Record<string, unknown>) {
    super(`وقع مشكل فتقييد الطلب: ${reason}. حاول مرة أخرى أو تواصل مع الدعم.`, { reason, ...details });
  }
}

export class DuplicateOrderError extends KenzaError {
  public readonly code = 'DUPLICATE_ORDER';
  public readonly statusCode = 409;
  constructor(orderNumber: string, details?: Record<string, unknown>) {
    super(`هاد الطلب راه مسجل ديجا برقم ${orderNumber}. شكراً على ثقتك!`, { orderNumber, ...details });
  }
}

export class UnauthorizedDiscountError extends KenzaError {
  public readonly code = 'UNAUTHORIZED_DISCOUNT';
  public readonly statusCode = 422;
  constructor(requestedPrice: number, floorPrice: number, details?: Record<string, unknown>) {
    super(
      `هاد التخفيض كيتجاوز الحد المسموح به قانونياً فالمتجر. أدنى ثمن مسموح به هو ${floorPrice} درهم.`,
      { requestedPrice, floorPrice, ...details }
    );
  }
}

export class UnsupportedRequestError extends KenzaError {
  public readonly code = 'UNSUPPORTED_REQUEST';
  public readonly statusCode = 400;
  constructor(reason: string, details?: Record<string, unknown>) {
    super('هاد الطلب كيحتاج تدخل مباشر من الإدارة، حولت المحادثة للمسؤول دابا باش يتواصل معاك.', {
      reason,
      ...details,
    });
  }
}
