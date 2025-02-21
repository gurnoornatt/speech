import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

if (!process.env.NEXT_PUBLIC_ADMIN_KEY) {
  throw new Error('NEXT_PUBLIC_ADMIN_KEY is not defined in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple API key validation
const validateApiKey = (apiKey: string) => {
  return apiKey === process.env.NEXT_PUBLIC_ADMIN_KEY;
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

    console.log('Fetching subscribers from Supabase...');
    
    // Get all waitlist emails
    const { data: subscribers, error: fetchError } = await supabase
      .from('waitlist')
      .select('email, signed_up_at')
      .order('signed_up_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching subscribers:', fetchError);
      throw fetchError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No subscribers found in the database');
      return new Response(
        JSON.stringify({ 
          error: 'No subscribers found in the database',
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          queryResult: subscribers 
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${subscribers.length} subscribers`);

    // Send emails in batches of 50
    const batchSize = 50;
    const emails = subscribers.map(s => s.email);
    const batches = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      batches.push(emails.slice(i, i + batchSize));
    }

    console.log(`Sending emails in ${batches.length} batches`);

    // Process each batch
    let successfulSends = 0;
    for (const batch of batches) {
      try {
        await Promise.all(
          batch.map(async (email) => {
            try {
              await resend.emails.send({
                from: 'Vocal <hello@vocalwaitlist.com>',
                to: email,
                subject,
                html,
              });
              successfulSends++;
            } catch (emailError) {
              console.error(`Failed to send email to ${email}:`, emailError);
            }
          })
        );
        
        // Wait 1 second between batches to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (batchError) {
        console.error('Error processing batch:', batchError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: successfulSends,
        totalSubscribers: subscribers.length,
        subscriberEmails: emails // Include this temporarily for debugging
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Mass email error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send mass email',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 