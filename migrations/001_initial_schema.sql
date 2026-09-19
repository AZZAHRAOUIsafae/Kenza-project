-- Kenza Autonomous Moroccan Sales Agent
-- Database Migration 001: Initial Schema (PostgreSQL 16)
-- Deliverable 5

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) UNIQUE NOT NULL,
    city VARCHAR(100) NOT NULL,
    language_preference VARCHAR(16) DEFAULT 'darija',
    notes TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    total_orders_count INT DEFAULT 0,
    total_spent_mad NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);

-- 2. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
    status VARCHAR(32) DEFAULT 'active', -- active, escalated, human_takeover, closed
    channel VARCHAR(32) DEFAULT 'whatsapp_simulator',
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- 3. Messages
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(32) NOT NULL, -- customer, assistant, human_agent, system
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    name_darija VARCHAR(255),
    description TEXT,
    category VARCHAR(64) NOT NULL,
    base_price_mad NUMERIC(10, 2) NOT NULL,
    min_price_floor_mad NUMERIC(10, 2) NOT NULL, -- Business Rule Floor!
    max_discount_percent NUMERIC(5, 2) DEFAULT 15.00,
    image_url TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN (tags);

-- 5. Product Variants & Inventory
CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(64) UNIQUE NOT NULL,
    size VARCHAR(32) NOT NULL,
    color VARCHAR(64) NOT NULL,
    color_hex VARCHAR(16),
    price_mad NUMERIC(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_stock_non_negative CHECK (stock_quantity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- 6. Carts & Cart Items
CREATE TABLE IF NOT EXISTS carts (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
    conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'ACTIVE', -- EMPTY, ACTIVE, ABANDONED, CHECKOUT, ORDERED
    subtotal_mad NUMERIC(10, 2) DEFAULT 0.00,
    discount_mad NUMERIC(10, 2) DEFAULT 0.00,
    delivery_fee_mad NUMERIC(10, 2) DEFAULT 0.00,
    total_mad NUMERIC(10, 2) DEFAULT 0.00,
    city VARCHAR(100),
    delivery_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    abandoned_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);

CREATE TABLE IF NOT EXISTS cart_items (
    id VARCHAR(64) PRIMARY KEY,
    cart_id VARCHAR(64) REFERENCES carts(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
    variant_id VARCHAR(64) REFERENCES product_variants(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    size VARCHAR(32) NOT NULL,
    color VARCHAR(64) NOT NULL,
    unit_price_mad NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal_mad NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_qty_positive CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- 7. Orders & Order Items
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    order_number VARCHAR(64) UNIQUE NOT NULL,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE SET NULL,
    cart_id VARCHAR(64) REFERENCES carts(id) ON DELETE SET NULL,
    subtotal_mad NUMERIC(10, 2) NOT NULL,
    discount_mad NUMERIC(10, 2) DEFAULT 0.00,
    delivery_fee_mad NUMERIC(10, 2) DEFAULT 0.00,
    total_mad NUMERIC(10, 2) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_address TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'confirmed', -- pending, confirmed, preparing, delivered, cancelled
    payment_method VARCHAR(32) DEFAULT 'cash_on_delivery',
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);

CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
    variant_id VARCHAR(64) REFERENCES product_variants(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    size VARCHAR(32) NOT NULL,
    color VARCHAR(64) NOT NULL,
    unit_price_mad NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_mad NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 8. Delivery Rules & Discount Policy
CREATE TABLE IF NOT EXISTS delivery_rules (
    city VARCHAR(100) PRIMARY KEY,
    fee_mad NUMERIC(10, 2) NOT NULL,
    estimated_days_min INT NOT NULL,
    estimated_days_max INT NOT NULL,
    free_shipping_threshold_mad NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS discount_policy (
    id SERIAL PRIMARY KEY,
    max_discount_percent_global NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    min_order_amount_for_discount_mad NUMERIC(10, 2) NOT NULL DEFAULT 400.00,
    vip_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    floor_price_absolute_enforced BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Follow-ups (BullMQ background jobs & persistence)
CREATE TABLE IF NOT EXISTS followups (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE CASCADE,
    cart_id VARCHAR(64) REFERENCES carts(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) DEFAULT 'scheduled', -- scheduled, executed, cancelled, failed
    attempt_number INT DEFAULT 1,
    max_attempts INT DEFAULT 3,
    message_generated TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_scheduled_at ON followups(scheduled_at);

-- 10. Escalations
CREATE TABLE IF NOT EXISTS escalations (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
    customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    reason VARCHAR(64) NOT NULL,
    reason_description TEXT NOT NULL,
    customer_context TEXT,
    conversation_snippet TEXT,
    cart_snapshot JSONB,
    status VARCHAR(32) DEFAULT 'pending', -- pending, taken_over, resolved
    priority VARCHAR(32) DEFAULT 'medium', -- low, medium, high, urgent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    taken_over_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_priority ON escalations(priority);

-- 11. Agent Runs & Tool Calls (Observability & Execution Trace)
CREATE TABLE IF NOT EXISTS agent_runs (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
    intent_detected VARCHAR(64),
    nodes_executed JSONB DEFAULT '[]'::jsonb,
    execution_trace JSONB DEFAULT '[]'::jsonb,
    duration_ms INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tool_calls (
    id VARCHAR(64) PRIMARY KEY,
    agent_run_id VARCHAR(64) REFERENCES agent_runs(id) ON DELETE CASCADE,
    conversation_id VARCHAR(64),
    tool_name VARCHAR(64) NOT NULL,
    tool_input JSONB,
    tool_output JSONB,
    success BOOLEAN NOT NULL,
    duration_ms INT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tool_calls_tool_name ON tool_calls(tool_name);

-- 12. API Quota & Usage
CREATE TABLE IF NOT EXISTS api_usage (
    id VARCHAR(64) PRIMARY KEY,
    request_id VARCHAR(64) NOT NULL,
    conversation_id VARCHAR(64),
    model VARCHAR(100) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    success BOOLEAN NOT NULL,
    latency_ms INT NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);
