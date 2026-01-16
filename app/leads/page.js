// app/leads/page.js
// Server Component - Lead Dashboard

import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import LeadDashboardClient from './LeadDashboardClient';

export const metadata = {
  title: 'Leads - EryAI Dashboard',
  description: 'Hantera dina leads och outreach-kampanjer'
};

export default async function LeadsPage() {
  const supabase = createServerClient();
  
  // Verifiera auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }
  
  // Kolla om superadmin
  const isSuperadmin = user.email === process.env.SUPERADMIN_EMAIL;
  
  // Hämta initial leads (första 50)
  const { data: leads, error: leadsError, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (leadsError) {
    console.error('Error fetching leads:', leadsError);
  }
  
  // Hämta pipeline stats
  const { data: pipelineStats, error: statsError } = await supabase
    .rpc('get_lead_pipeline_stats');
  
  if (statsError) {
    console.error('Error fetching pipeline stats:', statsError);
  }
  
  // Hämta aktiva kampanjer
  const { data: campaigns, error: campaignsError } = await supabase
    .from('outreach_campaigns')
    .select('id, name, enabled, total_sent, total_opened, total_replied')
    .eq('enabled', true)
    .order('created_at', { ascending: false });
  
  if (campaignsError) {
    console.error('Error fetching campaigns:', campaignsError);
  }
  
  return (
    <LeadDashboardClient
      initialLeads={leads || []}
      totalLeads={count || 0}
      pipelineStats={pipelineStats || []}
      campaigns={campaigns || []}
      isSuperadmin={isSuperadmin}
      userEmail={user.email}
    />
  );
}
