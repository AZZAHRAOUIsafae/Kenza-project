export interface StoreLocation {
  id: string;
  name: string;
  nameAr: string;
  city: string;
  address: string;
  district: string;
  landmarks: string;
  phone: string;
  hours: string;
  pickupAvailable: boolean;
  isMainShowroom: boolean;
}

export interface StoreFaqItem {
  id: string;
  question: string;
  questionAr: string;
  answer: string;
  category: 'adresse' | 'livraison' | 'paiement' | 'echange' | 'taille';
  quickPrompt: string;
}

export interface StoreInfoData {
  brandName: string;
  brandNameAr: string;
  tagline: string;
  taglineAr: string;
  description: string;
  heritage: string;
  locations: StoreLocation[];
  openingHours: {
    weekdays: string;
    sunday: string;
    whatsappSupport: string;
  };
  contacts: {
    showroomPhone: string;
    whatsappNumber: string;
    whatsappDisplay: string;
    email: string;
    instagram: string;
  };
  deliveryPolicy: {
    summary: string;
    citiesCovered: string;
    speedCasablancaRabat: string;
    speedOtherCities: string;
    freeShippingThresholdMAD: number;
    paymentMethod: string;
    tryOnAllowed: boolean;
  };
  returnPolicy: {
    exchangeWindowDays: number;
    conditions: string;
    manufacturingWarrantyDays: number;
  };
  legal: {
    rc: string;
    if: string;
    ice: string;
    patente: string;
  };
  faqs: StoreFaqItem[];
}

