// app/api/leads/[id]/route.js
// API för att hämta, uppdatera och ta bort ett specifikt lead

import { createServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const supabase = createServerClient();
    const { id } = params;
    
    // Hämta lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();
    
    if (leadError) {
      if (leadError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      console.error('Error fetching lead:', leadError);
      return NextResponse.json({ error: leadError.message }, { status: 500 });
    }
    
    // Hämta messages för detta lead
    const { data: messages, error: messagesError } = await supabase
      .from('outreach_messages')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }
    
    // Hämta interactions
    const { data: interactions, error: interactionsError } = await supabase
      .from('lead_interactions')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });
    
    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError);
    }
    
    return NextResponse.json({
      lead,
      messages: messages || [],
      interactions: interactions || []
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const supabase = createServerClient();
    const { id } = params;
    const body = await request.json();
    
    // Hämta current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Tillåtna fält att uppdatera
    const allowedFields = [
      'company_name',
      'industry',
      'website',
      'phone',
      'email',
      'contact_person',
      'contact_title',
      'address',
      'city',
      'postal_code',
      'country',
      'employee_count',
      'revenue_estimate',
      'social_media',
      'notes',
      'status',
      'lead_score'
    ];
    
    // Filtrera bort otillåtna fält
    const updates = {};
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = body[key];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Uppdatera lead
    const { data: lead, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      console.error('Error updating lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Logga status-ändring om status uppdaterades
    if (updates.status) {
      await supabase
        .from('lead_interactions')
        .insert({
          lead_id: id,
          type: 'status_changed',
          content: `Status changed to: ${updates.status}`,
          metadata: { new_status: updates.status },
          created_by: user?.id
        });
    }
    
    return NextResponse.json({ lead });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = createServerClient();
    const { id } = params;
    
    // Ta bort lead (CASCADE tar bort relaterade messages och interactions)
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
