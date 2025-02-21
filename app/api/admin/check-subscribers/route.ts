import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    // Try to get waitlist data directly
    const { data: subscribers, error: subscribersError } = await supabase
      .from('waitlist')
      .select('*');

    // Try to get waitlist_access data
    const { data: accessList, error: accessError } = await supabase
      .from('waitlist_access')
      .select('*');

    // Get table list using RPC (stored procedure)
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    return new Response(
      JSON.stringify({
        tables,
        tablesError,
        subscribers,
        subscribersError,
        accessList,
        accessError,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        // Include raw error messages for debugging
        errors: {
          subscribers: subscribersError?.message,
          access: accessError?.message,
          tables: tablesError?.message
        }
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