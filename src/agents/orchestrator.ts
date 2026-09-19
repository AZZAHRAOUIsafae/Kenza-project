import { db } from '../db/database';
import { AgentState, Message } from '../types';
import { createInitialAgentState, appendTrace } from './state';
import { ConversationAgent } from './conversationAgent';
import { CatalogueAgent } from './catalogueAgent';
import { GuardrailAgent } from './guardrailAgent';
import { EscalationAgent } from './escalationAgent';
import { RelanceAgent } from './relanceAgent';
import { BusinessTools } from '../tools';
import { LLMAdapter } from '../services/llmAdapter';
import { CartEngine } from '../services/cartEngine';
import { RagService } from '../services/ragService';
import { STORE_INFO } from '../data/storeInfo';

export class AgentOrchestrator {
  /**
   * Main agentic loop executing the full orchestration graph.
   */
  public static async processMessage(params: {
    conversationId: string;
    customerId: string;
    messageText: string;
    customerPhone?: string;
    customerName?: string;
  }): Promise<{
    replyMessage: Message;
    state: AgentState;
    trace: AgentState['trace'];
  }> {
    const startTime = Date.now();
    const { conversationId, customerId, messageText } = params;

    // 1. Get or create conversation & customer
    const conv = db.getOrCreateConversation(conversationId, customerId);
    let customer = db.getCustomer(customerId);
    if (!customer && params.customerPhone) {
      customer = db.getOrCreateCustomer(params.customerPhone, params.customerName || 'Client');
    }

    // Record incoming user message
    const userMsg = db.addMessage(conversationId, 'customer', messageText);

    // 2. Initialize Agent State
    let cart = db.getOrCreateCart(conversationId, customerId);
    let state = createInitialAgentState({
      conversationId,
      customerId,
      customerName: customer?.name,
      customerCity: customer?.city,
      language: customer?.languagePreference || 'darija',
      messages: conv.messages,
      cart,
    });

    appendTrace(state, 'orchestrator', 'Starting Kenza agent orchestration cycle', {
      conversationId,
      customerId,
      initialCartStatus: cart.status,
    });

    // Check if human takeover is active
    if (conv.status === 'human_takeover') {
      appendTrace(state, 'orchestrator', 'Conversation is under human merchant takeover — pausing autonomous actions');
      const waitNotice = db.addMessage(
        conversationId,
        'system',
        'تم إشعار المسؤول التجاري، سيتواصل معك شخصياً في غضون لحظات.'
      );
      return { replyMessage: waitNotice, state, trace: state.trace };
    }

    // Step 1: Conversation Agent (Intent, Entities, Memory)
    state = await ConversationAgent.execute(state, messageText);

    // Step 2: Check for Escalation Condition
    if (state.currentIntent === 'escalation_trigger') {
      const isInvoice = messageText.toLowerCase().includes('facture');
      const reason = isInvoice ? 'billing_invoice_requested' : 'human_requested';
      const desc = isInvoice
        ? 'الزبون يطلب فاتورة باسم شركة (خارج الصلاحيات المباشرة للوكيل)'
        : 'الزبون يطلب التحدث مع مسؤول بشري';

      state = await EscalationAgent.execute(state, reason, desc, messageText);

      const escalationReply = isInvoice
        ? 'بالنسبة للفوترة باسم الشركات، هاد الإجراء كيتكلف بيه قسم الحسابات ديالنا مباشرة. حولت الطلب ديالك للمسؤول دابا باش يتواصل معاك ويصيفط ليك الفاتورة القانونية.'
        : 'مرحبا بيك، حولت المحادثة مباشرة لأحد المسؤولين ديالنا باش يكمل معاك المحادثة دابا.';

      const assistantMsg = db.addMessage(conversationId, 'assistant', escalationReply, {
        intent: state.currentIntent,
      });

      db.updateConversationTrace(conversationId, state.trace);
      return { replyMessage: assistantMsg, state, trace: state.trace };
    }

    // Step 3: Handle Change of Variant (Scenario C: Size change)
    if (state.currentIntent === 'change_variant') {
      appendTrace(state, 'orchestrator', 'Executing variant/size change in existing cart', {
        requestedSize: state.detectedEntities?.size,
      });

      if (state.cart && state.cart.items.length > 0) {
        const item = state.cart.items[0];
        const newSize = state.detectedEntities?.size || 'L';
        const updateRes = BusinessTools.updateCart({
          cartId: state.cart.id,
          action: 'change_variant',
          itemId: item.id,
          size: newSize,
          color: state.detectedEntities?.color,
        });

        state.toolResults['updateCart'] = updateRes;
        if (updateRes.success && updateRes.data) {
          state.cart = updateRes.data;
          appendTrace(state, 'orchestrator', 'Cart successfully updated with new size', {
            itemId: item.id,
            newSize,
            newSubtotal: state.cart.subtotalMAD,
          });
        }
      }
    }

    // Step 4: Catalogue Agent (Search & Stock)
    if (state.currentIntent === 'product_search' || state.detectedEntities?.productName || !state.selectedProduct) {
      state = await CatalogueAgent.execute(state);
    }

    // Step 5: Guardrail Layer (Enforce Price Floor & Delivery Rules)
    state = await GuardrailAgent.execute(state);

    // Step 6: Cart & Order Handling
    // If product inquiry with intent to buy or examine: update cart
    if (state.selectedProduct && state.selectedVariant && (!state.cart || state.cart.items.length === 0)) {
      const stockCheck = state.toolResults['checkStock']?.data as { inStock?: boolean } | undefined;
      if (stockCheck?.inStock !== false) {
        const addRes = BusinessTools.updateCart({
          cartId: state.cart!.id,
          action: 'add',
          productId: state.selectedProduct.id,
          variantId: state.selectedVariant.id,
          quantity: 1,
        });
        if (addRes.success && addRes.data) {
          state.cart = addRes.data;
          appendTrace(state, 'orchestrator', 'Product added to customer cart', {
            productId: state.selectedProduct.id,
            subtotalMAD: state.cart.subtotalMAD,
          });
        }
      }
    }

    // Check for Change of Mind / Variant Modification (Scenario C)
    if (state.currentIntent === 'change_variant' && state.cart && state.cart.items.length > 0) {
      const newSize = state.detectedEntities?.size;
      const newColor = state.detectedEntities?.color;
      if (state.selectedProduct) {
        const matchingVariant = state.selectedProduct.variants.find(
          (v) => (!newSize || v.size === newSize) && (!newColor || v.color.toLowerCase().includes(newColor.toLowerCase()))
        ) || state.selectedProduct.variants.find((v) => !newSize || v.size === newSize) || state.selectedProduct.variants[0];

        if (matchingVariant) {
          state.selectedVariant = matchingVariant;
          const oldItem = state.cart.items[0];
          BusinessTools.updateCart({
            cartId: state.cart.id,
            action: 'remove',
            productId: oldItem.productId,
            variantId: oldItem.variantId,
          });
          const updateRes = BusinessTools.updateCart({
            cartId: state.cart.id,
            action: 'add',
            productId: state.selectedProduct.id,
            variantId: matchingVariant.id,
            quantity: 1,
          });
          if (updateRes.success && updateRes.data) {
            state.cart = updateRes.data;
          }
          appendTrace(state, 'orchestrator', 'Customer changed mind - cart updated with new variant', {
            newSize: matchingVariant.size,
            newColor: matchingVariant.color,
            cartTotalMAD: state.cart.totalMAD,
          });
        }
      }
    }

    // Check for Order Confirmation (Scenario A / Purchase confirmation)
    if (state.currentIntent === 'order_confirmation') {
      // If cart has no items yet but product/variant was selected, add to cart first
      if ((!state.cart || state.cart.items.length === 0) && state.selectedProduct && state.selectedVariant) {
        const addRes = BusinessTools.updateCart({
          cartId: state.cart!.id,
          action: 'add',
          productId: state.selectedProduct.id,
          variantId: state.selectedVariant.id,
          quantity: 1,
        });
        if (addRes.success && addRes.data) {
          state.cart = addRes.data;
        }
      }

      if (state.cart && state.cart.items.length > 0) {
        appendTrace(state, 'orchestrator', 'Finalizing order confirmation from cart', {
          cartId: state.cart.id,
          totalMAD: state.cart.totalMAD,
        });

        const targetCity = state.detectedEntities?.city || state.deliveryInfo?.city || state.customerCity || 'Casablanca';
        const targetAddress = customer?.notes?.includes('Boulevard') ? customer.notes : `Centre-ville, ${targetCity}`;

        const orderRes = BusinessTools.createOrder({
          cartId: state.cart.id,
          customerName: customer?.name || state.customerName || 'Client',
          customerPhone: customer?.phone || '+212600000000',
          deliveryCity: targetCity,
          deliveryAddress: targetAddress,
          idempotencyKey: `idem-${state.cart.id}-${conversationId}`,
        });

        state.toolResults['createOrder'] = orderRes;
        if (orderRes.success && orderRes.data) {
          state.orderStatus = {
            orderId: orderRes.data.id,
            orderNumber: orderRes.data.orderNumber,
            totalMAD: orderRes.data.totalMAD,
          };
          state.currentStage = 'order_confirmed';

          appendTrace(state, 'orchestrator', 'Order successfully validated and persisted in PostgreSQL', {
            orderNumber: orderRes.data.orderNumber,
            totalMAD: orderRes.data.totalMAD,
          });
        }
      }
    }

    // Step 7: Relance Agent (Check for abandoned cart)
    state = await RelanceAgent.execute(state);

    // Step 8: Produce Natural Customer-facing Response
    const responseText = await this.generateNaturalReply(state, messageText, customer);

    const assistantMsg = db.addMessage(conversationId, 'assistant', responseText, {
      intent: state.currentIntent,
      toolCalls: Object.keys(state.toolResults),
      cartState: state.cart,
      suggestedProducts: state.selectedProduct ? [state.selectedProduct.name] : [],
    });

    db.updateConversationTrace(conversationId, state.trace);

    return {
      replyMessage: assistantMsg,
      state,
      trace: state.trace,
    };
  }