export const STORE_INFO: StoreInfoData = {
  brandName: 'Maison Kenza',
  brandNameAr: 'دار كنزة للأزياء المغربية الأصيلة',
  tagline: 'L’élégance artisanale marocaine brodée à la main par nos Maâlems',
  taglineAr: 'أصالة القفطان والجلابة المغربية بأنامل الصانع التقليدي',
  description:
    'Maison Kenza est une maison marocaine de haute confection traditionnelle fondée à Casablanca et Fès. Nous perpétuons l’art ancestral de la couture marocaine : Djellabas en Sousdi royal, Caftans brodés au Terz Rbati et Fassi, Gandoras en lin fin et babouches en cuir tanné de Fès.',
  heritage:
    'Chaque création est confectionnée à la main dans nos ateliers partenaires par des Maâlems d’exception. Tissus nobles certifiés, fils de soie de Fès (Sfifa et Aâkad faits main) et finitions irréprochables.',
  locations: [
    {
      id: 'casa-maarif',
      name: 'Showroom Principal Casablanca',
      nameAr: 'المعرض الرئيسي الدار البيضاء (المعاريف)',
      city: 'Casablanca',
      address: '45 Boulevard Al Massira Al Khadra, Quartier Maârif',
      district: 'Maârif (à 2 minutes du Twin Center)',
      landmarks: 'En face de la station Tramway et à côté des galeries',
      phone: '+212 5 22 25 40 88',
      hours: 'Lundi au Samedi : 10h00 - 20h00 (non-stop) • Dimanche : 14h00 - 19h00',
      pickupAvailable: true,
      isMainShowroom: true,
    },
    {
      id: 'fes-medina',
      name: 'Boutique & Atelier Fès Médina',
      nameAr: 'متجر وورشة فاس العتيقة',
      city: 'Fès',
      address: '12 Rue Talaa Kebira, Médina Historique',
      district: 'Près de Bab Boujloud',
      landmarks: 'Au cœur du quartier artisanal des maîtres brodeurs',
      phone: '+212 5 35 63 12 90',
      hours: 'Lundi au Samedi : 09h30 - 19h30',
      pickupAvailable: true,
      isMainShowroom: false,
    },
    {
      id: 'casa-habous',
      name: 'Point Relais & Retouches Habous',
      nameAr: 'نقطة التسليم وتعديل القياس الأحباس',
      city: 'Casablanca',
      address: 'Place des Habous, Nouvelle Médina',
      district: 'Habous',
      landmarks: 'Près du Palais Royal et des artisans maroquiniers',
      phone: '+212 6 61 45 78 90',
      hours: 'Mardi au Samedi : 10h30 - 19h00',
      pickupAvailable: true,
      isMainShowroom: false,
    },
  ],
  openingHours: {
    weekdays: 'Du Lundi au Samedi : 10h00 à 20h00 sans interruption',
    sunday: 'Le Dimanche : 14h00 à 19h00',
    whatsappSupport: 'Assistance IA & Commandes WhatsApp : 24h/24 et 7j/7',
  },
  contacts: {
    showroomPhone: '+212 5 22 25 40 88',
    whatsappNumber: '+212 6 61 45 78 90',
    whatsappDisplay: '+212 6 61 45 78 90',
    email: 'contact@maisonkenza.ma',
    instagram: '@maisonkenza.ma',
  },
  deliveryPolicy: {
    summary: 'Livraison express sécurisée avec paiement 100% à la livraison (Cash on Delivery) partout au Maroc.',
    citiesCovered: 'Toutes les villes du Royaume : Casablanca, Rabat, Marrakech, Tanger, Fès, Meknès, Agadir, Oujda, Tétouan, Kenitra, Salé, Laâyoune, etc.',
    speedCasablancaRabat: '24 heures ouvrées chrono',
    speedOtherCities: '24 à 48 heures ouvrées selon la ville',
    freeShippingThresholdMAD: 500,
    paymentMethod: 'Paiement à la livraison (espèces en dirhams marocains au livreur) ou virement bancaire sur demande.',
    tryOnAllowed: true,
  },
  returnPolicy: {
    exchangeWindowDays: 7,
    conditions: 'Échange garanti sous 7 jours pour toute taille ou modèle (article non porté, dans son emballage d’origine avec étiquette scellée).',
    manufacturingWarrantyDays: 30,
  },
  legal: {
    rc: 'Casablanca n° 489201',
    if: '52891044',
    ice: '002938475000032',
    patente: '34298102',
  },
  faqs: [
    {
      id: 'faq-address',
      question: 'Où se trouve votre magasin physique ?',
      questionAr: 'فين كاين المتجر ديالكم؟',
      answer: 'Notre showroom principal se trouve à Casablanca au 45 Boulevard Al Massira Al Khadra (Quartier Maârif). Nous avons également une boutique-atelier à Fès Médina (12 Rue Talaa Kebira) et un point retrait aux Habous.',
      category: 'adresse',
      quickPrompt: 'Où se trouve votre boutique physique à Casablanca et Fès ?',
    },
    {
      id: 'faq-hours',
      question: 'Quels sont vos horaires d’ouverture ?',
      questionAr: 'شنو هما أوقات العمل ديالكم؟',
      answer: 'Nos showrooms sont ouverts du Lundi au Samedi de 10h00 à 20h00 (non-stop), et le Dimanche de 14h00 à 19h00. Notre agent WhatsApp Kenza répond 24h/24 !',
      category: 'adresse',
      quickPrompt: 'Quels sont vos horaires d’ouverture ?',
    },
    {
      id: 'faq-delivery',
      question: 'Comment se passe la livraison et quels sont les délais ?',
      questionAr: 'كيفاش كتدوز التوصيل وشحال ديال الوقت؟',
      answer: 'Nous livrons dans tout le Maroc. Les délais sont de 24h pour Casablanca et Rabat, et de 24h à 48h pour les autres villes. La livraison est GRATUITE dès 500 MAD d’achat.',
      category: 'livraison',
      quickPrompt: 'Quels sont les délais et frais de livraison pour ma ville ?',
    },
    {
      id: 'faq-payment',
      question: 'Comment s’effectue le paiement ?',
      questionAr: 'كيفاش كنخلص الطلب ديالي؟',
      answer: 'Le paiement se fait à 100% à la livraison (Cash on Delivery) en espèces lorsque le livreur vous remet votre colis. Vous pouvez vérifier votre colis avant de régler.',
      category: 'paiement',
      quickPrompt: 'Comment se passe le paiement à la livraison ?',
    },
    {
      id: 'faq-exchange',
      question: 'Puis-je essayer le modèle et changer de taille si besoin ?',
      questionAr: 'واش نقدر نقيس ونبدل المقاس إلا ما جانيش؟',
      answer: 'Absolument ! Vous pouvez essayer le vêtement lors de la livraison. De plus, nous garantissons l’échange de taille sous 7 jours sans frais supplémentaires.',
      category: 'echange',
      quickPrompt: 'Comment faire un échange de taille si le vêtement ne me va pas ?',
    },
  ],
};
