-- Migration: Add missing columns for production database
-- Run this against the production Cloud SQL database

-- Add missing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tier VARCHAR;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS force_stop_reason VARCHAR;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS internal_tags JSONb DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;

-- Create stripe_products table
CREATE TABLE IF NOT EXISTS stripe_products (
    id VARCHAR PRIMARY KEY,
    stripe_product_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    factor REAL NOT NULL,
    quality_label VARCHAR,
    features JSONb,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing user columns if needed
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_economy FLOAT DEFAULT 0.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_professional FLOAT DEFAULT 0.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_expert FLOAT DEFAULT 0.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gamification_xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gamification_level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gamification_total_spent FLOAT DEFAULT 0.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gamification_permanent_discount INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gamification_claimed_levels JSONb DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_last_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_best INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_bonus TIMESTAMP;

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS ix_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS ix_projects_tier ON projects(tier);
