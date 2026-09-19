import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, Product, Escalation, FollowUp, ApiUsageRecord } from '../types';
import { ProductImage, getProductImageUrl } from '../utils/productImages';
import {
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  Clock,
  DollarSign,
  ShieldCheck,
  UserCheck,
  CheckCircle,
  XCircle,
  ExternalLink,
  Phone,
  MapPin,
  Cpu,
  Search,
  Zap,
  Sparkles,
  ArrowUpRight,
  PackageCheck,
  ShieldAlert,
  Server,
  Activity,
  Check,
  Copy,
  ZoomIn,
  Eye,
  Tag,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

interface MerchantDashboardProps {
  orders: Order[];
  products: Product[];
  escalations: Escalation[];
  followups: FollowUp[];
  apiUsage: { totalRequests: number; totalTokens: number; avgLatencyMs: number; records: ApiUsageRecord[] };
  onTakeover: (escalationId: string) => void;
  onCancelFollowup: (followupId: string) => void;
  onRefresh: () => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  orders,
  products,
  escalations,
  followups,
  apiUsage,
  onTakeover,
  onCancelFollowup,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'catalogue' | 'escalations' | 'followups' | 'telemetry'>(
    'orders'
  );
  const [orderSearch, setOrderSearch] = useState('');
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [copiedOrder, setCopiedOrder] = useState<string | null>(null);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalMAD, 0);
  const pendingEscalations = escalations.filter((e) => e.status === 'pending');
  const activeFollowups = followups.filter((f) => f.status === 'scheduled');

  const filteredOrders = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.deliveryCity.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrder(text);
    setTimeout(() => setCopiedOrder(null), 1500);
  };

  const tabs = [
    { id: 'orders' as const, label: 'Commandes', count: orders.length, color: 'text-blue-600' },
    { id: 'catalogue' as const, label: 'Catalogue & Plafonds', count: products.length, color: 'text-blue-600' },
    { id: 'escalations' as const, label: 'File d’Escalade', count: escalations.length, color: 'text-slate-600' },
    { id: 'followups' as const, label: 'Relances BullMQ', count: followups.length, color: 'text-blue-600' },
    { id: 'telemetry' as const, label: 'Télémétrie LLM', count: apiUsage.totalRequests, color: 'text-slate-600' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 text-slate-900 min-h-full relative">
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-100">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0A192F] via-[#0E4957] to-[#0284C7] border border-sky-400/30 flex items-center justify-center text-sky-300 font-bold shadow-md shadow-sky-500/15">
                <Activity className="w-5 h-5 text-sky-200" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-extrabold text-[#0A192F] tracking-tight flex items-center gap-2">
                  <span>Tableau de Bord Commerçant</span>
                  <span className="text-[#0284C7] font-arabic text-xl font-normal">متجر كنزة</span>
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 pl-1">
              Supervision en temps réel des ventes autonomes, stocks, paniers abandonnés et escalades humaines
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRefresh}
            className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-sky-50 text-[#0E4957] hover:text-[#0284C7] text-xs font-bold rounded-xl border border-sky-200 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#0284C7]" />
            <span>Actualiser les données</span>
          </motion.button>
        </div>

        {/* Modern KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-xs relative overflow-hidden group hover:border-sky-300 transition-all hover:shadow-md hover:shadow-sky-500/5"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E4957]">Chiffre d'Affaires</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0284C7]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#0A192F] tracking-tight">{totalRevenue} <span className="text-sm font-mono text-[#0284C7]">MAD</span></div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#0E4957] font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Paiement livraison (COD)</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-xs relative overflow-hidden group hover:border-sky-300 transition-all hover:shadow-md hover:shadow-sky-500/5"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E4957]">Commandes Closes</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0284C7]">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#0A192F] tracking-tight">{orders.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#0E4957] font-semibold">
              <PackageCheck className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>100% Validées sans accroc</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-xs relative overflow-hidden group hover:border-sky-300 transition-all hover:shadow-md hover:shadow-sky-500/5"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E4957]">Escalades en Attente</span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0A192F] to-[#0E4957] border border-sky-400/30 flex items-center justify-center text-sky-200">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#0A192F] tracking-tight">{pendingEscalations.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#0E4957] font-semibold">
              <UserCheck className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Prise en main requise</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-xs relative overflow-hidden group hover:border-sky-300 transition-all hover:shadow-md hover:shadow-sky-500/5"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E4957]">Relances BullMQ</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0284C7]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#0A192F] tracking-tight">{activeFollowups.length}</div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#0E4957] font-semibold">
              <Zap className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Jobs programmés</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-xs relative overflow-hidden group col-span-2 lg:col-span-1 hover:border-sky-300 transition-all hover:shadow-md hover:shadow-sky-500/5"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E4957]">Garantie Prix</span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0E4957] to-[#0284C7] border border-sky-400/30 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-[#0A192F] tracking-tight">100% Sûr</div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#0284C7] font-medium">
              <ShieldAlert className="w-3 h-3 text-[#0284C7]" />
              <span>Plafonds stricts respectés</span>
            </div>
          </motion.div>
        </div>

        {/* Sub-tab Navigation with Animated Slider in Navy/Petrol/Sky */}
        <div className="flex space-x-1.5 sm:space-x-2 bg-sky-50/70 p-1.5 rounded-2xl border border-sky-100 overflow-x-auto shadow-inner">
          {tabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap z-10 flex items-center gap-2 cursor-pointer ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-[#0A192F]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="dashboardSubTab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0A192F] via-[#0E4957] to-[#0284C7] shadow-md shadow-sky-900/20 border border-sky-400/30 -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Orders */}
        {activeSubTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-blue-600" />
                  <span>Commandes Enregistrées dans PostgreSQL</span>
                </h2>
                <p className="text-xs text-slate-500">Paiement sécurisé à la livraison (Cash on Delivery)</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrer par Réf, Nom, Ville..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="bg-white text-xs text-slate-900 placeholder-slate-400 rounded-xl pl-8 pr-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56 shadow-xs"
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto opacity-40 text-blue-600" />
                <p>Aucune commande trouvée.</p>
                <p className="text-xs text-slate-400">Lancez le Scénario A dans le simulateur WhatsApp pour générer une vente !</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Réf. Commande</th>
                      <th className="p-3">Client & Téléphone</th>
                      <th className="p-3">Ville & Livraison</th>
                      <th className="p-3">Articles & Variantes</th>
                      <th className="p-3">Total (MAD)</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-blue-600">
                          <button
                            onClick={() => handleCopy(o.orderNumber)}
                            className="flex items-center gap-1 hover:text-blue-700 cursor-pointer"
                            title="Copier la référence"
                          >
                            <span>{o.orderNumber}</span>
                            {copiedOrder === o.orderNumber ? (
                              <Check className="w-3 h-3 text-blue-600" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-40 hover:opacity-100" />
                            )}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{o.customerName}</div>
                          <div className="text-slate-500 flex items-center space-x-1 mt-0.5">
                            <Phone className="w-3 h-3 inline text-slate-400" />
                            <span>{o.customerPhone}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-600" />
                            <span>{o.deliveryCity}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] truncate max-w-xs">{o.deliveryAddress}</div>
                        </td>
                        <td className="p-3">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="text-slate-600">
                              <span className="font-medium text-slate-900">{it.productName}</span> ({it.size || 'Unique'}, {it.color}) x{it.quantity}
                            </div>
                          ))}
                        </td>
                        <td className="p-3 font-bold text-slate-900 font-mono text-sm">{o.totalMAD} MAD</td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            CONFIRMÉE (COD)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 2: Catalogue & Floors with Authentic Photos */}
        {activeSubTab === 'catalogue' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
          >
            {/* Header with Search & Categories */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Catalogue & Modèles Authentiques avec Photos HD
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Chaque modèle est illustré par des visuels haute définition conformes aux confections artisanales marocaines et verrouillé par un prix plancher.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par modèle, tissu, couleur..."
                  value={catalogueSearch}
                  onChange={(e) => setCatalogueSearch(e.target.value)}
                  className="bg-white text-xs text-slate-900 placeholder-slate-400 rounded-xl pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-64 shadow-xs"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'Tous les Articles' },
                { id: 'djellaba', label: 'Djellabas & Gandoras' },
                { id: 'caftan', label: 'Caftans Haute Couture' },
                { id: 'chaussures', label: 'Babouches & Maroquinerie' },
                { id: 'pret-a-porter', label: 'Prêt-à-porter' },
                { id: 'cosmetique', label: 'Cosmétique Bio' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-medium cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            <div className="divide-y divide-slate-100">
              {products
                .filter((p) => {
                  const matchSearch =
                    p.name.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
                    (p.nameAr && p.nameAr.includes(catalogueSearch)) ||
                    p.description.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
                    p.category.toLowerCase().includes(catalogueSearch.toLowerCase());

                  if (!matchSearch) return false;

                  if (selectedCategory === 'all') return true;
                  if (selectedCategory === 'djellaba') return p.category.includes('djellaba') || p.name.toLowerCase().includes('gandora');
                  if (selectedCategory === 'caftan') return p.category.includes('caftan') || p.name.toLowerCase().includes('caftan');
                  if (selectedCategory === 'chaussures') return p.category.includes('chaussures') || p.category.includes('sac') || p.name.toLowerCase().includes('babouche') || p.name.toLowerCase().includes('sac') || p.name.toLowerCase().includes('ceinture');
                  if (selectedCategory === 'pret-a-porter') return p.category.includes('veste') || p.category.includes('robe') || p.category.includes('pantalon') || p.category.includes('blouson') || p.category.includes('foulard');
                  if (selectedCategory === 'cosmetique') return p.category.includes('cosmetique') || p.name.toLowerCase().includes('argan');

                  return true;
                })
                .map((p) => (
                  <div
                    key={p.id}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row justify-between gap-5 hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Left: Image Thumbnail + Details */}
                    <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                      {/* Product Photo Thumbnail with Zoom Trigger */}
                      <div
                        onClick={() => {
                          setPreviewProduct(p);
                          setSelectedVariantId(p.variants[0]?.id || null);
                        }}
                        className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 border border-slate-200 group-hover:border-blue-300 shadow-xs cursor-pointer bg-slate-100 transition-all duration-300"
                        title="Cliquer pour agrandir la photo HD"
                      >
                        <ProductImage
                          src={p.imageUrl}
                          alt={p.name}
                          fallbackCategory={p.category}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="p-1.5 rounded-full bg-white text-blue-600 shadow-md">
                            <ZoomIn className="w-4 h-4" />
                          </span>
                        </div>
                        {/* Stock Badge Overlay */}
                        <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded-lg bg-white/90 backdrop-blur-xs text-[9px] text-center font-mono font-bold text-slate-800 shadow-xs">
                          {p.totalStock > 0 ? `${p.totalStock} en stock` : 'Rupture'}
                        </div>
                      </div>

                      {/* Product Content */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            onClick={() => {
                              setPreviewProduct(p);
                              setSelectedVariantId(p.variants[0]?.id || null);
                            }}
                            className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            {p.name}
                          </h3>
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full uppercase font-semibold border border-blue-200">
                            {p.category}
                          </span>
                          {p.nameAr && (
                            <span className="text-xs text-slate-500 font-serif" dir="rtl">
                              {p.nameAr}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{p.description}</p>

                        {/* Variants Chips with Color Swatches */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {p.variants.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                setPreviewProduct(p);
                                setSelectedVariantId(v.id);
                              }}
                              className={`text-[10px] px-2.5 py-1 rounded-xl border font-mono flex items-center gap-1.5 cursor-pointer hover:border-blue-400 transition-colors ${
                                v.stockQuantity > 0
                                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                              }`}
                              title={`Voir la photo variante ${v.color}`}
                            >
                              {v.colorHex && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                  style={{ backgroundColor: v.colorHex }}
                                />
                              )}
                              <span>{v.size} • {v.color} ({v.stockQuantity > 0 ? `${v.stockQuantity}` : 'ÉPUISÉ'})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Pricing & Guardrail Floor Details */}
                    <div className="flex sm:items-center space-x-4 self-end lg:self-auto shrink-0 pt-2 lg:pt-0">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Prix Catalogue</div>
                        <div className="text-xl font-bold text-slate-900 font-mono">{p.basePriceMAD} MAD</div>
                      </div>

                      <div className="text-right p-3 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs">
                        <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center justify-end gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          <span>Prix Plancher Strict</span>
                        </div>
                        <div className="text-xl font-bold text-blue-700 font-mono tracking-tight">
                          {p.minPriceFloorMAD} MAD
                        </div>
                        <div className="text-[10px] text-blue-600/80">
                          Remise max: {p.maxDiscountPercent}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Lightbox Modal for Full Photo & Details with Color Variant Switching */}
            <AnimatePresence>
              {previewProduct && (() => {
                const activeVariant =
                  previewProduct.variants.find((v) => v.id === selectedVariantId) ||
                  previewProduct.variants[0];
                const activePhoto = activeVariant?.imageUrl || previewProduct.imageUrl;

                return (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col"
                    >
                      {/* Close Button */}
                      <button
                        onClick={() => setPreviewProduct(null)}
                        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 cursor-pointer transition-colors shadow-xs"
                      >
                        ✕
                      </button>

                      {/* High-Res Photo Banner with exact variant photo */}
                      <div className="relative w-full h-72 sm:h-80 bg-slate-100 shrink-0">
                        <ProductImage
                          src={activePhoto}
                          alt={previewProduct.name}
                          color={activeVariant?.color}
                          colorHex={activeVariant?.colorHex}
                          fallbackCategory={previewProduct.category}
                          enableZoom={true}
                          showColorBadge={true}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between pointer-events-none">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-xs">
                                {previewProduct.category}
                              </span>
                              {activeVariant?.color && (
                                <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                                  {activeVariant.colorHex && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                                      style={{ backgroundColor: activeVariant.colorHex }}
                                    />
                                  )}
                                  <span>{activeVariant.color}</span>
                                </span>
                              )}
                            </div>
                            <h2 className="text-2xl font-bold text-white mt-1.5 drop-shadow-md">
                              {previewProduct.name}
                            </h2>
                            {previewProduct.nameAr && (
                              <p className="text-slate-200 text-sm font-serif" dir="rtl">
                                {previewProduct.nameAr}
                              </p>
                            )}
                          </div>
                          <div className="text-right bg-white/90 backdrop-blur-xs px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
                            <div className="text-xs text-slate-500">Prix Public</div>
                            <div className="text-2xl font-bold text-slate-900 font-mono">
                              {previewProduct.basePriceMAD} MAD
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description and Variants (Scrollable) */}
                      <div className="p-6 space-y-4 overflow-y-auto">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {previewProduct.description}
                        </p>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-blue-600" />
                              <span>Variantes & Photos (cliquez pour afficher la photo exacte)</span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {previewProduct.variants.length} coloris / tailles
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {previewProduct.variants.map((v) => {
                              const isSelected = activeVariant?.id === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => setSelectedVariantId(v.id)}
                                  className={`p-2.5 rounded-xl border text-left text-xs font-mono flex flex-col justify-between transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-400/30 text-blue-900 shadow-xs'
                                      : v.stockQuantity > 0
                                      ? 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-800'
                                      : 'bg-slate-100 border-slate-200 text-slate-400'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-1.5 font-bold">
                                      {v.colorHex && (
                                        <span
                                          className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                          style={{ backgroundColor: v.colorHex }}
                                        />
                                      )}
                                      <span className="truncate">{v.color}</span>
                                    </div>
                                    {isSelected && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-600 text-white font-bold shrink-0">
                                        Vue
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-500 text-[11px] mt-1">Taille: {v.size}</div>
                                  <div className="mt-1 font-semibold text-[11px]">
                                    {v.stockQuantity > 0 ? (
                                      <span className="text-blue-600">✓ {v.stockQuantity} en stock</span>
                                    ) : (
                                      <span className="text-slate-400">✗ Rupture</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                          <span>Plafond plancher absolu: <strong className="text-blue-700">{previewProduct.minPriceFloorMAD} MAD</strong></span>
                          <button
                            onClick={() => setPreviewProduct(null)}
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer transition-colors shadow-xs"
                          >
                            Fermer la vue
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })()}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Tab 3: Escalations */}
        {activeSubTab === 'escalations' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-700" />
                <span>File d'Escalade et Prise en Main Marchand</span>
              </h2>
              <p className="text-xs text-slate-500">
                Demandes hors périmètre autonome de Kenza (factures d'entreprise SARL, contestations, demandes explicites d'humain).
              </p>
            </div>
            {escalations.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm space-y-2">
                <CheckCircle className="w-8 h-8 mx-auto opacity-40 text-blue-600" />
                <p>Aucune escalade en cours.</p>
                <p className="text-xs text-slate-400">Testez le Scénario G (Facture SARL) dans le simulateur pour déclencher une escalade !</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {escalations.map((esc) => (
                  <div key={esc.id} className="p-4 sm:p-5 space-y-2 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-base">{esc.customerName}</span>
                        <span className="text-xs text-slate-500">({esc.customerPhone})</span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                            esc.status === 'pending'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {esc.status === 'pending' ? 'EN ATTENTE' : 'PRIS EN MAIN'}
                        </span>
                      </div>
                      {esc.status === 'pending' && (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onTakeover(esc.id)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Prendre en main</span>
                        </motion.button>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">{esc.reasonDescription}</p>
                    <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-200 italic">
                      "{esc.conversationSnippet}"
                    </div>
                    <div className="text-[11px] text-slate-500">{esc.customerContext}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 4: BullMQ Follow-ups */}
        {activeSubTab === 'followups' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Gestionnaire de Relances de Paniers Abandonnés (Moteur BullMQ)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Relances automatisées programmées en arrière-plan et persistées dans la base de données.
              </p>
            </div>
            {followups.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm space-y-2">
                <Clock className="w-8 h-8 mx-auto opacity-40 text-blue-600" />
                <p>Aucune relance programmée.</p>
                <p className="text-xs text-slate-400">Testez le Scénario F (Abandon de panier) dans le simulateur !</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {followups.map((f) => (
                  <div key={f.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/70 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-700">ID: {f.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            f.status === 'scheduled'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : f.status === 'executed'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {f.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Prévu à: <span className="font-medium text-slate-900">{new Date(f.scheduledAt).toLocaleTimeString()}</span>
                      </div>
                      {f.messageGenerated && (
                        <div className="text-xs text-slate-600 italic max-w-md bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          "{f.messageGenerated}"
                        </div>
                      )}
                    </div>
                    {f.status === 'scheduled' && (
                      <button
                        onClick={() => onCancelFollowup(f.id)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Annuler la relance
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 5: Telemetry */}
        {activeSubTab === 'telemetry' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>Télémétrie des Appels LLM & Performances</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Suivi de la latence, des tokens consommés et de l'état des points de terminaison
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Latence moyenne</div>
                <div className="text-sm font-bold text-blue-700 font-mono">{apiUsage.avgLatencyMs} ms</div>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Appels LLM enregistrés</div>
                  <div className="text-2xl font-bold text-slate-900 font-mono mt-1">{apiUsage.totalRequests}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Tokens totaux consommés</div>
                  <div className="text-2xl font-bold text-blue-700 font-mono mt-1">{apiUsage.totalTokens}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Moteur Actif</div>
                  <div className="text-xs font-bold text-slate-900 mt-2 font-mono">GPT-5.5 / GPT-4.1 Azure</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Modèle</th>
                      <th className="p-3">Point de terminaison</th>
                      <th className="p-3">Tokens (Prompt / Comp)</th>
                      <th className="p-3">Latence</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {apiUsage.records.slice(-10).reverse().map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 text-slate-500">{new Date(rec.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 text-slate-900 font-semibold">{rec.model}</td>
                        <td className="p-3 text-slate-600">{rec.endpoint}</td>
                        <td className="p-3 text-slate-700">{rec.promptTokens} / {rec.completionTokens}</td>
                        <td className="p-3 text-blue-600 font-medium">{rec.latencyMs} ms</td>
                        <td className="p-3">
                          {rec.success ? (
                            <span className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">OK</span>
                          ) : (
                            <span className="text-slate-700 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">ERREUR</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

