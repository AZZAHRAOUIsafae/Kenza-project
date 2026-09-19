import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Escalation } from '../types';
import { UserCheck, X, Send, Bot, Shield, AlertTriangle } from 'lucide-react';

interface HumanTakeoverModalProps {
  escalation: Escalation | null;
  onClose: () => void;
  onSendMerchantReply: (escalationId: string, conversationId: string, replyText: string) => Promise<void>;
}

export const HumanTakeoverModal: React.FC<HumanTakeoverModalProps> = ({
  escalation,
  onClose,
  onSendMerchantReply,
}) => {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!escalation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onSendMerchantReply(escalation.id, escalation.conversationId, replyText);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs font-bold">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Prise en Main Marchand (Human Takeover)</h2>
                <p className="text-xs text-slate-500">
                  Client: <span className="text-blue-700 font-semibold">{escalation.customerName}</span> ({escalation.customerPhone})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Reason card */}
          <div className="bg-slate-50 border border-blue-200/80 rounded-xl p-3.5 text-xs space-y-1.5 shadow-xs">
            <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <span>Motif d'escalade: {escalation.reason}</span>
            </div>
            <p className="text-slate-700 font-medium leading-relaxed">{escalation.reasonDescription}</p>
            <div className="pt-1.5 text-slate-500 italic border-t border-slate-200">
              Dernier message du client: "{escalation.conversationSnippet}"
            </div>
          </div>

          {/* Reply form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Votre réponse personnalisée en direct sur WhatsApp:
              </label>
              <textarea
                id="merchant-reply-input"
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Exemple: Bonjour M. Alami, ici le gérant. J'ai bien noté votre demande de facture SARL avec RC/IF. Je vous l'envoie sur votre WhatsApp dans quelques instants."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 leading-relaxed font-sans shadow-xs"
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={!replyText.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Envoi...' : 'Envoyer directement sur WhatsApp'}</span>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

