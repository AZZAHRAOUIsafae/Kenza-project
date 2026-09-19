import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExecutionTraceStep } from '../types';
import {
  Activity,
  Shield,
  Bot,
  Database,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Sparkles,
  Zap,
  Check,
  Copy,
} from 'lucide-react';

interface TraceInspectorProps {
  trace: ExecutionTraceStep[];
  isOpen: boolean;
  onToggle: () => void;
}

export const TraceInspector: React.FC<TraceInspectorProps> = ({ trace, isOpen, onToggle }) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => ({ ...prev, [stepNumber]: !prev[stepNumber] }));
  };

  const copyStepData = (stepNumber: number, data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedStep(stepNumber);
    setTimeout(() => setCopiedStep(null), 1500);
  };

  const getComponentBadge = (comp: ExecutionTraceStep['component']) => {
    switch (comp) {
      case 'conversation_agent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Bot className="w-3 h-3 mr-1" /> Agent NLU
          </span>
        );
      case 'catalogue_agent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Database className="w-3 h-3 mr-1" /> SQL & Stock
          </span>
        );
      case 'guardrail':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <Shield className="w-3 h-3 mr-1" /> Guardrail Prix
          </span>
        );
      case 'escalation':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Escalade
          </span>
        );
      case 'relance':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Zap className="w-3 h-3 mr-1" /> Queue BullMQ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <ArrowRight className="w-3 h-3 mr-1" /> Orchestrateur
          </span>
        );
    }
  };

  return (
    <div
      className={`border-l border-slate-200 bg-white transition-all duration-300 flex flex-col z-20 shadow-lg ${
        isOpen ? 'w-full lg:w-96' : 'w-0 lg:w-12 overflow-hidden'
      }`}
    >
      {/* Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shadow-xs">
        <button
          onClick={onToggle}
          className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 font-semibold text-xs tracking-wider uppercase cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </div>
          {isOpen && (
            <span className="font-display font-bold text-slate-800">
              Trace LangGraph <span className="text-blue-600">({trace.length})</span>
            </span>
          )}
        </button>
        {isOpen && (
          <button
            onClick={onToggle}
            className="text-slate-500 hover:text-slate-800 text-xs px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
          >
            Fermer
          </button>
        )}
      </div>

      {/* Trace Timeline */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs bg-slate-50/50">
          {trace.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-blue-500 shadow-xs">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <p className="font-medium text-slate-600">En attente d'interaction...</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Chaque agent du graphe (Conversation, Stock, Guardrail, BullMQ) s'affichera ici en direct.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {trace.map((step, idx) => {
                const isExpanded = expandedSteps[step.stepNumber];
                return (
                  <motion.div
                    key={step.stepNumber}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden hover:border-blue-300 transition-colors"
                  >
                    <div
                      onClick={() => toggleStep(step.stepNumber)}
                      className="p-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">
                            #{step.stepNumber}
                          </span>
                          {getComponentBadge(step.component)}
                        </div>
                        <p className="font-medium text-slate-800 text-xs leading-snug break-words">
                          {step.action}
                        </p>
                        {step.toolName && (
                          <div className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 inline-flex items-center gap-1">
                            <Code2 className="w-3 h-3" />
                            <span>{step.toolName}()</span>
                          </div>
                        )}
                      </div>
                      <div className="text-slate-400 p-1">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-200 bg-slate-50 p-3 text-[11px] font-mono space-y-2 text-slate-700"
                      >
                        {step.decision && (
                          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                            <span className="font-bold block text-[10px] text-blue-700 uppercase tracking-wider mb-0.5">
                              Décision politique:
                            </span>
                            {step.decision}
                          </div>
                        )}
                        {step.details && (
                          <div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-sans font-semibold mb-1">
                              <span>Détails de l'État</span>
                              <button
                                onClick={() => copyStepData(step.stepNumber, step.details)}
                                className="text-slate-400 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedStep === step.stepNumber ? (
                                  <Check className="w-3 h-3 text-blue-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <pre className="p-2 rounded-xl bg-white border border-slate-200 overflow-x-auto text-[10px] text-slate-700 leading-relaxed font-mono">
                              {JSON.stringify(step.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        {step.toolInput != null && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block mb-1">
                              Entrée Outil:
                            </span>
                            <pre className="p-2 rounded-xl bg-white border border-slate-200 overflow-x-auto text-[10px] text-blue-700 leading-relaxed font-mono">
                              {JSON.stringify(step.toolInput, null, 2)}
                            </pre>
                          </div>
                        )}
                        {step.toolOutput != null && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block mb-1">
                              Sortie / Résultat:
                            </span>
                            <pre className="p-2 rounded-xl bg-white border border-slate-200 overflow-x-auto text-[10px] text-slate-800 leading-relaxed font-mono">
                              {JSON.stringify(step.toolOutput, null, 2)}
                            </pre>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
};

