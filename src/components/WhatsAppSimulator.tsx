import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, Message, Cart, Product, ProductVariant } from '../types';
import { ProductImage, getProductImageUrl } from '../utils/productImages';
import {
  Send,
  CheckCheck,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Phone,
  Video,
  MoreVertical,
  RotateCcw,
  Zap,
  Package,
  TrendingDown,
  User,
  UserCheck,
  Clock,
  FileSpreadsheet,
  Languages,
  CheckCircle2,
  AlertCircle,
  Truck,
  Image as ImageIcon,
  X,
  ChevronRight,
  ZoomIn,
  Store,
  MapPin,
  Building2,
  Info,
  Mic,
  MicOff,
  Play,
  Pause,
  Volume2,
  Maximize2,
  Minimize2,
  Activity,
  SlidersHorizontal,
  Eye,
  BookOpen,
} from 'lucide-react';
import { StoreInfoModal } from './StoreInfoModal';
import { MessageReaderModal } from './MessageReaderModal';

interface WhatsAppSimulatorProps {
  customers: Customer[];
  activeCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  activeCart?: Cart;
  onRunScenario: (scenarioKey: string) => Promise<void>;
  products?: Product[];
  isTraceOpen?: boolean;
  onToggleTrace?: () => void;
}

/**
 * Aperçu produit interactif 100% fidèle dans le flux de chat :
 * - Photo exacte correspondant au coloris et modèle
 * - Sélecteur rapide de couleurs
 * - Zoom HD lightbox au clic
 */
