'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function LeadDashboardClient({ 
  initialLeads, 
  totalLeads,
  pipelineStats,
  campaigns,
  isSuperadmin,
  userEmail 
}) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    industry: '',
    search: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Status colors
  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    opened: 'bg-purple-100 text-purple-800',
    replied: 'bg-green-100 text-green-800',
    interested: 'bg-teal-100 text-teal-800',
    demo_booked: 'bg-indigo-100 text-indigo-800',
    customer: 'bg-green-200 text-green-900',
    not_interested: 'bg-gray-100 text-gray-800',
    invalid: 'bg-red-100 text-red-800'
  };
  
  // Industry labels
  const industryLabels = {
    restaurant: 'Restaurang',
    auto_repair: 'Bilverkstad',
    retail: 'Retail',
    healthcare: 'Vård',
    other: 'Övrigt'
  };
  
  // Status labels
  const statusLabels = {
    new: 'Nytt',
    contacted: 'Kontaktat',
    opened: 'Öppnat',
    replied: 'Svarat',
    interested: 'Intresserad',
    demo_booked: 'Demo bokad',
    customer: 'Kund',
    not_interested: 'Ej intresserad',
    invalid: 'Ogiltigt'
  };
  
  // Ladda leads med filter
  const fetchLeads = async () => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.search) params.append('search', filters.search);
    
    const response = await fetch(`/api/leads?${params.toString()}`);
    const data = await response.json();
    
    if (data.leads) {
      setLeads(data.leads);
    }
    
    setLoading(false);
  };
  
  // Uppdatera lead status
  const updateLeadStatus = async (leadId, newStatus) => {
    const response = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (response.ok) {
      // Uppdatera lokalt state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
    }
  };
  
  // Räkna stats från pipelineStats
  const getStatValue = (status) => {
    const stat = pipelineStats.find(s => s.status === status);
    return stat ? stat.count : 0;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              <p className="text-sm text-gray-600 mt-1">
                Inloggad som: {userEmail}
                {isSuperadmin && <span className="ml-2 text-indigo-600 font-medium">(Superadmin)</span>}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                + Lägg till Lead
              </button>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Logga ut
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Totalt Leads</p>
            <p className="text-3xl font-bold text-gray-900">{totalLeads}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Kontaktade</p>
            <p className="text-3xl font-bold text-yellow-600">
              {getStatValue('contacted') + getStatValue('opened')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Svar mottaget</p>
            <p className="text-3xl font-bold text-green-600">
              {getStatValue('replied') + getStatValue('interested')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Kunder</p>
            <p className="text-3xl font-bold text-indigo-600">
              {getStatValue('customer')}
            </p>
          </div>
        </div>
        
        {/* Campaigns */}
        {campaigns.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Aktiva Kampanjer</h2>
            <div className="space-y-3">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-600">
                      {campaign.total_sent} skickade • {campaign.total_opened} öppnade • {campaign.total_replied} svar
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Open rate</p>
                    <p className="text-lg font-bold text-gray-900">
                      {campaign.total_sent > 0 
                        ? Math.round((campaign.total_opened / campaign.total_sent) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sök
              </label>
              <input
                type="text"
                placeholder="Företagsnamn, email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Alla</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bransch
              </label>
              <select
                value={filters.industry}
                onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Alla</option>
                {Object.entries(industryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Laddar...' : 'Filtrera'}
            </button>
          </div>
        </div>
        
        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Företag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bransch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.company_name}</p>
                      {lead.email && (
                        <p className="text-sm text-gray-500">{lead.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {industryLabels[lead.industry] || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.city || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.contact_person ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{lead.contact_person}</p>
                        <p className="text-sm text-gray-500">{lead.phone || '-'}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[lead.status]}`}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600"
                          style={{ width: `${lead.lead_score}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{lead.lead_score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Visa →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {leads.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Inga leads hittades</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Lead Modal - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Lägg till Lead</h2>
            <p className="text-gray-600 mb-6">Formulär kommer snart...</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Stäng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
