-- SQL Function för att hämta pipeline stats
-- Lägg till i ai_sdr_tables.sql eller kör separat

CREATE OR REPLACE FUNCTION get_lead_pipeline_stats()
RETURNS TABLE (
  status TEXT,
  count BIGINT,
  avg_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.status,
    COUNT(*)::BIGINT as count,
    ROUND(AVG(l.lead_score), 1) as avg_score
  FROM leads l
  GROUP BY l.status
  ORDER BY 
    CASE l.status
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
END;
$$ LANGUAGE plpgsql;

-- Grant execute till authenticated users
GRANT EXECUTE ON FUNCTION get_lead_pipeline_stats() TO authenticated;
