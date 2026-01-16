// app/api/leads/route.js
// API för att lista och skapa leads

import { createServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Query params för filtrering
    const status = searchParams.get('status');
    const industry = searchParams.get('industry');
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Bygg query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Applicera filter
    if (status) {
      query = query.eq('status', status);
    }
    
    if (industry) {
      query = query.eq('industry', industry);
    }
    
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    const { data: leads, error, count } = await query;
    
    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      leads,
      total: count,
      limit,
      offset
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    
    // Validera required fields
    if (!body.company_name) {
      return NextResponse.json(
        { error: 'company_name is required' },
        { status: 400 }
      );
    }
    
    // Skapa lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        company_name: body.company_name,
        industry: body.industry || null,
        website: body.website || null,
        phone: body.phone || null,
        email: body.email || null,
        contact_person: body.contact_person || null,
        contact_title: body.contact_title || null,
        address: body.address || null,
        city: body.city || null,
        postal_code: body.postal_code || null,
        country: body.country || 'Sweden',
        employee_count: body.employee_count || null,
        revenue_estimate: body.revenue_estimate || null,
        social_media: body.social_media || null,
        notes: body.notes || null,
        lead_score: body.lead_score || 0,
        source: body.source || 'manual'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Logga interaktion
    await supabase
      .from('lead_interactions')
      .insert({
        lead_id: lead.id,
        type: 'note_added',
        content: `Lead created: ${lead.company_name}`,
        metadata: { source: lead.source }
      });
    
    return NextResponse.json({ lead }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
