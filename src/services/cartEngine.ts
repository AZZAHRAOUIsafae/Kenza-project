import { db } from '../db/database';
import { Cart, CartItem, Order } from '../types';
import { ProductNotFoundError, StockUnavailableError, OrderCreationError } from '../utils/errors';

export class CartEngine {
  /**
   * Recalculates cart subtotals, delivery fees, and total.
   * Ensures backend calculates and validates all pricing.
   */
  public static recalculateCart(cart: Cart): Cart {
    let subtotal = 0;
    for (const item of cart.items) {
      item.subtotalMAD = item.unitPriceMAD * item.quantity;
      subtotal += item.subtotalMAD;
    }
    cart.subtotalMAD = Math.round(subtotal);

    // Calculate delivery fee
    if (cart.city) {
      const rule = db.getDeliveryRule(cart.city);
      if (cart.subtotalMAD >= rule.freeShippingThresholdMAD) {
        cart.deliveryFeeMAD = 0;
      } else {
        cart.deliveryFeeMAD = rule.feeMAD;
      }
    } else {
      cart.deliveryFeeMAD = 0;
    }

    const netSubtotal = Math.max(0, cart.subtotalMAD - (cart.discountMAD || 0));
    cart.totalMAD = Math.round(netSubtotal + cart.deliveryFeeMAD);

    if (cart.items.length === 0) {
      cart.status = 'EMPTY';
    } else if (cart.status === 'EMPTY') {
      cart.status = 'ACTIVE';
    }

    return db.saveCart(cart);
  }

