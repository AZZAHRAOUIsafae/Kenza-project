import fs from 'fs';
import path from 'path';
import { Customer, DeliveryRule, Order, OrderItem, Product, ProductVariant, PromotionRule } from '../types';

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getFashionImageUrl(famille: string, modele?: string): string {
  const m = (modele || '').toLowerCase();
  const f = famille.toLowerCase();

  // Model-specific matches
  if (m.includes('sac à main noir') || m.includes('sac a main noir')) return '/products/sac-noir.jpg';
  if (m.includes('robe terracotta')) return '/products/robe-terracotta.jpg';
  if (m.includes('caftan')) return '/products/caftan-jawhara.jpg';
  if (m.includes('djellaba')) return '/products/djellaba-royale.jpg';
  if (m.includes('gandora')) return '/products/gandora-lin.jpg';
  if (m.includes('babouche') || m.includes('chaussure')) return '/products/babouches-cuir.jpg';
  if (m.includes('argan')) return '/products/argan-bio.jpg';
  if (m.includes('sac à main') || m.includes('sac a main') || f.includes('sac')) return '/products/sac-noir.jpg';
  if (m.includes('ceinture')) return 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80';
  if (m.includes('foulard')) return 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80';
  if (m.includes('veste') || m.includes('blouson')) return 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80';
  if (m.includes('pantalon')) return 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80';
  if (m.includes('robe')) return '/products/robe-terracotta.jpg';

  // Famille fallbacks
  if (f.includes('caftan')) return '/products/caftan-jawhara.jpg';
  if (f.includes('djellaba')) return '/products/djellaba-royale.jpg';
  if (f.includes('robe')) return '/products/robe-terracotta.jpg';
  if (f.includes('sac')) return '/products/sac-noir.jpg';
  if (f.includes('veste') || f.includes('blouson')) return 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80';
  if (f.includes('pantalon')) return 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80';
  if (f.includes('foulard')) return 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80';
  if (f.includes('ceinture')) return 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80';
  if (f.includes('chaussures') || f.includes('babouche')) return '/products/babouches-cuir.jpg';

  return '/products/djellaba-royale.jpg';
}

export class DatasetLoader {
  private static basePath = path.join(process.cwd(), 'data', 'dataset');

  public static getDatasetPath(fileName: string): string {
    return path.join(this.basePath, fileName);
  }

