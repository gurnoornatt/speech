import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    }

    // Get waitlist data
    const { data: subscribers, error: subscribersError } = await supabase
      .from('waitlist')
      .select('*');

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError);
    }

    return new Response(
      JSON.stringify({
        tables,
        subscribers,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check database' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 