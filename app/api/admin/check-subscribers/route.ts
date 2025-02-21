import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    // First check if the waitlist table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'waitlist')
      .single();

    if (tableCheckError) {
      return new Response(
        JSON.stringify({
          error: 'Error checking table existence',
          details: tableCheckError,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get all public tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    // Try to get waitlist data with error details
    const { data: subscribers, error: subscribersError } = await supabase
      .from('waitlist')
      .select('*');

    // Try to get waitlist_access data
    const { data: accessList, error: accessError } = await supabase
      .from('waitlist_access')
      .select('*');

    return new Response(
      JSON.stringify({
        tableExists,
        tables,
        tablesError,
        subscribers,
        subscribersError,
        accessList,
        accessError,
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
      JSON.stringify({ 
        error: 'Failed to check database',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 