  public static addItem(cartId: string, productId: string, variantId?: string, quantity = 1, requestedSize?: string, requestedColor?: string): Cart {
    const cart = db.getCart(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    const product = db.getProduct(productId);
    if (!product) throw new ProductNotFoundError(productId);

    // Check variant & stock
    const stock = db.checkStock(productId, variantId, requestedSize, requestedColor);
    if (!stock.inStock || stock.quantity < quantity) {
      throw new StockUnavailableError(product.name, requestedSize, {
        available: stock.quantity,
        requested: quantity,
      });
    }

    const variant = stock.variant || product.variants[0];
    const existingIndex = cart.items.findIndex((it) => it.variantId === variant.id);

    if (existingIndex >= 0) {
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (stock.quantity < newQty) {
        throw new StockUnavailableError(product.name, variant.size, {
          available: stock.quantity,
          requested: newQty,
        });
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].subtotalMAD = cart.items[existingIndex].unitPriceMAD * newQty;
    } else {
      const newItem: CartItem = {
        id: `citem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        cartId: cart.id,
        productId: product.id,
        productName: product.name,
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
        unitPriceMAD: variant.priceMAD,
        quantity,
        subtotalMAD: variant.priceMAD * quantity,
      };
      cart.items.push(newItem);
    }

    cart.status = 'ACTIVE';
    return this.recalculateCart(cart);
  }

  public static removeItem(cartId: string, itemId: string): Cart {
    const cart = db.getCart(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    cart.items = cart.items.filter((item) => item.id !== itemId && item.variantId !== itemId);
    return this.recalculateCart(cart);
  }

  public static updateQuantity(cartId: string, itemId: string, quantity: number): Cart {
    const cart = db.getCart(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    if (quantity <= 0) {
      return this.removeItem(cartId, itemId);
    }

    const item = cart.items.find((it) => it.id === itemId || it.variantId === itemId);
    if (!item) throw new Error(`Item ${itemId} not in cart`);

    const stock = db.checkStock(item.productId, item.variantId);
    if (stock.quantity < quantity) {
      throw new StockUnavailableError(item.productName, item.size, {
        available: stock.quantity,
        requested: quantity,
      });
    }

    item.quantity = quantity;
    item.subtotalMAD = item.unitPriceMAD * quantity;
    return this.recalculateCart(cart);
  }

  /**
   * Supports customer changing mind: e.g. switching from size M to size L!
   */
  public static changeVariant(cartId: string, itemId: string, newSize: string, newColor?: string): Cart {
    const cart = db.getCart(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    const itemIndex = cart.items.findIndex((it) => it.id === itemId || it.variantId === itemId);
    if (itemIndex === -1) throw new Error(`Item ${itemId} not found in cart`);

    const currentItem = cart.items[itemIndex];
    const product = db.getProduct(currentItem.productId);
    if (!product) throw new ProductNotFoundError(currentItem.productId);

    // Target color: either requested or keep existing
    const targetColor = newColor || currentItem.color;

    // Check stock for new size/color, fallback to any available variant in that size if specified color is out of stock
    let stock = db.checkStock(currentItem.productId, undefined, newSize, targetColor);
    if (!stock.inStock || stock.quantity < currentItem.quantity) {
      // Try finding any available variant with the requested size
      const availableSizeVariant = product.variants.find(
        (v) => v.size.toLowerCase() === newSize.toLowerCase() && v.isAvailable && v.stockQuantity >= currentItem.quantity
      );
      if (availableSizeVariant) {
        stock = { inStock: true, quantity: availableSizeVariant.stockQuantity, variant: availableSizeVariant, alternatives: [] };
      } else {
        throw new StockUnavailableError(product.name, newSize, {
          available: stock.quantity,
          requested: currentItem.quantity,
        });
      }
    }

    const newVariant = stock.variant!;
    currentItem.variantId = newVariant.id;
    currentItem.size = newVariant.size;
    currentItem.color = newVariant.color;
    currentItem.unitPriceMAD = newVariant.priceMAD;
    currentItem.subtotalMAD = newVariant.priceMAD * currentItem.quantity;

    return this.recalculateCart(cart);
  }

  public static setDeliveryInfo(cartId: string, city: string, address?: string): Cart {
    const cart = db.getCart(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    cart.city = city;
    if (address) {
      cart.deliveryAddress = address;
    }
    return this.recalculateCart(cart);
  }

  public static applyDiscount(cartId: string, discountMAD: number, discountCode?: string): Cart {
    const cart = db.getCart(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    cart.discountMAD = Math.max(0, discountMAD);
    if (discountCode) cart.discountCode = discountCode;
    return this.recalculateCart(cart);
  }

  public static markAbandoned(cartId: string): Cart {
    const cart = db.getCart(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    if (cart.status === 'ACTIVE' && cart.items.length > 0) {
      cart.status = 'ABANDONED';
      cart.abandonedAt = new Date().toISOString();
      return db.saveCart(cart);
    }
    return cart;
  }

  public static checkoutOrder(
    cartId: string,
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    deliveryCity: string,
    idempotencyKey: string
  ): Order {
    const cart = db.getCart(cartId);
    if (!cart) throw new Error(`Cart ${cartId} not found`);
    if (cart.items.length === 0) throw new OrderCreationError('Cart is empty');

    // Recalculate with final delivery city
    cart.city = deliveryCity;
    cart.deliveryAddress = deliveryAddress;
    this.recalculateCart(cart);

    const order = db.createOrder({
      customerId: cart.customerId,
      customerName,
      customerPhone,
      conversationId: cart.conversationId,
      cartId: cart.id,
      items: cart.items.map((it) => ({
        id: `oitem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        orderId: '',
        productId: it.productId,
        productName: it.productName,
        variantId: it.variantId,
        size: it.size,
        color: it.color,
        unitPriceMAD: it.unitPriceMAD,
        quantity: it.quantity,
        totalMAD: it.subtotalMAD,
      })),
      subtotalMAD: cart.subtotalMAD,
      discountMAD: cart.discountMAD,
      deliveryFeeMAD: cart.deliveryFeeMAD,
      totalMAD: cart.totalMAD,
      deliveryCity,
      deliveryAddress,
      status: 'confirmed',
      paymentMethod: 'cash_on_delivery',
      idempotencyKey,
    });

    return order;
  }
}
