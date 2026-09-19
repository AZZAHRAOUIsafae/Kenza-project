import { AgentState } from '../types';
import { appendTrace } from './state';
import { BusinessTools } from '../tools';

export class ConversationAgent {
  public static async execute(state: AgentState, incomingMessage: string): Promise<AgentState> {
    appendTrace(state, 'conversation_agent', 'Message received & analyzing customer intent', {
      incomingMessage,
      currentStage: state.currentStage,
    });

    // 1. Load customer memory if not already in state
    const customerResult = BusinessTools.getCustomer(state.customerId);
    state.toolResults['getCustomer'] = customerResult;

    if (customerResult.success && customerResult.data) {
      state.customerName = customerResult.data.name;
      state.customerCity = customerResult.data.city;
      state.language = customerResult.data.languagePreference;

      const historyResult = BusinessTools.getCustomerHistory(state.customerId);
      state.toolResults['getCustomerHistory'] = historyResult;

      appendTrace(state, 'conversation_agent', 'Customer memory loaded', {
        customerName: state.customerName,
        totalOrders: customerResult.data.totalOrdersCount,
        previousOrders: historyResult.data?.previousOrders.length || 0,
      });
    }

    // 2. Intent Detection in Darija, French, Arabic
    const lower = incomingMessage.toLowerCase();
    let detectedIntent = 'general_inquiry';
    const entities: typeof state.detectedEntities = {};

    // Check city entity
    const moroccanCities = [
      'casablanca', 'casa', 'rabat', 'marrakech', 'fès', 'fes', 'tanger', 'tétouan', 'tetouan',
      'agadir', 'meknès', 'meknes', 'oujda', 'kenitra', 'laâyoune', 'dakhla'
    ];
    for (const city of moroccanCities) {
      if (lower.includes(city)) {
        entities.city = city === 'casa' ? 'Casablanca' : city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }

    // Check size entity
    if (lower.match(/\b(taille\s+xl|قياس\s+xl|size\s+xl|\bxl\b)\b/)) {
      entities.size = 'XL';
    } else if (lower.match(/\b(taille\s+m|قياس\s+m|size\s+m|\bm\b)\b/)) {
      entities.size = 'M';
    } else if (lower.match(/\b(taille\s+s|قياس\s+s|size\s+s|\bs\b)\b/)) {
      entities.size = 'S';
    } else if (lower.match(/\b(taille\s+l|قياس\s+l|size\s+l|large)\b/)) {
      entities.size = 'L';
    }

    // Check product entity unconditionally
    if (lower.includes('jalaba') || lower.includes('djellaba') || lower.includes('جلابة')) entities.productName = 'djellaba';
    else if (lower.includes('caftan') || lower.includes('qaftan') || lower.includes('قفطان')) entities.productName = 'caftan';
    else if (lower.includes('gandora') || lower.includes('قندورة')) entities.productName = 'gandora';
    else if (lower.includes('argan') || lower.includes('أركان')) entities.productName = 'argan';
    else if (lower.includes('babouche') || lower.includes('بلغة')) entities.productName = 'babouche';

    // Check color entity with strict word boundaries
    if (lower.match(/\b(vert|verte|خضرا|خضراء|émeraude)\b/)) {
      entities.color = 'Vert Émeraude';
    } else if (lower.match(/\b(bleu|bleue|زرقا|زرقاء|majorelle)\b/)) {
      entities.color = 'Bleu Majorelle';
    } else if (lower.match(/\b(rose|غوز|وردي)\b/)) {
      entities.color = 'Rose Poudré';
    } else if (lower.match(/\b(blanc|blanche|بيض|بيضاء)\b/)) {
      entities.color = 'Blanc Cassé';
    } else if (lower.match(/\b(beige|بيج)\b/)) {
      entities.color = 'Beige Sable';
    } else if (lower.match(/\b(jaune|صفر|صفراء)\b/)) {
      entities.color = 'Jaune Fassi';
    }

    // Intent patterns
    if (
      lower.includes('facture') ||
      lower.includes('société') ||
      lower.includes('societe') ||
      lower.includes('parler à un humain') ||
      lower.includes('agent humain') ||
      lower.includes('bghit nhedar m3a lms2oul') ||
      lower.includes('مسؤول') ||
      lower.includes('مدير') ||
      lower.includes('شكاية') ||
      lower.includes('reclamation') ||
      lower.includes('plainte') ||
      lower.includes('litige') ||
      lower.includes('remboursement') ||
      lower.includes('gérant') ||
      lower.includes('gerant') ||
      lower.includes('humain')
    ) {
      detectedIntent = 'escalation_trigger';
    } else if (
      lower.includes('changement') ||
      lower.includes('badalt') ||
      lower.includes('bedelt') ||
      lower.includes('badelt rayi') ||
      lower.includes('bedelt rayi') ||
      lower.includes('بدلت') ||
      lower.includes('بدلت رأيي') ||
      lower.includes('bdel') ||
      lower.includes('tbdel') ||
      lower.includes('bghit l') ||
      lower.includes('bedel') ||
      lower.includes('changed my mind') ||
      lower.includes("change d'avis") ||
      lower.includes("changer d'avis") ||
      lower.includes('changer') ||
      lower.includes('blast') ||
      lower.includes('fblasset') ||
      lower.includes('à la place') ||
      lower.includes('plutôt') ||
      (lower.includes('taille') && (lower.includes('l') || lower.includes('m') || lower.includes('xl') || lower.includes('s')) && (lower.includes('بدل') || lower.includes('plutot') || lower.includes('autre')))
    ) {
      detectedIntent = 'change_variant';
    } else if (
      lower.includes('taman') ||
      lower.includes('remise') ||
      lower.includes('n9so') ||
      lower.includes('reduction') ||
      lower.includes('تخفيض') ||
      lower.includes('نقص') ||
      lower.includes('prix moins') ||
      lower.includes('chhal akhir taman')
    ) {
      detectedIntent = 'discount_negotiation';
      entities.discountRequested = true;
      const percentMatch = lower.match(/(\d+)%/);
      if (percentMatch) {
        entities.discountPercentRequested = parseInt(percentMatch[1], 10);
      }
      const priceMatch = lower.match(/(\d+)\s*(dhs|dh|درهم)?/);
      if (priceMatch && !percentMatch) {
        const val = parseInt(priceMatch[1], 10);
        if (val >= 50 && val <= 5000) {
          entities.requestedPrice = val;
        }
      }
    } else if (
      lower.includes('boutique') ||
      lower.includes('magasin') ||
      lower.includes('showroom') ||
      lower.includes('horaire') ||
      lower.includes('wa9tash') ||
      lower.includes('waqtach') ||
      lower.includes('au9at') ||
      lower.includes('أوقات') ||
      lower.includes('عنوان') ||
      lower.includes('فين كاينين') ||
      lower.includes('fin jaya') ||
      lower.includes('fin kaynin') ||
      lower.includes('adresse') ||
      lower.includes('telephone') ||
      lower.includes('téléphone') ||
      lower.includes('numéro') ||
      lower.includes('numero') ||
      lower.includes('retrait') ||
      lower.includes('infos') ||
      lower.includes('معلومات') ||
      lower.includes('info magasin') ||
      lower.includes('info boutique')
    ) {
      detectedIntent = 'store_info';
    } else if (
      lower.includes('livraison') ||
      lower.includes('livrez') ||
      lower.includes('توصيل') ||
      lower.includes('katsifto') ||
      lower.includes('chhal lwe9t') ||
      lower.includes('fin katsifto')
    ) {
      detectedIntent = 'delivery_inquiry';
    } else if (
      lower.includes('bghit nchri') ||
      lower.includes('bghit ncommandi') ||
      lower.includes('je confirme') ||
      lower.includes('confirmer') ||
      lower.includes('confirme') ||
      lower.includes('passer la commande') ||
      lower.includes('passer commande') ||
      lower.includes('commander') ||
      lower.includes('saf bghito') ||
      lower.includes('saf bghitha') ||
      lower.includes('safi bghit') ||
      lower.includes('saf c bon') ||
      lower.includes("c'est bon") ||
      lower.includes('siftoha') ||
      lower.includes('siftoha lia') ||
      lower.includes('je valide') ||
      lower.includes('valider') ||
      lower.includes('je prends') ||
      lower.includes('je la prends') ||
      lower.includes('أكد الطلب') ||
      lower.includes('تاكيد الطلب') ||
      lower.includes('تأكيد الطلب') ||
      lower.includes('صافي صيفطو') ||
      lower.includes('صيفطوها ليا') ||
      lower.includes('بغيت نشري') ||
      lower.includes('بغيت نكوموندي')
    ) {
      detectedIntent = 'order_confirmation';
    } else if (
      lower.includes('jalaba') ||
      lower.includes('djellaba') ||
      lower.includes('caftan') ||
      lower.includes('qaftan') ||
      lower.includes('gandora') ||
      lower.includes('argan') ||
      lower.includes('babouche') ||
      lower.includes('بلغة') ||
      lower.includes('قفطان') ||
      lower.includes('جلابة') ||
      lower.includes('produit مناسب') ||
      lower.includes('kayna') ||
      lower.includes('disponible') ||
      lower.includes('chhal')
    ) {
      detectedIntent = 'product_search';
      if (lower.includes('jalaba') || lower.includes('djellaba') || lower.includes('جلابة')) entities.productName = 'djellaba';
      else if (lower.includes('caftan') || lower.includes('qaftan') || lower.includes('قفطان')) entities.productName = 'caftan';
      else if (lower.includes('gandora') || lower.includes('قندورة')) entities.productName = 'gandora';
      else if (lower.includes('argan') || lower.includes('أركان')) entities.productName = 'argan';
      else if (lower.includes('babouche') || lower.includes('بلغة')) entities.productName = 'babouche';
    } else if (
      lower.includes('pizza') ||
      lower.includes('météo') ||
      lower.includes('meteo') ||
      lower.includes('billet') ||
      lower.includes('avion') ||
      lower.includes('hotel') ||
      lower.includes('bitcoin') ||
      lower.includes('crypto') ||
      lower.includes('football') ||
      lower.includes('match') ||
      lower.includes('politique') ||
      lower.includes('recette') ||
      lower.includes('voiture') ||
      lower.includes('restaurant') ||
      lower.includes('voyage')
    ) {
      detectedIntent = 'out_of_scope';
    }

    state.currentIntent = detectedIntent;
    state.detectedEntities = { ...state.detectedEntities, ...entities };

    appendTrace(state, 'conversation_agent', `Intent detected: ${detectedIntent}`, {
      detectedIntent,
      entities: state.detectedEntities,
    });

    return state;
  }
}