const ChatProductPreview: React.FC<{
  product: Product;
  initialVariant?: ProductVariant;
  onAsk: (text: string) => void;
}> = ({ product, initialVariant, onAsk }) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(initialVariant);
  const activeImage = selectedVariant?.imageUrl || product.imageUrl;
  const activeColor = selectedVariant?.color;
  const activeColorHex = selectedVariant?.colorHex;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-sky-200/90 shadow-sm flex flex-col space-y-3"
    >
      <div className="flex items-start sm:items-center space-x-3.5">
        {/* Photo exacte agrandie avec Zoom HD */}
        <div
          className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-sky-200 bg-slate-100 relative group cursor-pointer shadow-xs"
          title="Cliquer pour agrandir la photo HD"
        >
          <ProductImage
            src={activeImage}
            alt={product.name}
            color={activeColor}
            colorHex={activeColorHex}
            fallbackCategory={product.category}
            enableZoom={true}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center space-x-2 justify-between">
            <span className="text-sm sm:text-base font-bold text-slate-900 truncate">{product.name}</span>
            <span className="text-xs sm:text-sm px-2.5 py-1 rounded-xl bg-sky-50 text-[#0E4957] font-mono font-black shrink-0 border border-sky-200">
              {product.basePriceMAD} MAD
            </span>
          </div>
          {activeColor && (
            <div className="flex items-center gap-2">
              {activeColorHex && (
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-xs"
                  style={{ backgroundColor: activeColorHex }}
                />
              )}
              <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                Couleur : <strong className="text-[#0E4957]">{activeColor}</strong>
              </span>
            </div>
          )}
          <p className="text-xs text-slate-600 truncate">
            {selectedVariant
              ? selectedVariant.stockQuantity > 0
                ? `✓ En stock (${selectedVariant.stockQuantity} ex. en ${selectedVariant.size})`
                : `✗ Rupture en ${selectedVariant.size} (${selectedVariant.color})`
              : product.totalStock > 0
              ? `✓ En stock (${product.totalStock} ex.)`
              : 'Épuisé'}
          </p>
        </div>
      </div>

      {/* Sélecteur de couleurs interactif pour basculer la photo en direct */}
      {product.variants.length > 1 && (
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Coloris :</span>
            {Array.from(new Set(product.variants.map((v) => v.color))).map((col) => {
              const variantForCol = product.variants.find((v) => v.color === col);
              const isSelected = selectedVariant?.color === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => {
                    if (variantForCol) setSelectedVariant(variantForCol);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0E4957] border-[#0E4957] text-white font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-sky-50'
                  }`}
                >
                  {variantForCol?.colorHex && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: variantForCol.colorHex }}
                    />
                  )}
                  <span>{col}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              onAsk(
                selectedVariant
                  ? `Salam Kenza, bghit had ${product.name} couleur ${selectedVariant.color} taille ${selectedVariant.size}`
                  : `Salam Kenza, bghit ma3loumat 3la ${product.name}`
              );
            }}
            className="text-xs text-[#0284C7] hover:text-[#0E4957] font-bold shrink-0 hover:underline cursor-pointer"
          >
            Sélectionner cet article →
          </button>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Carte produit du catalogue avec sélecteur de couleurs temps-réel et Zoom HD
 */
const CatalogProductCard: React.FC<{
  product: Product;
  onSelect: (prompt: string) => void;
}> = ({ product, onSelect }) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0] || ({} as ProductVariant)
  );

  const activePhoto = selectedVariant?.imageUrl || product.imageUrl;
  const activeColor = selectedVariant?.color;
  const activeHex = selectedVariant?.colorHex;

  return (
    <div className="bg-white border border-slate-200 hover:border-blue-500/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col group">
      <div className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer" title="Cliquer pour zoomer en HD">
        <ProductImage
          src={activePhoto}
          alt={product.name}
          color={activeColor}
          colorHex={activeHex}
          fallbackCategory={product.category}
          enableZoom={true}
          showColorBadge={true}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-800 uppercase tracking-wider border border-slate-200 shadow-xs pointer-events-none">
          {product.category}
        </div>
        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-blue-600 text-white font-black text-xs font-mono shadow-md pointer-events-none">
          {product.basePriceMAD} MAD
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            {product.nameAr && (
              <span className="text-xs text-slate-500 font-serif" dir="rtl">
                {product.nameAr}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Sélecteur de variantes de couleurs avec mise à jour immédiate de la photo */}
        {product.variants.length > 1 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-slate-400 font-medium">Coloris disponibles (cliquez pour afficher la photo) :</div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set(product.variants.map((v) => v.color))).map((col) => {
                const variant = product.variants.find((v) => v.color === col);
                const isSelected = selectedVariant?.color === col;
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => {
                      if (variant) setSelectedVariant(variant);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {variant?.colorHex && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full border shrink-0 ${isSelected ? 'border-white' : 'border-black/20'}`}
                        style={{ backgroundColor: variant.colorHex }}
                      />
                    )}
                    <span>{col}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-600 font-mono">
            Stock: <strong className={product.totalStock > 0 ? 'text-blue-600' : 'text-slate-400'}>{product.totalStock} ex.</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              onSelect(
                selectedVariant?.color
                  ? `Salam Kenza, bghit n3ref ma3loumat kter 3la ${product.name} (Couleur: ${selectedVariant.color})`
                  : `Salam Kenza, bghit n3ref ma3loumat kter 3la ${product.name} (${product.basePriceMAD} MAD)`
              );
            }}
            className="text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Demander</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  customers,
  activeCustomer,
  onSelectCustomer,
  messages,
  onSendMessage,
  isLoading,
  activeCart,
  onRunScenario,
  products = [],
  isTraceOpen = false,
  onToggleTrace,
}) => {
  const [inputText, setInputText] = useState('');
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showStoreInfoModal, setShowStoreInfoModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isWideView, setIsWideView] = useState(true);
  const [fontSizeMode, setFontSizeMode] = useState<'normal' | 'large' | 'xl' | 'xxl'>('large');
  const [selectedMessageForReading, setSelectedMessageForReading] = useState<Message | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showTopControls, setShowTopControls] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-MA';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((r: any) => r[0].transcript)
            .join('');
          setInputText(transcript);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
        recognitionRef.current = recognition;
        return;
      } catch (e) {
        console.warn('Speech recognition not available', e);
      }
    }
    // Fallback if browser permission is blocked in sandbox iframe
    setShowVoiceMenu(true);
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendVoicePreset = async (text: string, duration: string) => {
    setShowVoiceMenu(false);
    await onSendMessage(`🎤 Note vocale (${duration}) : « ${text} »`);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    await onSendMessage(text);
  };

  const quickScenarios = [
    {
      key: 'A',
      label: 'A: Vente Normale',
      category: 'Vente',
      icon: ShoppingBag,
      color: 'from-blue-600 to-blue-700',
      badge: 'COD Casablanca',
      query: 'Salam, bghit djellaba sousdi taille M l Casablanca, je confirme la commande',
    },
    {
      key: 'B',
      label: 'B: Rupture & Stock',
      category: 'Stock',
      icon: Package,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Alternative',
      query: 'bghit djellaba sousdi bleu taille L واش كاينة؟',
    },
    {
      key: 'C',
      label: 'C: Changement Taille',
      category: 'Panier',
      icon: RotateCcw,
      color: 'from-sky-500 to-blue-600',
      badge: 'Taille L Vert',
      query: 'badalt rayi, 3tini taille L فجلابة خضرا',
    },
    {
      key: 'D',
      label: 'D: Négociation Floor',
      category: 'Guardrail',
      icon: TrendingDown,
      color: 'from-slate-600 to-slate-800',
      badge: 'Plancher 650 MAD',
      query: 'dir lia fiha remise, 500 dhs akhoya ? (minimum 650)',
    },
    {
      key: 'E',
      label: 'E: Mémoire Client',
      category: 'Mémoire',
      icon: UserCheck,
      color: 'from-indigo-600 to-blue-700',
      badge: 'Client Fidèle',
      query: 'Salam kenza, ana rje3t',
    },
    {
      key: 'F',
      label: 'F: Abandon & Relance',
      category: 'BullMQ',
      icon: Clock,
      color: 'from-slate-700 to-slate-900',
      badge: 'Relance Auto',
      query: 'عجباتني الجلابة، غنفكر ونرجع عندك من بعد إن شاء الله',
    },
    {
      key: 'G',
      label: 'G: Escalade Facture',
      category: 'Escalade',
      icon: FileSpreadsheet,
      color: 'from-blue-700 to-slate-800',
      badge: 'Gérant Humain',
      query: 'Je veux une facture au nom de ma société SARL avec RC et IF',
    },
    {
      key: 'H',
      label: 'H: Darija Latine',
      category: 'NLP',
      icon: Languages,
      color: 'from-blue-600 to-sky-600',
      badge: 'Arabizi 3arbizi',
      query: 'ch7al taman dyal had caftan w wash katsifto l rabat?',
    },
    {
      key: 'I',
      label: 'I: Infos Magasin',
      category: 'Boutique',
      icon: Store,
      color: 'from-blue-600 to-indigo-700',
      badge: 'Adresses & Horaires',
      query: 'Quelles sont les adresses de vos boutiques, vos horaires et vos numéros de contact ?',
    },
    {
      key: 'J',
      label: 'J: Note Vocale',
      category: 'Audio',
      icon: Mic,
      color: 'from-emerald-600 to-teal-700',
      badge: 'Note Vocale (0:08)',
      query: '🎤 Note vocale (0:08) : « Salam Kenza, bghit djellaba sousdi taille M l Casablanca »',
    },
    {
      key: 'K',
      label: 'K: Hors Sujet',
      category: 'Guardrail',
      icon: AlertCircle,
      color: 'from-amber-600 to-slate-700',
      badge: 'Refus Hallucination',
      query: 'Combien coûte un billet d’avion pour Paris ou une pizza aux fruits de mer ?',
    },
  ];

  const suggestedReplies = [
    'Infos du magasin Kenza & Horaires',
    'Où se trouve votre showroom à Casablanca ?',
    'Salam! Chhal taman dyal Djellaba Sousdi?',
    '3afak wash kayn chi remise ?',
    'Je confirme la commande b Paiement à la livraison',
  ];

  return (
    <div className={`flex-1 flex flex-col ${isFullScreen ? 'fixed inset-0 z-50 p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md h-screen w-screen' : 'h-[calc(100vh-4.25rem)] bg-slate-100/50 relative'} overflow-hidden transition-all`}>
      {/* Background ambient subtle navy & sky blue glow */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none animate-float-orb1"></div>
      <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-[#0E4957]/10 rounded-full blur-3xl pointer-events-none animate-float-orb2"></div>

      {/* Collapsible Demo HUD Control Strip */}
      <div className="bg-white/95 backdrop-blur-md border-b border-sky-100 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-xs z-20">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowTopControls(!showTopControls)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0E4957] font-bold text-xs border border-sky-200 cursor-pointer transition-colors shadow-xs"
            title="Afficher ou masquer les sélecteurs de démo pour libérer l'espace de lecture"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>{showTopControls ? 'Masquer Outils Démo ▲' : 'Outils Démo & Scénarios ▼'}</span>
          </button>
          <span className="text-xs text-slate-600 font-medium hidden sm:inline">
            Client en cours : <strong className="text-[#0E4957]">{activeCustomer?.name}</strong> ({activeCustomer?.city})
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 hidden md:inline text-[11px] font-semibold">
            ✨ Astuce : Cliquez sur n'importe quel message pour le lire en grand format
          </span>
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isFullScreen
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-gradient-to-r from-[#0E4957] to-[#0284C7] text-white'
            }`}
            title={isFullScreen ? 'Quitter le mode plein écran' : 'Agrandir l’interface en plein écran'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{isFullScreen ? 'Quitter Plein Écran' : 'Mode Plein Écran'}</span>
          </button>
        </div>
      </div>

      {/* Top Bar: Customer Selector & Scenarios HUD (Collapsible) */}
      <AnimatePresence>
        {showTopControls && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/95 backdrop-blur-md border-b border-sky-100 p-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-3 shadow-xs z-20 overflow-hidden"
          >
            <div className="flex items-center space-x-2.5">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0A192F] to-[#0E4957] text-white shadow-xs border border-sky-400/30">
                <UserCheck className="w-3.5 h-3.5 text-sky-300" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Client Actif :</span>
              </div>

              <div className="relative">
                <select
                  id="select-customer"
                  value={activeCustomer?.id || ''}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value);
                    if (cust) onSelectCustomer(cust);
                  }}
                  className="text-xs font-bold bg-white text-slate-800 border border-sky-200 rounded-xl px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0284C7] cursor-pointer shadow-xs hover:border-sky-400 transition-all pr-8"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white text-slate-900 py-1">
                      {c.name} • {c.city} {c.totalOrdersCount > 0 ? `(VIP • ${c.totalOrdersCount} commandes)` : '(Nouveau)'}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ▾
                </div>
              </div>
            </div>

            {/* Quick Scenario Buttons Carousel */}
            <div className="flex items-center space-x-2 overflow-x-auto max-w-full py-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 border border-sky-200 text-[#0E4957] text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap">
                <Zap className="w-3 h-3 text-[#0284C7] animate-pulse" />
                <span>1-Clic Auto-Test :</span>
              </div>
              {quickScenarios.map((sc) => {
                const Icon = sc.icon;
                return (
                  <motion.button
                    key={sc.key}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    id={`quick-scenario-${sc.key}`}
                    onClick={() => onRunScenario(sc.key)}
                    disabled={isLoading}
                    title={sc.query}
                    className="group relative flex items-center space-x-1.5 text-xs font-semibold bg-white hover:bg-sky-50/60 text-slate-700 hover:text-[#0E4957] border border-sky-100 hover:border-sky-300 rounded-xl px-3 py-1.5 transition-all whitespace-nowrap shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded-lg bg-gradient-to-r ${sc.color} flex items-center justify-center text-white shadow-xs`}>
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                    <span className="font-medium tracking-tight">{sc.label}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-mono border border-slate-200 group-hover:border-sky-200 group-hover:text-[#0284C7]">
                      {sc.badge}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main WhatsApp Window Container with Modern Frame & Gradient Header */}
      <div className={`flex-1 flex flex-col w-full ${isWideView || isFullScreen ? 'max-w-6xl xl:max-w-7xl' : 'max-w-4xl'} mx-auto my-0.5 sm:my-1 rounded-3xl overflow-hidden bg-white shadow-2xl shadow-sky-950/15 border border-sky-200 relative z-10 transition-all duration-300`}>
        {/* WhatsApp Header: Deep Navy + Petrol + Sky Blue Glow */}
        <div className="bg-gradient-to-r from-[#071324] via-[#0B1E36] via-[#0E4957] to-[#0369A1] text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 border-b border-sky-400/20 shadow-md relative">
          <div
            onClick={() => setShowStoreInfoModal(true)}
            className="flex items-center space-x-3.5 cursor-pointer group"
            title="Cliquez pour voir toutes les informations du magasin Kenza"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0A192F] via-[#0E4957] to-[#38BDF8] text-white font-arabic font-bold flex items-center justify-center text-2xl shadow-lg shadow-sky-500/20 border border-sky-300/30 group-hover:scale-105 transition-transform">
                <span className="text-sky-100">ك</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#38BDF8] border-2 border-[#0A192F] shadow-xs"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-display font-black text-base sm:text-xl tracking-tight text-white flex items-center gap-2 group-hover:text-sky-200 transition-colors">
                  <span>Maison Kenza</span>
                  <span className="text-sky-300 font-arabic text-xl">كنزة</span>
                </h2>
                <span className="text-[10px] sm:text-xs bg-white/15 text-sky-100 px-2.5 py-0.5 rounded-full font-bold border border-white/20 shadow-xs backdrop-blur-xs">
                  IA Autonome 🇲🇦
                </span>
              </div>
              <div className="text-xs text-sky-200/90 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 font-medium text-sky-100">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                  En ligne • Vente instantanée COD
                </span>
                <span className="text-sky-300/40">•</span>
                <span className="text-sky-200 font-semibold group-hover:underline flex items-center gap-0.5">
                  <Info className="w-3.5 h-3.5 text-sky-300" />
                  Infos Magasin
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
            {/* Live Cart Snapshot Button */}
            {activeCart && activeCart.items.length > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs sm:text-sm border border-white/25 text-white shadow-xs"
              >
                <ShoppingBag className="w-4 h-4 text-sky-300 animate-bounce" />
                <span className="font-black text-sky-100 font-mono">{activeCart.totalMAD} MAD</span>
                <span className="text-xs text-sky-200 font-semibold">
                  ({activeCart.items.reduce((s, i) => s + i.quantity, 0)} art.)
                </span>
              </motion.div>
            )}

            {/* Font Size Selector for maximum readability */}
            <div className="flex items-center bg-white/15 backdrop-blur-xs rounded-xl p-0.5 border border-sky-300/30 text-xs font-bold text-sky-100 shadow-xs">
              <button
                type="button"
                onClick={() => setFontSizeMode('normal')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  fontSizeMode === 'normal' ? 'bg-sky-400 text-slate-950 font-black shadow-xs' : 'hover:bg-white/10'
                }`}
                title="Taille de texte Standard"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSizeMode('large')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  fontSizeMode === 'large' ? 'bg-sky-400 text-slate-950 font-black shadow-xs' : 'hover:bg-white/10'
                }`}
                title="Taille de texte Grande (Recommandé)"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSizeMode('xl')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  fontSizeMode === 'xl' ? 'bg-sky-400 text-slate-950 font-black shadow-xs' : 'hover:bg-white/10'
                }`}
                title="Taille de texte Très Grande (Lisibilité maximale)"
              >
                A++
              </button>
              <button
                type="button"
                onClick={() => setFontSizeMode('xxl')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  fontSizeMode === 'xxl' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'hover:bg-white/10'
                }`}
                title="Taille de texte Géante XXL (Confort ultime)"
              >
                A+++
              </button>
            </div>

            {/* Wide/Standard Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsWideView(!isWideView)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-sky-100 border border-sky-300/30 transition-all cursor-pointer text-xs font-semibold shadow-xs backdrop-blur-xs"
              title={isWideView ? 'Passer en format standard' : 'Agrandir en vue large'}
            >
              {isWideView ? <Minimize2 className="w-3.5 h-3.5 text-sky-300" /> : <Maximize2 className="w-3.5 h-3.5 text-sky-300" />}
              <span className="hidden sm:inline">{isWideView ? 'Format Standard' : 'Vue Large'}</span>
            </button>

            {/* Toggle LangGraph Trace */}
            {onToggleTrace && (
              <button
                type="button"
                onClick={onToggleTrace}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs font-bold shadow-xs ${
                  isTraceOpen
                    ? 'bg-sky-300 text-slate-900 border border-sky-200 font-black'
                    : 'bg-white/10 hover:bg-white/20 text-sky-100 border border-sky-300/30'
                }`}
                title="Afficher ou masquer l'inspecteur LangGraph"
              >
                <Activity className="w-3.5 h-3.5 text-sky-200" />
                <span className="hidden md:inline">{isTraceOpen ? 'Fermer Trace' : 'Trace LangGraph'}</span>
              </button>
            )}

            <button
              type="button"
              id="btn-store-info-header"
              onClick={() => setShowStoreInfoModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-sky-100 border border-sky-300/30 transition-all cursor-pointer text-xs font-bold shadow-xs backdrop-blur-xs"
              title="Consulter les adresses des showrooms, horaires, téléphones et conditions"
            >
              <Store className="w-3.5 h-3.5 text-sky-300" />
              <span className="hidden lg:inline">Infos Magasin</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCatalogModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0E4957] to-[#0284C7] hover:from-[#083344] hover:to-[#0369A1] text-white transition-all cursor-pointer text-xs font-semibold shadow-xs border border-sky-300/30"
              title="Consulter la galerie des modèles avec photos réelles"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-200" />
              <span className="hidden lg:inline">Galerie Photos</span>
            </button>
          </div>
        </div>

        {/* Live Active Cart Floating Banner if items exist */}
        <AnimatePresence>
          {activeCart && activeCart.items.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 text-xs text-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-xs"
            >
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 shadow-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-blue-900">Panier en cours:</span>{' '}
                  <span className="text-slate-700 font-medium">
                    {activeCart.items.map((i) => `${i.productName} (${i.size} • ${i.color}) x${i.quantity}`).join(', ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1 text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Livraison: {activeCart.deliveryFeeMAD === 0 ? 'Gratuite (>500 MAD)' : `${activeCart.deliveryFeeMAD} MAD`}</span>
                </span>
                <span className="font-mono font-black text-sm text-blue-700 bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-xs">
                  Total: {activeCart.totalMAD} MAD
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security, Store Info & Authenticity Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-center text-[11px] text-slate-600 flex flex-wrap items-center justify-center gap-2 shadow-xs">
          <div className="flex items-center space-x-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Maison Kenza • Showrooms Casablanca (Maârif) & Fès (Médina)</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500 hidden sm:inline">Horaires: 10h-20h (Lun-Sam)</span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <button
            type="button"
            onClick={() => setShowStoreInfoModal(true)}
            className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer flex items-center gap-1"
          >
            <Info className="w-3 h-3" />
            <span>Voir toutes les infos du magasin</span>
          </button>
        </div>

        {/* WhatsApp Messages Feed */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 bg-slate-100/70">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto my-6 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center font-arabic text-2xl font-bold border border-blue-200 shadow-xs">
                <span>ك</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Bienvenue chez Maison Kenza !</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Haute confection marocaine brodée main par nos Maâlems. Retrouvez toutes les informations de notre magasin ou conversez avec Kenza.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowStoreInfoModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fiche & Adresses du Magasin</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSendMessage('Quelles sont les adresses de vos boutiques et vos horaires ?')}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold transition-all cursor-pointer"
                >
                  Horaires & Showroom ?
                </button>
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.sender === 'customer';
              const isSystem = msg.sender === 'system';
              const isHuman = msg.sender === 'human_agent';

              if (isSystem) {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center my-2"
                  >
                    <div className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-2xl text-xs shadow-xs max-w-md text-center flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium">{msg.content}</span>
                    </div>
                  </motion.div>
                );
              }

              const isOrderMessage = msg.content.includes('KZ-') || msg.content.includes('confirmée');

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[96%] sm:max-w-[92%] lg:max-w-[88%] rounded-3xl p-5 sm:p-6 shadow-sm relative transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-[#0E4957] text-white rounded-tr-none shadow-md shadow-sky-900/15 border border-sky-400/30'
                        : isHuman
                        ? 'bg-gradient-to-br from-[#071324] via-[#0A192F] to-[#0E4957] text-white rounded-tl-none border border-sky-400/40 shadow-md'
                        : 'bg-white text-slate-900 rounded-tl-none border border-sky-100 shadow-sm hover:border-sky-300 transition-colors'
                    }`}
                  >
                    {/* User Header Tag */}
                    {isUser && (
                      <div className="text-xs font-bold text-sky-100 mb-2.5 flex items-center justify-between pb-1.5 border-b border-white/20">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-sky-200" />
                          <span>{activeCustomer?.name || 'Vous'} (Client)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedMessageForReading(msg)}
                          className="flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                          title="Agrandir et lire ce message en très grand format"
                        >
                          <Eye className="w-3 h-3 text-sky-200" />
                          <span>Lire en grand</span>
                        </button>
                      </div>
                    )}

                    {/* Human Agent Header Tag */}
                    {isHuman && (
                      <div className="text-xs font-bold text-sky-200 mb-2.5 flex items-center justify-between pb-1.5 border-b border-sky-500/30">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
                          <span>👤 Gérant du Magasin (Humain)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedMessageForReading(msg)}
                          className="flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-sky-100 transition-colors cursor-pointer"
                          title="Agrandir et lire ce message en très grand format"
                        >
                          <Eye className="w-3 h-3 text-sky-300" />
                          <span>Lire en grand</span>
                        </button>
                      </div>
                    )}

                    {/* AI Agent Header Tag */}
                    {!isUser && !isHuman && (
                      <div className="text-xs font-extrabold text-[#0E4957] mb-2 flex items-center justify-between pb-1.5 border-b border-sky-50">
                        <div className="flex items-center space-x-1.5">
                          <Sparkles className="w-4 h-4 text-[#0284C7]" />
                          <span className="text-xs sm:text-sm font-black">Kenza • كنزة (IA Commerciale)</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedMessageForReading(msg)}
                            className="flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-sky-100/70 hover:bg-sky-200 text-[#0284C7] transition-colors cursor-pointer"
                            title="Agrandir et lire ce message en très grand format"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lire en grand</span>
                          </button>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-[#0E4957] border border-sky-200 font-mono font-bold">
                            Auto-Agent
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Message Body */}
                    {msg.content.includes('Note vocale') ? (
                      <div className="space-y-2.5 my-1">
                        <div
                          className={`p-3.5 rounded-2xl flex items-center space-x-3.5 ${
                            isUser ? 'bg-white/15 text-white backdrop-blur-xs' : 'bg-sky-50/70 text-slate-800 border border-sky-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)}
                            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-transform hover:scale-105 ${
                              isUser ? 'bg-white text-[#0E4957]' : 'bg-gradient-to-r from-[#0E4957] to-[#0284C7] text-white shadow-md shadow-sky-500/20'
                            }`}
                          >
                            {playingVoiceId === msg.id ? (
                              <Pause className="w-5 h-5 fill-current" />
                            ) : (
                              <Play className="w-5 h-5 ml-0.5 fill-current" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center space-x-0.5 h-7">
                              {[35, 65, 45, 90, 60, 85, 40, 95, 70, 50, 80, 55, 35, 75, 50, 30].map((h, i) => (
                                <span
                                  key={i}
                                  className={`w-1 rounded-full transition-all ${
                                    isUser ? 'bg-sky-200' : 'bg-[#0284C7]'
                                  } ${playingVoiceId === msg.id ? 'animate-pulse' : ''}`}
                                  style={{
                                    height: `${playingVoiceId === msg.id ? Math.min(100, h + ((i % 3) * 15)) : h}%`,
                                  }}
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-xs opacity-85 font-mono">
                              <span>{playingVoiceId === msg.id ? '0:03' : '0:08'}</span>
                              <span className="flex items-center gap-1 font-sans text-xs">
                                <Mic className="w-3.5 h-3.5 inline text-emerald-400" /> Audio WhatsApp
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={`text-xs sm:text-sm px-3 py-1.5 rounded-xl ${isUser ? 'bg-black/20 text-sky-100' : 'bg-white text-slate-700 border border-sky-100'}`}>
                          <span className="font-semibold">Transcription : </span>
                          <span className="italic">{msg.content.replace(/^🎤\s*Note vocale\s*\([^)]+\)\s*:\s*«?\s*/i, '').replace(/\s*»?\s*$/, '')}</span>
                        </div>
                      </div>
                    ) : (
                      <p
                        onClick={() => setSelectedMessageForReading(msg)}
                        title="Cliquez pour agrandir ce message (Lecture grand format)"
                        className={`whitespace-pre-wrap font-sans cursor-pointer hover:opacity-95 transition-opacity ${
                          fontSizeMode === 'xxl'
                            ? 'text-xl sm:text-2xl lg:text-3xl leading-relaxed font-medium'
                            : fontSizeMode === 'xl'
                            ? 'text-lg sm:text-xl lg:text-2xl leading-relaxed font-normal'
                            : fontSizeMode === 'large'
                            ? 'text-base sm:text-lg lg:text-xl leading-relaxed font-normal'
                            : 'text-sm sm:text-base lg:text-lg leading-relaxed font-normal'
                        }`}
                      >
                        {msg.content}
                      </p>
                    )}

                    {/* Detected Product Photo Preview Card */}
                    {!isUser && !isHuman && products.length > 0 && (() => {
                      const c = msg.content.toLowerCase();
                      const matched = products.find(
                        (p) =>
                          c.includes(p.name.toLowerCase()) ||
                          (p.modele && c.includes(p.modele.toLowerCase())) ||
                          (c.includes('djellaba') && p.category.includes('djellaba')) ||
                          (c.includes('caftan') && p.category.includes('caftan')) ||
                          (c.includes('babouche') && p.name.toLowerCase().includes('babouche')) ||
                          (c.includes('argan') && p.name.toLowerCase().includes('argan')) ||
                          (c.includes('robe') && p.name.toLowerCase().includes('robe')) ||
                          (c.includes('sac') && p.name.toLowerCase().includes('sac'))
                      );

                      if (!matched) return null;

                      // Détection de couleur explicite dans le message
                      const isGreen = c.includes('vert') || c.includes('émeraude') || c.includes('emeraude') || c.includes('خضرا') || c.includes('أخضر');
                      const isBlue = c.includes('bleu') || c.includes('majorelle') || c.includes('ciel') || c.includes('زرقا') || c.includes('أزرق');
                      const isWhite = c.includes('blanc') || c.includes('cassé') || c.includes('بيضا') || c.includes('أبيض');
                      const isPink = c.includes('rose') || c.includes('poudré') || c.includes('وردي');
                      const isBlack = c.includes('noir') || c.includes('ébène') || c.includes('كحلة') || c.includes('أسود');
                      const isYellow = c.includes('jaune') || c.includes('fassi') || c.includes('صفرا') || c.includes('أصفر');
                      const isBeige = c.includes('beige') || c.includes('sable');

                      const initialVariant = matched.variants.find((v) => {
                        const vColor = v.color.toLowerCase();
                        if (isGreen && (vColor.includes('vert') || vColor.includes('émeraude'))) return true;
                        if (isBlue && (vColor.includes('bleu') || vColor.includes('majorelle') || vColor.includes('ciel'))) return true;
                        if (isWhite && (vColor.includes('blanc') || vColor.includes('cassé'))) return true;
                        if (isPink && vColor.includes('rose')) return true;
                        if (isBlack && (vColor.includes('noir') || vColor.includes('ébène'))) return true;
                        if (isYellow && (vColor.includes('jaune') || vColor.includes('fassi'))) return true;
                        if (isBeige && (vColor.includes('beige') || vColor.includes('sable'))) return true;
                        return false;
                      }) || matched.variants[0];

                      return (
                        <ChatProductPreview
                          key={`chat-prod-${msg.id}-${matched.id}`}
                          product={matched}
                          initialVariant={initialVariant}
                          onAsk={(text) => setInputText(text)}
                        />
                      );
                    })()}

                    {/* Rich Order Confirmation Card */}
                    {isOrderMessage && !isUser && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 p-3.5 rounded-2xl bg-blue-50 border-2 border-blue-500/40 text-slate-800 text-xs shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                              ✓
                            </div>
                            <span className="font-extrabold text-blue-950 text-xs tracking-wide">
                              Commande Officielle Confirmée
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold">
                            Paiement à la Livraison
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>Livraison Sécurisée</span>
                          <span className="font-semibold text-blue-700">Express 24h - 48h partout au Maroc</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Footer: Action button to open large reading view + Timestamp and Double Checkmarks */}
                    <div className="flex items-center justify-between space-x-2 mt-3 pt-2 border-t border-black/5 dark:border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedMessageForReading(msg)}
                        className={`flex items-center space-x-1.5 text-[11px] font-bold transition-colors cursor-pointer py-1 px-2.5 rounded-xl ${
                          isUser
                            ? 'text-sky-100 hover:text-white bg-white/15 hover:bg-white/25'
                            : isHuman
                            ? 'text-sky-200 hover:text-white bg-white/15 hover:bg-white/25'
                            : 'text-[#0284C7] hover:text-[#0369A1] bg-sky-50 hover:bg-sky-100 border border-sky-200'
                        }`}
                        title="Ouvrir ce message dans l'interface de lecture grand format"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Lire en grand format</span>
                      </button>

                      <div className="flex items-center space-x-1.5 text-[11px]">
                        <span className={isUser ? 'text-sky-100 font-mono' : 'text-slate-400 font-mono'}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isUser && <CheckCheck className="w-3.5 h-3.5 text-white inline" />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-xs border border-slate-200 flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></div>
                <span className="text-xs text-slate-700 font-medium">Kenza consulte le stock et prépare sa réponse...</span>
                <div className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Replies Carousel */}
        <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center space-x-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Réponses suggérées :
          </span>
          {suggestedReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(reply)}
              disabled={isLoading}
              className="text-[11px] font-medium bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-full px-3 py-1 whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Voice Recording Live Banner */}
        {isRecording && (
          <div className="bg-red-50 border-t border-red-200 px-4 py-2 flex items-center justify-between text-xs text-red-700 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="font-semibold">Microphone actif : Parlez en Darija ou Français...</span>
            </div>
            <button
              type="button"
              onClick={stopVoiceRecording}
              className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-[11px] font-bold hover:bg-red-700 cursor-pointer"
            >
              Terminer l'enregistrement
            </button>
          </div>
        )}

        {/* Voice Note Quick Selector Popover */}
        <AnimatePresence>
          {showVoiceMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="bg-white border-t border-slate-200 p-4 shadow-xl relative z-20 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Simulateur de Notes Vocales WhatsApp</h4>
                    <p className="text-[11px] text-slate-500">Testez la compréhension vocale de Kenza en direct</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVoiceMenu(false)}
                  className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowVoiceMenu(false);
                    startVoiceRecording();
                  }}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-left transition-colors flex items-center gap-2 text-blue-800 font-medium text-xs cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold">Parler dans mon micro</div>
                    <div className="text-[10px] text-blue-600">Reconnaissance vocale navigateur en direct</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendVoicePreset('Salam Kenza, bghit djellaba sousdi taille M l Casablanca', '0:08')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition-colors flex items-center gap-2 text-slate-800 font-medium text-xs cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">« Salam Kenza, bghit djellaba... »</div>
                    <div className="text-[10px] text-slate-500">Note Darija : Commande standard (0:08)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendVoicePreset('bghit djellaba sousdi bleu taille L واش كاينة؟', '0:06')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition-colors flex items-center gap-2 text-slate-800 font-medium text-xs cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">« Rupture : Djellaba bleu L واش كاينة »</div>
                    <div className="text-[10px] text-slate-500">Note Darija : Cas rupture de stock (0:06)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendVoicePreset('badalt rayi, 3tini taille L فجلابة خضرا', '0:07')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition-colors flex items-center gap-2 text-slate-800 font-medium text-xs cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">« Badalt rayi, 3tini taille L »</div>
                    <div className="text-[10px] text-slate-500">Note Darija : Client change d'avis (0:07)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendVoicePreset('dir lia fiha chi remise, 500 dhs akhoya ?', '0:06')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition-colors flex items-center gap-2 text-slate-800 font-medium text-xs cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">« Dir lia fiha remise, 500 dhs ? »</div>
                    <div className="text-[10px] text-slate-500">Note Darija : Demande de remise (0:06)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendVoicePreset('Quelles sont les adresses de vos boutiques à Casablanca et Fès ?', '0:09')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition-colors flex items-center gap-2 text-slate-800 font-medium text-xs cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">« Adresses des showrooms & horaires »</div>
                    <div className="text-[10px] text-slate-500">Note vocale : Info boutiques (0:09)</div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar with Navy & Sky Blue Accents */}
        <form
          onSubmit={handleSubmit}
          className="bg-white px-4 py-3.5 border-t border-sky-100 flex items-center space-x-2 sm:space-x-3 relative z-10"
        >
          <div className="flex-1 relative">
            <input
              id="chat-message-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrivez en Darija, Français ou Arabe (ex: Salam kenza, bghit djellaba sousdi l Casa)..."
              disabled={isLoading}
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 border border-sky-100 rounded-2xl px-5 py-3.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:bg-white transition-all shadow-inner"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            id="btn-voice-note"
            type="button"
            onClick={() => {
              if (isRecording) {
                stopVoiceRecording();
              } else {
                setShowVoiceMenu(!showVoiceMenu);
              }
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md cursor-pointer ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/25'
                : showVoiceMenu
                ? 'bg-gradient-to-r from-[#0A192F] to-[#0E4957] text-sky-200 shadow-sky-900/20 border border-sky-400/40'
                : 'bg-sky-50 hover:bg-sky-100 text-[#0E4957] border border-sky-200 shadow-xs'
            }`}
            title="Note Vocale (Parler au micro ou choisir un audio)"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-[#0284C7]" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            id="btn-send-message"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-gradient-to-r from-[#0A192F] via-[#0E4957] to-[#0284C7] hover:from-[#071324] hover:to-[#0369A1] disabled:from-slate-200 disabled:to-slate-200 text-white disabled:text-slate-400 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md shadow-sky-900/20 border border-sky-400/30 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </motion.button>
        </form>

        {/* Interactive Gallery & Models Drawer Modal */}
        <AnimatePresence>
          {showCatalogModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
              >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 border border-blue-200">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>Galerie des Modèles Officiels Kenza AI</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono font-bold border border-blue-200">
                          {products.length} Articles Disponibles
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500">
                        Photos conformes aux confections marocaines. Cliquez sur un article pour poser une question à Kenza.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCatalogModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Grid of Products with Photos & Color Variant Selectors */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((prod) => (
                    <CatalogProductCard
                      key={prod.id}
                      product={prod}
                      onSelect={(prompt) => {
                        setShowCatalogModal(false);
                        setInputText(prompt);
                      }}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 flex items-center justify-between px-6">
                  <span>Authenticité marocaine vérifiée • Photos studio réelles</span>
                  <button
                    onClick={() => setShowCatalogModal(false)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Dedicated Store Information Modal */}
        <StoreInfoModal
          isOpen={showStoreInfoModal}
          onClose={() => setShowStoreInfoModal(false)}
          onAskQuestionInChat={(prompt) => {
            setInputText(prompt);
            onSendMessage(prompt);
          }}
        />

        {/* Dedicated Ultra-Legible Message Reader Modal */}
        <MessageReaderModal
          message={selectedMessageForReading}
          onClose={() => setSelectedMessageForReading(null)}
          activeCustomer={activeCustomer}
          products={products}
        />
      </div>
    </div>
  );
};

