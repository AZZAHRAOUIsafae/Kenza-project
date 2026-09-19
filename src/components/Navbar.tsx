import React from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  LayoutDashboard,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Cpu,
  Zap,
  Activity,
  Award,
  Store,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'chat' | 'dashboard' | 'scenarios';
  setActiveTab: (tab: 'chat' | 'dashboard' | 'scenarios') => void;
  onReset: () => void;
  isResetting: boolean;
  onOpenStoreInfo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onReset,
  isResetting,
  onOpenStoreInfo,
}) => {
  const tabs = [
    {
      id: 'chat' as const,
      label: 'Simulateur WhatsApp',
      icon: MessageSquare,
      badge: 'Live Darija',
      badgeColor: 'bg-sky-100 text-[#0E4957] border-sky-200',
    },
    {
      id: 'dashboard' as const,
      label: 'Tableau Commerçant',
      icon: LayoutDashboard,
      badge: 'Admin Hub',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    },
    {
      id: 'scenarios' as const,
      label: 'Matrice de Tests (A-H)',
      icon: Sparkles,
      badge: '8 Scénarios',
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-sky-100 shadow-xs transition-all">
      {/* Top Navy + Petrol + Sky Blue + White Accent Line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#0A192F] via-[#0E4957] via-[#0284C7] via-[#38BDF8] to-white animate-gradient-shift"></div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo & Title */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('chat')}
          >
            <div className="relative">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0A192F] via-[#0E4957] to-[#0284C7] flex items-center justify-center text-white font-arabic font-bold text-2xl shadow-lg shadow-sky-500/20 border border-sky-300/30 transform group-hover:scale-105 transition-transform duration-300">
                <span className="drop-shadow-sm text-sky-100">ك</span>
              </div>

              {/* Pulsing online status indicator with sky blue glow */}
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#0284C7] border-2 border-white shadow-xs"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-black text-xl tracking-tight text-[#0A192F] flex items-center gap-1.5">
                  KENZA <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0E4957] via-[#0284C7] to-[#38BDF8] font-black">AI</span>
                </span>
                <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-[#0E4957] border border-sky-200 shadow-xs">
                  PRO 🇲🇦
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-2">
                <span className="text-[#0E4957] font-semibold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#0284C7] animate-pulse" />
                  LangGraph Core
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-medium">Darija • French • Arabic</span>
              </div>
            </div>
          </motion.div>

          {/* Navigation Modes with Animated layoutId Pill in Navy/Petrol/Sky */}
          <nav className="flex items-center bg-sky-50/70 p-1.5 rounded-2xl border border-sky-100 relative shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`nav-${tab.id}-btn`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 z-10 cursor-pointer ${
                    isActive ? 'text-white' : 'text-slate-600 hover:text-[#0A192F] hover:bg-white/80'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0A192F] via-[#0E4957] to-[#0284C7] shadow-md shadow-sky-900/25 border border-sky-400/40 -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-200' : 'text-[#0E4957]'}`} />
                  <span className="hidden md:inline tracking-tight">{tab.label}</span>
                  <span className="md:hidden">
                    {tab.id === 'chat' ? 'Chat' : tab.id === 'dashboard' ? 'Admin' : 'Tests'}
                  </span>
                  {isActive && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md border font-mono uppercase hidden lg:inline bg-white/20 text-white border-white/30 backdrop-blur-xs">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Tech Status Telemetry & Reset Actions */}
          <div className="flex items-center space-x-2.5">
            <div className="hidden xl:flex items-center space-x-2 text-xs">
              <span className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-sky-100 text-slate-700 shadow-xs">
                <Cpu className="w-3.5 h-3.5 text-[#0284C7]" />
                <span className="font-mono text-[11px] font-semibold text-[#0E4957]">Fast LLM</span>
              </span>
              <span className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-[#0E4957] shadow-xs">
                <Zap className="w-3.5 h-3.5 text-[#0284C7]" />
                <span className="font-mono text-[11px] font-semibold">Guardrail 650 DH</span>
              </span>
              <span className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0A192F] to-[#0E4957] border border-sky-500/30 text-white font-semibold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
                <span className="text-[11px] tracking-wide">100% Anti-Hallucination</span>
              </span>
            </div>

            {onOpenStoreInfo && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                id="btn-navbar-store-info"
                onClick={onOpenStoreInfo}
                title="Consulter les informations complètes du magasin Kenza"
                className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-50 to-white hover:from-sky-100 hover:to-sky-50 text-[#0E4957] text-xs px-3.5 py-2 rounded-xl border border-sky-200 hover:border-sky-400 transition-all shadow-xs cursor-pointer font-bold"
              >
                <Store className="w-3.5 h-3.5 text-[#0284C7]" />
                <span className="hidden sm:inline font-bold">Infos Magasin</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              id="btn-reseed-data"
              onClick={onReset}
              disabled={isResetting}
              title="Réinitialiser l'état initial des bases et commandes"
              className="flex items-center space-x-1.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0284C7] text-xs px-3.5 py-2 rounded-xl border border-sky-100 hover:border-sky-300 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0284C7] ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-semibold">Re-seed</span>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};