  private static async generateNaturalReply(
    state: AgentState,
    incomingMessage: string,
    customer: any
  ): Promise<string> {
    const stockData = state.toolResults['checkStock']?.data as { inStock?: boolean; alternatives?: any[] } | undefined;
    const isOutOfStock = stockData?.inStock === false;

    // Order confirmed scenario (Scenario A & multi-turn end-to-end confirmation)
    if (state.currentStage === 'order_confirmed' && state.orderStatus?.orderNumber) {
      const orderNum = state.orderStatus.orderNumber;
      const total = state.orderStatus.totalMAD;
      const city = state.deliveryInfo?.city || state.customerCity || 'Casablanca';
      const days = state.deliveryInfo?.estimatedDays || '1 à 2 jours (24h - 48h)';
      const lower = incomingMessage.toLowerCase();
      const isFrench = state.language === 'fr' || lower.includes('confirme') || lower.includes('commande') || lower.includes('merci') || lower.includes('valide');

      if (isFrench) {
        return `🎉 Votre commande est confirmée avec succès chez Maison Kenza !\n\n📋 Référence de commande : ${orderNum}\n💰 Total à régler : ${total} MAD (Paiement en espèces à la livraison - COD)\n📍 Destination : ${city} (Délai estimé : ${days})\n\nNotre transporteur vous contactera par téléphone pour convenir de la remise en main propre. Vous pouvez essayer votre article à la réception. Merci infiniment pour votre confiance ! 🇲🇦`;
      } else {
        return `تم تأكيد الطلب ديالك بنجاح فمتجر دار كنزة! 🎉\n\n📋 رقم الطلب : ${orderNum}\n💰 المجموع الإجمالي : ${total} درهم (الدفع نقداً عند الاستلام - COD)\n📍 التوصيل لـ : ${city} (الأجل : ${days})\n\nالموزع ديالنا غيتواصل معاك هاتفياً قبل ما يوصل. يمكن ليك تقيس وتشوف الصنعة قبل ما تخلص. شكراً بزاف على ثقتك فصناعتنا التقليدية! 🇲🇦`;
      }
    }

    // Attempted to confirm order with completely empty cart
    if (state.currentIntent === 'order_confirmation' && (!state.cart || state.cart.items.length === 0)) {
      return `مرحبا بك! السلة ديالك مافيها حتى منتوج حالياً. شكون هو الموديل لي عجبك نوجدو ليك (جلابة سوسدي مخيطة يد، قفطان رويال، أو قندورة عصرية)؟\n(Votre panier est vide pour le moment. Quel modèle de notre collection souhaitez-vous commander ?)`;
    }

    // Change variant scenario (Scenario C)
    if (state.currentIntent === 'change_variant') {
      const newSize = state.detectedEntities?.size || 'L';
      const total = state.cart?.totalMAD || 750;
      return `مفهوم أخي، تم تعديل المقاس لـ ${newSize} فالسلة ديالك مباشرة! المجموع حالياً هو ${total} درهم مع التوصيل. واش نأكد ليك الطلب؟`;
    }

    // Discount negotiation scenario (Scenario D)
    if (state.currentIntent === 'discount_negotiation') {
      const discountData = state.toolResults['getDiscountPolicy']?.data as any;
      const evalRes = discountData?.evaluation || discountData;
      if (evalRes?.floorViolated) {
        return `مرحبا بيك أخي، هاد الصنعة متقونة وفيها جودة عالية. أدنى ثمن نقدر نديرو ليك هو ${evalRes.finalPriceMAD} درهم (الحد القانوني للمتجر). واش نثبتو ليك الطلب بهاد الثمن التفضيل؟ 😊`;
      } else if (evalRes) {
        return `على الراس والعين! درت ليك تخفيض خاص بـ ${evalRes.authorizedDiscountPercent}%، الثمن النهائي كيرجع هو ${evalRes.finalPriceMAD} درهم فقط. واش نصيفطوه ليك دابا؟`;
      }
    }

    // Out of stock scenario (Scenario B)
    if (isOutOfStock) {
      const alt = stockData?.alternatives?.[0];
      const altDesc = alt ? `${alt.color} (${alt.size})` : 'لون آخر فنفس الموديل';
      return `للأسف هاد الموديل فهاد المقاس سالا من الستوك حالياً. ولكن متوفر عندنا بديل رائع فاللون ${altDesc} بنفس الجودة والثمن! واش تبغي نأكدو ليك هاد البديل؟ 😊`;
    }

    // Returning customer memory scenario (Scenario E)
    if (customer && customer.totalOrdersCount > 0 && incomingMessage.toLowerCase().includes('salam')) {
      const firstName = customer.name.split(' ')[0];
      return `أهلاً وسهلا سي ${firstName}! كنشكروك على وفائك الدائم لمتجرنا 😊 كنعرفو ذوقك فالمقاس ${customer.notes?.includes('L') ? 'L' : 'ديالك'}. شنو عجبك نوجدو ليك فهاد الكوليكسيون الجديدة؟`;
    }

    // Store information inquiry (Boutique addresses, showroom, opening hours, phone)
    if (state.currentIntent === 'store_info') {
      const lower = incomingMessage.toLowerCase();
      const isFrench = lower.includes('adresse') || lower.includes('horaire') || lower.includes('magasin') || lower.includes('boutique') || lower.includes('téléphone') || lower.includes('telephone') || lower.includes('info');
      
      if (isFrench) {
        return `Bienvenue chez Maison Kenza ! 🇲🇦\n\n📍 Nos Boutiques & Showrooms :\n• Showroom Principal Casablanca : 45 Boulevard Al Massira Al Khadra, Quartier Maârif (à 2 min du Twin Center).\n• Boutique & Atelier Fès : 12 Rue Talaa Kebira, Médina Historique (Bab Boujloud).\n• Point Retrait Habous : Place des Habous, Casablanca.\n\n🕒 Horaires d'ouverture : Du Lundi au Samedi de 10h00 à 20h00 (non-stop), et Dimanche de 14h00 à 19h00.\n📞 Téléphone Showroom : +212 5 22 25 40 88 • WhatsApp : +212 6 61 45 78 90\n🚚 Livraison COD partout au Maroc (Gratuite dès 500 MAD, 24h Casa/Rabat, 48h autres villes) avec essayage et échange garanti sous 7 jours !`;
      } else {
        return `مرحبا بيك فدار كنزة للأزياء المغربية الأصيلة! 🇲🇦\n\n📍 عناوين المتاجر ديالنا:\n• المعرض الرئيسي (كازا): 45 شارع المسيرة الخضراء، حي المعاريف (على بعد دقيقتين من Twin Center).\n• ورشة ومتجر فاس: 12 زنقة الطالعة الكبيرة، المدينة العتيقة (قرب باب بوجلود).\n• نقطة التسليم بالأحباس: ساحة الأحباس، الدار البيضاء.\n\n🕒 أوقات العمل: من الإثنين إلى السبت (10:00 - 20:00 بدون انقطاع)، والأحد (14:00 - 19:00).\n📞 هاتف المعرض: 0522254088 / واتساب: 0661457890.\n🚚 التوصيل بالمجان فالمغرب كامل ابتداءً من 500 درهم، والدفع نقداً عند الاستلام مع إمكانية القياس والتبديل فـ 7 أيام!`;
      }
    }

    // Out of scope / unrelated subject scenario (Never improvise or hallucinate on out-of-store subjects)
    if (state.currentIntent === 'out_of_scope') {
      const lower = incomingMessage.toLowerCase();
      const isFrench = state.language === 'fr' || lower.includes('bonjour') || lower.includes('vous') || lower.includes('est-ce') || lower.includes('pourquoi');
      if (isFrench) {
        return `Pardonnez-moi, je suis l'assistante commerciale dédiée exclusivement à Maison Kenza (artisanat et haute couture marocaine : Djellabas, Caftans, Gandoras et Babouches). Je ne traite pas les sujets hors de notre boutique. En revanche, je serai ravie de vous conseiller sur nos magnifiques confections artisanales ! Quel modèle aimeriez-vous découvrir ? 🇲🇦`;
      } else {
        return `سمح ليا بزاف! أنا المساعدة الرقمية لدار كنزة الخاصة بالأزياء المغربية التقليدية (الجلابة، القفطان، القندورة والبلغة الفاسية). مكنجاوبش على مواضيع خارج تخصصنا، ولكن أنا هنا بكل سرور باش نساعدك تختار أبهى لباس تقليدي مغربي أصيل! شنو كيعجبك نشوفو؟ 🇲🇦`;
      }
    }

    // RAG Semantic search over FAQ & policy for questions like returns, delivery times, store policy
    let ragContext = '';
    try {
      const ragResults = await RagService.search(incomingMessage, { limit: 2, minScore: 0.35 });
      if (ragResults.length > 0) {
        ragContext = `Informations officielles du magasin (RAG): ${ragResults.map((r) => r.chunk.text).join(' ')}`;
      }
    } catch {
      // Continue gracefully if RAG search is quiet
    }

    // General product recommendation / Darija greeting using cost-optimized GPT-4.1
    const systemPrompt = `Tu es Kenza, assistante commerciale marocaine autonome et chaleureuse.
Tu communiques couramment en Darija marocaine, en français ou en arabe selon le client.
Tu t'appuies STRICTEMENT sur les données fournies par les outils (prix réels, stock réel, règles de livraison).
Ne JAMAIS inventer de prix, de stock ou de délais inexistants.
Sois concise, polie, naturelle avec des expressions marocaines amicales (Marhaban, bkol sourour, ala rass wl 3ayn).`;

    const response = await LLMAdapter.generateCompletion({
      systemPrompt,
      conversationId: state.conversationId,
      purpose: 'routine', // Prioritizes GPT-4.1 for fast, economical routine text generation
      maxTokens: 250,
      messages: [
        {
          role: 'user',
          content: `Customer message: "${incomingMessage}". Selected Product: ${state.selectedProduct?.name || 'Général'} (Price: ${state.selectedProduct?.basePriceMAD || 750} MAD). Cart Total: ${state.cart?.totalMAD || 0} MAD. City: ${state.deliveryInfo?.city || 'Casablanca'}.${ragContext ? `\n\n${ragContext}` : ''}`,
        },
      ],
    });

    return response.content;
  }
}
