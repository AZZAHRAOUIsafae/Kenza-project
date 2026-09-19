# 🇲🇦 Kenza AI — Agent Commercial Autonome E-Commerce Marocain

> **Kenza AI** est un agent commercial conversationnel autonome de qualité industrielle, conçu sur mesure pour l'écosystème du commerce électronique et de l'artisanat au Maroc.  
> Développé avec **React 18 + TypeScript (Vite)**, **Node.js 20 (Fastify)**, **LangGraph (@langchain/langgraph)**, **PostgreSQL 16** et **Redis 7 (BullMQ)**, Kenza automatise l'intégralité du tunnel de vente sur WhatsApp : de la compréhension native de la **Darija marocaine (arabe et Arabizi)** à la confirmation formelle de commande en paiement à la livraison (**Cash On Delivery - COD**), en passant par le contrôle strict des stocks réels, la protection absolue des marges et la relance programmée des paniers abandonnés.

---

## 📑 Sommaire

1. [🎯 Le Problème (Enjeux Métier & Défis Techniques)](#-le-problème-enjeux-métier--défis-techniques)
2. [🏛️ Architecture Technique du Système](#️-architecture-technique-du-système)
   - [Diagramme de Flux Global (LangGraph)](#diagramme-de-flux-global-langgraph)
   - [Les 5 Agents Spécialisés](#les-5-agents-spécialisés)
   - [Moteur de Règles & Garde-fous Déterministes](#moteur-de-règles--garde-fous-déterministes)
   - [Modèle de Données (PostgreSQL 16 & Redis 7)](#modèle-de-données-postgresql-16--redis-7)
3. [🧪 Matrice de Validation & Scénarios de Démonstration (A à H)](#-matrice-de-validation--scénarios-de-démonstration-a-à-h)
4. [🚀 Guide de Lancement & Déploiement](#-guide-de-lancement--déploiement)
   - [Prérequis Système](#prérequis-système)
   - [Variables d'Environnement](#variables-denvironnement)
   - [Démarrage Rapide en Local](#démarrage-rapide-en-local)
   - [Exécution de la Suite de Tests Automatisée](#exécution-de-la-suite-de-tests-automatisée)
   - [Déploiement Complet avec Docker Compose](#déploiement-complet-avec-docker-compose)
5. [🔌 Spécification Exhaustive des APIs REST (/api/*)](#-spécification-exhaustive-des-apis-rest-api)
   - [1. Chat & Orchestration Multi-Agents](#1-chat--orchestration-multi-agents)
   - [2. Catalogue & Stock Temps Réel](#2-catalogue--stock-temps-réel)
   - [3. Panier Dynamique & Remises](#3-panier-dynamique--remises)
   - [4. Commandes & Cash On Delivery (COD)](#4-commandes--cash-on-delivery-cod)
   - [5. Clients & Mémoire Persistante](#5-clients--mémoire-persistante)
   - [6. Relances Automatiques (BullMQ / Redis)](#6-relances-automatiques-bullmq--redis)
   - [7. Escalades & Handover Humain](#7-escalades--handover-humain)
   - [8. Recherche Sémantique RAG](#8-recherche-sémantique-rag)
   - [9. Supervision, Télémétrie & Santé](#9-supervision-télémétrie--santé)
6. [📊 Supervision & Tableau de Bord Commerçant](#-supervision--tableau-de-bord-commerçant)

---

## 🎯 Le Problème (Enjeux Métier & Défis Techniques)

Dans le secteur du commerce électronique au Maroc, en particulier dans les secteurs de l'artisanat, du prêt-à-porter traditionnel (Djellabas, Caftans, Gandoras) et de la maroquinerie, **plus de 85% des transactions s'initient ou se concluent via WhatsApp** (*Social Commerce*). Cependant, les commerçants font face à cinq blocages structurels majeurs :

### 1. La Barrière Linguistique de la Darija Marocaine
Les chatbots traditionnels et modèles LLM génériques échouent face aux spécificités de la **Darija** :
- Mélange fluide de Darija en caractères arabes et en **Arabizi (alphabet latin avec chiffres phonétiques : `3` pour ع, `7` pour ح, `9` pour ق)**.
- Expressions idiomatiques locales (*« bghit nchouf chi haja nqiya »*, *« dir lia chi taman mzyan »*, *« wach kayna chi remise akhoya »*).
- Tolérance aux fautes d'orthographe et abréviations fréquentes des utilisateurs mobiles.

### 2. Le Taux d'Abandon Massif et la Lenteur de Réponse
- Les clients WhatsApp attendent une réactivité quasi-instantanée (moins de 2 minutes).
- Les équipes commerciales humaines sont indisponibles la nuit, les dimanches et les jours fériés, causant une perte estimée à **40% à 60% des prospects chauds**.
- Sans système de relance temporel automatisé, les paniers hésitants (*« ghadi nfeker »*) sont définitivement perdus.

### 3. L'Érosion Incontrôlée des Marges (Négociation Sauvage)
La négociation du prix fait partie intégrante de la culture marchande marocaine. Laisser un modèle LLM libre de négocier conduit inévitablement à :
- Des remises déraisonnables détruisant la marge brute du commerçant.
- Des incohérences tarifaires entre clients.
- **Solution requise** : un garde-fou inviolable (`minPriceFloorMAD`) imposé au niveau applicatif, interdisant mathématiquement toute vente à perte.

### 4. Les Ruptures de Stock et Hallucinations d'Inventaire
Un agent commercial ne doit jamais confirmer une commande sur un produit indisponible. Les clients sont frustrés lorsqu'un article promis est en rupture, entraînant une perte de confiance irréversible et un taux élevé de refus au moment de la livraison.
- **Solution requise** : synchronisation temps réel avec la base de données de stock et proposition automatique d'alternatives réelles en stock (autre couleur, autre taille).

### 5. Les Spécificités du Cash On Delivery (COD) au Maroc
Au Maroc, le paiement s'effectue quasi-exclusivement à la livraison en espèces :
- Nécessité de valider formellement les 4 coordonnées indispensables : **Nom complet, Numéro WhatsApp, Ville marocaine, et Adresse précise**.
- Calcul déterministe des frais et délais de livraison selon la grille logistique nationale (ex: Casablanca 20 MAD, Rabat 35 MAD, Marrakech 45 MAD, gratuité au-delà de seuils définis).

---

## 🏛️ Architecture Technique du Système

Le système repose sur une architecture moderne découplée combinant un **Orchestrateur Multi-Agents sous LangGraph**, une API haute performance sous **Fastify (Node.js 20)**, un stockage relationnel **PostgreSQL 16**, un cache et moteur de queues **Redis 7 / BullMQ**, et une interface réactive **React 18 + TypeScript**.

### Diagramme de Flux Global (LangGraph)

```text
                                 [ Message WhatsApp Entrant ]
                               (Darija, Arabizi, Français, Arabe)
                                              │
                                              ▼
                              ┌───────────────────────────────┐
                              │    AgentOrchestrator Node     │
                              │ (Contrôleur Central LangGraph)│
                              └──────────────┬────────────────┘
                                             │
                     ┌───────────────────────┼───────────────────────┐
                     ▼                       ▼                       ▼
          ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
          │  ConversationAgent  │ │   CatalogueAgent    │ │   GuardrailAgent    │
          │  • NLU / Arabizi    │ │  • Stocks en direct │ │  • Seuil Inviolable │
          │  • Intent & Entités │ │  • Alternatives     │ │  • Marges Commerçant│
          │  • Mémoire Client   │ │  • Variantes / Img  │ │  • Validation COD   │
          └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
                     │                       │                       │
                     └───────────────────────┼───────────────────────┘
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │               Business Tools                  │
                     │   • searchProducts()    • checkStock()        │
                     │   • updateCart()        • calculateDelivery() │
                     │   • getDiscountPolicy() • createOrder()       │
                     └───────────────────────┬───────────────────────┘
                                             │
                          ┌──────────────────┴──────────────────┐
                          ▼                                     ▼
               ┌─────────────────────┐               ┌─────────────────────┐
               │    RelanceAgent     │               │   EscalationAgent   │
               │  • Queue BullMQ     │               │  • Prise en Main    │
               │  • Relance 15 min   │               │  • Transfert Gérant │
               │  • Redis 7 Jobs     │               │  • Contexte & Panier│
               └─────────────────────┘               └─────────────────────┘
```

---

### Les 5 Agents Spécialisés

1. **`ConversationAgent` (Compréhension & Mémoire Client)** :
   - Analyse sémantique multilingue : Darija en alphabet arabe, Arabizi (alphabet latin), Français commercial et Arabe standard.
   - Extraction d'entités clés : modèles d'articles, tailles (S, M, L, XL), couleurs, intention d'achat ou de négociation.
   - Mémoire persistante par client : historique d'achats passés, ville de livraison habituelle et panier en cours.

2. **`CatalogueAgent` (Gestion d'Inventaire & Recommandation)** :
   - Interrogation en temps réel des stocks disponibles par variante (`color`, `size`, `stockQuantity`).
   - Détection proactive des ruptures : si le client demande une Djellaba taille L en Bleu (stock = 0), l'agent refuse la commande avec courtoisie et propose immédiatement les variantes disponibles (ex: Vert Émeraude ou Noir).
   - Transmission des visuels et fiches techniques réels correspondants à 100% au modèle sélectionné.

3. **`GuardrailAgent` & `DiscountPolicyEngine` (Protection Financière)** :
   - Garde-fou strict sur la politique de remise : chaque produit possède un prix catalogue (`regularPriceMAD`) et un prix plancher non franchissable (`minPriceFloorMAD`).
   - Le modèle LLM **n'a pas la permission** d'accorder une remise arbitraire. Toute offre passe par le moteur de règles qui plafonne les concessions et justifie la valeur du travail artisanal marocain.

4. **`RelanceAgent` (Récupération de Paniers Abandonnés)** :
   - Intégré avec **BullMQ et Redis 7**.
   - Lorsqu'un client interrompt la discussion avec un panier actif (*« ghadi nchouf w nrejja3 3lik »*), un job temporisé est planifié.
   - Déclenchement automatique d'un message bienveillant en Darija pour lever les doutes et conclure la vente sans harcèlement.

5. **`EscalationAgent` (Passage de Relais Humain)** :
   - Détecte automatiquement les requêtes hors-périmètre : demandes de factures d'entreprise avec identifiants fiscaux (ICE, RC), réclamations complexes ou demandes explicites de parler à un responsable.
   - Transfère immédiatement le fil de discussion dans la **File d'Escalade du Commerçant** avec une fiche de synthèse (sentiment, motif, panier en cours) et active le mode de réponse manuelle.

---

### Moteur de Règles & Garde-fous Déterministes

| Règle Métier | Implémentation Système | Conséquence |
|:---|:---|:---|
| **Plafond de Remise** | `minPriceFloorMAD` par produit | Rejet automatique de toute offre inférieure au seuil de rentabilité |
| **Grille Logistique COD** | Algorithme de zonage postal marocain | Casablanca: 20 MAD (Gratuit dès 500 MAD) • Rabat: 35 MAD (Gratuit dès 700 MAD) • Autres villes: 45-55 MAD |
| **Intégrité des Commandes** | Validation stricte des 4 champs COD | Aucune commande validée sans Nom, Téléphone valide, Ville et Quartier |
| **Anti-Hallucination Stock** | Requête SQL / In-memory guard | Zéro promesse de livraison sur du stock nul (`quantity === 0`) |

---

### Modèle de Données (PostgreSQL 16 & Redis 7)

Le schéma PostgreSQL (`schema.sql`) structure l'ensemble des entités du commerce :

- **`customers`** : Profil, numéro WhatsApp normalisé, ville principale, volume de commandes, statut VIP.
- **`products` & `product_variants`** : Références, désignation, prix régulier, prix plancher (`min_price_floor_mad`), stocks par taille/couleur, URLs d'images officielles.
- **`orders` & `order_items`** : Numéro de commande unique (`KZ-XXXX`), articles, prix unitaires, frais de livraison, mode de paiement COD, statut logistique.
- **`escalations`** : File d'attente des demandes nécessitant une intervention humaine, motif, priorité, date de résolution.
- **`followup_jobs`** : Suivi des jobs de relance BullMQ, statut (programmé, exécuté, annulé), contenu du message de relance.
- **Redis 7** : Gestion des sessions conversationnelles, verrous distribués sur les stocks au moment de l'achat, et queue BullMQ pour les délais de relance.

---

## 🧪 Matrice de Validation & Scénarios de Démonstration (A à H)

Une suite complète de 8 scénarios métier certifie la robustesse du système face au jury :

| Scénario | Objectif du Test | Comportement Attendu et Vérifié |
|:---|:---|:---|
| **A : Vente Nominale COD** | Achat standard en Darija pour Casablanca | Détection du modèle, calcul des frais (20 MAD), confirmation avec code `KZ-XXXX` |
| **B : Rupture & Alternative** | Demande d'un produit en rupture (L Bleu) | Détection de stock = 0, refus poli et proposition de l'alternative disponible (Vert) |
| **C : Changement d'Avis** | Le client change de taille (M vers L) en cours de route | Mise à jour fluide du panier sans perte du fil ni réinitialisation |
| **D : Négociation Agressive** | Le client demande une remise excessive (500 MAD pour 750 MAD) | Garde-fou actif : prix plafonné strictement au plancher (650 MAD) avec argumentaire qualité |
| **E : Client Récurrent VIP** | Client fidèle connu (Yassine) envoyant « Salam » | Reconnaissance immédiate, accueil personnalisé par son prénom et rappel de ses préférences |
| **F : Panier Abandonné** | Le client hésite (« ghadi nfeker ») | Panier conservé, planification d'un job de relance BullMQ visible sur le dashboard |
| **G : Escalade Humaine** | Demande de facture avec ICE / RC d'entreprise | Détection hors-scope, transfert vers la file d'escalade gérant, mise à disposition du chat humain |
| **H : Darija en Arabizi** | Message en lettres latines avec chiffres (« ch7al taman ») | Interprétation NLU sans accroc, identification de la Gandora et calcul livraison Rabat |

---

## 🚀 Guide de Lancement & Déploiement

### Prérequis Système
- **Node.js** : version 20.x ou supérieure
- **npm** : version 10.x ou supérieure
- **Docker & Docker Compose** : pour l'environnement complet de production (PostgreSQL 16 + Redis 7 + Fastify)

---

### Variables d'Environnement

Créez votre fichier `.env` à la racine en vous basant sur l'exemple fourni :

```env
# Port d'écoute du serveur unifié
PORT=3000

# Configuration Base de Données PostgreSQL
DATABASE_URL=postgresql://kenza_admin:kenza_secure_password_2026@localhost:5432/kenza_sales_db

# Configuration Cache & Queue Redis
REDIS_URL=redis://:kenza_redis_secret@localhost:6379/0

# Fournisseur LLM (Compatible OpenAI / Numeos)
NUMEOS_BASE_URL=https://api.numeos.ai/v1
NUMEOS_API_KEY=votre_cle_api_numeos_ou_gemini
NUMEOS_MODEL_NAME=numeos-darija-v1

# Identifiants WhatsApp Cloud API (Optionnel pour le simulateur local)
WHATSAPP_PHONE_NUMBER_ID=212600000000
WHATSAPP_ACCESS_TOKEN=votre_token_whatsapp
```

---

### Démarrage Rapide en Local

Pour lancer l'application en mode développement complet (Serveur Node.js/Express + Vite avec interface WhatsApp interactive et Dashboard commerçant) :

```bash
# 1. Installation des dépendances
npm install

# 2. Démarrage du serveur de développement (Port 3000)
npm run dev
```

L'application est immédiatement accessible sur : **`http://localhost:3001`**

---

### Exécution de la Suite de Tests Automatisée

Le projet intègre une suite complète de 30 tests unitaires, d'intégration, de conformité des datasets CSV/Markdown, d'architecture Azure OpenAI / RAG et de scénarios bout-en-bout (E2E) :

```bash
# Exécution des 30 tests automatisés
npm test
```

*Résultat obtenu (100% succès déterministe) :*
```text
========================================
🧪 KENZA AGENT — AUTOMATED TEST SUITE
========================================
--- 1. UNIT TESTS: BUSINESS TOOLS & ENGINE ---
  ✅ PASS: Unit 1: Product search by term "sousdi" returns results
  ✅ PASS: Unit 2: Djellaba M Bleu is in stock with 8 units
  ✅ PASS: Unit 3: Djellaba L Bleu is out of stock (quantity 0)
  ✅ PASS: Unit 4: Casablanca delivery fee is calculated from delivery grid (25 MAD)
  ✅ PASS: Unit 5: Casablanca delivery is 0 MAD (Free) over 500 MAD
  ✅ PASS: Unit 6: Discount floor enforced: 450 MAD request clamped strictly to 650 MAD floor
  ✅ PASS: Unit 7: Authorized 10% discount applies cleanly (675 MAD >= 650 MAD floor)
  ✅ PASS: Unit 8: Cart subtotal correctly calculated as 750 MAD
  ✅ PASS: Unit 9: Cart variant changed successfully without resetting cart

--- 2. INTEGRATION TESTS ---
  ✅ PASS: Integration 1: Customer memory and previous order history loaded
  ✅ PASS: Integration 2: Follow-up scheduled with status "scheduled"
  ✅ PASS: Integration 3: LLM Adapter returns responsive completion

--- 3. END-TO-END MANDATORY SCENARIOS ---
  ✅ PASS: E2E Scenario A: Normal sale completed with real order creation (order number generated)
  ✅ PASS: E2E Scenario B: Out-of-stock product detected & available alternative proposed
  ✅ PASS: E2E Scenario C: Change of mind handled gracefully by updating existing cart
  ✅ PASS: E2E Scenario D: Discount floor of 650 MAD strictly protected against customer negotiation
  ✅ PASS: E2E Scenario E: Returning customer Yassine recognized from persistent memory
  ✅ PASS: E2E Scenario F: Abandoned cart detected and follow-up scheduled in background queue
  ✅ PASS: E2E Scenario G: Corporate invoice request safely escalated to human merchant with context
  ✅ PASS: E2E Scenario H: Latin Darija message correctly parsed and Rabat delivery recognized

--- 4. DYNAMIC DATASET VERIFICATION (CSV & MD) ---
  ✅ PASS: Dataset 1: catalogue.csv successfully parsed & REF-0012 (Blouson vert olive) loaded with variants
  ✅ PASS: Dataset 2: clients.csv successfully parsed & CLI-0001 Nadia Bennani loaded with Tanger residency
  ✅ PASS: Dataset 3: livraison.csv parsed with city rules: Fès boutique pickup enabled & Tanger COD disabled
  ✅ PASS: Dataset 4: commandes.csv & commandes-lignes.csv successfully loaded with order line items
  ✅ PASS: Dataset 5: promotions.csv loaded active promotions including REF-0074 discount
  ✅ PASS: Dataset 6: politique-commerciale.md and faq-boutique.md correctly loaded into agent knowledge base

--- 5. AZURE OPENAI & RAG SPECIALIZED ARCHITECTURE ---
  ✅ PASS: Azure 1: GPT-4.1 high-volume endpoint responsive and outputs Moroccan greeting
  ✅ PASS: Azure 2: Identical prompt hits in-memory cache to save token quota and reduce latency
  ✅ PASS: Azure 3: embedder-small-3 computes 512-dimensional semantic embeddings vector
  ✅ PASS: Azure 4: RAG service performs cosine similarity search over FAQ & policy knowledge base

========================================
📊 TEST RESULTS: 30 PASSED | 0 FAILED (100% SUCCESS)
========================================
```

---

### Déploiement Complet avec Docker Compose

Pour déployer l'ensemble de la stack de production (PostgreSQL 16, Redis 7, Backend Fastify et Frontend React) en conteneurs isolés :

```bash
# 1. Construction et démarrage des conteneurs en arrière-plan
docker-compose up -d --build

# 2. Vérification du statut de santé des services
docker-compose ps

# 3. Consultation des logs en direct
docker-compose logs -f backend
```

Les conteneurs déployés comprennent :
- **`kenza-postgres-16`** : Base de données PostgreSQL 16 avec schéma et catalogue artisanal préchargés.
- **`kenza-redis-7`** : Serveur Redis 7 sécurisé pour les sessions et les files BullMQ.
- **`kenza-fastify-api`** : API Node.js 20 Fastify orchestrant LangGraph et les agents conversationnels (Port `4000`).
- **`kenza-frontend`** : Interface utilisateur React 18 / Vite servie par NGINX (Port `3000`).

Pour stopper les services :
```bash
docker-compose down
```

---

## 🔌 Spécification Exhaustive des APIs REST (/api/*)

L'ensemble des services backend expose une API REST standardisée, typée en TypeScript, répondant en format JSON strict et protégée contre les erreurs de payload ou d'états incohérents.

---

### 1. Chat & Orchestration Multi-Agents

#### `POST /api/chat`
Point d'entrée universel pour le simulateur WhatsApp et l'intégration omnicanale. Déclenche le graphe LangGraph d'orchestration multi-agents.

- **Content-Type**: `application/json`
- **Corps de la requête (`Request Body`)** :
```json
{
  "conversationId": "conv-user-123",
  "customerId": "cust-yassine-01",
  "messageText": "Salam, bghit djellaba sousdi f lkhal taille M l casa",
  "customerName": "Yassine Mansouri",
  "customerPhone": "+212661234567",
  "isHumanMerchant": false
}
```

- **Réponse (`Response 200 OK`)** :
```json
{
  "replyMessage": {
    "id": "msg-1726739000-1",
    "conversationId": "conv-user-123",
    "sender": "agent",
    "content": "Wa alaykum salam a Si Yassine ! Marhba bik. Kayna Djellaba Sousdi Noir f taille M à 750 MAD. Twsil l casa b 25 MAD. Ndir lik commande ?",
    "timestamp": 1726739000000,
    "intent": "order_intent",
    "confidence": 0.96
  },
  "state": {
    "conversationId": "conv-user-123",
    "customerId": "cust-yassine-01",
    "cartId": "cart-conv-user-123",
    "currentStage": "confirmation",
    "escalated": false,
    "cart": {
      "items": [{ "productId": "prod-djellaba-01", "name": "Djellaba Sousdi", "size": "M", "color": "Noir", "priceMAD": 750, "quantity": 1 }],
      "subtotalMAD": 750,
      "deliveryFeeMAD": 25,
      "discountMAD": 0,
      "totalMAD": 775,
      "city": "Casablanca"
    }
  },
  "trace": [
    { "step": "intent_detection", "intent": "order_intent", "confidence": 0.96 },
    { "step": "stock_check", "status": "available", "quantity": 8 },
    { "step": "cart_update", "action": "add_item", "totalMAD": 775 },
    { "step": "response_generation", "language": "darija_latin" }
  ]
}
```

- **Codes d'erreur** :
  - `400 Bad Request` : `{ "error": "Message content is required" }`
  - `500 Internal Server Error` : `{ "error": "<détails de l'exception>" }`

---

#### `GET /api/conversations`
Retourne la liste complète de toutes les conversations actives et archivées.

- **Réponse (`Response 200 OK`)** :
```json
[
  {
    "id": "conv-cust-yassine-01",
    "customerId": "cust-yassine-01",
    "customerName": "Yassine Mansouri",
    "customerPhone": "+212661234567",
    "stage": "order_confirmed",
    "status": "active",
    "escalated": false,
    "lastMessage": "Commande CMD-2026-0042 confirmée avec succès !",
    "updatedAt": 1726739100000
  }
]
```

#### `GET /api/conversations/:id`
Retourne l'historique complet d'une conversation, les messages échangés et le fil d'exécution.

---

### 2. Catalogue & Stock Temps Réel

#### `GET /api/products`
Recherche et liste les produits avec filtres textuels et par catégorie.

- **Paramètres d'URL (`Query Parameters`)** :
  - `q` *(string, optionnel)* : Terme de recherche (ex: `sousdi`, `cuir`, `djellaba`)
  - `category` *(string, optionnel)* : Catégorie (`Djellabas`, `Caftans`, `Gandoras`, `Accessoires`)

- **Exemple de requête cURL** :
```bash
curl -X GET "http://localhost:3000/api/products?q=sousdi&category=Djellabas"
```

- **Réponse (`Response 200 OK`)** :
```json
[
  {
    "id": "prod-djellaba-01",
    "ref": "REF-0001",
    "name": "Djellaba Sousdi Traditionnelle",
    "category": "Djellabas",
    "basePriceMAD": 750,
    "minPriceFloorMAD": 650,
    "description": "Djellaba artisanale haut de gamme tissée main avec randa et sfifa en soie végétale.",
    "imageUrl": "/products/djellaba-bleu.png",
    "variants": [
      { "id": "var-dj-m-bleu", "size": "M", "color": "Bleu", "stockQuantity": 8, "sku": "DJ-SOU-BLU-M" },
      { "id": "var-dj-l-bleu", "size": "L", "color": "Bleu", "stockQuantity": 0, "sku": "DJ-SOU-BLU-L" },
      { "id": "var-dj-xl-bleu", "size": "XL", "color": "Bleu", "stockQuantity": 5, "sku": "DJ-SOU-BLU-XL" }
    ]
  }
]
```

#### `GET /api/products/:id/stock`
Vérification instantanée de la disponibilité d'une variante spécifique. En cas de rupture, retourne les alternatives disponibles en stock.

- **Paramètres d'URL** :
  - `size` *(string, optionnel)* : Taille demandée (ex: `L`)
  - `color` *(string, optionnel)* : Couleur demandée (ex: `Bleu`)

- **Exemple en cas de rupture de stock (`Response 200 OK`)** :
```json
{
  "inStock": false,
  "requestedVariant": { "size": "L", "color": "Bleu", "quantity": 0 },
  "message": "Rupture de stock sur la taille L en Bleu",
  "availableAlternatives": [
    { "size": "M", "color": "Bleu", "stockQuantity": 8 },
    { "size": "XL", "color": "Bleu", "stockQuantity": 5 },
    { "size": "L", "color": "Noir", "stockQuantity": 3 }
  ]
}
```

---

### 3. Panier Dynamique & Remises

#### `GET /api/carts/:id`
Récupère l'état instantané du panier.

#### `PUT /api/carts/:id`
Met à jour le panier (ajout, retrait, changement de variante, application de remise négociée, calcul des frais de port).

- **Corps de la requête (`Request Body`)** :
```json
{
  "action": "add",
  "productId": "prod-djellaba-01",
  "variantId": "var-dj-m-bleu",
  "quantity": 1,
  "size": "M",
  "color": "Bleu",
  "city": "Casablanca",
  "discountMAD": 50
}
```

- **Règles métier appliquées automatiquement** :
  - Frais de livraison calculés via la grille officielle (`Casablanca`: 25 MAD, gratuit dès 500 MAD d'achat).
  - La remise demandée est plafonnée strictement par `minPriceFloorMAD` (650 MAD sur cet article).

---

### 4. Commandes & Cash On Delivery (COD)

#### `POST /api/orders`
Génère et persiste une nouvelle commande confirmée.

- **Corps de la requête (`Request Body`)** :
```json
{
  "cartId": "cart-conv-user-123",
  "customerName": "Yassine Mansouri",
  "customerPhone": "+212661234567",
  "deliveryAddress": "12 Rue des Hôpitaux, Maarif",
  "deliveryCity": "Casablanca",
  "idempotencyKey": "idem-conv-user-123-1726739000"
}
```

- **Réponse (`Response 201 Created`)** :
```json
{
  "orderId": "CMD-2026-0042",
  "status": "pending_cod_confirmation",
  "paymentMethod": "CASH_ON_DELIVERY",
  "subtotalMAD": 750,
  "deliveryFeeMAD": 0,
  "totalMAD": 750,
  "trackingCode": "AMANA-MA-789042",
  "estimatedDelivery": "24h - 48h ouvrables"
}
```

#### `GET /api/orders`
Liste toutes les commandes enregistrées avec filtrage par client ou statut.

---

### 5. Clients & Mémoire Persistante

#### `GET /api/customers`
Retourne la liste des profils clients enregistrés.

#### `GET /api/customers/:id`
Détail du profil client, adresse habituelle, préférences de taille, panier moyen et tag de fidélité.

#### `GET /api/customers/:id/history`
Retourne les interactions passées, historique des commandes et articles déjà achetés.

---

### 6. Relances Automatiques (BullMQ / Redis)

#### `GET /api/followups`
Retourne la liste des relances programmées, exécutées ou annulées.

#### `POST /api/followups`
Programme une relance de panier abandonné dans la file BullMQ.

- **Corps de la requête (`Request Body`)** :
```json
{
  "conversationId": "conv-cust-yassine-01",
  "customerId": "cust-yassine-01",
  "cartId": "cart-01",
  "delayMinutes": 15
}
```

#### `POST /api/followups/:id/cancel`
Annule immédiatement une relance si le client a répondu ou validé sa commande entre-temps.

---

### 7. Escalades & Handover Humain

#### `GET /api/escalations`
Consulte la file d'attente des conversations escaladées au commerçant humain.

#### `POST /api/escalations/:id/takeover`
Permet au commerçant de prendre la main en direct sur la conversation. Les réponses automatiques de l'IA sont suspendues sur ce canal.

- **Corps de la requête (`Request Body`)** :
```json
{
  "agentName": "Ahmed Benali (Gérant)"
}
```

---

### 8. Recherche Sémantique RAG

#### `POST /api/rag/search`
Interroge la base de connaissances (FAQ boutique, politique de retour, délais de livraison) via embedding vectoriel (`embedder-small-3`) ou score hybride lexical.

- **Corps de la requête (`Request Body`)** :
```json
{
  "query": "horaires ouverture de la boutique fès",
  "category": "faq",
  "limit": 3
}
```

---

### 9. Supervision, Télémétrie & Santé

| Endpoint | Méthode | Description |
| :--- | :--- | :--- |
| `/api/health` ou `/health` | `GET` | Statut de l'application, des bases PostgreSQL/Redis, et modèles Azure configurés |
| `/api/analytics` | `GET` | KPIs en temps réel : CA COD, total commandes, panier moyen, taux de conversion |
| `/api/telemetry` | `GET` | Statistiques d'appels LLM (tokens, latence moyenne ms, taux d'utilisation du cache) |
| `/api/policy` | `GET` | Contenu brut de `politique-commerciale.md` et `faq-boutique.md` |
| `/api/promotions` | `GET` | Liste des codes promotionnels et réductions actives |
| `/api/seed` | `POST` | Recharge à chaud les fichiers CSV et Markdown dans la base de données |
| `/api/demo/run-scenario` | `POST` | Exécute instantanément l'un des 8 scénarios du jury (`A` à `H`) pour démonstration |

---

## 📊 Supervision & Tableau de Bord Commerçant

Accessible via l'onglet **« Tableau de Bord »** de l'interface, la console de supervision offre au gérant du magasin une visibilité complète et en temps réel :

1. **Indicateurs Clés de Performance (KPIs)** :
   - Chiffre d'affaires total généré en paiement COD (MAD).
   - Nombre de commandes validées et closes sans intervention humaine.
   - Nombre d'escalades en attente d'arbitrage.
   - Relances BullMQ programmées et actives.
2. **File d'Escalade & Prise en Main Humaine (Takeover)** :
   - Affichage en temps réel des alertes de transfert avec motif, priorité et données client.
   - Bouton d'action **« Prendre la main »** permettant au gérant d'écrire directement dans la conversation WhatsApp du client.
3. **Contrôle du Catalogue & Plafonds de Remise** :
   - Consultation des stocks par modèle, taille et coloris.
   - Visualisation immédiate du prix régulier et du seuil minimal (`minPriceFloorMAD`).
4. **Télémétrie LLM & Consommation** :
   - Suivi du nombre de requêtes, temps de latence moyen (ms), et répartition linguistique (Darija, Français, Arabe).

---

## 👥 Auteur & Projet Académique

- **Projet** : Kenza AI — Autonomous Moroccan Sales Agent
- **Établissement** : ESISA (École Supérieure d'Ingénierie en Sciences Appliquées)
- **Contact** : `s.azzahraoui@esisa.ac.ma`
- **Licence** : Propriétaire — Développé pour la soutenance et démonstration de jury.
