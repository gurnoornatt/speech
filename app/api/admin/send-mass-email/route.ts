import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple API key validation
const validateApiKey = (apiKey: string) => {
  return apiKey === process.env.ADMIN_API_KEY;
};

export async function POST(request: Request) {
  try {
    const { subject, html, apiKey } = await request.json();

    // Validate admin API key
    if (!validateApiKey(apiKey)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all waitlist emails
    const { data: subscribers, error: fetchError } = await supabase
      .from('waitlist')
      .select('email')
      .order('signed_up_at', { ascending: true });

    if (fetchError) throw fetchError;

    // Send emails in batches of 50
    const batchSize = 50;
    const emails = subscribers.map(s => s.email);
    const batches = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      batches.push(emails.slice(i, i + batchSize));
    }

    // Process each batch
    for (const batch of batches) {
      await Promise.all(
        batch.map(email =>
          resend.emails.send({
            from: 'Vocal <hello@vocalwaitlist.com>',
            to: email,
            subject,
            html,
          })
        )
      );
      
      // Wait 1 second between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emails.length 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Mass email error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send mass email' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 