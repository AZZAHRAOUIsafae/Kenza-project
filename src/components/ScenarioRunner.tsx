import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Play,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Send,
  Bot,
  Zap,
  Check,
  Copy,
  Layers,
  Award,
} from 'lucide-react';

interface ScenarioResult {
  scenario: string;
  promptSent: string;
  result: any;
  status: 'passed' | 'failed' | 'running';
  error?: string;
}

export const ScenarioRunner: React.FC = () => {
  const [results, setResults] = useState<Record<string, ScenarioResult>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const scenariosList = [
    {
      key: 'A',
      title: 'Scénario A: Vente Normale & Création Commande (COD)',
      prompt: 'Salam, bghit djellaba sousdi taille M l Casablanca, je confirme la commande',
      expectedBehavior:
        'Recherche produit, vérification du stock, calcul livraison Casablanca (gratuit >500 MAD), création de commande avec numéro KZ-XXXX et confirmation.',
      tag: 'Vente COD',
      color: 'border-blue-200',
    },
    {
      key: 'B',
      title: 'Scénario B: Rupture de Stock & Alternative Disponible',
      prompt: 'bghit djellaba sousdi bleu taille L واش كاينة؟',
      expectedBehavior:
        'Détection du stock nul (0) pour taille L en bleu, AUCUNE hallucination de date de réapprovisionnement, proposition proactive du modèle en Vert Émeraude.',
      tag: 'Anti-Hallucination',
      color: 'border-blue-200',
    },
    {
      key: 'C',
      title: 'Scénario C: Changement de Taille / Décision Client',
      prompt: 'badalt rayi, 3tini taille L فجلابة سوسدي خضرا بلاصت M',
      expectedBehavior:
        'Mise à jour directe de la variante dans le panier actif sans recréer la conversation, recalcul automatique du total.',
      tag: 'Session & Panier',
      color: 'border-blue-200',
    },
    {
      key: 'D',
      title: 'Scénario D: Négociation Agressive & Plancher de Prix (Floor)',
      prompt: 'dir lia fiha remise, 500 dhs akhoya ? (minimum légal est 650)',
      expectedBehavior:
        'Blocage strict de la tentative par le Guardrail Engine. Prix borné à 650 MAD minimum garanti. Refus poli avec mise en avant de la confection artisanale.',
      tag: 'Guardrail Prix',
      color: 'border-slate-300',
    },
    {
      key: 'E',
      title: 'Scénario E: Mémoire & Client Fidèle (Returning Customer)',
      prompt: 'Salam kenza, ana rje3t',
      expectedBehavior:
        'Chargement de l’historique de Yassine El Fassi (2 commandes passées), salutation personnalisée chaleureuse par son prénom.',
      tag: 'Mémoire CRM',
      color: 'border-blue-200',
    },
    {
      key: 'F',
      title: 'Scénario F: Panier Abandonné & Relance Automatisée (BullMQ)',
      prompt: 'عجباتني الجلابة، غنفكر ونرجع عندك من بعد إن شاء الله',
      expectedBehavior:
        'Détection de l’hésitation, conservation du panier actif, planification automatique d’un job de relance dans la file d’attente BullMQ.',
      tag: 'BullMQ Queue',
      color: 'border-slate-300',
    },
    {
      key: 'G',
      title: 'Scénario G: Escalade Humaine (Facture Société SARL)',
      prompt: 'Je veux une facture au nom de ma société SARL avec RC et IF pour la comptabilité',
      expectedBehavior:
        'Détection de demande administrative hors périmètre autonome, création du ticket d’escalade et notification du gérant humain.',
      tag: 'Escalade Humaine',
      color: 'border-blue-200',
    },
    {
      key: 'H',
      title: 'Scénario H: Darija en Lettres Latines avec Fautes d’Orthographe',
      prompt: 'ch7al taman dyal had caftan w wash katsifto l rabat?',
      expectedBehavior:
        'Compréhension NLP de la Darija translittérée (Arabizi/3arbizi), extraction du Caftan et calcul des frais de livraison vers Rabat.',
      tag: 'NLP Arabizi',
      color: 'border-blue-200',
    },
    {
      key: 'I',
      title: 'Scénario I: Informations Magasin & Horaires Showrooms',
      prompt: 'Quelles sont les adresses de vos boutiques, vos horaires et votre numéro de téléphone ?',
      expectedBehavior:
        'Réponse précise et chaleureuse contenant les adresses des showrooms (Casablanca Maârif & Fès Médina), horaires 10h-20h, téléphones et conditions COD.',
      tag: 'Infos Magasin',
      color: 'border-blue-200',
    },
  ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(key);
    setTimeout(() => setCopiedPrompt(null), 1500);
  };

  const runScenario = async (scenarioKey: string) => {
    setResults((prev) => ({
      ...prev,
      [scenarioKey]: {
        scenario: scenarioKey,
        promptSent: scenariosList.find((s) => s.key === scenarioKey)!.prompt,
        result: null,
        status: 'running',
      },
    }));

    try {
      const res = await fetch('/api/demo/run-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioKey }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setResults((prev) => ({
        ...prev,
        [scenarioKey]: {
          scenario: scenarioKey,
          promptSent: data.promptSent,
          result: data.result,
          status: 'passed',
        },
      }));
    } catch (err: unknown) {
      setResults((prev) => ({
        ...prev,
        [scenarioKey]: {
          scenario: scenarioKey,
          promptSent: scenariosList.find((s) => s.key === scenarioKey)!.prompt,
          result: null,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        },
      }));
    }
  };

  const runAllScenarios = async () => {
    setIsRunningAll(true);
    for (const sc of scenariosList) {
      await runScenario(sc.key);
    }
    setIsRunningAll(false);
  };

  const passedCount = Object.values(results).filter((r) => r.status === 'passed').length;
  const progressPercent = Math.round((passedCount / scenariosList.length) * 100);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 text-slate-900 min-h-full">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shadow-xs">
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight">
                Matrice d'Évaluation des Scénarios de Test
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Vérification 1-clic des 8 scénarios obligatoires (A à H) avec inspection des décisions et du Guardrail
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={runAllScenarios}
            disabled={isRunningAll}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 flex items-center space-x-2 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Play className={`w-4 h-4 ${isRunningAll ? 'animate-pulse' : ''}`} />
            <span>{isRunningAll ? 'Exécution des 8 scénarios...' : 'Lancer tous les scénarios (1-Clic)'}</span>
          </motion.button>
        </div>

        {/* Progress Bar & Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-display font-bold text-base">
              {passedCount}/8
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Scénarios d'Évaluation Validés</div>
              <div className="text-xs text-slate-500">Couverture complète des critères d'évaluation</div>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Progression</span>
              <span className="text-blue-600 font-bold">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-blue-600 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Scenarios List */}
        <div className="space-y-3.5">
          {scenariosList.map((sc, idx) => {
            const res = results[sc.key];
            const isExpanded = activeScenario === sc.key;

            return (
              <motion.div
                key={sc.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`bg-white rounded-2xl border ${
                  res?.status === 'passed'
                    ? 'border-blue-300 shadow-xs'
                    : res?.status === 'failed'
                    ? 'border-rose-300'
                    : 'border-slate-200'
                } shadow-xs overflow-hidden transition-all`}
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-display font-bold text-xs flex items-center justify-center border border-blue-200">
                        {sc.key}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight">{sc.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                        {sc.tag}
                      </span>
                      {res?.status === 'passed' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> VALIDÉ
                        </span>
                      )}
                      {res?.status === 'failed' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 mr-1" /> ÉCHEC
                        </span>
                      )}
                      {res?.status === 'running' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 animate-pulse">
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> EN COURS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{sc.expectedBehavior}</p>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => runScenario(sc.key)}
                      disabled={res?.status === 'running' || isRunningAll}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 text-blue-600" />
                      <span>Tester</span>
                    </motion.button>
                    {res && (
                      <button
                        onClick={() => setActiveScenario(isExpanded ? null : sc.key)}
                        className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                      >
                        {isExpanded ? 'Masquer' : 'Détails'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Prompt display */}
                <div className="px-4 py-2.5 bg-slate-50 text-xs flex items-center justify-between gap-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="font-semibold text-slate-500 shrink-0">Prompt envoyé:</span>
                    <span className="font-mono text-blue-700 truncate">
                      "{sc.prompt}"
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(sc.prompt, sc.key)}
                    className="text-slate-400 hover:text-blue-600 p-1 shrink-0 cursor-pointer"
                    title="Copier le prompt"
                  >
                    {copiedPrompt === sc.key ? (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Result output if run */}
                {res?.result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-slate-50 border-t border-slate-100 space-y-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-blue-700 mb-1.5 flex items-center space-x-1.5">
                        <Bot className="w-3.5 h-3.5" />
                        <span>Réponse Autonome de Kenza AI:</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-sans shadow-xs">
                        {res.result.replyMessage?.content}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-200 space-y-2 font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-600">Intention détectée:</span>
                          <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {res.result.state?.currentIntent}
                          </span>
                        </div>
                        {res.result.state?.orderStatus && (
                          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            <span>Commande confirmée: {res.result.state.orderStatus.orderNumber} (Total: {res.result.state.orderStatus.totalMAD} MAD)</span>
                          </div>
                        )}
                        {res.result.state?.escalationStatus?.isEscalated && (
                          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 font-bold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-blue-600" />
                            <span>Escalade activée: {res.result.state.escalationStatus.reason}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

