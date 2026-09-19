import React, { useState, useEffect } from 'react';
import { Customer, Message, Order, Product, Escalation, FollowUp, Cart, ExecutionTraceStep } from './types';
import { Navbar } from './components/Navbar';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { TraceInspector } from './components/TraceInspector';
import { MerchantDashboard } from './components/MerchantDashboard';
import { ScenarioRunner } from './components/ScenarioRunner';
import { HumanTakeoverModal } from './components/HumanTakeoverModal';
import { StoreInfoModal } from './components/StoreInfoModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'scenarios'>('chat');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-default');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeCart, setActiveCart] = useState<Cart | undefined>(undefined);
  const [latestTrace, setLatestTrace] = useState<ExecutionTraceStep[]>([]);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isGlobalStoreInfoOpen, setIsGlobalStoreInfoOpen] = useState(false);

  // Dashboard Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [apiUsage, setApiUsage] = useState({
    totalRequests: 0,
    totalTokens: 0,
    avgLatencyMs: 0,
    records: [] as any[],
  });

  // Human Takeover Modal state
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);

  // Helper for safe JSON fetching
  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const ct = res.headers.get('content-type');
      if (!ct || !ct.includes('application/json')) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  // Load all initial data from backend API
  const refreshAllData = async () => {
    try {
      // Products
      const prodData = await safeFetchJson('/api/products');
      if (prodData) {
        setProducts(Array.isArray(prodData) ? prodData : prodData.products || []);
      }

      // Orders
      const orderData = await safeFetchJson('/api/orders');
      if (orderData) {
        setOrders(Array.isArray(orderData) ? orderData : orderData.orders || []);
      }

      // Escalations
      const escData = await safeFetchJson('/api/escalations');
      if (escData) {
        setEscalations(Array.isArray(escData) ? escData : escData.escalations || []);
      }

      // Followups
      const followData = await safeFetchJson('/api/followups');
      if (followData) {
        setFollowups(Array.isArray(followData) ? followData : followData.followups || []);
      }

      // Customers from dynamic dataset
      const custData = await safeFetchJson('/api/customers');
      if (custData) {
        const list = Array.isArray(custData) ? custData : custData.customers || [];
        if (list.length > 0) {
          setCustomers(list);
        }
      }

      // Telemetry
      const telData = await safeFetchJson('/api/telemetry');
      if (telData) {
        setApiUsage(telData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    // Initial customers definition
    const initialCustomers: Customer[] = [
      {
        id: 'cust-yassine-01',
        name: 'Yassine El Fassi',
        phone: '+212 661-112233',
        city: 'Casablanca',
        languagePreference: 'darija',
        totalOrdersCount: 2,
        totalSpentMAD: 1500,
        notes: 'Client fidèle. Préfère taille L, couleur Bleu ou Vert.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cust-amina-02',
        name: 'Amina Benjelloun',
        phone: '+212 662-445566',
        city: 'Rabat',
        languagePreference: 'darija',
        totalOrdersCount: 0,
        totalSpentMAD: 0,
        notes: 'Nouveau contact via publicité Instagram.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cust-tariq-03',
        name: 'Tariq Alami (Atlas Consulting SARL)',
        phone: '+212 663-778899',
        city: 'Casablanca',
        languagePreference: 'fr',
        totalOrdersCount: 1,
        totalSpentMAD: 1200,
        notes: 'Commandes d’entreprise, demande systématique de facturation officielle.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    setCustomers(initialCustomers);
    setActiveCustomer(initialCustomers[0]);
    setActiveConversationId(`conv-${initialCustomers[0].id}`);

    // Initial greeting message in Darija
    setMessages([
      {
        id: 'init-msg-1',
        conversationId: `conv-${initialCustomers[0].id}`,
        sender: 'assistant',
        content: 'Salam Si Yassine! Merhaba bik f boutique Kenza. Ach ban lik f la nouvelle collection dyal جلابة سوسدي والقفطان؟',
        timestamp: new Date().toISOString(),
      },
    ]);

    refreshAllData();
  }, []);

  // Customer switch
  const handleSelectCustomer = (customer: Customer) => {
    setActiveCustomer(customer);
    const convId = `conv-${customer.id}-${Date.now()}`;
    setActiveConversationId(convId);
    setActiveCart(undefined);
    setLatestTrace([]);

    const greeting = customer.totalOrdersCount > 0
      ? `أهلاً وسهلا سي ${customer.name.split(' ')[0]}! كنشكروك على وفائك الدائم لمتجرنا 😊 كنعرفو ذوقك فالمقاس ${customer.notes?.includes('L') ? 'L' : 'ديالك'}. شنو عجبك نوجدو ليك فهاد الكوليكسيون الجديدة؟`
      : `Salam! Merhaba bik f متجر كنزة للأزياء المغربية التقليدية الأصيلة 🇲🇦 كي نقدر نعاونك اليوم؟`;

    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        conversationId: convId,
        sender: 'assistant',
        content: greeting,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Send message from chat
  const handleSendMessage = async (text: string) => {
    if (!activeCustomer) return;
    setIsLoading(true);

    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      conversationId: activeConversationId,
      sender: 'customer',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          customerId: activeCustomer.id,
          messageText: text,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.replyMessage) {
        setMessages((prev) => [...prev, data.replyMessage]);
      }

      if (data.state?.cart) {
        setActiveCart(data.state.cart);
      }

      if (data.trace) {
        setLatestTrace(data.trace);
      }

      await refreshAllData();
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          conversationId: activeConversationId,
          sender: 'assistant',
          content: 'سمح لينا، وقع مشكل فالاتصال. عاود حاول مرة أخرى دابا عافاك.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Scenario 1-click shortcut
  const handleRunScenario = async (scenarioKey: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/demo/run-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioKey }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.promptSent) {
        const userMsg: Message = {
          id: `msg-sc-user-${Date.now()}`,
          conversationId: activeConversationId,
          sender: 'customer',
          content: data.promptSent,
          timestamp: new Date().toISOString(),
        };

        const agentMsg: Message = data.result.replyMessage || {
          id: `msg-sc-agent-${Date.now()}`,
          conversationId: activeConversationId,
          sender: 'assistant',
          content: 'Traitement effectué.',
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMsg, agentMsg]);
      }

      if (data.result?.state?.cart) {
        setActiveCart(data.result.state.cart);
      }

      if (data.result?.trace) {
        setLatestTrace(data.result.trace);
      }

      await refreshAllData();
    } catch (err) {
      console.error('Scenario error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset database state
  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      await refreshAllData();
      setLatestTrace([]);
      setActiveCart(undefined);
      setMessages([
        {
          id: `msg-reset-${Date.now()}`,
          conversationId: activeConversationId,
          sender: 'system',
          content: '🔄 Les données de démo ont été réinitialisées avec succès.',
          timestamp: new Date().toISOString(),
        },
        {
          id: `msg-welcome-new-${Date.now()}`,
          conversationId: activeConversationId,
          sender: 'assistant',
          content: 'Salam! Merhaba bik f boutique Kenza. كي نقدر نعاونك اليوم؟',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Human Takeover action
  const handleOpenTakeover = (escalationId: string) => {
    const esc = escalations.find((e) => e.id === escalationId);
    if (esc) {
      setSelectedEscalation(esc);
    }
  };

  const handleSendMerchantReply = async (escalationId: string, conversationId: string, replyText: string) => {
    try {
      const res = await fetch(`/api/escalations/${escalationId}/takeover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: 'Gérant Magasin (Human)',
          message: replyText,
        }),
      });

      if (res.ok) {
        // Add message to chat if matching conversation
        const humanMsg: Message = {
          id: `msg-human-${Date.now()}`,
          conversationId,
          sender: 'human_agent',
          content: replyText,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, humanMsg]);
        await refreshAllData();
      }
    } catch (err) {
      console.error('Takeover failed:', err);
    }
  };

  const handleCancelFollowup = async (followupId: string) => {
    try {
      const res = await fetch(`/api/followups/${followupId}/cancel`, { method: 'POST' });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (err) {
      console.error('Cancel followup failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-[#0A192F] selection:text-sky-200 relative overflow-x-hidden">
      {/* Dynamic Ambient Background Movement: Navy, Petrol, Sky Blue & Frost White */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 opacity-70">
        {/* Orb 1: Deep Marine & Petrol (Top Left) */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-[#0A192F]/20 via-[#0E4957]/20 to-transparent blur-3xl animate-float-orb1" />
        
        {/* Orb 2: Luminous Sky Blue (Top Right / Center) */}
        <div className="absolute top-1/4 -right-32 w-[32rem] h-[32rem] rounded-full bg-gradient-to-bl from-[#38BDF8]/15 via-[#0EA5E9]/10 to-transparent blur-3xl animate-float-orb2" />
        
        {/* Orb 3: Petrol & Azure (Bottom Center) */}
        <div className="absolute -bottom-32 left-1/3 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-[#0E4957]/15 via-[#7DD3FC]/15 to-transparent blur-3xl animate-float-orb3" />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-morocco-zellige opacity-40 mix-blend-multiply" />
      </div>

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleResetData}
        isResetting={isResetting}
        onOpenStoreInfo={() => setIsGlobalStoreInfoOpen(true)}
      />

      {/* Main Viewports */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        {activeTab === 'chat' && (
          <div className="flex-1 flex w-full">
            <WhatsAppSimulator
              customers={customers}
              activeCustomer={activeCustomer}
              onSelectCustomer={handleSelectCustomer}
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              activeCart={activeCart}
              onRunScenario={handleRunScenario}
              products={products}
              isTraceOpen={isTraceOpen}
              onToggleTrace={() => setIsTraceOpen(!isTraceOpen)}
            />

            <TraceInspector
              trace={latestTrace}
              isOpen={isTraceOpen}
              onToggle={() => setIsTraceOpen(!isTraceOpen)}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <MerchantDashboard
            orders={orders}
            products={products}
            escalations={escalations}
            followups={followups}
            apiUsage={apiUsage}
            onTakeover={handleOpenTakeover}
            onCancelFollowup={handleCancelFollowup}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'scenarios' && <ScenarioRunner />}
      </main>

      {/* Human Takeover Modal */}
      {selectedEscalation && (
        <HumanTakeoverModal
          escalation={selectedEscalation}
          onClose={() => setSelectedEscalation(null)}
          onSendMerchantReply={handleSendMerchantReply}
        />
      )}

      {/* Global Store Info Modal (Accessible from Navbar & all tabs) */}
      <StoreInfoModal
        isOpen={isGlobalStoreInfoOpen}
        onClose={() => setIsGlobalStoreInfoOpen(false)}
        onAskQuestionInChat={(prompt) => {
          setActiveTab('chat');
          handleSendMessage(prompt);
        }}
      />
    </div>
  );
}
