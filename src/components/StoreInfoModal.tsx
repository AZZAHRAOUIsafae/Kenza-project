import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  MapPin,
  Clock,
  Phone,
  Truck,
  RotateCcw,
  ShieldCheck,
  Building2,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
} from 'lucide-react';
import { STORE_INFO, StoreLocation } from '../data/storeInfo';

interface StoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskQuestionInChat?: (questionText: string) => void;
}

export const StoreInfoModal: React.FC<StoreInfoModalProps> = ({
  isOpen,
  onClose,
  onAskQuestionInChat,
}) => {
  const [activeTab, setActiveTab] = useState<'locations' | 'hours' | 'delivery' | 'returns' | 'faq'>('locations');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectFaq = (prompt: string) => {
    if (onAskQuestionInChat) {
      onAskQuestionInChat(prompt);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white p-6 sm:p-7 shrink-0">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-white text-blue-700 font-arabic font-bold text-3xl flex items-center justify-center shadow-lg shrink-0">
                <span>ك</span>
              </div>

              <div>
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-2xl font-black font-display tracking-tight text-white">
                    {STORE_INFO.brandName}
                  </h2>
                  <span className="font-arabic text-xl text-blue-200 font-bold">
                    كنزة
                  </span>
                  <span className="text-[10px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider backdrop-blur-xs">
                    Showroom Certifié 🇲🇦
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl font-medium leading-relaxed">
                  {STORE_INFO.tagline}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-blue-100/90 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-300" />
                    Casablanca (Maârif) & Fès (Médina)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-300" />
                    {STORE_INFO.contacts.showroomPhone}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-300" />
                    Livraison COD Partout au Maroc
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            {[
              { id: 'locations' as const, label: 'Boutiques & Adresses', icon: Building2 },
              { id: 'hours' as const, label: 'Horaires & Contact', icon: Clock },
              { id: 'delivery' as const, label: 'Livraison & Paiement', icon: Truck },
              { id: 'returns' as const, label: 'Échanges & Essayage', icon: RotateCcw },
              { id: 'faq' as const, label: 'Questions Fréquentes', icon: HelpCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Container (Scrollable) */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
            {/* Tab 1: Boutiques & Adresses */}
            {activeTab === 'locations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>Nos Adresses & Points de Vente au Maroc</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Visitez nos showrooms pour découvrir nos confections ou retirer vos commandes sous 24h.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    3 Points Physiques
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STORE_INFO.locations.map((loc: StoreLocation) => (
                    <div
                      key={loc.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        loc.isMainShowroom
                          ? 'bg-blue-50/50 border-blue-200 shadow-xs md:col-span-2'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{loc.name}</span>
                            {loc.isMainShowroom && (
                              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Showroom Principal
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-arabic" dir="rtl">
                            {loc.nameAr}
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopy(loc.id, `${loc.name} : ${loc.address}, ${loc.city}`)}
                          className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer text-xs flex items-center gap-1 shadow-xs"
                          title="Copier l'adresse"
                        >
                          {copiedId === loc.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-[11px] text-blue-700 font-bold">Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copier</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-start space-x-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-900">{loc.address}</strong>
                            <div className="text-slate-500">{loc.landmarks}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{loc.hours}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <a
                            href={`tel:${loc.phone.replace(/\s+/g, '')}`}
                            className="text-blue-600 hover:underline font-mono font-medium"
                          >
                            {loc.phone}
                          </a>
                        </div>
                      </div>

                      {loc.pickupAvailable && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                          <span className="text-blue-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            Retrait en boutique disponible sous 24h
                          </span>
                          <span className="text-slate-400">Gratuit</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Craftsmanship banner */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs">
                  <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-slate-900 block font-semibold">Artisanat 100% Maâlem & Tissus d’Exception</strong>
                    <p className="text-slate-600 leading-relaxed">
                      {STORE_INFO.heritage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Horaires & Contact */}
            {activeTab === 'hours' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Horaires d’Ouverture & Permanence Client</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nos équipes vous accueillent en boutique ou vous répondent instantanément via WhatsApp.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Lundi au Samedi</div>
                    <div className="text-lg font-bold text-slate-900 mt-1">10h00 - 20h00</div>
                    <div className="text-[11px] text-blue-700 mt-1 font-semibold">Journée continue</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">Dimanche</div>
                    <div className="text-lg font-bold text-slate-900 mt-1">14h00 - 19h00</div>
                    <div className="text-[11px] text-slate-500 mt-1">Après-midi uniquement</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 shadow-xs">
                    <div className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                      WhatsApp Kenza IA
                    </div>
                    <div className="text-lg font-bold text-blue-900 mt-1">24h/24 & 7j/7</div>
                    <div className="text-[11px] text-blue-700 mt-1 font-semibold">Réponse immédiate</div>
                  </div>
                </div>

                {/* Direct Contacts List */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Lignes Directes & Coordonnées
                  </h4>

                  <div className="divide-y divide-slate-100">
                    <div className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Showroom Casablanca (Standard)</div>
                          <div className="text-[11px] text-slate-500">Pour réservations et essayages</div>
                        </div>
                      </div>
                      <a
                        href={`tel:${STORE_INFO.contacts.showroomPhone.replace(/\s+/g, '')}`}
                        className="text-xs font-mono font-bold text-blue-600 hover:underline px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200"
                      >
                        {STORE_INFO.contacts.showroomPhone}
                      </a>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">WhatsApp Commercial & Ventes</div>
                          <div className="text-[11px] text-slate-500">Commandes, photos réelles et suivi de colis</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-700 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200">
                        {STORE_INFO.contacts.whatsappDisplay}
                      </span>
                    </div>

                    <div className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <BadgeCheck className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Email Officiel Maison Kenza</div>
                          <div className="text-[11px] text-slate-500">Facturation entreprise et partenariats</div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-700 font-mono">
                        {STORE_INFO.contacts.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legal mentions */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                  <span><strong>RC:</strong> {STORE_INFO.legal.rc}</span>
                  <span><strong>IF:</strong> {STORE_INFO.legal.if}</span>
                  <span><strong>ICE:</strong> {STORE_INFO.legal.ice}</span>
                  <span><strong>Patente:</strong> {STORE_INFO.legal.patente}</span>
                </div>
              </div>
            )}

            {/* Tab 3: Livraison & Paiement */}
            {activeTab === 'delivery' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Politique de Livraison & Modalités de Paiement</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Livraison sécurisée avec Cash on Delivery (COD) dans tout le Royaume du Maroc.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs">
                      <Clock className="w-4 h-4" />
                      <span>Délais Express par Ville</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                      <li><strong>Casablanca & Rabat :</strong> 24h ouvrées chrono à domicile ou au bureau.</li>
                      <li><strong>Fès, Marrakech, Tanger, Meknès :</strong> 24h à 48h ouvrées.</li>
                      <li><strong>Agadir, Oujda, Tétouan, Laâyoune :</strong> 48h ouvrées.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 shadow-xs">
                    <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Paiement à la Livraison (COD)</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Vous ne payez <strong>rien à l’avance</strong>. Le règlement se fait en espèces directement au livreur après réception et vérification de votre colis.
                    </p>
                    <div className="text-[11px] font-semibold text-blue-800 bg-white/80 p-2 rounded-xl border border-blue-200">
                      🎁 Frais de livraison OFFERTS dès {STORE_INFO.deliveryPolicy.freeShippingThresholdMAD} MAD d’achat !
                    </div>
                  </div>
                </div>

                {/* Cities banner */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Villes desservies au Maroc
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {STORE_INFO.deliveryPolicy.citiesCovered}
                  </p>
                  <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Livreurs partenaires de confiance avec appel préalable avant livraison.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Échanges & Essayage */}
            {activeTab === 'returns' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                    <span>Échanges Faciles, Essayage & Garanties</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Votre satisfaction est notre priorité absolue. Commandez l’esprit tranquille.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Essayage à la Réception</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Le livreur peut patienter quelques minutes pour vous permettre d’ouvrir le colis et de vérifier l’article et le tissu.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-blue-600" />
                      <span>Délai d’Échange de 7 Jours</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Si la taille ou la couleur ne vous convient pas, nous effectuons l’échange sous 7 jours (article non porté avec étiquette).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2">
                  <strong className="text-blue-900 font-bold block">Comment demander un échange ?</strong>
                  <p className="text-blue-800 leading-relaxed">
                    Envoyez simplement un message à Kenza sur WhatsApp avec votre numéro de commande et la nouvelle taille désirée. Notre service logistique planifie le passage du livreur pour l’échange direct.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 5: FAQ Rapide */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>Foire Aux Questions (FAQ)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cliquez sur une question pour l’envoyer directement à Kenza dans le chat WhatsApp.
                  </p>
                </div>

                <div className="space-y-3">
                  {STORE_INFO.faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {faq.question}
                        </div>
                        {onAskQuestionInChat && (
                          <button
                            onClick={() => handleSelectFaq(faq.quickPrompt)}
                            className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-blue-600 text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1 shadow-xs transition-colors"
                            title="Poser cette question à Kenza"
                          >
                            <span>Poser à Kenza</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {faq.answer}
                      </p>

                      <div className="text-[11px] text-slate-400 font-arabic pt-1" dir="rtl">
                        {faq.questionAr}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-blue-600" />
              <span>Maison Kenza • Confection Artisanale Marocaine d’Excellence</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (onAskQuestionInChat) {
                    onAskQuestionInChat('Quelles sont les adresses de vos boutiques, vos horaires et vos numéros de contact ?');
                    onClose();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Poser une question sur WhatsApp</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
