-- ============================================
-- AI SDR MODULE - DATABASE TABLES
-- För EryAI Lead Management & Outreach
-- ============================================

-- 1. LEADS TABLE
-- Potentiella kunder vi vill nå ut till
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company info
  company_name TEXT NOT NULL,
  industry TEXT CHECK (industry IN ('restaurant', 'auto_repair', 'retail', 'healthcare', 'other')),
  website TEXT,
  phone TEXT,
  email TEXT,
  
  -- Contact person
  contact_person TEXT,
  contact_title TEXT, -- 'Ägare', 'VD', 'Restaurangchef'
  
  -- Location
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Sweden',
  
  -- Enrichment data
  employee_count INTEGER,
  revenue_estimate TEXT,
  social_media JSONB, -- {linkedin, facebook, instagram}
  notes TEXT,
  
  -- Lead scoring & status
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new',           -- Nytt lead, ej kontaktat
    'contacted',     -- Email skickat
    'opened',        -- Email öppnat
    'replied',       -- Svar mottaget
    'interested',    -- Visat intresse
    'demo_booked',   -- Demo är bokad
    'customer',      -- Blivit kund
    'not_interested',-- Ej intresserad
    'invalid'        -- Fel email/stängd verksamhet
  )),
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  
  -- Metadata
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'csv_import', 'apollo', 'hunter', 'web_scraping')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  
  -- Full-text search index
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('swedish', coalesce(company_name, '') || ' ' || coalesce(city, '') || ' ' || coalesce(industry, ''))
  ) STORED
);

-- Index för snabbare sökning
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_industry ON leads(industry);
CREATE INDEX idx_leads_city ON leads(city);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_search ON leads USING GIN(search_vector);

-- Trigger för updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- ============================================
-- 2. OUTREACH CAMPAIGNS
-- Email-kampanjer med templates
-- ============================================

CREATE TABLE outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Targeting
  target_industries TEXT[], -- ['restaurant', 'auto_repair']
  target_cities TEXT[],
  min_lead_score INTEGER DEFAULT 0,
  
  -- Email templates
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL, -- Stöder {{company_name}}, {{contact_person}}, {{city}}, {{industry}}
  
  -- Settings
  daily_send_limit INTEGER DEFAULT 50 CHECK (daily_send_limit > 0 AND daily_send_limit <= 200),
  follow_up_days INTEGER DEFAULT 3, -- Skicka follow-up efter X dagar
  follow_up_subject TEXT,
  follow_up_body TEXT,
  
  enabled BOOLEAN DEFAULT true,
  
  -- Stats
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_enabled ON outreach_campaigns(enabled) WHERE enabled = true;

-- ============================================
-- 3. OUTREACH MESSAGES
-- Alla skickade emails
-- ============================================

CREATE TABLE outreach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE SET NULL,
  
  -- Email content
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  personalization JSONB, -- Vilka variabler som användes
  
  -- Message type
  message_type TEXT DEFAULT 'initial' CHECK (message_type IN ('initial', 'follow_up', 'manual')),
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- I kö för sending
    'sent',       -- Skickat
    'delivered',  -- Levererat (från Resend)
    'opened',     -- Öppnat
    'clicked',    -- Klickat på länk
    'replied',    -- Svarat
    'bounced',    -- Email bounce
    'failed'      -- Misslyckades
  )),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  
  -- Tracking
  email_provider_id TEXT, -- ID från Resend/SendGrid
  error_message TEXT,
  
  -- Metrics
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0
);

CREATE INDEX idx_messages_lead ON outreach_messages(lead_id);
CREATE INDEX idx_messages_campaign ON outreach_messages(campaign_id);
CREATE INDEX idx_messages_status ON outreach_messages(status);
CREATE INDEX idx_messages_sent_at ON outreach_messages(sent_at DESC);

-- ============================================
-- 4. LEAD INTERACTIONS
-- Logg över alla händelser med ett lead
-- ============================================

CREATE TABLE lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Interaction type
  type TEXT NOT NULL CHECK (type IN (
    'email_sent',
    'email_opened',
    'email_clicked',
    'email_replied',
    'email_bounced',
    'call_made',
    'demo_booked',
    'demo_completed',
    'contract_signed',
    'note_added',
    'status_changed'
  )),
  
  content TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_interactions_lead ON lead_interactions(lead_id, created_at DESC);
