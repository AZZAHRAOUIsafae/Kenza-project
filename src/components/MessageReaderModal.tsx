import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, Customer, Product } from '../types';
import { ProductImage } from '../utils/productImages';
import {
  X,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  Sparkles,
  User,
  Mic,
  Play,
  Pause,
  Clock,
  ShieldCheck,
  Volume2,
  Maximize2,
  ChevronRight,
} from 'lucide-react';

interface MessageReaderModalProps {
  message: Message | null;
  onClose: () => void;
  activeCustomer?: Customer | null;
  products?: Product[];
}

export const MessageReaderModal: React.FC<MessageReaderModalProps> = ({
  message,
  onClose,
  activeCustomer,
  products = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'large' | 'xl' | 'xxl'>('xl');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!message) return null;

  const isUser = message.sender === 'user';
  const isHuman = message.sender === 'human_agent';
  const isOrderMessage = message.content.includes('KZ-') || message.content.includes('confirmée');
  const isVoiceNote = message.content.includes('Note vocale');

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find matched product if referenced
  const matchedProduct = !isUser && products.length > 0 ? products.find((p) => {
    const c = message.content.toLowerCase();
    return (
      c.includes(p.name.toLowerCase()) ||
      (p.modele && c.includes(p.modele.toLowerCase())) ||
      (c.includes('djellaba') && p.category.includes('djellaba')) ||
      (c.includes('caftan') && p.category.includes('caftan'))
    );
  }) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-sky-200 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#071324] via-[#0E4957] to-[#0369A1] text-white p-4 sm:p-5 flex items-center justify-between border-b border-sky-400/20">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md border ${
                isUser
                  ? 'bg-gradient-to-br from-sky-500 to-sky-700 text-white border-sky-300/40'
                  : isHuman
                  ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white border-amber-300/40'
                  : 'bg-gradient-to-br from-[#0A192F] to-[#0E4957] text-sky-200 border-sky-400/40'
              }`}>
                {isUser ? <User className="w-5 h-5" /> : isHuman ? '👤' : <Sparkles className="w-5 h-5 text-sky-300" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                    {isUser
                      ? `Message Envoyé par ${activeCustomer?.name || 'le Client'}`
                      : isHuman
                      ? 'Message du Gérant (Prise en Main Humaine)'
                      : 'Message Reçu de Kenza (IA Commerciale)'}
                  </h3>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase ${
                    isUser
                      ? 'bg-sky-400 text-slate-950'
                      : isHuman
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-emerald-400 text-slate-950'
                  }`}>
                    {isUser ? 'Client' : isHuman ? 'Gérant Humain' : 'IA Kenza'}
                  </span>
                </div>
                <p className="text-xs text-sky-200/80 mt-0.5 flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 inline" />
                  <span>
                    Envoyé à {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Lecture Confortable HD
                  </span>
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {/* Font Size Pills */}
              <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-sky-300/30 text-xs font-bold text-sky-100">
                <button
                  type="button"
                  onClick={() => setZoomLevel('large')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    zoomLevel === 'large' ? 'bg-sky-400 text-slate-950 font-black' : 'hover:bg-white/10'
                  }`}
                  title="Texte Grand (18px)"
                >
                  Grand
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel('xl')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    zoomLevel === 'xl' ? 'bg-sky-400 text-slate-950 font-black' : 'hover:bg-white/10'
                  }`}
                  title="Texte Très Grand (22px)"
                >
                  Très Grand
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel('xxl')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    zoomLevel === 'xxl' ? 'bg-sky-400 text-slate-950 font-black' : 'hover:bg-white/10'
                  }`}
                  title="Texte Géant (26px)"
                >
                  Géant
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-sky-100 border border-sky-300/30 transition-all cursor-pointer"
                title="Copier le texte"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-red-500 hover:text-white text-sky-100 border border-sky-300/30 transition-all cursor-pointer"
                title="Fermer la vue de lecture (Échap)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#F8FAFC]">
            {/* Audio Voice Player if voice note */}
            {isVoiceNote && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-200 shadow-sm flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#0E4957] to-[#0284C7] text-white flex items-center justify-center shadow-lg shadow-sky-500/20 cursor-pointer hover:scale-105 transition-transform"
                >
                  {isPlayingAudio ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-0.5 fill-current" />}
                </button>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-emerald-500" />
                      <span>Note Vocale WhatsApp (0:08)</span>
                    </span>
                    <span className="font-mono text-xs text-sky-700 font-bold">{isPlayingAudio ? 'Lecture en cours...' : 'Prêt'}</span>
                  </div>
                  <div className="flex items-center space-x-1 h-8">
                    {[40, 70, 50, 95, 60, 85, 45, 100, 75, 55, 80, 60, 40, 75, 50, 35, 60, 85, 45, 90, 70, 50, 80].map((h, i) => (
                      <span
                        key={i}
                        className={`flex-1 rounded-full transition-all ${
                          isPlayingAudio ? 'bg-[#0284C7] animate-pulse' : 'bg-slate-300'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Main Ultra-Legible Message Text */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-sm">
              <p
                className={`font-sans text-slate-900 whitespace-pre-wrap leading-relaxed select-text ${
                  zoomLevel === 'xxl'
                    ? 'text-2xl sm:text-3xl font-medium'
                    : zoomLevel === 'xl'
                    ? 'text-xl sm:text-2xl font-normal'
                    : 'text-lg sm:text-xl font-normal'
                }`}
              >
                {message.content}
              </p>
            </div>

            {/* Matched Product Details Card in large view */}
            {matchedProduct && (
              <div className="bg-white rounded-3xl p-5 border border-sky-200 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 border border-sky-200 bg-slate-50 shadow-xs">
                  <ProductImage
                    src={matchedProduct.imageUrl}
                    alt={matchedProduct.name}
                    fallbackCategory={matchedProduct.category}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1.5 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
                    <h4 className="text-lg font-bold text-slate-900">{matchedProduct.name}</h4>
                    <span className="text-base font-black font-mono px-3 py-1 rounded-xl bg-sky-50 text-[#0E4957] border border-sky-200">
                      {matchedProduct.basePriceMAD} MAD
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{matchedProduct.description}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                    <span className="font-semibold text-slate-500">Tailles :</span>
                    {matchedProduct.sizes.map((s) => (
                      <span key={s} className="px-2.5 py-0.5 rounded-lg bg-slate-100 font-mono font-bold text-slate-700">
                        {s}
                      </span>
                    ))}
                    <span className="font-semibold text-slate-500 ml-2">Stock total :</span>
                    <span className="text-emerald-700 font-bold">{matchedProduct.totalStock} exemplaires</span>
                  </div>
                </div>
              </div>
            )}

            {/* Order Confirmation Banner if confirmed */}
            {isOrderMessage && (
              <div className="bg-emerald-50 border-2 border-emerald-500/50 rounded-3xl p-5 text-emerald-950 shadow-sm space-y-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                    ✓
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-emerald-950">
                    Commande Enregistrée & Validée dans le Système
                  </h4>
                </div>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  Paiement sécurisé à la livraison (Cash on Delivery). L'expédition express partout au Maroc est initiée sous 24h à 48h.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-white p-4 sm:p-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#0284C7]" />
              <span>Vous pouvez copier ou fermer cette lecture à tout moment.</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Texte Copié !' : 'Copier le Message'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0E4957] to-[#0284C7] hover:from-[#071324] hover:to-[#0369A1] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
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