  /**
   * Loads products from /data/dataset/catalogue.csv and groups items by model.
   * Enforces 10% maximum discount floor according to commercial policy.
   */
  public static loadProducts(): Product[] {
    const filePath = this.getDatasetPath('catalogue.csv');
    if (!fs.existsSync(filePath)) {
      console.warn(`[DatasetLoader] Catalogue file not found at ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCsv(content);

    // Group rows by modele
    const modelGroups: Record<string, typeof rows> = {};
    for (const row of rows) {
      const modelName = row.modele || 'Article';
      if (!modelGroups[modelName]) {
        modelGroups[modelName] = [];
      }
      modelGroups[modelName].push(row);
    }

    const products: Product[] = [];

    for (const [modelName, items] of Object.entries(modelGroups)) {
      const first = items[0];
      const famille = first.famille || 'Mode';
      const genre = first.genre || 'mixte';
      const matiere = first.matiere || '';
      const basePriceMAD = parseInt(first.prix_mad, 10) || 100;
      // Strict 10% maximum discount according to politique-commerciale.md
      const minPriceFloorMAD = Math.round(basePriceMAD * 0.9);
      const productId = `prod-${slugify(modelName)}`;

      const variants: ProductVariant[] = items.map((item) => {
        const stockQty = parseInt(item.stock, 10) || 0;
        const reassort = item.delai_reassort_jours ? parseInt(item.delai_reassort_jours, 10) : undefined;
        const poids = item.poids_g ? parseInt(item.poids_g, 10) : undefined;

        return {
          id: `var-${item.ref.toLowerCase()}`,
          productId,
          sku: item.ref,
          size: item.taille || 'Unique',
          color: item.couleur || 'Standard',
          priceMAD: parseInt(item.prix_mad, 10) || basePriceMAD,
          stockQuantity: stockQty,
          isAvailable: stockQty > 0,
          matiere: item.matiere,
          saison: item.saison,
          delaiReassortJours: reassort,
          codeBarre: item.code_barre,
          poidsG: poids,
        };
      });

      const totalStock = variants.reduce((acc, v) => acc + v.stockQuantity, 0);

      products.push({
        id: productId,
        name: modelName,
        nameAr: `${famille} ${modelName}`,
        nameDarija: modelName,
        description: `${modelName} - ${famille} (${genre}). Matière de confection: ${matiere}. Qualité artisanale marocaine garantie.`,
        category: famille.toLowerCase(),
        basePriceMAD,
        minPriceFloorMAD,
        maxDiscountPercent: 10,
        imageUrl: getFashionImageUrl(famille, modelName),
        tags: [famille, genre, first.couleur, matiere, first.saison].filter(Boolean) as string[],
        variants,
        totalStock,
        inStock: totalStock > 0,
        modele: modelName,
        famille,
        genre,
      });
    }

    return products;
  }

  /**
   * Loads customers from /data/dataset/clients.csv
   */
  public static loadCustomers(): Customer[] {
    const filePath = this.getDatasetPath('clients.csv');
    if (!fs.existsSync(filePath)) {
      console.warn(`[DatasetLoader] Clients file not found at ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCsv(content);

    return rows.map((row) => {
      const ordersCount = parseInt(row.nb_commandes, 10) || 0;
      const lang = row.langue_preferee === 'darija' ? 'darija' : row.langue_preferee === 'ar' ? 'ar' : 'fr';
      const segment = row.segment || 'nouveau';
      const isVip = segment === 'fidèle' || ordersCount >= 3;

      return {
        id: row.client_id,
        name: row.nom,
        phone: row.telephone,
        city: row.ville,
        languagePreference: lang,
        totalOrdersCount: ordersCount,
        totalSpentMAD: ordersCount * 650, // estimated historical average
        notes: `Client ${segment}. Premier achat: ${row.premier_achat}. Ville: ${row.ville}`,
        tags: isVip ? [segment, 'VIP'] : [segment],
        createdAt: row.premier_achat ? `${row.premier_achat}T10:00:00.000Z` : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Loads delivery rules from /data/dataset/livraison.csv
   */
  public static loadDeliveryRules(): DeliveryRule[] {
    const filePath = this.getDatasetPath('livraison.csv');
    if (!fs.existsSync(filePath)) {
      console.warn(`[DatasetLoader] Delivery file not found at ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCsv(content);

    return rows.map((row) => {
      const feeMAD = parseInt(row.frais_mad, 10) || 35;
      const delaiHeures = parseInt(row.delai_heures, 10) || 48;
      const daysMin = Math.max(1, Math.floor(delaiHeures / 24));
      const daysMax = Math.ceil(delaiHeures / 24) + 1;
      const cod = row.paiement_a_la_livraison?.toLowerCase() === 'oui';
      const pickup = row.retrait_boutique?.toLowerCase() === 'oui';

      return {
        city: row.ville,
        feeMAD,
        estimatedDaysMin: daysMin,
        estimatedDaysMax: daysMax,
        freeShippingThresholdMAD: 500,
        isAvailable: true,
        delaiHeures,
        paiementALaLivraison: cod,
        retraitBoutique: pickup,
      };
    });
  }

  /**
   * Loads active promotions from /data/dataset/promotions.csv
   */
  public static loadPromotions(): PromotionRule[] {
    const filePath = this.getDatasetPath('promotions.csv');
    if (!fs.existsSync(filePath)) {
      console.warn(`[DatasetLoader] Promotions file not found at ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCsv(content);

    return rows.map((row) => ({
      ref: row.ref,
      modele: row.modele,
      prixNormalMAD: parseInt(row.prix_normal_mad, 10) || 0,
      prixPromoMAD: parseInt(row.prix_promo_mad, 10) || 0,
      debut: row.debut,
      fin: row.fin,
      condition: row.condition,
      isActive: true,
    }));
  }

  /**
   * Loads historical orders and lines from /data/dataset/commandes.csv and commandes-lignes.csv
   */
  public static loadHistoricalOrders(customers: Customer[]): Order[] {
    const ordersFilePath = this.getDatasetPath('commandes.csv');
    const linesFilePath = this.getDatasetPath('commandes-lignes.csv');

    if (!fs.existsSync(ordersFilePath)) {
      return [];
    }

    const ordersContent = fs.readFileSync(ordersFilePath, 'utf-8');
    const orderRows = parseCsv(ordersContent);

    const lineItemsByOrderId: Record<string, OrderItem[]> = {};
    if (fs.existsSync(linesFilePath)) {
      const linesContent = fs.readFileSync(linesFilePath, 'utf-8');
      const lineRows = parseCsv(linesContent);

      for (const lr of lineRows) {
        const orderId = lr.commande_id;
        if (!lineItemsByOrderId[orderId]) {
          lineItemsByOrderId[orderId] = [];
        }
        const qty = parseInt(lr.quantite, 10) || 1;
        const unitPrice = parseInt(lr.prix_unitaire_mad, 10) || 0;
        lineItemsByOrderId[orderId].push({
          id: `item-${orderId}-${lr.ref}`,
          orderId,
          productId: `prod-${slugify(lr.modele)}`,
          productName: lr.modele,
          variantId: `var-${lr.ref.toLowerCase()}`,
          size: lr.taille || 'Unique',
          color: 'Standard',
          unitPriceMAD: unitPrice,
          quantity: qty,
          totalMAD: qty * unitPrice,
        });
      }
    }

    const customerMap = new Map<string, Customer>();
    for (const c of customers) {
      customerMap.set(c.id, c);
    }

    return orderRows.map((row) => {
      const customer = customerMap.get(row.client_id);
      const subtotal = parseInt(row.total_articles_mad, 10) || 0;
      const deliveryFee = parseInt(row.frais_livraison_mad, 10) || 0;
      const total = parseInt(row.total_mad, 10) || subtotal + deliveryFee;

      let status: Order['status'] = 'confirmed';
      if (row.statut === 'livrée') status = 'delivered';
      else if (row.statut === 'en préparation') status = 'preparing';
      else if (row.statut === 'annulée') status = 'cancelled';

      const paymentMethod = row.paiement === 'carte' ? 'cmi_online' : 'cash_on_delivery';
      const items = lineItemsByOrderId[row.commande_id] || [];

      return {
        id: `ord-${row.commande_id.toLowerCase()}`,
        orderNumber: row.commande_id,
        customerId: row.client_id,
        customerName: customer?.name || 'Client',
        customerPhone: customer?.phone || '+212600000000',
        conversationId: `conv-${row.client_id}`,
        cartId: `cart-${row.commande_id}`,
        items,
        subtotalMAD: subtotal,
        discountMAD: 0,
        deliveryFeeMAD: deliveryFee,
        totalMAD: total,
        deliveryCity: row.ville_livraison || customer?.city || 'Casablanca',
        deliveryAddress: `Adresse de livraison (${row.ville_livraison})`,
        status,
        paymentMethod,
        createdAt: row.date ? `${row.date}T12:00:00.000Z` : new Date().toISOString(),
        updatedAt: row.date ? `${row.date}T12:00:00.000Z` : new Date().toISOString(),
        idempotencyKey: `idem-${row.commande_id}`,
      };
    });
  }

  /**
   * Loads the commercial policy markdown
   */
  public static loadCommercialPolicy(): string {
    const filePath = this.getDatasetPath('politique-commerciale.md');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
  }

  /**
   * Loads the boutique FAQ markdown
   */
  public static loadStoreFaq(): string {
    const filePath = this.getDatasetPath('faq-boutique.md');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
  }
}