CREATE INDEX idx_interactions_type ON lead_interactions(type);

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

-- Superadmin kan se allt
CREATE POLICY "Superadmin full access to leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'eric@eryai.tech'
    )
  );

CREATE POLICY "Superadmin full access to campaigns"
  ON outreach_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'eric@eryai.tech'
    )
  );

CREATE POLICY "Superadmin full access to messages"
  ON outreach_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'eric@eryai.tech'
    )
  );

CREATE POLICY "Superadmin full access to interactions"
  ON lead_interactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'eric@eryai.tech'
    )
  );

-- ============================================
-- 6. HELPFUL VIEWS
-- ============================================

-- View för lead pipeline overview
CREATE OR REPLACE VIEW lead_pipeline AS
SELECT 
  status,
  COUNT(*) as count,
  ROUND(AVG(lead_score), 1) as avg_score
FROM leads
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'customer' THEN 1
    WHEN 'demo_booked' THEN 2
    WHEN 'interested' THEN 3
    WHEN 'replied' THEN 4
    WHEN 'opened' THEN 5
    WHEN 'contacted' THEN 6
    WHEN 'new' THEN 7
    WHEN 'not_interested' THEN 8
    WHEN 'invalid' THEN 9
  END;

-- View för campaign performance
CREATE OR REPLACE VIEW campaign_performance AS
SELECT 
  c.id,
  c.name,
  c.enabled,
  c.total_sent,
  c.total_opened,
  c.total_replied,
  CASE 
    WHEN c.total_sent > 0 THEN ROUND((c.total_opened::NUMERIC / c.total_sent * 100), 1)
    ELSE 0
  END as open_rate,
  CASE 
    WHEN c.total_sent > 0 THEN ROUND((c.total_replied::NUMERIC / c.total_sent * 100), 1)
    ELSE 0
  END as reply_rate,
  c.created_at
FROM outreach_campaigns c
ORDER BY c.created_at DESC;

-- ============================================
-- 7. SAMPLE DATA (Optional - för test)
-- ============================================

-- Skapa en test-kampanj
INSERT INTO outreach_campaigns (
  name,
  description,
  target_industries,
  subject_template,
  body_template,
  created_by
) VALUES (
  'Restaurant Outreach Q1 2026',
  'Initial outreach till restauranger i Sverige',
  ARRAY['restaurant'],
  'AI-assistent för {{company_name}} - Missa aldrig ett kundsamtal igen',
  E'Hej {{contact_person}},

Jag heter Eric och jobbar med EryAI - en AI-driven kundtjänstlösning som hjälper restauranger att hantera kundsamtal 24/7.

Jag märkte att {{company_name}} i {{city}} verkar vara en populär restaurang. Många restauranger vi pratar med säger att de missar många bokningar och frågor när de är upptagna med gäster.

EryAI:s AI-chattbot kan svara på vanliga frågor, ta emot bokningar och hjälpa kunder direkt på er hemsida - även när ni är stängda.

Vill du se en 2-minuters demo? Besök gärna: bella-italia.eryai.tech

Vänliga hälsningar,
Eric
EryAI',
  (SELECT id FROM auth.users WHERE email = 'eric@eryai.tech' LIMIT 1)
);

-- Lägg till några test-leads (kan tas bort i produktion)
INSERT INTO leads (company_name, industry, city, status, lead_score, source) VALUES
  ('Ristorante Italiano', 'restaurant', 'Stockholm', 'new', 75, 'manual'),
  ('Sushi House', 'restaurant', 'Göteborg', 'new', 60, 'manual'),
  ('Bella Pizza', 'restaurant', 'Malmö', 'new', 80, 'manual');

-- ============================================
-- INSTALLATION COMPLETE!
-- ============================================

-- Nästa steg:
-- 1. Kör denna SQL i Supabase SQL Editor
-- 2. Verifiera att tabellerna skapades: SELECT * FROM leads;
-- 3. Bygg Lead Dashboard i Next.js
-- 4. Integrera Resend.com för email-sending
