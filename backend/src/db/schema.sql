-- =========================================================================
-- Schéma PostgreSQL 16 pour Maison Kenza
-- Support complet du catalogue, clients, variantes, commandes COD,
-- et file d'escalade humaine.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table Clients avec mémoire contextuelle et préférences
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    phone_number VARCHAR(32) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    city VARCHAR(64) NOT NULL DEFAULT 'Casablanca',
    preferred_language VARCHAR(8) NOT NULL DEFAULT 'darija', -- 'fr' | 'ar' | 'darija'
    preferred_size VARCHAR(8),
    preferred_color VARCHAR(32),
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent_mad NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    context_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table Produits du Catalogue
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    name_fr VARCHAR(128) NOT NULL,
    name_ar VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'djellaba' | 'caftan' | 'gandora' | 'babouche'
    description_fr TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    fabric VARCHAR(64) NOT NULL,
    base_price_mad NUMERIC(10, 2) NOT NULL,
    floor_price_mad NUMERIC(10, 2) NOT NULL, -- Prix plancher non négociable
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table Variantes (Stock strict & temps réel)
CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(8) NOT NULL, -- 'S' | 'M' | 'L' | 'XL'
    color VARCHAR(64) NOT NULL,
    color_hex VARCHAR(16),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    sku VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_stock_non_negative CHECK (stock_quantity >= 0)
);

-- Table Commandes
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) REFERENCES customers(id),
    customer_name VARCHAR(128) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    shipping_city VARCHAR(64) NOT NULL,
    shipping_address TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed', -- 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled'
    payment_method VARCHAR(32) NOT NULL DEFAULT 'cash_on_delivery',
    subtotal_mad NUMERIC(10, 2) NOT NULL,
    delivery_fee_mad NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_mad NUMERIC(10, 2) NOT NULL,
    conversation_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lignes de commande
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id),
    variant_id VARCHAR(64) REFERENCES product_variants(id),
    product_name VARCHAR(128) NOT NULL,
    size VARCHAR(8) NOT NULL,
    color VARCHAR(64) NOT NULL,
    unit_price_mad NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal_mad NUMERIC(10, 2) NOT NULL
);

-- File d'escalade vers l'humain
CREATE TABLE IF NOT EXISTS human_escalations (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) REFERENCES customers(id),
    customer_name VARCHAR(128) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    reason VARCHAR(128) NOT NULL,
    transcript TEXT NOT NULL,
    priority VARCHAR(16) NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'urgent'
    status VARCHAR(16) NOT NULL DEFAULT 'open', -- 'open' | 'in_progress' | 'resolved'
    resolved_by VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Relances automatiques
CREATE TABLE IF NOT EXISTS followup_triggers (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) REFERENCES customers(id),
    customer_name VARCHAR(128) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    reason VARCHAR(64) NOT NULL,
    suggested_message TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(16) NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_variants_prod_size_color ON product_variants(product_id, size, color);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON human_escalations(status);
